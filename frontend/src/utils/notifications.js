import { supabase } from '../api/supabase';
import { parseTaskDueBogota } from './bogotaTime';

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const REMINDER_OFFSETS_MS = [
  { type: '48h', ms: 48 * 3600 * 1000 },
  { type: '24h', ms: 24 * 3600 * 1000 },
  { type: '2h', ms: 2 * 3600 * 1000 },
];

/**
 * Calcula los triggers (48h, 24h, 2h o inmediato si falta < 2h) en America/Bogota.
 */
export function computeReminderTriggers(dueDate, dueTime = null, now = new Date()) {
  const dueDt = parseTaskDueBogota(dueDate, dueTime);
  if (!dueDt || Number.isNaN(dueDt.getTime())) return [];

  const remainingMs = dueDt.getTime() - now.getTime();
  if (remainingMs <= 0) return [];

  const triggers = [];
  for (const offset of REMINDER_OFFSETS_MS) {
    const triggerMs = dueDt.getTime() - offset.ms;
    if (triggerMs > now.getTime()) {
      triggers.push({
        reminder_type: offset.type,
        trigger_at: new Date(triggerMs).toISOString(),
        is_immediate: false,
      });
    }
  }

  if (remainingMs < 2 * 3600 * 1000) {
    triggers.push({
      reminder_type: 'immediate',
      trigger_at: now.toISOString(),
      is_immediate: true,
    });
  }

  return triggers;
}

/**
 * Programa o recalcula recordatorios de vencimiento para una tarea.
 * Intenta primero vía backend FastAPI y hace fallback directo a Supabase.
 */
export async function scheduleTaskReminders({
  taskId,
  assignedTo,
  dueDate,
  dueTime = null,
  title = 'Tarea',
  status = 'pending',
}) {
  if (!taskId || !assignedTo || !dueDate) return;

  try {
    if (apiUrl) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`${apiUrl}/api/v1/reminders/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            task_id: taskId,
            assigned_to: assignedTo,
            due_date: dueDate,
            due_time: dueTime,
            title,
            status,
          }),
        });
        if (res.ok) return await res.json();
      }
    }
  } catch (err) {
    console.warn('Backend reminders API no disponible, usando Supabase directo:', err);
  }

  // Fallback directo en Supabase
  try {
    const nowIso = new Date().toISOString();
    await supabase
      .from('task_reminders')
      .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
      .eq('task_id', taskId)
      .eq('status', 'pending');

    if (status === 'completed' || status === 'cancelled') return;

    const triggers = computeReminderTriggers(dueDate, dueTime);
    for (const trig of triggers) {
      await supabase.from('task_reminders').upsert(
        {
          task_id: taskId,
          profile_id: assignedTo,
          reminder_type: trig.reminder_type,
          trigger_at: trig.trigger_at,
          status: trig.is_immediate ? 'sent' : 'pending',
          sent_at: trig.is_immediate ? nowIso : null,
          cancelled_at: null,
          updated_at: nowIso,
        },
        { onConflict: 'task_id,reminder_type' }
      );

      if (trig.is_immediate) {
        await supabase.from('notifications').insert({
          profile_id: assignedTo,
          type: 'due_reminder',
          message: `Recordatorio urgente: La tarea "${title}" vence en menos de 2 horas (${dueDate}).`,
          action_url: '/workspace',
          is_read: false,
        });
      }
    }
  } catch (err) {
    console.warn('Error programando recordatorios en Supabase:', err);
  }
}

/**
 * Cancela todos los recordatorios pendientes de una tarea completada/cancelada.
 */
export async function cancelTaskReminders(taskId) {
  if (!taskId) return;
  try {
    const nowIso = new Date().toISOString();
    await supabase
      .from('task_reminders')
      .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
      .eq('task_id', taskId)
      .eq('status', 'pending');
  } catch (err) {
    console.warn('Error cancelando recordatorios:', err);
  }
}

/**
 * Dispara notificaciones de cambio de cargo al colaborador afectado y a RRHH/Master Admin
 * cuando la actualización se hace directamente en Supabase sin pasar por FastAPI.
 */
export async function notifyRoleChangeFallback({
  affectedProfileId,
  employeeName,
  changedFields,
  summary,
  roleId = null,
}) {
  if (!affectedProfileId || !changedFields || Object.keys(changedFields).length === 0) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const changedBy = session?.user?.id || null;

    try {
      await supabase.from('role_change_audit_logs').insert({
        profile_id: affectedProfileId,
        role_id: roleId,
        changed_by: changedBy,
        changed_fields: changedFields,
        summary,
      });
    } catch (_) {}

    const recipients = new Map();
    recipients.set(affectedProfileId, {
      profile_id: affectedProfileId,
      type: 'role_updated',
      message: `Actualización en tu cargo/perfil: ${summary}`,
      action_url: '/workspace',
      is_read: false,
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, is_master_admin, roles(name)');

    for (const p of (profiles || [])) {
      const rName = (p.roles?.name || '').toLowerCase();
      const isHr =
        p.is_master_admin ||
        rName.includes('rrhh') ||
        rName.includes('recursos humanos') ||
        rName.includes('gestión humana') ||
        rName.includes('gestion humana') ||
        rName.includes('talento humano');

      if (isHr && !recipients.has(p.id)) {
        recipients.set(p.id, {
          profile_id: p.id,
          type: 'role_updated',
          message: `Cambio de cargo registrado para ${employeeName}: ${summary}`,
          action_url: '/rrhh',
          is_read: false,
        });
      }
    }

    const rows = Array.from(recipients.values());
    if (rows.length > 0) {
      await supabase.from('notifications').insert(rows);
    }
  } catch (err) {
    console.warn('Error enviando notificación de cambio de cargo:', err);
  }
}


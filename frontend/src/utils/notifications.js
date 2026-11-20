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

/**
 * Resuelve candidatos a jefe inmediato para un colaborador:
 * Prioridad 1: Líder de su misma área (access_level < propio o nivel 1/2 en la misma área).
 * Prioridad 2: Dirección / Gerencia (access_level === 1) o Master Admin.
 */
export async function findImmediateSupervisors(currentProfile, currentRole) {
  if (!currentProfile?.id) return [];
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_master_admin, role_id, roles(id, name, area_id, access_level)');

    if (error || !profiles) return [];

    const myId = currentProfile.id;
    const myAreaId = currentRole?.area_id || currentProfile?.roles?.area_id || null;
    const myAccess = currentRole?.access_level ?? currentProfile?.roles?.access_level ?? 3;

    const areaLeaders = [];
    const executives = [];

    for (const p of profiles) {
      if (!p?.id || p.id === myId) continue;
      const r = p.roles || {};
      const rAccess = r.access_level;
      const isAreaLeader =
        myAreaId &&
        r.area_id === myAreaId &&
        (rAccess === 1 || rAccess === 2) &&
        rAccess < myAccess;

      if (isAreaLeader) {
        areaLeaders.push({
          id: p.id,
          full_name: p.full_name || 'Líder de Área',
          email: p.email || '',
          roleName: r.name || 'Líder de Área',
          accessLevel: rAccess,
          relationLabel: 'Jefe Directo de Área',
        });
      } else if (rAccess === 1 || p.is_master_admin) {
        executives.push({
          id: p.id,
          full_name: p.full_name || 'Dirección / Gerencia',
          email: p.email || '',
          roleName: r.name || (p.is_master_admin ? 'Master Admin' : 'Gerencia'),
          accessLevel: rAccess ?? 1,
          relationLabel: 'Dirección / Gerencia',
        });
      }
    }

    areaLeaders.sort((a, b) => (a.accessLevel === 2 ? -1 : b.accessLevel === 2 ? 1 : 0));
    executives.sort((a, b) => (a.accessLevel ?? 1) - (b.accessLevel ?? 1));
    return [...areaLeaders, ...executives];
  } catch (err) {
    console.warn('Error resolviendo jefes inmediatos:', err);
    return [];
  }
}

/**
 * Envía el reporte formal de cumplimiento diario al jefe inmediato:
 * 1. Backend FastAPI (/api/v1/reports/send-to-supervisor) si está disponible.
 * 2. Fallback RPC SECURITY DEFINER en Supabase (notify_supervisor_report).
 * 3. Fallback insert directo en notifications.
 */
export async function sendReportToSupervisor({
  supervisorId,
  supervisorName = 'Jefe Inmediato',
  supervisorEmail = '',
  employeeId,
  employeeName = 'Colaborador',
  roleName = 'Cargo Operativo',
  dateStr,
  compliancePercentage = 100,
  completedTasks = 0,
  totalTasks = 0,
  unfulfilledTasks = 0,
  exportFormat = 'excel',
  notes = '',
}) {
  if (!supervisorId) {
    return { ok: false, error: 'Selecciona un supervisor destinatario.' };
  }

  const cleanNotes = String(notes || '').trim();
  const fmtUpper = String(exportFormat || 'pdf').toUpperCase();
  const unfulfilledPart = unfulfilledTasks > 0 ? `, ${unfulfilledTasks} no ejecutadas` : '';
  const summaryMessage = `Reporte operativo de ${employeeName} (${roleName}) · Jornada ${dateStr}: ${compliancePercentage}% cumplimiento (${completedTasks}/${totalTasks} completadas${unfulfilledPart}). Formato: ${fmtUpper}.${cleanNotes ? ` Obs: ${cleanNotes}` : ''}`;

  // 1. Intentar Backend FastAPI
  try {
    if (apiUrl) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`${apiUrl}/api/v1/reports/send-to-supervisor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            supervisor_id: supervisorId,
            employee_id: employeeId,
            date_str: dateStr,
            compliance_percentage: Number(compliancePercentage),
            completed_tasks: Number(completedTasks),
            total_tasks: Number(totalTasks),
            unfulfilled_tasks: Number(unfulfilledTasks),
            export_format: exportFormat,
            notes: cleanNotes || null,
          }),
        });
        if (res.ok) {
          return {
            ok: true,
            channel: 'api',
            message: `Reporte notificado a ${supervisorName} correctamente.`,
            supervisorEmail,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Backend send-to-supervisor no disponible, usando fallback Supabase:', err);
  }

  // 2. Fallback RPC SECURITY DEFINER en Supabase
  try {
    if (typeof supabase.rpc === 'function') {
      const { data: rpcData, error: rpcError } = await supabase.rpc('notify_supervisor_report', {
        p_supervisor_id: supervisorId,
        p_employee_name: employeeName,
        p_role_name: roleName,
        p_date_str: dateStr,
        p_compliance: Number(compliancePercentage),
        p_completed: Number(completedTasks),
        p_total: Number(totalTasks),
        p_unfulfilled: Number(unfulfilledTasks),
        p_export_format: exportFormat,
        p_notes: cleanNotes || null,
      });
      if (!rpcError && rpcData?.ok !== false) {
        return {
          ok: true,
          channel: 'rpc',
          message: `Reporte enviado a ${supervisorName} en su bandeja Nova Work.`,
          supervisorEmail,
        };
      }
    }
  } catch (rpcErr) {
    console.warn('RPC notify_supervisor_report fallback al insert directo:', rpcErr);
  }

  // 3. Fallback insert directo en notifications
  try {
    const actionUrl = employeeId ? `/workspace?view_as=${employeeId}` : '/workspace';
    const { error } = await supabase.from('notifications').insert({
      profile_id: supervisorId,
      type: 'message',
      message: summaryMessage,
      action_url: actionUrl,
      is_read: false,
    });
    if (!error) {
      return {
        ok: true,
        channel: 'supabase_insert',
        message: `Notificación enviada a ${supervisorName}.`,
        supervisorEmail,
      };
    }
    return {
      ok: false,
      channel: 'none',
      error: error.message || 'No fue posible registrar la notificación.',
      supervisorEmail,
      summaryMessage,
    };
  } catch (err) {
    return {
      ok: false,
      channel: 'none',
      error: err?.message || 'Error enviando reporte.',
      supervisorEmail,
      summaryMessage,
    };
  }
}


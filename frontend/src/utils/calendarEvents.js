import { getBogotaDateStr, isTaskOverdueBogota } from './bogotaTime';

/**
 * Calcula la clave de período para entregas programadas en una fecha YYYY-MM-DD.
 */
export function getScheduledPeriodKeyForDate(sd, dateStr) {
  if (sd.recurrence_type === 'monthly_day') {
    return dateStr.slice(0, 7); // YYYY-MM
  }
  if (sd.recurrence_type === 'weekly_day') {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const jan1 = new Date(y, 0, 1);
    const week = Math.ceil(((dt - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, '0')}`;
  }
  return sd.due_date || dateStr;
}

/**
 * Determina si una entrega programada aplica a un perfil específico.
 */
export function doesDeliveryMatchProfile(sd, profile) {
  if (!sd || !profile) return false;
  if (sd.target_type === 'all') return true;
  if (sd.target_type === 'profile') {
    return Array.isArray(sd.target_profile_ids) && sd.target_profile_ids.includes(profile.id);
  }
  if (sd.target_type === 'role') {
    return profile.role_id && Array.isArray(sd.target_role_ids) && sd.target_role_ids.includes(profile.role_id);
  }
  if (sd.target_type === 'level') {
    return profile.roles?.access_level === sd.target_level;
  }
  if (sd.target_type === 'area') {
    return profile.roles?.area_id === sd.target_area_id;
  }
  return false;
}

/**
 * Genera lista de strings YYYY-MM-DD entre startStr y endStr inclusive.
 */
export function enumerateDateStrings(startStr, endStr) {
  const result = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const end = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));

  while (cur.getTime() <= end.getTime()) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    result.push(`${y}-${m}-${d}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return result;
}

/**
 * Normaliza y consolida tareas + entregas programadas en eventos de calendario
 * aplicando reglas de permisos por rol.
 */
export function buildConsolidatedCalendarEvents({
  tasks = [],
  scheduledDeliveries = [],
  deliveryCompletions = [],
  profilesMap = new Map(),
  currentProfile = null,
  rangeStartStr,
  rangeEndStr,
  now = new Date(),
}) {
  const events = [];
  const todayStr = getBogotaDateStr(now);

  const isMaster = Boolean(currentProfile?.is_master_admin);
  const accessLevel = currentProfile?.roles?.access_level ?? 3;
  const isExecLeader = !isMaster && accessLevel === 1;
  const isAreaLeader = !isMaster && accessLevel === 2;
  const leaderAreaId = currentProfile?.roles?.area_id || null;

  const canSeeProfile = (profileId) => {
    if (isMaster || isExecLeader) return true;
    if (isAreaLeader) {
      if (profileId === currentProfile?.id) return true;
      const p = profilesMap.get(profileId);
      return Boolean(p && p.roles?.area_id && p.roles.area_id === leaderAreaId);
    }
    return profileId === currentProfile?.id;
  };

  // 1. Tareas puntuales (tabla `tasks`)
  for (const t of tasks) {
    if (!t.due_date) continue;
    const dateStr = String(t.due_date).slice(0, 10);
    if (dateStr < rangeStartStr || dateStr > rangeEndStr) continue;
    if (t.assigned_to && !canSeeProfile(t.assigned_to)) continue;
    if (!t.assigned_to && !isMaster && !isExecLeader) continue;

    const assignee = t.assigned_to ? profilesMap.get(t.assigned_to) : null;
    const overdue = isTaskOverdueBogota(t, now);
    const derivedStatus = overdue ? 'overdue' : (t.status || 'pending');

    events.push({
      id: `task-${t.id}`,
      rawId: t.id,
      sourceType: 'task',
      title: t.title,
      description: t.description || '',
      date: dateStr,
      time: t.due_time ? String(t.due_time).slice(0, 5) : null,
      status: derivedStatus,
      priority: t.priority || 'medium',
      responsibleId: t.assigned_to || null,
      responsibleName: assignee?.full_name || 'Sin asignar',
      areaId: assignee?.roles?.area_id || null,
      areaName: assignee?.roles?.areas?.name || 'General',
    });
  }

  // 2. Entregas programadas (tabla `scheduled_deliveries`)
  const compSet = new Set(
    (deliveryCompletions || []).map((c) => `${c.delivery_id}::${c.profile_id}::${c.period_key}`)
  );
  const datesInRange = enumerateDateStrings(rangeStartStr, rangeEndStr);
  const allProfiles = Array.from(profilesMap.values());

  for (const sd of scheduledDeliveries) {
    if (sd.active === false) continue;

    // Determinar perfiles visibles que aplican a esta entrega
    const matchingProfiles = allProfiles.filter(
      (p) => canSeeProfile(p.id) && doesDeliveryMatchProfile(sd, p)
    );

    if (matchingProfiles.length === 0) continue;

    for (const dateStr of datesInRange) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const dow = dt.getUTCDay();

      let triggersOnDate = false;
      if (sd.recurrence_type === 'once') {
        triggersOnDate = sd.due_date === dateStr;
      } else if (sd.recurrence_type === 'weekly_day') {
        triggersOnDate = sd.recurrence_value === dow;
      } else if (sd.recurrence_type === 'monthly_day') {
        triggersOnDate = sd.recurrence_value === d;
      }
      if (!triggersOnDate) continue;

      const pKey = getScheduledPeriodKeyForDate(sd, dateStr);

      // Para colaborador o entrega individual emitimos por persona; para área/empresa cuando líder ve múltiples,
      // emitimos por colaborador asignado para permitir filtro exacto por usuario
      for (const prof of matchingProfiles) {
        const isDone = compSet.has(`${sd.id}::${prof.id}::${pKey}`);
        let status = isDone ? 'completed' : 'pending';
        if (!isDone && dateStr < todayStr) {
          status = 'overdue';
        }

        events.push({
          id: `sd-${sd.id}-${prof.id}-${dateStr}`,
          rawId: sd.id,
          sourceType: 'scheduled_delivery',
          title: sd.title,
          description: sd.description || '',
          date: dateStr,
          time: null,
          status,
          priority: sd.priority || 'medium',
          responsibleId: prof.id,
          responsibleName: prof.full_name || 'Colaborador',
          areaId: prof.roles?.area_id || sd.target_area_id || null,
          areaName: prof.roles?.areas?.name || 'General',
        });
      }
    }
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '23:59').localeCompare(b.time || '23:59');
  });
}


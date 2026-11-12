/**
 * Utilidades de fecha y hora estandarizadas a America/Bogota (UTC-5).
 */
export const BOGOTA_TIMEZONE = 'America/Bogota';

/**
 * Retorna la fecha actual o dada en formato 'YYYY-MM-DD' en America/Bogota.
 */
export function getBogotaDateStr(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Parsea `due_date` (+ opcional `due_time`) interpretando fechas sin hora en America/Bogota (UTC-5).
 * Si `due_date` es solo fecha ('YYYY-MM-DD') sin `due_time`, asume fin de día 23:59:59-05:00.
 */
export function parseTaskDueBogota(dueDate, dueTime = null) {
  if (!dueDate) return null;
  if (dueDate instanceof Date) return dueDate;

  const raw = String(dueDate).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const cleanTime = dueTime
      ? (dueTime.trim().length === 5 ? `${dueTime.trim()}:00` : dueTime.trim())
      : '23:59:59';
    return new Date(`${raw}T${cleanTime}-05:00`);
  }

  // Si trae fecha y hora pero sin zona horaria explícita
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    const normalized = raw.replace(' ', 'T');
    const withSec = normalized.length === 16 ? `${normalized}:00` : normalized;
    return new Date(`${withSec}-05:00`);
  }

  return new Date(raw);
}

/**
 * Determina si una tarea pendiente está vencida respecto al reloj actual en America/Bogota.
 */
export function isTaskOverdueBogota(task, now = new Date()) {
  if (!task || task.status !== 'pending' || !task.due_date) return false;

  const raw = String(task.due_date).trim();
  // Si es fecha pura sin due_time, está vencida si la fecha límite es anterior a hoy en Bogotá
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !task.due_time) {
    return raw < getBogotaDateStr(now);
  }

  const dueDt = parseTaskDueBogota(raw, task.due_time);
  if (!dueDt || Number.isNaN(dueDt.getTime())) return false;
  return dueDt.getTime() < now.getTime();
}

/**
 * Retorna días de atraso (>= 0) en America/Bogota.
 */
export function getDaysOverdueBogota(dueDate, now = new Date()) {
  if (!dueDate) return 0;
  const dueStr = String(dueDate).trim().slice(0, 10);
  const todayStr = getBogotaDateStr(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueStr)) return 0;

  const dueMs = new Date(`${dueStr}T00:00:00-05:00`).getTime();
  const todayMs = new Date(`${todayStr}T00:00:00-05:00`).getTime();
  return Math.max(0, Math.round((todayMs - dueMs) / 86400000));
}


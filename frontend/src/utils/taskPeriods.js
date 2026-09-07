// Calcula la "llave de período" de una tarea recurrente de Gestión Diaria.
// Es lo que permite que una tarea marcada hoy vuelva a aparecer sin marcar
// mañana (diaria), la próxima semana (semanal) o el próximo mes (mensual),
// sin borrar el historial de cumplimiento (queda una fila en task_completions
// por cada período en que se marcó).

const pad = (n) => String(n).padStart(2, '0');

const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Lunes de la semana que contiene `date` (semana ISO, lunes a domingo).
const mondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo, 1 = lunes, ... 6 = sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

export const FREQUENCIES = ['daily', 'weekly', 'monthly'];

export const FREQUENCY_LABELS = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual'
};

export function getPeriodKey(frequency, date = new Date()) {
  const d = new Date(date);
  if (frequency === 'daily') return toDateKey(d);
  if (frequency === 'weekly') return toDateKey(mondayOf(d));
  if (frequency === 'monthly') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  return null;
}

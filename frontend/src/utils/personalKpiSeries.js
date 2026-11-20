import { getBogotaDateStr } from './bogotaTime';

export const PERSONAL_KPI_TARGET = 85;

const RANGE_CONFIG = {
  weekly: { days: 7, label: 'Últimos 7 días (Semanal)' },
  biweekly: { days: 15, label: 'Últimos 15 días (Quincenal)' },
  monthly: { days: 30, label: 'Últimos 30 días (Mensual)' },
};

function addDaysIso(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatShortLabel(dateStr) {
  const [, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}`;
}

function extractTaskDateStr(task) {
  if (!task) return null;
  if (task.due_date) {
    const raw = String(task.due_date).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  }
  if (task.completed_at) {
    const d = new Date(task.completed_at);
    if (!Number.isNaN(d.getTime())) {
      return getBogotaDateStr(d);
    }
  }
  return null;
}

/**
 * Construye series temporales de KPI de gestión diaria (semanal 7d, quincenal 15d, mensual 30d).
 * Prioriza el acta formal de `daily_closings`; si el día aún no está cerrado, calcula
 * desde `task_completions` y `adHocTasks`. Días sin actividad se marcan `compliance: null`
 * y se excluyen del promedio para no penalizar días no laborables.
 */
export function buildPersonalKpiSeries({
  range = 'weekly',
  referenceDateStr = null,
  dailyClosings = [],
  taskCompletions = [],
  dailyTemplatesCount = 0,
  adHocTasks = [],
} = {}) {
  const cfg = RANGE_CONFIG[range] || RANGE_CONFIG.weekly;
  const normalizedRange = RANGE_CONFIG[range] ? range : 'weekly';
  const endStr =
    referenceDateStr && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateStr)
      ? referenceDateStr
      : getBogotaDateStr();

  const closingByDate = new Map();
  for (const c of dailyClosings || []) {
    if (c?.period_key) {
      closingByDate.set(String(c.period_key).slice(0, 10), c);
    }
  }

  const completionsByDate = new Map();
  for (const tc of taskCompletions || []) {
    const pKey = tc?.period_key ? String(tc.period_key).slice(0, 10) : null;
    if (pKey && /^\d{4}-\d{2}-\d{2}$/.test(pKey)) {
      if (!completionsByDate.has(pKey)) completionsByDate.set(pKey, []);
      completionsByDate.get(pKey).push(tc);
    }
  }

  const adHocByDate = new Map();
  for (const t of adHocTasks || []) {
    const tDate = extractTaskDateStr(t);
    if (tDate) {
      if (!adHocByDate.has(tDate)) adHocByDate.set(tDate, []);
      adHocByDate.get(tDate).push(t);
    }
  }

  const points = [];
  for (let offset = -(cfg.days - 1); offset <= 0; offset += 1) {
    const dateStr = addDaysIso(endStr, offset);
    const shortLabel = formatShortLabel(dateStr);
    const closing = closingByDate.get(dateStr);

    if (closing) {
      const completed = Number(closing.completed_tasks ?? 0);
      const total = Number(closing.total_tasks ?? 0);
      const unfulfilled = Number(closing.unfulfilled_tasks ?? 0);
      const compliance = Number(Number(closing.compliance_percentage ?? 0).toFixed(1));
      points.push({
        date: dateStr,
        label: shortLabel,
        compliance,
        completed,
        total,
        unfulfilled,
        isClosed: true,
        source: 'closing',
      });
      continue;
    }

    const dayComps = completionsByDate.get(dateStr) || [];
    const dayAdHoc = adHocByDate.get(dateStr) || [];

    if (dayComps.length > 0 || dayAdHoc.length > 0) {
      const compDone = dayComps.filter((c) => c.status !== 'unfulfilled').length;
      const compUnf = dayComps.filter((c) => c.status === 'unfulfilled').length;
      const adDone = dayAdHoc.filter((t) => t.status === 'completed' || t.completed === true).length;
      const adUnf = dayAdHoc.filter((t) => t.status === 'unfulfilled').length;

      const completed = compDone + adDone;
      const unfulfilled = compUnf + adUnf;
      const templatesPart = dayComps.length > 0 ? Math.max(dailyTemplatesCount, dayComps.length) : 0;
      const total = templatesPart + dayAdHoc.length;
      const compliance = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : null;

      points.push({
        date: dateStr,
        label: shortLabel,
        compliance,
        completed,
        total,
        unfulfilled,
        isClosed: false,
        source: 'activity',
      });
    } else {
      points.push({
        date: dateStr,
        label: shortLabel,
        compliance: null,
        completed: 0,
        total: 0,
        unfulfilled: 0,
        isClosed: false,
        source: 'none',
      });
    }
  }

  const activePoints = points.filter((p) => p.compliance !== null);
  const averageCompliance =
    activePoints.length > 0
      ? Number(
          (
            activePoints.reduce((acc, p) => acc + p.compliance, 0) / activePoints.length
          ).toFixed(1)
        )
      : null;

  let statusKey = 'na';
  let statusLabel = 'Sin registros';
  if (averageCompliance !== null) {
    if (averageCompliance >= PERSONAL_KPI_TARGET) {
      statusKey = 'pass';
      statusLabel = `En Meta (≥${PERSONAL_KPI_TARGET}%)`;
    } else if (averageCompliance >= 65) {
      statusKey = 'warn';
      statusLabel = 'Atención (65-84%)';
    } else {
      statusKey = 'fail';
      statusLabel = 'Bajo Meta (<65%)';
    }
  }

  let bestDay = null;
  for (const p of activePoints) {
    if (!bestDay || p.compliance > bestDay.compliance) {
      bestDay = p;
    }
  }

  let trendDelta = null;
  if (activePoints.length >= 2) {
    const mid = Math.floor(activePoints.length / 2);
    const firstHalf = activePoints.slice(0, mid);
    const secondHalf = activePoints.slice(mid);
    const avgFirst = firstHalf.reduce((acc, p) => acc + p.compliance, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, p) => acc + p.compliance, 0) / secondHalf.length;
    trendDelta = Number((avgSecond - avgFirst).toFixed(1));
  }

  return {
    range: normalizedRange,
    rangeLabel: cfg.label,
    target: PERSONAL_KPI_TARGET,
    startDate: points[0]?.date || endStr,
    endDate: endStr,
    labels: points.map((p) => p.label),
    values: points.map((p) => p.compliance),
    points,
    summary: {
      averageCompliance,
      meetsTarget: averageCompliance !== null && averageCompliance >= PERSONAL_KPI_TARGET,
      statusKey,
      statusLabel,
      closedDaysCount: points.filter((p) => p.isClosed).length,
      activeDaysCount: activePoints.length,
      totalCompleted: points.reduce((acc, p) => acc + p.completed, 0),
      totalTasks: points.reduce((acc, p) => acc + p.total, 0),
      totalUnfulfilled: points.reduce((acc, p) => acc + p.unfulfilled, 0),
      bestDay,
      trendDelta,
    },
  };
}

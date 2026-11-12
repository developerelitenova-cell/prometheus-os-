import { getBogotaDateStr, parseTaskDueBogota } from './bogotaTime';

export const KPI_CATALOG = [
  {
    key: 'compliance_rate',
    name: 'Tasa de Cumplimiento',
    formula: '(Ejecutadas / Programadas aplicables) * 100',
    target: 85,
    operator: '>=',
    unit: '%',
  },
  {
    key: 'on_time_rate',
    name: 'Puntualidad',
    formula: '(Ejecutadas a tiempo / Ejecutadas) * 100',
    target: 80,
    operator: '>=',
    unit: '%',
  },
  {
    key: 'overdue_rate',
    name: 'Tasa de Vencidas',
    formula: '(Vencidas pendientes / Programadas aplicables) * 100',
    target: 10,
    operator: '<=',
    unit: '%',
  },
];

const NA_STATUSES = new Set(['not_applicable', 'na', 'n/a', 'cancelled', 'exempt']);

export function getPeriodBoundsBogota(periodType = 'monthly', referenceDateStr = null) {
  const refStr = referenceDateStr || getBogotaDateStr();
  const [y, m, d] = refStr.split('-').map(Number);
  const ref = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const fmt = (dt) => {
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  if (periodType === 'weekly') {
    const dow = (ref.getUTCDay() + 6) % 7; // Lunes = 0
    const start = new Date(ref);
    start.setUTCDate(ref.getUTCDate() - dow);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return {
      startDate: fmt(start),
      endDate: fmt(end),
      label: `Semana (${fmt(start)} a ${fmt(end)})`,
    };
  }

  if (periodType === 'quarterly') {
    const q = Math.floor((m - 1) / 3) + 1;
    const startMonth = (q - 1) * 3;
    const start = new Date(Date.UTC(y, startMonth, 1, 12, 0, 0));
    const end = new Date(Date.UTC(y, startMonth + 3, 0, 12, 0, 0));
    return {
      startDate: fmt(start),
      endDate: fmt(end),
      label: `Trimestre ${y}-Q${q}`,
    };
  }

  const start = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 12, 0, 0));
  return {
    startDate: fmt(start),
    endDate: fmt(end),
    label: `Mes ${y}-${String(m).padStart(2, '0')}`,
  };
}

function isCompletedOnTime(act) {
  if (!act.due_date || !act.completed_at) return true;
  const dueDt = parseTaskDueBogota(act.due_date, act.due_time);
  const compDt = new Date(act.completed_at);
  if (!dueDt || Number.isNaN(compDt.getTime())) return true;
  return compDt.getTime() <= dueDt.getTime();
}

function isOverduePending(act, now) {
  const status = (act.status || 'pending').toLowerCase();
  if (status !== 'pending' && status !== 'in_progress') return false;
  if (!act.due_date) return false;
  const dueDt = parseTaskDueBogota(act.due_date, act.due_time);
  if (!dueDt) return false;
  return dueDt.getTime() < now.getTime();
}

export function calculateKpisFromActivities(activities = [], now = new Date()) {
  const applicable = [];
  let naExcluded = 0;

  for (const act of activities) {
    const st = (act.status || 'pending').toLowerCase();
    if (NA_STATUSES.has(st) || act.is_applicable === false) {
      naExcluded += 1;
      continue;
    }
    applicable.push(act);
  }

  const total = applicable.length;
  const completedItems = applicable.filter((a) => (a.status || '').toLowerCase() === 'completed');
  const completed = completedItems.length;
  const onTime = completedItems.filter(isCompletedOnTime).length;
  const overdueItems = applicable.filter((a) => isOverduePending(a, now));
  const overdue = overdueItems.length;

  let complianceVal = null;
  let onTimeVal = null;
  let overdueVal = null;

  if (total > 0) {
    complianceVal = Number(((completed / total) * 100).toFixed(2));
    onTimeVal = completed > 0 ? Number(((onTime / completed) * 100).toFixed(2)) : 0;
    overdueVal = Number(((overdue / total) * 100).toFixed(2));
  }

  const values = {
    compliance_rate: complianceVal,
    on_time_rate: onTimeVal,
    overdue_rate: overdueVal,
  };

  const kpis = KPI_CATALOG.map((meta) => {
    const val = values[meta.key];
    let status = 'na';
    if (val !== null) {
      status = meta.operator === '>=' ? (val >= meta.target ? 'pass' : 'fail') : (val <= meta.target ? 'pass' : 'fail');
    }
    return { ...meta, value: val, status };
  });

  return {
    summary: {
      total_scheduled: total,
      na_excluded: naExcluded,
      completed,
      on_time: onTime,
      overdue,
    },
    kpis,
    overdue_items: overdueItems,
  };
}

export function buildLocalGroundedAnalysis(report) {
  const summary = report?.summary || {};
  const kpis = report?.kpis || [];
  const periodLabel = report?.period?.label || 'Período seleccionado';
  const total = summary.total_scheduled || 0;
  const completed = summary.completed || 0;
  const overdue = summary.overdue || 0;
  const naExcluded = summary.na_excluded || 0;

  if (total === 0) {
    return {
      executive_summary: `En ${periodLabel} no hubo actividades aplicables registradas (excluidas N/A: ${naExcluded}). Los indicadores permanecen como N/A sin penalización.`,
      key_findings: [`Total programadas aplicables: 0.`, `Actividades N/A excluidas: ${naExcluded}.`],
      bottlenecks: [],
      recommendations: ['Asignar actividades en el período para habilitar el seguimiento de KPI.'],
      generated_by: 'local-grounded-analyzer',
    };
  }

  const map = Object.fromEntries(kpis.map((k) => [k.key, k]));
  const comp = map.compliance_rate || {};
  const ontime = map.on_time_rate || {};
  const ovd = map.overdue_rate || {};

  return {
    executive_summary: `En ${periodLabel} se completaron ${completed} de ${total} actividades aplicables (Tasa de Cumplimiento: ${comp.value}% vs. meta >= ${comp.target}%). Puntualidad: ${ontime.value}% (meta >= ${ontime.target}%) y Tasa de Vencidas: ${ovd.value}% (${overdue} vencidas; meta <= ${ovd.target}%).`,
    key_findings: [
      `Tasa de Cumplimiento: ${comp.value}% (${comp.status === 'pass' ? 'Cumple' : 'Incumple'} meta >= ${comp.target}%).`,
      `Puntualidad: ${ontime.value}% (${ontime.status === 'pass' ? 'Cumple' : 'Incumple'} meta >= ${ontime.target}%).`,
      `Tasa de Vencidas: ${ovd.value}% (${ovd.status === 'pass' ? 'Dentro de meta' : 'Excede límite'} <= ${ovd.target}%).`,
    ],
    bottlenecks: (report?.bottlenecks || []).slice(0, 5).map(
      (b) => `Pendiente vencida: "${b.title}" (${b.assignee_name}, vencía ${b.due_date}).`
    ),
    recommendations: [
      comp.status === 'fail'
        ? `Priorizar el cierre de las ${total - completed} actividades pendientes para alcanzar la meta de ${comp.target}%.`
        : 'Mantener el ritmo de cumplimiento por encima de la meta.',
      ...(overdue > 0 ? [`Atender de inmediato las ${overdue} actividades vencidas identificadas.`] : []),
    ],
    generated_by: 'local-grounded-analyzer',
  };
}


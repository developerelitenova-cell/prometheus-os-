import { supabase } from './supabase';

const CHECKPOINT_RANK = { semana_2: 1, semana_3: 2, semana_4: 3, cierre: 4 };

// Puntaje del cargo a partir de las mediciones reales cargadas en
// Gestión de KPIs (kpi_metric_measurements), no del viejo modelo BSC
// (role_kpis) que ya nadie escribe. Promedia el % de todas las
// métricas del corte más reciente con datos para ese cargo.
export const getLatestRoleKpiScore = async (roleId) => {
  const { data, error } = await supabase
    .from('kpi_metric_measurements')
    .select('period_year, period_month, period_checkpoint, percentage')
    .eq('role_id', roleId)
    .not('percentage', 'is', null);

  if (error || !data || data.length === 0) return 0;

  const latest = data.reduce((best, row) => {
    const rank = [row.period_year, row.period_month, CHECKPOINT_RANK[row.period_checkpoint] || 0];
    if (!best) return rank;
    if (rank[0] !== best[0]) return rank[0] > best[0] ? rank : best;
    if (rank[1] !== best[1]) return rank[1] > best[1] ? rank : best;
    return rank[2] > best[2] ? rank : best;
  }, null);

  const matching = data.filter(row =>
    row.period_year === latest[0] &&
    row.period_month === latest[1] &&
    (CHECKPOINT_RANK[row.period_checkpoint] || 0) === latest[2]
  );

  return Math.round(matching.reduce((sum, row) => sum + Number(row.percentage), 0) / matching.length);
};

const rankOf = (row) => [row.period_year, row.period_month, CHECKPOINT_RANK[row.period_checkpoint] || 0];
const rankIsNewer = (a, b) => {
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] > b[2];
};

// Detalle de KPIs de un cargo: puntaje global + la última medición cargada
// de cada métrica individual (meta vs. realizado). A diferencia de
// getLatestRoleKpiScore (que exige que todas las métricas compartan el
// mismo corte), acá cada métrica muestra su propio dato más reciente --
// más tolerante a que las mediciones se vayan cargando de a poco.
// Pensado para la vista del gerente sobre su propio cargo (no para
// empleados individuales, que no deben ver este desglose).
export const getRoleKpiDetail = async (roleId) => {
  const { data: links, error: linksError } = await supabase
    .from('kpi_role_template_links')
    .select('template_id, kpi_role_templates(area_label, kpi_template_metrics(id, name, meta_label, meta_type))')
    .eq('role_id', roleId);

  if (linksError || !links || links.length === 0) return { overallScore: 0, metrics: [] };

  const allMetrics = [];
  links.forEach(link => {
    (link.kpi_role_templates?.kpi_template_metrics || []).forEach(m => allMetrics.push(m));
  });
  if (allMetrics.length === 0) return { overallScore: 0, metrics: [] };

  const { data: measurements } = await supabase
    .from('kpi_metric_measurements')
    .select('metric_id, period_year, period_month, period_checkpoint, realizado_raw, percentage, estado')
    .eq('role_id', roleId)
    .in('metric_id', allMetrics.map(m => m.id));

  const latestByMetric = {};
  (measurements || []).forEach(row => {
    const current = latestByMetric[row.metric_id];
    if (!current || rankIsNewer(rankOf(row), rankOf(current))) {
      latestByMetric[row.metric_id] = row;
    }
  });

  const metrics = allMetrics.map(m => {
    const latest = latestByMetric[m.id];
    return {
      id: m.id,
      name: m.name,
      meta_label: m.meta_label,
      meta_type: m.meta_type,
      realizado_raw: latest?.realizado_raw || null,
      percentage: latest?.percentage ?? null,
      estado: latest?.estado || null
    };
  });

  const withData = metrics.filter(m => m.percentage !== null);
  const overallScore = withData.length
    ? Math.round(withData.reduce((sum, m) => sum + Number(m.percentage), 0) / withData.length)
    : 0;

  return { overallScore, metrics };
};

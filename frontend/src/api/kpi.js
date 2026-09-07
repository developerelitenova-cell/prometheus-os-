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

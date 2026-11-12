/**
 * Utilidades de cálculo financiero PyG (Pérdidas y Ganancias) por Canal de Venta.
 * Prorrateo proporcional a ventas netas por canal.
 * Regla de pérdida: Margen Neto < 0% o EBITDA < 0.
 */

export const DEFAULT_SALES_CHANNELS = [
  { id: 'B2B', code: 'B2B', name: 'B2B' },
  { id: 'ECOMMERCE', code: 'ECOMMERCE', name: 'E-commerce' },
  { id: 'DISTRIBUIDORES', code: 'DISTRIBUIDORES', name: 'Distribuidores' },
  { id: 'RETAIL', code: 'RETAIL', name: 'Retail' },
];

const round2 = (v) => Number((Number(v) || 0).toFixed(2));

export function calculatePygByChannel(channels = DEFAULT_SALES_CHANNELS, directEntries = [], indirectExpenses = []) {
  const activeChannels = channels.length > 0 ? channels : DEFAULT_SALES_CHANNELS;
  const agg = new Map();

  for (const ch of activeChannels) {
    agg.set(ch.id, {
      channel_id: ch.id,
      code: ch.code || ch.id,
      name: ch.name || ch.id,
      gross_revenue: 0,
      returns_discounts: 0,
      cogs: 0,
      direct_opex: 0,
      depreciation_amort: 0,
      taxes_financial: 0,
    });
  }

  for (const e of directEntries) {
    const row = agg.get(e.channel_id);
    if (!row) continue;
    row.gross_revenue += Number(e.gross_revenue) || 0;
    row.returns_discounts += Number(e.returns_discounts) || 0;
    row.cogs += Number(e.cogs) || 0;
    row.direct_opex += Number(e.direct_opex) || 0;
    row.depreciation_amort += Number(e.depreciation_amort) || 0;
    row.taxes_financial += Number(e.taxes_financial) || 0;
  }

  let totalNetRevenue = 0;
  for (const v of agg.values()) {
    totalNetRevenue += Math.max(0, v.gross_revenue - v.returns_discounts);
  }
  const totalIndirect = indirectExpenses.reduce((s, exp) => s + (Number(exp.amount) || 0), 0);
  const numChannels = agg.size;

  const channelRows = [];
  const lossChannels = [];

  for (const v of agg.values()) {
    const grossRev = round2(v.gross_revenue);
    const returnsDisc = round2(v.returns_discounts);
    const netRev = round2(grossRev - returnsDisc);
    const cogs = round2(v.cogs);
    const grossProfit = round2(netRev - cogs);
    const grossMarginPct = netRev > 0 ? round2((grossProfit / netRev) * 100) : 0;

    const share = totalNetRevenue > 0
      ? Math.max(0, netRev) / totalNetRevenue
      : (numChannels > 0 ? 1 / numChannels : 0);

    const allocatedIndirect = round2(totalIndirect * share);
    const directOpex = round2(v.direct_opex);
    const ebitda = round2(grossProfit - directOpex - allocatedIndirect);
    const ebitdaMarginPct = netRev > 0 ? round2((ebitda / netRev) * 100) : (ebitda < 0 ? -100 : 0);

    const depr = round2(v.depreciation_amort);
    const taxes = round2(v.taxes_financial);
    const netIncome = round2(ebitda - depr - taxes);
    const netMarginPct = netRev > 0 ? round2((netIncome / netRev) * 100) : (netIncome < 0 ? -100 : 0);
    const isLoss = netMarginPct < 0 || ebitda < 0;

    const row = {
      channel_id: v.channel_id,
      code: v.code,
      name: v.name,
      gross_revenue: grossRev,
      returns_discounts: returnsDisc,
      net_revenue: netRev,
      revenue_share_pct: round2(share * 100),
      cogs,
      gross_profit: grossProfit,
      gross_margin_pct: grossMarginPct,
      direct_opex: directOpex,
      allocated_indirect_opex: allocatedIndirect,
      ebitda,
      ebitda_margin_pct: ebitdaMarginPct,
      depreciation_amort: depr,
      taxes_financial: taxes,
      net_income: netIncome,
      net_margin_pct: netMarginPct,
      is_loss: isLoss,
    };
    channelRows.push(row);
    if (isLoss) lossChannels.push(row);
  }

  const consNetRev = round2(channelRows.reduce((s, r) => s + r.net_revenue, 0));
  const consCogs = round2(channelRows.reduce((s, r) => s + r.cogs, 0));
  const consGrossProfit = round2(consNetRev - consCogs);
  const consDirectOpex = round2(channelRows.reduce((s, r) => s + r.direct_opex, 0));
  const consIndirect = round2(channelRows.reduce((s, r) => s + r.allocated_indirect_opex, 0));
  const consEbitda = round2(consGrossProfit - consDirectOpex - consIndirect);
  const consDepr = round2(channelRows.reduce((s, r) => s + r.depreciation_amort, 0));
  const consTaxes = round2(channelRows.reduce((s, r) => s + r.taxes_financial, 0));
  const consNetIncome = round2(consEbitda - consDepr - consTaxes);

  return {
    channels: channelRows,
    loss_channels: lossChannels,
    total_indirect_expenses: round2(totalIndirect),
    consolidated: {
      gross_revenue: round2(channelRows.reduce((s, r) => s + r.gross_revenue, 0)),
      returns_discounts: round2(channelRows.reduce((s, r) => s + r.returns_discounts, 0)),
      net_revenue: consNetRev,
      cogs: consCogs,
      gross_profit: consGrossProfit,
      gross_margin_pct: consNetRev > 0 ? round2((consGrossProfit / consNetRev) * 100) : 0,
      direct_opex: consDirectOpex,
      allocated_indirect_opex: consIndirect,
      ebitda: consEbitda,
      ebitda_margin_pct: consNetRev > 0 ? round2((consEbitda / consNetRev) * 100) : 0,
      depreciation_amort: consDepr,
      taxes_financial: consTaxes,
      net_income: consNetIncome,
      net_margin_pct: consNetRev > 0 ? round2((consNetIncome / consNetRev) * 100) : 0,
      is_loss: consNetIncome < 0 || consEbitda < 0,
    },
  };
}

export function buildLocalFinancialAnalysis(report) {
  const period = report?.period_month || '';
  const monthly = report?.monthly || {};
  const cons = monthly.consolidated || {};
  const channels = monthly.channels || [];
  const lossChannels = monthly.loss_channels || [];

  const deviations = [];
  for (const ch of channels) {
    const cogsPct = ch.net_revenue > 0 ? round2((ch.cogs / ch.net_revenue) * 100) : 0;
    if (ch.is_loss) {
      deviations.push(
        `ALERTA CRÍTICA — Canal ${ch.name} en pérdida: Margen Neto ${ch.net_margin_pct}% y EBITDA $${ch.ebitda.toLocaleString()} (COGS: ${cogsPct}%).`
      );
    } else if (cogsPct > 65) {
      deviations.push(`Sobrecosto en ${ch.name}: COGS representa ${cogsPct}% de sus ventas netas.`);
    }
  }
  if (deviations.length === 0) {
    deviations.push('Todos los canales mantienen márgenes y EBITDA positivos en el período.');
  }

  return {
    executive_summary: `En ${period}, las ventas netas consolidadas suman $${(cons.net_revenue || 0).toLocaleString()}, EBITDA $${(cons.ebitda || 0).toLocaleString()} (${cons.ebitda_margin_pct || 0}%) y Utilidad Neta $${(cons.net_income || 0).toLocaleString()} (Margen Neto: ${cons.net_margin_pct || 0}%).`,
    cost_deviations: deviations,
    recommendations: lossChannels.length > 0
      ? lossChannels.map((c) => `Intervenir estructura de costos y descuentos en ${c.name} para revertir Margen Neto (${c.net_margin_pct}%).`)
      : ['Mantener eficiencia operativa y escalar canales con mayor margen neto.'],
    loss_channels_detected: lossChannels.map((c) => c.name),
    generated_by: 'local-financial-analyzer',
  };
}


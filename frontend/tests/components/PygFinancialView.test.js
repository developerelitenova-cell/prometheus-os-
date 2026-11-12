import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PygFinancialView from '../../src/views/PygFinancialView.vue';
import { getBogotaDateStr } from '../../src/utils/bogotaTime';

const currentMonth = getBogotaDateStr().slice(0, 7);

const mockFinancialData = {
  channels: [
    { id: 'c_b2b', code: 'B2B', name: 'B2B', active: true },
    { id: 'c_eco', code: 'ECOMMERCE', name: 'E-commerce', active: true },
  ],
  entries: [
    {
      channel_id: 'c_b2b',
      period_month: currentMonth,
      gross_revenue: 60000,
      returns_discounts: 0,
      cogs: 20000,
      direct_opex: 5000,
      depreciation_amort: 0,
      taxes_financial: 0,
    },
    {
      channel_id: 'c_eco',
      period_month: currentMonth,
      gross_revenue: 10000,
      returns_discounts: 0,
      cogs: 9000,
      direct_opex: 4000,
      depreciation_amort: 0,
      taxes_financial: 0,
    },
  ],
  indirects: [
    { period_month: currentMonth, category: 'Admin', amount: 7000 },
  ],
};

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        lte: vi.fn(() => chain),
      };
      if (table === 'sales_channels') chain.then = (cb) => cb({ data: mockFinancialData.channels, error: null });
      else if (table === 'channel_financial_entries') chain.then = (cb) => cb({ data: mockFinancialData.entries, error: null });
      else if (table === 'indirect_expenses') chain.then = (cb) => cb({ data: mockFinancialData.indirects, error: null });
      else chain.then = (cb) => cb({ data: [], error: null });
      return chain;
    }),
  },
}));

describe('PygFinancialView.vue (PyG por Canal, Prorrateo, Alertas e IA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes channel PyG with proportional indirect expenses, shows loss alert banner and AI cost diagnosis', async () => {
    const wrapper = mount(PygFinancialView);
    await flushPromises();

    // Banner de pérdida debe mostrarse para E-commerce
    const banner = wrapper.find('[data-testid="pyg-loss-alert-banner"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('E-commerce');

    // Fila E-commerce debe marcar Pérdida
    const ecoRow = wrapper.find('[data-testid="pyg-channel-row-ECOMMERCE"]');
    expect(ecoRow.text()).toContain('Pérdida');
    expect(ecoRow.text()).toContain('-40%');

    // Fila B2B debe mostrar margen positivo
    const b2bRow = wrapper.find('[data-testid="pyg-channel-row-B2B"]');
    expect(b2bRow.text()).toContain('48.33%');

    // Ejecutar diagnóstico de costos con IA
    await wrapper.find('[data-testid="pyg-ai-analyze-btn"]').trigger('click');
    await flushPromises();

    const aiPanel = wrapper.find('[data-testid="pyg-ai-panel"]');
    expect(aiPanel.exists()).toBe(true);
    expect(aiPanel.text()).toContain('E-commerce');
    expect(aiPanel.text()).toContain('-40%');
  });
});


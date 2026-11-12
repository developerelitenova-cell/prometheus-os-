import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PerformanceReportsView from '../../src/views/PerformanceReportsView.vue';

const mockData = {
  areas: [{ id: 'area_1', name: 'Finanzas' }],
  profiles: [
    {
      id: 'emp_1',
      full_name: 'Ana Pérez',
      role_id: 'r1',
      roles: { id: 'r1', name: 'Analista', area_id: 'area_1', areas: { id: 'area_1', name: 'Finanzas' } },
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Cierre diario',
      status: 'completed',
      due_date: '2026-11-10',
      due_time: '18:00:00',
      completed_at: '2026-11-10T17:00:00-05:00',
      assigned_to: 'emp_1',
    },
    {
      id: 't2',
      title: 'Conciliación bancaria',
      status: 'completed',
      due_date: '2026-11-10',
      due_time: '12:00:00',
      completed_at: '2026-11-10T15:00:00-05:00', // Tarde
      assigned_to: 'emp_1',
    },
    {
      id: 't3',
      title: 'Reporte semanal',
      status: 'completed',
      due_date: '2026-11-11',
      due_time: '18:00:00',
      completed_at: '2026-11-11T16:00:00-05:00',
      assigned_to: 'emp_1',
    },
    {
      id: 't4',
      title: 'Auditoría pendiente',
      status: 'pending',
      due_date: '2020-01-01', // Vencida
      assigned_to: 'emp_1',
    },
  ],
};

vi.mock('../../src/api/auth', () => ({
  currentProfile: {
    value: {
      id: 'admin_1',
      full_name: 'Gerente General',
      is_master_admin: true,
      roles: { access_level: 1, area_id: 'area_1', areas: { name: 'Finanzas' } },
    },
  },
  loadCurrentProfile: vi.fn(),
}));

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        order: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        lte: vi.fn(() => chain),
      };
      if (table === 'areas') chain.then = (cb) => cb({ data: mockData.areas, error: null });
      else if (table === 'profiles') chain.then = (cb) => cb({ data: mockData.profiles, error: null });
      else if (table === 'tasks') chain.then = (cb) => cb({ data: mockData.tasks, error: null });
      else chain.then = (cb) => cb({ data: [], error: null });
      return chain;
    }),
  },
}));

describe('PerformanceReportsView.vue (Req. 2.8 & Req. 2.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates automatic KPIs from activities and generates grounded AI agent insights', async () => {
    const wrapper = mount(PerformanceReportsView);
    await flushPromises();

    // 3/4 completadas = 75%, 2/3 a tiempo = 66.67%, 1/4 vencida = 25%
    expect(wrapper.find('[data-testid="kpi-value-compliance_rate"]').text()).toBe('75%');
    expect(wrapper.find('[data-testid="kpi-value-on_time_rate"]').text()).toBe('66.67%');
    expect(wrapper.find('[data-testid="kpi-value-overdue_rate"]').text()).toBe('25%');

    // Solicitar análisis al Agente IA
    await wrapper.find('[data-testid="generate-ai-report-btn"]').trigger('click');
    await flushPromises();

    const aiPanel = wrapper.find('[data-testid="ai-analysis-panel"]');
    expect(aiPanel.exists()).toBe(true);
    expect(aiPanel.text()).toContain('75%');
    expect(aiPanel.text()).toContain('66.67%');
    expect(aiPanel.text()).toContain('Auditoría pendiente');
  });
});


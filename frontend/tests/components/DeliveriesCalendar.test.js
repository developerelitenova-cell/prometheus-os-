import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DeliveriesCalendar from '../../src/views/DeliveriesCalendar.vue';
import { getBogotaDateStr } from '../../src/utils/bogotaTime';

const todayStr = getBogotaDateStr();

const mockState = {
  currentProfile: {
    id: 'admin_1',
    full_name: 'Admin Master',
    is_master_admin: true,
    role_id: 'r_admin',
    roles: { id: 'r_admin', name: 'Director', access_level: 1, area_id: 'area_1', areas: { id: 'area_1', name: 'Dirección' } },
  },
  tasks: [
    {
      id: 't_1',
      title: 'Cierre de caja',
      description: 'Consolidar ingresos',
      due_date: todayStr,
      due_time: '16:00:00',
      status: 'pending',
      priority: 'high',
      assigned_to: 'emp_1',
    },
    {
      id: 't_2',
      title: 'Auditoría inventario',
      description: 'Revisar bodega',
      due_date: todayStr,
      due_time: '10:00:00',
      status: 'completed',
      priority: 'medium',
      assigned_to: 'emp_2',
    },
  ],
  scheduledDeliveries: [
    {
      id: 'sd_1',
      title: 'Informe semanal comercial',
      description: 'Subir resumen',
      recurrence_type: 'once',
      due_date: todayStr,
      target_type: 'profile',
      target_profile_ids: ['emp_1'],
      priority: 'urgent',
      active: true,
    },
  ],
  completions: [],
  profiles: [
    {
      id: 'emp_1',
      full_name: 'Ana Pérez',
      is_master_admin: false,
      role_id: 'r_1',
      roles: { id: 'r_1', name: 'Analista', access_level: 3, area_id: 'area_1', areas: { id: 'area_1', name: 'Finanzas' } },
    },
    {
      id: 'emp_2',
      full_name: 'Luis Gómez',
      is_master_admin: false,
      role_id: 'r_2',
      roles: { id: 'r_2', name: 'Bodega', access_level: 3, area_id: 'area_2', areas: { id: 'area_2', name: 'Logística' } },
    },
  ],
  areas: [
    { id: 'area_1', name: 'Finanzas' },
    { id: 'area_2', name: 'Logística' },
  ],
};

vi.mock('../../src/api/auth', () => ({
  currentProfile: {
    get value() {
      return mockState.currentProfile;
    },
  },
  loadCurrentProfile: vi.fn(async () => mockState.currentProfile),
}));

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
      };
      if (table === 'tasks') chain.then = (cb) => cb({ data: mockState.tasks, error: null });
      else if (table === 'scheduled_deliveries') chain.then = (cb) => cb({ data: mockState.scheduledDeliveries, error: null });
      else if (table === 'scheduled_delivery_completions') chain.then = (cb) => cb({ data: mockState.completions, error: null });
      else if (table === 'profiles') chain.then = (cb) => cb({ data: mockState.profiles, error: null });
      else if (table === 'areas') chain.then = (cb) => cb({ data: mockState.areas, error: null });
      else chain.then = (cb) => cb({ data: [], error: null });
      return chain;
    }),
  },
}));

describe('DeliveriesCalendar.vue (Req. 2.3)', () => {
  beforeEach(() => {
    mockState.currentProfile = {
      id: 'admin_1',
      full_name: 'Admin Master',
      is_master_admin: true,
      role_id: 'r_admin',
      roles: { id: 'r_admin', name: 'Director', access_level: 1, area_id: 'area_1', areas: { id: 'area_1', name: 'Dirección' } },
    };
  });

  const mountCalendar = () =>
    mount(DeliveriesCalendar, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });

  it('renders consolidated tasks and scheduled deliveries and switches between Mes, Semana and Día views', async () => {
    const wrapper = mountCalendar();
    await flushPromises();

    // Vista Mes por defecto
    expect(wrapper.find('[data-testid="calendar-month-view"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Cierre de caja');
    expect(wrapper.text()).toContain('Auditoría inventario');
    expect(wrapper.text()).toContain('Informe semanal comercial');
    expect(wrapper.text()).toContain('Ana Pérez');

    // Cambiar a vista Semana
    await wrapper.find('[data-testid="view-btn-week"]').trigger('click');
    expect(wrapper.find('[data-testid="calendar-week-view"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Informe semanal comercial');

    // Cambiar a vista Día
    await wrapper.find('[data-testid="view-btn-day"]').trigger('click');
    expect(wrapper.find('[data-testid="calendar-day-view"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Cierre de caja');
  });

  it('filters events by area, user and status for Admin, and restricts collaborator to own tasks only', async () => {
    const wrapper = mountCalendar();
    await flushPromises();

    // Admin tiene filtros de área y usuario
    expect(wrapper.find('[data-testid="filter-area"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="filter-user"]').exists()).toBe(true);

    // Filtrar por usuario emp_1
    await wrapper.find('[data-testid="filter-user"]').setValue('emp_1');
    expect(wrapper.text()).toContain('Cierre de caja');
    expect(wrapper.text()).not.toContain('Auditoría inventario');

    // Cambiar usuario actual a Colaborador emp_1
    mockState.currentProfile = mockState.profiles[0];
    const collabWrapper = mountCalendar();
    await flushPromises();

    expect(collabWrapper.find('[data-testid="filter-area"]').exists()).toBe(false);
    expect(collabWrapper.find('[data-testid="filter-user"]').exists()).toBe(false);
    expect(collabWrapper.text()).toContain('Cierre de caja');
    expect(collabWrapper.text()).toContain('Informe semanal comercial');
    expect(collabWrapper.text()).not.toContain('Auditoría inventario');
  });
});


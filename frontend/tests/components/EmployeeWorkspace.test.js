import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import EmployeeWorkspace from '../../src/views/EmployeeWorkspace.vue';

const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: {} }),
}));

vi.mock('../../src/api/auth', () => ({
  loadCurrentProfile: vi.fn().mockResolvedValue({ id: 'emp_1', roles: { id: 'role_1', name: 'Analista' } }),
  signOut: vi.fn(),
  canAccessKpis: vi.fn(() => false),
  currentProfile: { value: { id: 'emp_1', full_name: 'Carlos Ruiz', roles: { id: 'role_1', name: 'Analista' } } },
}));

let mockTasksData = [
  { id: 'task_1', title: 'Task to finish', status: 'pending', task_type: 'daily', due_date: '2099-12-31' },
];

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      const makeSelectChain = () => {
        const chain = {
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          is: vi.fn(() => chain),
          in: vi.fn(() => chain),
          single: vi.fn(() => chain),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          or: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          gte: vi.fn(() => chain),
        };
        if (table === 'tasks') {
          chain.then = (cb) => cb({ data: mockTasksData, error: null });
        } else {
          chain.then = (cb) => cb({ data: [], error: null });
        }
        return chain;
      };

      return {
        select: vi.fn(() => makeSelectChain()),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: (cb) => cb({ error: null }),
          })),
        })),
        insert: vi.fn(() => ({
          then: (cb) => cb({ error: null }),
        })),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: true } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('EmployeeWorkspace.vue Tasks & Overdue Modal (Req. 2.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockTasksData = [
      { id: 'task_1', title: 'Task to finish', status: 'pending', task_type: 'daily', due_date: '2099-12-31' },
    ];
  });

  const mountWorkspace = () => {
    return mount(EmployeeWorkspace, {
      global: {
        stubs: {
          TechNodesBackground: true,
          HeaderBar: true,
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
  };

  it('loads tasks from Supabase on mount', async () => {
    const wrapper = mountWorkspace();
    await flushPromises();

    expect(wrapper.text()).toContain('Task to finish');
    expect(wrapper.find('[data-testid="overdue-tasks-modal"]').exists()).toBe(false);
  });

  it('shows blocking overdue tasks modal on initial DOM when user has overdue pending tasks on first login of the day', async () => {
    mockTasksData = [
      {
        id: 'task_overdue_1',
        title: 'Enviar conciliación bancaria vencida',
        description: 'Urgente de ayer',
        status: 'pending',
        priority: 'high',
        task_type: 'once',
        due_date: '2020-01-10',
      },
    ];

    const wrapper = mountWorkspace();
    await flushPromises();

    const modal = wrapper.find('[data-testid="overdue-tasks-modal"]');
    expect(modal.exists()).toBe(true);
    expect(modal.text()).toContain('Enviar conciliación bancaria vencida');
    expect(modal.text()).toContain('1 tarea vencida pendiente');

    // Confirmar lectura cierra el modal y persiste el acknowledgment del día
    await wrapper.find('[data-testid="overdue-ack-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="overdue-tasks-modal"]').exists()).toBe(false);
    expect(localStorage.getItem('novawork_overdue_ack_emp_1')).toBeTruthy();

    // Si vuelve a entrar el mismo día, ya no reaparece el modal bloqueante
    const wrapperSecondVisit = mountWorkspace();
    await flushPromises();
    expect(wrapperSecondVisit.find('[data-testid="overdue-tasks-modal"]').exists()).toBe(false);
  });
});

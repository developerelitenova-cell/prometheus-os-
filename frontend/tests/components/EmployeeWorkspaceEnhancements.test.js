import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import EmployeeWorkspace from '../../src/views/EmployeeWorkspace.vue';
import { getBogotaDateStr } from '../../src/utils/bogotaTime';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}));

vi.mock('../../src/api/auth', () => ({
  loadCurrentProfile: vi.fn().mockResolvedValue({
    id: 'emp_1',
    full_name: 'Ana María',
    role_id: 'role_1',
    roles: { id: 'role_1', name: 'Asistente Presidencia', area_id: 'area_pres', access_level: 3 },
  }),
  signOut: vi.fn(),
  canAccessKpis: vi.fn(() => false),
  currentProfile: {
    value: {
      id: 'emp_1',
      full_name: 'Ana María',
      role_id: 'role_1',
      roles: { id: 'role_1', name: 'Asistente Presidencia', area_id: 'area_pres', access_level: 3 },
    },
  },
}));

const todayStr = getBogotaDateStr();
const nowPlus2HoursIso = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

let mockDbState = {};
const mockRpcCalls = [];
const mockNotificationInserts = [];

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    rpc: vi.fn((fnName, args) => {
      mockRpcCalls.push({ fnName, args });
      return Promise.resolve({ data: { ok: true }, error: null });
    }),
    from: vi.fn((table) => {
      const makeChain = () => {
        const chain = {
          eq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          is: vi.fn(() => chain),
          in: vi.fn(() => chain),
          single: vi.fn(() => chain),
          maybeSingle: vi.fn(() => {
            if (table === 'daily_closings') {
              return Promise.resolve({ data: null, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          or: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          gte: vi.fn(() => chain),
        };
        chain.then = (cb) => cb({ data: mockDbState[table] || [], error: null });
        return chain;
      };

      return {
        select: vi.fn(() => makeChain()),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ then: (cb) => cb({ error: null }) })),
        })),
        insert: vi.fn((payload) => {
          if (table === 'notifications') {
            mockNotificationInserts.push(payload);
          }
          return { then: (cb) => cb({ error: null }) };
        }),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
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
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('EmployeeWorkspace Enhancements', () => {
  const originalFetch = globalThis.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRpcCalls.length = 0;
    mockNotificationInserts.length = 0;

    URL.createObjectURL = vi.fn(() => 'blob:mock-download');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    globalThis.fetch = vi.fn().mockImplementation(async (url) => {
      if (String(url).includes('/api/role-chat')) {
        return {
          ok: true,
          json: async () => ({ reply: 'Aquí tienes tus prioridades críticas para hoy.' }),
        };
      }
      return { ok: false, status: 503, json: async () => ({}) };
    });

    mockDbState = {
      role_task_templates: [
        {
          id: 'dm_1',
          title: 'Revisar correspondencia de presidencia',
          frequency: 'daily',
          priority: 'high',
          evidence_requirement: 'photo_required',
          start_time: '08:00:00',
          end_time: '08:30:00',
          sequence_order: 1,
          active: true,
        },
        {
          id: 'dm_2',
          title: 'Confirmar sala de juntas',
          frequency: 'daily',
          priority: 'low',
          evidence_requirement: 'none',
          start_time: '08:30:00',
          end_time: '09:00:00',
          sequence_order: 2,
          active: true,
        },
      ],
      task_completions: [
        { task_template_id: 'dm_1', period_key: todayStr, status: 'completed' },
      ],
      daily_closings: [
        {
          period_key: todayStr,
          compliance_percentage: 88.5,
          completed_tasks: 7,
          total_tasks: 8,
          unfulfilled_tasks: 0,
        },
      ],
      tasks: [
        {
          id: 't_urgent',
          title: 'Preparar minuta comité ejecutivo',
          status: 'pending',
          priority: 'urgent',
          evidence_requirement: 'text_only',
          task_type: 'daily',
          due_date: '2099-12-31',
        },
      ],
      events: [
        {
          id: 'ev_1',
          title: 'Comité Directivo de Presidencia',
          event_date: nowPlus2HoursIso,
          target_level: 'area',
          target_area_id: 'area_pres',
        },
      ],
      profiles: [
        {
          id: 'emp_1',
          full_name: 'Ana María',
          email: 'ana@novawork.local',
          is_master_admin: false,
          roles: { id: 'role_1', name: 'Asistente', area_id: 'area_pres', access_level: 3 },
        },
        {
          id: 'coord_1',
          full_name: 'Coordinador Presidencia',
          email: 'coordinador@novawork.local',
          is_master_admin: false,
          roles: { id: 'role_coord', name: 'Coordinador Presidencia', area_id: 'area_pres', access_level: 2 },
        },
      ],
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  const mountWorkspace = () =>
    mount(EmployeeWorkspace, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });

  it('displays explicit mandatory vs optional evidence badges, priority levels, and attention radar banner', async () => {
    const wrapper = mountWorkspace();
    await flushPromises();

    // Evidencia obligatoria vs opcional visibles en Gestión Diaria y Pendientes
    const mandatoryBadges = wrapper.findAll('[data-testid="evidence-badge-mandatory"]');
    const optionalBadges = wrapper.findAll('[data-testid="evidence-badge-optional"]');
    expect(mandatoryBadges.length).toBeGreaterThanOrEqual(2);
    expect(optionalBadges.length).toBeGreaterThanOrEqual(1);
    expect(wrapper.text()).toContain('Evidencia Obligatoria · Foto');
    expect(wrapper.text()).toContain('Evidencia Obligatoria · Nota');
    expect(wrapper.text()).toContain('Evidencia Opcional');

    // Radar de atención inmediata con reunión próxima y tarea urgente
    const radar = wrapper.find('[data-testid="attention-radar-banner"]');
    expect(radar.exists()).toBe(true);
    expect(radar.find('[data-testid="radar-meetings-card"]').text()).toContain('Comité Directivo de Presidencia');
    expect(radar.find('[data-testid="radar-urgent-card"]').text()).toContain('Preparar minuta comité ejecutivo');
  });

  it('auto-opens tutorial on first visit without overdue tasks, persists completion, and reopens manually', async () => {
    const wrapper = mountWorkspace();
    await flushPromises();

    const tutorial = wrapper.find('[data-testid="portal-tutorial-modal"]');
    expect(tutorial.exists()).toBe(true);

    // Avanzar los 4 pasos y finalizar
    await wrapper.find('[data-testid="tutorial-next-btn"]').trigger('click');
    await wrapper.find('[data-testid="tutorial-next-btn"]').trigger('click');
    await wrapper.find('[data-testid="tutorial-next-btn"]').trigger('click');
    await wrapper.find('[data-testid="tutorial-finish-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="portal-tutorial-modal"]').exists()).toBe(false);
    expect(localStorage.getItem('novawork_portal_tutorial_seen_emp_1')).toBe('1');

    // En la segunda visita ya no aparece automáticamente
    const secondWrapper = mountWorkspace();
    await flushPromises();
    expect(secondWrapper.find('[data-testid="portal-tutorial-modal"]').exists()).toBe(false);

    // Botón permanente Guía Rápida lo reabre manualmente
    await secondWrapper.find('[data-testid="open-tutorial-btn"]').trigger('click');
    await flushPromises();
    expect(secondWrapper.find('[data-testid="portal-tutorial-modal"]').exists()).toBe(true);
  });

  it('does not auto-open tutorial when blocking OverdueTasksModal is visible', async () => {
    mockDbState.tasks = [
      {
        id: 't_old',
        title: 'Tarea atrasada crítica',
        status: 'pending',
        priority: 'urgent',
        due_date: '2020-01-01',
      },
    ];

    const wrapper = mountWorkspace();
    await flushPromises();

    expect(wrapper.find('[data-testid="overdue-tasks-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="portal-tutorial-modal"]').exists()).toBe(false);
  });

  it('renders AI quick prompt chips and sends liveWorkspaceContext on click', async () => {
    localStorage.setItem('novawork_portal_tutorial_seen_emp_1', '1');
    const wrapper = mountWorkspace();
    await flushPromises();

    const guide = wrapper.find('[data-testid="ai-agent-empty-guide"]');
    expect(guide.exists()).toBe(true);

    const chips = guide.findAll('[data-testid="ai-quick-chip"]');
    expect(chips.length).toBeGreaterThanOrEqual(4);

    await chips[0].trigger('click');
    await flushPromises();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/role-chat');
    const payload = JSON.parse(options.body);
    expect(payload.roleId).toBe('role_1');
    expect(payload.liveWorkspaceContext).toContain('KPI actual:');
    expect(wrapper.text()).toContain('Aquí tienes tus prioridades críticas para hoy.');
  });

  it('switches to Mis KPIs tab, toggles weekly/biweekly/monthly, and exports feedback Excel & Word', async () => {
    localStorage.setItem('novawork_portal_tutorial_seen_emp_1', '1');
    const wrapper = mountWorkspace();
    await flushPromises();

    await wrapper.find('[data-testid="dm-tab-kpis"]').trigger('click');
    await flushPromises();

    const kpiPanel = wrapper.find('[data-testid="personal-kpi-panel"]');
    expect(kpiPanel.exists()).toBe(true);
    expect(kpiPanel.find('[data-testid="kpi-panel-avg"]').text()).toBe('88.5%');

    await kpiPanel.find('[data-testid="kpi-range-biweekly"]').trigger('click');
    expect(kpiPanel.text()).toContain('Últimos 15 días (Quincenal)');

    await kpiPanel.find('[data-testid="kpi-range-monthly"]').trigger('click');
    expect(kpiPanel.text()).toContain('Últimos 30 días (Mensual)');

    await kpiPanel.find('[data-testid="export-kpi-excel-btn"]').trigger('click');
    await kpiPanel.find('[data-testid="export-kpi-word-btn"]').trigger('click');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('opens SendReportModal, exports file, and sends notification to immediate supervisor', async () => {
    localStorage.setItem('novawork_portal_tutorial_seen_emp_1', '1');
    const wrapper = mountWorkspace();
    await flushPromises();

    await wrapper.find('[data-testid="send-supervisor-btn"]').trigger('click');
    await flushPromises();

    const modal = wrapper.find('[data-testid="send-report-modal"]');
    expect(modal.exists()).toBe(true);
    expect(modal.find('[data-testid="supervisor-select"]').text()).toContain('Coordinador Presidencia');

    await modal.find('[data-testid="confirm-send-supervisor-btn"]').trigger('click');
    await flushPromises();

    expect(mockRpcCalls.length).toBe(1);
    expect(mockRpcCalls[0].fnName).toBe('notify_supervisor_report');
    expect(mockRpcCalls[0].args.p_supervisor_id).toBe('coord_1');
    expect(URL.createObjectURL).toHaveBeenCalled(); // auto-download activado
    expect(wrapper.find('[data-testid="send-report-modal"]').exists()).toBe(false);
  });
});

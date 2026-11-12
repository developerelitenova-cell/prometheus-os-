import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import GlobalNavbar from '../../src/components/GlobalNavbar.vue';
import ProjectsKanban from '../../src/views/ProjectsKanban.vue';
import { DEFAULT_KANBAN_COLUMNS } from '../../src/utils/projectProgress';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ path: '/proyectos', query: {} }),
}));

vi.mock('../../src/api/auth', () => ({
  currentProfile: {
    value: { id: 'u1', full_name: 'Ana Pérez', is_master_admin: false, roles: { access_level: 3 } },
  },
  loadCurrentProfile: vi.fn(),
  isMasterAdmin: () => false,
  isManager: () => false,
  canAccessKpis: () => false,
  signOut: vi.fn(),
}));

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
      };
      if (table === 'projects') {
        chain.then = (cb) => cb({
          data: [{ id: 'p1', code: 'PRJ', name: 'Proyecto Móvil', kanban_columns: DEFAULT_KANBAN_COLUMNS, progress_percentage: 0 }],
          error: null,
        });
      } else {
        chain.then = (cb) => cb({ data: [], error: null });
      }
      return chain;
    }),
  },
}));

describe('Mobile-First Responsive Navigation & Kanban Tabs', () => {
  it('renders mobile bottom navigation bar and >=44px hamburger menu in GlobalNavbar', async () => {
    const wrapper = mount(GlobalNavbar, {
      global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    const toggle = wrapper.find('[data-testid="mobile-menu-toggle"]');
    expect(toggle.exists()).toBe(true);
    expect(toggle.classes()).toContain('min-h-[44px]');
    expect(toggle.classes()).toContain('min-w-[44px]');

    const bottomNav = wrapper.find('[data-testid="mobile-bottom-nav"]');
    expect(bottomNav.exists()).toBe(true);
    expect(bottomNav.text()).toContain('Espacio');
    expect(bottomNav.text()).toContain('Calendario');
    expect(bottomNav.text()).toContain('Proyectos');
  });

  it('renders mobile column switcher tabs in ProjectsKanban for small viewports', async () => {
    const wrapper = mount(ProjectsKanban);
    await flushPromises();

    const mobileTabs = wrapper.find('[data-testid="mobile-kanban-tabs"]');
    expect(mobileTabs.exists()).toBe(true);
    expect(mobileTabs.text()).toContain('Por hacer');
    expect(mobileTabs.text()).toContain('Completado');
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import EmployeeWorkspace from '../../src/views/EmployeeWorkspace.vue';

// Mock dependencias
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: {} })
}));

vi.mock('../../src/api/auth', () => ({
  loadCurrentProfile: vi.fn().mockResolvedValue({ id: 'emp_1', roles: { id: 'role_1' } }),
  signOut: vi.fn(),
  currentProfile: { value: { id: 'emp_1', roles: { id: 'role_1' } } }
}));

const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      return {
        select: vi.fn(() => {
          const chain = {
            eq: vi.fn(() => chain),
            order: vi.fn(() => chain),
            limit: vi.fn(() => chain),
            is: vi.fn(() => chain),
            in: vi.fn(() => chain),
            single: vi.fn(() => chain),
            or: vi.fn(() => chain),
            lte: vi.fn(() => chain),
            gte: vi.fn(() => chain)
          };
          
          if (table === 'tasks') {
            chain.then = (cb) => cb({ data: [{ id: 'task_1', title: 'Task to finish', status: 'pending', task_type: 'daily' }], error: null });
          } else {
            chain.then = (cb) => cb({ data: [], error: null });
          }
          return chain;
        }),
        update: vi.fn(() => {
          const chain = {
            eq: vi.fn(() => {
              chain.then = (cb) => cb({ error: null });
              return chain;
            })
          };
          return chain;
        }),
        insert: vi.fn(() => ({
            then: (cb) => cb({ error: null })
        }))
      };
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: true } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

describe('EmployeeWorkspace.vue Tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountWorkspace = () => {
    return mount(EmployeeWorkspace, {
      global: {
        stubs: {
          TechNodesBackground: true,
          HeaderBar: true
        }
      }
    });
  };

  it('loads tasks from Supabase on mount', async () => {
    const wrapper = mountWorkspace();
    
    // Wait for all async hooks
    await flushPromises();

    // Verify task is rendered
    expect(wrapper.text()).toContain('Task to finish');
  });
});

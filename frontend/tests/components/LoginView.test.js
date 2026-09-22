import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginView from '../../src/views/LoginView.vue';

// Mock dependencies
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace
  }),
  useRoute: () => ({
    query: {}
  })
}));

vi.mock('../../src/api/auth', () => ({
  signIn: vi.fn(),
  loadCurrentProfile: vi.fn()
}));

// Import mocked API to control returns
import { signIn, loadCurrentProfile } from '../../src/api/auth';

describe('LoginView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountLoginView = () => {
    return mount(LoginView, {
      global: {
        stubs: {
          TechNodesBackground: true
        }
      }
    });
  };

  it('shows loading state on submit and disables button', async () => {
    const wrapper = mountLoginView();
    
    // Simulate a slow API call so we can check the loading state
    signIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    loadCurrentProfile.mockResolvedValue({ approval_status: 'approved', is_master_admin: true });

    await wrapper.find('input[type="email"]').setValue('test@elitenutrition.com');
    await wrapper.find('input[type="password"]').setValue('pass123');

    // Trigger submit
    await wrapper.find('form').trigger('submit.prevent');

    // Button should be disabled and show "Ingresando..."
    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeDefined();
    expect(submitButton.text()).toContain('Ingresando...');
  });

  it('displays error message on invalid credentials without blocking the UI', async () => {
    const wrapper = mountLoginView();
    
    signIn.mockResolvedValue({ success: false, error: 'Invalid login credentials' });

    await wrapper.find('input[type="email"]').setValue('test@elitenutrition.com');
    await wrapper.find('input[type="password"]').setValue('wrong');
    await wrapper.find('form').trigger('submit.prevent');

    // API returns error, wait for DOM update
    await wrapper.vm.$nextTick();

    const errorMessage = wrapper.find('.error-text');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toBe('Correo o contraseña incorrectos.');

    // Loading should be false and button enabled
    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeUndefined();
    expect(submitButton.text()).toContain('Iniciar Sesión');
  });

  it('redirects to master admin portal on successful login', async () => {
    const wrapper = mountLoginView();
    
    signIn.mockResolvedValue({ success: true });
    loadCurrentProfile.mockResolvedValue({ approval_status: 'approved', is_master_admin: true });

    await wrapper.find('input[type="email"]').setValue('admin@elitenutrition.com');
    await wrapper.find('input[type="password"]').setValue('pass123');
    await wrapper.find('form').trigger('submit.prevent');

    // Wait for Promises to resolve
    await vi.waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });
});

<template>
  <div class="login-container">
    <TechNodesBackground />
    <div class="login-card glass-panel">
      <img src="../assets/elite-nova-logo.png" alt="PROMETHEUS OS" class="brand-lockup" />
      <h1 class="sr-only">PROMETHEUS OS</h1>
      <p class="subtitle">Ingresa con tu cuenta corporativa</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label>
          Correo Corporativo
          <input v-model="email" type="email" required autocomplete="username" placeholder="tu.correo@elitenutrition.com" />
        </label>
        <label>
          Contraseña
          <input v-model="password" type="password" required autocomplete="current-password" placeholder="••••••••" />
        </label>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>

        <div class="corporate-notice">
          <span class="material-symbols-outlined notice-icon">admin_panel_settings</span>
          <span>Las cuentas de acceso son asignadas exclusivamente por Recursos Humanos o la Administración.</span>
        </div>
      </form>
    </div>

    <div class="developed-by">
      <span>Desarrollado por</span>
      <img src="../assets/elite-nova-logo.png" alt="Elite Nova" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { signIn, loadCurrentProfile } from '../api/auth';
import TechNodesBackground from '../components/TechNodesBackground.vue';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const PENDING_STATUS_MESSAGES = {
  pending: 'Tu cuenta está en proceso de activación por un administrador.',
  rejected: 'Tu acceso fue revocado o rechazado. Contactá a un administrador.',
  suspended: 'Tu cuenta corporativa está suspendida. Contactá a Recursos Humanos.'
};

onMounted(() => {
  const status = route.query.pending;
  if (typeof status === 'string' && PENDING_STATUS_MESSAGES[status]) {
    errorMsg.value = PENDING_STATUS_MESSAGES[status];
  }
});

const handleSubmit = async () => {
  errorMsg.value = '';
  loading.value = true;
  
  try {
    const res = await signIn(email.value.trim(), password.value);
    if (!res.success) {
      errorMsg.value = res.error === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : res.error;
      return;
    }
    
    const profile = await loadCurrentProfile();
    if (profile && profile.approval_status === 'pending') {
      errorMsg.value = 'Tu cuenta está en proceso de activación por Recursos Humanos.';
      return;
    }

    if (profile && profile.approval_status === 'suspended') {
      errorMsg.value = 'Tu cuenta corporativa está suspendida. Contactá a Recursos Humanos.';
      return;
    }
    
    const redirect = route.query.redirect;
    
    // Enrutamiento directo al portal correspondiente
    if (typeof redirect === 'string' && redirect && !redirect.startsWith('/mapper/')) {
      router.replace(redirect);
    } else {
      if (profile.is_master_admin) {
        router.replace('/');
      } else if (profile.roles && profile.roles.access_level === 1) {
        router.replace('/team');
      } else {
        router.replace('/workspace');
      }
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-family: var(--font-sans);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.brand-lockup {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto 24px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.login-card h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 28px 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.login-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.login-form input {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}

.login-form input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.85rem;
}

.success-text {
  margin: 0;
  color: #10b981;
  font-size: 0.85rem;
}

.corporate-notice {
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
  text-align: left;
}

.corporate-notice .notice-icon {
  font-size: 20px;
  color: var(--gold, #d97706);
  flex-shrink: 0;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 13px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-apple);
  margin-top: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.developed-by {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 10;
}

.developed-by span {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.developed-by img {
  height: 24px;
  width: auto;
  opacity: 0.8;
  transition: opacity 0.2s var(--ease-apple);
}

.developed-by img:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .login-card {
    padding: 32px 20px;
  }
  .developed-by {
    position: relative;
    bottom: auto;
    right: auto;
    margin-top: 40px;
    align-items: center;
  }
}
</style>

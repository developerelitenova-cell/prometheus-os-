<template>
  <div class="login-container">
    <div class="login-card glass-panel">
      <img src="../assets/elite-mark.png" alt="Elite Nutrition" class="login-logo" />
      <h1>PROMETHEUS OS</h1>
      <p class="subtitle">{{ isLogin ? 'Ingresa con tu cuenta corporativa' : 'Crea tu cuenta corporativa' }}</p>

      <div class="tabs" v-if="showRegisterTab">
        <button :class="{ active: isLogin }" @click="isLogin = true">Ingresar</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">Registrarse</button>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label v-if="!isLogin">
          Nombre Completo
          <input v-model="fullName" type="text" required placeholder="Tu Nombre" />
        </label>
        <label>
          Correo
          <input v-model="email" type="email" required autocomplete="username" placeholder="tu.correo@elitenutrition.com" />
        </label>
        <label>
          Contraseña
          <input v-model="password" type="password" required autocomplete="current-password" placeholder="••••••••" />
        </label>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { signIn, signUp, signOut, loadCurrentProfile } from '../api/auth';

const router = useRouter();
const route = useRoute();

const isLogin = ref(true);
const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const showRegisterTab = ref(false);

const PENDING_STATUS_MESSAGES = {
  pending: 'Tu cuenta está pendiente de aprobación por un administrador.',
  rejected: 'Tu solicitud de acceso fue rechazada. Contactá a un administrador si creés que es un error.',
  suspended: 'Tu cuenta está suspendida. Contactá a un administrador.'
};

onMounted(() => {
  const status = route.query.pending;
  if (typeof status === 'string' && PENDING_STATUS_MESSAGES[status]) {
    errorMsg.value = PENDING_STATUS_MESSAGES[status];
  }

  // Solo mostrar la pestaña de registro si viene de un enlace de invitación (redirect al mapper)
  const redirect = route.query.redirect || '';
  if (redirect.startsWith('/mapper/')) {
    showRegisterTab.value = true;
    isLogin.value = false;
  }
});

const handleSubmit = async () => {
  errorMsg.value = '';
  loading.value = true;
  
  try {
    if (isLogin.value) {
      const res = await signIn(email.value.trim(), password.value);
      if (!res.success) {
        errorMsg.value = res.error === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : res.error;
        return;
      }
      
      const profile = await loadCurrentProfile();
      if (profile && profile.approval_status === 'pending') {
        errorMsg.value = 'Tu cuenta está pendiente de aprobación por un administrador.';
        return;
      }
      
      const redirect = route.query.redirect;
      
      // Enrutamiento directo al portal siempre
      if (typeof redirect === 'string' && redirect) {
        router.replace(redirect);
      } else {
        router.replace('/workspace');
      }
    } else {
      // Registro
      const redirect = route.query.redirect || '';
      let roleId = null;
      if (redirect.startsWith('/mapper/')) {
        roleId = redirect.replace('/mapper/', '');
      }
      
      const res = await signUp(email.value.trim(), password.value, fullName.value.trim(), roleId);
      if (!res.success) {
        errorMsg.value = res.error;
        return;
      }

      // La cuenta queda 'pending' hasta que un líder la apruebe -- no tiene
      // sentido dejarla logueada en ese estado, así que cerramos la sesión
      // y la mandamos a la pantalla de espera en vez de al login normal.
      await signOut();
      router.replace('/pending-approval');
      return;
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
  max-width: 380px;
  padding: 40px;
  text-align: center;
}

.login-logo {
  height: 110px;
  margin-bottom: 20px;
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

.tabs {
  display: flex;
  margin-bottom: 20px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 4px;
}

.tabs button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tabs button.active {
  background: var(--bg-tertiary);
  color: var(--ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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
</style>

<template>
  <div class="login-container">
    <div class="login-card glass-panel">
      <img src="../assets/elite-logo.png" alt="Elite Nutrition" class="login-logo" />
      <h1>PROMETHEUS OS</h1>
      <p class="subtitle">Ingresá con tu cuenta corporativa</p>

      <form class="login-form" @submit.prevent="handleSubmit">
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
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { signIn, loadCurrentProfile } from '../api/auth';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

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
    const redirect = route.query.redirect;

    if (profile && !profile.mapping_completed && profile.role_id && !profile.is_master_admin) {
      router.replace(`/mapper/${profile.role_id}`);
    } else if (typeof redirect === 'string' && redirect) {
      router.replace(redirect);
    } else {
      router.replace('/workspace');
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
  height: 56px;
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

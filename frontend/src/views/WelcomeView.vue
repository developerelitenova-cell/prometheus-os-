<template>
  <div class="welcome-container">
    <div class="welcome-card glass-panel">
      <img src="../assets/elite-mark.png" alt="Elite Nutrition" class="welcome-logo" />
      <span class="brand-caption">Elite Nutrition</span>
      <div class="status-icon">🎉</div>
      <h1>¡Bienvenido a Elite Nutrition!</h1>
      <p class="subtitle" v-if="profile">
        Tu acceso como <strong>{{ profile.roles?.name || 'colaborador' }}</strong> fue aprobado.
      </p>
      <p class="detail">
        Ya sos parte del sistema corporativo Prometheus OS. El siguiente paso es contarnos
        cómo es tu día a día en el cargo, para dejar tu proceso documentado.
      </p>
      <button class="btn-primary" :disabled="loading" @click="continueOnboarding">
        {{ loading ? 'Ingresando...' : 'Continuar' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';

const router = useRouter();
const profile = ref(null);
const loading = ref(false);

onMounted(async () => {
  if (!currentProfile.value) {
    await loadCurrentProfile();
  }
  profile.value = currentProfile.value;
});

const continueOnboarding = async () => {
  if (!profile.value) return;
  loading.value = true;
  try {
    await supabase.from('profiles').update({ welcome_seen: true }).eq('id', profile.value.id);
    const updated = await loadCurrentProfile();

    if (updated && !updated.mapping_completed && updated.role_id) {
      router.replace(`/mapper/${updated.role_id}`);
    } else {
      router.replace('/workspace');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-family: var(--font-sans);
  padding: 24px;
}

.welcome-card {
  width: 100%;
  max-width: 440px;
  padding: 40px;
  text-align: center;
}

.welcome-logo {
  height: 84px;
  width: 84px;
  border-radius: 18px;
  object-fit: cover;
  transform: scale(1.15);
}

.brand-caption {
  display: block;
  margin: 12px 0 8px 0;
  color: var(--gold-deep);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.status-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.welcome-card h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 16px 0;
}

.detail {
  color: var(--ink-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 28px 0;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 13px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-apple);
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

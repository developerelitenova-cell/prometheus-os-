<template>
  <div class="welcome-container">
    <TechNodesBackground />
    <div class="welcome-card glass-panel">
      <img src="../assets/elite-nova-logo.png" alt="PROMETHEUS OS" class="brand-lockup" />
      <div class="status-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <h1>¡Bienvenido a PROMETHEUS OS!</h1>
      <p class="subtitle" v-if="profile">
        Tu acceso como <strong>{{ profile.roles?.name || 'colaborador' }}</strong> fue aprobado.
      </p>
      <p class="detail">
        Ya sos parte del sistema corporativo PROMETHEUS OS. El siguiente paso es contarnos
        cómo es tu día a día en el cargo, para dejar tu proceso documentado.
      </p>
      <button class="btn-primary" :disabled="loading" @click="continueOnboarding">
        {{ loading ? 'Ingresando...' : 'Continuar' }}
      </button>

      <div class="developed-by">
        <span>Desarrollado por</span>
        <img src="../assets/elite-nova-logo.png" alt="Elite Nova" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import TechNodesBackground from '../components/TechNodesBackground.vue';

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
  position: relative;
  z-index: 1;
}

.brand-lockup {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto 24px;
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

.developed-by {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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

/* --- Mobile Responsiveness --- */
@media (max-width: 768px) {
  .welcome-card {
    padding: 24px 20px;
    width: 90%;
    margin: 20px;
  }
  .welcome-title {
    font-size: 1.5rem;
  }
}
</style>

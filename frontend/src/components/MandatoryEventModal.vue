<template>
  <div v-if="activeEvent" class="modal-overlay">
    <div class="glass-panel modal-content">
      <div class="event-image-container" v-if="activeEvent.image_url">
        <img :src="activeEvent.image_url" alt="Comunicado Oficial" class="event-image" />
      </div>
      <div class="modal-body">
        <h2 class="modal-title">{{ activeEvent.title }}</h2>
        <p class="modal-text">{{ activeEvent.description }}</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="acknowledgeEvent" :disabled="isLoading">
            <span v-if="isLoading">Confirmando...</span>
            <span v-else>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/api/supabase'; // Asumiendo que esta es la ruta

const activeEvent = ref(null);
const isLoading = ref(false);

const checkMandatoryEvents = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
    
    const userId = session.session.user.id;

    // Obtener perfil para saber área
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, roles(area_id)')
      .eq('id', userId)
      .single();

    if (!profile) return;

    // Consultar eventos obligatorios no confirmados
    // Idealmente esto se filtra en backend, pero hacemos un cruce básico aquí.
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_mandatory', true)
      .lte('event_date', new Date().toISOString())
      .order('event_date', { ascending: false });

    if (error || !events || events.length === 0) return;

    // Revisar si ya fue confirmado
    const { data: acks } = await supabase
      .from('event_acknowledgements')
      .select('event_id')
      .eq('profile_id', userId);
      
    const ackedIds = acks?.map(a => a.event_id) || [];

    // Encontrar el primer evento válido no confirmado
    const pendingEvent = events.find(e => {
      if (ackedIds.includes(e.id)) return false;
      // Validar target
      if (e.target_level === 'company') return true;
      if (e.target_level === 'area' && e.target_area_id === profile.roles?.area_id) return true;
      if (e.target_level === 'worker' && e.target_profile_id === userId) return true;
      return false;
    });

    if (pendingEvent) {
      activeEvent.value = pendingEvent;
    }
  } catch (error) {
    console.error("Error al revisar eventos:", error);
  }
};

const acknowledgeEvent = async () => {
  if (!activeEvent.value) return;
  isLoading.value = true;
  
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    await supabase.from('event_acknowledgements').insert([
      {
        event_id: activeEvent.value.id,
        profile_id: session.session.user.id
      }
    ]);
    
    activeEvent.value = null; // Cierra el modal
  } catch (error) {
    console.error("Error confirmando evento:", error);
  } finally {
    isLoading.value = false;
    // Chequear si hay otro evento pendiente
    checkMandatoryEvents();
  }
};

onMounted(() => {
  checkMandatoryEvents();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-pop 0.4s var(--ease-apple);
}

.event-image-container {
  width: 100%;
  max-height: 350px;
  overflow: hidden;
  background: #000;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-body {
  padding: 32px;
  text-align: center;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.modal-text {
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  background: var(--gold-gradient);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--radius-pill);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: scale(1.05);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes modal-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>

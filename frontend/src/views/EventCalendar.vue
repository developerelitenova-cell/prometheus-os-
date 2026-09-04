<template>
  <div class="calendar-container">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/team" class="back-link">← Volver al Panel de Liderazgo</router-link>
        <h1>Programador de Eventos</h1>
        <p class="subtitle">Gestiona fechas especiales, capacitaciones y comunicados obligatorios.</p>
      </div>
      <button v-if="canManage" class="btn-primary" @click="showEventModal = true">+ Nuevo Evento</button>
    </header>

    <div class="events-list">
      <div v-if="events.length === 0" class="empty-state">
        No hay eventos programados.
      </div>
      <div v-for="event in events" :key="event.id" class="event-card glass-panel">
        <div class="event-date-box">
          <span class="month">{{ getMonth(event.event_date) }}</span>
          <span class="day">{{ getDay(event.event_date) }}</span>
        </div>
        <div class="event-info">
          <h3>{{ event.title }}</h3>
          <p>{{ event.description }}</p>
          <div class="tags">
            <span class="tag" v-if="event.is_mandatory">Obligatorio</span>
            <span class="tag outline">Nivel: {{ event.target_level }}</span>
          </div>
        </div>
        <div class="event-meta" v-if="canManage && event.is_mandatory">
          <div class="ack-stats">
            <strong>{{ getAckCount(event.id) }}</strong> confirmaciones
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Evento -->
    <div v-if="showEventModal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h2>Crear Comunicado / Evento</h2>
        <form @submit.prevent="createEvent" class="upload-form">
          <div class="form-group">
            <label>Título</label>
            <input type="text" v-model="newEvent.title" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newEvent.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Fecha del Evento</label>
            <input type="datetime-local" v-model="newEvent.event_date" required>
          </div>
          <div class="form-group">
            <label>URL de Pieza Gráfica (Opcional)</label>
            <input type="url" v-model="newEvent.image_url" placeholder="https://...">
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Público Objetivo</label>
              <select v-model="newEvent.target_level" required>
                <option value="company">Toda la Empresa</option>
                <option value="area">Un Área Específica</option>
                <option value="worker">Un Trabajador</option>
              </select>
            </div>
            
            <div class="form-group half" v-if="newEvent.target_level === 'area'">
              <label>Seleccionar Área</label>
              <select v-model="newEvent.target_area_id" required>
                <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
              </select>
            </div>
            
            <div class="form-group half" v-if="newEvent.target_level === 'worker'">
              <label>Seleccionar Trabajador</label>
              <select v-model="newEvent.target_profile_id" required>
                <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.full_name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="newEvent.is_mandatory">
              Requerir confirmación obligatoria ("Entendido")
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-text" @click="showEventModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="isSaving">Guardar Evento</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/api/supabase';

const events = ref([]);
const acks = ref([]);
const areas = ref([]);
const profiles = ref([]);
const canManage = ref(false);

const showEventModal = ref(false);
const isSaving = ref(false);

const newEvent = ref({
  title: '', description: '', event_date: '', image_url: '', target_level: 'company', target_area_id: null, target_profile_id: null, is_mandatory: false
});

const fetchData = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;
  const userId = session.session.user.id;

  const { data: profile } = await supabase.from('profiles').select('*, roles(*)').eq('id', userId).single();
  if (profile?.roles?.access_level === 1 || profile?.roles?.access_level === 2) {
    canManage.value = true;
    const { data: a } = await supabase.from('areas').select('*');
    areas.value = a || [];
    const { data: p } = await supabase.from('profiles').select('*');
    profiles.value = p || [];
  }

  // Fetch all events
  const { data: evts } = await supabase.from('events').select('*').order('event_date', { ascending: true });
  events.value = evts || [];

  // If manager, fetch acks for stats
  if (canManage.value) {
    const { data: a } = await supabase.from('event_acknowledgements').select('*');
    acks.value = a || [];
  }
};

const getAckCount = (eventId) => {
  return acks.value.filter(a => a.event_id === eventId).length;
};

const createEvent = async () => {
  isSaving.value = true;
  const { data: session } = await supabase.auth.getSession();
  try {
    await supabase.from('events').insert([{
      ...newEvent.value,
      created_by: session.session.user.id
    }]);
    showEventModal.value = false;
    newEvent.value = { title: '', description: '', event_date: '', image_url: '', target_level: 'company', target_area_id: null, target_profile_id: null, is_mandatory: false };
    fetchData();
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

const getMonth = (dStr) => {
  const d = new Date(dStr);
  return d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
};
const getDay = (dStr) => {
  const d = new Date(dStr);
  return d.getDate();
};

onMounted(() => fetchData());
</script>

<style scoped>
.calendar-container { padding: 32px; max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.header-content h1 { font-size: 28px; color: var(--text-primary); }
.subtitle { color: var(--text-secondary); }
.back-link { color: var(--gold-deep); text-decoration: none; font-size: 0.85rem; margin-bottom: 8px; display: inline-block; }

.events-list { display: flex; flex-direction: column; gap: 16px; }
.event-card { display: flex; padding: 20px; align-items: center; gap: 24px; border-radius: var(--radius-md); }
.event-date-box { 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(176, 141, 87, 0.1); color: var(--gold-deep);
  border-radius: var(--radius-sm); padding: 12px 16px; min-width: 80px;
}
.event-date-box .month { font-size: 12px; font-weight: 700; }
.event-date-box .day { font-size: 24px; font-weight: 800; }

.event-info { flex: 1; }
.event-info h3 { margin-bottom: 4px; font-size: 18px; }
.event-info p { color: var(--text-secondary); font-size: 14px; margin-bottom: 12px; }

.tags { display: flex; gap: 8px; }
.tag { background: var(--danger); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.tag.outline { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }

.ack-stats {
  text-align: center; font-size: 13px; color: var(--text-secondary);
  background: var(--bg-secondary); padding: 8px 16px; border-radius: var(--radius-pill);
}

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { width: 100%; max-width: 600px; padding: 32px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); }
.form-row { display: flex; gap: 16px; }
.half { flex: 1; }
.checkbox-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-group input { width: auto; }
.modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
.btn-text { background: none; border: none; cursor: pointer; color: var(--text-secondary); }
.btn-primary { background: var(--gold-gradient); color: white; border: none; padding: 10px 24px; border-radius: var(--radius-pill); font-weight: 600; cursor: pointer; }
</style>

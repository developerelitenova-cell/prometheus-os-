<template>
  <div class="manuals-manager">
    <header class="page-header">
      <div class="header-content">
        <h1>Centro de Manuales y Documentación</h1>
        <p class="subtitle">Consulta y gestiona los manuales operativos por rol.</p>
      </div>
      <button v-if="canManage" class="btn-primary" @click="showUploadModal = true">+ Subir Manual</button>
    </header>

    <!-- Lista de manuales del usuario -->
    <section class="manuals-section">
      <h2 class="section-title">Tus Manuales Asignados</h2>
      <div class="manuals-grid">
        <div v-if="myManuals.length === 0" class="empty-state">
          No tienes manuales asignados en este momento.
        </div>
        <div v-for="manual in myManuals" :key="manual.id" class="manual-card glass-panel">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--gold)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <!-- Punto Rojo de Notificación -->
            <div v-if="hasUnreadNotification(manual.id)" class="red-dot"></div>
          </div>
          <div class="card-content">
            <h3>{{ manual.title }}</h3>
            <p>{{ manual.description }}</p>
            <span class="date">Actualizado: {{ formatDate(manual.updated_at) }}</span>
          </div>
          <div class="card-actions">
            <a :href="manual.content_url" target="_blank" class="btn-secondary" @click="markAsRead(manual.id)">Leer Manual</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de subida de manuales -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h2>Subir Nuevo Manual</h2>
        <form @submit.prevent="uploadManual" class="upload-form">
          <div class="form-group">
            <label>Título del Manual</label>
            <input type="text" v-model="newManual.title" required placeholder="Ej: Manual de Operaciones">
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newManual.description" rows="3" placeholder="Breve resumen del contenido..."></textarea>
          </div>
          <div class="form-group">
            <label>Rol Destino</label>
            <select v-model="newManual.role_id" required>
              <option value="" disabled>Selecciona un rol...</option>
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>URL del Documento (PDF, Drive, etc)</label>
            <input type="url" v-model="newManual.content_url" required placeholder="https://...">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-text" @click="showUploadModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="isUploading">
              {{ isUploading ? 'Subiendo...' : 'Publicar Manual' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/api/supabase';

const myManuals = ref([]);
const availableRoles = ref([]);
const notifications = ref([]);
const currentUser = ref(null);
const canManage = ref(false);

const showUploadModal = ref(false);
const isUploading = ref(false);
const newManual = ref({ title: '', description: '', role_id: '', content_url: '' });

const fetchData = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;
  const userId = session.session.user.id;

  // Obtener perfil
  const { data: profile } = await supabase.from('profiles').select('*, roles(*)').eq('id', userId).single();
  currentUser.value = profile;
  
  if (profile?.roles?.access_level === 1 || profile?.roles?.access_level === 2) {
    canManage.value = true;
    // Cargar roles que puede administrar
    const { data: roles } = await supabase.from('roles').select('*').order('name');
    availableRoles.value = roles || [];
  }

  // Cargar manuales del usuario
  if (profile?.role_id) {
    const { data: manuals } = await supabase.from('manuals').select('*').eq('role_id', profile.role_id);
    myManuals.value = manuals || [];
  }

  // Cargar notificaciones de manuales
  const { data: notifs } = await supabase.from('notifications')
    .select('*')
    .eq('profile_id', userId)
    .eq('type', 'manual_update')
    .eq('is_read', false);
  
  notifications.value = notifs || [];
};

const hasUnreadNotification = (manualId) => {
  // En un sistema real, la notificacion podría tener el ID del manual en 'action_url' o 'metadata'
  // Por ahora lo hacemos general
  return notifications.value.length > 0;
};

const markAsRead = async (manualId) => {
  if (notifications.value.length === 0) return;
  const notif = notifications.value[0];
  await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
  notifications.value = [];
};

const uploadManual = async () => {
  isUploading.value = true;
  try {
    const { data: manual, error } = await supabase.from('manuals').insert([{
      ...newManual.value,
      created_by: currentUser.value.id
    }]).select();

    if (error) throw error;

    // Crear notificaciones para los usuarios de ese rol
    const { data: usersToNotify } = await supabase.from('profiles').select('id').eq('role_id', newManual.value.role_id);
    
    if (usersToNotify && usersToNotify.length > 0) {
      const notifsToInsert = usersToNotify.map(u => ({
        profile_id: u.id,
        type: 'manual_update',
        message: `Se ha publicado un nuevo manual: ${newManual.value.title}`
      }));
      await supabase.from('notifications').insert(notifsToInsert);
    }

    showUploadModal.value = false;
    newManual.value = { title: '', description: '', role_id: '', content_url: '' };
    if (newManual.value.role_id === currentUser.value.role_id) {
      fetchData(); // Refrescar si lo subió para sí mismo
    }
    alert("Manual publicado exitosamente y notificaciones enviadas.");
  } catch (error) {
    console.error(error);
    alert("Error al subir el manual.");
  } finally {
    isUploading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.manuals-manager {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-content h1 {
  font-size: 28px;
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
}

.section-title {
  font-size: 20px;
  margin-bottom: 24px;
}

.manuals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.manual-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.manual-card:hover {
  transform: translateY(-4px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(176, 141, 87, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
}

.red-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background-color: var(--danger);
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(255, 59, 48, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
}

.card-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.card-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.card-actions {
  margin-top: 24px;
  margin-top: auto;
}

.btn-secondary {
  display: inline-block;
  background: white;
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  color: var(--text-primary);
  text-decoration: none;
  text-align: center;
  width: 100%;
}

.btn-primary {
  background: var(--gold-gradient);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

/* Modal form styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 100%; max-width: 500px;
  padding: 32px;
}

.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block; font-size: 14px; margin-bottom: 8px; font-weight: 500;
}
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-secondary); color: var(--text-primary);
}
.modal-actions {
  display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px;
}
.btn-text { background: none; border: none; cursor: pointer; color: var(--text-secondary); }
</style>

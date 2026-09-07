<template>
  <div class="role-manager-container">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/team" class="back-link">← Volver al Panel de Liderazgo</router-link>
        <h1>Asignación de Roles y Permisos</h1>
        <p class="subtitle">Administración de jerarquías y estructura organizacional (Estilo Discord)</p>
      </div>
    </header>

    <div class="layout-grid">
      <!-- PANEL IZQUIERDO: Áreas y Roles -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <h3>Áreas y Roles</h3>
          <button class="btn-icon" title="Crear Área" @click="promptNewArea">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
        
        <div class="area-list">
          <div v-for="area in areas" :key="area.id" class="area-group">
            <div class="area-title">
              <span>{{ area.name }}</span>
              <button class="btn-text-small" @click="openCreateRoleModal(area.id)">+ Rol</button>
            </div>
            <ul class="role-list">
              <li 
                v-for="role in area.roles" 
                :key="role.id" 
                class="role-item"
                :class="{ active: selectedRole?.id === role.id }"
                @click="selectRole(role)"
              >
                <div class="role-indicator" :class="'level-' + role.access_level"></div>
                <span class="role-name">{{ role.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- PANEL PRINCIPAL: Detalles del Rol Seleccionado -->
      <main class="main-content glass-panel" v-if="selectedRole">
        <div class="role-details-header">
          <h2>{{ selectedRole.name }}</h2>
          <div class="access-level-badge" :class="'level-' + selectedRole.access_level">
            Nivel {{ selectedRole.access_level }}
          </div>
        </div>

        <section class="config-section">
          <h3>Nivel de Acceso (Permisos)</h3>
          <p class="help-text">Define qué datos e interfaces puede ver este rol en el sistema.</p>
          <div class="permissions-grid">
            <label class="radio-card" :class="{ selected: selectedRole.access_level === 1 }">
              <input type="radio" v-model="selectedRole.access_level" :value="1" @change="updateRoleLevel">
              <div class="card-content">
                <strong>Nivel 1: Ejecutivo</strong>
                <span>Acceso global a Leader Dashboard y todos los KPIs.</span>
              </div>
            </label>
            <label class="radio-card" :class="{ selected: selectedRole.access_level === 2 }">
              <input type="radio" v-model="selectedRole.access_level" :value="2" @change="updateRoleLevel">
              <div class="card-content">
                <strong>Nivel 2: Área</strong>
                <span>Dashboard de Área y gestión del equipo directo.</span>
              </div>
            </label>
            <label class="radio-card" :class="{ selected: selectedRole.access_level === 3 }">
              <input type="radio" v-model="selectedRole.access_level" :value="3" @change="updateRoleLevel">
              <div class="card-content">
                <strong>Nivel 3: Individual</strong>
                <span>Solo acceso a sus propias tareas, manuales y KPIs.</span>
              </div>
            </label>
          </div>
        </section>

        <section class="members-section">
          <div class="section-header">
            <h3>Miembros con este Rol ({{ roleMembers.length }})</h3>
            <button class="btn-secondary" @click="showAssignModal = true">Asignar Miembro</button>
          </div>
          
          <div class="members-list">
            <div v-if="roleMembers.length === 0" class="empty-state">
              No hay usuarios asignados a este rol.
            </div>
            <div v-for="member in roleMembers" :key="member.id" class="member-card">
              <div class="avatar">{{ member.full_name.charAt(0) }}</div>
              <div class="member-info">
                <span class="member-name">
                  {{ member.full_name }}
                  <span v-if="member.is_master_admin" class="admin-tag">Admin Master</span>
                </span>
                <span class="member-status" :class="{ pending: !member.mapping_completed }">
                  {{ member.mapping_completed ? 'Mapeo completo' : 'Pendiente de mapear su flujo' }}
                </span>
              </div>
              <button class="btn-danger-text" @click="removeMember(member.id)">Quitar</button>
            </div>
          </div>
        </section>
      </main>

      <div class="main-content glass-panel empty-selection" v-else>
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--border)" stroke-width="1" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <p>Selecciona un rol del panel izquierdo para configurar sus permisos y miembros.</p>
      </div>
    </div>

    <!-- Modal: Crear Cuenta de Acceso -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="glass-panel modal-content">
        <h3>Crear cuenta para "{{ selectedRole?.name }}"</h3>
        <p class="help-text">Se crea un acceso real (correo + contraseña) vinculado a este cargo.</p>

        <label class="field">
          Nombre completo
          <input v-model="newMember.full_name" type="text" placeholder="Nombre y apellido" />
        </label>
        <label class="field">
          Correo
          <input v-model="newMember.email" type="email" placeholder="persona@elitenutrition.com" />
        </label>
        <label class="field">
          Contraseña inicial
          <input v-model="newMember.password" type="text" placeholder="Mínimo 6 caracteres" />
        </label>
        <label class="field checkbox-field">
          <input type="checkbox" v-model="newMember.is_master_admin" />
          Admin Master (acceso total, incluido el Oráculo)
        </label>

        <p v-if="assignError" class="error-text">{{ assignError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeAssignModal">Cancelar</button>
          <button class="btn-primary" @click="createMember" :disabled="creatingMember">
            {{ creatingMember ? 'Creando...' : 'Crear cuenta' }}
          </button>
        </div>
      </div>
    </div>
    <!-- Modal: Crear Nuevo Rol -->
    <div v-if="showCreateRoleModal" class="modal-overlay" @click.self="closeCreateRoleModal">
      <div class="glass-panel modal-content">
        <h3>Crear Nuevo Rol</h3>
        <p class="help-text">Define los detalles del nuevo cargo organizacional.</p>

        <label class="field">
          Nombre del Cargo
          <input v-model="newRole.name" type="text" placeholder="Ej: Especialista de Datos" />
        </label>
        
        <label class="field">
          Área Funcional
          <select v-model="newRole.area_id" class="select-field">
            <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
          </select>
        </label>

        <label class="field">
          Objetivo del Cargo (Opcional)
          <textarea v-model="newRole.objective" placeholder="Describe brevemente el propósito de este rol en la empresa" rows="3" class="textarea-field"></textarea>
        </label>

        <label class="field" style="margin-top: 8px;">
          Nivel de Acceso (Permisos)
        </label>
        <div class="permissions-grid-small">
          <label class="radio-card-small" :class="{ selected: newRole.access_level === 1 }">
            <input type="radio" v-model="newRole.access_level" :value="1">
            <div class="card-content-small">
              <strong>Nivel 1</strong>
            </div>
          </label>
          <label class="radio-card-small" :class="{ selected: newRole.access_level === 2 }">
            <input type="radio" v-model="newRole.access_level" :value="2">
            <div class="card-content-small">
              <strong>Nivel 2</strong>
            </div>
          </label>
          <label class="radio-card-small" :class="{ selected: newRole.access_level === 3 }">
            <input type="radio" v-model="newRole.access_level" :value="3">
            <div class="card-content-small">
              <strong>Nivel 3</strong>
            </div>
          </label>
        </div>

        <p v-if="createRoleError" class="error-text">{{ createRoleError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeCreateRoleModal">Cancelar</button>
          <button class="btn-primary" @click="submitCreateRole" :disabled="creatingRole">
            {{ creatingRole ? 'Creando...' : 'Crear Rol' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/api/supabase'; // Assuming supabase instance

const areas = ref([]);
const selectedRole = ref(null);
const roleMembers = ref([]);
const showAssignModal = ref(false);
const creatingMember = ref(false);
const assignError = ref('');
const newMember = ref({ full_name: '', email: '', password: '', is_master_admin: false });

const showCreateRoleModal = ref(false);
const creatingRole = ref(false);
const createRoleError = ref('');
const newRole = ref({ name: '', area_id: null, access_level: 3, objective: '' });

const fetchData = async () => {
  // Fetch areas and roles
  const { data: areasData } = await supabase.from('areas').select('*, roles(*)').order('name');
  if (areasData) {
    areas.value = areasData;
  }
};

const selectRole = async (role) => {
  selectedRole.value = role;
  // Fetch members
  const { data: members } = await supabase.from('profiles').select('*').eq('role_id', role.id);
  roleMembers.value = members || [];
};

const updateRoleLevel = async () => {
  if (!selectedRole.value) return;
  const { error } = await supabase.from('roles').update({ access_level: selectedRole.value.access_level }).eq('id', selectedRole.value.id);
  if (error) {
    alert('No se pudo cambiar el nivel: ' + error.message);
  }
};

const removeMember = async (profileId) => {
  await supabase.from('profiles').update({ role_id: null }).eq('id', profileId);
  roleMembers.value = roleMembers.value.filter(m => m.id !== profileId);
};

const closeAssignModal = () => {
  showAssignModal.value = false;
  assignError.value = '';
  newMember.value = { full_name: '', email: '', password: '', is_master_admin: false };
};

const createMember = async () => {
  assignError.value = '';
  if (!newMember.value.full_name.trim() || !newMember.value.email.trim() || newMember.value.password.length < 6) {
    assignError.value = 'Completá nombre, correo y una contraseña de al menos 6 caracteres.';
    return;
  }
  if (!selectedRole.value) return;

  creatingMember.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/admin/create-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newMember.value.email.trim(),
        password: newMember.value.password,
        full_name: newMember.value.full_name.trim(),
        role_id: selectedRole.value.id,
        is_master_admin: newMember.value.is_master_admin
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'No se pudo crear la cuenta.');
    }
    closeAssignModal();
    await selectRole(selectedRole.value);
  } catch (e) {
    assignError.value = e.message;
  } finally {
    creatingMember.value = false;
  }
};

const promptNewArea = async () => {
  const name = prompt("Nombre de la nueva área:");
  if (name) {
    const { error } = await supabase.from('areas').insert([{ name }]);
    if (error) {
      alert('No se pudo crear el área: ' + error.message);
      return;
    }
    fetchData();
  }
};

const openCreateRoleModal = (areaId) => {
  newRole.value = { name: '', area_id: areaId, access_level: 3, objective: '' };
  createRoleError.value = '';
  showCreateRoleModal.value = true;
};

const closeCreateRoleModal = () => {
  showCreateRoleModal.value = false;
  createRoleError.value = '';
};

const submitCreateRole = async () => {
  createRoleError.value = '';
  if (!newRole.value.name.trim()) {
    createRoleError.value = 'El nombre del cargo es obligatorio.';
    return;
  }
  if (!newRole.value.area_id) {
    createRoleError.value = 'Debes seleccionar un área funcional.';
    return;
  }

  creatingRole.value = true;
  try {
    const { error } = await supabase.from('roles').insert([{ 
      name: newRole.value.name.trim(), 
      area_id: newRole.value.area_id, 
      access_level: newRole.value.access_level,
      objective: newRole.value.objective.trim() || null
    }]);
    
    if (error) throw error;
    
    closeCreateRoleModal();
    fetchData();
  } catch (err) {
    createRoleError.value = 'No se pudo crear el rol: ' + err.message;
  } finally {
    creatingRole.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.role-manager-container {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 8px;
  display: inline-block;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  min-height: 70vh;
}

.sidebar {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
}

.area-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.area-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-tertiary);
  padding: 8px;
  margin-top: 12px;
}

.btn-text-small {
  background: none;
  border: none;
  color: var(--gold);
  font-size: 11px;
  cursor: pointer;
}

.role-list {
  list-style: none;
}

.role-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 2px;
}

.role-item:hover {
  background: rgba(0,0,0,0.03);
}

.role-item.active {
  background: rgba(176, 141, 87, 0.1); /* Gold bg */
  color: var(--gold-deep);
  font-weight: 500;
}

.role-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
}

.level-1 { background: var(--danger); }
.level-2 { background: var(--warning); }
.level-3 { background: var(--success); }

.role-name {
  font-size: 14px;
}

.main-content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.empty-selection {
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-tertiary);
}

.role-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.access-level-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.config-section h3, .section-header h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.help-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.radio-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.radio-card input {
  position: absolute;
  opacity: 0;
}

.radio-card.selected {
  border-color: var(--gold);
  background: rgba(176, 141, 87, 0.05);
  box-shadow: 0 0 0 1px var(--gold);
}

.card-content strong {
  display: block;
  margin-bottom: 4px;
}
.card-content span {
  font-size: 12px;
  color: var(--text-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-secondary {
  background: white;
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--gold-deep);
  margin-right: 16px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 500;
  font-size: 14px;
}

.btn-danger-text {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 13px;
  cursor: pointer;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.admin-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: var(--gold-light);
  color: var(--gold-deep);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-status {
  font-size: 11px;
  color: var(--success);
}

.member-status.pending {
  color: var(--warning);
}

/* Modal Crear Cuenta */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  width: 90%;
  max-width: 420px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-content h3 {
  margin: 0;
  color: var(--ink);
  font-size: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field input[type="text"],
.field input[type="email"] {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
}

.field input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.checkbox-field input {
  width: 16px;
  height: 16px;
  accent-color: var(--gold);
}

.error-text {
  margin: 0;
  color: var(--danger);
  font-size: 0.82rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.modal-content .btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.modal-content .btn-primary:hover:not(:disabled) {
  background: #000;
}

.modal-content .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-field,
.textarea-field {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;
}

.textarea-field {
  resize: vertical;
  min-height: 80px;
}

.select-field:focus,
.textarea-field:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.permissions-grid-small {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.radio-card-small {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  text-align: center;
}

.radio-card-small input {
  position: absolute;
  opacity: 0;
}

.radio-card-small.selected {
  border-color: var(--gold);
  background: rgba(176, 141, 87, 0.05);
  box-shadow: 0 0 0 1px var(--gold);
  color: var(--gold-deep);
}

.card-content-small strong {
  font-size: 0.85rem;
}
</style>

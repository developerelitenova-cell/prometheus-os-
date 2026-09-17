<template>
  <div class="role-manager-container">
    <header class="page-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-link cursor-pointer">← Volver</button>
        <h1>Cargos y Permisos</h1>
        <p class="subtitle">Creá cargos, definí niveles de acceso y asigná a tu equipo dentro de cada área.</p>
      </div>
    </header>

    <div class="layout-grid">
      <!-- PANEL IZQUIERDO: Áreas y Roles -->
      <aside class="sidebar glass-panel">
        <div class="sidebar-header">
          <h3>Áreas y Roles</h3>
          <button class="btn-icon" title="Crear Área" @click="openNewAreaModal">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div class="area-list">
          <div v-for="area in areas" :key="area.id" class="area-group"
            @dragover.prevent
            @dragenter.prevent="handleDragEnter(area.id)"
            @dragleave.prevent="handleDragLeave(area.id)"
            @drop="handleDrop($event, area.id)"
            :class="{ 'drag-over': dragOverArea === area.id }">
            <div class="area-title">
              <span>{{ area.name }}</span>
              <div class="area-title-actions">
                <button class="btn-text-small" @click="openCreateRoleModal(area.id)">+ Rol</button>
                <button class="btn-icon-tiny danger" title="Eliminar área" @click="confirmDeleteArea(area)">
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <ul class="role-list">
              <li
                v-for="role in area.roles"
                :key="role.id"
                class="role-item"
                :class="{ active: selectedRole?.id === role.id }"
                @click="selectRole(role)"
                :draggable="isMaster"
                @dragstart="handleDragStart($event, role, area.id)"
              >
                <div class="role-indicator" :class="'level-' + role.access_level"></div>
                <span class="role-name">{{ role.name }}</span>
                <button class="btn-icon-tiny danger role-delete-btn" title="Eliminar cargo" @click.stop="confirmDeleteRole(role)">
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
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
            <label class="radio-card" :class="{ selected: pendingLevel === 1 }">
              <input type="radio" v-model="pendingLevel" :value="1">
              <div class="card-content">
                <strong>Nivel 1: Ejecutivo</strong>
                <span>Acceso global a Leader Dashboard y todos los KPIs.</span>
              </div>
            </label>
            <label class="radio-card" :class="{ selected: pendingLevel === 2 }">
              <input type="radio" v-model="pendingLevel" :value="2">
              <div class="card-content">
                <strong>Nivel 2: Área</strong>
                <span>Dashboard de Área y gestión del equipo directo.</span>
              </div>
            </label>
            <label class="radio-card" :class="{ selected: pendingLevel === 3 }">
              <input type="radio" v-model="pendingLevel" :value="3">
              <div class="card-content">
                <strong>Nivel 3: Individual</strong>
                <span>Solo acceso a sus propias tareas, manuales y KPIs.</span>
              </div>
            </label>
          </div>

          <!-- SECCIÓN: Delegación de Contraseñas (Auditoría / Master) -->
          <div class="delegation-container">
            <div class="section-title-row">
              <div>
                <h4>Gestión y Asignación de Contraseñas</h4>
                <p class="help-text">Autoriza a las personas con este cargo a proveer contraseñas, crear y administrar cuentas corporativas.</p>
              </div>
              <span v-if="selectedRoleIsAuditor" class="badge-auditor">Habilitado por defecto en Auditoría</span>
            </div>

            <div class="delegation-card" :class="{ active: pendingCanManagePasswords, disabled: !canDelegate || selectedRoleIsAuditor }">
              <label class="toggle-container">
                <input 
                  type="checkbox" 
                  v-model="pendingCanManagePasswords" 
                  :disabled="!canDelegate || selectedRoleIsAuditor"
                />
                <span class="toggle-slider"></span>
                <div class="toggle-labels">
                  <strong>Habilitar Tarea: Asignar y Brindar Contraseñas</strong>
                  <span class="text-xs text-secondary block mt-0.5">
                    {{ pendingCanManagePasswords ? 'Este rol tiene autorización para crear usuarios, asignar y restablecer contraseñas corporativas.' : 'Este rol no tiene autorización para brindar contraseñas.' }}
                  </span>
                  <span v-if="!canDelegate" class="text-xs text-amber-600 block mt-1 font-medium">
                    * Solo la Gerente de Auditoría o el Administrador Master pueden asignar o revocar esta tarea.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div class="save-level-row">
            <button
              class="btn-save-level"
              @click="saveRoleLevel"
              :disabled="savingLevel || (pendingLevel === selectedRole.access_level && pendingCanManagePasswords === initialCanManagePasswords)"
            >
              {{ savingLevel ? 'Guardando...' : 'Guardar Cambios de Permisos' }}
            </button>
            <span v-if="(pendingLevel !== selectedRole.access_level || pendingCanManagePasswords !== initialCanManagePasswords) && !savingLevel" class="unsaved-hint">Tenés cambios sin guardar</span>
            <span v-if="saveLevelMessage" class="save-success">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              {{ saveLevelMessage }}
            </span>
            <span v-if="saveLevelError" class="error-text">{{ saveLevelError }}</span>
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

    <!-- Modal: Crear Nueva Área -->
    <div v-if="showNewAreaModal" class="modal-overlay" @click.self="closeNewAreaModal">
      <div class="glass-panel modal-content">
        <h3>Crear Nueva Área</h3>
        <p class="help-text">Definí el nombre de la nueva área funcional.</p>

        <label class="field">
          Nombre del Área
          <input v-model="newAreaName" type="text" placeholder="Ej: Logística" @keyup.enter="submitCreateArea" />
        </label>

        <p v-if="newAreaError" class="error-text">{{ newAreaError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeNewAreaModal">Cancelar</button>
          <button class="btn-primary" @click="submitCreateArea" :disabled="creatingArea">
            {{ creatingArea ? 'Creando...' : 'Crear Área' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmar Eliminación (área o cargo) -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="glass-panel modal-content">
        <h3>¿Eliminar {{ deleteTarget.type === 'area' ? 'el área' : 'el cargo' }} "{{ deleteTarget.label }}"?</h3>
        <p class="help-text">Esta acción no se puede deshacer.</p>

        <p v-if="deleteError" class="error-text">{{ deleteError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeDeleteModal">Cancelar</button>
          <button class="btn-danger" @click="submitDelete" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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

const currentProfile = ref(null);
const isMaster = computed(() => !!currentProfile.value?.is_master_admin);
const isAuditorManager = computed(() => {
  const rName = currentProfile.value?.roles?.name?.toLowerCase() || '';
  return rName.includes('auditor');
});
const canDelegate = computed(() => isMaster.value || isAuditorManager.value);

const delegatedRoleIds = ref([]);
const pendingCanManagePasswords = ref(false);
const initialCanManagePasswords = ref(false);

const selectedRoleIsAuditor = computed(() => {
  const rName = selectedRole.value?.name?.toLowerCase() || '';
  return rName.includes('auditor');
});

const fetchDelegatedRoles = async () => {
  try {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const res = await fetch(`${apiUrl}/api/v1/admin/password-delegated-roles`);
    if (res.ok) {
      const data = await res.json();
      delegatedRoleIds.value = data.delegated_role_ids || [];
    }
  } catch (e) {
    console.error('Error fetching delegated roles:', e);
  }
};

const fetchCurrentProfile = async () => {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return;
  const { data } = await supabase
    .from('profiles')
    .select('is_master_admin, roles(name)')
    .eq('id', userId)
    .single();
  currentProfile.value = data || null;
};

const dragOverArea = ref(null);
const draggingRole = ref(null);
const draggingFromArea = ref(null);

const handleDragStart = (e, role, fromAreaId) => {
  if (!isMaster.value) {
    e.preventDefault();
    return;
  }
  draggingRole.value = role;
  draggingFromArea.value = fromAreaId;
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragEnter = (areaId) => {
  if (!isMaster.value) return;
  dragOverArea.value = areaId;
};

const handleDragLeave = (areaId) => {
  if (dragOverArea.value === areaId) {
    dragOverArea.value = null;
  }
};

const handleDrop = async (e, toAreaId) => {
  dragOverArea.value = null;
  if (!isMaster.value || !draggingRole.value) return;
  
  if (draggingFromArea.value === toAreaId) {
    draggingRole.value = null;
    return;
  }

  const roleId = draggingRole.value.id;
  draggingRole.value = null;

  try {
    const { error } = await supabase
      .from('roles')
      .update({ area_id: toAreaId })
      .eq('id', roleId);
      
    if (error) throw error;
    fetchData(); // Reload roles after moving
  } catch (err) {
    alert('Error al mover el rol: ' + err.message);
  }
};

const fetchData = async () => {
  // Fetch areas and roles
  const { data: areasData } = await supabase.from('areas').select('*, roles(*)').order('name');
  if (areasData) {
    areas.value = areasData;
  }
};

const selectRole = async (role) => {
  selectedRole.value = role;
  pendingLevel.value = role.access_level;
  
  const isDelegated = delegatedRoleIds.value.includes(role.id) || (role.name?.toLowerCase() || '').includes('auditor');
  pendingCanManagePasswords.value = isDelegated;
  initialCanManagePasswords.value = isDelegated;

  saveLevelMessage.value = '';
  saveLevelError.value = '';
  // Fetch members
  const { data: members } = await supabase.from('profiles').select('*').eq('role_id', role.id);
  roleMembers.value = members || [];
};

const pendingLevel = ref(null);
const savingLevel = ref(false);
const saveLevelMessage = ref('');
const saveLevelError = ref('');

const saveRoleLevel = async () => {
  if (!selectedRole.value || pendingLevel.value === null) return;
  savingLevel.value = true;
  saveLevelMessage.value = '';
  saveLevelError.value = '';
  try {
    // 1. Guardar nivel de acceso si cambió
    if (pendingLevel.value !== selectedRole.value.access_level) {
      const { data, error } = await supabase
        .from('roles')
        .update({ access_level: pendingLevel.value })
        .eq('id', selectedRole.value.id)
        .select('id, access_level');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Supabase no reportó ningún error, pero no se actualizó ninguna fila. Probablemente falten permisos (RLS) para editar cargos -- pedile a un desarrollador que corra fix_roles_areas_write_rls_migration.sql.');
      }
      selectedRole.value.access_level = pendingLevel.value;
    }

    // 2. Guardar delegación de contraseñas si cambió
    if (pendingCanManagePasswords.value !== initialCanManagePasswords.value && canDelegate.value) {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const res = await fetch(`${apiUrl}/api/v1/admin/roles/${selectedRole.value.id}/password-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_manage_passwords: pendingCanManagePasswords.value })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar permiso de contraseñas');
      }
      initialCanManagePasswords.value = pendingCanManagePasswords.value;
      if (pendingCanManagePasswords.value) {
        if (!delegatedRoleIds.value.includes(selectedRole.value.id)) {
          delegatedRoleIds.value.push(selectedRole.value.id);
        }
      } else {
        delegatedRoleIds.value = delegatedRoleIds.value.filter(id => id !== selectedRole.value.id);
      }
    }

    saveLevelMessage.value = 'Permisos actualizados correctamente.';
    setTimeout(() => { saveLevelMessage.value = ''; }, 4000);
  } catch (e) {
    saveLevelError.value = 'No se pudo guardar: ' + e.message;
  } finally {
    savingLevel.value = false;
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
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
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

const showNewAreaModal = ref(false);
const newAreaName = ref('');
const newAreaError = ref('');
const creatingArea = ref(false);

const openNewAreaModal = () => {
  newAreaName.value = '';
  newAreaError.value = '';
  showNewAreaModal.value = true;
};

const closeNewAreaModal = () => {
  showNewAreaModal.value = false;
};

const submitCreateArea = async () => {
  newAreaError.value = '';
  if (!newAreaName.value.trim()) {
    newAreaError.value = 'El nombre del área es obligatorio.';
    return;
  }
  creatingArea.value = true;
  try {
    const { error } = await supabase.from('areas').insert([{ name: newAreaName.value.trim() }]);
    if (error) throw error;
    showNewAreaModal.value = false;
    await fetchData();
  } catch (e) {
    newAreaError.value = 'No se pudo crear el área: ' + e.message;
  } finally {
    creatingArea.value = false;
  }
};

// --- Eliminar área / cargo ---
// La validación (¿tiene cargos/personas dependientes?) vive en el backend,
// no acá: es una operación destructiva y exclusiva de Admin Master.
const deleteTarget = ref(null); // { type: 'area' | 'role', id, label }
const deleting = ref(false);
const deleteError = ref('');

const confirmDeleteArea = (area) => {
  deleteError.value = '';
  deleteTarget.value = { type: 'area', id: area.id, label: area.name };
};

const confirmDeleteRole = (role) => {
  deleteError.value = '';
  deleteTarget.value = { type: 'role', id: role.id, label: role.name };
};

const closeDeleteModal = () => {
  deleteTarget.value = null;
  deleteError.value = '';
};

const submitDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const path = deleteTarget.value.type === 'area'
      ? `/api/v1/admin/areas/${deleteTarget.value.id}`
      : `/api/v1/admin/roles/${deleteTarget.value.id}`;

    const response = await fetch(`${apiUrl}${path}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'No se pudo eliminar.');

    if (deleteTarget.value.type === 'role' && selectedRole.value?.id === deleteTarget.value.id) {
      selectedRole.value = null;
      roleMembers.value = [];
    }
    deleteTarget.value = null;
    await fetchData();
  } catch (e) {
    deleteError.value = e.message;
  } finally {
    deleting.value = false;
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
  fetchCurrentProfile();
  fetchData();
  fetchDelegatedRoles();
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

.area-title-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-tiny {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon-tiny.danger:hover {
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger);
}

.role-list {
  list-style: none;
}

.area-group {
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  border-radius: var(--radius-sm);
}

.area-group.drag-over {
  background: rgba(176, 141, 87, 0.1);
  box-shadow: inset 0 0 0 2px var(--gold);
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

.role-delete-btn {
  margin-left: auto;
  opacity: 0;
  flex-shrink: 0;
}

.role-item:hover .role-delete-btn {
  opacity: 1;
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

.save-level-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn-save-level {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-level:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
}

.btn-save-level:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unsaved-hint {
  font-size: 0.8rem;
  color: var(--warning);
  font-weight: 600;
}

.save-success {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--success);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.btn-danger:disabled {
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

.delegation-container {
  margin: 24px 0;
  padding: 16px;
  background: var(--surface-secondary, rgba(0, 0, 0, 0.02));
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 12px);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.section-title-row h4 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
}

.badge-auditor {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

.delegation-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  padding: 14px;
  background: var(--surface);
  transition: all 0.2s;
}

.delegation-card.active {
  border-color: var(--gold);
  background: rgba(176, 141, 87, 0.04);
}

.delegation-card.disabled {
  opacity: 0.85;
}

.toggle-container {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  user-select: none;
}

.toggle-container input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #d1d5db;
  border-radius: 24px;
  transition: .3s;
  flex-shrink: 0;
  margin-top: 2px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: .3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-container input:checked + .toggle-slider {
  background-color: #10b981;
}

.toggle-container input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-container input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-labels strong {
  display: block;
  font-size: 0.9rem;
  color: var(--ink);
}
</style>

/* --- Responsive Global --- */
@media (max-width: 1024px) {
  .layout-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .permissions-matrix {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .permissions-matrix, .permissions-grid-small {
    grid-template-columns: 1fr;
  }
}

<template>
  <div class="mapa-de-cargos">
    <header class="glass-panel hub-header">
      <div class="header-left-nav" style="margin-bottom: 12px;">
        <router-link to="/" class="back-link" style="color: var(--gold-deep); text-decoration: none; font-size: 0.9rem;">← Volver al Inicio</router-link>
      </div>
      <div class="header-content">
        <h1>Mapa de Cargos</h1>
        <p class="subtitle">Directorio organizacional y base de conocimiento de procesos.</p>
        <p>Red de Arquitectura Organizacional ({{ roles.length }} Nodos)</p>
      </div>
      <div class="header-actions">
        <router-link v-if="isMaster" to="/knowledge-loader" class="btn-primary knowledge-btn"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path><path d="M6.002 6.5A3 3 0 0 1 5.603 5.125"></path><path d="M11.8 12a1 1 0 0 0-1.6 0"></path></svg> Inyectar Conocimiento</router-link>
        <button class="btn-primary" @click="fetchRoles">Actualizar Datos</button>
      </div>
    </header>

    <div class="hub-layout">
      <!-- Sidebar / Filters -->
      <aside class="glass-panel sidebar">
        <h3>Filtro por Áreas</h3>
        <ul>
          <li :class="{ active: activeArea === '' }" @click="activeArea = ''">
            Todas las Áreas
          </li>
          <li v-for="area in areas" :key="area" @click="activeArea = area" :class="{ active: activeArea === area }">
            {{ area }}
          </li>
        </ul>
      </aside>

      <!-- Main Content / Table -->
      <main class="glass-panel content">
        <div v-if="loading" class="empty-state">
          <TechLoader text="Sincronizando Nodos Neuronales" />
        </div>
        <div v-else-if="filteredRoles.length === 0" class="empty-state">
          <p>No se encontraron nodos que coincidan con la búsqueda.</p>
          <p>La red puede estar vacía o restringida por nivel de acceso.</p>
        </div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Área Funcional</th>
                <th>Nivel</th>
                <th>Flujo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in filteredRoles" :key="role.id">
                <td class="role-name">{{ role.name }}</td>
                <td>{{ role.areas?.name || 'General' }}</td>
                <td><span class="badge" :class="'level-' + role.access_level">Nivel {{ role.access_level }}</span></td>
                <td>
                  <span class="badge" :class="mappedRoleIds.has(role.id) ? 'badge-mapped' : 'badge-unmapped'">
                    {{ mappedRoleIds.has(role.id) ? 'Mapeado' : 'Sin mapear' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button class="btn-action-small btn-ghost" @click="openRoleDetails(role)">
                    <span title="Ver Detalles">👁️</span>
                  </button>
                  <router-link :to="`/mapper/${role.id}`" class="btn-action-small btn-gradient">Mapear Flujo</router-link>
                  <button class="btn-action-small btn-outline" @click="copyMapperLink(role)">
                    <span :title="copiedRoleId === role.id ? 'Copiado!' : 'Copiar enlace'">
                      {{ copiedRoleId === role.id ? '✓' : '🔗' }}
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- Role Details Modal -->
    <div v-if="selectedRole" class="modal-overlay" @click="closeRoleDetails">
      <div class="modal-content glass-panel" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedRole.name }}</h2>
          <button class="close-btn" @click="closeRoleDetails">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-group">
            <label>Área Funcional</label>
            <p>{{ selectedRole.areas?.name || 'General' }}</p>
          </div>
          <div class="detail-group">
            <label>Nivel de Acceso</label>
            <span class="badge" :class="'level-' + selectedRole.access_level">Nivel {{ selectedRole.access_level }}</span>
          </div>
          <div class="detail-group">
            <label>Flujo de Trabajo Mapeado</label>
            <div v-if="loadingWorkflow" class="hint">Cargando flujo...</div>
            <div v-else-if="!selectedWorkflow" class="empty-workflow">
              <p class="hint">Aún no hay nodos de información disponibles para este cargo.</p>
              <router-link :to="`/mapper/${selectedRole.id}`" class="btn-primary btn-small">Mapear Flujo</router-link>
            </div>
            <div v-else class="workflow-graph">
              <RoleGraph :role="selectedRole" :workflow="selectedWorkflow" />
            </div>
          </div>

          <div class="detail-group">
            <label>Gestión Diaria (memoria del cargo)</label>
            <p class="hint" style="margin-top: -4px; margin-bottom: 12px;">
              Las tareas que agregues aquí son las que cada persona con este cargo debe chulear en su Espacio Elite, todos los días/semanas/meses según la frecuencia.
            </p>

            <div v-if="loadingRoleTasks" class="hint">Cargando tareas...</div>

            <div v-else class="daily-mgmt">
              <div v-for="freq in FREQUENCIES" :key="freq" class="daily-mgmt-group">
                <h4 class="daily-mgmt-group-title">{{ FREQUENCY_LABELS[freq] }}</h4>

                <ul class="role-task-list">
                  <li v-for="task in tasksByFrequency[freq]" :key="task.id" :class="{ inactive: !task.active }">
                    <div class="role-task-main">
                      <span class="priority-dot" :class="task.priority"></span>
                      <div>
                        <span class="role-task-title">{{ task.title }}</span>
                        <p v-if="task.description" class="role-task-desc">{{ task.description }}</p>
                      </div>
                    </div>
                    <div v-if="canManageTasks" class="role-task-actions">
                      <button class="btn-text-small" @click="toggleTaskActive(task)">
                        {{ task.active ? 'Desactivar' : 'Reactivar' }}
                      </button>
                      <button class="btn-text-small" style="color: var(--danger);" @click="deleteRoleTask(task)">Eliminar</button>
                    </div>
                  </li>
                  <li v-if="tasksByFrequency[freq].length === 0" class="no-tasks">
                    Sin tareas {{ FREQUENCY_LABELS[freq].toLowerCase() }}s todavía.
                  </li>
                </ul>
              </div>

              <form v-if="canManageTasks" class="new-role-task-form" @submit.prevent="addRoleTask">
                <input type="text" v-model="newRoleTask.title" placeholder="Nueva tarea (ej: Cierre de caja)" required />
                <input type="text" v-model="newRoleTask.description" placeholder="Descripción (opcional)" />
                <select v-model="newRoleTask.frequency">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
                <select v-model="newRoleTask.priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
                <button type="submit" class="btn-primary btn-small" :disabled="savingRoleTask">Agregar</button>
              </form>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="closeRoleDetails">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import RoleGraph from '../components/RoleGraph.vue';
import TechLoader from '../components/TechLoader.vue';
import { FREQUENCIES, FREQUENCY_LABELS } from '../utils/taskPeriods';

const route = useRoute();

const roles = ref([]);
const loading = ref(true);
const activeArea = ref('');
const selectedRole = ref(null);
const mappedRoleIds = ref(new Set());
const selectedWorkflow = ref(null);
const loadingWorkflow = ref(false);
const copiedRoleId = ref(null);

// Perfil de quien mira el hub: determina si ve TODOS los cargos (admin
// master) o solo los de su propia área (líder Nivel 1/2), y si puede
// editar la Gestión Diaria del cargo abierto.
const currentProfile = ref(null);
const isMaster = computed(() => !!currentProfile.value?.is_master_admin);
const leaderAreaId = computed(() => currentProfile.value?.roles?.area_id || null);

const fetchCurrentProfile = async () => {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return;
  const { data } = await supabase
    .from('profiles')
    .select('is_master_admin, roles(area_id, access_level)')
    .eq('id', userId)
    .single();
  currentProfile.value = data || null;
};

// Fetch data from Supabase
const fetchRoles = async () => {
  loading.value = true;
  try {
    // Usamos el left join con la tabla areas para obtener el nombre del área
    let query = supabase.from('roles').select('*, areas(name)');
    // Un líder de área (no admin master) solo gestiona los cargos de su
    // propia área -- el admin master sigue viendo el organigrama completo.
    if (!isMaster.value && leaderAreaId.value) {
      query = query.eq('area_id', leaderAreaId.value);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching nodes:', error);
      alert('Error conectando con la red central: ' + error.message);
    } else {
      // Filtrar duplicados por nombre (para mantener el directorio limpio) y ordenar por área
      const uniqueRoles = [];
      const seenNames = new Set();
      for (const r of (data || [])) {
        if (!seenNames.has(r.name)) {
          seenNames.add(r.name);
          uniqueRoles.push(r);
        }
      }

      roles.value = uniqueRoles.sort((a, b) => {
        const areaA = a.areas?.name || '';
        const areaB = b.areas?.name || '';
        return areaA.localeCompare(areaB);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    loading.value = false;
  }
};

const fetchMappedRoleIds = async () => {
  const { data, error } = await supabase.from('role_workflows').select('role_id');
  if (!error && data) {
    mappedRoleIds.value = new Set(data.map((w) => w.role_id));
  }
};

onMounted(async () => {
  await fetchCurrentProfile();
  await fetchRoles();
  fetchMappedRoleIds();

  // Llegó desde "Editar Gestión Diaria del Cargo" en el Panel de Liderazgo:
  // abre directo el modal de ese cargo en vez de obligar a buscarlo en la tabla.
  const targetRoleId = route.query.role;
  if (targetRoleId) {
    const targetRole = roles.value.find((r) => r.id === targetRoleId);
    if (targetRole) openRoleDetails(targetRole);
  }
});

const areas = computed(() => {
  const allAreas = roles.value.map(r => r.areas?.name).filter(a => a);
  return [...new Set(allAreas)].sort();
});

const filteredRoles = computed(() => {
  if (!activeArea.value) return roles.value;
  return roles.value.filter(r => (r.areas?.name || 'General') === activeArea.value);
});

const openRoleDetails = async (role) => {
  selectedRole.value = role;
  selectedWorkflow.value = null;
  loadingWorkflow.value = true;
  try {
    const { data } = await supabase
      .from('role_workflows')
      .select('tasks, inputs, outputs, tools_used, bottlenecks, kpis')
      .eq('role_id', role.id)
      .maybeSingle();
    selectedWorkflow.value = data || null;
  } finally {
    loadingWorkflow.value = false;
  }
  await fetchRoleTasks(role.id);
};

const closeRoleDetails = () => {
  selectedRole.value = null;
  selectedWorkflow.value = null;
  roleTasks.value = [];
};

// --- Gestión Diaria (memoria del cargo) ---

const roleTasks = ref([]);
const loadingRoleTasks = ref(false);
const savingRoleTask = ref(false);
const newRoleTask = ref({ title: '', description: '', frequency: 'daily', priority: 'medium' });

// El admin master puede editar cualquier cargo; un líder solo el de su
// propia área (coincide con la política RLS role_task_templates_write).
const canManageTasks = computed(() => {
  if (isMaster.value) return true;
  if (!selectedRole.value || !leaderAreaId.value) return false;
  return selectedRole.value.area_id === leaderAreaId.value;
});

const tasksByFrequency = computed(() => {
  const grouped = { daily: [], weekly: [], monthly: [] };
  for (const t of roleTasks.value) {
    if (grouped[t.frequency]) grouped[t.frequency].push(t);
  }
  return grouped;
});

const fetchRoleTasks = async (roleId) => {
  loadingRoleTasks.value = true;
  try {
    const { data, error } = await supabase
      .from('role_task_templates')
      .select('*')
      .eq('role_id', roleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    roleTasks.value = data || [];
  } catch (err) {
    console.error('Error cargando tareas del cargo:', err);
    roleTasks.value = [];
  } finally {
    loadingRoleTasks.value = false;
  }
};

const addRoleTask = async () => {
  if (!selectedRole.value || !newRoleTask.value.title.trim()) return;
  savingRoleTask.value = true;
  try {
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from('role_task_templates').insert({
      role_id: selectedRole.value.id,
      title: newRoleTask.value.title.trim(),
      description: newRoleTask.value.description.trim() || null,
      frequency: newRoleTask.value.frequency,
      priority: newRoleTask.value.priority,
      created_by: session?.session?.user?.id || null
    });
    if (error) throw error;
    newRoleTask.value = { title: '', description: '', frequency: 'daily', priority: 'medium' };
    await fetchRoleTasks(selectedRole.value.id);
  } catch (err) {
    console.error('Error agregando tarea del cargo:', err);
    alert('No se pudo agregar la tarea: ' + err.message);
  } finally {
    savingRoleTask.value = false;
  }
};

const toggleTaskActive = async (task) => {
  const previous = task.active;
  task.active = !previous; // Optimista
  try {
    const { error } = await supabase
      .from('role_task_templates')
      .update({ active: task.active, updated_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) throw error;
  } catch (err) {
    task.active = previous;
    console.error('Error actualizando tarea del cargo:', err);
  }
};

const deleteRoleTask = async (task) => {
  if (!confirm(`¿Eliminar la tarea "${task.title}" de la Gestión Diaria de este cargo?`)) return;
  try {
    const { error } = await supabase.from('role_task_templates').delete().eq('id', task.id);
    if (error) throw error;
    roleTasks.value = roleTasks.value.filter((t) => t.id !== task.id);
  } catch (err) {
    console.error('Error eliminando tarea del cargo:', err);
    alert('No se pudo eliminar la tarea: ' + err.message);
  }
};

const copyMapperLink = async (role) => {
  const url = `${window.location.origin}/mapper/${role.id}`;
  try {
    await navigator.clipboard.writeText(url);
    copiedRoleId.value = role.id;
    setTimeout(() => {
      if (copiedRoleId.value === role.id) copiedRoleId.value = null;
    }, 2000);
  } catch (err) {
    console.error('No se pudo copiar el enlace:', err);
    alert(`Copia este enlace manualmente: ${url}`);
  }
};
</script>

<style scoped>
.data-hub {
  padding: 24px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: var(--shadow-sm);
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.knowledge-btn {
  background: var(--gold-gradient) !important;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.hub-header h1 {
  font-size: 1.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.hub-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.hub-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.sidebar {
  width: 280px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  /* Sin esto, un flex item no se deja encoger por debajo de la altura de su
     contenido, así que la lista de áreas de abajo (flex:1; overflow-y:auto)
     nunca llega a activar su propio scroll -- en su lugar empuja y hace
     scrollear la página completa cuando hay muchas áreas. */
  min-height: 0;
}

.sidebar h3 {
  margin-bottom: 16px;
  font-size: 1.1rem;
  color: var(--ink);
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.sidebar li {
  padding: 10px 16px;
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.sidebar li:hover {
  background: var(--bg-secondary);
  color: var(--ink);
}

.sidebar li.active {
  background: var(--gold-light);
  color: var(--gold-deep);
  border-left: 3px solid var(--gold);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--gold-deep);
}

.empty-state h3 {
  margin-bottom: 10px;
  color: var(--danger);
}

.empty-state p {
  color: var(--text-secondary);
}

.table-container {
  overflow-y: auto;
  flex: 1;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  position: sticky;
  top: 0;
  background: rgba(251, 251, 253, 0.95);
  padding: 20px 24px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  z-index: 10;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-subtle);
}

td {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  color: var(--ink-secondary);
  vertical-align: middle;
}

tr {
  transition: all 0.3s ease;
}

tr:hover td {
  background: var(--bg-secondary);
}

.role-name {
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 0.3px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-family: var(--font-mono);
}

.level-1 { background: rgba(255, 59, 48, 0.1); color: var(--danger); border: 1px solid rgba(255, 59, 48, 0.25); }
.level-2 { background: var(--gold-light); color: var(--gold-deep); border: 1px solid var(--gold-light); }
.level-3 { background: var(--bg-secondary); color: var(--gold); border: 1px solid var(--border-subtle); }
.level-4 { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-subtle); }

.badge-mapped { background: rgba(52, 199, 89, 0.1); color: var(--success); border: 1px solid rgba(52, 199, 89, 0.3); }
.badge-unmapped { background: var(--bg-secondary); color: var(--text-tertiary); border: 1px solid var(--border-subtle); }

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-edit {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.actions-cell {
  display: flex;
  gap: 12px;
  align-items: center;
  white-space: nowrap;
}

.btn-action-small {
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  letter-spacing: 0.5px;
}

.btn-gradient {
  background: var(--gold-gradient);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.btn-gradient:hover {
  opacity: 0.95;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-outline {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
}
.btn-outline:hover {
  border-color: var(--gold);
  background: var(--gold-light);
  color: var(--gold-deep);
  transform: translateY(-1px);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.1rem;
  padding: 8px;
  border-radius: 50%;
}
.btn-ghost:hover {
  color: var(--gold-deep);
  background: var(--gold-light);
  transform: scale(1.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 900px;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--ink);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--ink);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.detail-group {
  margin-bottom: 24px;
}

.detail-group label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.detail-group p {
  margin: 0;
  font-size: 1.1rem;
  color: var(--ink);
}

.hint {
  display: block;
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.empty-workflow {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.workflow-graph {
  width: 100%;
  margin-top: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
}

/* Gestión Diaria (memoria del cargo) */
.daily-mgmt {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.daily-mgmt-group-title {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: var(--gold-deep);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-task-list li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.role-task-list li.inactive {
  opacity: 0.5;
}

.role-task-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: var(--text-tertiary);
}

.priority-dot.high { background: var(--danger); }
.priority-dot.medium { background: var(--warning); }
.priority-dot.low { background: var(--success); }

.role-task-title {
  font-size: 0.92rem;
  color: var(--ink);
  font-weight: 600;
}

.role-task-desc {
  margin: 2px 0 0 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.role-task-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.new-role-task-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
}

.new-role-task-form input[type="text"] {
  flex: 1;
  min-width: 160px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
}

.new-role-task-form select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: inherit;
}

.btn-text-small {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>

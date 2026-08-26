<template>
  <div class="data-hub">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <h1>Centro de Mando & Recopilación</h1>
        <p>Directorio de Manuales de Cargo y Roles ({{ roles.length }} Registros)</p>
      </div>
      <div class="header-actions">
        <router-link to="/knowledge-loader" class="btn-primary knowledge-btn">🧠 Inyectar Conocimiento</router-link>
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
        <div v-if="loading" class="loading-state">
          <p>Sincronizando con Supabase...</p>
        </div>
        <div v-else-if="roles.length === 0" class="empty-state">
          <h3>No se encontraron roles</h3>
          <p>Puede deberse a permisos de lectura (RLS) en Supabase o a que la tabla está vacía.</p>
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
                  <button class="btn-edit" @click="openRoleDetails(role)">Detalles</button>
                  <router-link :to="`/mapper/${role.id}`" class="btn-primary btn-small">Mapear Flujo</router-link>
                  <button class="btn-edit" @click="copyMapperLink(role)">{{ copiedRoleId === role.id ? '✓ Copiado' : 'Copiar enlace' }}</button>
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
              <p class="hint">Este rol todavía no tiene su flujo de trabajo mapeado.</p>
              <router-link :to="`/mapper/${selectedRole.id}`" class="btn-primary btn-small">Mapear Flujo</router-link>
            </div>
            <div v-else class="workflow-summary">
              <div class="workflow-block" v-if="selectedWorkflow.tasks?.length">
                <label>Tareas</label>
                <ul><li v-for="(t, i) in selectedWorkflow.tasks" :key="i">{{ t }}</li></ul>
              </div>
              <div class="workflow-block" v-if="selectedWorkflow.inputs?.length">
                <label>Inputs</label>
                <ul><li v-for="(t, i) in selectedWorkflow.inputs" :key="i">{{ t }}</li></ul>
              </div>
              <div class="workflow-block" v-if="selectedWorkflow.outputs?.length">
                <label>Outputs</label>
                <ul><li v-for="(t, i) in selectedWorkflow.outputs" :key="i">{{ t }}</li></ul>
              </div>
              <div class="workflow-block" v-if="selectedWorkflow.tools_used?.length">
                <label>Herramientas</label>
                <div class="tags">
                  <span class="tag" v-for="(t, i) in selectedWorkflow.tools_used" :key="i">{{ t }}</span>
                </div>
              </div>
              <div class="workflow-block" v-if="selectedWorkflow.bottlenecks?.length">
                <label>Cuellos de botella</label>
                <ul><li v-for="(t, i) in selectedWorkflow.bottlenecks" :key="i" class="warning-item">{{ t }}</li></ul>
              </div>
              <div class="workflow-block" v-if="selectedWorkflow.kpis?.length">
                <label>KPIs</label>
                <ul><li v-for="(t, i) in selectedWorkflow.kpis" :key="i">{{ t }}</li></ul>
              </div>
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
import { supabase } from '../api/supabase';

const roles = ref([]);
const loading = ref(true);
const activeArea = ref('');
const selectedRole = ref(null);
const mappedRoleIds = ref(new Set());
const selectedWorkflow = ref(null);
const loadingWorkflow = ref(false);
const copiedRoleId = ref(null);

// Fetch data from Supabase
const fetchRoles = async () => {
  loading.value = true;
  try {
    // Usamos el left join con la tabla areas para obtener el nombre del área
    const { data, error } = await supabase
      .from('roles')
      .select('*, areas(name)');

    if (error) {
      console.error('Error fetching roles:', error);
      alert('Error cargando los roles de Supabase: ' + error.message);
    } else {
      // Ordenamos en memoria para evitar errores de orden en Supabase si no manejamos bien la relación
      roles.value = (data || []).sort((a, b) => {
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

onMounted(() => {
  fetchRoles();
  fetchMappedRoleIds();
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
};

const closeRoleDetails = () => {
  selectedRole.value = null;
  selectedWorkflow.value = null;
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
  background: #12121a;
  color: #fff;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
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
  background: linear-gradient(135deg, #ff3366, #ff7733) !important;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.hub-header h1 {
  font-size: 1.5rem;
  background: linear-gradient(90deg, #00f0ff, #7000ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.hub-header p {
  color: #999;
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
}

.sidebar h3 {
  margin-bottom: 16px;
  font-size: 1.1rem;
  color: #fff;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #a0a0a0;
  font-size: 0.9rem;
}

.sidebar li:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.sidebar li.active {
  background: rgba(0, 240, 255, 0.1);
  color: #00f0ff;
  border-left: 3px solid #00f0ff;
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
  color: #00f0ff;
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #ff3366;
}

.empty-state p {
  color: #999;
}

.table-container {
  overflow-y: auto;
  flex: 1;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  position: sticky;
  top: 0;
  background: rgba(18, 18, 26, 0.95);
  padding: 16px;
  text-align: left;
  font-weight: 500;
  color: #999;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 10;
  backdrop-filter: blur(4px);
}

td {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.role-name {
  font-weight: 500;
  color: #fff;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-1 { background: rgba(255, 51, 102, 0.2); color: #ff3366; }
.level-2 { background: rgba(112, 0, 255, 0.2); color: #a366ff; }
.level-3 { background: rgba(0, 240, 255, 0.2); color: #00f0ff; }
.level-4 { background: rgba(255, 255, 255, 0.1); color: #ccc; }

.badge-mapped { background: rgba(0, 255, 153, 0.15); color: #00ff99; }
.badge-unmapped { background: rgba(255, 255, 255, 0.08); color: #999; }

.btn-primary {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-edit {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #00f0ff;
  color: #00f0ff;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #1a1a24;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #00f0ff;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #fff;
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
  color: #999;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.detail-group p {
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
}

.hint {
  display: block;
  margin-top: 8px;
  color: #888;
  font-size: 0.8rem;
}

.empty-workflow {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.workflow-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-block {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 14px;
}

.workflow-block label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #00f0ff;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.workflow-block ul {
  margin: 0;
  padding-left: 18px;
  color: #ccc;
  font-size: 0.9rem;
}

.workflow-block li {
  margin-bottom: 6px;
}

.warning-item {
  color: #ff3366;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}
</style>

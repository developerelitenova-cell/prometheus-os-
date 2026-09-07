<template>
  <div class="dashboard-container">
    <header class="page-header">
      <div class="header-nav">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
      </div>
      <div class="header-main">
        <div class="header-content">
          <div class="title-row">
            <h1>{{ isMaster ? 'Ecosistema Global' : '¿Cómo va tu equipo?' }}</h1>
            <span class="role-badge master-badge" v-if="isMaster">ADMINISTRADOR GLOBAL</span>
            <span class="role-badge area-badge" v-else-if="leaderArea">Área: {{ leaderArea.name }}</span>
          </div>

        </div>
        <div class="header-actions" style="position: relative; z-index: 10;">
          <button v-if="unreadNotifCount > 0" class="btn-action btn-alert" @click="openApprovalsFromNotif">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            {{ unreadNotifCount }} Solicitud{{ unreadNotifCount > 1 ? 'es' : '' }}
          </button>
          <router-link v-if="isMaster" to="/roles" class="btn-action btn-primary-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Roles y Niveles
          </router-link>
          <router-link to="/kpis" class="btn-action btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            KPIs
          </router-link>
          <router-link to="/support-contacts" class="btn-action btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Directorio
          </router-link>
          <button class="btn-action btn-danger-outline" @click="handleSignOut" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Salir
          </button>
        </div>
      </div>
    </header>

    <div v-if="!isLeader" class="glass-panel error-panel">
      <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--danger)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h2>Acceso Restringido</h2>
      <p>Este módulo es exclusivo para líderes de área o directivos corporativos (Nivel 1 y 2).</p>
    </div>

    <div class="team-grid" v-else>
      <div class="dashboard-tabs">
        <button :class="{ active: currentTab === 'equipo' }" @click="currentTab = 'equipo'">Mi Equipo</button>
        <button :class="{ active: currentTab === 'aprobaciones' }" @click="currentTab = 'aprobaciones'">
          Aprobaciones Pendientes <span v-if="pendingUsers.length" class="badge">{{ pendingUsers.length }}</span>
        </button>
      </div>

      <template v-if="currentTab === 'equipo'">
        <div v-if="isMaster" class="system-stats-grid">
          <div class="stat-card glass-panel">
            <span class="stat-card-value">{{ systemStats.areas }}</span>
            <span class="stat-card-label">Áreas</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-card-value">{{ systemStats.roles }}</span>
            <span class="stat-card-label">Cargos</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-card-value">{{ teamMembers.length }}</span>
            <span class="stat-card-label">Colaboradores</span>
          </div>
          <div class="stat-card glass-panel" :class="{ 'stat-card-alert': pendingUsers.length > 0 }">
            <span class="stat-card-value">{{ pendingUsers.length }}</span>
            <span class="stat-card-label">Pendientes de Aprobación</span>
          </div>
        </div>

        <div v-if="teamMembers.length === 0" class="empty-state glass-panel">
          No hay trabajadores registrados{{ isMaster ? ' todavía' : ' en tu área' }}.
        </div>

        <div v-for="group in groupedTeam" :key="group.areaId" class="area-section">
          <h3 v-if="isMaster" class="area-section-title">
            {{ group.areaName }} <span class="area-count">{{ group.members.length }}</span>
          </h3>

          <div class="member-grid">
            <div v-for="member in group.members" :key="member.id" class="member-card glass-panel">
              <div class="member-header">
                <div class="avatar-large">{{ member.full_name.charAt(0) }}</div>
                <div class="info">
                  <h3>{{ member.full_name }}</h3>
                  <span class="role">
                    {{ member.roles?.name || 'Sin rol' }}
                    <span v-if="member.roles?.access_level" class="role-level-badge" :class="'level-' + member.roles.access_level">
                      Nivel {{ member.roles.access_level }}
                    </span>
                  </span>
                </div>
                <div class="score-badge" :class="getScoreColor(member.latest_score)">
                  {{ member.latest_score }}%
                </div>
              </div>

              <div class="member-body">
                <div class="stats-row">
                  <div class="stat">
                    <span class="label">Tareas Pendientes</span>
                    <span class="val">{{ member.pending_tasks_count }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Tareas Completadas</span>
                    <span class="val">{{ member.completed_tasks_count }}</span>
                  </div>
                </div>

                <div class="recent-activity">
                  <h4>Actividad Reciente</h4>
                  <ul class="task-list">
                    <li v-for="task in member.recent_tasks" :key="task.id" :class="task.status">
                      <span class="status-dot"></span>
                      <span class="task-title">{{ task.title }}</span>
                    </li>
                    <li v-if="!member.recent_tasks || member.recent_tasks.length === 0" class="no-tasks">
                      Sin actividad reciente.
                    </li>
                  </ul>
                </div>
              </div>

              <div class="member-footer">
                <button v-if="isMaster" class="btn-card-action danger-action" @click="auditWorkspace(member.id)" title="Auditar Espacio">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Auditar Espacio
                </button>
                <button v-else class="btn-card-action">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Ver Historial
                </button>
                <router-link
                  v-if="member.roles?.id"
                  class="btn-card-action primary-action"
                  :to="`/mapa-cargos?role=${member.roles.id}`"
                  title="Editar las tareas recurrentes de la memoria del cargo (Gestión Diaria)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Gestión Diaria
                </router-link>
                <button class="btn-card-action gold-action" @click="openTaskModal(member)">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  Asignar Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="currentTab === 'aprobaciones'">
        <div v-if="pendingUsers.length === 0" class="empty-state glass-panel">
          No hay usuarios pendientes de aprobación.
        </div>

        <div v-else class="member-grid">
          <div v-for="user in pendingUsers" :key="user.id" class="member-card pending-card glass-panel">
            <div class="member-header">
              <div class="avatar-large pending-avatar">{{ user.full_name.charAt(0) }}</div>
              <div class="info">
                <h3 class="pending-name">{{ user.full_name }}</h3>
                <span class="role pending-role">{{ user.roles?.name || 'Sin rol asignado' }}</span>
              </div>
            </div>
            <div class="member-body pending-body">
              <div class="info-row">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span><strong>Fecha de registro:</strong> {{ new Date(user.created_at).toLocaleDateString() }}</span>
              </div>
            </div>
            <div class="member-footer pending-footer">
              <button class="btn-reject" @click="handleApproval(user.id, 'rejected')">Rechazar</button>
              <button class="btn-approve" @click="handleApproval(user.id, 'approved')">Aprobar Acceso</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal Asignar Tarea (responsabilidad puntual del líder a una persona --
         distinta de la Gestión Diaria, que sale de la memoria del cargo) -->
    <div v-if="showTaskModal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h2>Asignar Tarea</h2>
        <p class="subtitle" v-if="selectedMember">Para: {{ selectedMember.full_name }}</p>

        <form @submit.prevent="submitTask" class="upload-form">
          <div class="form-group">
            <label>Título / Actividad</label>
            <input type="text" v-model="newTask.title" required placeholder="Ej: Revisión de inventario" />
          </div>

          <div class="form-group">
            <label>Descripción (Opcional)</label>
            <textarea v-model="newTask.description" rows="2"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Tipo</label>
              <div class="select-wrapper">
                <select v-model="newTask.task_type">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="project">Proyecto</option>
                  <option value="event">Evento</option>
                </select>
              </div>
            </div>
            
            <div class="form-group half">
              <label>Prioridad</label>
              <div class="select-wrapper">
                <select v-model="newTask.priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div class="form-group half">
              <label>Fecha de Vencimiento</label>
              <input type="date" v-model="newTask.due_date" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-action btn-outline" @click="closeTaskModal">Cancelar</button>
            <button type="submit" class="btn-action btn-gradient" :disabled="isSaving">
              <svg v-if="isSaving" class="spinner" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              {{ isSaving ? 'Guardando...' : 'Confirmar Asignación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/api/supabase';
import { signOut } from '@/api/auth';

const isLeader = ref(false);
const isMaster = ref(false);
const leaderArea = ref(null);
const teamMembers = ref([]);
const pendingUsers = ref([]);
const currentTab = ref('equipo');
const sysNotifications = ref([]);
const unreadNotifCount = computed(() => sysNotifications.value.filter(n => !n.is_read).length);
const areaNames = ref({});
const systemStats = ref({ areas: 0, roles: 0 });

// Para el admin master, el equipo se ve agrupado por área (visión real del
// organigrama completo); para un líder de área, un único grupo con su gente.
const groupedTeam = computed(() => {
  if (!isMaster.value) {
    return teamMembers.value.length
      ? [{ areaId: 'own', areaName: leaderArea.value?.name || '', members: teamMembers.value }]
      : [];
  }
  const groups = new Map();
  for (const member of teamMembers.value) {
    const areaId = member.roles?.area_id || 'sin-area';
    if (!groups.has(areaId)) {
      groups.set(areaId, {
        areaId,
        areaName: areaNames.value[areaId] || 'Sin área asignada',
        members: []
      });
    }
    groups.get(areaId).members.push(member);
  }
  return Array.from(groups.values()).sort((a, b) => a.areaName.localeCompare(b.areaName));
});

// Modal "Asignar Tarea": responsabilidad puntual que el líder le da a UNA
// persona (tabla `tasks`) -- distinta de la Gestión Diaria, que es la lista
// recurrente y estándar del cargo (memoria del cargo, editable en Mapa de
// Cargos y compartida por todos los que tienen ese cargo).
const showTaskModal = ref(false);
const selectedMember = ref(null);
const isSaving = ref(false);
const newTask = ref({
  title: '',
  description: '',
  task_type: 'daily',
  priority: 'medium',
  due_date: ''
});

const fetchData = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;
  const userId = session.session.user.id;

  // Obtener perfil del líder
  const { data: profile } = await supabase.from('profiles').select('*, roles(area_id, access_level)').eq('id', userId).single();
  
  if (profile?.is_master_admin) {
    isMaster.value = true;
    isLeader.value = true;
  } else if (profile?.roles?.access_level === 1 || profile?.roles?.access_level === 2) {
    isLeader.value = true;
  }

  if (isLeader.value) {
    let membersQuery = supabase
      .from('profiles')
      .select(`
        id, full_name,
        roles!inner(id, name, area_id, access_level)
      `)
      .neq('id', userId); // Excluirse a sí mismo

    if (!isMaster.value) {
      // Obtener área del líder
      const { data: area } = await supabase.from('areas').select('*').eq('id', profile.roles.area_id).single();
      leaderArea.value = area;
      membersQuery = membersQuery.eq('roles.area_id', profile.roles.area_id);
    } else {
      // Visión global: nombres de área (para agrupar el equipo) y conteo de cargos.
      const { data: areasData } = await supabase.from('areas').select('id, name');
      areaNames.value = Object.fromEntries((areasData || []).map(a => [a.id, a.name]));
      systemStats.value.areas = areasData?.length || 0;

      const { count: rolesCount } = await supabase.from('roles').select('id', { count: 'exact', head: true });
      systemStats.value.roles = rolesCount || 0;
    }

    const { data: members, error } = await membersQuery;

    if (members) {
      // Para cada miembro, traemos sus KPIs recientes y tareas
      const enrichedMembers = await Promise.all(members.map(async (m) => {
        // Traer KPI
        const { data: kpis } = await supabase.from('role_kpis')
          .select('overall_score')
          .eq('role_id', m.roles.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        const latestScore = kpis && kpis.length > 0 ? kpis[0].overall_score : 0;

        // Traer las tareas puntuales que el líder le asignó a esta persona
        // (tabla `tasks`) -- no confundir con la Gestión Diaria del cargo.
        const { data: tasks } = await supabase.from('tasks')
          .select('id, title, status')
          .eq('assigned_to', m.id)
          .order('created_at', { ascending: false });

        const pending = tasks?.filter(t => t.status !== 'completed').length || 0;
        const completed = tasks?.filter(t => t.status === 'completed').length || 0;
        const recent = tasks?.slice(0, 3) || [];

        return {
          ...m,
          latest_score: latestScore,
          pending_tasks_count: pending,
          completed_tasks_count: completed,
          recent_tasks: recent
        };
      }));
      teamMembers.value = enrichedMembers;
    }

    // Obtener usuarios pendientes de aprobación
    // Si es master admin, obtiene todos. Si es leader, solo de su área.
    let pendingQuery = supabase
      .from('profiles')
      .select('id, full_name, created_at, roles(name, area_id)')
      .eq('approval_status', 'pending');

    if (profile?.roles?.access_level !== 1 && !profile.is_master_admin) {
      pendingQuery = pendingQuery.eq('roles.area_id', profile.roles.area_id);
    }
    
    const { data: pUsers, error: pError } = await pendingQuery;
    if (pUsers && !pError) {
      pendingUsers.value = pUsers;
    }

    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .eq('type', 'new_registration')
      .order('created_at', { ascending: false })
      .limit(20);
    sysNotifications.value = notifs || [];
  }
};

const openApprovalsFromNotif = async () => {
  currentTab.value = 'aprobaciones';
  const unreadIds = sysNotifications.value.filter(n => !n.is_read).map(n => n.id);
  sysNotifications.value.forEach(n => { n.is_read = true; }); // Optimista
  if (unreadIds.length) {
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  }
};

const handleApproval = async (userId, status) => {
  const { error } = await supabase.from('profiles').update({ approval_status: status }).eq('id', userId);
  if (!error) {
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId);
    if (status === 'approved') {
      fetchData(); // Recargar equipo
    }
  } else {
    alert('Error al actualizar estado del usuario: ' + error.message);
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return 'good';
  if (score >= 50) return 'avg';
  return 'poor';
};

const openTaskModal = (member) => {
  selectedMember.value = member;
  newTask.value = { title: '', description: '', task_type: 'daily', priority: 'medium', due_date: '' };
  showTaskModal.value = true;
};

const closeTaskModal = () => {
  showTaskModal.value = false;
  selectedMember.value = null;
};

const submitTask = async () => {
  if (!selectedMember.value || !newTask.value.title) return;
  isSaving.value = true;

  try {
    const { data: session } = await supabase.auth.getSession();

    const taskPayload = {
      title: newTask.value.title,
      description: newTask.value.description,
      task_type: newTask.value.task_type,
      priority: newTask.value.priority,
      assigned_to: selectedMember.value.id,
      assigned_by: session.session.user.id,
      status: 'pending'
    };
    if (newTask.value.due_date) {
      taskPayload.due_date = newTask.value.due_date;
    }

    await supabase.from('tasks').insert(taskPayload);

    await supabase.from('notifications').insert({
      profile_id: selectedMember.value.id,
      type: 'new_task',
      message: `Te han asignado una nueva tarea: ${newTask.value.title}`
    });

    closeTaskModal();
    await fetchData(); // Refresh data
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

import { useRouter } from 'vue-router';
const router = useRouter();

const auditWorkspace = (employeeId) => {
  router.push(`/workspace?view_as=${employeeId}`);
};

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

onMounted(() => fetchData());
</script>

<style scoped>
.dashboard-container { padding: 32px; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
.header-nav .back-link { color: var(--gold-deep); text-decoration: none; font-size: 0.9rem; font-weight: 600; }
.header-nav .back-link:hover { text-decoration: underline; }
.header-main { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; }
.title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 6px; }
.title-row h1 { font-size: 32px; color: var(--text-primary); margin: 0; font-weight: 800; }

.role-badge { 
  padding: 6px 12px; 
  border-radius: var(--radius-pill); 
  font-size: 11px; 
  font-weight: 800; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
}
.master-badge { background: rgba(220, 38, 38, 0.1); color: var(--danger); border: 1px solid rgba(220, 38, 38, 0.2); }
.area-badge { background: var(--gold-light); color: var(--gold-deep); border: 1px solid var(--gold); }

.subtitle { color: var(--text-secondary); margin: 0; font-size: 1.05rem; }

.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-outline { background: var(--surface); border: 1px solid var(--border); color: var(--ink); }
.btn-outline:hover { background: var(--bg-secondary); border-color: var(--gold); color: var(--gold-deep); transform: translateY(-1px); }

.btn-primary-outline { background: rgba(176, 141, 87, 0.1); border: 1px solid var(--gold); color: var(--gold-deep); }
.btn-primary-outline:hover { background: var(--gold-light); transform: translateY(-1px); }

.btn-danger-outline { background: var(--surface); border: 1px solid var(--border); color: var(--danger); }
.btn-danger-outline:hover { background: rgba(220, 38, 38, 0.1); border-color: var(--danger); transform: translateY(-1px); }

.btn-alert { background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); color: var(--danger); }
.btn-alert:hover { background: rgba(220, 38, 38, 0.15); transform: translateY(-1px); }

.error-panel { padding: 48px; text-align: center; max-width: 500px; margin: 60px auto; color: var(--text-secondary); }
.error-panel h2 { color: var(--text-primary); margin: 16px 0 8px; }

.team-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.system-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-mono);
}

.stat-card-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  font-weight: 600;
}

.stat-card-alert .stat-card-value,
.stat-card-alert .stat-card-label {
  color: var(--danger);
}

.area-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.area-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--gold-deep);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.area-count {
  background: var(--gold-light);
  color: var(--gold-deep);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
}

.role-level-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.role-level-badge.level-1 { background: var(--danger); }
.role-level-badge.level-2 { background: var(--warning); }
.role-level-badge.level-3 { background: var(--success); }

.btn-manage-levels {
  background: rgba(176, 141, 87, 0.1);
  border-color: var(--gold);
  color: var(--gold-deep);
}
.btn-manage-levels:hover { background: var(--gold-light); }

.member-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.member-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gold-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin-right: 16px;
}

.info { flex: 1; }
.info h3 { font-size: 18px; margin-bottom: 4px; }
.info .role { font-size: 13px; color: var(--text-secondary); }

.score-badge {
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 16px;
}
.score-badge.good { background: rgba(52, 199, 89, 0.1); color: var(--success); }
.score-badge.avg { background: rgba(255, 149, 0, 0.1); color: var(--warning); }
.score-badge.poor { background: rgba(255, 59, 48, 0.1); color: var(--danger); }

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat .label { font-size: 11px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600; }
.stat .val { font-size: 24px; font-weight: 700; color: var(--text-primary); }

.recent-activity h4 { font-size: 14px; margin-bottom: 12px; color: var(--text-tertiary); text-transform: uppercase; }
.task-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.task-list li { display: flex; align-items: center; font-size: 14px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; }
li.completed .status-dot { background: var(--success); }
li.in_progress .status-dot { background: var(--warning); }
li.pending .status-dot { background: var(--border); }
li.completed .task-title { text-decoration: line-through; color: var(--text-tertiary); }
.no-tasks { color: var(--text-tertiary); font-style: italic; }

.member-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-card-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}
.btn-card-action:hover {
  background: var(--bg-secondary);
  border-color: var(--border-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}
.btn-card-action.danger-action:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(220, 38, 38, 0.05);
}
.btn-card-action.primary-action:hover {
  border-color: var(--gold);
  color: var(--gold-deep);
  background: var(--gold-light);
}
.btn-card-action.gold-action {
  background: var(--gold-gradient);
  border: none;
  color: white;
  box-shadow: 0 4px 10px rgba(176, 141, 87, 0.2);
}
.btn-card-action.gold-action:hover {
  box-shadow: 0 6px 15px rgba(176, 141, 87, 0.4);
  transform: translateY(-1px);
}


/* Premium Modal styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.3s ease; }
.premium-modal { width: 100%; max-width: 550px; padding: 40px; border-radius: var(--radius-lg); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.premium-modal h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
.modal-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px; }
.premium-form .form-group { margin-bottom: 20px; }
.premium-form .form-group label { display: block; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.premium-form .form-group label .required { color: var(--danger); }
.premium-form .form-group input, .premium-form .form-group textarea, .premium-form .form-group select { width: 100%; padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-tertiary); color: var(--text-primary); font-size: 0.95rem; font-family: inherit; transition: all 0.2s; }
.premium-form .form-group input:focus, .premium-form .form-group textarea:focus, .premium-form .form-group select:focus { border-color: var(--gold); outline: none; box-shadow: 0 0 0 3px rgba(176, 141, 87, 0.1); background: var(--surface); }
.premium-form .form-row { display: flex; gap: 20px; }
.premium-form .half { flex: 1; }
.select-wrapper { position: relative; }
.select-wrapper select { appearance: none; -webkit-appearance: none; }
.select-wrapper::after { content: "▼"; font-size: 10px; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-tertiary); }
.modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; border-top: 1px solid var(--border-subtle); padding-top: 24px; }
.btn-gradient { background: var(--gold-gradient); color: white; border: none; box-shadow: 0 4px 15px rgba(176, 141, 87, 0.3); }
.btn-gradient:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(176, 141, 87, 0.5); transform: translateY(-2px); }
.btn-gradient:disabled { opacity: 0.7; cursor: not-allowed; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.dashboard-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.dashboard-tabs button {
  background: var(--glass-bg);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-tabs button.active {
  background: var(--bg-tertiary);
  color: var(--ink);
  border-color: var(--ink);
}

.badge {
  background: var(--danger);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}
/* ---------------- APROBACIONES ESTILOS ---------------- */
.pending-card {
  background: linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%);
  border: 1px solid var(--border);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}
.pending-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 4px;
  background: linear-gradient(90deg, var(--gold-light), var(--gold));
}
.pending-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}
.pending-avatar {
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: white;
  box-shadow: 0 4px 15px rgba(176, 141, 87, 0.3);
}
.pending-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.pending-role {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: inline-block;
  margin-top: 4px;
}
.pending-body {
  padding-top: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 12px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.info-row svg {
  color: var(--gold);
}
.pending-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.btn-reject {
  background: transparent;
  color: var(--danger);
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-reject:hover {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.2);
}
.btn-approve {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
}
.btn-approve:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* --- Mobile Responsiveness --- */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  .system-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .member-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    width: 100%;
    justify-content: stretch;
  }
  .btn-action {
    flex: 1;
    justify-content: center;
  }
  .title-row h1 {
    font-size: 24px;
  }
  .dashboard-tabs {
    flex-direction: column;
    gap: 8px;
  }
  .dashboard-tabs button {
    width: 100%;
  }
}
</style>

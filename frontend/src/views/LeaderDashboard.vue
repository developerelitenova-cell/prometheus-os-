<template>
  <div class="dashboard-container">
    <header class="page-header">
      <div class="header-left-nav" style="margin-bottom: 12px;">
        <router-link to="/" class="back-link" style="color: var(--gold-deep); text-decoration: none; font-size: 0.9rem;">← Volver al Inicio</router-link>
      </div>
      <div class="header-content">
        <h1>{{ isMaster ? 'Ecosistema Global (Panel Master)' : '¿Cómo va tu equipo?' }}</h1>
        <p class="subtitle">{{ isMaster ? 'Visión omnisciente de toda la corporación.' : 'Visión general del desempeño, tareas y KPIs de tu área.' }}</p>
      </div>
      <div class="header-actions">
        <button v-if="unreadNotifCount > 0" class="btn-secondary-link notif-bell" @click="openApprovalsFromNotif">
          🔔 {{ unreadNotifCount }} nueva{{ unreadNotifCount > 1 ? 's' : '' }} solicitud{{ unreadNotifCount > 1 ? 'es' : '' }} de acceso
        </button>
        <router-link v-if="isMaster" to="/roles" class="btn-secondary-link btn-manage-levels">⚙️ Gestionar Roles y Niveles</router-link>
        <router-link to="/kpis" class="btn-secondary-link">📊 KPIs Reales</router-link>
        <router-link to="/support-contacts" class="btn-secondary-link">📇 Directorio de Soporte</router-link>
        <button class="btn-logout-global" @click="handleSignOut" title="Cerrar sesión">
          <span class="icon">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          Salir
        </button>
        <div class="area-badge" v-if="leaderArea && !isMaster">
          Área: <strong>{{ leaderArea.name }}</strong>
        </div>
        <div class="area-badge" v-if="isMaster" style="background: rgba(220, 38, 38, 0.1); color: var(--danger);">
          <strong>ADMINISTRADOR GLOBAL</strong>
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
                <button v-if="isMaster" class="btn-text-small primary" @click="auditWorkspace(member.id)" style="color: var(--danger);">🕵️‍♂️ Auditar Espacio</button>
                <button v-else class="btn-text-small">Ver Historial Completo</button>
                <router-link
                  v-if="member.roles?.id"
                  class="btn-text-small"
                  :to="`/mapa-cargos?role=${member.roles.id}`"
                  title="Editar las tareas recurrentes de la memoria del cargo (Gestión Diaria)"
                >
                  Gestión Diaria del Cargo
                </router-link>
                <button class="btn-text-small primary" @click="openTaskModal(member)">Asignar Tarea</button>
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
          <div v-for="user in pendingUsers" :key="user.id" class="member-card glass-panel">
            <div class="member-header">
              <div class="avatar-large">{{ user.full_name.charAt(0) }}</div>
              <div class="info">
                <h3>{{ user.full_name }}</h3>
                <span class="role">{{ user.roles?.name || 'Sin rol asignado' }}</span>
              </div>
            </div>
            <div class="member-body" style="padding-top: 12px; font-size: 0.9rem;">
              <p><strong>Fecha de registro:</strong> {{ new Date(user.created_at).toLocaleDateString() }}</p>
            </div>
            <div class="member-footer">
              <button class="btn-text-small" @click="handleApproval(user.id, 'rejected')" style="color: var(--danger)">Rechazar</button>
              <button class="btn-text-small primary" @click="handleApproval(user.id, 'approved')" style="background: #10b981; color: white;">Aprobar Acceso</button>
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
              <select v-model="newTask.task_type">
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="project">Proyecto</option>
                <option value="event">Evento</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Prioridad</label>
              <select v-model="newTask.priority">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Fecha de Vencimiento (Opcional)</label>
            <input type="date" v-model="newTask.due_date" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-text-small" @click="closeTaskModal">Cancelar</button>
            <button type="submit" class="btn-text-small primary" :disabled="isSaving" style="padding: 8px 16px; background: var(--gold-gradient); color: white; border-radius: var(--radius-sm);">Guardar</button>
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
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.header-content h1 { font-size: 28px; color: var(--text-primary); margin-bottom: 4px; }
.subtitle { color: var(--text-secondary); }
.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.btn-secondary-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--ink);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-secondary-link:hover { background: var(--bg-secondary); border-color: var(--gold); color: var(--gold-deep); }
.notif-bell {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.3);
  color: var(--danger);
  cursor: pointer;
  font-family: inherit;
}
.notif-bell:hover { background: rgba(220, 38, 38, 0.14); border-color: var(--danger); color: var(--danger); }
.area-badge { padding: 8px 16px; background: rgba(176, 141, 87, 0.1); color: var(--gold-deep); border-radius: var(--radius-pill); font-size: 14px; }

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
  justify-content: space-between;
}
.btn-text-small { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-secondary); text-decoration: none; }
.btn-text-small.primary { color: var(--gold); }

/* Modal form styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { width: 100%; max-width: 500px; padding: 32px; }
.modal-content h2 { margin-top: 0; margin-bottom: 4px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); }
.form-row { display: flex; gap: 16px; }
.half { flex: 1; }
.modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
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
</style>

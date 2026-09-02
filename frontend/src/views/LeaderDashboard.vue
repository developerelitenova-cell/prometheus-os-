<template>
  <div class="dashboard-container">
    <header class="page-header">
      <div class="header-content">
        <h1>¿Cómo va tu equipo?</h1>
        <p class="subtitle">Visión general del desempeño, tareas y KPIs de tu área.</p>
      </div>
      <div class="area-badge" v-if="leaderArea">
        Área: <strong>{{ leaderArea.name }}</strong>
      </div>
    </header>

    <div v-if="!isLeader" class="glass-panel error-panel">
      <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--danger)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h2>Acceso Restringido</h2>
      <p>Este módulo es exclusivo para líderes de área o directivos corporativos (Nivel 1 y 2).</p>
    </div>

    <div class="team-grid" v-else>
      <div v-if="teamMembers.length === 0" class="empty-state glass-panel">
        No hay trabajadores registrados en tu área.
      </div>
      
      <div v-for="member in teamMembers" :key="member.id" class="member-card glass-panel">
        <div class="member-header">
          <div class="avatar-large">{{ member.full_name.charAt(0) }}</div>
          <div class="info">
            <h3>{{ member.full_name }}</h3>
            <span class="role">{{ member.roles?.name || 'Sin rol' }}</span>
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
          <button class="btn-text-small">Ver Historial Completo</button>
          <button class="btn-text-small primary" @click="openTaskModal(member)">Configurar Checklists / Tarea</button>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Tarea / Checklist -->
    <div v-if="showTaskModal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h2>Asignar Checklist / Tarea</h2>
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
              <label>Tipo de Checklist</label>
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
import { ref, onMounted } from 'vue';
import { supabase } from '@/api/supabase';

const isLeader = ref(false);
const leaderArea = ref(null);
const teamMembers = ref([]);

// Task Modal State
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
  
  if (profile?.roles?.access_level === 1 || profile?.roles?.access_level === 2) {
    isLeader.value = true;
    
    // Obtener área
    const { data: area } = await supabase.from('areas').select('*').eq('id', profile.roles.area_id).single();
    leaderArea.value = area;

    // Obtener miembros del equipo (roles en la misma área)
    // Para simplificar, buscamos los perfiles cuyos roles pertenecen a esta área.
    const { data: members, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name,
        roles!inner(name, area_id)
      `)
      .eq('roles.area_id', profile.roles.area_id)
      .neq('id', userId); // Excluir al líder mismo

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

        // Traer Tareas
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
    
    // Insert task
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
    
    // Notifications
    await supabase.from('notifications').insert({
      profile_id: selectedMember.value.id,
      type: 'new_task',
      message: `Te han asignado un nuevo checklist/tarea: ${newTask.value.title}`
    });
    
    closeTaskModal();
    await fetchData(); // Refresh data
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => fetchData());
</script>

<style scoped>
.dashboard-container { padding: 32px; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.header-content h1 { font-size: 28px; color: var(--text-primary); margin-bottom: 4px; }
.subtitle { color: var(--text-secondary); }
.area-badge { padding: 8px 16px; background: rgba(176, 141, 87, 0.1); color: var(--gold-deep); border-radius: var(--radius-pill); font-size: 14px; }

.error-panel { padding: 48px; text-align: center; max-width: 500px; margin: 60px auto; color: var(--text-secondary); }
.error-panel h2 { color: var(--text-primary); margin: 16px 0 8px; }

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

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
.btn-text-small { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-secondary); }
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
</style>

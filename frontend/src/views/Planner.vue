<template>
  <div class="planner-container">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/workspace" class="back-link">← Volver a Mi Espacio</router-link>
        <h1>Planner y Productividad</h1>
        <p class="subtitle">Gestiona tus tareas diarias, semanales y mensuales.</p>
      </div>
      <div class="header-actions">
        <div class="filter-group">
          <button :class="{ active: currentView === 'daily' }" @click="currentView = 'daily'">Diario</button>
          <button :class="{ active: currentView === 'weekly' }" @click="currentView = 'weekly'">Semanal</button>
          <button :class="{ active: currentView === 'monthly' }" @click="currentView = 'monthly'">Mensual</button>
        </div>
        <button class="btn-primary" @click="showNewTaskModal = true">+ Nueva Tarea</button>
      </div>
    </header>

    <div class="kanban-board">
      <!-- Columna Pendientes -->
      <div class="kanban-col glass-panel">
        <div class="col-header">
          <h3>Pendientes</h3>
          <span class="count">{{ pendingTasks.length }}</span>
        </div>
        <div class="task-list">
          <div v-for="task in pendingTasks" :key="task.id" class="task-card">
            <div class="task-header">
              <span class="priority-badge" :class="task.priority">{{ task.priority }}</span>
              <button class="btn-icon" @click="updateTaskStatus(task, 'in_progress')" title="Empezar">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
            </div>
            <h4>{{ task.title }}</h4>
            <p>{{ task.description }}</p>
            <div class="task-footer">
              <span class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
                Vence: {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna En Progreso -->
      <div class="kanban-col glass-panel">
        <div class="col-header">
          <h3>En Progreso</h3>
          <span class="count">{{ inProgressTasks.length }}</span>
        </div>
        <div class="task-list">
          <div v-for="task in inProgressTasks" :key="task.id" class="task-card in-progress">
            <div class="task-header">
              <span class="priority-badge" :class="task.priority">{{ task.priority }}</span>
              <div class="actions">
                <button class="btn-icon" @click="updateTaskStatus(task, 'pending')" title="Pausar">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                </button>
                <button class="btn-icon success" @click="updateTaskStatus(task, 'completed')" title="Completar">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            </div>
            <h4>{{ task.title }}</h4>
            <div class="task-footer">
              <span class="due-date">Vence: {{ formatDate(task.due_date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Completadas -->
      <div class="kanban-col glass-panel">
        <div class="col-header">
          <h3>Completadas</h3>
          <span class="count">{{ completedTasks.length }}</span>
        </div>
        <div class="task-list">
          <div v-for="task in completedTasks" :key="task.id" class="task-card completed">
            <div class="task-header">
              <span class="priority-badge" :class="task.priority">{{ task.priority }}</span>
            </div>
            <h4><del>{{ task.title }}</del></h4>
            <div class="task-footer">
              <span class="due-date success-text">Hecho</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Tarea -->
    <div v-if="showNewTaskModal" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h2>Nueva Tarea</h2>
        <form @submit.prevent="createTask" class="upload-form">
          <div class="form-group">
            <label>Título</label>
            <input type="text" v-model="newTask.title" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newTask.description" rows="3"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Prioridad</label>
              <select v-model="newTask.priority">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Fecha Límite (Due Date)</label>
              <input type="date" v-model="newTask.due_date" required>
            </div>
          </div>

          <div class="form-group" v-if="canAssign">
            <label>Asignar a:</label>
            <select v-model="newTask.assigned_to">
              <option :value="currentUser.id">Mí Mismo</option>
              <option v-for="m in teamMembers" :key="m.id" :value="m.id">{{ m.full_name }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-text" @click="showNewTaskModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="isSaving">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/api/supabase';

const tasks = ref([]);
const currentView = ref('daily'); // daily, weekly, monthly
const currentUser = ref(null);
const canAssign = ref(false);
const teamMembers = ref([]);

const showNewTaskModal = ref(false);
const isSaving = ref(false);

const newTask = ref({
  title: '', description: '', priority: 'medium', due_date: '', assigned_to: null, task_type: 'daily'
});

const fetchData = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;
  const userId = session.session.user.id;

  const { data: profile } = await supabase.from('profiles').select('*, roles(area_id, access_level)').eq('id', userId).single();
  currentUser.value = profile;
  newTask.value.assigned_to = userId;

  if (profile?.roles?.access_level === 1 || profile?.roles?.access_level === 2) {
    canAssign.value = true;
    const { data: m } = await supabase.from('profiles').select('id, full_name, roles!inner(area_id)').eq('roles.area_id', profile.roles.area_id);
    teamMembers.value = m || [];
  }

  const { data: t } = await supabase.from('tasks').select('*').eq('assigned_to', userId);
  tasks.value = t || [];
};

// Computed Properties para filtrar
const filteredTasks = computed(() => {
  const now = new Date();
  return tasks.value.filter(task => {
    if (!task.due_date) return true;
    const due = new Date(task.due_date);
    if (currentView.value === 'daily') {
      return due.toDateString() === now.toDateString() || isOverdue(task.due_date);
    } else if (currentView.value === 'weekly') {
      const diff = Math.abs(due - now) / (1000 * 60 * 60 * 24);
      return diff <= 7 || isOverdue(task.due_date);
    } else {
      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear() || isOverdue(task.due_date);
    }
  });
});

const pendingTasks = computed(() => filteredTasks.value.filter(t => t.status === 'pending' || !t.status));
const inProgressTasks = computed(() => filteredTasks.value.filter(t => t.status === 'in_progress'));
const completedTasks = computed(() => filteredTasks.value.filter(t => t.status === 'completed'));

const createTask = async () => {
  isSaving.value = true;
  try {
    const { data: session } = await supabase.auth.getSession();
    await supabase.from('tasks').insert([{
      ...newTask.value,
      assigned_by: session.session.user.id,
      status: 'pending'
    }]);
    
    // Si asignó a otra persona, crear notificacion
    if (newTask.value.assigned_to !== session.session.user.id) {
      await supabase.from('notifications').insert([{
        profile_id: newTask.value.assigned_to,
        type: 'new_task',
        message: `Te han asignado una nueva tarea: ${newTask.value.title}`
      }]);
    }

    showNewTaskModal.value = false;
    newTask.value = { title: '', description: '', priority: 'medium', due_date: '', assigned_to: currentUser.value.id, task_type: 'daily' };
    fetchData();
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

const updateTaskStatus = async (task, newStatus) => {
  const oldStatus = task.status;
  task.status = newStatus; // optimistic UI update
  try {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  } catch (e) {
    task.status = oldStatus;
  }
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

onMounted(() => fetchData());
</script>

<style scoped>
.planner-container { padding: 32px; max-width: 1400px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.header-content h1 { font-size: 28px; color: var(--text-primary); }
.subtitle { color: var(--text-secondary); }
.back-link { color: var(--gold-deep); text-decoration: none; font-size: 0.85rem; margin-bottom: 8px; display: inline-block; }

.header-actions { display: flex; gap: 16px; align-items: center; }
.filter-group { display: flex; background: var(--bg-secondary); border-radius: var(--radius-pill); padding: 4px; }
.filter-group button { 
  background: transparent; border: none; padding: 6px 16px; border-radius: var(--radius-pill); 
  font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
}
.filter-group button.active { background: white; color: var(--text-primary); box-shadow: var(--shadow-sm); }

.btn-primary { background: var(--gold-gradient); color: white; border: none; padding: 8px 24px; border-radius: var(--radius-pill); font-weight: 600; cursor: pointer; }

.kanban-board {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; flex: 1; min-height: 0;
}

.kanban-col {
  display: flex; flex-direction: column; border-radius: var(--radius-md); padding: 16px;
  background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
}

.col-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
.col-header h3 { font-size: 16px; font-weight: 600; }
.count { background: var(--bg-secondary); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }

.task-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px; }

.task-card {
  background: white; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px;
  box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px;
  transition: transform 0.2s;
}
.task-card:hover { transform: translateY(-2px); }

.task-header { display: flex; justify-content: space-between; align-items: center; }
.priority-badge { font-size: 10px; text-transform: uppercase; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.priority-badge.low { background: var(--bg-secondary); color: var(--text-secondary); }
.priority-badge.medium { background: rgba(255, 149, 0, 0.1); color: var(--warning); }
.priority-badge.high { background: rgba(255, 59, 48, 0.1); color: var(--danger); }

.task-card h4 { font-size: 15px; margin: 0; line-height: 1.3; }
.task-card p { font-size: 13px; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.task-footer { margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--border-subtle); display: flex; justify-content: space-between; align-items: center; }
.due-date { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }
.due-date.overdue { color: var(--danger); font-weight: 700; }
.success-text { color: var(--success); }

.btn-icon { background: var(--bg-secondary); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; cursor: pointer; color: var(--text-primary); transition: background 0.2s; }
.btn-icon:hover { background: var(--border); }
.btn-icon.success { color: var(--success); background: rgba(52, 199, 89, 0.1); }
.btn-icon.success:hover { background: rgba(52, 199, 89, 0.2); }

.actions { display: flex; gap: 8px; }

/* Modal form styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { width: 100%; max-width: 500px; padding: 32px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); }
.form-row { display: flex; gap: 16px; }
.half { flex: 1; }
.modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
.btn-text { background: none; border: none; cursor: pointer; color: var(--text-secondary); }
</style>

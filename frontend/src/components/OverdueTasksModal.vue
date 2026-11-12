<template>
  <div
    v-if="visible"
    data-testid="overdue-tasks-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="overdue-modal-title"
    class="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
  >
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#ff3b30]/30 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header Alerta -->
      <div class="px-6 py-5 bg-gradient-to-r from-[#ff3b30] to-[#d70015] text-white flex items-start gap-4">
        <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[28px]">notification_important</span>
        </div>
        <div class="flex-1">
          <span class="inline-block text-[10px] font-bold uppercase tracking-widest bg-black/25 px-2.5 py-0.5 rounded-full mb-1.5">
            Recordatorio Obligatorio de Inicio de Día
          </span>
          <h2 id="overdue-modal-title" class="text-xl font-bold leading-snug">
            Tienes {{ tasks.length }} {{ tasks.length === 1 ? 'tarea vencida pendiente' : 'tareas vencidas pendientes' }}
          </h2>
          <p class="text-xs text-white/90 mt-1">
            Estas actividades superaron su fecha límite (hora America/Bogota) y requieren atención inmediata.
          </p>
        </div>
      </div>

      <!-- Lista de Tareas Vencidas -->
      <div class="p-6 overflow-y-auto space-y-3 bg-[#f5f5f7]/60 flex-1">
        <div
          v-for="task in tasks"
          :key="task.id"
          data-testid="overdue-task-item"
          class="bg-white rounded-2xl border border-[#ffcdd2] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span
                class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                :class="priorityClass(task.priority)"
              >
                {{ priorityLabel(task.priority) }}
              </span>
              <span class="text-[11px] font-semibold text-[#d70015] flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">event_busy</span>
                Venció: {{ formatDueDate(task.due_date) }}
                <span v-if="daysLate(task.due_date) > 0">
                  ({{ daysLate(task.due_date) }} {{ daysLate(task.due_date) === 1 ? 'día' : 'días' }} de atraso)
                </span>
              </span>
            </div>
            <h3 class="text-sm font-bold text-[#1d1d1f] leading-snug">{{ task.title }}</h3>
            <p v-if="task.description" class="text-xs text-[#86868b] mt-0.5 line-clamp-2">{{ task.description }}</p>
          </div>

          <button
            type="button"
            @click="$emit('resolve-task', task)"
            class="shrink-0 px-3.5 py-2 rounded-xl bg-[#ffebee] hover:bg-[#ffcdd2] text-[#c62828] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[15px]">edit_note</span>
            <span>Gestionar</span>
          </button>
        </div>
      </div>

      <!-- Footer de Confirmación Obligatoria -->
      <div class="px-6 py-4 bg-white border-t border-[#e5e5ea] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-[11px] text-[#86868b]">
          Al confirmar lectura podrás continuar con tu espacio de trabajo por el resto del día.
        </p>
        <button
          type="button"
          data-testid="overdue-ack-button"
          @click="$emit('acknowledge')"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1d1d1f] hover:bg-[#3a3a3c] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Entendido, revisaré mis tareas vencidas</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getDaysOverdueBogota } from '../utils/bogotaTime';

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tasks: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['acknowledge', 'resolve-task']);

const daysLate = (dueDate) => getDaysOverdueBogota(dueDate);

const formatDueDate = (dueDate) => {
  if (!dueDate) return '-';
  return String(dueDate).slice(0, 10);
};

const priorityLabel = (p) => {
  const map = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };
  return map[p] || 'Media';
};

const priorityClass = (p) => {
  if (p === 'urgent') return 'bg-red-100 text-red-800 border border-red-200';
  if (p === 'high') return 'bg-orange-100 text-orange-800 border border-orange-200';
  if (p === 'low') return 'bg-gray-100 text-gray-600 border border-gray-200';
  return 'bg-amber-100 text-amber-800 border border-amber-200';
};
</script>


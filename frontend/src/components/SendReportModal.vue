<template>
  <div
    v-if="modelValue"
    data-testid="send-report-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="send-report-title"
    class="fixed inset-0 z-[135] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    @click.self="close"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#e5e5ea] overflow-hidden flex flex-col max-h-[92vh]"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[#e5e5ea] bg-[#fbfbfd] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#b08d57]/15 text-[#8a6d3d] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[22px]">forward_to_inbox</span>
          </div>
          <div>
            <h3 id="send-report-title" class="text-base font-bold text-[#1d1d1f]">
              Enviar Reporte al Jefe Inmediato
            </h3>
            <p class="text-xs text-[#86868b]">
              Notificación oficial en plataforma + descarga de archivo adjuntable
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="close"
          class="w-8 h-8 rounded-full hover:bg-[#e5e5ea]/60 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <!-- Resumen de la Jornada -->
        <div class="rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Jornada</span>
            <span class="text-xs sm:text-sm font-bold text-[#1d1d1f] mt-0.5 block">{{ dateStr }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Cumplimiento KPI</span>
            <span
              class="text-sm sm:text-base font-black mt-0.5 block"
              :class="Number(kpiScore) >= 85 ? 'text-[#248a3d]' : Number(kpiScore) >= 65 ? 'text-[#b46b00]' : 'text-[#c62828]'"
            >
              {{ kpiScore }}%
            </span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Actividades</span>
            <span class="text-xs sm:text-sm font-bold text-[#1d1d1f] mt-0.5 block">
              {{ completedCount }} / {{ totalCount }}
            </span>
          </div>
        </div>

        <!-- Selector de Jefe Inmediato -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Destinatario (Jefe Inmediato / Líder) *
          </label>
          <div v-if="loadingSupervisors" class="p-3 rounded-xl bg-[#f5f5f7] text-xs text-[#86868b] flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            <span>Identificando jefe inmediato...</span>
          </div>
          <select
            v-else-if="supervisors.length > 0"
            v-model="selectedSupervisorId"
            data-testid="supervisor-select"
            class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#b08d57]"
          >
            <option v-for="sup in supervisors" :key="sup.id" :value="sup.id">
              {{ sup.full_name }} · {{ sup.roleName }} ({{ sup.relationLabel }})
            </option>
          </select>
          <div v-else class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            No se encontró un perfil de líder en tu área en este momento. Igualmente puedes descargar el archivo o abrir Outlook para enviarlo por correo.
          </div>
        </div>

        <!-- Formato de Archivo de Respaldo -->
        <div class="space-y-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Formato de Archivo para Respaldo
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="fmt in formatOptions"
              :key="fmt.key"
              type="button"
              @click="selectedFormat = fmt.key"
              :class="[
                'py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                selectedFormat === fmt.key
                  ? 'border-[#b08d57] bg-[#b08d57]/10 text-[#8a6d3d]'
                  : 'border-[#e5e5ea] bg-white text-[#5e6c84] hover:border-[#b08d57]/40',
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">{{ fmt.icon }}</span>
              <span>{{ fmt.label }}</span>
            </button>
          </div>
          <label class="flex items-center gap-2 text-xs text-[#5e6c84] pt-1 cursor-pointer select-none">
            <input type="checkbox" v-model="autoDownload" class="rounded border-gray-300 text-[#b08d57]" />
            <span>Descargar copia del archivo en mi equipo al enviar</span>
          </label>
        </div>

        <!-- Notas / Comentario para el Jefe -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Observaciones o Comentarios (Opcional)
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Ej: Novedades del día, bloqueos resueltos o solicitud de feedback..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#b08d57]"
          ></textarea>
        </div>

        <!-- Mensaje de error / estado -->
        <div v-if="errorMsg" class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {{ errorMsg }}
        </div>

        <!-- Acceso directo secundario a Outlook Webmail -->
        <div class="pt-1 flex items-center justify-between gap-2 text-[11px] text-[#86868b]">
          <span>¿Deseas además adjuntar el archivo vía correo corporativo?</span>
          <a
            :href="outlookComposeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#0078d4] font-bold hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span class="material-symbols-outlined text-[14px]">mail</span>
            <span>Abrir Outlook</span>
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-[#fbfbfd] border-t border-[#e5e5ea] flex items-center justify-end gap-2">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 text-xs font-bold text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          data-testid="confirm-send-supervisor-btn"
          :disabled="sending || !selectedSupervisorId"
          @click="submitSend"
          class="px-5 py-2.5 rounded-xl bg-[#b08d57] hover:bg-[#8a6d3d] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="sending" class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-[16px]">send</span>
          <span>{{ sending ? 'Enviando...' : 'Enviar Reporte Oficial' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { sendReportToSupervisor } from '../utils/notifications';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  role: { type: Object, default: null },
  dateStr: { type: String, default: '' },
  kpiScore: { type: [Number, String], default: 0 },
  completedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  unfulfilledCount: { type: Number, default: 0 },
  supervisors: { type: Array, default: () => [] },
  loadingSupervisors: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'sent', 'export-file']);

const selectedSupervisorId = ref('');
const selectedFormat = ref('excel');
const autoDownload = ref(true);
const notes = ref('');
const sending = ref(false);
const errorMsg = ref('');

const formatOptions = [
  { key: 'excel', label: 'Excel (.xlsx)', icon: 'table_view' },
  { key: 'word', label: 'Word (.doc)', icon: 'description' },
  { key: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
];

const selectedSupervisor = computed(() =>
  (props.supervisors || []).find((s) => s.id === selectedSupervisorId.value) || null
);

watch(
  () => [props.modelValue, props.supervisors],
  () => {
    if (props.modelValue) {
      errorMsg.value = '';
      if (!selectedSupervisorId.value || !(props.supervisors || []).some((s) => s.id === selectedSupervisorId.value)) {
        selectedSupervisorId.value = props.supervisors?.[0]?.id || '';
      }
    }
  },
  { immediate: true, deep: true }
);

const outlookComposeUrl = computed(() => {
  const empName = props.profile?.full_name || 'Colaborador';
  const roleName = props.role?.name || 'Cargo Operativo';
  const toEmail = selectedSupervisor.value?.email || '';
  const subject = `[Nova Work] Reporte de Cumplimiento · ${empName} (${props.dateStr})`;
  const body =
    `Cordial saludo${selectedSupervisor.value?.full_name ? ' ' + selectedSupervisor.value.full_name : ''},\n\n` +
    `Comparto mi informe operativo correspondiente a la jornada ${props.dateStr}:\n` +
    `- Colaborador: ${empName}\n` +
    `- Cargo: ${roleName}\n` +
    `- Cumplimiento KPI: ${props.kpiScore}% (${props.completedCount}/${props.totalCount} completadas)\n` +
    (notes.value.trim() ? `- Observaciones: ${notes.value.trim()}\n` : '') +
    `\nAdjunto archivo de respaldo exportado desde Nova Work.`;
  const params = new URLSearchParams({ subject, body });
  if (toEmail) params.set('to', toEmail);
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
});

const close = () => {
  emit('update:modelValue', false);
};

const submitSend = async () => {
  if (!selectedSupervisorId.value) {
    errorMsg.value = 'Por favor selecciona un supervisor destinatario.';
    return;
  }

  sending.value = true;
  errorMsg.value = '';
  try {
    if (autoDownload.value) {
      emit('export-file', selectedFormat.value);
    }

    const result = await sendReportToSupervisor({
      supervisorId: selectedSupervisorId.value,
      supervisorName: selectedSupervisor.value?.full_name || 'Jefe Inmediato',
      supervisorEmail: selectedSupervisor.value?.email || '',
      employeeId: props.profile?.id,
      employeeName: props.profile?.full_name || 'Colaborador',
      roleName: props.role?.name || 'Cargo Operativo',
      dateStr: props.dateStr,
      compliancePercentage: Number(props.kpiScore),
      completedTasks: props.completedCount,
      totalTasks: props.totalCount,
      unfulfilledTasks: props.unfulfilledCount,
      exportFormat: selectedFormat.value,
      notes: notes.value,
    });

    if (!result.ok) {
      errorMsg.value = result.error || 'No fue posible entregar la notificación al supervisor.';
      return;
    }

    emit('sent', {
      supervisor: selectedSupervisor.value,
      format: selectedFormat.value,
      result,
    });
    notes.value = '';
    emit('update:modelValue', false);
  } catch (err) {
    errorMsg.value = err?.message || 'Error inesperado enviando el reporte.';
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>

<template>
  <div
    v-if="modelValue"
    data-testid="portal-tutorial-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tutorial-modal-title"
    class="fixed inset-0 z-[135] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in"
    @click.self="dismissTutorial"
  >
    <div
      class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#e5e5ea] overflow-hidden flex flex-col max-h-[92vh]"
      @click.stop
    >
      <!-- Cabecera Corporativa -->
      <div class="px-6 py-5 bg-gradient-to-r from-[#1d1d1f] via-[#2c2c2e] to-[#3a352c] text-white flex items-start justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-[#b08d57]/25 border border-[#b08d57]/50 text-[#f3dfb6] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[24px]">{{ activeStep.icon }}</span>
          </div>
          <div>
            <span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#b08d57]/30 text-[#f3dfb6] px-2.5 py-0.5 rounded-full">
              Guía Interactiva · Mi Portal · Paso {{ currentStep + 1 }} de {{ steps.length }}
            </span>
            <h2 id="tutorial-modal-title" class="text-lg sm:text-xl font-bold leading-snug mt-1.5">
              {{ activeStep.title }}
            </h2>
            <p class="text-xs text-gray-300 mt-0.5">
              Bienvenido, <strong class="text-white">{{ userName || 'Colaborador' }}</strong> · {{ roleName || 'Espacio Operativo' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="dismissTutorial"
          class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          title="Cerrar guía"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <!-- Barra de Progreso -->
      <div class="h-1.5 w-full bg-[#f5f5f7]">
        <div
          class="h-full bg-gradient-to-r from-[#b08d57] to-[#0071e3] transition-all duration-300"
          :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
        ></div>
      </div>

      <!-- Cuerpo del Paso Actual -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <p class="text-sm text-[#1d1d1f] leading-relaxed">
          {{ activeStep.summary }}
        </p>

        <!-- Vista Visual Especial según Paso -->
        <div v-if="currentStep === 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-1.5">
            <div class="flex items-center gap-2 text-xs font-bold text-[#1d1d1f]">
              <span class="material-symbols-outlined text-[#34c759] text-[18px]">checklist</span>
              <span>Timeline Secuencial</span>
            </div>
            <p class="text-[12px] text-[#5e6c84] leading-snug">
              Avanza en orden cronológico (#1, #2, #3...) completando tus actividades rutinarias o justificando si hubo un bloqueo.
            </p>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#fff8f0] border border-[#b08d57]/30 space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-[#1d1d1f]">
              <span class="material-symbols-outlined text-[#c62828] text-[18px]">radar</span>
              <span>Prioridades y Alertas</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">Urgente</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Alta</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Media</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Baja</span>
            </div>
          </div>
        </div>

        <div v-else-if="currentStep === 1" class="space-y-3">
          <div class="p-3.5 rounded-2xl bg-[#fff5f5] border border-red-200 flex items-center justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                <span class="material-symbols-outlined text-[13px]">photo_camera</span>
                Evidencia Obligatoria · Foto
              </span>
              <p class="text-xs text-[#5e6c84] mt-1.5">
                Requiere adjuntar pantallazo o foto y nota antes de cerrar la actividad. Tip: puedes pegar capturas con <strong>Ctrl+V / Cmd+V</strong>.
              </p>
            </div>
          </div>
          <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <span class="material-symbols-outlined text-[13px]">edit_note</span>
                Evidencia Obligatoria · Nota
              </span>
              <p class="text-xs text-[#5e6c84] mt-1.5">
                Exige redactar un breve resumen o enlace de entrega en texto; la fotografía es opcional.
              </p>
            </div>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                <span class="material-symbols-outlined text-[13px]">check_circle</span>
                Evidencia Opcional
              </span>
              <p class="text-xs text-[#5e6c84] mt-1.5">
                Marcado rápido en un clic sin archivos obligatorios (útil para rutinas verificables directamente).
              </p>
            </div>
          </div>
        </div>

        <div v-else-if="currentStep === 2" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#34c759]/30 space-y-1.5">
            <span class="material-symbols-outlined text-[#248a3d] text-[22px]">task_alt</span>
            <h4 class="text-xs font-bold text-[#1d1d1f]">1. Cerrar Día</h4>
            <p class="text-[11px] text-[#5e6c84]">Consolida el porcentaje de cumplimiento y congela el historial de auditoría.</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5">
            <span class="material-symbols-outlined text-[#0071e3] text-[22px]">download</span>
            <h4 class="text-xs font-bold text-[#1d1d1f]">2. Exportar Informe</h4>
            <p class="text-[11px] text-[#5e6c84]">Descarga tu gestión diaria en <strong>PDF Oficial</strong>, <strong>Excel (.xlsx)</strong> o <strong>Word (.doc)</strong>.</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#fff8f0] border border-[#b08d57]/30 space-y-1.5">
            <span class="material-symbols-outlined text-[#8a6d3d] text-[22px]">forward_to_inbox</span>
            <h4 class="text-xs font-bold text-[#1d1d1f]">3. Enviar al Jefe</h4>
            <p class="text-[11px] text-[#5e6c84]">Notifica en un clic a tu jefe inmediato el resumen de tu jornada cerrada.</p>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-[#fbfbfd] border border-[#b08d57]/30 space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-[#1d1d1f]">
              <span class="material-symbols-outlined text-[#b08d57] text-[20px]">smart_toy</span>
              <span>Agente Nova Work (Derecha)</span>
            </div>
            <p class="text-[12px] text-[#5e6c84] leading-snug">
              Usa los <strong>botones de acción rápida</strong> sobre la caja de texto para pedir prioridades del día, redactar correos, armar minutas o guardar reglas de tu puesto.
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-[#fbfbfd] border border-[#0071e3]/25 space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-[#1d1d1f]">
              <span class="material-symbols-outlined text-[#0071e3] text-[20px]">monitoring</span>
              <span>Pestaña «Mis KPIs»</span>
            </div>
            <p class="text-[12px] text-[#5e6c84] leading-snug">
              Cambia entre vistas <strong>Semanal (7d)</strong>, <strong>Quincenal (15d)</strong> y <strong>Mensual (30d)</strong> para revisar tu gráfico y exportar reportes de feedback.
            </p>
          </div>
        </div>

        <!-- Puntos navegables -->
        <div class="flex items-center justify-center gap-2 pt-2">
          <button
            v-for="(s, idx) in steps"
            :key="s.key"
            type="button"
            @click="currentStep = idx"
            :class="[
              'h-2 rounded-full transition-all cursor-pointer',
              currentStep === idx ? 'w-7 bg-[#b08d57]' : 'w-2 bg-[#d1d1d6] hover:bg-[#86868b]',
            ]"
            :aria-label="`Ir al paso ${idx + 1}`"
          ></button>
        </div>
      </div>

      <!-- Footer de Acciones -->
      <div class="px-6 py-4 bg-[#fbfbfd] border-t border-[#e5e5ea] flex items-center justify-between gap-3">
        <button
          type="button"
          @click="dismissTutorial"
          class="px-3 py-2 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
        >
          Omitir tutorial
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="currentStep > 0"
            type="button"
            @click="currentStep -= 1"
            class="px-4 py-2 rounded-xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] text-xs font-bold text-[#1d1d1f] cursor-pointer"
          >
            Anterior
          </button>

          <button
            v-if="currentStep < steps.length - 1"
            type="button"
            data-testid="tutorial-next-btn"
            @click="currentStep += 1"
            class="px-5 py-2 rounded-xl bg-[#1d1d1f] hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Siguiente</span>
            <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>

          <button
            v-else
            type="button"
            data-testid="tutorial-finish-btn"
            @click="finishTutorial"
            class="px-5 py-2 rounded-xl bg-[#34c759] hover:bg-[#2fb34f] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
            <span>¡Entendido, empezar!</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  roleName: { type: String, default: '' },
  userName: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'completed']);

const currentStep = ref(0);

const steps = [
  {
    key: 'timeline',
    icon: 'view_timeline',
    title: '1. Tu Jornada Cronológica, Prioridades y Alertas',
    summary:
      'En el centro encuentras tus actividades ordenadas secuencialmente, los pendientes asignados por tu líder y el Radar de Atención Inmediata que te avisa reuniones próximas, compromisos vencidos y tareas urgentes.',
  },
  {
    key: 'evidence',
    icon: 'verified',
    title: '2. Evidencias: Saber Cuáles Son Obligatorias y Cuáles Opcionales',
    summary:
      'Cada tarjeta te indica antes de hacer clic si requiere soporte obligatorio o si es de verificación opcional. Así nunca pierdes tiempo dudando qué adjuntar.',
  },
  {
    key: 'export',
    icon: 'ios_share',
    title: '3. Cierre Diario, Exportación (PDF / Excel / Word) y Envío al Jefe',
    summary:
      'Al terminar tu gestión puedes consolidar el día, descargar el archivo oficial en el formato que prefieras y notificar directamente a tu jefe inmediato sin pasos manuales.',
  },
  {
    key: 'ai_kpis',
    icon: 'psychology',
    title: '4. Tu Agente IA Especializado y Gráficos KPI',
    summary:
      'A la derecha tienes un asistente entrenado en las funciones de tu cargo con botones rápidos de consulta. Además, en la pestaña "Mis KPIs" podrás monitorear tu rendimiento semanal, quincenal y mensual.',
  },
];

const activeStep = computed(() => steps[currentStep.value] || steps[0]);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      currentStep.value = 0;
    }
  }
);

const dismissTutorial = () => {
  emit('completed');
  emit('update:modelValue', false);
};

const finishTutorial = () => {
  emit('completed');
  emit('update:modelValue', false);
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

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" @paste="handlePaste">
    <div class="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#e5e5ea]" @click.stop>
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between bg-[#fbfbfd]">
        <div class="flex items-center gap-3">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isViewingExisting
              ? (existingStatus === 'completed' ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-[#fff0f0] text-[#ff3b30]')
              : (selectedAction === 'completed' ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-[#fff0f0] text-[#ff3b30]')
          ]">
            <span class="material-symbols-outlined text-[22px]">
              {{ isViewingExisting 
                ? (existingStatus === 'completed' ? 'verified' : 'error') 
                : (selectedAction === 'completed' ? 'task_alt' : 'cancel') 
              }}
            </span>
          </div>
          <div>
            <h3 class="text-[16px] font-bold text-[#1d1d1f] leading-tight">
              {{ isViewingExisting ? 'Trazabilidad y Evidencia del Pendiente' : 'Gestionar y Marcar Pendiente' }}
            </h3>
            <p class="text-[12px] text-[#86868b] mt-0.5">
              {{ task?.title || 'Detalles de la entrega' }}
            </p>
          </div>
        </div>
        <button @click="close" class="w-8 h-8 rounded-full hover:bg-[#e5e5ea]/60 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="overflow-y-auto flex-1 px-6 py-5 space-y-5">
        
        <!-- Tarjeta de Información de la Tarea -->
        <div class="bg-[#f5f5f7] rounded-xl p-3.5 border border-[#e5e5ea]/80">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block mb-1">
                {{ taskTypeName }}
              </span>
              <p class="text-[14px] font-semibold text-[#1d1d1f]">{{ task?.title }}</p>
              <p v-if="task?.description" class="text-[12px] text-[#86868b] mt-1">{{ task?.description }}</p>
            </div>
            <span v-if="task?.priority" :class="['text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
              task.priority === 'urgent' ? 'bg-red-600 text-white' :
              task.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-gray-200 text-gray-700']">
              {{ task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : 'Normal' }}
            </span>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             MODO 1: VER TRAZABILIDAD EXISTENTE (Tarea ya marcada)
        ════════════════════════════════════════════════════════ -->
        <div v-if="isViewingExisting" class="space-y-4">
          <!-- Status Banner -->
          <div :class="['p-3.5 rounded-xl border flex items-center justify-between',
            existingStatus === 'completed' ? 'bg-[#e8f8ed]/70 border-[#34c759]/30 text-[#248a3d]' : 'bg-[#fff0f0] border-[#ff3b30]/30 text-[#d70015]']">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">
                {{ existingStatus === 'completed' ? 'check_circle' : 'cancel' }}
              </span>
              <span class="text-[13px] font-bold">
                {{ existingStatus === 'completed' ? 'Pendiente Marcado como Realizado' : 'Pendiente No Ejecutado' }}
              </span>
            </div>
            <span v-if="existingCompletedAt" class="text-[11px] font-medium opacity-80">
              {{ formatDateTime(existingCompletedAt) }}
            </span>
          </div>

          <!-- Texto de Evidencia o Motivo -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
              {{ existingStatus === 'completed' ? 'Evidencia / Resumen de Ejecución' : 'Motivo / Causa de No Ejecución' }}
            </label>
            <div class="p-3.5 rounded-xl bg-white border border-[#e5e5ea] text-[13px] text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
              {{ existingStatus === 'completed' ? (task?.evidence_text || 'Sin detalle de texto') : (task?.cancellation_reason || 'Sin motivo especificado') }}
            </div>
          </div>

          <!-- Pantallazo / Foto de soporte -->
          <div v-if="task?.evidence_photo" class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex items-center justify-between">
              <span>Soporte Gráfico / Pantallazo Adjunto</span>
              <button @click="showFullscreen = true" class="text-[#0071e3] hover:underline text-[11px] font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">fullscreen</span> Ampliar
              </button>
            </label>
            <div class="relative rounded-xl overflow-hidden border border-[#e5e5ea] bg-black/5 group cursor-pointer max-h-72 flex items-center justify-center"
                 @click="showFullscreen = true">
              <img :src="task.evidence_photo" alt="Evidencia" class="w-full object-contain max-h-72 transition-transform duration-300 group-hover:scale-[1.02]" />
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium text-xs">
                <span class="material-symbols-outlined text-[20px]">zoom_in</span> Clic para ver en pantalla completa
              </div>
            </div>
          </div>

          <!-- Acciones de reapertura / edición para el propio usuario -->
          <div v-if="!readOnly" class="pt-3 border-t border-[#e5e5ea] flex justify-between items-center">
            <span class="text-[11px] text-[#86868b]">¿Necesitas corregir la evidencia o reabrir el pendiente?</span>
            <button @click="enableEditMode" class="text-[12px] font-semibold text-[#8a6d3d] hover:text-[#d4b06a] hover:underline flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">edit</span> Modificar o Reabrir
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             MODO 2: FORMULARIO DE GESTIÓN (Marcar como Realizado o No)
        ════════════════════════════════════════════════════════ -->
        <div v-else class="space-y-4">
          
          <!-- Selector: Realizado vs No se pudo ejecutar -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
              ¿Cuál fue el resultado de esta tarea? <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <!-- Opción: Realizado -->
              <button
                type="button"
                @click="selectedAction = 'completed'"
                :class="['p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                  selectedAction === 'completed'
                    ? 'border-[#34c759] bg-[#e8f8ed] text-[#1d1d1f] shadow-sm'
                    : 'border-[#e5e5ea] bg-white text-[#86868b] hover:border-[#34c759]/50']"
              >
                <div :class="['w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  selectedAction === 'completed' ? 'bg-[#34c759] text-white' : 'bg-gray-100 text-gray-400']">
                  <span class="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div>
                  <p class="text-[13px] font-bold leading-none">Realizado</p>
                  <p class="text-[10px] opacity-75 mt-0.5">Completado con éxito</p>
                </div>
              </button>

              <!-- Opción: No se pudo ejecutar -->
              <button
                type="button"
                @click="selectedAction = 'unfulfilled'"
                :class="['p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                  selectedAction === 'unfulfilled'
                    ? 'border-[#ff3b30] bg-[#fff0f0] text-[#1d1d1f] shadow-sm'
                    : 'border-[#e5e5ea] bg-white text-[#86868b] hover:border-[#ff3b30]/50']"
              >
                <div :class="['w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  selectedAction === 'unfulfilled' ? 'bg-[#ff3b30] text-white' : 'bg-gray-100 text-gray-400']">
                  <span class="material-symbols-outlined text-[18px]">close</span>
                </div>
                <div>
                  <p class="text-[13px] font-bold leading-none">No se pudo ejecutar</p>
                  <p class="text-[10px] opacity-75 mt-0.5">Impedimento o bloqueo</p>
                </div>
              </button>
            </div>
          </div>

          <!-- CASO A: REALIZADO -->
          <div v-if="selectedAction === 'completed'" class="space-y-4 animate-fade-in">
            <!-- Texto de Evidencia -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex justify-between">
                <span>Descripción de la Evidencia / Resumen <span class="text-red-500">*</span></span>
                <span class="text-[10px] font-normal text-[#86868b]">{{ evidenceText.length }} caracteres</span>
              </label>
              <textarea
                v-model="evidenceText"
                rows="3"
                placeholder="Explica qué se entregó, resultados alcanzados, enlaces a carpetas/documentos o notas de la gestión..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-[13px] outline-none focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/20 transition-all placeholder:text-gray-400"
              ></textarea>
              <p v-if="evidenceText.trim().length === 0 && showValidationErrors" class="text-[11px] text-red-500">
                La descripción de la evidencia es obligatoria para verificar la tarea.
              </p>
            </div>

            <!-- Pantallazo / Foto de Evidencia -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                  Pantallazo o Foto de Soporte <span class="text-red-500">*</span>
                </label>
                <span class="text-[10px] text-[#0071e3] font-medium bg-[#e8f0fe] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">content_paste</span>
                  Tip: Presiona Ctrl+V para pegar captura
                </span>
              </div>

              <!-- Vista previa si ya hay foto -->
              <div v-if="evidencePhoto" class="relative rounded-xl border border-[#34c759]/50 p-2 bg-[#f8fdf9] flex items-center gap-3">
                <img :src="evidencePhoto" alt="Preview" class="w-16 h-16 object-cover rounded-lg border border-[#e5e5ea] shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 text-[#34c759] text-[12px] font-bold">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Imagen cargada correctamente</span>
                  </div>
                  <p class="text-[11px] text-[#86868b] truncate mt-0.5">Captura lista para trazabilidad</p>
                  <div class="flex items-center gap-3 mt-1.5">
                    <button type="button" @click="showFullscreen = true" class="text-[11px] text-[#0071e3] hover:underline font-semibold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[12px]">zoom_in</span> Ver
                    </button>
                    <button type="button" @click="removePhoto" class="text-[11px] text-red-600 hover:underline font-semibold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[12px]">delete</span> Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Zona de Drop / Carga / Pegar -->
              <div
                v-else
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                :class="['border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer',
                  isDragging ? 'border-[#34c759] bg-[#e8f8ed]' : 'border-[#d1d1d6] hover:border-[#34c759] bg-[#fbfbfd]']"
                @click="triggerFileInput"
              >
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
                <span class="material-symbols-outlined text-[32px] text-[#86868b] block mb-1">
                  {{ isDragging ? 'upload_file' : 'add_photo_alternate' }}
                </span>
                <p class="text-[13px] font-semibold text-[#1d1d1f]">
                  Arrastra aquí tu foto/pantallazo o haz clic para subir
                </p>
                <p class="text-[11px] text-[#86868b] mt-1">
                  También puedes tomar una captura de pantalla y simplemente presionar <strong class="text-[#1d1d1f]">Ctrl+V / Cmd+V</strong>
                </p>
              </div>
              <p v-if="!evidencePhoto && showValidationErrors" class="text-[11px] text-red-500">
                Debes adjuntar un pantallazo o foto para validar la entrega.
              </p>
            </div>
          </div>

          <!-- CASO B: NO SE PUDO EJECUTAR -->
          <div v-else class="space-y-4 animate-fade-in">
            <!-- Motivo de no ejecución -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex justify-between">
                <span>Motivo / Causa del por qué no se pudo ejecutar <span class="text-red-500">*</span></span>
                <span class="text-[10px] font-normal text-[#86868b]">{{ cancellationReason.length }} caracteres</span>
              </label>
              <textarea
                v-model="cancellationReason"
                rows="3"
                placeholder="Detalla qué impidió completar la tarea: falla técnica, falta de insumos de otra área, cliente no disponible, etc..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-[13px] outline-none focus:border-[#ff3b30] focus:ring-2 focus:ring-[#ff3b30]/20 transition-all placeholder:text-gray-400"
              ></textarea>
              <p v-if="cancellationReason.trim().length === 0 && showValidationErrors" class="text-[11px] text-red-500">
                El motivo de no ejecución es obligatorio para la trazabilidad operativa.
              </p>
            </div>

            <!-- Soporte Gráfico Opcional -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex items-center justify-between">
                <span>Pantallazo de soporte del impedimento (Opcional)</span>
                <span class="text-[10px] text-[#86868b]">Ctrl+V para pegar</span>
              </label>

              <div v-if="evidencePhoto" class="relative rounded-xl border border-[#ff3b30]/40 p-2 bg-[#fff5f5] flex items-center gap-3">
                <img :src="evidencePhoto" alt="Soporte" class="w-16 h-16 object-cover rounded-lg border border-[#e5e5ea] shrink-0" />
                <div class="flex-1 min-w-0">
                  <span class="text-[#ff3b30] text-[12px] font-bold block">Soporte adjunto</span>
                  <div class="flex items-center gap-3 mt-1.5">
                    <button type="button" @click="showFullscreen = true" class="text-[11px] text-[#0071e3] hover:underline font-semibold">Ver</button>
                    <button type="button" @click="removePhoto" class="text-[11px] text-red-600 hover:underline font-semibold">Eliminar</button>
                  </div>
                </div>
              </div>

              <div
                v-else
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                :class="['border border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer bg-[#fbfbfd]',
                  isDragging ? 'border-[#ff3b30] bg-[#fff0f0]' : 'border-[#d1d1d6] hover:border-[#ff3b30]']"
                @click="triggerFileInput"
              >
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
                <span class="material-symbols-outlined text-[22px] text-[#86868b]">attachment</span>
                <p class="text-[12px] font-medium text-[#1d1d1f] mt-0.5">Adjuntar foto o error (opcional)</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-[#e5e5ea] bg-[#fbfbfd] flex items-center justify-between">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#86868b] hover:bg-[#e5e5ea]/50 transition-colors"
        >
          {{ isViewingExisting ? 'Cerrar' : 'Cancelar' }}
        </button>

        <div v-if="!isViewingExisting" class="flex items-center gap-2">
          <button
            type="button"
            @click="submit"
            :disabled="isSaving"
            :class="['px-5 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md flex items-center gap-1.5 transition-all',
              selectedAction === 'completed'
                ? 'bg-[#34c759] hover:bg-[#2fb34f] shadow-[#34c759]/25'
                : 'bg-[#ff3b30] hover:bg-[#e0342a] shadow-[#ff3b30]/25'
            ]"
          >
            <span v-if="isSaving" class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            <span class="material-symbols-outlined text-[16px]" v-else>save</span>
            {{ isSaving ? 'Guardando...' : (selectedAction === 'completed' ? 'Confirmar como Realizado' : 'Registrar No Ejecución') }}
          </button>
        </div>

        <div v-else-if="!readOnly" class="flex items-center gap-2">
          <button
            type="button"
            @click="reopenTask"
            class="px-4 py-2 rounded-xl text-[12px] font-bold text-[#b08d57] bg-[#b08d57]/10 hover:bg-[#b08d57]/20 transition-all flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[15px]">undo</span>
            Reabrir Pendiente
          </button>
        </div>
      </div>

    </div>

    <!-- Lightbox de Imagen en Pantalla Completa -->
    <div v-if="showFullscreen" class="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" @click="showFullscreen = false">
      <button @click="showFullscreen = false" class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors">
        <span class="material-symbols-outlined">close</span>
      </button>
      <img :src="evidencePhoto || task?.evidence_photo" alt="Evidencia en grande" class="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" @click.stop />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { supabase } from '@/api/supabase';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: () => null },
  taskType: { type: String, default: 'task' }, // 'task', 'scheduled', 'daily_management'
  readOnly: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'save', 'reopen']);

const selectedAction = ref('completed'); // 'completed' | 'unfulfilled'
const evidenceText = ref('');
const evidencePhoto = ref('');
const cancellationReason = ref('');
const isDragging = ref(false);
const isSaving = ref(false);
const showFullscreen = ref(false);
const showValidationErrors = ref(false);
const isEditMode = ref(false);
const fileInput = ref(null);

const taskTypeName = computed(() => {
  if (props.task?._isScheduled || props.taskType === 'scheduled') return 'Entrega Programada';
  if (props.task?.frequency || props.taskType === 'daily_management') return 'Gestión Periódica del Cargo';
  return 'Pendiente Asignado por Liderazgo';
});

const isViewingExisting = computed(() => {
  if (isEditMode.value) return false;
  if (!props.task) return false;
  // Consideramos existente si ya está en status completed o unfulfilled, o si task.completed es true
  return props.task.status === 'completed' || props.task.status === 'unfulfilled' || props.task.completed === true;
});

const existingStatus = computed(() => {
  if (props.task?.status === 'unfulfilled') return 'unfulfilled';
  return 'completed';
});

const existingCompletedAt = computed(() => {
  return props.task?.completed_at || props.task?.updated_at || null;
});

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const resetForm = () => {
  selectedAction.value = 'completed';
  evidenceText.value = props.task?.evidence_text || '';
  evidencePhoto.value = props.task?.evidence_photo || '';
  cancellationReason.value = props.task?.cancellation_reason || '';
  showValidationErrors.value = false;
  isEditMode.value = false;
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

const close = () => {
  emit('update:modelValue', false);
};

const enableEditMode = () => {
  isEditMode.value = true;
  selectedAction.value = props.task?.status === 'unfulfilled' ? 'unfulfilled' : 'completed';
  evidenceText.value = props.task?.evidence_text || '';
  evidencePhoto.value = props.task?.evidence_photo || '';
  cancellationReason.value = props.task?.cancellation_reason || '';
};

const reopenTask = () => {
  if (!window.confirm('¿Deseas reabrir este pendiente para que vuelva a estar activo?')) return;
  emit('reopen', {
    task: props.task,
    taskType: props.taskType
  });
  close();
};

const triggerFileInput = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) processImageFile(file);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    processImageFile(file);
  }
};

const handlePaste = (e) => {
  if (isViewingExisting.value) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        processImageFile(blob);
        break;
      }
    }
  }
};

const removePhoto = () => {
  evidencePhoto.value = '';
  if (fileInput.value) fileInput.value.value = '';
};

// Comprime la imagen en un Canvas a max 1600px y genera JPEG de alta calidad ligero
const processImageFile = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      evidencePhoto.value = compressedDataUrl;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

const submit = async () => {
  showValidationErrors.value = true;

  if (selectedAction.value === 'completed') {
    if (!evidenceText.value.trim()) {
      alert('Por favor ingresa una descripción o resumen de la evidencia realizada.');
      return;
    }
    if (!evidencePhoto.value) {
      alert('Es obligatorio adjuntar una foto o pantallazo como evidencia de cumplimiento.');
      return;
    }
  } else {
    // unfulfilled
    if (!cancellationReason.value.trim()) {
      alert('Por favor describe el motivo o causa por la cual no se pudo ejecutar.');
      return;
    }
  }

  isSaving.value = true;
  try {
    let finalPhotoUrl = evidencePhoto.value;

    // Si tenemos imagen base64 y el storage bucket existe, intentamos subirla
    if (evidencePhoto.value && evidencePhoto.value.startsWith('data:image')) {
      try {
        const base64Data = evidencePhoto.value.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const filePath = `evidence_${props.task?.id || 'gen'}_${Date.now()}.jpg`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('task_evidence')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('task_evidence')
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        // Fallback garantizado a Base64 data URL
        console.warn('Fallback a Base64 para foto de evidencia:', storageErr);
      }
    }

    const payload = {
      task: props.task,
      taskType: props.taskType,
      status: selectedAction.value,
      evidence_text: selectedAction.value === 'completed' ? evidenceText.value.trim() : null,
      evidence_photo: finalPhotoUrl || null,
      cancellation_reason: selectedAction.value === 'unfulfilled' ? cancellationReason.value.trim() : null,
      completed_at: new Date().toISOString()
    };

    emit('save', payload);
    close();
  } catch (err) {
    console.error('Error guardando evidencia:', err);
    alert('Ocurrió un error al registrar la evidencia: ' + (err.message || 'Error desconocido'));
  } finally {
    isSaving.value = false;
  }
};

const handleGlobalPaste = (e) => {
  if (props.modelValue && !isViewingExisting.value) {
    handlePaste(e);
  }
};

onMounted(() => {
  window.addEventListener('paste', handleGlobalPaste);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', handleGlobalPaste);
});
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

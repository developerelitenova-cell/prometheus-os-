<template>
  <div v-if="modelValue" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
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
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block mb-1">
                {{ taskTypeName }}
              </span>
              <p class="text-[14px] font-semibold text-[#1d1d1f]">{{ task?.title }}</p>
              <p v-if="task?.description" class="text-[12px] text-[#86868b] mt-1">{{ task?.description }}</p>
            </div>
            <div class="flex flex-col items-end gap-1.5 shrink-0">
              <span
                :class="['inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', priorityBadge.classes]"
              >
                <span class="material-symbols-outlined text-[12px]">{{ priorityBadge.icon }}</span>
                <span>{{ priorityBadge.label }}</span>
              </span>
              <span
                :data-testid="evidenceBadge.testId"
                :class="['inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', evidenceBadge.classes]"
                :title="evidenceBadge.tooltip"
              >
                <span class="material-symbols-outlined text-[12px]">{{ evidenceBadge.icon }}</span>
                <span>{{ evidenceBadge.label }}</span>
              </span>
            </div>
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

          <!-- Pantallazos / Fotos de soporte -->
          <div v-if="existingPhotos.length > 0" class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex items-center justify-between">
              <span>
                {{ existingPhotos.length === 1 ? 'Soporte Gráfico / Pantallazo Adjunto' : `Soportes Gráficos / Pantallazos Adjuntos (${existingPhotos.length})` }}
              </span>
              <button type="button" @click="openLightbox(0)" class="text-[#0071e3] hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[13px]">fullscreen</span> Ampliar
              </button>
            </label>

            <div
              v-if="existingPhotos.length === 1"
              data-testid="existing-evidence-photo"
              class="relative rounded-xl overflow-hidden border border-[#e5e5ea] bg-black/5 group cursor-pointer max-h-72 flex items-center justify-center"
              @click="openLightbox(0)"
            >
              <img :src="existingPhotos[0]" alt="Evidencia 1" class="w-full object-contain max-h-72 transition-transform duration-300 group-hover:scale-[1.02]" />
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium text-xs">
                <span class="material-symbols-outlined text-[20px]">zoom_in</span> Clic para ver en pantalla completa
              </div>
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                v-for="(photo, idx) in existingPhotos"
                :key="'existing-photo-' + idx"
                type="button"
                data-testid="existing-evidence-photo"
                @click="openLightbox(idx)"
                class="relative rounded-xl overflow-hidden border border-[#e5e5ea] bg-black/5 group cursor-pointer aspect-video flex items-center justify-center text-left"
              >
                <img :src="photo" :alt="`Evidencia ${idx + 1}`" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-white text-[10px] font-bold">
                  #{{ idx + 1 }}
                </span>
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span class="material-symbols-outlined text-[20px]">zoom_in</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Acciones de reapertura / edición para el propio usuario -->
          <div v-if="!readOnly" class="pt-3 border-t border-[#e5e5ea] flex justify-between items-center">
            <span class="text-[11px] text-[#86868b]">¿Necesitas corregir la evidencia o reabrir el pendiente?</span>
            <button @click="enableEditMode" class="text-[12px] font-semibold text-[#8a6d3d] hover:text-[#d4b06a] hover:underline flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[15px]">edit</span> Modificar o Reabrir
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             MODO 2: FORMULARIO DE GESTIÓN (Marcar como Realizado o No)
        ════════════════════════════════════════════════════════ -->
        <div v-else class="space-y-4">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            data-testid="evidence-file-input"
            class="hidden"
            @change="handleFileChange"
          />

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
                :class="['p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer',
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
                :class="['p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer',
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
            <!-- Aviso si se restauró borrador -->
            <div v-if="hasRestoredDraft" class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-medium">
                <span class="material-symbols-outlined text-[16px] text-amber-600">history_edu</span>
                <span>Se recuperó tu borrador no enviado de esta tarea.</span>
              </div>
              <button type="button" @click="discardDraft" class="text-amber-700 hover:underline font-bold text-[11px] cursor-pointer">
                Descartar borrador
              </button>
            </div>

            <!-- Alerta de actividad fuera del tiempo establecido -->
            <div v-if="isOverdueTask" data-testid="overdue-delay-notice" class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
              <span class="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">schedule</span>
              <span>
                <strong>Actividad fuera de tiempo establecido:</strong> Esta tarea superó su fecha límite. Por favor explica en tus comentarios el motivo del retraso antes de confirmarla.
              </span>
            </div>

            <!-- Indicador de exigencia probatoria -->
            <div v-if="evidenceRequirement === 'none'" class="p-2.5 rounded-xl bg-green-50/70 border border-green-200/60 text-green-800 text-[11px] flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-green-600">check_circle</span>
              <span>Esta actividad es de verificación directa. Las fotos y el resumen son opcionales{{ isOverdueTask ? ' (comentario de retraso requerido)' : '' }}.</span>
            </div>
            <div v-else-if="evidenceRequirement === 'text_only'" class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-800 text-[11px] flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-blue-600">edit_note</span>
              <span>Esta actividad requiere una breve descripción o nota de cumplimiento. La foto es opcional.</span>
            </div>
            <div v-else class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-purple-800 text-[11px] flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-purple-600">photo_camera</span>
              <span>Actividad crítica/estratégica: Requiere soporte fotográfico obligatorio para su auditoría.</span>
            </div>

            <!-- Texto de Evidencia -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex justify-between">
                <span>
                  {{ isOverdueTask ? 'Descripción de la Evidencia / Motivo del Retraso' : 'Descripción de la Evidencia / Resumen' }}
                  <span v-if="isTextMandatory" class="text-red-500">*</span>
                  <span v-else class="text-[10px] text-gray-400 font-normal lowercase">(opcional)</span>
                </span>
                <span class="text-[10px] font-normal text-[#86868b]">{{ evidenceText.length }} caracteres</span>
              </label>
              <textarea
                v-model="evidenceText"
                rows="3"
                data-testid="evidence-text-input"
                :placeholder="isOverdueTask ? 'Explica por qué no se logró desarrollar en el tiempo establecido y detalla los resultados alcanzados...' : 'Explica qué se entregó, resultados alcanzados, enlaces a carpetas/documentos o notas de la gestión...'"
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-[13px] outline-none focus:border-[#34c759] focus:ring-2 focus:ring-[#34c759]/20 transition-all placeholder:text-gray-400"
              ></textarea>
              <p v-if="evidenceText.trim().length === 0 && isTextMandatory && showValidationErrors" class="text-[11px] text-red-500">
                {{ isOverdueTask ? 'Debes dejar un comentario explicando el motivo del retraso porque esta tarea venció.' : 'La descripción de la evidencia es obligatoria para verificar esta tarea.' }}
              </p>
            </div>

            <!-- Galería Multi-Imagen / Pantallazos de Evidencia -->
            <div class="space-y-2" data-testid="evidence-photos-section">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                  Pantallazos o Fotos de Soporte (máx. {{ MAX_EVIDENCE_PHOTOS }})
                  <span v-if="isPhotoMandatory" class="text-red-500">*</span>
                  <span v-else class="text-[10px] text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <span class="text-[10px] text-[#0071e3] font-medium bg-[#e8f0fe] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">content_paste</span>
                  Ctrl+V para pegar capturas ({{ evidencePhotos.length }}/{{ MAX_EVIDENCE_PHOTOS }})
                </span>
              </div>

              <!-- Miniaturas de fotos cargadas -->
              <div v-if="evidencePhotos.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div
                  v-for="(photo, idx) in evidencePhotos"
                  :key="'photo-thumb-' + idx"
                  data-testid="evidence-photo-thumb"
                  class="relative rounded-xl border border-[#34c759]/50 p-1.5 bg-[#f8fdf9] flex flex-col gap-1.5 group"
                >
                  <div class="relative aspect-video rounded-lg overflow-hidden border border-[#e5e5ea] bg-black/5 cursor-pointer" @click="openLightbox(idx)">
                    <img :src="photo" :alt="`Captura ${idx + 1}`" class="w-full h-full object-cover" />
                    <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold">
                      #{{ idx + 1 }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-0.5">
                    <button type="button" @click="openLightbox(idx)" class="text-[11px] text-[#0071e3] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer">
                      <span class="material-symbols-outlined text-[13px]">zoom_in</span> Ver
                    </button>
                    <button type="button" data-testid="remove-evidence-photo" @click="removePhotoAt(idx)" class="text-[11px] text-red-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer">
                      <span class="material-symbols-outlined text-[13px]">delete</span> Quitar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Zona de Drop / Carga / Pegar (disponible mientras < MAX_EVIDENCE_PHOTOS) -->
              <div
                v-if="evidencePhotos.length < MAX_EVIDENCE_PHOTOS"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                :class="[
                  'border-2 border-dashed rounded-xl text-center transition-all cursor-pointer',
                  evidencePhotos.length > 0 ? 'p-3' : 'p-5',
                  isDragging ? 'border-[#34c759] bg-[#e8f8ed]' : 'border-[#d1d1d6] hover:border-[#34c759] bg-[#fbfbfd]'
                ]"
                @click="triggerFileInput"
              >
                <span class="material-symbols-outlined text-[#86868b] block mb-1" :class="evidencePhotos.length > 0 ? 'text-[22px]' : 'text-[32px]'">
                  {{ isDragging ? 'upload_file' : 'add_photo_alternate' }}
                </span>
                <p class="text-[13px] font-semibold text-[#1d1d1f]">
                  {{ evidencePhotos.length > 0 ? `Agregar otra imagen o pegar con Ctrl+V (${evidencePhotos.length}/${MAX_EVIDENCE_PHOTOS})` : 'Arrastra aquí tus fotos/pantallazos o haz clic para subir' }}
                </p>
                <p class="text-[11px] text-[#86868b] mt-1">
                  Puedes subir hasta {{ MAX_EVIDENCE_PHOTOS }} imágenes o presionar <strong class="text-[#1d1d1f]">Ctrl+V / Cmd+V</strong>
                </p>
              </div>

              <p v-if="maxPhotosNotice" data-testid="max-photos-notice" class="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {{ maxPhotosNotice }}
              </p>

              <p v-if="evidencePhotos.length === 0 && isPhotoMandatory && showValidationErrors" class="text-[11px] text-red-500">
                Debes adjuntar al menos un pantallazo o foto para validar esta entrega estratégica.
              </p>
            </div>
          </div>

          <!-- CASO B: NO SE PUDO EJECUTAR -->
          <div v-else class="space-y-4 animate-fade-in">
            <!-- Motivo de no ejecución -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex justify-between">
                <span>Motivo / Causa del por qué no se logró desarrollar en el tiempo establecido <span class="text-red-500">*</span></span>
                <span class="text-[10px] font-normal text-[#86868b]">{{ cancellationReason.length }} caracteres</span>
              </label>
              <textarea
                v-model="cancellationReason"
                rows="3"
                data-testid="cancellation-reason-input"
                placeholder="Explica claramente por qué no se llevó a cabo en el tiempo establecido: falla técnica, falta de insumos de otra área, cliente no disponible, etc..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-[13px] outline-none focus:border-[#ff3b30] focus:ring-2 focus:ring-[#ff3b30]/20 transition-all placeholder:text-gray-400"
              ></textarea>
              <p v-if="cancellationReason.trim().length === 0 && showValidationErrors" class="text-[11px] text-red-500">
                El motivo de no ejecución es obligatorio para la trazabilidad operativa.
              </p>
            </div>

            <!-- Soportes Gráficos Opcionales -->
            <div class="space-y-2" data-testid="evidence-photos-section">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b] flex items-center justify-between">
                <span>Pantallazos de soporte del impedimento (Opcional, máx. {{ MAX_EVIDENCE_PHOTOS }})</span>
                <span class="text-[10px] text-[#86868b]">Ctrl+V para pegar ({{ evidencePhotos.length }}/{{ MAX_EVIDENCE_PHOTOS }})</span>
              </label>

              <div v-if="evidencePhotos.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div
                  v-for="(photo, idx) in evidencePhotos"
                  :key="'unfulfilled-photo-' + idx"
                  data-testid="evidence-photo-thumb"
                  class="relative rounded-xl border border-[#ff3b30]/40 p-1.5 bg-[#fff5f5] flex flex-col gap-1.5"
                >
                  <div class="relative aspect-video rounded-lg overflow-hidden border border-[#e5e5ea] bg-black/5 cursor-pointer" @click="openLightbox(idx)">
                    <img :src="photo" :alt="`Soporte ${idx + 1}`" class="w-full h-full object-cover" />
                    <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold">
                      #{{ idx + 1 }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-0.5">
                    <button type="button" @click="openLightbox(idx)" class="text-[11px] text-[#0071e3] hover:underline font-semibold cursor-pointer">Ver</button>
                    <button type="button" data-testid="remove-evidence-photo" @click="removePhotoAt(idx)" class="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer">Quitar</button>
                  </div>
                </div>
              </div>

              <div
                v-if="evidencePhotos.length < MAX_EVIDENCE_PHOTOS"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                :class="['border border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer bg-[#fbfbfd]',
                  isDragging ? 'border-[#ff3b30] bg-[#fff0f0]' : 'border-[#d1d1d6] hover:border-[#ff3b30]']"
                @click="triggerFileInput"
              >
                <span class="material-symbols-outlined text-[22px] text-[#86868b]">attachment</span>
                <p class="text-[12px] font-medium text-[#1d1d1f] mt-0.5">
                  {{ evidencePhotos.length > 0 ? `Agregar captura del error/bloqueo (${evidencePhotos.length}/${MAX_EVIDENCE_PHOTOS})` : 'Adjuntar fotos o errores de soporte (opcional)' }}
                </p>
              </div>

              <p v-if="maxPhotosNotice" data-testid="max-photos-notice" class="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {{ maxPhotosNotice }}
              </p>
            </div>
          </div>

        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-[#e5e5ea] bg-[#fbfbfd] flex items-center justify-between">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#86868b] hover:bg-[#e5e5ea]/50 transition-colors cursor-pointer"
        >
          {{ isViewingExisting ? 'Cerrar' : 'Cancelar' }}
        </button>

        <div v-if="!isViewingExisting" class="flex items-center gap-2">
          <button
            type="button"
            data-testid="submit-evidence-btn"
            @click="submit"
            :disabled="isSaving"
            :class="['px-5 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer',
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
            class="px-4 py-2 rounded-xl text-[12px] font-bold text-[#b08d57] bg-[#b08d57]/10 hover:bg-[#b08d57]/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[15px]">undo</span>
            Reabrir Pendiente
          </button>
        </div>
      </div>

    </div>

    <!-- Lightbox de Imagen en Pantalla Completa (Galería) -->
    <div v-if="showFullscreen" data-testid="evidence-lightbox" class="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" @click="closeLightbox">
      <button type="button" @click="closeLightbox" class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer">
        <span class="material-symbols-outlined">close</span>
      </button>

      <div v-if="lightboxPhotos.length > 1" class="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold">
        {{ lightboxIndex + 1 }} / {{ lightboxPhotos.length }}
      </div>

      <button
        v-if="lightboxPhotos.length > 1"
        type="button"
        data-testid="lightbox-prev"
        @click.stop="prevLightbox"
        class="absolute left-4 sm:left-8 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/35 flex items-center justify-center transition-colors cursor-pointer"
      >
        <span class="material-symbols-outlined">chevron_left</span>
      </button>

      <img :src="currentLightboxPhoto" alt="Evidencia en grande" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" @click.stop />

      <button
        v-if="lightboxPhotos.length > 1"
        type="button"
        data-testid="lightbox-next"
        @click.stop="nextLightbox"
        class="absolute right-4 sm:right-8 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/35 flex items-center justify-center transition-colors cursor-pointer"
      >
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { supabase } from '@/api/supabase';
import { getPriorityBadge, getEvidenceBadge } from '@/utils/taskBadges';
import { MAX_EVIDENCE_PHOTOS, parseEvidencePhotos, serializeEvidencePhotos } from '@/utils/evidencePhotos';
import { isTaskOverdueBogota } from '@/utils/bogotaTime';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: () => null },
  taskType: { type: String, default: 'task' }, // 'task', 'scheduled', 'daily_management'
  readOnly: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'save', 'reopen']);

const selectedAction = ref('completed'); // 'completed' | 'unfulfilled'
const evidenceText = ref('');
const evidencePhotos = ref([]);
const maxPhotosNotice = ref('');
const cancellationReason = ref('');
const isDragging = ref(false);
const isSaving = ref(false);
const lightboxIndex = ref(null);
const showValidationErrors = ref(false);
const isEditMode = ref(false);
const fileInput = ref(null);
const hasRestoredDraft = ref(false);

const evidenceRequirement = computed(() => {
  return props.task?.evidence_requirement || 'none';
});

const priorityBadge = computed(() => getPriorityBadge(props.task?.priority));
const evidenceBadge = computed(() => getEvidenceBadge(evidenceRequirement.value));

const isOverdueTask = computed(() => {
  if (!props.task?.due_date) return false;
  if (isTaskOverdueBogota(props.task)) return true;
  if (props.task.status !== 'completed' && props.task.status !== 'unfulfilled' && !props.task.completed) {
    return isTaskOverdueBogota({ ...props.task, status: 'pending' });
  }
  return false;
});

const isPhotoMandatory = computed(() => {
  return evidenceRequirement.value === 'photo_required';
});

const isTextMandatory = computed(() => {
  return evidenceRequirement.value === 'text_only' || evidenceRequirement.value === 'photo_required' || isOverdueTask.value;
});

const taskTypeName = computed(() => {
  if (props.task?._isScheduled || props.taskType === 'scheduled') return 'Entrega Programada';
  if (props.task?.frequency || props.taskType === 'daily_management') return 'Gestión Periódica del Cargo';
  return 'Pendiente Asignado por Liderazgo';
});

const isViewingExisting = computed(() => {
  if (isEditMode.value) return false;
  if (!props.task) return false;
  return props.task.status === 'completed' || props.task.status === 'unfulfilled' || props.task.completed === true;
});

const existingStatus = computed(() => {
  if (props.task?.status === 'unfulfilled') return 'unfulfilled';
  return 'completed';
});

const existingCompletedAt = computed(() => {
  return props.task?.completed_at || props.task?.updated_at || null;
});

const existingPhotos = computed(() => parseEvidencePhotos(props.task?.evidence_photo));

const lightboxPhotos = computed(() => {
  return isViewingExisting.value ? existingPhotos.value : evidencePhotos.value;
});

const showFullscreen = computed(() => {
  return lightboxIndex.value !== null && Boolean(lightboxPhotos.value[lightboxIndex.value]);
});

const currentLightboxPhoto = computed(() => {
  return showFullscreen.value ? lightboxPhotos.value[lightboxIndex.value] : '';
});

const openLightbox = (idx = 0) => {
  if (lightboxPhotos.value.length === 0) return;
  lightboxIndex.value = Math.max(0, Math.min(idx, lightboxPhotos.value.length - 1));
};

const closeLightbox = () => {
  lightboxIndex.value = null;
};

const prevLightbox = () => {
  if (lightboxPhotos.value.length <= 1) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxPhotos.value.length) % lightboxPhotos.value.length;
};

const nextLightbox = () => {
  if (lightboxPhotos.value.length <= 1) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxPhotos.value.length;
};

const getDraftKey = () => {
  if (!props.task?.id) return null;
  const pKey = props.task.periodKey || props.task._periodKey || 'current';
  return `novawork_draft_${props.task.id}_${pKey}`;
};

const saveDraft = () => {
  const key = getDraftKey();
  if (!key || isViewingExisting.value) return;
  if (evidenceText.value || evidencePhotos.value.length > 0 || cancellationReason.value) {
    const draft = {
      selectedAction: selectedAction.value,
      evidenceText: evidenceText.value,
      evidencePhotos: evidencePhotos.value,
      cancellationReason: cancellationReason.value,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (e) {
      // Si las capturas Base64 superan la cuota de localStorage, persistimos al menos el texto
      try {
        localStorage.setItem(key, JSON.stringify({ ...draft, evidencePhotos: [] }));
      } catch {
        console.warn('Draft save error', e);
      }
    }
  }
};

const restoreDraft = () => {
  const key = getDraftKey();
  if (!key) return false;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  try {
    const draft = JSON.parse(raw);
    selectedAction.value = draft.selectedAction || 'completed';
    evidenceText.value = draft.evidenceText || '';
    if (Array.isArray(draft.evidencePhotos)) {
      evidencePhotos.value = parseEvidencePhotos(draft.evidencePhotos);
    } else if (draft.evidencePhoto) {
      evidencePhotos.value = parseEvidencePhotos(draft.evidencePhoto);
    } else {
      evidencePhotos.value = [];
    }
    cancellationReason.value = draft.cancellationReason || '';
    hasRestoredDraft.value = true;
    return true;
  } catch (e) {
    return false;
  }
};

const discardDraft = () => {
  const key = getDraftKey();
  if (key) {
    localStorage.removeItem(key);
  }
  hasRestoredDraft.value = false;
  selectedAction.value = 'completed';
  evidenceText.value = '';
  evidencePhotos.value = [];
  maxPhotosNotice.value = '';
  cancellationReason.value = '';
};

const clearDraft = () => {
  const key = getDraftKey();
  if (key) {
    localStorage.removeItem(key);
  }
  hasRestoredDraft.value = false;
};

// Auto-guardado de borrador al escribir
watch([evidenceText, evidencePhotos, cancellationReason, selectedAction], () => {
  if (props.modelValue && !isViewingExisting.value) {
    saveDraft();
  }
}, { deep: true });

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
  hasRestoredDraft.value = false;
  showValidationErrors.value = false;
  isEditMode.value = false;
  maxPhotosNotice.value = '';
  lightboxIndex.value = null;

  const parsedExisting = parseEvidencePhotos(props.task?.evidence_photo);
  if (props.task?.evidence_text || parsedExisting.length > 0 || props.task?.cancellation_reason || props.task?.completed) {
    selectedAction.value = props.task?.status === 'unfulfilled' ? 'unfulfilled' : 'completed';
    evidenceText.value = props.task?.evidence_text || '';
    evidencePhotos.value = parsedExisting;
    cancellationReason.value = props.task?.cancellation_reason || '';
    return;
  }

  const restored = restoreDraft();
  if (!restored) {
    selectedAction.value = 'completed';
    evidenceText.value = '';
    evidencePhotos.value = [];
    cancellationReason.value = '';
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm();
  }
}, { immediate: true });

watch(() => props.task, () => {
  if (props.modelValue) {
    resetForm();
  }
});

const close = () => {
  if (!isViewingExisting.value) {
    saveDraft();
  }
  lightboxIndex.value = null;
  emit('update:modelValue', false);
};

const enableEditMode = () => {
  isEditMode.value = true;
  maxPhotosNotice.value = '';
  lightboxIndex.value = null;
  selectedAction.value = props.task?.status === 'unfulfilled' ? 'unfulfilled' : 'completed';
  evidenceText.value = props.task?.evidence_text || '';
  evidencePhotos.value = parseEvidencePhotos(props.task?.evidence_photo);
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

const appendEvidencePhoto = (url) => {
  if (!url) return;
  if (evidencePhotos.value.length >= MAX_EVIDENCE_PHOTOS) {
    maxPhotosNotice.value = `Máximo ${MAX_EVIDENCE_PHOTOS} imágenes permitidas por tarea.`;
    return;
  }
  evidencePhotos.value = [...evidencePhotos.value, url];
  if (evidencePhotos.value.length >= MAX_EVIDENCE_PHOTOS) {
    maxPhotosNotice.value = `Límite alcanzado (${MAX_EVIDENCE_PHOTOS}/${MAX_EVIDENCE_PHOTOS} capturas). Quita una si necesitas reemplazarla.`;
  }
};

const addImageFiles = (files = []) => {
  maxPhotosNotice.value = '';
  const imageFiles = files.filter((f) => {
    if (!f) return false;
    if (f.type) return f.type.startsWith('image/');
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name || '');
  });
  if (imageFiles.length === 0) return;

  const remaining = MAX_EVIDENCE_PHOTOS - evidencePhotos.value.length;
  if (remaining <= 0) {
    maxPhotosNotice.value = `Ya alcanzaste el máximo de ${MAX_EVIDENCE_PHOTOS} imágenes adjuntas.`;
    return;
  }

  const accepted = imageFiles.slice(0, remaining);
  if (imageFiles.length > remaining) {
    maxPhotosNotice.value = `Solo se permiten hasta ${MAX_EVIDENCE_PHOTOS} imágenes; se agregaron ${accepted.length}.`;
  }

  accepted.forEach((file) => processImageFile(file));
};

const handleFileChange = (e) => {
  const files = Array.from(e.target.files || []);
  addImageFiles(files);
  e.target.value = '';
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  addImageFiles(files);
};

const handlePaste = (e) => {
  if (isViewingExisting.value) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  const pastedImages = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) pastedImages.push(blob);
    }
  }
  if (pastedImages.length > 0) {
    addImageFiles(pastedImages);
  }
};

const removePhotoAt = (idx) => {
  evidencePhotos.value = evidencePhotos.value.filter((_, i) => i !== idx);
  maxPhotosNotice.value = '';
  if (lightboxIndex.value !== null) {
    if (evidencePhotos.value.length === 0) {
      lightboxIndex.value = null;
    } else if (lightboxIndex.value >= evidencePhotos.value.length) {
      lightboxIndex.value = evidencePhotos.value.length - 1;
    }
  }
  if (fileInput.value) fileInput.value.value = '';
};

const isJsdomEnv = () => {
  return typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
};

// Comprime cada imagen en un Canvas a max 1400px y genera JPEG de alta calidad ligero
const processImageFile = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const rawDataUrl = event.target?.result;
    if (!rawDataUrl) return;

    if (isJsdomEnv()) {
      appendEvidencePhoto(rawDataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1400;
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
        if (!ctx) {
          appendEvidencePhoto(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        appendEvidencePhoto(compressedDataUrl);
      } catch {
        appendEvidencePhoto(rawDataUrl);
      }
    };
    img.onerror = () => appendEvidencePhoto(rawDataUrl);
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
};

const uploadPhotoIfDataUri = async (dataUrl, index) => {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  try {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header?.match(/data:([^;]+);/);
    const contentType = mimeMatch?.[1] || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const filePath = `evidence_${props.task?.id || 'gen'}_${Date.now()}_${index}.${ext}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('task_evidence')
      .upload(filePath, blob, { contentType, upsert: true });

    if (!uploadErr && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('task_evidence')
        .getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('Fallback a Base64 para foto de evidencia:', storageErr);
  }
  return dataUrl;
};

const submit = async () => {
  showValidationErrors.value = true;

  if (selectedAction.value === 'completed') {
    if (isTextMandatory.value && !evidenceText.value.trim()) {
      alert(
        isOverdueTask.value
          ? 'Esta actividad superó la fecha límite. Por favor describe el motivo del retraso o comentario de cierre antes de confirmar.'
          : 'Por favor ingresa una descripción o resumen de la evidencia requerida para esta actividad.'
      );
      return;
    }
    if (isPhotoMandatory.value && evidencePhotos.value.length === 0) {
      alert('Es obligatorio adjuntar una foto o pantallazo como soporte para esta actividad estratégica.');
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
    const uploadedUrls = [];
    for (let i = 0; i < evidencePhotos.value.length; i++) {
      const resolvedUrl = await uploadPhotoIfDataUri(evidencePhotos.value[i], i);
      if (resolvedUrl) uploadedUrls.push(resolvedUrl);
    }

    const payload = {
      task: props.task,
      taskType: props.taskType,
      status: selectedAction.value,
      evidence_text: selectedAction.value === 'completed' ? (evidenceText.value.trim() || null) : null,
      evidence_photo: serializeEvidencePhotos(uploadedUrls),
      evidence_photos: uploadedUrls,
      cancellation_reason: selectedAction.value === 'unfulfilled' ? (cancellationReason.value.trim() || null) : null,
      completed_at: new Date().toISOString()
    };

    clearDraft();
    emit('save', payload);
    emit('update:modelValue', false);
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

const handleGlobalKeydown = (e) => {
  if (!props.modelValue || !showFullscreen.value) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') prevLightbox();
  else if (e.key === 'ArrowRight') nextLightbox();
};

onMounted(() => {
  window.addEventListener('paste', handleGlobalPaste);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', handleGlobalPaste);
  window.removeEventListener('keydown', handleGlobalKeydown);
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

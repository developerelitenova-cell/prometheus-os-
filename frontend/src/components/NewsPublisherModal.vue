<template>
  <div
    v-if="modelValue"
    data-testid="news-publisher-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="news-publisher-title"
    class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="close"
  >
    <div
      class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#e5e5ea] overflow-hidden flex flex-col max-h-[92vh]"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[#e5e5ea] bg-[#fbfbfd] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#b08d57]/15 text-[#8a6d3d] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[22px]">campaign</span>
          </div>
          <div>
            <h3 id="news-publisher-title" class="text-base font-bold text-[#1d1d1f]">
              Publicar Noticia / Comunicado
            </h3>
            <p class="text-xs text-[#86868b]">
              {{ isCompanyPublisher ? 'Emite comunicados globales o dirigidos a un departamento específico' : 'Emite comunicados y novedades exclusivos para tu equipo de área' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="close"
          class="w-8 h-8 rounded-full hover:bg-[#e5e5ea]/60 flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
          aria-label="Cerrar"
        >
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1">
        <!-- Sin permisos -->
        <div
          v-if="permission === 'none'"
          data-testid="no-news-permission"
          class="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3"
        >
          <span class="material-symbols-outlined text-amber-600 text-[22px] shrink-0">lock</span>
          <div>
            <p class="font-bold">Sin permiso de publicación</p>
            <p class="text-xs text-amber-800 mt-1">
              Tu perfil actualmente no cuenta con permisos para publicar noticias. Solicita habilitación a Gestión Humana o a un Administrador Master.
            </p>
          </div>
        </div>

        <template v-else>
          <form @submit.prevent="submitNews" class="space-y-4">
            <!-- Alcance / Destinatario -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                Alcance del Comunicado
              </label>

              <!-- Modo Empresa (HR / KPI Analyst / Master Admin) -->
              <div v-if="isCompanyPublisher" class="space-y-2.5">
                <div class="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="scope-company-btn"
                    @click="selectScope('company')"
                    :class="[
                      'p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer',
                      form.scope === 'company'
                        ? 'border-[#b08d57] bg-[#b08d57]/10 text-[#8a6d3d] shadow-xs'
                        : 'border-[#e5e5ea] bg-white text-[#5e6c84] hover:border-[#b08d57]/40'
                    ]"
                  >
                    <span class="material-symbols-outlined text-[20px]">public</span>
                    <div>
                      <span class="block text-xs font-bold">Toda la Empresa</span>
                      <span class="block text-[10px] opacity-80">Visible en todos los portales</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="scope-area-btn"
                    @click="selectScope('area')"
                    :class="[
                      'p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer',
                      form.scope === 'area'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-[#e5e5ea] bg-white text-[#5e6c84] hover:border-emerald-300'
                    ]"
                  >
                    <span class="material-symbols-outlined text-[20px]">groups</span>
                    <div>
                      <span class="block text-xs font-bold">Área Específica</span>
                      <span class="block text-[10px] opacity-80">Solo un departamento</span>
                    </div>
                  </button>
                </div>

                <div v-if="form.scope === 'area'" class="pt-1">
                  <select
                    v-model="form.area_id"
                    data-testid="news-area-select"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#b08d57]"
                  >
                    <option :value="null" disabled>— Selecciona el departamento destinatario —</option>
                    <option v-for="area in resolvedAreas" :key="area.id" :value="area.id">
                      {{ area.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Modo Área bloqueada (Gerente / Líder) -->
              <div
                v-else
                data-testid="locked-area-badge"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
              >
                <span class="material-symbols-outlined text-[18px] text-emerald-600">groups</span>
                <span>Dirigido a tu departamento: {{ userAreaName }}</span>
                <span class="material-symbols-outlined text-[14px] text-emerald-600/80">lock</span>
              </div>
            </div>

            <!-- Categoría -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                Categoría
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  v-for="cat in NEWS_CATEGORY_OPTIONS"
                  :key="cat.value"
                  type="button"
                  :data-testid="`news-category-${cat.value}`"
                  @click="form.category = cat.value"
                  :class="[
                    'px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    form.category === cat.value
                      ? `${cat.badgeClass} ring-1 ring-current`
                      : 'border-[#e5e5ea] bg-white text-[#5e6c84] hover:bg-[#f5f5f7]'
                  ]"
                >
                  <span class="material-symbols-outlined text-[16px]">{{ cat.icon }}</span>
                  <span>{{ cat.label }}</span>
                </button>
              </div>
            </div>

            <!-- Título -->
            <div class="space-y-1.5">
              <label for="news-title-input" class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                Título del Comunicado *
              </label>
              <input
                id="news-title-input"
                data-testid="news-title-input"
                v-model="form.title"
                type="text"
                placeholder="Ej: Resultados de KPIs Semana 2 o Novedad Operativa del Área"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] focus:bg-white border border-[#e5e5ea] focus:border-[#b08d57] text-sm font-medium text-[#1d1d1f] outline-none transition-colors"
              />
            </div>

            <!-- Mensaje / Cuerpo -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="news-body-input" class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  Mensaje / Detalle
                </label>
                <span class="text-[11px] text-[#86868b]">Requerido si no subes un flyer</span>
              </div>
              <textarea
                id="news-body-input"
                data-testid="news-body-input"
                v-model="form.body"
                rows="3"
                placeholder="Escribe el comunicado, instrucciones, felicitaciones o resumen de indicadores..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] focus:bg-white border border-[#e5e5ea] focus:border-[#b08d57] text-sm text-[#1d1d1f] outline-none transition-colors resize-y"
              ></textarea>
            </div>

            <!-- Flyer / Imagen Opcional -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  Imagen / Flyer (Opcional)
                </label>
                <button
                  v-if="form.file"
                  type="button"
                  @click="clearSelectedFile"
                  class="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Quitar imagen
                </button>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] border border-dashed border-[#d2d2d7]">
                <span class="material-symbols-outlined text-[#8a6d3d] text-[22px] shrink-0">image</span>
                <div class="flex-1 min-w-0">
                  <input
                    ref="fileInputRef"
                    data-testid="news-file-input"
                    type="file"
                    accept="image/*"
                    @change="onFileChange"
                    class="block w-full text-xs text-[#5e6c84] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#b08d57]/15 file:text-[#8a6d3d] hover:file:bg-[#b08d57]/25 cursor-pointer"
                  />
                  <p v-if="form.file" class="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                    Archivo listo: {{ form.file.name }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Fechas de vigencia -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="news-start-date" class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  Fecha de Inicio
                </label>
                <input
                  id="news-start-date"
                  data-testid="news-start-date"
                  v-model="form.start_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
                />
              </div>
              <div class="space-y-1">
                <label for="news-end-date" class="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  Fecha de Fin (Opcional)
                </label>
                <input
                  id="news-end-date"
                  data-testid="news-end-date"
                  v-model="form.end_date"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
                />
              </div>
            </div>

            <!-- Mensajes de Error / Éxito -->
            <div
              v-if="errorMsg"
              data-testid="news-error"
              class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{{ errorMsg }}</span>
            </div>

            <div
              v-if="successMsg"
              data-testid="news-success"
              class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
              <span>{{ successMsg }}</span>
            </div>

            <!-- Botones del Formulario -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                @click="close"
                class="px-4 py-2.5 rounded-xl border border-[#e5e5ea] text-xs font-bold text-[#5e6c84] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                data-testid="news-submit-btn"
                :disabled="publishing"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span v-if="publishing" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-[16px]">send</span>
                <span>{{ publishing ? 'Publicando...' : 'Publicar Comunicado' }}</span>
              </button>
            </div>
          </form>

          <!-- Gestión de Noticias Recientes -->
          <div class="pt-4 border-t border-[#e5e5ea] space-y-3" data-testid="recent-news-section">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">history</span>
                <span>{{ isCompanyPublisher ? 'Comunicados Recientes' : 'Mis Comunicados del Área' }}</span>
              </h4>
              <span class="text-[11px] text-[#86868b]">{{ recentNews.length }} publicados</span>
            </div>

            <div v-if="loadingRecent" class="py-4 text-center text-xs text-[#86868b]">
              Cargando comunicados recientes...
            </div>

            <div v-else-if="recentNews.length === 0" class="py-4 text-center text-xs text-[#86868b] bg-[#f5f5f7] rounded-xl">
              Aún no hay comunicados publicados en este alcance.
            </div>

            <div v-else data-testid="recent-news-list" class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="item in recentNews"
                :key="item.id"
                class="p-3 rounded-xl bg-[#fbfbfd] border border-[#e5e5ea] flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    alt="Flyer"
                    class="w-11 h-11 rounded-lg object-cover border border-[#e5e5ea] shrink-0"
                  />
                  <div
                    v-else
                    class="w-11 h-11 rounded-lg bg-[#b08d57]/10 text-[#8a6d3d] flex items-center justify-center shrink-0"
                  >
                    <span class="material-symbols-outlined text-[20px]">{{ getNewsCategoryMeta(item).icon }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span
                        :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', getNewsCategoryMeta(item).badgeClass]"
                      >
                        {{ getNewsCategoryMeta(item).label }}
                      </span>
                      <span class="text-[10px] font-semibold text-[#86868b]">
                        {{ item.scope === 'area' ? areaNameById(item.area_id) : 'Toda la Empresa' }}
                      </span>
                    </div>
                    <p class="text-xs font-bold text-[#1d1d1f] truncate mt-0.5">{{ item.title }}</p>
                    <p v-if="item.body" class="text-[11px] text-[#86868b] truncate">{{ item.body }}</p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="delete-news-btn"
                  @click="deleteNewsItem(item)"
                  :disabled="deletingId === item.id"
                  class="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  title="Eliminar comunicado"
                >
                  <span class="material-symbols-outlined text-[14px]">delete</span>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../api/supabase';
import {
  NEWS_CATEGORY_OPTIONS,
  getEffectiveNewsPermission,
  getNewsCategoryMeta,
} from '../utils/newsPermissions';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: Object,
    default: null,
  },
  areas: {
    type: Array,
    default: () => [],
  },
  defaultCategory: {
    type: String,
    default: 'area',
  },
});

const emit = defineEmits(['update:modelValue', 'published']);

const getTodayStr = () => new Date().toISOString().split('T')[0];

const fetchedAreas = ref([]);
const recentNews = ref([]);
const loadingRecent = ref(false);
const publishing = ref(false);
const deletingId = ref(null);
const errorMsg = ref('');
const successMsg = ref('');
const fileInputRef = ref(null);

const permission = computed(() => getEffectiveNewsPermission(props.profile));
const isCompanyPublisher = computed(() => permission.value === 'company');
const userAreaId = computed(() => props.profile?.roles?.area_id || props.profile?.area_id || null);

const resolvedAreas = computed(() => {
  if (Array.isArray(props.areas) && props.areas.length > 0) {
    return props.areas;
  }
  return fetchedAreas.value;
});

const userAreaName = computed(() => {
  if (props.profile?.roles?.areas?.name) return props.profile.roles.areas.name;
  const found = resolvedAreas.value.find((a) => a.id === userAreaId.value);
  return found?.name || 'Mi Departamento';
});

const validCategory = (cat) => {
  const allowed = NEWS_CATEGORY_OPTIONS.map((o) => o.value);
  return allowed.includes(cat) ? cat : 'area';
};

const form = ref({
  title: '',
  body: '',
  category: validCategory(props.defaultCategory),
  scope: 'area',
  area_id: null,
  start_date: getTodayStr(),
  end_date: '',
  file: null,
});

const syncScopeWithPermission = () => {
  if (permission.value === 'company') {
    form.value.scope = 'company';
    form.value.area_id = null;
  } else {
    form.value.scope = 'area';
    form.value.area_id = userAreaId.value;
  }
};

const selectScope = (nextScope) => {
  if (!isCompanyPublisher.value) return;
  form.value.scope = nextScope;
  if (nextScope === 'company') {
    form.value.area_id = null;
  } else if (!form.value.area_id) {
    form.value.area_id = userAreaId.value || resolvedAreas.value[0]?.id || null;
  }
};

const areaNameById = (areaId) => {
  if (!areaId) return 'Área';
  const found = resolvedAreas.value.find((a) => a.id === areaId);
  return found?.name || 'Área';
};

const onFileChange = (event) => {
  const file = event?.target?.files?.[0] || null;
  form.value.file = file;
  errorMsg.value = '';
};

const clearSelectedFile = () => {
  form.value.file = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const fetchAreasIfNeeded = async () => {
  if (Array.isArray(props.areas) && props.areas.length > 0) return;
  try {
    const { data, error } = await supabase.from('areas').select('id, name').order('name');
    if (!error && Array.isArray(data)) {
      fetchedAreas.value = data;
    }
  } catch (err) {
    console.warn('No se pudieron cargar las áreas:', err);
  }
};

const fetchRecentNews = async () => {
  if (permission.value === 'none') {
    recentNews.value = [];
    return;
  }
  loadingRecent.value = true;
  try {
    const { data, error } = await supabase
      .from('corporate_news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Error cargando noticias recientes:', error);
      recentNews.value = [];
      return;
    }

    const list = data || [];
    if (isCompanyPublisher.value) {
      recentNews.value = list;
    } else {
      const uid = props.profile?.id;
      const myArea = userAreaId.value;
      recentNews.value = list.filter(
        (item) => (uid && item.created_by === uid) || (myArea && item.area_id === myArea)
      );
    }
  } catch (err) {
    console.warn('Error inesperado cargando noticias recientes:', err);
    recentNews.value = [];
  } finally {
    loadingRecent.value = false;
  }
};

const resetForm = () => {
  form.value = {
    title: '',
    body: '',
    category: validCategory(props.defaultCategory),
    scope: isCompanyPublisher.value ? 'company' : 'area',
    area_id: isCompanyPublisher.value ? null : userAreaId.value,
    start_date: getTodayStr(),
    end_date: '',
    file: null,
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const initModal = async () => {
  errorMsg.value = '';
  successMsg.value = '';
  resetForm();
  syncScopeWithPermission();
  await Promise.all([fetchAreasIfNeeded(), fetchRecentNews()]);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initModal();
    }
  },
  { immediate: true }
);

watch(
  () => props.profile,
  () => {
    if (props.modelValue) {
      syncScopeWithPermission();
    }
  }
);

const close = () => {
  emit('update:modelValue', false);
};

const isMissingColumnError = (err) => {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  );
};

const submitNews = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (permission.value === 'none') {
    errorMsg.value = 'No tienes permisos para publicar noticias.';
    return;
  }

  const trimmedTitle = form.value.title.trim();
  const trimmedBody = form.value.body.trim();

  if (!trimmedTitle) {
    errorMsg.value = 'El título del comunicado es obligatorio.';
    return;
  }

  if (!trimmedBody && !form.value.file) {
    errorMsg.value = 'Debes escribir un mensaje o adjuntar una imagen / flyer.';
    return;
  }

  const effectiveScope = isCompanyPublisher.value ? form.value.scope : 'area';
  const effectiveAreaId = effectiveScope === 'area'
    ? (isCompanyPublisher.value ? form.value.area_id : userAreaId.value)
    : null;

  if (effectiveScope === 'area' && !effectiveAreaId) {
    errorMsg.value = 'Debes seleccionar un departamento destinatario.';
    return;
  }

  publishing.value = true;
  try {
    let imageUrl = null;

    if (form.value.file) {
      const file = form.value.file;
      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `flyers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news_flyers')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('news_flyers')
        .getPublicUrl(filePath);
      imageUrl = publicUrlData?.publicUrl || null;
    }

    let createdBy = props.profile?.id || null;
    if (!createdBy && supabase.auth?.getUser) {
      const { data: userData } = await supabase.auth.getUser();
      createdBy = userData?.user?.id || null;
    }

    const fullPayload = {
      title: trimmedTitle,
      body: trimmedBody || null,
      image_url: imageUrl,
      scope: effectiveScope,
      area_id: effectiveAreaId,
      category: validCategory(form.value.category),
      author_name: props.profile?.full_name || null,
      created_by: createdBy,
      start_date: form.value.start_date || getTodayStr(),
      end_date: form.value.end_date || null,
    };

    let { error: insertError } = await supabase.from('corporate_news').insert(fullPayload);

    if (insertError && isMissingColumnError(insertError)) {
      const legacyPayload = {
        title: trimmedTitle,
        image_url: imageUrl || '',
        start_date: fullPayload.start_date,
        end_date: fullPayload.end_date,
        created_by: createdBy,
      };
      const fallbackRes = await supabase.from('corporate_news').insert(legacyPayload);
      insertError = fallbackRes.error;
    }

    if (insertError) throw insertError;

    successMsg.value = 'Comunicado publicado exitosamente.';
    resetForm();
    syncScopeWithPermission();
    await fetchRecentNews();
    emit('published', fullPayload);
  } catch (err) {
    console.error('Error publicando comunicado:', err);
    errorMsg.value = err?.message || 'Ocurrió un error al publicar el comunicado.';
  } finally {
    publishing.value = false;
  }
};

const deleteNewsItem = async (item) => {
  if (!item?.id) return;
  deletingId.value = item.id;
  errorMsg.value = '';
  try {
    const { error } = await supabase.from('corporate_news').delete().eq('id', item.id);
    if (error) throw error;
    recentNews.value = recentNews.value.filter((n) => n.id !== item.id);
    emit('published', { deletedId: item.id });
  } catch (err) {
    console.error('Error eliminando comunicado:', err);
    errorMsg.value = err?.message || 'No se pudo eliminar el comunicado.';
  } finally {
    deletingId.value = null;
  }
};
</script>

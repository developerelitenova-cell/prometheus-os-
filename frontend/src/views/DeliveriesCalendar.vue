<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased overflow-x-hidden pb-20 lg:pb-0">
    <main class="max-w-[1440px] mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <!-- Encabezado -->
      <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#b08d57]/15 text-[#8a6d3d] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[28px]">calendar_month</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">Calendario de Entregas</h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1d1d1f] text-white">
                {{ roleScopeLabel }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-[#86868b] mt-0.5">
              Consolidado de tareas asignadas y entregas programadas · Zona horaria America/Bogota (UTC-5)
            </p>
          </div>
        </div>

        <!-- Selector de Vista (Mes / Semana / Día) y Navegación -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-1 gap-1">
            <button
              v-for="v in VIEWS"
              :key="v.key"
              type="button"
              :data-testid="`view-btn-${v.key}`"
              @click="viewMode = v.key"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === v.key ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'
              ]"
            >
              {{ v.label }}
            </button>
          </div>

          <div class="flex items-center gap-1.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-1">
            <button
              type="button"
              @click="navigatePeriod(-1)"
              class="p-1.5 rounded-lg hover:bg-white text-[#1d1d1f] transition-colors cursor-pointer"
              title="Anterior"
            >
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              @click="goToToday"
              class="px-3 py-1 rounded-lg hover:bg-white text-xs font-bold text-[#1d1d1f] transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              @click="navigatePeriod(1)"
              class="p-1.5 rounded-lg hover:bg-white text-[#1d1d1f] transition-colors cursor-pointer"
              title="Siguiente"
            >
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Título del Período -->
      <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-base sm:text-lg font-bold text-[#1d1d1f] capitalize" data-testid="calendar-period-title">
            {{ periodLabel }}
          </h2>
          <span class="text-xs font-semibold text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-full">
            {{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'evento' : 'eventos' }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Filtro Área (solo Master Admin o Líder Nivel 1) -->
          <select
            v-if="canFilterByArea"
            v-model="filters.areaId"
            data-testid="filter-area"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todas las áreas</option>
            <option v-for="a in areasList" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>

          <!-- Filtro Responsable (solo Líderes y Admin) -->
          <select
            v-if="canFilterByUser"
            v-model="filters.userId"
            data-testid="filter-user"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todos los responsables</option>
            <option v-for="u in visibleUsers" :key="u.id" :value="u.id">{{ u.full_name }}</option>
          </select>

          <!-- Filtro Estado -->
          <select
            v-model="filters.status"
            data-testid="filter-status"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En progreso</option>
            <option value="overdue">Vencida</option>
            <option value="completed">Completada</option>
          </select>

          <!-- Filtro Prioridad -->
          <select
            v-model="filters.priority"
            data-testid="filter-priority"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-3xl border border-[#e5e5ea] p-12 text-center text-sm text-[#86868b]">
        Cargando calendario de entregas...
      </div>

      <!-- VISTA MES -->
      <div v-else-if="viewMode === 'month'" data-testid="calendar-month-view" class="space-y-4">
        <!-- Móvil (< 768px): Selector compacto de fechas + lista de eventos del día -->
        <div class="md:hidden bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 bg-[#fbfbfd] border-b border-[#e5e5ea]">
            <div v-for="d in WEEKDAY_LABELS" :key="'mob-h-' + d" class="py-2 text-center text-[10px] font-bold uppercase text-[#86868b]">
              {{ d }}
            </div>
          </div>
          <div class="grid grid-cols-7 divide-x divide-y divide-[#e5e5ea]">
            <button
              v-for="cell in monthGridCells"
              :key="'mob-c-' + cell.dateStr"
              type="button"
              @click="anchorDateStr = cell.dateStr"
              class="min-h-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors cursor-pointer"
              :class="[
                cell.dateStr === anchorDateStr ? 'bg-[#1d1d1f] text-white' : cell.inMonth ? 'bg-white text-[#1d1d1f]' : 'bg-[#f5f5f7]/60 text-[#86868b]',
                cell.dateStr === todayBogota && cell.dateStr !== anchorDateStr ? 'ring-2 ring-inset ring-[#0071e3]/50' : ''
              ]"
            >
              <span>{{ cell.dayNum }}</span>
              <span
                v-if="eventsByDate[cell.dateStr]?.length"
                class="w-1.5 h-1.5 rounded-full"
                :class="cell.dateStr === anchorDateStr ? 'bg-[#d4b06a]' : 'bg-[#0071e3]'"
              ></span>
            </button>
          </div>
        </div>

        <div class="md:hidden bg-white rounded-2xl border border-[#e5e5ea] p-4 space-y-2.5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Entregas del {{ anchorDateStr }} ({{ (eventsByDate[anchorDateStr] || []).length }})
          </h3>
          <p v-if="!(eventsByDate[anchorDateStr] || []).length" class="text-xs text-[#86868b] italic py-4 text-center">
            Sin entregas programadas para este día.
          </p>
          <button
            v-for="ev in (eventsByDate[anchorDateStr] || [])"
            :key="'mob-ev-' + ev.id"
            type="button"
            @click="selectedEvent = ev"
            class="w-full min-h-[44px] text-left p-3 rounded-xl border space-y-1 cursor-pointer"
            :class="eventCardStyle(ev)"
          >
            <div class="flex items-center justify-between gap-2 text-[10px] font-bold uppercase">
              <span>{{ statusLabel(ev.status) }}</span>
              <span>{{ priorityLabel(ev.priority) }}</span>
            </div>
            <p class="text-xs font-bold">{{ ev.title }}</p>
            <p class="text-[11px] opacity-85">{{ ev.responsibleName }}</p>
          </button>
        </div>

        <!-- Desktop (>= 768px): Grid completo 7 columnas -->
        <div class="hidden md:block bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 bg-[#fbfbfd] border-b border-[#e5e5ea]">
            <div v-for="d in WEEKDAY_LABELS" :key="d" class="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
              {{ d }}
            </div>
          </div>
          <div class="grid grid-cols-7 divide-x divide-y divide-[#e5e5ea]">
            <div
              v-for="cell in monthGridCells"
              :key="cell.dateStr"
              class="min-h-[120px] p-2 flex flex-col gap-1 transition-colors"
              :class="[
                cell.inMonth ? 'bg-white' : 'bg-[#f5f5f7]/60 text-[#86868b]',
                cell.dateStr === todayBogota ? 'ring-2 ring-inset ring-[#0071e3]/40 bg-blue-50/20' : ''
              ]"
            >
              <div class="flex items-center justify-between mb-1">
                <button
                  type="button"
                  @click="focusDay(cell.dateStr)"
                  class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                  :class="cell.dateStr === todayBogota ? 'bg-[#0071e3] text-white' : 'hover:bg-[#f5f5f7]'"
                >
                  {{ cell.dayNum }}
                </button>
                <span v-if="eventsByDate[cell.dateStr]?.length" class="text-[10px] font-bold text-[#86868b]">
                  {{ eventsByDate[cell.dateStr].length }}
                </span>
              </div>

              <div class="space-y-1 overflow-y-auto max-h-[110px]">
                <button
                  v-for="ev in (eventsByDate[cell.dateStr] || [])"
                  :key="ev.id"
                  type="button"
                  @click="selectedEvent = ev"
                  data-testid="calendar-event-item"
                  class="w-full text-left px-2 py-1 rounded-lg border text-[11px] leading-tight transition-all hover:shadow-xs cursor-pointer"
                  :class="eventCardStyle(ev)"
                >
                  <div class="font-bold truncate">{{ ev.title }}</div>
                  <div class="flex items-center justify-between gap-1 text-[10px] opacity-85 mt-0.5">
                    <span class="truncate">{{ ev.responsibleName }}</span>
                    <span class="shrink-0 font-bold uppercase">{{ priorityShort(ev.priority) }}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA SEMANA -->
      <div v-else-if="viewMode === 'week'" data-testid="calendar-week-view" class="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs flex flex-col min-h-[340px]"
          :class="day.dateStr === todayBogota ? 'ring-2 ring-[#0071e3]/40' : ''"
        >
          <div class="px-3 py-2.5 border-b border-[#e5e5ea] flex items-center justify-between bg-[#fbfbfd] rounded-t-2xl">
            <div>
              <p class="text-[10px] font-bold uppercase text-[#86868b]">{{ day.weekdayLabel }}</p>
              <p class="text-sm font-bold text-[#1d1d1f]">{{ day.dayNum }} {{ day.monthShort }}</p>
            </div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
              {{ (eventsByDate[day.dateStr] || []).length }}
            </span>
          </div>

          <div class="p-2.5 space-y-2 flex-1 overflow-y-auto">
            <div v-if="!(eventsByDate[day.dateStr] || []).length" class="text-[11px] text-[#86868b] italic text-center py-6">
              Sin entregas
            </div>
            <button
              v-for="ev in (eventsByDate[day.dateStr] || [])"
              :key="ev.id"
              type="button"
              @click="selectedEvent = ev"
              data-testid="calendar-event-item"
              class="w-full text-left p-2.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer space-y-1"
              :class="eventCardStyle(ev)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-bold uppercase">{{ statusLabel(ev.status) }}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70">{{ priorityLabel(ev.priority) }}</span>
              </div>
              <p class="text-xs font-bold leading-snug">{{ ev.title }}</p>
              <p class="text-[11px] opacity-85 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]">person</span>
                <span class="truncate">{{ ev.responsibleName }}</span>
              </p>
            </button>
          </div>
        </div>
      </div>

      <!-- VISTA DÍA -->
      <div v-else data-testid="calendar-day-view" class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-[#e5e5ea] pb-4">
          <div>
            <h3 class="text-lg font-bold text-[#1d1d1f]">Agenda del {{ anchorDateStr }}</h3>
            <p class="text-xs text-[#86868b]">Detalle completo de tareas y entregas programadas para este día</p>
          </div>
        </div>

        <div v-if="!(eventsByDate[anchorDateStr] || []).length" class="py-12 text-center text-sm text-[#86868b] italic">
          No hay tareas ni entregas programadas para esta fecha con los filtros actuales.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="ev in (eventsByDate[anchorDateStr] || [])"
            :key="ev.id"
            @click="selectedEvent = ev"
            data-testid="calendar-event-item"
            class="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all cursor-pointer"
            :class="eventCardStyle(ev)"
          >
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/80">
                  {{ ev.sourceType === 'scheduled_delivery' ? 'Entrega Programada' : 'Tarea Asignada' }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/80">
                  {{ statusLabel(ev.status) }}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/80">
                  Prioridad: {{ priorityLabel(ev.priority) }}
                </span>
                <span v-if="ev.time" class="text-xs font-mono font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">schedule</span>
                  {{ ev.time }}
                </span>
              </div>
              <h4 class="text-base font-bold">{{ ev.title }}</h4>
              <p v-if="ev.description" class="text-xs opacity-85">{{ ev.description }}</p>
            </div>

            <div class="flex items-center gap-2 shrink-0 text-xs font-semibold bg-white/70 px-3 py-2 rounded-xl">
              <span class="material-symbols-outlined text-[16px]">person</span>
              <div>
                <p class="font-bold">{{ ev.responsibleName }}</p>
                <p class="text-[10px] opacity-75">{{ ev.areaName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Detalle del Evento -->
      <div v-if="selectedEvent" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="selectedEvent = null">
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between bg-[#fbfbfd]">
            <span class="text-xs font-bold uppercase tracking-wider text-[#8a6d3d]">
              {{ selectedEvent.sourceType === 'scheduled_delivery' ? 'Entrega Programada' : 'Tarea Asignada' }}
            </span>
            <button type="button" @click="selectedEvent = null" class="text-[#86868b] hover:text-[#1d1d1f] cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-bold text-[#1d1d1f]">{{ selectedEvent.title }}</h3>
            <p v-if="selectedEvent.description" class="text-sm text-[#4a4a4f]">{{ selectedEvent.description }}</p>
            <div class="grid grid-cols-2 gap-3 text-xs bg-[#f5f5f7] p-4 rounded-2xl">
              <div>
                <span class="text-[#86868b] block">Responsable</span>
                <strong class="text-[#1d1d1f]">{{ selectedEvent.responsibleName }}</strong>
              </div>
              <div>
                <span class="text-[#86868b] block">Área</span>
                <strong class="text-[#1d1d1f]">{{ selectedEvent.areaName }}</strong>
              </div>
              <div>
                <span class="text-[#86868b] block">Fecha</span>
                <strong class="text-[#1d1d1f]">{{ selectedEvent.date }} {{ selectedEvent.time || '' }}</strong>
              </div>
              <div>
                <span class="text-[#86868b] block">Estado / Prioridad</span>
                <strong class="text-[#1d1d1f]">{{ statusLabel(selectedEvent.status) }} · {{ priorityLabel(selectedEvent.priority) }}</strong>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="selectedEvent = null" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold text-[#1d1d1f] cursor-pointer">
                Cerrar
              </button>
              <router-link to="/workspace" class="px-4 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-bold">
                Ir a Mi Espacio
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import { getBogotaDateStr } from '../utils/bogotaTime';
import { buildConsolidatedCalendarEvents } from '../utils/calendarEvents';

const VIEWS = [
  { key: 'month', label: 'Mes' },
  { key: 'week', label: 'Semana' },
  { key: 'day', label: 'Día' },
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const todayBogota = getBogotaDateStr();
const viewMode = ref('month');
const anchorDateStr = ref(todayBogota);
const loading = ref(true);
const selectedEvent = ref(null);

const rawTasks = ref([]);
const rawDeliveries = ref([]);
const rawCompletions = ref([]);
const allProfiles = ref([]);
const areasList = ref([]);

const filters = ref({
  areaId: 'all',
  userId: 'all',
  status: 'all',
  priority: 'all',
});

const isMaster = computed(() => Boolean(currentProfile.value?.is_master_admin));
const accessLevel = computed(() => currentProfile.value?.roles?.access_level ?? 3);
const isExecLeader = computed(() => !isMaster.value && accessLevel.value === 1);
const isAreaLeader = computed(() => !isMaster.value && accessLevel.value === 2);
const leaderAreaId = computed(() => currentProfile.value?.roles?.area_id || null);

const canFilterByArea = computed(() => isMaster.value || isExecLeader.value);
const canFilterByUser = computed(() => isMaster.value || isExecLeader.value || isAreaLeader.value);

const roleScopeLabel = computed(() => {
  if (isMaster.value) return 'Vista Global (Admin Master)';
  if (isExecLeader.value) return 'Vista Ejecutiva';
  if (isAreaLeader.value) return `Líder de Área · ${currentProfile.value?.roles?.areas?.name || 'Mi Área'}`;
  return 'Vista Personal (Colaborador)';
});

const visibleUsers = computed(() => {
  let list = allProfiles.value;
  if (isAreaLeader.value && leaderAreaId.value) {
    list = list.filter((p) => p.roles?.area_id === leaderAreaId.value);
  } else if (filters.value.areaId !== 'all') {
    list = list.filter((p) => p.roles?.area_id === filters.value.areaId);
  }
  return list;
});

const parseYmd = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
};

const formatYmd = (dt) => {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const monthGridCells = computed(() => {
  const anchor = parseYmd(anchorDateStr.value);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const firstDow = (firstDay.getUTCDay() + 6) % 7; // Lunes = 0
  const start = new Date(firstDay);
  start.setUTCDate(start.getUTCDate() - firstDow);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(start);
    cur.setUTCDate(start.getUTCDate() + i);
    cells.push({
      dateStr: formatYmd(cur),
      dayNum: cur.getUTCDate(),
      inMonth: cur.getUTCMonth() === month,
    });
  }
  return cells;
});

const weekDays = computed(() => {
  const anchor = parseYmd(anchorDateStr.value);
  const dow = (anchor.getUTCDay() + 6) % 7;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - dow);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setUTCDate(monday.getUTCDate() + i);
    days.push({
      dateStr: formatYmd(cur),
      dayNum: cur.getUTCDate(),
      weekdayLabel: WEEKDAY_LABELS[i],
      monthShort: MONTH_NAMES[cur.getUTCMonth()].slice(0, 3),
    });
  }
  return days;
});

const visibleRange = computed(() => {
  if (viewMode.value === 'month') {
    const cells = monthGridCells.value;
    return { start: cells[0].dateStr, end: cells[cells.length - 1].dateStr };
  }
  if (viewMode.value === 'week') {
    const days = weekDays.value;
    return { start: days[0].dateStr, end: days[days.length - 1].dateStr };
  }
  return { start: anchorDateStr.value, end: anchorDateStr.value };
});

const periodLabel = computed(() => {
  const anchor = parseYmd(anchorDateStr.value);
  if (viewMode.value === 'month') {
    return `${MONTH_NAMES[anchor.getUTCMonth()]} ${anchor.getUTCFullYear()}`;
  }
  if (viewMode.value === 'week') {
    return `Semana del ${visibleRange.value.start} al ${visibleRange.value.end}`;
  }
  return `Día ${anchorDateStr.value}`;
});

const profilesMap = computed(() => {
  const map = new Map();
  for (const p of allProfiles.value) {
    map.set(p.id, p);
  }
  if (currentProfile.value && !map.has(currentProfile.value.id)) {
    map.set(currentProfile.value.id, currentProfile.value);
  }
  return map;
});

const consolidatedEvents = computed(() => {
  return buildConsolidatedCalendarEvents({
    tasks: rawTasks.value,
    scheduledDeliveries: rawDeliveries.value,
    deliveryCompletions: rawCompletions.value,
    profilesMap: profilesMap.value,
    currentProfile: currentProfile.value,
    rangeStartStr: visibleRange.value.start,
    rangeEndStr: visibleRange.value.end,
  });
});

const filteredEvents = computed(() => {
  return consolidatedEvents.value.filter((ev) => {
    if (filters.value.areaId !== 'all' && ev.areaId !== filters.value.areaId) return false;
    if (filters.value.userId !== 'all' && ev.responsibleId !== filters.value.userId) return false;
    if (filters.value.status !== 'all' && ev.status !== filters.value.status) return false;
    if (filters.value.priority !== 'all' && ev.priority !== filters.value.priority) return false;
    return true;
  });
});

const eventsByDate = computed(() => {
  const map = {};
  for (const ev of filteredEvents.value) {
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  }
  return map;
});

const navigatePeriod = (delta) => {
  const anchor = parseYmd(anchorDateStr.value);
  if (viewMode.value === 'month') {
    anchor.setUTCMonth(anchor.getUTCMonth() + delta);
  } else if (viewMode.value === 'week') {
    anchor.setUTCDate(anchor.getUTCDate() + delta * 7);
  } else {
    anchor.setUTCDate(anchor.getUTCDate() + delta);
  }
  anchorDateStr.value = formatYmd(anchor);
};

const goToToday = () => {
  anchorDateStr.value = getBogotaDateStr();
};

const focusDay = (dateStr) => {
  anchorDateStr.value = dateStr;
  viewMode.value = 'day';
};

const statusLabel = (s) => {
  const map = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada', overdue: 'Vencida' };
  return map[s] || s;
};

const priorityLabel = (p) => {
  const map = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };
  return map[p] || 'Media';
};

const priorityShort = (p) => {
  const map = { urgent: 'URG', high: 'ALT', medium: 'MED', low: 'BAJ' };
  return map[p] || 'MED';
};

const eventCardStyle = (ev) => {
  if (ev.status === 'completed') return 'bg-[#f0fdf4] border-[#34c759]/40 text-[#1b6e2f]';
  if (ev.status === 'overdue') return 'bg-[#fff5f5] border-[#ff3b30]/40 text-[#c62828]';
  if (ev.priority === 'urgent' || ev.priority === 'high') return 'bg-amber-50 border-amber-300 text-amber-900';
  if (ev.status === 'in_progress') return 'bg-blue-50 border-blue-200 text-[#0071e3]';
  return 'bg-[#f5f5f7] border-[#d1d1d6] text-[#1d1d1f]';
};

const fetchCalendarData = async () => {
  loading.value = true;
  try {
    if (!currentProfile.value) {
      await loadCurrentProfile();
    }

    const [tasksRes, deliveriesRes, completionsRes, profilesRes, areasRes] = await Promise.all([
      supabase.from('tasks').select('*').order('due_date', { ascending: true }),
      supabase.from('scheduled_deliveries').select('*').eq('active', true),
      supabase.from('scheduled_delivery_completions').select('delivery_id, profile_id, period_key'),
      supabase.from('profiles').select('id, full_name, role_id, is_master_admin, roles(id, name, access_level, area_id, areas(id, name))'),
      supabase.from('areas').select('id, name').order('name'),
    ]);

    rawTasks.value = tasksRes.data || [];
    rawDeliveries.value = deliveriesRes.data || [];
    rawCompletions.value = completionsRes.data || [];
    allProfiles.value = profilesRes.data || [];
    areasList.value = areasRes.data || [];
  } catch (err) {
    console.error('Error cargando calendario de entregas:', err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => filters.value.areaId,
  () => {
    if (filters.value.userId !== 'all') {
      const exists = visibleUsers.value.some((u) => u.id === filters.value.userId);
      if (!exists) filters.value.userId = 'all';
    }
  }
);

onMounted(fetchCalendarData);
</script>


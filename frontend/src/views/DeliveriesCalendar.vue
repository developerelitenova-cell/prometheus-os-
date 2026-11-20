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

        <!-- Selector de Vista (Mes / Semana / Día), Navegación y Nueva Anotación -->
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div class="flex items-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-1 gap-1">
            <button
              v-for="v in VIEWS"
              :key="v.key"
              type="button"
              :data-testid="`view-btn-${v.key}`"
              @click="viewMode = v.key"
              :class="[
                'min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
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
              class="min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:bg-white text-[#1d1d1f] transition-colors cursor-pointer flex items-center justify-center"
              title="Anterior"
            >
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              @click="goToToday"
              class="min-h-[36px] px-3 py-1 rounded-lg hover:bg-white text-xs font-bold text-[#1d1d1f] transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              @click="navigatePeriod(1)"
              class="min-h-[36px] min-w-[36px] p-1.5 rounded-lg hover:bg-white text-[#1d1d1f] transition-colors cursor-pointer flex items-center justify-center"
              title="Siguiente"
            >
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="add-calendar-note-btn"
            @click="openNewNoteModal(anchorDateStr, viewMode)"
            class="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#b08d57] to-[#8a6d3d] text-white text-xs font-bold shadow-sm hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
            <span>+ Nueva Anotación</span>
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Título del Período -->
      <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2.5">
          <h2 class="text-base sm:text-lg font-bold text-[#1d1d1f] capitalize" data-testid="calendar-period-title">
            {{ periodLabel }}
          </h2>
          <span class="text-xs font-semibold text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-full">
            {{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'evento' : 'eventos' }}
          </span>
          <span
            v-if="visibleNotes.length > 0"
            class="text-xs font-semibold text-[#8a6d3d] bg-[#fdf8ee] border border-[#b08d57]/30 px-2.5 py-1 rounded-full"
          >
            {{ visibleNotes.length }} {{ visibleNotes.length === 1 ? 'anotación' : 'anotaciones' }}
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
        <!-- Anotaciones Mensuales (Bitácora Nova Work del Mes) -->
        <div
          data-testid="calendar-month-notes-panel"
          class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-4 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-[18px] text-[#8a6d3d]">sticky_note_2</span>
              <h3 class="text-xs sm:text-sm font-bold text-[#1d1d1f]">Anotaciones del Mes</h3>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fdf8ee] text-[#8a6d3d] border border-[#b08d57]/30">
                {{ groupedNotes.monthNotes.length }}
              </span>
            </div>
            <button
              type="button"
              data-testid="add-month-note-btn"
              @click="openNewNoteModal(anchorDateStr, 'month')"
              class="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#fdf8ee] hover:bg-[#b08d57]/20 border border-[#b08d57]/40 text-[#8a6d3d] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[15px]">add</span>
              <span>+ Nota Mensual</span>
            </button>
          </div>

          <div v-if="groupedNotes.monthNotes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <button
              v-for="note in groupedNotes.monthNotes"
              :key="note.id"
              type="button"
              data-testid="calendar-note-item"
              @click="openNoteModal(note)"
              class="text-left p-3 rounded-xl border transition-all hover:shadow-xs cursor-pointer space-y-1 min-w-0"
              :class="getCategoryMeta(note.category).cardClasses"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border" :class="getCategoryMeta(note.category).badgeClasses">
                  <span class="material-symbols-outlined text-[12px]">{{ getCategoryMeta(note.category).icon }}</span>
                  {{ getCategoryMeta(note.category).label }}
                </span>
                <span class="text-[10px] font-semibold opacity-75">{{ visibilityLabel(note.visibility) }}</span>
              </div>
              <p class="text-xs font-bold truncate">{{ note.title }}</p>
              <p v-if="note.content" class="text-[11px] opacity-85 line-clamp-2">{{ note.content }}</p>
            </button>
          </div>
          <p v-else class="text-xs text-[#86868b] italic">
            Sin anotaciones mensuales registradas. Usa "+ Nota Mensual" para destacar hitos o recordatorios de Nova Work.
          </p>
        </div>

        <!-- Móvil (< 768px): Selector compacto de fechas + lista de eventos y notas del día -->
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
              <div class="flex items-center gap-1 h-1.5">
                <span
                  v-if="eventsByDate[cell.dateStr]?.length"
                  class="w-1.5 h-1.5 rounded-full"
                  :class="cell.dateStr === anchorDateStr ? 'bg-[#0a84ff]' : 'bg-[#0071e3]'"
                ></span>
                <span
                  v-if="(groupedNotes.dayNotesByDate[cell.dateStr] || []).length"
                  class="w-1.5 h-1.5 rounded-full bg-[#d4b06a]"
                ></span>
              </div>
            </button>
          </div>
        </div>

        <div class="md:hidden bg-white rounded-2xl border border-[#e5e5ea] p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#86868b]">
              Agenda del {{ anchorDateStr }}
            </h3>
            <button
              type="button"
              @click="openNewNoteModal(anchorDateStr, 'day')"
              class="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#fdf8ee] border border-[#b08d57]/40 text-[#8a6d3d] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[15px]">edit_note</span>
              <span>+ Anotación</span>
            </button>
          </div>

          <div v-if="(groupedNotes.dayNotesByDate[anchorDateStr] || []).length > 0" class="space-y-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#8a6d3d]">Anotaciones del día</p>
            <button
              v-for="note in (groupedNotes.dayNotesByDate[anchorDateStr] || [])"
              :key="'mob-note-' + note.id"
              type="button"
              data-testid="calendar-note-item"
              @click="openNoteModal(note)"
              class="w-full min-h-[44px] text-left p-3 rounded-xl border space-y-1 cursor-pointer"
              :class="getCategoryMeta(note.category).cardClasses"
            >
              <div class="flex items-center justify-between gap-2 text-[10px] font-bold uppercase">
                <span>{{ getCategoryMeta(note.category).label }}</span>
                <span>{{ visibilityLabel(note.visibility) }}</span>
              </div>
              <p class="text-xs font-bold">{{ note.title }}</p>
              <p v-if="note.content" class="text-[11px] opacity-85 line-clamp-2">{{ note.content }}</p>
            </button>
          </div>

          <div class="space-y-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
              Entregas ({{ (eventsByDate[anchorDateStr] || []).length }})
            </p>
            <p v-if="!(eventsByDate[anchorDateStr] || []).length" class="text-xs text-[#86868b] italic py-3 text-center">
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
              class="min-h-[125px] p-2 flex flex-col gap-1 transition-colors group"
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
                <div class="flex items-center gap-1">
                  <span v-if="eventsByDate[cell.dateStr]?.length" class="text-[10px] font-bold text-[#86868b]">
                    {{ eventsByDate[cell.dateStr].length }}
                  </span>
                  <button
                    type="button"
                    data-testid="quick-add-note-day"
                    @click.stop="openNewNoteModal(cell.dateStr, 'day')"
                    class="w-5 h-5 rounded-full bg-[#fdf8ee] hover:bg-[#b08d57] text-[#8a6d3d] hover:text-white border border-[#b08d57]/35 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                    :title="`Agregar anotación para ${cell.dateStr}`"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="space-y-1 overflow-y-auto max-h-[115px]">
                <button
                  v-for="note in (groupedNotes.dayNotesByDate[cell.dateStr] || [])"
                  :key="note.id"
                  type="button"
                  @click.stop="openNoteModal(note)"
                  data-testid="calendar-note-item"
                  class="w-full text-left px-2 py-1 rounded-lg border text-[11px] leading-tight transition-all hover:shadow-xs cursor-pointer flex items-center gap-1"
                  :class="getCategoryMeta(note.category).cardClasses"
                >
                  <span class="material-symbols-outlined text-[12px] shrink-0">{{ getCategoryMeta(note.category).icon }}</span>
                  <span class="font-bold truncate">{{ note.title }}</span>
                </button>

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
      <div v-else-if="viewMode === 'week'" data-testid="calendar-week-view" class="space-y-4">
        <!-- Anotaciones de la Semana -->
        <div
          data-testid="calendar-week-notes-panel"
          class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-4 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-[18px] text-[#8a6d3d]">date_range</span>
              <h3 class="text-xs sm:text-sm font-bold text-[#1d1d1f]">Anotaciones de la Semana</h3>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fdf8ee] text-[#8a6d3d] border border-[#b08d57]/30">
                {{ groupedNotes.weekNotes.length }}
              </span>
            </div>
            <button
              type="button"
              data-testid="add-week-note-btn"
              @click="openNewNoteModal(weekDays[0]?.dateStr || anchorDateStr, 'week')"
              class="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#fdf8ee] hover:bg-[#b08d57]/20 border border-[#b08d57]/40 text-[#8a6d3d] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[15px]">add</span>
              <span>+ Nota Semanal</span>
            </button>
          </div>

          <div v-if="groupedNotes.weekNotes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <button
              v-for="note in groupedNotes.weekNotes"
              :key="note.id"
              type="button"
              data-testid="calendar-note-item"
              @click="openNoteModal(note)"
              class="text-left p-3 rounded-xl border transition-all hover:shadow-xs cursor-pointer space-y-1 min-w-0"
              :class="getCategoryMeta(note.category).cardClasses"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border" :class="getCategoryMeta(note.category).badgeClasses">
                  <span class="material-symbols-outlined text-[12px]">{{ getCategoryMeta(note.category).icon }}</span>
                  {{ getCategoryMeta(note.category).label }}
                </span>
                <span class="text-[10px] font-semibold opacity-75">{{ visibilityLabel(note.visibility) }}</span>
              </div>
              <p class="text-xs font-bold truncate">{{ note.title }}</p>
              <p v-if="note.content" class="text-[11px] opacity-85 line-clamp-2">{{ note.content }}</p>
            </button>
          </div>
          <p v-else class="text-xs text-[#86868b] italic">
            Sin anotaciones semanales registradas para este período.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
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
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
                  {{ (eventsByDate[day.dateStr] || []).length + (groupedNotes.dayNotesByDate[day.dateStr] || []).length }}
                </span>
                <button
                  type="button"
                  data-testid="quick-add-note-day"
                  @click.stop="openNewNoteModal(day.dateStr, 'day')"
                  class="w-6 h-6 rounded-full bg-[#fdf8ee] hover:bg-[#b08d57] text-[#8a6d3d] hover:text-white border border-[#b08d57]/35 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  :title="`Agregar anotación para ${day.dateStr}`"
                >
                  +
                </button>
              </div>
            </div>

            <div class="p-2.5 space-y-2 flex-1 overflow-y-auto">
              <div
                v-if="!(eventsByDate[day.dateStr] || []).length && !(groupedNotes.dayNotesByDate[day.dateStr] || []).length"
                class="text-[11px] text-[#86868b] italic text-center py-6"
              >
                Sin entregas ni notas
              </div>

              <button
                v-for="note in (groupedNotes.dayNotesByDate[day.dateStr] || [])"
                :key="note.id"
                type="button"
                @click="openNoteModal(note)"
                data-testid="calendar-note-item"
                class="w-full text-left p-2 rounded-xl border transition-all hover:shadow-sm cursor-pointer space-y-1"
                :class="getCategoryMeta(note.category).cardClasses"
              >
                <div class="flex items-center justify-between gap-1 text-[10px] font-bold uppercase">
                  <span class="inline-flex items-center gap-1">
                    <span class="material-symbols-outlined text-[12px]">{{ getCategoryMeta(note.category).icon }}</span>
                    Nota
                  </span>
                  <span>{{ getCategoryMeta(note.category).label }}</span>
                </div>
                <p class="text-xs font-bold leading-snug">{{ note.title }}</p>
                <p v-if="note.content" class="text-[11px] opacity-85 line-clamp-2">{{ note.content }}</p>
              </button>

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
      </div>

      <!-- VISTA DÍA -->
      <div v-else data-testid="calendar-day-view" class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5ea] pb-4">
          <div>
            <h3 class="text-lg font-bold text-[#1d1d1f]">Agenda del {{ anchorDateStr }}</h3>
            <p class="text-xs text-[#86868b]">Detalle completo de anotaciones, tareas y entregas programadas para este día</p>
          </div>
          <button
            type="button"
            data-testid="add-day-note-btn"
            @click="openNewNoteModal(anchorDateStr, 'day')"
            class="min-h-[44px] px-4 py-2 rounded-xl bg-[#fdf8ee] hover:bg-[#b08d57]/20 border border-[#b08d57]/40 text-[#8a6d3d] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
            <span>+ Anotación del Día</span>
          </button>
        </div>

        <!-- Anotaciones de la Jornada (Día + contexto Semanal/Mensual aplicable) -->
        <div data-testid="calendar-day-notes-section" class="space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#8a6d3d] flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">sticky_note_2</span>
              <span>Anotaciones de la Jornada ({{ activeDayAllNotes.length }})</span>
            </h4>
          </div>

          <div v-if="activeDayAllNotes.length === 0" class="p-4 rounded-2xl bg-[#fbfbfd] border border-dashed border-[#e5e5ea] text-xs text-[#86868b] italic text-center">
            No hay anotaciones registradas para este día. Haz clic en "+ Anotación del Día" para agregar notas operativas.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="note in activeDayAllNotes"
              :key="'day-view-' + note.id"
              type="button"
              data-testid="calendar-note-item"
              @click="openNoteModal(note)"
              class="text-left p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer space-y-1.5"
              :class="getCategoryMeta(note.category).cardClasses"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border" :class="getCategoryMeta(note.category).badgeClasses">
                    <span class="material-symbols-outlined text-[12px]">{{ getCategoryMeta(note.category).icon }}</span>
                    {{ getCategoryMeta(note.category).label }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/80 text-[#1d1d1f]">
                    Alcance: {{ getScopeLabel(note.scope) }}
                  </span>
                </div>
                <span class="text-[10px] font-bold uppercase opacity-75">
                  {{ canEditCalendarNote(note, currentProfile) ? 'Editar' : visibilityLabel(note.visibility) }}
                </span>
              </div>
              <h5 class="text-sm font-bold">{{ note.title }}</h5>
              <p v-if="note.content" class="text-xs opacity-90 whitespace-pre-wrap">{{ note.content }}</p>
            </button>
          </div>
        </div>

        <div class="space-y-3 pt-2 border-t border-[#f2f2f7]">
          <h4 class="text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Tareas y Entregas Programadas ({{ (eventsByDate[anchorDateStr] || []).length }})
          </h4>

          <div v-if="!(eventsByDate[anchorDateStr] || []).length" class="py-8 text-center text-sm text-[#86868b] italic">
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

      <!-- Modal Crear / Editar Anotación de Calendario -->
      <div
        v-if="showNoteModal"
        data-testid="calendar-note-modal"
        class="fixed inset-0 z-[145] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="closeNoteModal"
      >
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e5e5ea] overflow-hidden flex flex-col max-h-[92vh]">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between bg-[#fbfbfd]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-[#8a6d3d]">edit_calendar</span>
              <span class="text-xs font-bold uppercase tracking-wider text-[#8a6d3d]">
                {{ !noteForm.id ? 'Nueva Anotación en Calendario' : (canEditActiveNote ? 'Editar Anotación' : 'Detalle de Anotación') }}
              </span>
            </div>
            <button type="button" @click="closeNoteModal" class="text-[#86868b] hover:text-[#1d1d1f] cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveCalendarNote" class="p-6 space-y-4 overflow-y-auto">
            <div v-if="noteError" class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {{ noteError }}
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                Título de la Anotación <span class="text-red-500">*</span>
              </label>
              <input
                v-model="noteForm.title"
                type="text"
                required
                :disabled="!canEditActiveNote"
                data-testid="note-title-input"
                placeholder="Ej. Cierre fiscal Nova Work, Comité comercial, Novedad operativa..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Alcance</label>
                <select
                  v-model="noteForm.scope"
                  :disabled="!canEditActiveNote"
                  data-testid="note-scope-select"
                  class="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] text-xs font-semibold outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
                >
                  <option v-for="s in CALENDAR_NOTE_SCOPES" :key="s.key" :value="s.key">
                    {{ s.label }}
                  </option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Fecha de Referencia</label>
                <input
                  v-model="noteForm.note_date"
                  type="date"
                  required
                  :disabled="!canEditActiveNote"
                  data-testid="note-date-input"
                  class="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] text-xs font-semibold outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Categoría</label>
                <select
                  v-model="noteForm.category"
                  :disabled="!canEditActiveNote"
                  data-testid="note-category-select"
                  class="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] text-xs font-semibold outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
                >
                  <option v-for="c in CALENDAR_NOTE_CATEGORIES" :key="c.key" :value="c.key">
                    {{ c.label }}
                  </option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Visibilidad</label>
                <select
                  v-model="noteForm.visibility"
                  :disabled="!canEditActiveNote"
                  data-testid="note-visibility-select"
                  class="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] bg-[#fbfbfd] text-xs font-semibold outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
                >
                  <option value="personal">Personal (Solo yo)</option>
                  <option value="area">Mi Área</option>
                  <option v-if="isMaster || isExecLeader || isAreaLeader" value="company">Toda la Empresa</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Detalle / Observaciones</label>
              <textarea
                v-model="noteForm.content"
                rows="3"
                :disabled="!canEditActiveNote"
                data-testid="note-content-input"
                placeholder="Coloca anotaciones importantes respecto a Nova Work, novedades de operación, acuerdos o recordatorios clave..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm outline-none focus:border-[#b08d57] disabled:bg-[#f5f5f7]"
              ></textarea>
            </div>

            <div class="pt-3 border-t border-[#e5e5ea] flex flex-wrap items-center justify-between gap-2">
              <div v-if="noteForm.id && canEditActiveNote" class="flex items-center gap-2">
                <button
                  v-if="!confirmingNoteDelete"
                  type="button"
                  data-testid="delete-note-btn"
                  @click="confirmingNoteDelete = true"
                  class="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-[15px]">delete</span>
                  <span>Eliminar</span>
                </button>
                <div v-else class="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="confirm-delete-note-btn"
                    :disabled="noteSaving"
                    @click="removeCalendarNote"
                    class="min-h-[40px] px-3 py-2 rounded-xl bg-[#ff3b30] text-white text-xs font-bold cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    @click="confirmingNoteDelete = false"
                    class="min-h-[40px] px-2.5 py-2 rounded-xl bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <span v-else></span>

              <div class="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  @click="closeNoteModal"
                  class="min-h-[40px] px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold text-[#1d1d1f] cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  v-if="canEditActiveNote"
                  type="submit"
                  data-testid="save-note-btn"
                  :disabled="noteSaving"
                  class="min-h-[40px] px-5 py-2 rounded-xl bg-[#1d1d1f] hover:bg-[#3a3a3c] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {{ noteSaving ? 'Guardando...' : (noteForm.id ? 'Guardar Cambios' : 'Guardar Anotación') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Toast de confirmación -->
      <div
        v-if="calendarToast"
        class="fixed bottom-6 right-6 z-[160] px-4 py-2.5 rounded-2xl bg-[#1d1d1f] text-white text-xs font-bold shadow-xl"
      >
        {{ calendarToast }}
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import { getBogotaDateStr } from '../utils/bogotaTime';
import { buildConsolidatedCalendarEvents } from '../utils/calendarEvents';
import {
  CALENDAR_NOTE_CATEGORIES,
  CALENDAR_NOTE_SCOPES,
  getCategoryMeta,
  getScopeLabel,
  filterVisibleCalendarNotes,
  canEditCalendarNote,
  groupCalendarNotesForView,
  fetchCalendarNotesFromStore,
  upsertCalendarNoteInStore,
  deleteCalendarNoteInStore,
} from '../utils/calendarNotes';

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
const rawCalendarNotes = ref([]);
const allProfiles = ref([]);
const areasList = ref([]);

const showNoteModal = ref(false);
const editingNote = ref(null);
const noteForm = ref({
  id: null,
  title: '',
  content: '',
  note_date: todayBogota,
  scope: 'day',
  category: 'nova',
  visibility: 'personal',
});
const noteError = ref('');
const noteSaving = ref(false);
const confirmingNoteDelete = ref(false);
const calendarToast = ref('');
let toastTimer = null;

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

const visibleNotes = computed(() => {
  return filterVisibleCalendarNotes(rawCalendarNotes.value, currentProfile.value);
});

const groupedNotes = computed(() => {
  return groupCalendarNotesForView(visibleNotes.value, {
    anchorDateStr: anchorDateStr.value,
    weekStartStr: weekDays.value[0]?.dateStr,
    weekEndStr: weekDays.value[6]?.dateStr,
  });
});

const activeDayAllNotes = computed(() => {
  const combined = [
    ...(groupedNotes.value.dayNotesByDate[anchorDateStr.value] || []),
    ...(groupedNotes.value.weekNotes || []),
    ...(groupedNotes.value.monthNotes || []),
  ];
  const seen = new Set();
  return combined.filter((n) => {
    if (!n?.id || seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
});

const canEditActiveNote = computed(() => {
  if (!noteForm.value.id) return true;
  return canEditCalendarNote(editingNote.value, currentProfile.value);
});

const visibilityLabel = (v) => {
  const map = { personal: 'Personal', area: 'Mi Área', company: 'Empresa' };
  return map[v] || 'Personal';
};

const showToast = (msg) => {
  calendarToast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    calendarToast.value = '';
  }, 3000);
};

const openNewNoteModal = (dateStr = anchorDateStr.value, scope = 'day') => {
  editingNote.value = null;
  noteError.value = '';
  confirmingNoteDelete.value = false;
  noteForm.value = {
    id: null,
    title: '',
    content: '',
    note_date: dateStr || anchorDateStr.value,
    scope: ['day', 'week', 'month'].includes(scope) ? scope : 'day',
    category: 'nova',
    visibility: 'personal',
  };
  showNoteModal.value = true;
};

const openNoteModal = (note) => {
  if (!note) return;
  editingNote.value = note;
  noteError.value = '';
  confirmingNoteDelete.value = false;
  noteForm.value = {
    id: note.id,
    title: note.title || '',
    content: note.content || '',
    note_date: String(note.note_date || anchorDateStr.value).slice(0, 10),
    scope: note.scope || 'day',
    category: note.category || 'nova',
    visibility: note.visibility || 'personal',
    profile_id: note.profile_id,
    area_id: note.area_id,
    created_at: note.created_at,
  };
  showNoteModal.value = true;
};

const closeNoteModal = () => {
  showNoteModal.value = false;
  confirmingNoteDelete.value = false;
  noteError.value = '';
};

const saveCalendarNote = async () => {
  noteError.value = '';
  if (!String(noteForm.value.title || '').trim()) {
    noteError.value = 'El título de la anotación es obligatorio.';
    return;
  }
  if (!String(noteForm.value.note_date || '').trim()) {
    noteError.value = 'Debes seleccionar una fecha de referencia.';
    return;
  }

  noteSaving.value = true;
  try {
    const isEditing = Boolean(noteForm.value.id);
    const { note } = await upsertCalendarNoteInStore(
      supabase,
      { ...noteForm.value },
      currentProfile.value
    );

    if (note) {
      const idx = rawCalendarNotes.value.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const next = [...rawCalendarNotes.value];
        next[idx] = note;
        rawCalendarNotes.value = next;
      } else {
        rawCalendarNotes.value = [...rawCalendarNotes.value, note];
      }
    }

    closeNoteModal();
    showToast(isEditing ? 'Anotación actualizada correctamente.' : 'Anotación guardada en el calendario.');
  } catch (err) {
    noteError.value = err?.message || 'Error al guardar la anotación.';
  } finally {
    noteSaving.value = false;
  }
};

const removeCalendarNote = async () => {
  if (!noteForm.value.id) return;
  noteSaving.value = true;
  noteError.value = '';
  try {
    await deleteCalendarNoteInStore(supabase, noteForm.value.id);
    rawCalendarNotes.value = rawCalendarNotes.value.filter((n) => n.id !== noteForm.value.id);
    closeNoteModal();
    showToast('Anotación eliminada del calendario.');
  } catch (err) {
    noteError.value = err?.message || 'No fue posible eliminar la anotación.';
  } finally {
    noteSaving.value = false;
  }
};

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

    const [tasksRes, deliveriesRes, completionsRes, profilesRes, areasRes, notesRes] = await Promise.all([
      supabase.from('tasks').select('*').order('due_date', { ascending: true }),
      supabase.from('scheduled_deliveries').select('*').eq('active', true),
      supabase.from('scheduled_delivery_completions').select('delivery_id, profile_id, period_key'),
      supabase.from('profiles').select('id, full_name, role_id, is_master_admin, roles(id, name, access_level, area_id, areas(id, name))'),
      supabase.from('areas').select('id, name').order('name'),
      fetchCalendarNotesFromStore(supabase),
    ]);

    rawTasks.value = tasksRes.data || [];
    rawDeliveries.value = deliveriesRes.data || [];
    rawCompletions.value = completionsRes.data || [];
    allProfiles.value = profilesRes.data || [];
    areasList.value = areasRes.data || [];
    rawCalendarNotes.value = notesRes?.notes || [];
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

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>


<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased overflow-x-hidden pb-20 lg:pb-0">
    <main class="max-w-[1600px] mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">
      <!-- Cabecera del Proyecto y Progreso EDT en Tiempo Real -->
      <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 space-y-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-[#0052cc]/10 text-[#0052cc] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px]">view_kanban</span>
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  {{ activeProject ? activeProject.name : 'Proyectos Kanban & EDT' }}
                </h1>
                <span v-if="activeProject" class="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#f5f5f7] text-[#42526e] border border-[#dfe1e6]">
                  {{ activeProject.code }}
                </span>
                <span v-if="activeProject?.areas?.name" class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#b08d57]/15 text-[#8a6d3d]">
                  {{ activeProject.areas.name }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-[#6b778c]">
                {{ activeProject?.description || 'Seguimiento visual tipo Jira con avance ponderado automático por Entregables de Trabajo (EDT).' }}
              </p>
            </div>
          </div>

          <!-- Selector de Proyecto + Acciones -->
          <div class="flex flex-wrap items-center gap-2.5">
            <select
              v-if="projects.length > 0"
              v-model="selectedProjectId"
              data-testid="project-selector"
              class="px-3.5 py-2 rounded-xl bg-[#f5f5f7] border border-[#dfe1e6] text-xs font-bold text-[#1d1d1f] outline-none focus:border-[#0052cc]"
            >
              <option v-for="p in projects" :key="p.id" :value="p.id">
                [{{ p.code }}] {{ p.name }} ({{ Number(p.progress_percentage || 0).toFixed(0) }}%)
              </option>
            </select>

            <button
              v-if="canConfigure"
              type="button"
              @click="openNewProjectModal"
              data-testid="new-project-btn"
              class="px-3.5 py-2 rounded-xl bg-[#1d1d1f] hover:bg-[#3a3a3c] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>Nuevo Proyecto</span>
            </button>

            <button
              v-if="activeProject && canConfigure"
              type="button"
              @click="openColumnsModal"
              data-testid="config-columns-btn"
              class="px-3.5 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#dfe1e6] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">tune</span>
              <span>Columnas</span>
            </button>

            <button
              v-if="activeProject"
              type="button"
              @click="openNewEdtModal(null)"
              data-testid="new-edt-btn"
              class="px-3.5 py-2 rounded-xl bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">playlist_add</span>
              <span>Nuevo EDT</span>
            </button>
          </div>
        </div>

        <!-- Barra de Progreso Dinámico EDT -->
        <div v-if="activeProject" class="bg-[#f8f9fb] border border-[#ebecf0] rounded-2xl p-4 space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0052cc] text-[18px]">insights</span>
              <span class="text-xs font-bold uppercase tracking-wider text-[#42526e]">
                Avance Ponderado del Proyecto (EDT)
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="text-[#5e6c84] font-medium">
                Peso completado:
                <strong class="text-[#1d1d1f]">{{ projectProgress.completedWeight }}</strong> / {{ projectProgress.totalWeight }} pts
                ({{ projectProgress.completedCount }}/{{ projectProgress.totalCount }} entregables)
              </span>
              <span
                data-testid="project-progress-text"
                class="px-2.5 py-0.5 rounded-full font-black text-xs"
                :class="projectProgress.percentage >= 100 ? 'bg-[#e3fcef] text-[#006644]' : 'bg-[#deebff] text-[#0747a6]'"
              >
                {{ projectProgress.percentage }}%
              </span>
            </div>
          </div>

          <div class="w-full h-3 rounded-full bg-[#dfe1e6] overflow-hidden">
            <div
              data-testid="project-progress-bar"
              class="h-full rounded-full transition-all duration-500"
              :class="projectProgress.percentage >= 100 ? 'bg-[#36b37e]' : 'bg-gradient-to-r from-[#0052cc] to-[#2684ff]'"
              :style="{ width: `${Math.min(100, projectProgress.percentage)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Barra de Vistas (Tablero Kanban vs Árbol EDT) y Filtros -->
      <div v-if="activeProject" class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-[#f5f5f7] border border-[#dfe1e6] rounded-xl p-1 gap-1">
            <button
              type="button"
              data-testid="tab-kanban"
              @click="activeTab = 'kanban'"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                activeTab === 'kanban' ? 'bg-white text-[#0052cc] shadow-xs' : 'text-[#5e6c84] hover:text-[#1d1d1f]'
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">view_column</span>
              <span>Tablero Kanban</span>
            </button>
            <button
              type="button"
              data-testid="tab-edt"
              @click="activeTab = 'edt'"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                activeTab === 'edt' ? 'bg-white text-[#0052cc] shadow-xs' : 'text-[#5e6c84] hover:text-[#1d1d1f]'
              ]"
            >
              <span class="material-symbols-outlined text-[16px]">account_tree</span>
              <span>Estructura EDT (Padre → Hijo)</span>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar código o título EDT..."
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#dfe1e6] text-xs text-[#1d1d1f] outline-none focus:border-[#0052cc] w-48"
          />

          <select
            v-model="filters.parentId"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#dfe1e6] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#0052cc]"
          >
            <option value="all">Todas las fases EDT</option>
            <option v-for="ph in parentPhases" :key="ph.id" :value="ph.id">
              {{ ph.edt_code }} · {{ ph.title }}
            </option>
          </select>

          <select
            v-model="filters.assigneeId"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#dfe1e6] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#0052cc]"
          >
            <option value="all">Todos los responsables</option>
            <option v-for="u in profilesList" :key="u.id" :value="u.id">{{ u.full_name }}</option>
          </select>

          <select
            v-model="filters.priority"
            class="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#dfe1e6] text-xs font-semibold text-[#1d1d1f] outline-none focus:border-[#0052cc]"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      <!-- Estado Vacío / Cargando -->
      <div v-if="loading" class="bg-white rounded-3xl border border-[#e5e5ea] p-12 text-center text-sm text-[#6b778c]">
        Cargando proyectos y tablero EDT...
      </div>

      <div v-else-if="projects.length === 0" class="bg-white rounded-3xl border border-[#e5e5ea] p-12 text-center space-y-3">
        <span class="material-symbols-outlined text-[48px] text-[#0052cc]/40">view_kanban</span>
        <h3 class="text-lg font-bold text-[#1d1d1f]">Aún no hay proyectos creados</h3>
        <p class="text-sm text-[#6b778c] max-w-md mx-auto">
          Crea el primer proyecto para organizar sus Entregables de Trabajo (EDT) en el tablero Kanban y monitorear su porcentaje de avance.
        </p>
        <button
          v-if="canConfigure"
          type="button"
          @click="openNewProjectModal"
          class="px-5 py-2.5 rounded-xl bg-[#0052cc] text-white text-xs font-bold cursor-pointer"
        >
          + Crear Primer Proyecto
        </button>
      </div>

      <!-- VISTA 1: TABLERO KANBAN (Estilo Jira: Carrusel/Tabs en Móvil + Grid en Desktop) -->
      <div v-else-if="activeTab === 'kanban'" data-testid="kanban-board" class="space-y-3">
        <!-- Selector de Columna para Móvil (< 768px) -->
        <div class="flex md:hidden gap-1.5 overflow-x-auto pb-1" data-testid="mobile-kanban-tabs">
          <button
            v-for="col in projectColumns"
            :key="'mob-' + col.key"
            type="button"
            @click="activeMobileColKey = col.key"
            class="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer"
            :class="activeMobileColKey === col.key ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs' : 'bg-white text-[#42526e] border-[#dfe1e6]'"
          >
            <span>{{ col.label }}</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" :class="activeMobileColKey === col.key ? 'bg-white/20 text-white' : 'bg-[#f4f5f7] text-[#172b4d]'">
              {{ (cardsByColumn[col.key] || []).length }}
            </span>
          </button>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
        >
        <div
          v-for="col in projectColumns"
          :key="col.key"
          :data-testid="`kanban-column-${col.key}`"
          @dragover.prevent="dragOverCol = col.key"
          @dragleave="dragOverCol = null"
          @drop.prevent="onDropToColumn(col.key)"
          class="rounded-2xl bg-[#ebecf0]/75 border transition-all flex-col min-h-[380px] md:min-h-[460px] p-3"
          :class="[
            activeMobileColKey === col.key ? 'flex' : 'hidden md:flex',
            dragOverCol === col.key ? 'border-[#0052cc] bg-[#deebff]/60 ring-2 ring-[#0052cc]/25' : 'border-[#dfe1e6]'
          ]"
        >
          <!-- Header Columna -->
          <div class="flex items-center justify-between px-1.5 py-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :class="col.is_done ? 'bg-[#36b37e]' : col.key === 'in_progress' ? 'bg-[#0052cc]' : col.key === 'in_review' ? 'bg-[#ffab00]' : 'bg-[#6b778c]'"
              ></span>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#42526e] truncate">
                {{ col.label }}
              </h3>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#172b4d] shadow-2xs">
                {{ (cardsByColumn[col.key] || []).length }}
              </span>
            </div>
            <span class="text-[11px] font-semibold text-[#5e6c84]">
              {{ columnWeightSum(col.key) }} pts
            </span>
          </div>

          <!-- Lista de Tarjetas EDT -->
          <div class="space-y-2.5 flex-1">
            <div
              v-for="card in (cardsByColumn[col.key] || [])"
              :key="card.id"
              :data-testid="`edt-card-${card.id}`"
              draggable="true"
              @dragstart="onDragStart(card, $event)"
              @dragend="onDragEnd"
              class="bg-white rounded-xl border border-[#dfe1e6] p-3.5 shadow-2xs hover:shadow-md hover:border-[#0052cc]/50 transition-all cursor-grab active:cursor-grabbing space-y-2.5"
              :class="{ 'opacity-50 scale-[0.98]': draggingItem?.id === card.id }"
            >
              <!-- Fila superior: ID + Fase Padre + Prioridad -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="px-1.5 py-0.5 rounded bg-[#deebff] text-[#0747a6] font-mono text-[10px] font-extrabold shrink-0">
                    {{ activeProject.code }}-{{ card.edt_code }}
                  </span>
                  <span
                    v-if="card.parent_id && parentMap[card.parent_id]"
                    class="text-[10px] font-semibold text-[#5e6c84] truncate"
                    :title="parentMap[card.parent_id].title"
                  >
                    {{ parentMap[card.parent_id].edt_code }} · {{ parentMap[card.parent_id].title }}
                  </span>
                </div>
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0"
                  :class="priorityBadgeClass(card.priority)"
                >
                  {{ priorityLabel(card.priority) }}
                </span>
              </div>

              <!-- Título del EDT -->
              <h4 class="text-[13px] font-bold text-[#172b4d] leading-snug">
                {{ card.title }}
              </h4>

              <!-- Peso y Porcentaje sobre el proyecto -->
              <div class="flex items-center justify-between text-[11px] bg-[#f4f5f7] px-2.5 py-1.5 rounded-lg">
                <span class="font-semibold text-[#42526e]">
                  Peso: <strong class="text-[#172b4d]">{{ card.weight }} pts</strong>
                </span>
                <span class="font-bold text-[#0052cc]">
                  {{ weightShare(card) }}% del proyecto
                </span>
              </div>

              <!-- Responsable & Fecha límite -->
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-[#f4f5f7] text-[11px]">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    {{ initials(assigneeName(card.assignee_id)) }}
                  </span>
                  <span class="truncate text-[#42526e] font-medium">{{ assigneeName(card.assignee_id) }}</span>
                </div>
                <span
                  v-if="card.due_date"
                  class="font-semibold shrink-0 flex items-center gap-0.5"
                  :class="isCardOverdue(card, col) ? 'text-[#de350b]' : 'text-[#5e6c84]'"
                >
                  <span class="material-symbols-outlined text-[13px]">event</span>
                  {{ card.due_date }}
                </span>
              </div>

              <!-- Selector rápido de estado (accesibilidad / táctil / tests) -->
              <div class="flex items-center justify-between gap-2 pt-1">
                <select
                  :value="card.status"
                  :data-testid="`card-status-select-${card.id}`"
                  @change="transitionCardStatus(card, $event.target.value)"
                  class="flex-1 px-2 py-1 rounded-lg bg-[#f4f5f7] border border-[#dfe1e6] text-[11px] font-semibold text-[#172b4d] outline-none focus:border-[#0052cc]"
                >
                  <option v-for="c in projectColumns" :key="c.key" :value="c.key">
                    {{ c.label }}
                  </option>
                </select>
                <button
                  type="button"
                  @click="openEditEdtModal(card)"
                  class="p-1 rounded-lg text-[#5e6c84] hover:bg-[#f4f5f7] hover:text-[#172b4d] cursor-pointer"
                  title="Editar entregable"
                >
                  <span class="material-symbols-outlined text-[15px]">edit</span>
                </button>
              </div>
            </div>

            <div v-if="(cardsByColumn[col.key] || []).length === 0" class="py-10 text-center text-xs text-[#6b778c] italic">
              Arrastra un entregable aquí
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- VISTA 2: ESTRUCTURA EDT JERÁRQUICA (Padre -> Hijo) -->
      <div v-else data-testid="edt-hierarchy-view" class="space-y-4">
        <div
          v-for="phase in parentPhases"
          :key="phase.id"
          class="bg-white rounded-2xl border border-[#dfe1e6] shadow-xs overflow-hidden"
        >
          <div class="px-5 py-4 bg-[#f8f9fb] border-b border-[#ebecf0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-lg bg-[#1d1d1f] text-white font-mono text-xs font-bold">
                EDT {{ phase.edt_code }}
              </span>
              <div>
                <h3 class="text-sm font-bold text-[#172b4d]">{{ phase.title }}</h3>
                <p v-if="phase.description" class="text-xs text-[#5e6c84]">{{ phase.description }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="text-right text-xs">
                <span class="font-bold text-[#0052cc]">
                  {{ parentProgress(phase.id).percentage }}%
                </span>
                <span class="text-[#5e6c84] block text-[11px]">
                  {{ parentProgress(phase.id).completedWeight }} / {{ parentProgress(phase.id).totalWeight }} pts
                </span>
              </div>
              <button
                type="button"
                @click="openNewEdtModal(phase.id)"
                class="px-3 py-1.5 rounded-xl bg-[#deebff] text-[#0747a6] text-xs font-bold hover:bg-[#b3d4ff] transition-colors cursor-pointer"
              >
                + Sub-entregable
              </button>
            </div>
          </div>

          <div class="divide-y divide-[#ebecf0]">
            <div
              v-for="child in childrenByParent[phase.id] || []"
              :key="child.id"
              class="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f8f9fb]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="font-mono text-xs font-bold text-[#0052cc] shrink-0">{{ child.edt_code }}</span>
                <span class="text-sm font-semibold text-[#172b4d] truncate">{{ child.title }}</span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f4f5f7] text-[#42526e] shrink-0">
                  {{ child.weight }} pts ({{ weightShare(child) }}%)
                </span>
              </div>
              <div class="flex items-center gap-3 shrink-0 text-xs">
                <span class="text-[#5e6c84]">{{ assigneeName(child.assignee_id) }}</span>
                <select
                  :value="child.status"
                  @change="transitionCardStatus(child, $event.target.value)"
                  class="px-2.5 py-1 rounded-lg bg-[#f4f5f7] border border-[#dfe1e6] text-xs font-semibold"
                >
                  <option v-for="c in projectColumns" :key="c.key" :value="c.key">{{ c.label }}</option>
                </select>
              </div>
            </div>
            <div v-if="!(childrenByParent[phase.id] || []).length" class="px-5 py-4 text-xs text-[#6b778c] italic">
              Esta fase aún no tiene sub-entregables. Agrega uno con "+ Sub-entregable" para reflejarlo en el Kanban.
            </div>
          </div>
        </div>

        <!-- Entregables sueltos sin fase padre -->
        <div v-if="standaloneEdts.length > 0" class="bg-white rounded-2xl border border-[#dfe1e6] shadow-xs overflow-hidden">
          <div class="px-5 py-3 bg-[#f8f9fb] border-b border-[#ebecf0] text-xs font-bold uppercase text-[#5e6c84]">
            Entregables Independientes
          </div>
          <div class="divide-y divide-[#ebecf0]">
            <div
              v-for="item in standaloneEdts"
              :key="item.id"
              class="px-5 py-3 flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <span class="font-mono text-xs font-bold text-[#0052cc]">{{ item.edt_code }}</span>
                <span class="text-sm font-semibold text-[#172b4d]">{{ item.title }}</span>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f4f5f7]">{{ item.weight }} pts</span>
              </div>
              <select
                :value="item.status"
                @change="transitionCardStatus(item, $event.target.value)"
                class="px-2.5 py-1 rounded-lg bg-[#f4f5f7] border border-[#dfe1e6] text-xs font-semibold"
              >
                <option v-for="c in projectColumns" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR PROYECTO -->
      <div v-if="showProjectModal" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showProjectModal = false">
        <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1d1d1f]">Nuevo Proyecto</h3>
            <button type="button" @click="showProjectModal = false" class="text-[#6b778c] hover:text-[#1d1d1f] cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <form @submit.prevent="saveProject" class="p-6 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Código *</label>
                <input v-model="projectForm.code" required maxlength="10" placeholder="PRJ-01" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs font-mono uppercase" />
              </div>
              <div class="col-span-2">
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Nombre del Proyecto *</label>
                <input v-model="projectForm.name" required placeholder="Ej: Lanzamiento Planta 2" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs" />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Descripción</label>
              <textarea v-model="projectForm.description" rows="2" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs"></textarea>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Área</label>
              <select v-model="projectForm.area_id" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs bg-white">
                <option value="">General / Todas las áreas</option>
                <option v-for="a in areasList" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showProjectModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
              <button type="submit" :disabled="saving" class="px-5 py-2 rounded-xl bg-[#0052cc] text-white text-xs font-bold cursor-pointer">
                {{ saving ? 'Creando...' : 'Crear Proyecto' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR EDT -->
      <div v-if="showEdtModal" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showEdtModal = false">
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1d1d1f]">{{ editingEdtId ? 'Editar Entregable EDT' : 'Nuevo Entregable EDT' }}</h3>
            <button type="button" @click="showEdtModal = false" class="text-[#6b778c] hover:text-[#1d1d1f] cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <form @submit.prevent="saveEdtItem" class="p-6 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Código EDT *</label>
                <input v-model="edtForm.edt_code" required placeholder="1.1" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs font-mono" />
              </div>
              <div class="col-span-2">
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Fase Padre (Opcional)</label>
                <select v-model="edtForm.parent_id" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs bg-white">
                  <option :value="null">-- Fase Principal / Independiente --</option>
                  <option v-for="ph in parentPhases.filter(p => p.id !== editingEdtId)" :key="ph.id" :value="ph.id">
                    {{ ph.edt_code }} · {{ ph.title }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Título del EDT *</label>
              <input v-model="edtForm.title" required placeholder="Ej: Aprobación de planos eléctricos" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs" />
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Descripción</label>
              <textarea v-model="edtForm.description" rows="2" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs"></textarea>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Peso (pts) *</label>
                <input v-model.number="edtForm.weight" type="number" min="0" step="0.5" required class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs font-bold" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Fecha Límite</label>
                <input v-model="edtForm.due_date" type="date" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Prioridad</label>
                <select v-model="edtForm.priority" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs bg-white">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Responsable</label>
                <select v-model="edtForm.assignee_id" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs bg-white">
                  <option :value="null">-- Sin asignar --</option>
                  <option v-for="u in profilesList" :key="u.id" :value="u.id">{{ u.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Estado Inicial</label>
                <select v-model="edtForm.status" class="w-full px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs bg-white">
                  <option v-for="c in projectColumns" :key="c.key" :value="c.key">{{ c.label }}</option>
                </select>
              </div>
            </div>

            <div class="flex justify-between items-center pt-2">
              <button
                v-if="editingEdtId && canConfigure"
                type="button"
                @click="deleteEdtItem(editingEdtId)"
                class="px-3 py-2 rounded-xl text-xs font-bold text-[#de350b] hover:bg-red-50 cursor-pointer"
              >
                Eliminar EDT
              </button>
              <div class="flex gap-2 ml-auto">
                <button type="button" @click="showEdtModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
                <button type="submit" :disabled="saving" class="px-5 py-2 rounded-xl bg-[#0052cc] text-white text-xs font-bold cursor-pointer">
                  {{ saving ? 'Guardando...' : 'Guardar EDT' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CONFIGURAR COLUMNAS KANBAN -->
      <div v-if="showColumnsModal" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showColumnsModal = false">
        <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1d1d1f]">Configurar Columnas del Tablero</h3>
            <button type="button" @click="showColumnsModal = false" class="text-[#6b778c] hover:text-[#1d1d1f] cursor-pointer">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="p-6 space-y-3">
            <div v-for="(col, idx) in columnsDraft" :key="col.key" class="flex items-center gap-2">
              <input v-model="col.label" class="flex-1 px-3 py-2 rounded-xl border border-[#dfe1e6] text-xs font-semibold" />
              <label class="flex items-center gap-1 text-[11px] font-semibold text-[#42526e] shrink-0">
                <input type="checkbox" v-model="col.is_done" />
                Final
              </label>
              <button
                v-if="columnsDraft.length > 2"
                type="button"
                @click="columnsDraft.splice(idx, 1)"
                class="p-1 text-[#de350b] hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <span class="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
            <button
              type="button"
              @click="addColumnDraft"
              class="text-xs font-bold text-[#0052cc] hover:underline cursor-pointer"
            >
              + Agregar columna
            </button>
            <div class="flex justify-end gap-2 pt-3 border-t border-[#ebecf0]">
              <button type="button" @click="showColumnsModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
              <button type="button" @click="saveColumnsConfig" class="px-5 py-2 rounded-xl bg-[#0052cc] text-white text-xs font-bold cursor-pointer">
                Guardar Columnas
              </button>
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
import {
  DEFAULT_KANBAN_COLUMNS,
  getDoneColumnKeys,
  getExecutableEdtItems,
  calculateProjectProgress,
  calculateParentEdtProgress,
  getEdtWeightShare,
} from '../utils/projectProgress';

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('kanban');
const projects = ref([]);
const selectedProjectId = ref('');
const edtItems = ref([]);
const profilesList = ref([]);
const areasList = ref([]);

const draggingItem = ref(null);
const dragOverCol = ref(null);
const activeMobileColKey = ref('todo');

const filters = ref({
  search: '',
  parentId: 'all',
  assigneeId: 'all',
  priority: 'all',
});

const showProjectModal = ref(false);
const projectForm = ref({ code: 'PRJ-01', name: '', description: '', area_id: '' });

const showEdtModal = ref(false);
const editingEdtId = ref(null);
const edtForm = ref({
  parent_id: null,
  edt_code: '1.1',
  title: '',
  description: '',
  status: 'todo',
  weight: 10,
  assignee_id: null,
  due_date: '',
  priority: 'medium',
});

const showColumnsModal = ref(false);
const columnsDraft = ref([]);

const canConfigure = computed(() => {
  if (currentProfile.value?.is_master_admin) return true;
  const lvl = currentProfile.value?.roles?.access_level;
  return lvl === 1 || lvl === 2;
});

const activeProject = computed(() => {
  return projects.value.find((p) => p.id === selectedProjectId.value) || null;
});

const projectColumns = computed(() => {
  const cols = activeProject.value?.kanban_columns;
  return Array.isArray(cols) && cols.length > 0 ? cols : DEFAULT_KANBAN_COLUMNS;
});

const projectProgress = computed(() => {
  return calculateProjectProgress(edtItems.value, projectColumns.value);
});

const parentPhases = computed(() => {
  const childParentIds = new Set(edtItems.value.filter((i) => i.parent_id).map((i) => i.parent_id));
  return edtItems.value
    .filter((i) => !i.parent_id && (childParentIds.has(i.id) || String(i.edt_code).endsWith('.0')))
    .sort((a, b) => String(a.edt_code).localeCompare(String(b.edt_code), undefined, { numeric: true }));
});

const parentMap = computed(() => {
  const map = {};
  for (const p of edtItems.value) {
    map[p.id] = p;
  }
  return map;
});

const childrenByParent = computed(() => {
  const map = {};
  for (const item of edtItems.value) {
    if (item.parent_id) {
      if (!map[item.parent_id]) map[item.parent_id] = [];
      map[item.parent_id].push(item);
    }
  }
  return map;
});

const standaloneEdts = computed(() => {
  const phaseIds = new Set(parentPhases.value.map((p) => p.id));
  return edtItems.value.filter((i) => !i.parent_id && !phaseIds.has(i.id));
});

const executableCards = computed(() => {
  const leaves = getExecutableEdtItems(edtItems.value);
  return leaves.filter((item) => {
    if (filters.value.parentId !== 'all' && item.parent_id !== filters.value.parentId) return false;
    if (filters.value.assigneeId !== 'all' && item.assignee_id !== filters.value.assigneeId) return false;
    if (filters.value.priority !== 'all' && item.priority !== filters.value.priority) return false;
    if (filters.value.search.trim()) {
      const q = filters.value.search.trim().toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchCode = (item.edt_code || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCode) return false;
    }
    return true;
  });
});

const cardsByColumn = computed(() => {
  const map = {};
  for (const col of projectColumns.value) {
    map[col.key] = [];
  }
  const fallbackKey = projectColumns.value[0]?.key || 'todo';
  for (const card of executableCards.value) {
    const k = map[card.status] ? card.status : fallbackKey;
    map[k].push(card);
  }
  return map;
});

const columnWeightSum = (colKey) => {
  const sum = (cardsByColumn.value[colKey] || []).reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
  return Number(sum.toFixed(1));
};

const weightShare = (item) => getEdtWeightShare(item, projectProgress.value.totalWeight);
const parentProgress = (parentId) => calculateParentEdtProgress(parentId, edtItems.value, projectColumns.value);

const assigneeName = (id) => {
  if (!id) return 'Sin asignar';
  return profilesList.value.find((p) => p.id === id)?.full_name || 'Colaborador';
};

const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const priorityLabel = (p) => ({ urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' }[p] || 'Media');
const priorityBadgeClass = (p) => {
  if (p === 'urgent') return 'bg-red-100 text-red-700';
  if (p === 'high') return 'bg-orange-100 text-orange-700';
  if (p === 'low') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-50 text-amber-700';
};

const isCardOverdue = (card, col) => {
  if (col?.is_done || !card.due_date) return false;
  return card.due_date < getBogotaDateStr();
};

const onDragStart = (card, evt) => {
  draggingItem.value = card;
  if (evt?.dataTransfer) {
    evt.dataTransfer.effectAllowed = 'move';
    evt.dataTransfer.setData('text/plain', card.id);
  }
};

const onDragEnd = () => {
  draggingItem.value = null;
  dragOverCol.value = null;
};

const onDropToColumn = async (targetColKey) => {
  dragOverCol.value = null;
  const card = draggingItem.value;
  draggingItem.value = null;
  if (!card || card.status === targetColKey) return;
  await transitionCardStatus(card, targetColKey);
};

const persistProjectProgress = async (projectId) => {
  const prog = calculateProjectProgress(edtItems.value, projectColumns.value);
  if (activeProject.value) {
    activeProject.value.progress_percentage = prog.percentage;
  }
  await supabase
    .from('projects')
    .update({ progress_percentage: prog.percentage, updated_at: new Date().toISOString() })
    .eq('id', projectId);
};

/**
 * Actualización optimista de estado de un EDT y persistencia en backend / Supabase.
 */
const transitionCardStatus = async (card, targetStatus) => {
  if (!card || card.status === targetStatus) return;

  const previousStatus = card.status;
  const previousCompletedAt = card.completed_at;
  const doneKeys = getDoneColumnKeys(projectColumns.value);
  const nowIso = new Date().toISOString();

  // 1. Actualización optimista inmediata en UI (recalcula projectProgress reactivamente)
  card.status = targetStatus;
  card.completed_at = doneKeys.has(targetStatus) ? nowIso : null;

  try {
    let apiSynced = false;
    if (apiUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch(`${apiUrl}/api/v1/edt/${card.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ status: targetStatus }),
          });
          if (res.ok) {
            const json = await res.json();
            if (activeProject.value && json.progress) {
              activeProject.value.progress_percentage = json.progress.percentage;
            }
            apiSynced = true;
          }
        }
      } catch (_) {}
    }

    if (!apiSynced) {
      const { error } = await supabase
        .from('project_edt_items')
        .update({
          status: targetStatus,
          completed_at: card.completed_at,
          updated_at: nowIso,
        })
        .eq('id', card.id);
      if (error) throw error;
      await persistProjectProgress(card.project_id);
    }
  } catch (err) {
    console.error('Error persistiendo transición EDT, revirtiendo:', err);
    card.status = previousStatus;
    card.completed_at = previousCompletedAt;
  }
};

const loadBoard = async (projectId) => {
  if (!projectId) {
    edtItems.value = [];
    return;
  }
  const { data } = await supabase
    .from('project_edt_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });
  edtItems.value = data || [];
};

const fetchAllData = async () => {
  loading.value = true;
  try {
    if (!currentProfile.value) {
      await loadCurrentProfile();
    }
    const [projRes, profRes, areaRes] = await Promise.all([
      supabase.from('projects').select('*, areas(name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').order('full_name'),
      supabase.from('areas').select('id, name').order('name'),
    ]);
    projects.value = projRes.data || [];
    profilesList.value = profRes.data || [];
    areasList.value = areaRes.data || [];

    if (projects.value.length > 0 && !selectedProjectId.value) {
      selectedProjectId.value = projects.value[0].id;
    }
    if (selectedProjectId.value) {
      await loadBoard(selectedProjectId.value);
    }
  } catch (err) {
    console.error('Error cargando proyectos:', err);
  } finally {
    loading.value = false;
  }
};

const openNewProjectModal = () => {
  projectForm.value = { code: `PRJ-${String(projects.value.length + 1).padStart(2, '0')}`, name: '', description: '', area_id: '' };
  showProjectModal.value = true;
};

const saveProject = async () => {
  if (!projectForm.value.name.trim()) return;
  saving.value = true;
  try {
    const payload = {
      code: projectForm.value.code.trim().toUpperCase(),
      name: projectForm.value.name.trim(),
      description: projectForm.value.description.trim() || null,
      area_id: projectForm.value.area_id || null,
      owner_id: currentProfile.value?.id || null,
      created_by: currentProfile.value?.id || null,
      kanban_columns: DEFAULT_KANBAN_COLUMNS,
      progress_percentage: 0,
    };
    const { data, error } = await supabase.from('projects').insert(payload).select('*, areas(name)').single();
    if (error) throw error;
    projects.value.unshift(data);
    selectedProjectId.value = data.id;
    showProjectModal.value = false;
  } catch (err) {
    alert('Error creando proyecto: ' + err.message);
  } finally {
    saving.value = false;
  }
};

const openNewEdtModal = (parentId = null) => {
  editingEdtId.value = null;
  const count = edtItems.value.filter((i) => i.parent_id === parentId).length + 1;
  const parentObj = parentId ? parentMap.value[parentId] : null;
  const suggestedCode = parentObj
    ? `${String(parentObj.edt_code).split('.')[0]}.${count}`
    : `${count}.0`;

  edtForm.value = {
    parent_id: parentId,
    edt_code: suggestedCode,
    title: '',
    description: '',
    status: projectColumns.value[0]?.key || 'todo',
    weight: 10,
    assignee_id: null,
    due_date: '',
    priority: 'medium',
  };
  showEdtModal.value = true;
};

const openEditEdtModal = (item) => {
  editingEdtId.value = item.id;
  edtForm.value = {
    parent_id: item.parent_id || null,
    edt_code: item.edt_code,
    title: item.title,
    description: item.description || '',
    status: item.status,
    weight: Number(item.weight) || 0,
    assignee_id: item.assignee_id || null,
    due_date: item.due_date || '',
    priority: item.priority || 'medium',
  };
  showEdtModal.value = true;
};

const saveEdtItem = async () => {
  if (!activeProject.value || !edtForm.value.title.trim()) return;
  saving.value = true;
  try {
    const doneKeys = getDoneColumnKeys(projectColumns.value);
    const payload = {
      project_id: activeProject.value.id,
      parent_id: edtForm.value.parent_id || null,
      edt_code: edtForm.value.edt_code.trim(),
      title: edtForm.value.title.trim(),
      description: edtForm.value.description.trim() || null,
      status: edtForm.value.status,
      weight: Number(edtForm.value.weight) || 0,
      assignee_id: edtForm.value.assignee_id || null,
      due_date: edtForm.value.due_date || null,
      priority: edtForm.value.priority,
      completed_at: doneKeys.has(edtForm.value.status) ? new Date().toISOString() : null,
    };

    if (editingEdtId.value) {
      const { data, error } = await supabase
        .from('project_edt_items')
        .update(payload)
        .eq('id', editingEdtId.value)
        .select()
        .single();
      if (error) throw error;
      const idx = edtItems.value.findIndex((i) => i.id === editingEdtId.value);
      if (idx !== -1) edtItems.value[idx] = data;
    } else {
      const { data, error } = await supabase
        .from('project_edt_items')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      edtItems.value.push(data);
    }

    await persistProjectProgress(activeProject.value.id);
    showEdtModal.value = false;
  } catch (err) {
    alert('Error guardando EDT: ' + err.message);
  } finally {
    saving.value = false;
  }
};

const deleteEdtItem = async (id) => {
  if (!confirm('¿Eliminar este entregable EDT?')) return;
  const { error } = await supabase.from('project_edt_items').delete().eq('id', id);
  if (!error) {
    edtItems.value = edtItems.value.filter((i) => i.id !== id && i.parent_id !== id);
    await persistProjectProgress(activeProject.value.id);
    showEdtModal.value = false;
  }
};

const openColumnsModal = () => {
  columnsDraft.value = projectColumns.value.map((c) => ({ ...c }));
  showColumnsModal.value = true;
};

const addColumnDraft = () => {
  const key = `col_${Date.now()}`;
  columnsDraft.value.push({ key, label: 'Nueva columna', is_done: false });
};

const saveColumnsConfig = async () => {
  if (!activeProject.value) return;
  const clean = columnsDraft.value.filter((c) => c.label.trim());
  const { error } = await supabase
    .from('projects')
    .update({ kanban_columns: clean })
    .eq('id', activeProject.value.id);
  if (!error) {
    activeProject.value.kanban_columns = clean;
    await persistProjectProgress(activeProject.value.id);
    showColumnsModal.value = false;
  }
};

watch(selectedProjectId, (newId) => {
  if (newId) loadBoard(newId);
});

onMounted(fetchAllData);
</script>


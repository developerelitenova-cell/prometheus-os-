<template>
  <div class="miro-process-view bg-[#f4f2ee] font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col select-none overflow-hidden h-screen">
    
    <!-- TOP TOOLBAR (Miro Style Header) -->
    <header class="bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high/60 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-40 shadow-xs">
      
      <!-- Brand & Title -->
      <div class="flex items-center gap-3">
        <button @click="$router.back()" class="p-1.5 rounded-xl hover:bg-surface-container text-secondary hover:text-on-surface transition-colors cursor-pointer" title="Volver">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4b06a] to-[#8a6d3d] flex items-center justify-center text-white shadow-sm shrink-0">
          <span class="material-symbols-outlined text-[20px]">account_tree</span>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base md:text-lg font-bold text-on-surface tracking-tight leading-none">
              Mapa de Procesos con IA
            </h1>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-[11px] font-bold uppercase tracking-wider">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Lienzo Miro
            </span>
          </div>
          <p class="text-[11px] text-secondary mt-0.5 line-clamp-1">
            Cartografía operativa visual · Entradas, actividades, cuellos de botella y KPIs asistidos por IA
          </p>
        </div>
      </div>

      <!-- Area & Role Selectors -->
      <div class="flex items-center gap-2 flex-wrap">
        
        <!-- Filter Area -->
        <div class="relative">
          <select 
            v-model="selectedAreaId" 
            @change="onAreaChange" 
            class="bg-surface-container-low pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold text-on-surface border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
            <option value="all">Todas las Áreas ({{ areas.length }})</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
          </select>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">expand_more</span>
        </div>

        <!-- Filter Role -->
        <div class="relative">
          <select 
            v-model="selectedRoleId" 
            @change="onRoleChange" 
            class="bg-surface-container-low pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold text-primary border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none max-w-[200px] sm:max-w-[260px] truncate">
            <option v-for="r in filteredRoles" :key="r.id" :value="r.id">
              {{ r.name }} {{ mappedRoleIds.has(r.id) ? '✓' : '(Sin Mapear)' }}
            </option>
          </select>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none text-[16px]">expand_more</span>
        </div>

        <!-- AI Assistant Action Button -->
        <button 
          @click="openAiPanel"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 active:scale-95 text-white font-label-sm text-xs font-semibold shadow-xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[16px]">neurology</span>
          <span>Oráculo IA</span>
        </button>

        <!-- Switch to Hierarchy Organigram -->
        <router-link 
          to="/mapa-cargos" 
          class="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-label-sm text-xs transition-colors"
          title="Ver en vista de Organigrama jerárquico">
          <span class="material-symbols-outlined text-[15px]">corporate_fare</span>
          <span>Organigrama</span>
        </router-link>
      </div>

      <!-- Zoom & Viewport Controls -->
      <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/40">
        <button @click="zoomOut" class="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Alejar zoom">
          <span class="material-symbols-outlined text-[16px]">remove</span>
        </button>
        <span class="px-1.5 text-[11px] font-bold text-secondary min-w-[38px] text-center">{{ Math.round(zoom * 100) }}%</span>
        <button @click="zoomIn" class="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Acercar zoom">
          <span class="material-symbols-outlined text-[16px]">add</span>
        </button>
        <div class="w-px h-3.5 bg-surface-container-high mx-0.5"></div>
        <button @click="resetZoom" class="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Centrar lienzo">
          <span class="material-symbols-outlined text-[16px]">center_focus_strong</span>
        </button>
      </div>
    </header>

    <!-- MAIN CANVAS AREA (Miro Infinite Canvas) -->
    <div 
      class="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      ref="canvasContainer"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel.prevent="handleWheel"
    >
      <!-- Miro Grid Background Pattern -->
      <div class="absolute inset-0 bg-[radial-gradient(#b08d57_1.2px,transparent_1.2px)] [background-size:26px_26px] opacity-20 pointer-events-none"></div>

      <!-- Zoomable & Pannable Board Wrapper -->
      <div 
        class="absolute origin-top-left transition-transform duration-75 ease-out min-w-[1500px] p-12"
        :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }"
      >
        
        <!-- Role Meta Header on Board (Sticky note style) -->
        <div class="inline-flex items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#e8d9b5]/80 mb-8">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span class="material-symbols-outlined text-[28px]">badge</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-xs font-bold uppercase tracking-wider">
                {{ currentRole?.areas?.name || 'Área Corporativa' }}
              </span>
              <span v-if="hasWorkflow" class="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 font-caption text-xs font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-green-600"></span> Proceso Mapeado
              </span>
              <span v-else class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-caption text-xs font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Pendiente de Mapeo
              </span>
            </div>
            <h2 class="text-2xl font-extrabold text-on-surface tracking-tight mt-0.5">{{ currentRole?.name || 'Selecciona un Cargo' }}</h2>
          </div>

          <!-- Quick Action Buttons on Role Header -->
          <div class="flex items-center gap-2 ml-6 pl-6 border-l border-surface-container-high/60">
            <button 
              v-if="!hasWorkflow"
              @click="generateWorkflowWithAi" 
              :disabled="generatingAi"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 active:scale-95 text-white font-label-md text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50">
              <span class="material-symbols-outlined text-[16px] animate-spin" v-if="generatingAi">refresh</span>
              <span class="material-symbols-outlined text-[16px]" v-else>auto_awesome</span>
              <span>Generar con Oráculo IA</span>
            </button>
            <button 
              v-else
              @click="auditWorkflowWithAi" 
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold shadow-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-primary text-[16px]">insights</span>
              <span>Auditar Cuellos de Botella</span>
            </button>
            <button 
              @click="exportProcessMarkdown" 
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-label-md text-xs transition-colors cursor-pointer"
              title="Descargar documentación en Markdown">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <!-- GENERATING ANIMATION (Neuron Overlay) -->
        <div v-if="generatingAi" class="bg-white/95 rounded-3xl p-10 max-w-2xl shadow-xl border border-primary/30 flex flex-col items-center justify-center my-8 mx-auto text-center">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
            <span class="material-symbols-outlined text-3xl">neurology</span>
          </div>
          <h3 class="text-xl font-bold text-on-surface mb-2">El Oráculo IA está Cartografiando el Proceso</h3>
          <p class="text-sm text-secondary max-w-md mb-4">
            Analizando manuales de funciones, entradas operativas, entregables y correlaciones de {{ currentRole?.name }}...
          </p>
          <div class="w-64 bg-surface-container-low h-1.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-primary to-[#ffdea3] h-full w-2/3 animate-pulse"></div>
          </div>
        </div>

        <!-- EMPTY STATE IF NO WORKFLOW -->
        <div v-else-if="!hasWorkflow" class="bg-white/80 rounded-3xl p-12 max-w-3xl shadow-sm border border-dashed border-[#d2c2a8] flex flex-col items-center justify-center text-center my-6">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 mb-4">
            <span class="material-symbols-outlined text-3xl">schema</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-1">Este cargo aún no tiene Flujograma registrado</h3>
          <p class="text-sm text-gray-500 max-w-lg mb-6">
            Actualmente la posición <strong>{{ currentRole?.name }}</strong> no cuenta con un registro en <code>role_workflows</code>. Puedes estructurarlo instantáneamente con el Oráculo IA o mapearlo manualmente.
          </p>
          <div class="flex items-center gap-3">
            <button 
              @click="generateWorkflowWithAi" 
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 active:scale-95 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Cartografiar Ahora con Oráculo IA</span>
            </button>
            <router-link 
              :to="`/mapper/${currentRole?.id}`"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm transition-colors">
              <span class="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Cuestionario Manual</span>
            </router-link>
          </div>
        </div>

        <!-- 5-COLUMN MIRO PROCESS PIPELINE (The Actual Visual Map) -->
        <div v-else class="grid grid-cols-5 gap-6 items-start min-w-[1450px]">
          
          <!-- COLUMN 1: INSUMOS & ENTRADAS (Inputs) -->
          <div class="miro-column bg-[#f7f9fa] rounded-3xl p-5 border border-[#e1e6eb] shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#e1e6eb]">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc]">
                  <span class="material-symbols-outlined text-[18px]">login</span>
                </span>
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">1. Insumos & Entradas</h3>
              </div>
              <span class="text-xs font-bold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-full">
                {{ workflowData.inputs?.length || 0 }}
              </span>
            </div>

            <!-- Input Cards (Miro Sticky Note Style) -->
            <div class="space-y-3">
              <div 
                v-for="(item, idx) in workflowData.inputs" 
                :key="'input-' + idx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-[#0066cc] border-t border-r border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#0066cc] text-[18px] shrink-0 mt-0.5">input</span>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-800 leading-snug">{{ item }}</p>
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest mt-1 block">Insumo Operativo</span>
                  </div>
                </div>
              </div>

              <div v-if="!workflowData.inputs?.length" class="p-6 text-center text-xs text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                Sin entradas registradas
              </div>
            </div>
          </div>

          <!-- COLUMN 2: SECUENCIA OPERATIVA & TAREAS -->
          <div class="miro-column bg-[#fffcf4] rounded-3xl p-5 border border-[#fae8b8] shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#fae8b8]">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-[#b08d57]/10 flex items-center justify-center text-[#b08d57]">
                  <span class="material-symbols-outlined text-[18px]">account_tree</span>
                </span>
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">2. Actividades Clave</h3>
              </div>
              <span class="text-xs font-bold text-[#b08d57] bg-[#b08d57]/10 px-2 py-0.5 rounded-full">
                {{ workflowData.tasks?.length || 0 }}
              </span>
            </div>

            <!-- Task Cards -->
            <div class="space-y-3">
              <div 
                v-for="(task, idx) in workflowData.tasks" 
                :key="'task-' + idx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-[#b08d57] border-t border-r border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div class="flex items-start gap-2.5">
                  <div class="w-5 h-5 rounded-full bg-[#b08d57] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-800 leading-snug">{{ task }}</p>
                    <div class="flex items-center gap-1.5 mt-2">
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">Ejecución del Rol</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tools Used Pills below Tasks -->
              <div v-if="workflowData.tools_used?.length" class="mt-2 pt-3 border-t border-[#fae8b8]">
                <span class="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-2">Herramientas Empleadas:</span>
                <div class="flex flex-wrap gap-1.5">
                  <span 
                    v-for="(tool, tIdx) in workflowData.tools_used" 
                    :key="'tool-' + tIdx"
                    class="px-2 py-0.5 rounded-lg bg-white border border-[#e8d9b5] text-[11px] font-medium text-gray-700 shadow-2xs flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-[#b08d57]">build</span>
                    {{ tool }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: CUELLOS DE BOTELLA & REGLAS -->
          <div class="miro-column bg-[#fff5f5] rounded-3xl p-5 border border-[#ffd1d1] shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#ffd1d1]">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
                  <span class="material-symbols-outlined text-[18px]">warning</span>
                </span>
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">3. Cuellos de Botella</h3>
              </div>
              <span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {{ workflowData.bottlenecks?.length || 0 }}
              </span>
            </div>

            <!-- Bottlenecks Cards -->
            <div class="space-y-3">
              <div 
                v-for="(bn, idx) in workflowData.bottlenecks" 
                :key="'bn-' + idx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-red-500 border-t border-r border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">report_problem</span>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-800 leading-snug">{{ bn }}</p>
                    <span class="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1 block">Riesgo Operativo</span>
                  </div>
                </div>
              </div>

              <!-- Decision Rules if any -->
              <div 
                v-for="(rule, rIdx) in workflowData.decision_rules" 
                :key="'rule-' + rIdx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-amber-500 border-t border-r border-b border-gray-100">
                <div class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-amber-500 text-[16px] shrink-0 mt-0.5">alt_route</span>
                  <p class="text-xs font-medium text-gray-700 leading-snug">{{ rule }}</p>
                </div>
              </div>

              <div v-if="!workflowData.bottlenecks?.length && !workflowData.decision_rules?.length" class="p-6 text-center text-xs text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                Sin cuellos de botella reportados
              </div>
            </div>
          </div>

          <!-- COLUMN 4: ENTREGABLES & SALIDAS (Outputs) -->
          <div class="miro-column bg-[#f2faf5] rounded-3xl p-5 border border-[#c6ecd5] shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#c6ecd5]">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-[#248a3d]/10 flex items-center justify-center text-[#248a3d]">
                  <span class="material-symbols-outlined text-[18px]">logout</span>
                </span>
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">4. Entregables</h3>
              </div>
              <span class="text-xs font-bold text-[#248a3d] bg-[#248a3d]/10 px-2 py-0.5 rounded-full">
                {{ workflowData.outputs?.length || 0 }}
              </span>
            </div>

            <!-- Output Cards -->
            <div class="space-y-3">
              <div 
                v-for="(out, idx) in workflowData.outputs" 
                :key="'out-' + idx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-[#248a3d] border-t border-r border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#248a3d] text-[18px] shrink-0 mt-0.5">task_alt</span>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-800 leading-snug">{{ out }}</p>
                    <span class="text-[10px] text-[#248a3d] font-bold uppercase tracking-wider mt-1 block">Output Tangible</span>
                  </div>
                </div>
              </div>

              <div v-if="!workflowData.outputs?.length" class="p-6 text-center text-xs text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                Sin entregables registrados
              </div>
            </div>
          </div>

          <!-- COLUMN 5: KPIS & GOBERNANZA -->
          <div class="miro-column bg-[#f8f5ff] rounded-3xl p-5 border border-[#e7defa] shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#e7defa]">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-[#683ab7]/10 flex items-center justify-center text-[#683ab7]">
                  <span class="material-symbols-outlined text-[18px]">monitoring</span>
                </span>
                <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">5. KPIs del Cargo</h3>
              </div>
              <span class="text-xs font-bold text-[#683ab7] bg-[#683ab7]/10 px-2 py-0.5 rounded-full">
                {{ workflowData.kpis?.length || 0 }}
              </span>
            </div>

            <!-- KPI Cards -->
            <div class="space-y-3">
              <div 
                v-for="(kpi, idx) in workflowData.kpis" 
                :key="'kpi-' + idx"
                class="miro-card bg-white p-4 rounded-2xl shadow-xs border-l-4 border-l-[#683ab7] border-t border-r border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#683ab7] text-[18px] shrink-0 mt-0.5">trending_up</span>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-gray-800 leading-snug">{{ kpi }}</p>
                    <span class="text-[10px] text-[#683ab7] font-bold uppercase tracking-wider mt-1 block">Métrica Oficial</span>
                  </div>
                </div>
              </div>

              <div v-if="!workflowData.kpis?.length" class="p-6 text-center text-xs text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                Sin KPIs asignados
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- AI COPILOT DRAWER (Oráculo In-Board) -->
    <div 
      :class="['fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200', showAiPanel ? 'translate-x-0' : 'translate-x-full']"
    >
      <!-- Drawer Header -->
      <div class="p-5 border-b border-gray-100 bg-[#fbf9f5] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4b06a] to-[#8a6d3d] flex items-center justify-center text-white shadow-xs">
            <span class="material-symbols-outlined text-[18px]">neurology</span>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900 leading-none">Copiloto IA de Procesos</h3>
            <span class="text-[11px] text-secondary font-medium">Oráculo Corporativo NOVA WORK</span>
          </div>
        </div>
        <button @click="showAiPanel = false" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="p-5 flex-1 overflow-y-auto space-y-4">
        
        <!-- Current Context Card -->
        <div class="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60">
          <span class="text-[10px] uppercase font-bold text-secondary tracking-widest block">Cargo Seleccionado</span>
          <h4 class="text-base font-bold text-on-surface mt-0.5">{{ currentRole?.name }}</h4>
          <p class="text-xs text-secondary mt-1">Área: {{ currentRole?.areas?.name }}</p>
        </div>

        <!-- Quick Analysis Prompts -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-gray-700 uppercase tracking-wider block">Acciones de Auditoría con IA:</span>
          
          <button 
            @click="askAi('Audita exhaustivamente las entradas y entregables de este cargo y detecta inconsistencias con otros departamentos.')"
            :disabled="aiLoading"
            class="w-full text-left p-3 rounded-xl bg-white hover:bg-surface-container-low border border-gray-200 text-xs font-medium text-gray-800 transition-all flex items-center justify-between group">
            <span>🔍 Auditar coherencia de Insumos / Salidas</span>
            <span class="material-symbols-outlined text-gray-400 group-hover:text-primary text-[16px]">chevron_right</span>
          </button>

          <button 
            @click="askAi('Analiza los cuellos de botella de este cargo y propón 3 automatizaciones o herramientas de IA para solucionarlos.')"
            :disabled="aiLoading"
            class="w-full text-left p-3 rounded-xl bg-white hover:bg-surface-container-low border border-gray-200 text-xs font-medium text-gray-800 transition-all flex items-center justify-between group">
            <span>⚡ Optimizar Cuellos de Botella</span>
            <span class="material-symbols-outlined text-gray-400 group-hover:text-primary text-[16px]">chevron_right</span>
          </button>

          <button 
            @click="askAi('Genera una lista de KPIs complementarios recomendados para evaluar el impacto real de este cargo.')"
            :disabled="aiLoading"
            class="w-full text-left p-3 rounded-xl bg-white hover:bg-surface-container-low border border-gray-200 text-xs font-medium text-gray-800 transition-all flex items-center justify-between group">
            <span>📊 Proponer Nuevos KPIs</span>
            <span class="material-symbols-outlined text-gray-400 group-hover:text-primary text-[16px]">chevron_right</span>
          </button>
        </div>

        <!-- AI Response Box -->
        <div v-if="aiLoading" class="p-6 rounded-2xl bg-[#faf8f4] border border-[#e8d9b5] flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-2xl text-primary animate-spin mb-2">sync</span>
          <p class="text-xs font-semibold text-gray-700">El Oráculo está razonando sobre el proceso...</p>
        </div>

        <div v-else-if="aiResponse" class="p-4 rounded-2xl bg-white border border-[#e8d9b5] shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <span class="text-xs font-bold text-primary flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">verified</span> Dictamen del Oráculo
            </span>
            <button @click="copyAiResponse" class="text-[11px] font-semibold text-secondary hover:text-primary cursor-pointer">
              {{ aiCopied ? '¡Copiado!' : 'Copiar' }}
            </button>
          </div>
          <div class="text-xs text-gray-800 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
            {{ aiResponse }}
          </div>
        </div>

      </div>

      <!-- Drawer Footer -->
      <div class="p-4 border-t border-gray-100 bg-[#fbf9f5] flex items-center gap-2">
        <input 
          v-model="aiQueryInput" 
          @keyup.enter="askCustomAi"
          :disabled="aiLoading"
          placeholder="Pregunta algo sobre este proceso..." 
          class="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button 
          @click="askCustomAi"
          :disabled="aiLoading || !aiQueryInput.trim()"
          class="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <span class="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../api/supabase';

const route = useRoute();
const router = useRouter();

// State
const areas = ref([]);
const roles = ref([]);
const selectedAreaId = ref('all');
const selectedRoleId = ref(null);
const currentRole = ref(null);
const workflowData = ref({
  inputs: [],
  tasks: [],
  outputs: [],
  tools_used: [],
  bottlenecks: [],
  kpis: [],
  decision_rules: []
});
const mappedRoleIds = ref(new Set());
const generatingAi = ref(false);

// Miro Board Pan & Zoom State
const zoom = ref(1);
const panX = ref(60);
const panY = ref(40);
const isPanning = ref(false);
const startX = ref(0);
const startY = ref(0);

// AI Drawer State
const showAiPanel = ref(false);
const aiLoading = ref(false);
const aiResponse = ref('');
const aiQueryInput = ref('');
const aiCopied = ref(false);

const filteredRoles = computed(() => {
  if (selectedAreaId.value === 'all') return roles.value;
  return roles.value.filter(r => r.area_id === selectedAreaId.value);
});

const hasWorkflow = computed(() => {
  return workflowData.value && (
    (workflowData.value.tasks && workflowData.value.tasks.length > 0) ||
    (workflowData.value.inputs && workflowData.value.inputs.length > 0) ||
    (workflowData.value.outputs && workflowData.value.outputs.length > 0)
  );
});

onMounted(async () => {
  await loadInitialData();
});

const loadInitialData = async () => {
  try {
    const [areasRes, rolesRes, workflowsRes] = await Promise.all([
      supabase.from('areas').select('id, name').order('name'),
      supabase.from('roles').select('id, name, area_id, access_level, areas(name)').order('name'),
      supabase.from('role_workflows').select('role_id')
    ]);

    areas.value = areasRes.data || [];
    roles.value = rolesRes.data || [];
    mappedRoleIds.value = new Set((workflowsRes.data || []).map(w => w.role_id));

    // Handle query param or pick first mapped role
    const paramRoleId = route.query.roleId || route.query.role_id;
    if (paramRoleId && roles.value.find(r => r.id === paramRoleId)) {
      selectedRoleId.value = paramRoleId;
    } else {
      // Pick first role that has workflow
      const firstMapped = roles.value.find(r => mappedRoleIds.value.has(r.id));
      selectedRoleId.value = firstMapped ? firstMapped.id : (roles.value[0]?.id || null);
    }

    if (selectedRoleId.value) {
      await loadRoleWorkflow(selectedRoleId.value);
    }
  } catch (err) {
    console.error('Error loading Miro Process Map data:', err);
  }
};

const onAreaChange = () => {
  const firstInArea = filteredRoles.value[0];
  if (firstInArea) {
    selectedRoleId.value = firstInArea.id;
    loadRoleWorkflow(firstInArea.id);
  }
};

const onRoleChange = () => {
  if (selectedRoleId.value) {
    loadRoleWorkflow(selectedRoleId.value);
  }
};

const loadRoleWorkflow = async (roleId) => {
  const role = roles.value.find(r => r.id === roleId);
  currentRole.value = role || null;
  if (role) {
    selectedAreaId.value = role.area_id;
  }

  try {
    const { data, error } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', roleId)
      .maybeSingle();

    if (data && !error) {
      workflowData.value = {
        inputs: data.inputs || [],
        tasks: data.tasks || [],
        outputs: data.outputs || [],
        tools_used: data.tools_used || [],
        bottlenecks: data.bottlenecks || [],
        kpis: data.kpis || [],
        decision_rules: data.decision_rules || []
      };
      mappedRoleIds.value.add(roleId);
    } else {
      workflowData.value = {
        inputs: [],
        tasks: [],
        outputs: [],
        tools_used: [],
        bottlenecks: [],
        kpis: [],
        decision_rules: []
      };
    }
  } catch (err) {
    console.error('Error loading role workflow:', err);
  }
};

// Miro Canvas Pan & Zoom Handlers
const startPan = (e) => {
  if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
  isPanning.value = true;
  startX.value = e.clientX - panX.value;
  startY.value = e.clientY - panY.value;
};

const pan = (e) => {
  if (!isPanning.value) return;
  panX.value = e.clientX - startX.value;
  panY.value = e.clientY - startY.value;
};

const endPan = () => {
  isPanning.value = false;
};

const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  zoom.value = Math.max(0.4, Math.min(1.6, zoom.value + delta));
};

const zoomIn = () => {
  zoom.value = Math.min(1.6, zoom.value + 0.1);
};

const zoomOut = () => {
  zoom.value = Math.max(0.4, zoom.value - 0.1);
};

const resetZoom = () => {
  zoom.value = 1;
  panX.value = 60;
  panY.value = 40;
};

// AI Copilot Actions
const openAiPanel = () => {
  showAiPanel.value = true;
  if (!aiResponse.value) {
    askAi(`Haz un diagnóstico breve del proceso del cargo ${currentRole.value?.name || ''} y su alineación operativa.`);
  }
};

const askAi = async (prompt) => {
  aiLoading.value = true;
  aiResponse.value = '';
  try {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        query: `Contexto del cargo: ${currentRole.value?.name} en el área ${currentRole.value?.areas?.name}. Consulta: ${prompt}`
      })
    });
    const data = await res.json();
    aiResponse.value = data.answer || data.response || 'No se obtuvo respuesta del Oráculo.';
  } catch (err) {
    aiResponse.value = 'Error al consultar al Oráculo IA: ' + err.message;
  } finally {
    aiLoading.value = false;
  }
};

const askCustomAi = () => {
  if (!aiQueryInput.value.trim()) return;
  const q = aiQueryInput.value;
  aiQueryInput.value = '';
  askAi(q);
};

const copyAiResponse = async () => {
  try {
    await navigator.clipboard.writeText(aiResponse.value);
    aiCopied.value = true;
    setTimeout(() => { aiCopied.value = false; }, 2000);
  } catch (e) {
    console.error(e);
  }
};

// Generate Full Workflow with AI
const generateWorkflowWithAi = async () => {
  if (!currentRole.value) return;
  generatingAi.value = true;

  try {
    const prompt = `Actúa como Diseñador de Procesos BPMN corporativo de elite.
Estructura la cartografía completa en formato JSON para el cargo "${currentRole.value.name}" en el área "${currentRole.value.areas?.name || 'General'}".
Devuelve ÚNICAMENTE un objeto JSON válido con estas claves:
{
  "inputs": ["lista de 3 a 5 insumos necesarios para operar"],
  "tasks": ["lista de 4 a 6 actividades o tareas operativas principales"],
  "tools_used": ["lista de 3 a 5 herramientas o sistemas"],
  "bottlenecks": ["lista de 2 a 3 cuellos de botella comunes"],
  "outputs": ["lista de 3 a 5 entregables tangibles"],
  "kpis": ["lista de 2 a 3 indicadores clave con metas"]
}`;

    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        query: prompt
      })
    });

    const resData = await res.json();
    const rawText = resData.answer || resData.response || '';
    
    // Parse JSON from answer
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      workflowData.value = {
        inputs: parsed.inputs || [],
        tasks: parsed.tasks || [],
        tools_used: parsed.tools_used || [],
        bottlenecks: parsed.bottlenecks || [],
        outputs: parsed.outputs || [],
        kpis: parsed.kpis || [],
        decision_rules: parsed.decision_rules || []
      };

      // Upsert into Supabase role_workflows so it persists!
      await supabase.from('role_workflows').upsert({
        role_id: currentRole.value.id,
        inputs: workflowData.value.inputs,
        tasks: workflowData.value.tasks,
        tools_used: workflowData.value.tools_used,
        bottlenecks: workflowData.value.bottlenecks,
        outputs: workflowData.value.outputs,
        kpis: workflowData.value.kpis,
        updated_at: new Date().toISOString()
      }, { onConflict: 'role_id' });

      mappedRoleIds.value.add(currentRole.value.id);
    } else {
      // Fallback: assign sensible default schema based on role
      workflowData.value = {
        inputs: ['Solicitudes de servicio', 'Directrices de la Dirección', 'Datos del ERP'],
        tasks: ['Planificación operativa', 'Ejecución y coordinación técnica', 'Control de calidad'],
        tools_used: ['ERP NOVA WORK', 'Excel Corporativo', 'Slack / WhatsApp'],
        bottlenecks: ['Tiempos de respuesta de proveedores', 'Validación documental'],
        outputs: ['Reporte de gestión semanal', 'Entregable aprobado'],
        kpis: ['95% cumplimiento en tiempo', 'Cero no conformidades']
      };
    }
  } catch (err) {
    console.error('Error generating AI workflow:', err);
  } finally {
    generatingAi.value = false;
  }
};

const auditWorkflowWithAi = () => {
  showAiPanel.value = true;
  askAi(`Audita los cuellos de botella actuales (${workflowData.value.bottlenecks?.join(', ') || 'ninguno registrado'}) y sugiere optimizaciones operativas.`);
};

const exportProcessMarkdown = () => {
  const roleName = currentRole.value?.name || 'Cargo';
  const timestamp = new Date().toISOString().split('T')[0];
  let md = `# Flujograma Operativo de Proceso (Estilo Miro) - ${roleName}\n\n`;
  md += `**Área:** ${currentRole.value?.areas?.name || 'General'}\n`;
  md += `**Fecha de Auditoría:** ${new Date().toLocaleDateString()}\n\n`;
  md += `---\n\n`;

  md += `### 1. Insumos y Entradas (Inputs)\n`;
  (workflowData.value.inputs || []).forEach((item, i) => { md += `- ${item}\n`; });

  md += `\n### 2. Secuencia Operativa & Actividades\n`;
  (workflowData.value.tasks || []).forEach((t, i) => { md += `${i + 1}. ${t}\n`; });

  md += `\n**Herramientas Utilizadas:** ${(workflowData.value.tools_used || []).join(', ')}\n`;

  md += `\n### 3. Cuellos de Botella & Riesgos Detectados\n`;
  (workflowData.value.bottlenecks || []).forEach((b) => { md += `- ⚠️ ${b}\n`; });

  md += `\n### 4. Entregables y Salidas (Outputs)\n`;
  (workflowData.value.outputs || []).forEach((o) => { md += `- ✅ ${o}\n`; });

  md += `\n### 5. KPIs y Métricas Oficiales\n`;
  (workflowData.value.kpis || []).forEach((k) => { md += `- 📊 ${k}\n`; });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flujo_proceso_${roleName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.miro-column {
  min-height: 520px;
}
</style>


<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col">

    <!-- Main Content Grid -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 py-5 sm:px-6 sm:py-8">
      
      <!-- Banner Modo Auditoría -->
      <div v-if="isAuditMode" class="mb-6 bg-gradient-to-r from-[#d4b06a] via-[#b08d57] to-[#8a6d3d] text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300/40">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            <span class="material-symbols-outlined text-white text-2xl">visibility</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-black/25 text-white text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">Modo Auditoría Activo</span>
              <span class="text-xs text-amber-100">Inspección de Espacio de Trabajo</span>
            </div>
            <p class="text-sm sm:text-base font-semibold text-white mt-1">
              Estás auditando el espacio de <span class="underline underline-offset-2 font-bold">{{ currentProfile?.full_name }}</span> · {{ currentRole?.name || 'Sin cargo asignado' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button @click="exitAuditMode" class="px-4 py-2 bg-white text-[#8a6d3d] hover:bg-amber-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver a Directorio de Líder</span>
          </button>
        </div>
      </div>

      <!-- Carrusel de Noticias Corporativas -->
      <div v-if="activeNews.length > 0" class="mb-6 bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden relative group">
        <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10 pointer-events-none"></div>
        <img :src="activeNews[currentNewsIndex].image_url" class="w-full h-36 sm:h-48 object-cover object-center transition-opacity duration-500">
        <div class="absolute bottom-0 left-0 p-4 sm:p-6 z-20 w-full bg-gradient-to-t from-black/80 to-transparent">
          <span class="bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">NOTICIAS ELITE</span>
          <h2 class="text-white text-lg sm:text-2xl font-bold">{{ activeNews[currentNewsIndex].title }}</h2>
        </div>
        
        <!-- Controles del Carrusel -->
        <button v-if="activeNews.length > 1" @click="prevNews" class="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button v-if="activeNews.length > 1" @click="nextNews" class="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- LEFT COLUMN (3 cols): Perfil, KPI, Academia, Docs -->
        <div class="lg:col-span-3 space-y-6">
          
          <!-- Perfil -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-[#b08d57]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-[#1d1d1f] flex items-center justify-center text-white text-xl font-medium shadow-md border-2 border-[#b08d57]/30 shrink-0">
                <img v-if="currentProfile?.verification_photo || currentProfile?.avatar_url" 
                     :src="currentProfile.verification_photo || currentProfile.avatar_url" 
                     alt="Foto de Perfil" 
                     class="w-full h-full object-cover" />
                <span v-else>{{ getInitials(currentProfile?.full_name) }}</span>
              </div>
              <div>
                <h2 class="text-xl font-semibold tracking-tight text-[#1d1d1f]">{{ currentProfile?.full_name || 'Cargando...' }}</h2>
                <p class="text-[14px] text-[#b08d57] font-medium mt-0.5">{{ currentProfile?.is_master_admin ? 'Master Admin / Holding' : (currentRole?.name || '---') }}</p>
                <div class="flex items-center gap-2 mt-2">
                   <span class="px-2 py-0.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[11px] font-semibold text-[#86868b]">ID: {{ currentProfile?.id?.substring(0,6) }}</span>
                   <span class="px-2 py-0.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-full text-[11px] font-semibold text-[#86868b]">Ciclo: Activo</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acceso Especial KPI (Master, CEO, Analista de Datos) -->
          <div v-if="canManageKpis" class="bg-gradient-to-r from-[#1d1d1f] to-[#2c2c2e] text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#b08d57]/20 border border-[#b08d57]/40 flex items-center justify-center text-[#e8d9b5]">
                <span class="material-symbols-outlined text-[22px]">analytics</span>
              </div>
              <div>
                <h4 class="text-[13px] font-bold text-white">Módulo de KPIs & Actas</h4>
                <p class="text-[11px] text-[#e8d9b5]/80">Evaluación con IA y Actas Oficiales</p>
              </div>
            </div>
            <button @click="router.push('/kpis')" class="px-3 py-1.5 bg-[#b08d57] hover:bg-[#80663f] text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1 shadow">
              <span>Abrir</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <!-- KPI de Productividad (IA) -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-[15px] font-semibold text-[#1d1d1f]">Mi Progreso Diario</h3>
               <span class="material-symbols-outlined text-[#86868b] text-[20px]">analytics</span>
            </div>
            
            <div class="flex flex-col items-center justify-center py-4">
              <div class="relative w-32 h-32 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f5f5f7" stroke-width="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#b08d57" stroke-width="8" stroke-linecap="round" 
                          :stroke-dasharray="283" :stroke-dashoffset="283 - (283 * kpiPercentage) / 100" class="transition-all duration-1000 ease-out" />
                </svg>
                <div class="absolute flex flex-col items-center justify-center">
                  <span class="text-3xl font-bold tracking-tight text-[#1d1d1f]">{{ kpiPercentage }}%</span>
                  <span class="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">KPI</span>
                </div>
              </div>
              <p class="text-center text-[13px] text-[#86868b] mt-4 max-w-[200px]">
                Te falta un <strong class="text-[#1d1d1f]">{{ 100 - kpiPercentage }}%</strong> para tu meta de hoy.
              </p>
              <div :class="['mt-3 px-3 py-1 rounded-full text-xs font-bold border border-current opacity-80', kpiColor]">
                Calificación IA en tiempo real
              </div>
            </div>
          </div>

          <!-- Academia Elite -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[15px] font-semibold text-[#1d1d1f]">Academia Elite</h3>
              <button class="text-[13px] font-medium text-[#b08d57] hover:text-[#80663f] transition-colors">Ver Todo</button>
            </div>
            <div class="space-y-3">
              <div class="group cursor-pointer rounded-xl bg-[#f5f5f7] p-3 border border-transparent hover:border-[#e5e5ea] hover:bg-white transition-all">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-[#e5e5ea] flex items-center justify-center text-xl shrink-0">🎓</div>
                  <div>
                    <h4 class="text-[14px] font-semibold text-[#1d1d1f] leading-snug group-hover:text-[#b08d57] transition-colors">Onboarding de Ventas</h4>
                    <p class="text-[12px] text-[#86868b] mt-1">Módulo 1: Políticas base</p>
                    <div class="w-full h-1.5 bg-[#e5e5ea] rounded-full mt-2 overflow-hidden">
                      <div class="w-[30%] h-full bg-[#b08d57] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Biblioteca -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[15px] font-semibold text-[#1d1d1f]">Biblioteca Oficial</h3>
              <button class="text-[13px] font-medium text-[#b08d57] hover:text-[#80663f] transition-colors">Repositorio</button>
            </div>
            <div class="space-y-2">
              <a v-for="tpl in templates" :key="tpl.id" :href="tpl.url" target="_blank"
                 class="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea]/50 transition-colors border border-transparent hover:border-[#e5e5ea] group">
                <div class="w-8 h-8 rounded-lg bg-white border border-[#e5e5ea] flex items-center justify-center text-[#ff3b30] shadow-sm shrink-0">
                  <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-medium text-[#1d1d1f] truncate group-hover:text-[#b08d57] transition-colors">{{ tpl.title }}</h4>
                  <p class="text-[11px] text-[#86868b] truncate">{{ tpl.description || 'Documento oficial' }}</p>
                </div>
              </a>
              <div v-if="!templates.length" class="text-center text-sm text-gray-500 py-4">
                No hay documentos en tu rol.
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER COLUMN (6 cols): Las 3 Capas de Gestión -->
        <div class="lg:col-span-6 space-y-5">

          <!-- Alerta de tareas atrasadas -->
          <div v-if="overdueTasks.length > 0" class="bg-[#ffebee] border border-[#ffcdd2] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <span class="material-symbols-outlined text-[#c62828] mt-0.5">warning</span>
            <div>
              <h4 class="text-[#c62828] font-bold text-[14px]">Alerta de Seguimiento</h4>
              <p class="text-[#b71c1c] text-[13px] mt-1 leading-snug">
                Tienes <strong>{{ overdueTasks.length }}</strong> tareas vencidas que impactan tu KPI. Ciérralas lo antes posible.
              </p>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════
               SECCIÓN 1 — GESTIÓN DIARIA
               Tareas recurrentes y obligatorias del cargo
          ═══════════════════════════════════════════════════ -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="px-5 py-3.5 border-b border-[#e5e5ea] bg-[#f0fdf4] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#34c759] text-[20px]">checklist</span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#1d1d1f] leading-none">Gestión Diaria</h3>
                  <p class="text-[11px] text-[#86868b] mt-0.5">Obligatorio · Recurrente del cargo</p>
                </div>
              </div>
              <!-- Tab selector Diario/Semanal/Mensual -->
              <div class="flex items-center bg-white border border-[#e5e5ea] rounded-lg p-0.5 gap-0.5">
                <button v-for="t in [{k:'daily',l:'Diario'},{k:'weekly',l:'Semanal'},{k:'monthly',l:'Mensual'}]" :key="t.k"
                  @click="dmTab = t.k"
                  :class="['px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                    dmTab === t.k ? 'bg-[#34c759] text-white shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]']"
                >{{ t.l }}</button>
              </div>
            </div>
            <!-- Task list -->
            <ul class="divide-y divide-[#f5f5f7]">
              <li v-for="task in activeDmTaskList" :key="task.id"
                  class="px-5 py-3 hover:bg-[#f5f5f7]/60 transition-colors flex items-start gap-3.5">
                <button @click="openEvidenceModal(task, 'daily_management')"
                  :title="task.status === 'unfulfilled' ? 'Ver motivo de no ejecución' : (task.completed || task.status === 'completed') ? 'Ver evidencia registrada' : 'Marcar tarea con evidencia'"
                  :class="['w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                    task.status === 'unfulfilled' ? 'bg-[#ff3b30] border-[#ff3b30]' :
                    (task.completed || task.status === 'completed') ? 'bg-[#34c759] border-[#34c759]' : 'border-[#d1d1d6] hover:border-[#34c759]']">
                  <span v-if="task.status === 'unfulfilled'" class="material-symbols-outlined text-white text-[13px]">close</span>
                  <span v-else-if="task.completed || task.status === 'completed'" class="material-symbols-outlined text-white text-[13px]">check</span>
                </button>
                <div class="flex-1 min-w-0 cursor-pointer" @click="openEvidenceModal(task, 'daily_management')">
                  <div class="flex items-center justify-between gap-2">
                    <p :class="['text-[13px] font-medium leading-snug',
                      task.status === 'unfulfilled' ? 'text-[#ff3b30] font-semibold' :
                      (task.completed || task.status === 'completed') ? 'text-[#86868b] line-through' : 'text-[#1d1d1f]']">{{ task.title }}</p>
                    <span v-if="task.status === 'unfulfilled'" class="text-[10px] font-bold text-[#ff3b30] bg-[#fff0f0] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-[12px]">cancel</span> No ejecutado
                    </span>
                    <span v-else-if="task.completed || task.status === 'completed'" class="text-[10px] font-bold text-[#34c759] bg-[#e8f8ed] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-[12px]">photo_camera</span> Con Evidencia
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] text-[#86868b] flex items-center gap-1 bg-[#f5f5f7] px-1.5 py-0.5 rounded">
                      <span class="material-symbols-outlined text-[11px]">autorenew</span> Recurrente
                    </span>
                    <span v-if="task.priority === 'high' || task.priority === 'urgent'"
                      :class="['text-[10px] font-bold px-1.5 py-0.5 rounded',
                        task.priority === 'urgent' ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-700']"
                    >{{ task.priority === 'urgent' ? '¡URGENTE!' : 'Alta' }}</span>
                  </div>
                </div>
              </li>
              <li v-if="activeDmTaskList.length === 0" class="px-5 py-6 text-center text-[13px] text-[#86868b] italic">
                No hay gestiones {{ dmTab === 'daily' ? 'diarias' : dmTab === 'weekly' ? 'semanales' : 'mensuales' }} registradas.
              </li>
            </ul>
          </div>

          <!-- ═══════════════════════════════════════════════════
               SECCIÓN 2 — PENDIENTES DEL DÍA
               Asignadas por líderes (ad-hoc) + Programados que vencen HOY
          ═══════════════════════════════════════════════════ -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="px-5 py-3.5 border-b border-[#e5e5ea] bg-[#fff8f0] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#b08d57] text-[20px]">assignment_late</span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#1d1d1f] leading-none">Pendientes del Día</h3>
                  <p class="text-[11px] text-[#86868b] mt-0.5">Asignados por liderazgo · Ejecución inmediata</p>
                </div>
              </div>
              <span v-if="pendingDayTasks.length > 0"
                class="text-[11px] font-bold bg-[#b08d57] text-white px-2 py-0.5 rounded-full">
                {{ pendingDayTasks.filter(t => t.status === 'pending' && !t.completed).length }} pendientes
              </span>
            </div>
            <!-- Atrasadas primero -->
            <div v-if="overdueTasks.length > 0" class="border-b border-[#ffcdd2] bg-[#fff5f5]">
              <div class="px-5 py-1.5 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#c62828]"></span>
                <span class="text-[10px] font-bold text-[#c62828] uppercase tracking-wide">Vencidas</span>
              </div>
              <ul class="divide-y divide-[#ffebee]">
                <li v-for="task in overdueTasks" :key="'od-'+task.id"
                    class="px-5 py-3 flex items-start gap-3.5">
                  <button @click="openEvidenceModal(task, 'task')"
                    :title="task.status === 'unfulfilled' ? 'Ver motivo de no ejecución' : task.status === 'completed' ? 'Ver evidencia registrada' : 'Marcar pendiente con evidencia'"
                    :class="['w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                      task.status === 'unfulfilled' ? 'bg-[#ff3b30] border-[#ff3b30]' :
                      task.status === 'completed' ? 'bg-[#34c759] border-[#34c759]' : 'border-[#c62828] hover:bg-[#ffebee]']">
                    <span v-if="task.status === 'unfulfilled'" class="material-symbols-outlined text-white text-[13px]">close</span>
                    <span v-else-if="task.status === 'completed'" class="material-symbols-outlined text-white text-[13px]">check</span>
                  </button>
                  <div class="flex-1 min-w-0 cursor-pointer" @click="openEvidenceModal(task, 'task')">
                    <div class="flex items-center justify-between gap-2">
                      <p :class="['text-[13px] font-medium',
                        task.status === 'unfulfilled' ? 'text-[#ff3b30] font-semibold' :
                        task.status === 'completed' ? 'line-through text-[#86868b]' : 'text-[#1d1d1f]']">{{ task.title }}</p>
                      <span v-if="task.status === 'unfulfilled'" class="text-[10px] font-bold text-[#ff3b30] bg-[#fff0f0] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                        <span class="material-symbols-outlined text-[12px]">cancel</span> No ejecutado
                      </span>
                      <span v-else-if="task.status === 'completed'" class="text-[10px] font-bold text-[#34c759] bg-[#e8f8ed] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                        <span class="material-symbols-outlined text-[12px]">photo_camera</span> Con Evidencia
                      </span>
                    </div>
                    <span class="text-[10px] bg-[#ffebee] text-[#c62828] font-bold px-1.5 py-0.5 rounded mt-1 inline-block">
                      Venció: {{ new Date(task.due_date).toLocaleDateString('es-CO') }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            <!-- Pendientes de hoy (tasks + programados que activan hoy) -->
            <ul class="divide-y divide-[#f5f5f7]">
              <li v-for="task in todayPendingTasks" :key="task._key || task.id"
                  class="px-5 py-3 hover:bg-[#f5f5f7]/60 transition-colors flex items-start gap-3.5">
                <button @click="openEvidenceModal(task, task._isScheduled ? 'scheduled' : 'task')"
                  :title="task.status === 'unfulfilled' ? 'Ver motivo de no ejecución' : (task.status === 'completed' || task.completed) ? 'Ver evidencia registrada' : 'Marcar pendiente con evidencia'"
                  :class="['w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                    task.status === 'unfulfilled' ? 'bg-[#ff3b30] border-[#ff3b30]' :
                    (task.status === 'completed' || task.completed) ? 'bg-[#34c759] border-[#34c759]' : 'border-[#d1d1d6] hover:border-[#b08d57]']">
                  <span v-if="task.status === 'unfulfilled'" class="material-symbols-outlined text-white text-[13px]">close</span>
                  <span v-else-if="task.status === 'completed' || task.completed" class="material-symbols-outlined text-white text-[13px]">check</span>
                </button>
                <div class="flex-1 min-w-0 cursor-pointer" @click="openEvidenceModal(task, task._isScheduled ? 'scheduled' : 'task')">
                  <div class="flex items-center justify-between gap-2">
                    <p :class="['text-[13px] font-medium leading-snug',
                      task.status === 'unfulfilled' ? 'text-[#ff3b30] font-semibold' :
                      (task.status === 'completed' || task.completed) ? 'line-through text-[#86868b]' : 'text-[#1d1d1f]']"
                    >{{ task.title }}</p>
                    <span v-if="task.status === 'unfulfilled'" class="text-[10px] font-bold text-[#ff3b30] bg-[#fff0f0] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-[12px]">cancel</span> No ejecutado
                    </span>
                    <span v-else-if="task.status === 'completed' || task.completed" class="text-[10px] font-bold text-[#34c759] bg-[#e8f8ed] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-[12px]">photo_camera</span> Con Evidencia
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1">
                    <!-- Badge programado -->
                    <span v-if="task._isScheduled"
                      class="text-[10px] font-bold bg-[#e8f0fe] text-[#0071e3] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span class="material-symbols-outlined text-[11px]">calendar_today</span> Entrega Programada
                    </span>
                    <!-- Prioridad -->
                    <span v-if="task.priority === 'urgent'"
                      class="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">¡URGENTE!</span>
                    <span v-else-if="task.priority === 'high'"
                      class="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">Alta Prioridad</span>
                    <span v-if="task.description" class="text-[11px] text-[#86868b] truncate">{{ task.description }}</span>
                  </div>
                </div>
              </li>
              <li v-if="todayPendingTasks.length === 0 && overdueTasks.length === 0"
                  class="px-5 py-6 text-center text-[13px] text-[#86868b] italic">
                🎉 Sin pendientes asignados para hoy.
              </li>
            </ul>
          </div>

          <!-- ═══════════════════════════════════════════════════
               SECCIÓN 3 — PROGRAMADOS
               Órdenes de entrega por calendario (próximas)
          ═══════════════════════════════════════════════════ -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="px-5 py-3.5 border-b border-[#e5e5ea] bg-[#f0f4ff] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#0071e3] text-[20px]">event_repeat</span>
                <div>
                  <h3 class="text-[15px] font-bold text-[#1d1d1f] leading-none">Programados</h3>
                  <p class="text-[11px] text-[#86868b] mt-0.5">Entregas calendarizadas · Generadas por orden</p>
                </div>
              </div>
              <span class="text-[11px] font-semibold text-[#0071e3] bg-[#e8f0fe] px-2 py-0.5 rounded-full">
                {{ upcomingScheduled.length }} próximos
              </span>
            </div>
            <ul class="divide-y divide-[#f5f5f7]">
              <li v-for="sd in upcomingScheduled" :key="'sd-'+sd.id"
                  class="px-5 py-3 hover:bg-[#f5f5f7]/60 transition-colors flex items-start gap-3.5">
                <!-- Countdown badge -->
                <div :class="['flex flex-col items-center justify-center w-10 h-10 rounded-xl shrink-0 text-center',
                  sd._daysUntil === 0 ? 'bg-[#b08d57] text-white' :
                  sd._daysUntil <= 3 ? 'bg-red-50 text-red-700' : 'bg-[#e8f0fe] text-[#0071e3]']">
                  <span class="text-[14px] font-bold leading-none">{{ sd._daysUntil === 0 ? '¡Hoy!' : sd._daysUntil }}</span>
                  <span v-if="sd._daysUntil > 0" class="text-[9px] leading-none mt-0.5">días</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium text-[#1d1d1f] leading-snug">{{ sd.title }}</p>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1">
                    <span class="text-[10px] text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span class="material-symbols-outlined text-[11px]">calendar_month</span>
                      {{ scheduledRecurrenceLabel(sd) }}
                    </span>
                    <span v-if="sd.priority === 'urgent'" class="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">Urgente</span>
                    <span v-else-if="sd.priority === 'high'" class="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">Alta</span>
                  </div>
                  <p v-if="sd.description" class="text-[11px] text-[#86868b] mt-1 line-clamp-1">{{ sd.description }}</p>
                </div>
              </li>
              <li v-if="upcomingScheduled.length === 0"
                  class="px-5 py-6 text-center text-[13px] text-[#86868b] italic">
                No hay entregas programadas próximas para tu cargo.
              </li>
            </ul>
          </div>

        </div>

        <!-- RIGHT COLUMN (3 cols): Asistente IA Nova Work -->
        <div class="lg:col-span-3 h-[550px] lg:h-[calc(100vh-120px)] static lg:sticky lg:top-[90px] flex flex-col bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#e5e5ea] bg-[#f5f5f7]/50 flex justify-between items-center">
            <div>
              <h3 class="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#b08d57]">smart_toy</span>
                Agente Nova Work
              </h3>
              <p class="text-[11px] text-[#86868b] mt-1 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#34c759]"></span>
                Especializado en tu cargo
              </p>
            </div>
            <button @click="clearChatHistory" class="p-1.5 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ffebee] rounded-lg transition-colors flex items-center justify-center" title="Limpiar Historial del Chat">
              <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          </div>
          
          <!-- Chat Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f5f7]/20" ref="chatContainer">
            <div v-if="messages.length === 0" class="text-center text-[13px] text-[#86868b] mt-10">
              Hola, soy la IA de Nova Work. ¿En qué te puedo asistir hoy?
            </div>
            
            <div v-for="(msg, index) in messages" :key="index" 
                 :class="['flex gap-3 max-w-[90%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '']">
              
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm overflow-hidden', 
                            msg.sender === 'user' ? 'bg-[#1d1d1f] text-white' : 'bg-gradient-to-br from-[#b08d57] to-[#80663f] text-white']">
                <template v-if="msg.sender === 'user'">
                  <img v-if="currentProfile?.verification_photo || currentProfile?.avatar_url" 
                       :src="currentProfile.verification_photo || currentProfile.avatar_url" 
                       class="w-full h-full object-cover" />
                  <span v-else>{{ getInitials(currentProfile?.full_name) }}</span>
                </template>
                <template v-else>AI</template>
              </div>
              
              <div :class="['p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm', 
                            msg.sender === 'user' ? 'bg-[#b08d57] text-white rounded-tr-none' : 'bg-white border border-[#e5e5ea] text-[#1d1d1f] rounded-tl-none']" 
                   v-html="formatMessage(msg.text)">
              </div>
            </div>

            <div v-if="isTyping" class="flex gap-3 max-w-[90%]">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#b08d57] to-[#80663f] text-white flex items-center justify-center text-xs shrink-0 shadow-sm">AI</div>
              <div class="p-3 rounded-2xl text-[13px] bg-white border border-[#e5e5ea] rounded-tl-none shadow-sm text-[#86868b] italic">
                Analizando métricas...
              </div>
            </div>
          </div>

          <!-- Chat Input -->
          <div class="p-3 border-t border-[#e5e5ea] bg-white">
            <div class="relative">
              <input type="text" v-model="newMessage" @keyup.enter="sendMessage" :disabled="isTyping" 
                     placeholder="Haz una consulta a la IA..." 
                     class="w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl pl-4 pr-10 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b08d57]/30 focus:border-[#b08d57] transition-all" />
              <button @click="sendMessage" :disabled="isTyping" 
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-[#b08d57] hover:text-[#80663f] p-1 disabled:opacity-50 transition-colors">
                <span class="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
    <!-- Modal de Evidencia y Trazabilidad de Tareas -->
    <TaskEvidenceModal
      v-model="showEvidenceModal"
      :task="selectedTaskForEvidence"
      :task-type="selectedTaskType"
      :read-only="isAuditMode"
      @save="handleEvidenceSave"
      @reopen="handleTaskReopen"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile as authProfile, loadCurrentProfile, signOut, canAccessKpis } from '../api/auth';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getPeriodKey } from '../utils/taskPeriods';
import { getRoleKpiDetail } from '../api/kpi';
import TaskEvidenceModal from '@/components/TaskEvidenceModal.vue';

const canManageKpis = computed(() => canAccessKpis());

// ── Motor de Tiempo ──────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

// Tareas atrasadas: vencidas y aún pendientes (ni completadas ni justificadas)
const overdueTasks = computed(() => {
  const all = allTasks.value || [];
  return all.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < today);
});

// Pendientes de HOY: tasks asignadas con due_date >= hoy (o marcadas hoy) + programados de hoy
const todayPendingTasks = computed(() => {
  const all = allTasks.value || [];
  const adHoc = all.filter(t => {
    const isDueTodayOrFuture = !t.due_date || new Date(t.due_date) >= today;
    if (t.status === 'pending') return isDueTodayOrFuture;
    if (t.completed_at) {
      const compDate = new Date(t.completed_at);
      return compDate.toDateString() === new Date().toDateString();
    }
    return isDueTodayOrFuture;
  });
  // Programados que activan HOY (incluyendo los completados/gestionados hoy)
  const fromScheduled = scheduledDeliveries.value
    .filter(sd => sd._triggersToday)
    .map(sd => ({ ...sd, _isScheduled: true, _key: 'sd-' + sd.id }));
  return [...fromScheduled, ...adHoc];
});

// Para el área de "pendientes del día" (unión visual)
const pendingDayTasks = computed(() => todayPendingTasks.value);

// Gestión Diaria activa (para KPI)
const activeDailyTasks = computed(() => {
  return [...(dmDailyTasks.value || []), ...(dmWeeklyTasks.value || []), ...(dmMonthlyTasks.value || [])];
});

// Programados próximos (no activan hoy, para mostrar como "próximamente")
const upcomingScheduled = computed(() => {
  return scheduledDeliveries.value
    .filter(sd => !sd._triggersToday)
    .sort((a, b) => a._daysUntil - b._daysUntil)
    .slice(0, 10);
});

// KPI calculation — incluye las 3 capas
const kpiPercentage = computed(() => {
  const allSched = allTasks.value || [];
  const allDaily = [...(dmDailyTasks.value||[]), ...(dmWeeklyTasks.value||[]), ...(dmMonthlyTasks.value||[])];
  const allProg  = scheduledDeliveries.value.filter(sd => sd._triggersToday);

  const totalTime = (allSched.length * 30) + (allDaily.length * 15) + (allProg.length * 45);
  if (totalTime === 0) return 100;

  const doneTime =
    (allSched.filter(t => t.status === 'completed').length * 30) +
    (allDaily.filter(t => t.completed).length * 15) +
    (allProg.filter(sd => sd.completed).length * 45);

  return Math.round((doneTime / totalTime) * 100);
});

const kpiColor = computed(() => {
  if (kpiPercentage.value >= 85) return 'text-[#2e7d32] bg-[#e8f5e9] border-[#c8e6c9]';
  if (kpiPercentage.value >= 60) return 'text-[#b46b00] bg-[#fff8e1] border-[#ffecb3]';
  return 'text-[#c62828] bg-[#ffebee] border-[#ffcdd2]';
});
// ------------------------------------------------

const router = useRouter();
const route = useRoute();

const currentProfile = ref(null);
const currentRole = ref(null);
const loadingProfile = ref(true);
const isAuditMode = ref(false);

// Nivel de acceso del rol que se está viendo (el propio, o el auditado en Modo
// Auditoría) -- determina si se muestra el acceso directo al Panel de Liderazgo.
const isManagerRole = computed(() => currentRole.value && currentRole.value.access_level === 1);

// Cronograma Programacional: tareas puntuales que el líder asigna a ESTA
// persona (tabla `tasks`), con fecha de vencimiento. Se muestran en un único
// bloque con pestañas (Diario/Semanal/Mensual) en vez de tres secciones
// apiladas, para reducir el ruido visual.
const taskTab = ref('daily');
const activeTaskList = computed(() => {
  if (taskTab.value === 'weekly') return weeklyTasks.value;
  if (taskTab.value === 'monthly') return monthlyTasks.value;
  return dailyTasks.value;
});
const totalPendingTasks = computed(() =>
  [...dailyTasks.value, ...weeklyTasks.value, ...monthlyTasks.value].filter(t => t.status !== 'completed').length
);
const totalCompletedTasks = computed(() =>
  [...dailyTasks.value, ...weeklyTasks.value, ...monthlyTasks.value].filter(t => t.status === 'completed').length
);

// Gestión Diaria: actividades recurrentes y estándar del cargo (revisar
// correos, enviar facturas, etc.), definidas una sola vez en la memoria del
// cargo (role_task_templates) y compartidas por todos los que tienen ese
// cargo -- distinta del Cronograma Programacional de arriba, que son
// encargos puntuales de un líder a una persona.
const dmTab = ref('daily');
const activeDmTaskList = computed(() => {
  if (dmTab.value === 'weekly') return dmWeeklyTasks.value;
  if (dmTab.value === 'monthly') return dmMonthlyTasks.value;
  return dmDailyTasks.value;
});

// Notificaciones (avisos de la empresa / notifications) y mensajes del líder de área (categorization_messages)
const notifications = ref([]);
const categorizationMessages = ref([]);
const showNotifPanel = ref(false);
const loadingNotifications = ref(false);
const dismissedMessageIds = ref(new Set());
// Mensajes de categorization_messages son filas compartidas (van dirigidas a
// un rol/área entero, no a una persona) -- no se pueden borrar de la base de
// datos sin quitárselas a todo el mundo. "Eliminar" un mensaje entonces solo
// lo oculta de la vista de ESTE usuario, guardado aparte de dismissedMessageIds
// (que solo trackea leído/no leído).
const hiddenMessageIds = ref(new Set());

// Datos del rol
const loadingKpis = ref(false);
const roleContextStr = ref('');

// Mis KPIs: solo visible para el gerente (Nivel 1) sobre su propio cargo --
// un empleado individual no ve este desglose. Trae el puntaje global y el
// detalle por métrica desde el sistema real de mediciones (kpi_metric_measurements),
// el mismo que alimenta el badge de "Mi Equipo" en el Panel de Liderazgo.
const kpiDetail = ref({ overallScore: 0, metrics: [] });
const loadingKpiDetail = ref(false);

// Cronograma Programacional (tareas ad-hoc y asignadas de `tasks`)
const allTasks = ref([]);
const dailyTasks = ref([]);
const weeklyTasks = ref([]);
const monthlyTasks = ref([]);
let realtimeChannel = null;

// Gestión Diaria (memoria del cargo, role_task_templates)
const dmDailyTasks = ref([]);
const dmWeeklyTasks = ref([]);
const dmMonthlyTasks = ref([]);

// Programados (scheduled_deliveries)
const scheduledDeliveries = ref([]);

// Plantillas y Noticias
const templates = ref([]);
const activeNews = ref([]);

// Chat
const messages = ref([]);
const newMessage = ref('');
const isTyping = ref(false);
const chatContainer = ref(null);

onMounted(async () => {
  loadDismissed();
  await initWorkspace();
});

watch(() => route.query.view_as, async () => {
  await initWorkspace();
});

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

// --- Notificaciones ---

const DISMISSED_MESSAGES_KEY = 'nova_work_dismissed_messages';
const HIDDEN_MESSAGES_KEY = 'nova_work_hidden_messages';

const loadDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_MESSAGES_KEY);
    dismissedMessageIds.value = new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    dismissedMessageIds.value = new Set();
  }
  try {
    const raw = localStorage.getItem(HIDDEN_MESSAGES_KEY);
    hiddenMessageIds.value = new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    hiddenMessageIds.value = new Set();
  }
};

const persistDismissed = () => {
  try {
    localStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify(Array.from(dismissedMessageIds.value)));
  } catch (e) {
    // localStorage no disponible (modo privado, etc.) - no es crítico, se pierde solo la marca de "leído" local
  }
};

const persistHidden = () => {
  try {
    localStorage.setItem(HIDDEN_MESSAGES_KEY, JSON.stringify(Array.from(hiddenMessageIds.value)));
  } catch (e) {
    // localStorage no disponible -- no es crítico, el mensaje solo volvería a aparecer en este navegador
  }
};

const fetchNotifications = async (profileId, role) => {
  loadingNotifications.value = true;
  try {
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);
    notifications.value = notifData || [];

    if (role?.id) {
      const orFilter = role.area_id
        ? `target_role_id.eq.${role.id},target_area_id.eq.${role.area_id}`
        : `target_role_id.eq.${role.id}`;
      const { data: msgData } = await supabase
        .from('categorization_messages')
        .select('*')
        .or(orFilter)
        .order('created_at', { ascending: false })
        .limit(50);
      categorizationMessages.value = msgData || [];
    } else {
      categorizationMessages.value = [];
    }
  } catch (e) {
    console.error('Error cargando notificaciones:', e);
    notifications.value = [];
    categorizationMessages.value = [];
  } finally {
    loadingNotifications.value = false;
  }
};

const unifiedFeed = computed(() => {
  const fromNotifications = notifications.value.map(n => ({
    id: `n-${n.id}`,
    rawId: n.id,
    source: 'notification',
    type: n.type,
    text: n.message,
    created_at: n.created_at,
    unread: !n.is_read
  }));
  const fromMessages = categorizationMessages.value
    .filter(m => !hiddenMessageIds.value.has(m.id))
    .map(m => ({
      id: `m-${m.id}`,
      rawId: m.id,
      source: 'message',
      category: m.category,
      text: m.content,
      created_at: m.created_at,
      unread: !dismissedMessageIds.value.has(m.id)
    }));
  return [...fromNotifications, ...fromMessages].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
});

const unreadCount = computed(() => unifiedFeed.value.filter(i => i.unread).length);

watch(unreadCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal > oldVal) {
    playNotificationSound();
  }
});

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error('No se pudo reproducir el sonido de notificación', e);
  }
};

const bannerItems = computed(() => unifiedFeed.value.filter(i => i.unread).slice(0, 3));

const notifIcon = (item) => {
  if (item.source === 'message') {
    if (item.category === 'urgente') return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    if (item.category === 'operativo') return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
  }
  const map = { 
    manual_update: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>', 
    new_task: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', 
    system_alert: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', 
    message: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' 
  };
  return map[item.type] || '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
};

const notifSourceLabel = (item) => {
  return item.source === 'message' ? 'Tu líder / Holding Corporativo' : 'Notificación del sistema';
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(dateStr).toLocaleDateString('es-CO');
};

const markNotificationRead = async (notifId) => {
  const target = notifications.value.find(n => n.id === notifId);
  if (!target || target.is_read) return;
  target.is_read = true; // Optimista
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  } catch (e) {
    target.is_read = false; // Revertir si falla
    console.error('Error marcando notificación como leída:', e);
  }
};

const handleNotifClick = (item) => {
  if (item.source === 'notification') {
    markNotificationRead(item.rawId);
  } else {
    dismissedMessageIds.value.add(item.rawId);
    persistDismissed();
  }
};

// Borra una notificación del Canal de Notificaciones. Las notificaciones del
// sistema (tabla `notifications`) son propias de este perfil, así que se
// borran de verdad; los mensajes del líder/empresa (categorization_messages)
// son filas compartidas con todo un rol/área, así que solo se ocultan para
// este usuario (ver hiddenMessageIds arriba).
const deleteNotification = async (item) => {
  if (item.source === 'notification') {
    const previous = notifications.value;
    notifications.value = notifications.value.filter(n => n.id !== item.rawId); // Optimista
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', item.rawId);
      if (error) throw error;
    } catch (e) {
      notifications.value = previous; // Revertir si falla
      console.error('Error eliminando notificación:', e);
    }
  } else {
    hiddenMessageIds.value.add(item.rawId);
    persistHidden();
  }
};

const markAllRead = async () => {
  const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
  notifications.value.forEach(n => { n.is_read = true; }); // Optimista
  categorizationMessages.value.forEach(m => dismissedMessageIds.value.add(m.id));
  persistDismissed();

  if (unreadIds.length) {
    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    } catch (e) {
      console.error('Error marcando todas como leídas:', e);
    }
  }
};

const currentNewsIndex = ref(0);
let newsInterval = null;

const fetchNews = async () => {
  const now = new Date().toISOString();
  const { data } = await supabase.from('corporate_news')
    .select('*')
    .lte('start_date', now)
    .or(`end_date.gte.${now},end_date.is.null`);
  activeNews.value = data || [];
  
  if (activeNews.value.length > 1) {
    if (newsInterval) clearInterval(newsInterval);
    newsInterval = setInterval(() => { nextNews(); }, 7000);
  }
};

const nextNews = () => { currentNewsIndex.value = (currentNewsIndex.value + 1) % activeNews.value.length; };
const prevNews = () => { currentNewsIndex.value = currentNewsIndex.value === 0 ? activeNews.value.length - 1 : currentNewsIndex.value - 1; };

onUnmounted(() => {
  if (newsInterval) clearInterval(newsInterval);
});

const exitAuditMode = () => {
  router.push('/leader');
};

const initWorkspace = async () => {
  loadingProfile.value = true;
  try {
    if (!authProfile.value) {
      await loadCurrentProfile();
    }
    
    // Lógica de Modo Auditoría (Impersonation)
    // Permitido a Master Admins y Líderes con access_level 1 o 2
    const canAudit = authProfile.value?.is_master_admin || 
                     (authProfile.value?.roles?.access_level && [1, 2].includes(authProfile.value.roles.access_level));

    if (canAudit && route.query.view_as) {
      const { data: auditProfile, error: auditError } = await supabase
        .from('profiles')
        .select('*, roles(id, name, area_id, access_level)')
        .eq('id', route.query.view_as)
        .single();
        
      if (auditProfile && !auditError) {
        currentProfile.value = auditProfile;
        isAuditMode.value = true;
      } else {
        console.warn("No se pudo cargar el perfil para auditar:", auditError);
        currentProfile.value = authProfile.value;
        isAuditMode.value = false;
      }
    } else {
      currentProfile.value = authProfile.value;
      isAuditMode.value = false;
    }

    currentRole.value = currentProfile.value?.roles || null;

    if (!currentProfile.value) return;

    if (currentRole.value) {
      await fetchRoleData(currentRole.value.id);
      await fetchDailyManagement(currentRole.value.id, currentProfile.value.id);
      await fetchScheduledDeliveries(currentRole.value, currentProfile.value);
      if (isManagerRole.value) {
        await fetchKpiDetail(currentRole.value.id);
      }
    }
    await fetchChecklists(currentProfile.value.id);
    await fetchNotifications(currentProfile.value.id, currentRole.value);
    await fetchNews();
    setupRealtime(currentProfile.value.id);
  } catch(err) { console.error("Workspace Load Error:", err); } finally {
    loadingProfile.value = false;
  }
};

// Configuración de suscripciones Realtime para actualización automática sin recargar
const setupRealtime = (profileId) => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (!profileId) return;

  realtimeChannel = supabase.channel(`workspace-rt-${profileId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${profileId}` }, async () => {
      await fetchChecklists(profileId);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profileId}` }, async () => {
      await fetchNotifications(profileId, currentRole.value);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'role_task_templates' }, async () => {
      if (currentRole.value?.id) {
        await fetchDailyManagement(currentRole.value.id, profileId);
      }
    })
    .subscribe();
};

// Cronograma Programacional: tareas puntuales que el líder asignó a esta
// persona (tabla `tasks`).
const fetchChecklists = async (profileId) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profileId)
      .order('due_date', { ascending: true });

    if (error) throw error;

    if (tasks) {
      allTasks.value = tasks;
      dailyTasks.value = tasks.filter(t => t.task_type === 'daily');
      weeklyTasks.value = tasks.filter(t => t.task_type === 'weekly');
      monthlyTasks.value = tasks.filter(t => t.task_type === 'monthly');
    }
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }
};

// ── Modal de Evidencia y Trazabilidad ─────────────────────────
const showEvidenceModal = ref(false);
const selectedTaskForEvidence = ref(null);
const selectedTaskType = ref('task'); // 'task', 'daily_management', 'scheduled'

const openEvidenceModal = (task, type = 'task') => {
  selectedTaskForEvidence.value = task;
  selectedTaskType.value = type;
  showEvidenceModal.value = true;
};

const handleEvidenceSave = async (payload) => {
  const { task, taskType, status, evidence_text, evidence_photo, cancellation_reason, completed_at } = payload;
  const isDone = (status === 'completed');

  try {
    if (taskType === 'task') {
      const updateData = {
        status,
        evidence_text,
        evidence_photo,
        cancellation_reason,
        completed_at
      };
      const { error } = await supabase.from('tasks').update(updateData).eq('id', task.id);
      if (error) {
        console.warn('Update en tasks falló, reintentando:', error);
        await supabase.from('tasks').update({ status }).eq('id', task.id);
      }

      task.status = status;
      task.completed = isDone;
      task.evidence_text = evidence_text;
      task.evidence_photo = evidence_photo;
      task.cancellation_reason = cancellation_reason;
      task.completed_at = completed_at;
    } else if (taskType === 'daily_management') {
      const completionPayload = {
        task_template_id: task.id,
        profile_id: currentProfile.value.id,
        period_key: task.periodKey,
        status,
        evidence_text,
        evidence_photo,
        cancellation_reason,
        completed_at
      };

      const { error } = await supabase
        .from('task_completions')
        .upsert(completionPayload, { onConflict: 'task_template_id,profile_id,period_key' });

      if (error) {
        console.warn('Upsert completo de task_completions falló, usando básico:', error);
        await supabase
          .from('task_completions')
          .upsert({
            task_template_id: task.id,
            profile_id: currentProfile.value.id,
            period_key: task.periodKey
          }, { onConflict: 'task_template_id,profile_id,period_key' });
      }

      task.status = status;
      task.completed = isDone;
      task.evidence_text = evidence_text;
      task.evidence_photo = evidence_photo;
      task.cancellation_reason = cancellation_reason;
      task.completed_at = completed_at;
    } else if (taskType === 'scheduled') {
      const scheduledPayload = {
        delivery_id: task.id,
        profile_id: currentProfile.value.id,
        period_key: task._periodKey,
        status,
        evidence_text,
        evidence_photo,
        cancellation_reason,
        completed_at
      };

      const { error } = await supabase
        .from('scheduled_delivery_completions')
        .upsert(scheduledPayload, { onConflict: 'delivery_id,profile_id,period_key' });

      if (error) {
        console.warn('Upsert scheduled falló, usando básico:', error);
        await supabase
          .from('scheduled_delivery_completions')
          .upsert({
            delivery_id: task.id,
            profile_id: currentProfile.value.id,
            period_key: task._periodKey
          }, { onConflict: 'delivery_id,profile_id,period_key' });
      }

      task.status = status;
      task.completed = isDone;
      task.evidence_text = evidence_text;
      task.evidence_photo = evidence_photo;
      task.cancellation_reason = cancellation_reason;
      task.completed_at = completed_at;
    }
  } catch (err) {
    console.error('Error guardando trazabilidad:', err);
    alert('Error al registrar la evidencia: ' + (err.message || 'Error en base de datos'));
  }
};

const handleTaskReopen = async (payload) => {
  const { task, taskType } = payload;
  try {
    if (taskType === 'task') {
      await supabase.from('tasks').update({
        status: 'pending',
        evidence_text: null,
        evidence_photo: null,
        cancellation_reason: null,
        completed_at: null
      }).eq('id', task.id);

      task.status = 'pending';
      task.completed = false;
      task.evidence_text = null;
      task.evidence_photo = null;
      task.cancellation_reason = null;
      task.completed_at = null;
    } else if (taskType === 'daily_management') {
      await supabase
        .from('task_completions')
        .delete()
        .eq('task_template_id', task.id)
        .eq('profile_id', currentProfile.value.id)
        .eq('period_key', task.periodKey);

      task.status = 'pending';
      task.completed = false;
      task.evidence_text = null;
      task.evidence_photo = null;
      task.cancellation_reason = null;
      task.completed_at = null;
    } else if (taskType === 'scheduled') {
      await supabase
        .from('scheduled_delivery_completions')
        .delete()
        .eq('delivery_id', task.id)
        .eq('profile_id', currentProfile.value.id)
        .eq('period_key', task._periodKey);

      task.status = 'pending';
      task.completed = false;
      task.evidence_text = null;
      task.evidence_photo = null;
      task.cancellation_reason = null;
      task.completed_at = null;
    }
  } catch (err) {
    console.error('Error reabriendo tarea:', err);
    alert('No fue posible reabrir la tarea: ' + (err.message || 'Error'));
  }
};

// Gestión Diaria: actividades recurrentes y estándar del cargo.
const fetchDailyManagement = async (roleId, profileId) => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('role_task_templates')
      .select('*')
      .eq('role_id', roleId)
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (templatesError) throw templatesError;

    let completions = [];
    const { data: compData, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_template_id, period_key, status, evidence_text, evidence_photo, cancellation_reason, completed_at')
      .eq('profile_id', profileId);

    if (completionsError) {
      const { data: fallbackComp } = await supabase
        .from('task_completions')
        .select('task_template_id, period_key')
        .eq('profile_id', profileId);
      completions = fallbackComp || [];
    } else {
      completions = compData || [];
    }

    const compMap = new Map();
    (completions || []).forEach(c => {
      compMap.set(`${c.task_template_id}::${c.period_key}`, c);
    });

    const withStatus = (frequency) =>
      (templates || [])
        .filter(t => t.frequency === frequency)
        .map(t => {
          const pKey = getPeriodKey(frequency);
          const c = compMap.get(`${t.id}::${pKey}`);
          const isComp = !!c;
          return {
            ...t,
            periodKey: pKey,
            completed: isComp && (c?.status !== 'unfulfilled'),
            status: c ? (c.status || 'completed') : 'pending',
            evidence_text: c?.evidence_text || null,
            evidence_photo: c?.evidence_photo || null,
            cancellation_reason: c?.cancellation_reason || null,
            completed_at: c?.completed_at || null
          };
        });

    dmDailyTasks.value = withStatus('daily');
    dmWeeklyTasks.value = withStatus('weekly');
    dmMonthlyTasks.value = withStatus('monthly');
  } catch (e) {
    console.error('Error fetching Gestión Diaria:', e);
  }
};

// ─── Programados: lógica de fetching y cálculo ─────────────────────────────

// Calcula el period_key según tipo de recurrencia
const getScheduledPeriodKey = (sd) => {
  const now = new Date();
  if (sd.recurrence_type === 'monthly_day') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  if (sd.recurrence_type === 'weekly_day') {
    // ISO week number
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  // once
  return sd.due_date || now.toISOString().split('T')[0];
};

// Días hasta el próximo disparo
const daysUntilNextTrigger = (sd) => {
  const now = new Date();
  const todayD = now.getDate();
  const todayDow = now.getDay(); // 0=Sun

  if (sd.recurrence_type === 'monthly_day') {
    const target = sd.recurrence_value;
    if (todayD === target) return 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return todayD < target
      ? target - todayD
      : daysInMonth - todayD + target;
  }
  if (sd.recurrence_type === 'weekly_day') {
    const target = sd.recurrence_value;
    if (todayDow === target) return 0;
    const diff = (target - todayDow + 7) % 7;
    return diff === 0 ? 7 : diff;
  }
  if (sd.recurrence_type === 'once' && sd.due_date) {
    const due = new Date(sd.due_date);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86400000);
    return Math.max(0, diff);
  }
  return 999;
};

const fetchScheduledDeliveries = async (role, profile) => {
  try {
    const { data: all, error } = await supabase
      .from('scheduled_deliveries')
      .select('*')
      .eq('active', true);
    if (error) throw error;

    const applicable = (all || []).filter(sd => {
      if (sd.target_type === 'all') return true;
      if (sd.target_type === 'profile' && sd.target_profile_ids?.includes(profile.id)) return true;
      if (sd.target_type === 'role' && sd.target_role_ids?.includes(role.id)) return true;
      if (sd.target_type === 'level' && role.access_level === sd.target_level) return true;
      if (sd.target_type === 'area' && role.area_id === sd.target_area_id) return true;
      return false;
    });

    const deliveryIds = applicable.map(sd => sd.id);
    let comps = [];
    if (deliveryIds.length > 0) {
      const { data: compData, error: compErr } = await supabase
        .from('scheduled_delivery_completions')
        .select('delivery_id, period_key, status, evidence_text, evidence_photo, cancellation_reason, completed_at')
        .eq('profile_id', profile.id)
        .in('delivery_id', deliveryIds);

      if (compErr) {
        const { data: fallbackComp } = await supabase
          .from('scheduled_delivery_completions')
          .select('delivery_id, period_key')
          .eq('profile_id', profile.id)
          .in('delivery_id', deliveryIds);
        comps = fallbackComp || [];
      } else {
        comps = compData || [];
      }
    }

    const compMap = new Map();
    comps.forEach(c => {
      compMap.set(`${c.delivery_id}::${c.period_key}`, c);
    });

    scheduledDeliveries.value = applicable.map(sd => {
      const days = daysUntilNextTrigger(sd);
      const periodKey = getScheduledPeriodKey(sd);
      const c = compMap.get(`${sd.id}::${periodKey}`);
      const isComp = !!c;
      return {
        ...sd,
        _daysUntil: days,
        _triggersToday: days === 0,
        _periodKey: periodKey,
        completed: isComp && (c?.status !== 'unfulfilled'),
        status: c ? (c.status || 'completed') : 'pending',
        evidence_text: c?.evidence_text || null,
        evidence_photo: c?.evidence_photo || null,
        cancellation_reason: c?.cancellation_reason || null,
        completed_at: c?.completed_at || null
      };
    });
  } catch (e) {
    console.error('Error fetching scheduled deliveries:', e);
  }
};

const scheduledRecurrenceLabel = (sd) => {
  if (sd.recurrence_type === 'monthly_day') return `Día ${sd.recurrence_value} de cada mes`;
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  if (sd.recurrence_type === 'weekly_day') return `Cada ${days[sd.recurrence_value] || '?'}`;
  if (sd.due_date) return `Una vez: ${new Date(sd.due_date).toLocaleDateString('es-CO')}`;
  return 'Programado';
};

const fetchRoleData = async (roleId) => {
  loadingKpis.value = true;
  try {
    // 1. Fetch Workflows/Context for this role
    const { data: flowData } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', roleId)
      .limit(1)
      .single();

    if (flowData) {
      // Prepare context string for the AI
      roleContextStr.value = `
Tareas Principales: ${JSON.stringify(flowData.tasks)}
Inputs requeridos: ${JSON.stringify(flowData.inputs)}
Outputs entregables: ${JSON.stringify(flowData.outputs)}
KPIs esperados: ${JSON.stringify(flowData.kpis)}
      `.trim();
    } else {
      roleContextStr.value = '';
    }

    // 2. Fetch Templates (Global or specific to this role)
    const { data: templateData } = await supabase
      .from('document_templates')
      .select('*')
      .or(`role_id.is.null,role_id.eq.${roleId}`)
      .order('title');
      
    templates.value = templateData || [];

    await fetchChatHistory(roleId);

  } catch (error) {
    console.error('Error fetching role data:', error);
  } finally {
    loadingKpis.value = false;
  }
};

const fetchKpiDetail = async (roleId) => {
  loadingKpiDetail.value = true;
  try {
    kpiDetail.value = await getRoleKpiDetail(roleId);
  } catch (e) {
    console.error('Error cargando KPIs del cargo:', e);
    kpiDetail.value = { overallScore: 0, metrics: [] };
  } finally {
    loadingKpiDetail.value = false;
  }
};

const fetchChatHistory = async (roleId) => {
  try {
    const { data: history, error } = await supabase
      .from('chat_history')
      .select('sender, message, created_at')
      .eq('role_id', roleId)
      .order('created_at', { ascending: true });
      
    if (history && !error) {
      messages.value = history.map(msg => ({
        sender: msg.sender,
        text: msg.message
      }));
      scrollToBottom();
    }
  } catch (e) {
    console.error('Error fetching chat history:', e);
  }
};

const clearChatHistory = async () => {
  if (!confirm('¿Estás seguro de que deseas borrar el historial del chat?')) return;
  try {
    if (currentRole.value?.id) {
      await supabase.from('chat_history').delete().eq('role_id', currentRole.value.id);
    }
    messages.value = [];
  } catch (e) {
    console.error('Error borrando historial:', e);
  }
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || !currentRole.value) return;

  messages.value.push({ sender: 'user', text });
  newMessage.value = '';
  isTyping.value = true;
  scrollToBottom();

  try {
    const session = await supabase.auth.getSession();
    const response = await fetch('/api/role-chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token || ''}`
      },
      body: JSON.stringify({ 
        message: text,
        roleId: currentRole.value.id,
        roleName: currentRole.value.name,
        roleContext: roleContextStr.value,
        userId: currentProfile.value?.id
      })
    });

    const data = await response.json();
    if (response.ok) {
      messages.value.push({ sender: 'ai', text: data.reply });
    } else {
      messages.value.push({ sender: 'ai', text: `Error: ${data.error}` });
    }
  } catch (error) {
    messages.value.push({ sender: 'ai', text: 'Error de conexión con NOVA WORK AI.' });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const formatMessage = (text) => {
  return marked.parse(text);
};

const getInitials = (name) => {
  if (!name) return 'EN';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getScoreColor = (score) => {
  if (score === 0) return 'gray';
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
};

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
});
</script>
<style scoped>
/* Tailwind classes handle the layout now */
.material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 1; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #d1d1d6; border-radius: 6px; }
</style>
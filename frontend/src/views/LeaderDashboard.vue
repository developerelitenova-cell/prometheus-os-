<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased">

    <main class="w-full pt-20 bg-surface min-h-screen">
      <div v-if="!isLeader && !loading" class="flex flex-col items-center justify-center pt-24">
        <span class="material-symbols-outlined text-6xl text-danger mb-4">block</span>
        <h2 class="text-2xl font-bold">Acceso Restringido</h2>
        <p class="text-secondary mt-2">Este módulo es exclusivo para líderes de área.</p>
        <button @click="$router.back()" class="mt-6 px-6 py-2 bg-primary text-white rounded-lg">Volver</button>
      </div>

      <div v-else class="flex flex-col w-full">
        <div class="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin py-space-xl">
          
          <!-- Header and Bento Summary -->
          <div class="flex flex-col gap-space-md mb-space-xl">
            <!-- Header Row -->
            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div class="flex flex-col max-w-2xl">
                <div class="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container w-fit mb-space-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  <span class="font-caption text-caption tracking-wider text-on-surface-variant uppercase font-semibold">Dirección • {{ leaderArea?.name || 'Área' }}</span>
                </div>
                <h1 class="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Centro de Control</h1>
                <p class="font-body-md text-body-md text-secondary mt-1">Supervisión táctica y rendimiento del equipo.</p>
              </div>
              
              <div class="flex items-center gap-space-sm self-start lg:self-end shrink-0">
                <button v-if="canManageKpis" @click="router.push('/kpis')" class="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container border border-[#b08d57]/40 hover:border-primary text-on-surface font-label-md text-label-md transition-all duration-200 shadow-sm" type="button">
                  <span class="material-symbols-outlined text-[#8a6d3d] text-[18px]">analytics</span>
                  <span>Módulo KPIs & Actas</span>
                </button>
                <button @click="router.push('/workspace')" class="group inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-outline-variant text-on-surface font-label-md text-label-md transition-all duration-200 shadow-sm" type="button">
                  <span class="material-symbols-outlined text-primary text-[18px] transition-transform group-hover:scale-110">monitoring</span>
                  <span>Ver Mis KPIs</span>
                </button>
                <button @click="openScheduledModal" class="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container border border-surface-container-high hover:border-primary text-on-surface font-label-md text-label-md transition-all duration-200 shadow-sm">
                  <span class="material-symbols-outlined text-[#0071e3] text-[18px]">event_repeat</span>
                  <span>Orden Programada</span>
                </button>
                <button @click="openTaskModal(null)" class="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md transition-all duration-200 shadow-[0_2px_10px_rgba(176,141,87,0.25)] active:scale-[0.98]">
                  <span class="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Asignar Tarea General</span>
                </button>
              </div>
            </div>

            <!-- Bento Summary Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-space-md mt-space-sm">
              <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-caption text-caption uppercase text-secondary font-semibold tracking-wider">Fuerza Operativa</span>
                  <span class="material-symbols-outlined text-primary/70">group</span>
                </div>
                <span class="font-headline-md text-headline-md font-semibold text-on-surface">{{ teamMembers.length }}</span>
              </div>
              
              <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-caption text-caption uppercase text-secondary font-semibold tracking-wider">KPI Promedio</span>
                  <span class="material-symbols-outlined text-[#2e7d32]/70">pie_chart</span>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="font-headline-md text-headline-md font-semibold text-[#2e7d32]">{{ averageKpi }}%</span>
                </div>
              </div>

              <div class="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-sm flex flex-col justify-between">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-caption text-caption uppercase text-secondary font-semibold tracking-wider">T. Promedio</span>
                  <span class="material-symbols-outlined text-primary/70">timer</span>
                </div>
                <span class="font-headline-md text-headline-md font-semibold text-on-surface">{{ averageTaskTimeHours }}h</span>
              </div>

              <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between" :class="totalOverdue > 0 ? 'border border-danger/30 bg-error-container/20' : 'border border-surface-container-high'">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-caption text-caption uppercase font-semibold tracking-wider" :class="totalOverdue > 0 ? 'text-danger' : 'text-secondary'">Alertas (Vencidas)</span>
                  <span class="material-symbols-outlined" :class="totalOverdue > 0 ? 'text-danger/70' : 'text-secondary'">warning</span>
                </div>
                <span class="font-headline-md text-headline-md font-semibold" :class="totalOverdue > 0 ? 'text-danger' : 'text-on-surface'">{{ totalOverdue }} Tareas</span>
              </div>
            </div>
          </div>

          <!-- AI Proactive Alerts Section -->
          <div v-if="systemAlerts.length > 0" class="mb-space-xl">
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold mb-space-md flex items-center gap-2">
              <span class="material-symbols-outlined text-danger">campaign</span>
              Alertas Proactivas de IA
            </h2>
            <div class="flex flex-col gap-3">
              <div v-for="alert in systemAlerts" :key="alert.id" class="p-space-md rounded-2xl border flex items-start gap-3 shadow-sm" :class="alert.severity === 'critical' ? 'bg-error-container/20 border-danger/30' : 'bg-surface-container-low border-surface-container-high'">
                <span class="material-symbols-outlined mt-0.5" :class="alert.severity === 'critical' ? 'text-danger' : 'text-warning'">
                  {{ alert.severity === 'critical' ? 'error' : 'warning' }}
                </span>
                <div class="flex flex-col">
                  <span class="font-label-lg text-label-lg font-semibold" :class="alert.severity === 'critical' ? 'text-danger' : 'text-on-surface'">{{ alert.title }}</span>
                  <p class="font-body-sm text-body-sm text-secondary whitespace-pre-wrap mt-1">{{ alert.message }}</p>
                  <span class="font-caption text-caption text-secondary mt-2 opacity-70">{{ new Date(alert.created_at).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Bar: Title & Search/Filter Strip -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Directorio del Equipo</h2>
            
            <div class="flex flex-wrap items-center gap-space-sm">
              <div class="flex items-center bg-surface-container-lowest rounded-xl p-1 shadow-sm border border-surface-container-high">
                <button v-for="period in ['Diario', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual']" :key="period"
                        @click="selectedPeriod = period"
                        :class="['px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors', 
                                selectedPeriod === period ? 'bg-primary/10 text-primary font-semibold' : 'text-secondary hover:bg-surface-container-low']">
                  {{ period }}
                </button>
              </div>
            </div>
          </div>

          <!-- Compact Executive Master-Detail Split Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            
            <!-- Left Master List (Compact Directory) -->
            <div class="lg:col-span-8 flex flex-col gap-space-xs">
              <div v-if="loading" class="text-center py-10 text-secondary">Cargando equipo...</div>
              <div v-else-if="filteredTeam.length === 0" class="text-center py-10 text-secondary">No hay colaboradores que coincidan con la búsqueda.</div>
              
              <div v-for="member in filteredTeam" :key="member.id" 
                   @click="selectMember(member)"
                   :class="['flex items-center justify-between p-space-sm rounded-xl transition-all duration-200 cursor-pointer border', 
                            selectedMember?.id === member.id ? 'bg-surface-container-lowest border-primary-container shadow-sm ring-1 ring-primary-container' : 'bg-surface border-transparent hover:bg-surface-container-lowest hover:border-surface-container-high hover:shadow-sm']">
                
                <div class="flex items-center gap-space-md">
                  <div class="relative shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-high text-primary font-bold shadow-sm">
                    {{ member.full_name.charAt(0) }}
                    <span v-if="member.overdue_tasks_count > 0" class="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full ring-2 ring-surface-container-lowest"></span>
                    <span v-else class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-surface-container-lowest"></span>
                  </div>
                  <div class="flex flex-col">
                    <h3 class="font-label-lg text-label-lg text-on-surface font-semibold leading-tight">{{ member.full_name }}</h3>
                    <span class="font-caption text-caption text-secondary">{{ member.roles?.name || 'Sin cargo' }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-space-md text-right">
                  <div class="hidden sm:flex flex-col text-left min-w-[90px]">
                    <span class="font-caption text-caption text-secondary text-[11px]">Estado ({{ selectedPeriod }})</span>
                    <span class="font-label-sm text-xs font-semibold" :class="member.overdue_tasks_count > 0 ? 'text-danger' : member.pending_tasks_count > 0 ? 'text-amber-600' : 'text-success'">
                      {{ member.pending_tasks_count }} Pend. {{ member.overdue_tasks_count > 0 ? `(${member.overdue_tasks_count} Venc.)` : '' }}
                    </span>
                  </div>
                  <div class="flex flex-col items-end min-w-[70px]">
                    <span v-if="member.total_tasks > 0" 
                          :class="[
                            'inline-flex items-center justify-center px-2 py-0.5 rounded-md font-label-sm text-xs font-bold border',
                            member.completion_rate >= 80 ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]' :
                            member.completion_rate >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          ]"
                          :title="`Eficiencia en ${selectedPeriod}: ${member.completed_tasks_count} de ${member.total_tasks} tareas listas (${member.completion_rate}%)`">
                      {{ member.completion_rate }}%
                    </span>
                    <span v-else class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-surface-container text-secondary text-[11px] font-medium border border-surface-container-high" title="Sin tareas asignadas en este período">
                      0%
                    </span>
                    <span v-if="member.latest_score > 0" class="text-[10px] text-primary font-medium mt-0.5" :title="`Score KPI: ${member.latest_score}%`">
                      KPI: {{ member.latest_score }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Rail Inspector (Detail View) -->
            <div class="lg:col-span-4 flex flex-col gap-space-md sticky top-24">
              <div v-if="selectedMember" class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border border-surface-container-high relative overflow-hidden flex flex-col">
                <!-- Inspector Header -->
                <div class="flex items-start gap-space-sm mb-space-md pb-space-md border-b border-surface-container-high">
                  <div class="w-16 h-16 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center font-bold text-3xl shadow-sm ring-4 ring-primary/5">
                    {{ selectedMember.full_name.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">{{ selectedMember.full_name }}</h4>
                    <span class="font-caption text-caption text-secondary block mb-1 truncate">{{ selectedMember.roles?.name }}</span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low font-caption text-caption text-on-surface-variant border border-surface-container">
                      <span class="w-1.5 h-1.5 rounded-full" :class="selectedMember.overdue_tasks_count > 0 ? 'bg-danger' : 'bg-success'"></span>
                      {{ selectedMember.overdue_tasks_count > 0 ? 'Requiere Atención' : 'Operativo' }}
                    </span>
                  </div>
                </div>
                
                <!-- Performance Stats -->
                <div class="flex flex-col gap-space-sm mb-space-lg">
                  <div class="flex items-center justify-between">
                    <span class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Métricas • {{ selectedPeriod }}</span>
                    <span v-if="selectedMember.latest_score > 0" class="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full" :title="`Puntaje de medición de KPIs del cargo`">
                      KPI Cargo: {{ selectedMember.latest_score }}%
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-space-sm">
                    <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                      <div class="flex items-center justify-between mb-0.5">
                        <span class="font-caption text-caption text-secondary">Eficiencia</span>
                        <span class="material-symbols-outlined text-[14px] text-secondary cursor-help" title="Fórmula de Eficiencia: (Tareas Listas / Total Tareas en el Período) × 100">info</span>
                      </div>
                      <span class="font-headline-sm text-headline-sm font-semibold text-[#2e7d32]">
                        {{ selectedMember.total_tasks > 0 ? selectedMember.completion_rate + '%' : '0%' }}
                      </span>
                      <span class="text-[10px] text-secondary block mt-0.5">
                        {{ selectedMember.total_tasks > 0 ? `${selectedMember.completed_tasks_count} de ${selectedMember.total_tasks} listas` : 'Sin tareas asignadas' }}
                      </span>
                    </div>
                    <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                      <span class="font-caption text-caption text-secondary block mb-0.5">T. Promedio</span>
                      <span class="font-headline-sm text-headline-sm font-semibold text-on-surface">{{ selectedMember.avg_time_hours }}h</span>
                      <span class="text-[10px] text-secondary block mt-0.5">Tiempo medio de ejecución</span>
                    </div>
                  </div>
                  
                  <!-- Task Breakdown -->
                  <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container mt-1">
                    <div class="flex items-center justify-between font-caption text-caption mb-1.5">
                      <span class="text-secondary font-medium">Desglose de Tareas</span>
                      <span class="font-semibold text-on-surface">{{ selectedMember.total_tasks }} Totales</span>
                    </div>
                    <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden flex mb-2">
                      <div class="h-full bg-emerald-500 transition-all duration-300" :style="`width: ${selectedMember.completion_rate}%;`"></div>
                      <div class="h-full bg-amber-400 transition-all duration-300" :style="`width: ${selectedMember.pending_rate}%;`"></div>
                      <div class="h-full bg-danger transition-all duration-300" :style="`width: ${selectedMember.overdue_rate}%;`"></div>
                    </div>
                    <div class="flex justify-between text-xs">
                      <span class="text-emerald-700 font-medium">{{ selectedMember.completed_tasks_count }} Listas</span>
                      <span class="text-amber-700 font-medium">{{ selectedMember.pending_tasks_count }} Pend.</span>
                      <span class="text-danger font-medium">{{ selectedMember.overdue_tasks_count }} Venc.</span>
                    </div>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-col gap-space-sm mt-auto pt-space-md border-t border-surface-container-high">
                  <button @click="openTaskModal(selectedMember)" class="w-full py-2.5 px-space-md rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-[18px]">assignment_add</span>
                    <span>Asignar Tarea Específica</span>
                  </button>
                  <button @click="auditWorkspace(selectedMember.id)" class="w-full py-2.5 px-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high text-on-surface font-label-md text-label-md text-center transition-all inline-flex items-center justify-center gap-2 cursor-pointer">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                    <span>Auditar Espacio</span>
                  </button>
                  <div v-if="currentUser?.is_master_admin || isLeader" class="flex gap-2 w-full pt-1">
                    <button @click="openEditProfile(selectedMember)" class="flex-1 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant text-label-sm font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer" title="Editar Perfil del Colaborador">
                      <span class="material-symbols-outlined text-[16px]">manage_accounts</span> Editar Perfil
                    </button>
                    <button @click="manageLegal(selectedMember)" class="flex-1 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant text-label-sm font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer" title="Gestionar Firmas y Contratos">
                      <span class="material-symbols-outlined text-[16px]">gavel</span> Legal / Contratos
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high flex flex-col items-center justify-center text-center min-h-[300px]">
                <span class="material-symbols-outlined text-5xl text-surface-container-high mb-2">person_search</span>
                <p class="font-body-md text-body-md text-secondary">Selecciona un colaborador del directorio para ver sus detalles y métricas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Asignar Tarea — Versión Detallada -->
    <div v-if="showTaskModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

        <!-- Header del modal -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-container shrink-0">
          <div>
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-[#b08d57]">assignment_add</span>
              Asignar Pendiente del Día
            </h2>
            <p class="text-secondary text-sm mt-0.5">Especifica con precisión qué, cuándo y cómo debe ejecutarse</p>
          </div>
          <button @click="closeTaskModal" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="submitTask" class="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          <!-- ── SECCIÓN 1: ¿A QUIÉN? ─────────────────────────────── -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#b08d57] text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              <h3 class="font-semibold text-on-surface text-sm uppercase tracking-wider">¿A quién se asigna?</h3>
            </div>

            <!-- Si viene de "Asignar Específica" ya está fijo -->
            <div v-if="taskTargetMember" class="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-surface-container-high">
              <div class="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center font-bold text-on-surface text-lg shrink-0">
                {{ taskTargetMember.full_name.charAt(0) }}
              </div>
              <div>
                <p class="font-semibold text-on-surface text-sm">{{ taskTargetMember.full_name }}</p>
                <p class="text-xs text-secondary">{{ taskTargetMember.roles?.name }}</p>
              </div>
              <span class="ml-auto text-[11px] font-bold bg-[#b08d57]/10 text-[#b08d57] px-2 py-0.5 rounded-full border border-[#b08d57]/30">Asignado</span>
            </div>

            <!-- Selección múltiple si es General -->
            <div v-else class="space-y-2">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Seleccionar colaborador(es) <span class="text-danger">*</span></label>
              <div class="max-h-36 overflow-y-auto space-y-1 border border-surface-container-high rounded-xl p-2 bg-surface-container-low">
                <label v-for="m in teamMembers" :key="m.id"
                  class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
                  :class="newTask.assigned_to_list?.includes(m.id) ? 'bg-[#b08d57]/5 border border-[#b08d57]/20' : ''">
                  <input type="checkbox" :value="m.id" v-model="newTask.assigned_to_list" class="rounded accent-[#b08d57]" />
                  <div class="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface shrink-0">{{ m.full_name.charAt(0) }}</div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-on-surface truncate">{{ m.full_name }}</p>
                    <p class="text-xs text-secondary truncate">{{ m.roles?.name }}</p>
                  </div>
                </label>
              </div>
              <p class="text-xs text-secondary">{{ (newTask.assigned_to_list || []).length }} seleccionado(s)</p>
            </div>
          </div>

          <!-- ── SECCIÓN 2: ¿QUÉ? ────────────────────────────────── -->
          <div class="space-y-3 pt-1 border-t border-surface-container">
            <div class="flex items-center gap-2 mt-4 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#b08d57] text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
              <h3 class="font-semibold text-on-surface text-sm uppercase tracking-wider">¿Qué debe hacer exactamente?</h3>
            </div>

            <!-- Título -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Título de la tarea <span class="text-danger">*</span></label>
              <input v-model="newTask.title" required type="text"
                placeholder="Ej: Llamar a cliente ABC para confirmar pedido #445"
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
            </div>

            <!-- Instrucciones detalladas -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Instrucciones detalladas <span class="text-danger">*</span></label>
              <textarea v-model="newTask.description" rows="3" required
                placeholder="Explica paso a paso lo que debe hacer: con quién hablar, qué revisar, qué sistema usar, qué información obtener..."
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm resize-none"></textarea>
            </div>

            <!-- Entregable esperado -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Entregable esperado <span class="text-danger">*</span></label>
              <input v-model="newTask.deliverable" type="text"
                placeholder="Ej: Foto del inventario contado, Captura del correo enviado, Informe en PDF..."
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
            </div>

            <!-- Categoría -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Categoría</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="cat in taskCategories" :key="cat.k" type="button"
                  @click="newTask.category = cat.k"
                  :class="['px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    newTask.category === cat.k ? 'bg-surface-container-high border-on-surface text-on-surface' : 'bg-surface-container-low border-surface-container-high text-secondary hover:border-on-surface-variant']">
                  {{ cat.icon }} {{ cat.l }}
                </button>
              </div>
            </div>
          </div>

          <!-- ── SECCIÓN 3: ¿CUÁNDO? ─────────────────────────────── -->
          <div class="space-y-3 pt-1 border-t border-surface-container">
            <div class="flex items-center gap-2 mt-4 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#b08d57] text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
              <h3 class="font-semibold text-on-surface text-sm uppercase tracking-wider">¿Cuándo debe estar lista?</h3>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col gap-1 col-span-1">
                <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Fecha límite <span class="text-danger">*</span></label>
                <input v-model="newTask.due_date" required type="date"
                  class="px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none text-sm" />
              </div>
              <div class="flex flex-col gap-1 col-span-1">
                <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Hora límite</label>
                <input v-model="newTask.due_time" type="time"
                  class="px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none text-sm" />
              </div>
              <div class="flex flex-col gap-1 col-span-1">
                <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Duración est.</label>
                <select v-model="newTask.estimated_minutes"
                  class="px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none text-sm">
                  <option value="">—</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                  <option value="240">4 horas</option>
                  <option value="480">Día completo</option>
                </select>
              </div>
            </div>

            <!-- Frecuencia -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Tipo de ocurrencia</label>
              <div class="flex gap-2">
                <button v-for="t in [{k:'once',l:'Una vez'},{k:'daily',l:'Diaria'},{k:'weekly',l:'Semanal'},{k:'monthly',l:'Mensual'}]"
                  :key="t.k" type="button"
                  @click="newTask.task_type = t.k"
                  :class="['flex-1 py-2 rounded-lg border text-xs font-semibold transition-all',
                    newTask.task_type === t.k ? 'bg-surface-container-high border-on-surface-variant text-on-surface' : 'bg-surface-container-low border-surface-container-high text-secondary hover:border-on-surface-variant']">
                  {{ t.l }}
                </button>
              </div>
            </div>
          </div>

          <!-- ── SECCIÓN 4: ¿CON QUÉ NIVEL? ─────────────────────── -->
          <div class="space-y-3 pt-1 border-t border-surface-container">
            <div class="flex items-center gap-2 mt-4 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#b08d57] text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
              <h3 class="font-semibold text-on-surface text-sm uppercase tracking-wider">Prioridad y nivel de urgencia</h3>
            </div>

            <div class="grid grid-cols-4 gap-2">
              <button v-for="p in [
                {k:'low',    l:'Baja',    sub:'Sin prisa',     cls:'border-surface-container-high text-secondary', activeC:'bg-surface-container-high border-on-surface-variant text-on-surface'},
                {k:'medium', l:'Media',   sub:'Esta semana',   cls:'border-surface-container-high text-secondary', activeC:'bg-amber-50 border-amber-400 text-amber-700'},
                {k:'high',   l:'Alta',    sub:'Hoy mismo',     cls:'border-surface-container-high text-secondary', activeC:'bg-red-50 border-red-400 text-red-700'},
                {k:'urgent', l:'Urgente', sub:'¡Inmediata!',   cls:'border-surface-container-high text-secondary', activeC:'bg-red-600 border-red-600 text-white'},
              ]" :key="p.k" type="button"
                @click="newTask.priority = p.k"
                :class="['py-2.5 rounded-xl border text-center transition-all',
                  newTask.priority === p.k ? p.activeC : ('bg-surface-container-low ' + p.cls + ' hover:border-on-surface-variant')]">
                <p class="text-sm font-bold leading-none">{{ p.l }}</p>
                <p class="text-[10px] mt-0.5 opacity-80">{{ p.sub }}</p>
              </button>
            </div>

            <!-- Nota interna para el líder -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Nota interna del líder (no visible para el empleado)</label>
              <input v-model="newTask.leader_note" type="text"
                placeholder="Ej: Si no puede hacerlo, que avise antes del mediodía..."
                class="px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <!-- ── PREVIEW CARD ─────────────────────────────────────── -->
          <div v-if="newTask.title" class="pt-1 border-t border-surface-container">
            <p class="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 mt-4">Vista previa — Así verá el empleado esta tarea:</p>
            <div class="p-3 bg-white border border-[#e5e5ea] rounded-xl shadow-sm flex items-start gap-3">
              <div :class="['w-5 h-5 mt-0.5 rounded-full border-2 shrink-0',
                newTask.priority === 'urgent' ? 'border-red-500' :
                newTask.priority === 'high'   ? 'border-red-400' :
                newTask.priority === 'medium' ? 'border-amber-400' : 'border-gray-300']"></div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-[#1d1d1f]">{{ newTask.title }}</p>
                <p v-if="newTask.description" class="text-[11px] text-[#86868b] mt-0.5 line-clamp-2">{{ newTask.description }}</p>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span v-if="newTask.deliverable" class="text-[10px] bg-[#f5f5f7] text-[#1d1d1f] px-1.5 py-0.5 rounded border border-[#e5e5ea]">
                    📎 {{ newTask.deliverable }}
                  </span>
                  <span v-if="newTask.due_date" class="text-[10px] bg-[#f5f5f7] text-[#86868b] px-1.5 py-0.5 rounded">
                    📅 {{ new Date(newTask.due_date + 'T00:00:00').toLocaleDateString('es-CO') }}
                    {{ newTask.due_time ? '· ' + newTask.due_time : '' }}
                  </span>
                  <span v-if="newTask.estimated_minutes" class="text-[10px] bg-[#f5f5f7] text-[#86868b] px-1.5 py-0.5 rounded">
                    ⏱ {{ newTask.estimated_minutes >= 60 ? (newTask.estimated_minutes/60) + 'h' : newTask.estimated_minutes + 'min' }}
                  </span>
                  <span v-if="newTask.priority === 'urgent'" class="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">¡URGENTE!</span>
                  <span v-else-if="newTask.priority === 'high'" class="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">Alta Prioridad</span>
                </div>
              </div>
            </div>
          </div>

        </form>

        <!-- Footer fijo -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-surface-container shrink-0">
          <button type="button" @click="closeTaskModal" class="px-6 py-2.5 rounded-xl font-semibold text-secondary hover:bg-surface-container-low transition-colors">Cancelar</button>
          <button type="button" @click="submitTask" :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white hover:brightness-105 shadow-md transition-all flex items-center gap-2">
            <span v-if="isSaving" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            <span>{{ isSaving ? 'Guardando...' : 'Asignar Tarea' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Toast Notification -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform translate-y-2 opacity-0">
      <div v-if="showSuccessToast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#2e7d32] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-label-md text-label-md">
        <span class="material-symbols-outlined">check_circle</span>
        <span>{{ successToastMessage }}</span>
      </div>
    </transition>

    <!-- Modal: Crear Orden Programada -->
    <div v-if="showScheduledModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-container">
          <div>
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0071e3]">event_repeat</span>
              Crear Orden Programada
            </h2>
            <p class="text-secondary text-sm mt-0.5">La entrega aparecerá en "Pendientes del Día" cuando llegue su fecha</p>
          </div>
          <button @click="showScheduledModal = false" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <!-- Título -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Título de la Entrega <span class="text-danger">*</span></label>
            <input v-model="newScheduled.title" type="text" required
              placeholder="Ej: Informe PIG mensual, Reporte de ventas..."
              class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <!-- Descripción -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Descripción / Instrucciones</label>
            <textarea v-model="newScheduled.description" rows="2"
              placeholder="Instrucciones de qué se debe entregar..."
              class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none"></textarea>
          </div>

          <!-- Recurrencia -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Tipo de Recurrencia <span class="text-danger">*</span></label>
              <select v-model="newScheduled.recurrence_type"
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none">
                <option value="monthly_day">Día del mes (Ej: día 7)</option>
                <option value="weekly_day">Día de la semana (Ej: cada lunes)</option>
                <option value="once">Una sola vez (fecha específica)</option>
              </select>
            </div>
            <!-- Valor de recurrencia -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">
                {{ newScheduled.recurrence_type === 'monthly_day' ? 'Día del Mes (1-31)' :
                   newScheduled.recurrence_type === 'weekly_day' ? 'Día de la Semana' : 'Fecha de Entrega' }}
                <span class="text-danger">*</span>
              </label>
              <!-- Monthly day -->
              <input v-if="newScheduled.recurrence_type === 'monthly_day'"
                v-model.number="newScheduled.recurrence_value" type="number" min="1" max="31"
                placeholder="Ej: 7"
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none" />
              <!-- Weekly day -->
              <select v-else-if="newScheduled.recurrence_type === 'weekly_day'"
                v-model.number="newScheduled.recurrence_value"
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none">
                <option :value="1">Lunes</option>
                <option :value="2">Martes</option>
                <option :value="3">Miércoles</option>
                <option :value="4">Jueves</option>
                <option :value="5">Viernes</option>
                <option :value="6">Sábado</option>
                <option :value="0">Domingo</option>
              </select>
              <!-- Once -->
              <input v-else v-model="newScheduled.due_date" type="date"
                class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary outline-none" />
            </div>
          </div>

          <!-- Prioridad -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Prioridad</label>
            <div class="flex gap-2">
              <button v-for="p in [{k:'low',l:'Baja'},{k:'medium',l:'Media'},{k:'high',l:'Alta'},{k:'urgent',l:'Urgente'}]" :key="p.k"
                @click="newScheduled.priority = p.k"
                :class="['flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                  newScheduled.priority === p.k
                    ? (p.k === 'urgent' ? 'bg-red-600 border-red-600 text-white' :
                       p.k === 'high' ? 'bg-red-50 border-red-400 text-red-700' :
                       p.k === 'medium' ? 'bg-amber-50 border-amber-400 text-amber-700' :
                       'bg-surface-container border-primary text-primary')
                    : 'bg-surface-container-low border-surface-container-high text-secondary hover:border-primary']"
              >{{ p.l }}</button>
            </div>
          </div>

          <!-- TARGETING: A quién aplica -->
          <div class="border border-surface-container-high rounded-xl p-4 bg-surface-container-low space-y-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-[18px] text-[#0071e3]">group_work</span>
              <h4 class="font-semibold text-on-surface text-sm">¿A quién aplica esta orden?</h4>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="tt in targetTypes" :key="tt.k"
                @click="newScheduled.target_type = tt.k"
                :class="['py-2.5 px-3 rounded-xl border text-sm font-semibold text-left transition-all flex items-center gap-2',
                  newScheduled.target_type === tt.k ? 'bg-[#e8f0fe] border-[#0071e3] text-[#0071e3]' : 'bg-surface-container border-surface-container-high text-secondary hover:border-primary']"
              >
                <span class="material-symbols-outlined text-[16px]">{{ tt.icon }}</span>
                {{ tt.l }}
              </button>
            </div>

            <!-- Personas específicas -->
            <div v-if="newScheduled.target_type === 'profile'" class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Seleccionar Personas</label>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <label v-for="m in allTeamMembers" :key="m.id" class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container cursor-pointer">
                  <input type="checkbox" :value="m.id" v-model="newScheduled.target_profile_ids" class="rounded" />
                  <span class="text-sm">{{ m.full_name }}</span>
                  <span class="text-xs text-secondary">{{ m.roles?.name }}</span>
                </label>
              </div>
            </div>

            <!-- Por nivel de acceso -->
            <div v-if="newScheduled.target_type === 'level'" class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Nivel de Acceso</label>
              <div class="flex gap-2">
                <button v-for="lv in [1,2,3]" :key="lv"
                  @click="newScheduled.target_level = lv"
                  :class="['flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                    newScheduled.target_level === lv ? 'bg-[#e8f0fe] border-[#0071e3] text-[#0071e3]' : 'bg-surface-container border-surface-container-high text-secondary']"
                >
                  Nivel {{ lv }}
                  <span class="block text-[10px] font-normal">{{ lv === 1 ? 'Gerentes' : lv === 2 ? 'Líderes' : 'Empleados' }}</span>
                </button>
              </div>
            </div>

            <!-- Por área -->
            <div v-if="newScheduled.target_type === 'area'" class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-secondary uppercase tracking-wide">Área</label>
              <select v-model="newScheduled.target_area_id"
                class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high focus:border-primary outline-none text-sm">
                <option disabled value="">Seleccionar área...</option>
                <option v-for="area in allAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-surface-container">
          <button @click="showScheduledModal = false" class="px-6 py-2.5 rounded-xl font-semibold text-secondary hover:bg-surface-container-low transition-colors">Cancelar</button>
          <button @click="submitScheduled" :disabled="isSavingScheduled"
            class="px-6 py-2.5 rounded-xl font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md transition-all flex items-center gap-2">
            <span v-if="isSavingScheduled" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            {{ isSavingScheduled ? 'Guardando...' : 'Crear Orden Programada' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Perfil de Colaborador -->
    <div v-if="showEditProfileModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-surface-container-high">
        <button @click="showEditProfileModal = false" class="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined">manage_accounts</span>
          </div>
          <div>
            <h3 class="text-lg font-bold text-on-surface">Editar Perfil del Colaborador</h3>
            <p class="text-xs text-secondary">Actualiza nombre, cargo y estado del colaborador</p>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-4">
          <!-- Nombre Completo -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Nombre Completo *</label>
            <input 
              type="text" 
              v-model="editProfileForm.full_name" 
              required
              placeholder="Ej. Juan Pérez"
              class="w-full bg-surface-container-low border border-surface-container rounded-xl p-3 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container text-sm" 
            />
          </div>

          <!-- Cargo / Rol Asignado -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Cargo / Rol Asignado</label>
            <select 
              v-model="editProfileForm.role_id"
              class="w-full bg-surface-container-low border border-surface-container rounded-xl p-3 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container text-sm"
            >
              <option value="">-- Sin cargo asignado --</option>
              <option v-for="r in availableRoles" :key="r.id" :value="r.id">
                {{ r.name }} {{ r.areas?.name ? `(${r.areas.name})` : '' }}
              </option>
            </select>
          </div>

          <!-- Estado de Aprobación / Cuenta -->
          <div>
            <label class="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Estado de la Cuenta</label>
            <select 
              v-model="editProfileForm.approval_status"
              class="w-full bg-surface-container-low border border-surface-container rounded-xl p-3 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container text-sm"
            >
              <option value="approved">Aprobado / Activo</option>
              <option value="pending">Pendiente de Aprobación</option>
              <option value="suspended">Suspendido</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          <!-- Master Admin (solo visible para Master Admins) -->
          <div v-if="currentUser?.is_master_admin" class="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-on-surface block">Privilegios Master Admin</span>
              <span class="text-[11px] text-secondary">Acceso global y control total</span>
            </div>
            <input 
              type="checkbox" 
              v-model="editProfileForm.is_master_admin"
              class="w-5 h-5 accent-primary cursor-pointer rounded"
            />
          </div>

          <!-- Botones de Acción -->
          <div class="flex gap-3 pt-2">
            <button 
              type="button" 
              @click="showEditProfileModal = false" 
              class="flex-1 py-2.5 rounded-xl border border-surface-container text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="isSavingProfile"
              class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white font-semibold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span v-if="isSavingProfile" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSavingProfile ? 'Guardando...' : 'Guardar Cambios' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showLegalModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
        <button @click="showLegalModal = false" class="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>
        <h3 class="text-xl font-bold text-on-surface mb-2">Legal y Contratación</h3>
        <p class="text-secondary font-body-sm text-body-sm mb-6">Gestionar documentos legales para <strong>{{ selectedMember?.full_name }}</strong></p>
        
        <div class="space-y-4">
          <div class="p-4 bg-surface-container-low rounded-xl border border-surface-container flex justify-between items-center">
            <div>
              <p class="font-label-md text-on-surface font-bold">Firma Digital</p>
              <p class="font-caption text-secondary">No se ha registrado firma.</p>
            </div>
            <button class="px-3 py-1.5 bg-surface-container border border-surface-container-high rounded-lg text-primary text-xs font-semibold">Subir Firma</button>
          </div>
          <div class="p-4 bg-surface-container-low rounded-xl border border-surface-container flex justify-between items-center">
            <div>
              <p class="font-label-md text-on-surface font-bold">Contrato Laboral</p>
              <p class="font-caption text-secondary">A la espera de plantilla RRHH.</p>
            </div>
            <button class="px-3 py-1.5 bg-surface-container border border-surface-container-high rounded-lg text-primary text-xs font-semibold">Generar Contrato</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/api/supabase';
import { useRouter } from 'vue-router';
import { getLatestRoleKpiScore } from '@/api/kpi';
import { signOut, canAccessKpis } from '@/api/auth';

const router = useRouter();
const canManageKpis = computed(() => canAccessKpis());

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

const currentUser = ref(null);
const isLeader = ref(false);
const isMaster = ref(false);
const leaderArea = ref(null);
const teamMembers = ref([]);
const loading = ref(true);

const searchQuery = ref('');
const selectedPeriod = ref('Mensual'); // Default
const selectedMember = ref(null);

const showEditProfileModal = ref(false);
const isSavingProfile = ref(false);
const availableRoles = ref([]);
const currentEditingMember = ref(null);
const editProfileForm = ref({
  id: '',
  full_name: '',
  role_id: '',
  approval_status: 'approved',
  is_master_admin: false
});

const showLegalModal = ref(false);

const openEditProfile = async (member) => {
  if (!member) return;
  currentEditingMember.value = member;
  editProfileForm.value = {
    id: member.id,
    full_name: member.full_name || '',
    role_id: member.roles?.id || member.role_id || '',
    approval_status: member.approval_status || 'approved',
    is_master_admin: !!member.is_master_admin
  };
  
  if (availableRoles.value.length === 0) {
    const { data: rolesData } = await supabase
      .from('roles')
      .select('id, name, area_id, access_level, areas(name)')
      .order('name');
    availableRoles.value = rolesData || [];
  }
  
  showEditProfileModal.value = true;
};

const saveProfile = async () => {
  if (!editProfileForm.value.full_name?.trim()) {
    alert('El nombre del colaborador no puede estar vacío.');
    return;
  }
  
  isSavingProfile.value = true;
  try {
    const updatePayload = {
      full_name: editProfileForm.value.full_name.trim(),
      role_id: editProfileForm.value.role_id || null,
      approval_status: editProfileForm.value.approval_status
    };
    
    // Solo si el usuario que edita es Master Admin puede cambiar el flag is_master_admin
    if (currentUser.value?.is_master_admin) {
      updatePayload.is_master_admin = editProfileForm.value.is_master_admin;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', editProfileForm.value.id);
      
    if (error) throw error;
    
    // Actualizar localmente el miembro actual
    const updatedRole = availableRoles.value.find(r => r.id === editProfileForm.value.role_id);
    if (currentEditingMember.value) {
      currentEditingMember.value.full_name = editProfileForm.value.full_name;
      if (updatedRole) {
        currentEditingMember.value.roles = updatedRole;
        currentEditingMember.value.role_id = updatedRole.id;
      }
      currentEditingMember.value.approval_status = editProfileForm.value.approval_status;
      currentEditingMember.value.is_master_admin = editProfileForm.value.is_master_admin;
    }
    if (selectedMember.value && selectedMember.value.id === editProfileForm.value.id) {
      selectedMember.value.full_name = editProfileForm.value.full_name;
      if (updatedRole) {
        selectedMember.value.roles = updatedRole;
        selectedMember.value.role_id = updatedRole.id;
      }
    }
    
    showEditProfileModal.value = false;
    successToastMessage.value = `¡Perfil de ${editProfileForm.value.full_name} actualizado con éxito!`;
    showSuccessToast.value = true;
    setTimeout(() => { showSuccessToast.value = false; }, 3500);
    
    // Re-sincronizar datos
    await fetchData();
  } catch (err) {
    console.error('Error al guardar perfil:', err);
    alert('Error al guardar los cambios del perfil: ' + (err.message || 'Error desconocido'));
  } finally {
    isSavingProfile.value = false;
  }
};

const manageLegal = (member) => {
  selectedMember.value = member;
  showLegalModal.value = true;
};

// Modal state
const showTaskModal = ref(false);
const taskTargetMember = ref(null);
const isSaving = ref(false);
const showSuccessToast = ref(false);
const successToastMessage = ref('¡Operación realizada con éxito!');
const newTask = ref({
  title: '',
  description: '',
  deliverable: '',
  category: '',
  due_time: '',
  estimated_minutes: '',
  leader_note: '',
  priority: 'medium',
  task_type: 'once',
  due_date: '',
  assigned_to: '',
  assigned_to_list: []
});

const taskCategories = [
  { k: 'operativo',     l: 'Operativo',      icon: '🔧' },
  { k: 'comercial',     l: 'Comercial',      icon: '💼' },
  { k: 'administrativo',l: 'Administrativo', icon: '📄' },
  { k: 'logistica',     l: 'Logística',      icon: '📦' },
  { k: 'cliente',       l: 'Cliente',        icon: '🤝' },
  { k: 'reporte',       l: 'Reporte',        icon: '📈' },
  { k: 'urgente',       l: 'Urgente',        icon: '⚡' },
];

const systemAlerts = ref([]);

// ── Scheduled Deliveries (Programados) ────────────────────────────────────
const showScheduledModal = ref(false);
const isSavingScheduled = ref(false);
const allAreas = ref([]);
const allTeamMembers = ref([]);

const targetTypes = [
  { k: 'all',     l: 'Todos',              icon: 'public' },
  { k: 'level',   l: 'Por Nivel',          icon: 'layers' },
  { k: 'area',    l: 'Por Área',           icon: 'corporate_fare' },
  { k: 'profile', l: 'Personas Específicas', icon: 'person_search' },
];

const newScheduled = ref({
  title: '',
  description: '',
  recurrence_type: 'monthly_day',
  recurrence_value: null,
  due_date: '',
  priority: 'medium',
  target_type: 'all',
  target_role_ids: [],
  target_profile_ids: [],
  target_level: null,
  target_area_id: ''
});

const openScheduledModal = async () => {
  newScheduled.value = {
    title: '', description: '',
    recurrence_type: 'monthly_day', recurrence_value: null, due_date: '',
    priority: 'medium', target_type: 'all',
    target_role_ids: [], target_profile_ids: [], target_level: null, target_area_id: ''
  };
  showScheduledModal.value = true;
  // Cargar áreas si no están
  if (!allAreas.value.length) {
    const { data } = await supabase.from('areas').select('id,name').order('name');
    allAreas.value = data || [];
  }
  // Usar teamMembers ya cargados
  allTeamMembers.value = teamMembers.value;
};

const submitScheduled = async () => {
  if (!newScheduled.value.title || !newScheduled.value.recurrence_type) return;
  if (newScheduled.value.target_type === 'area' && !newScheduled.value.target_area_id) {
    alert('Por favor selecciona un área.');
    return;
  }
  if (newScheduled.value.target_type === 'profile' && (!newScheduled.value.target_profile_ids || newScheduled.value.target_profile_ids.length === 0)) {
    alert('Por favor selecciona al menos una persona.');
    return;
  }
  if (newScheduled.value.recurrence_type === 'once' && !newScheduled.value.due_date) {
    alert('Por favor selecciona una fecha de entrega.');
    return;
  }
  if (!window.confirm('¿Estás seguro de que deseas crear esta orden programada?')) return;
  isSavingScheduled.value = true;
  try {
    const { data: session } = await supabase.auth.getSession();
    const payload = {
      title: newScheduled.value.title,
      description: newScheduled.value.description || null,
      recurrence_type: newScheduled.value.recurrence_type,
      recurrence_value: newScheduled.value.recurrence_type !== 'once' ? newScheduled.value.recurrence_value : null,
      due_date: newScheduled.value.recurrence_type === 'once' ? newScheduled.value.due_date : null,
      priority: newScheduled.value.priority,
      target_type: newScheduled.value.target_type,
      active: true,
      created_by: session.session.user.id
    };

    if (newScheduled.value.target_type === 'profile') {
      payload.target_profile_ids = newScheduled.value.target_profile_ids;
    }
    if (newScheduled.value.target_type === 'level') {
      payload.target_level = newScheduled.value.target_level;
    }
    if (newScheduled.value.target_type === 'area') {
      payload.target_area_id = newScheduled.value.target_area_id;
    }

    const { error } = await supabase.from('scheduled_deliveries').insert(payload);
    if (error) throw error;
    showScheduledModal.value = false;
    successToastMessage.value = '¡Orden programada creada con éxito!';
    showSuccessToast.value = true;
    setTimeout(() => { showSuccessToast.value = false; }, 3500);
  } catch (e) {
    console.error('Error creando orden programada:', e);
    if (e.message && (e.message.includes('target_area_id') || e.message.includes('target_type') || e.message.includes('schema cache'))) {
      alert('Error en base de datos: La tabla "scheduled_deliveries" necesita las columnas de destino. Por favor ejecuta el script SQL "database/fix_scheduled_deliveries_columns.sql" en el Supabase SQL Editor.');
    } else {
      alert('Error al guardar la orden programada: ' + (e.message || 'Error desconocido'));
    }
  } finally {
    isSavingScheduled.value = false;
  }
};
// ─────────────────────────────────────────────────────────────────────────


const calculateTimeDifferenceHours = (start, end) => {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffMs = d2 - d1;
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Hours
};

const filterTasksByPeriod = (tasks, periodStr) => {
  if (!tasks || tasks.length === 0) return [];
  const now = new Date();
  
  return tasks.filter(t => {
    const dueStr = t.due_date ? t.due_date.split('T')[0] : null;
    const createdStr = t.created_at ? t.created_at.split('T')[0] : null;
    const completedStr = t.completed_at ? t.completed_at.split('T')[0] : null;
    const todayStr = now.toISOString().split('T')[0];

    if (periodStr === 'Diario') {
      return dueStr === todayStr || completedStr === todayStr || createdStr === todayStr;
    }
    
    const refDate = new Date(t.due_date || t.completed_at || t.created_at);
    if (isNaN(refDate.getTime())) return true;
    
    let msLimit = 30 * 24 * 60 * 60 * 1000;
    if (periodStr === 'Semanal') msLimit = 7 * 24 * 60 * 60 * 1000;
    else if (periodStr === 'Mensual') msLimit = 30 * 24 * 60 * 60 * 1000;
    else if (periodStr === 'Trimestral') msLimit = 90 * 24 * 60 * 60 * 1000;
    else if (periodStr === 'Semestral') msLimit = 180 * 24 * 60 * 60 * 1000;
    else if (periodStr === 'Anual') msLimit = 365 * 24 * 60 * 60 * 1000;
    
    const diff = now.getTime() - refDate.getTime();
    return diff <= msLimit && diff >= -(7 * 24 * 60 * 60 * 1000);
  });
};

const fetchData = async () => {
  loading.value = true;
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    loading.value = false;
    return;
  }
  const userId = session.session.user.id;

  const { data: profile } = await supabase.from('profiles').select('*, roles(name, area_id, access_level)').eq('id', userId).single();
  currentUser.value = profile;
  
  // Fetch system alerts proactively generated by AI for leaders
  const { data: alertsData } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (alertsData) {
    systemAlerts.value = alertsData;
  }

  if (profile?.is_master_admin || profile?.roles?.access_level === 1) {
    isLeader.value = true;
    isMaster.value = profile?.is_master_admin;
  }

  if (isLeader.value) {
    let membersQuery = supabase
      .from('profiles')
      .select('id, full_name, roles!inner(id, name, area_id, access_level)')
      .neq('id', userId);

    if (!isMaster.value && profile?.roles?.area_id) {
      const { data: area } = await supabase.from('areas').select('*').eq('id', profile.roles.area_id).single();
      leaderArea.value = area;
      membersQuery = membersQuery.eq('roles.area_id', profile.roles.area_id);
    } else {
      leaderArea.value = { name: 'Global / Todas las áreas' };
    }

    const { data: members } = await membersQuery;

    if (members) {
      const now = new Date();
      
      const enrichedMembers = await Promise.all(members.map(async (m) => {
        const latestScore = await getLatestRoleKpiScore(m.roles.id);

        const { data: tasks } = await supabase.from('tasks')
          .select('id, title, status, created_at, started_at, completed_at, due_date')
          .eq('assigned_to', m.id);
          
        m.all_tasks = tasks || [];
        m.latest_score = latestScore || 0;
        
        return m;
      }));
      
      teamMembers.value = enrichedMembers;
      updateMetrics();
      
      if (teamMembers.value.length > 0) {
        selectedMember.value = teamMembers.value[0];
      }
    }
  }
  loading.value = false;
};

// Recompute task metrics based on selectedPeriod
const updateMetrics = () => {
  const now = new Date();
  
  teamMembers.value.forEach(m => {
    const periodTasks = filterTasksByPeriod(m.all_tasks, selectedPeriod.value);
    
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let totalHours = 0;
    let timedTasksCount = 0;
    
    periodTasks.forEach(t => {
      // Overdue logic: not completed AND due_date is in the past
      if (t.status !== 'completed' && t.due_date && new Date(t.due_date) < now) {
        overdue++;
      } else if (t.status === 'completed') {
        completed++;
        // Time tracking math
        if (t.started_at && t.completed_at) {
          totalHours += calculateTimeDifferenceHours(t.started_at, t.completed_at);
          timedTasksCount++;
        }
      } else {
        pending++;
      }
    });
    
    const total = pending + completed + overdue;
    m.pending_tasks_count = pending;
    m.completed_tasks_count = completed;
    m.overdue_tasks_count = overdue;
    m.total_tasks = total;
    
    m.completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    m.pending_rate = total > 0 ? Math.round((pending / total) * 100) : 0;
    m.overdue_rate = total > 0 ? Math.round((overdue / total) * 100) : 0;
    
    m.avg_time_hours = timedTasksCount > 0 ? (totalHours / timedTasksCount).toFixed(1) : 0;
  });
};

watch(selectedPeriod, () => {
  updateMetrics();
});

const filteredTeam = computed(() => {
  if (!searchQuery.value) return teamMembers.value;
  const lowerQ = searchQuery.value.toLowerCase();
  return teamMembers.value.filter(m => 
    m.full_name.toLowerCase().includes(lowerQ) || 
    (m.roles?.name && m.roles.name.toLowerCase().includes(lowerQ))
  );
});

const averageKpi = computed(() => {
  if (teamMembers.value.length === 0) return 0;
  const sum = teamMembers.value.reduce((acc, m) => acc + m.latest_score, 0);
  return Math.round(sum / teamMembers.value.length);
});

const totalOverdue = computed(() => {
  return teamMembers.value.reduce((acc, m) => acc + m.overdue_tasks_count, 0);
});

const averageTaskTimeHours = computed(() => {
  let totalH = 0;
  let count = 0;
  teamMembers.value.forEach(m => {
    if (m.avg_time_hours > 0) {
      totalH += parseFloat(m.avg_time_hours);
      count++;
    }
  });
  return count > 0 ? (totalH / count).toFixed(1) : 0;
});

const selectMember = (member) => {
  selectedMember.value = member;
};

const auditWorkspace = (employeeId) => {
  if (!employeeId) {
    alert('Por favor selecciona un colaborador para auditar su espacio.');
    return;
  }
  router.push(`/workspace?view_as=${employeeId}`);
};

const openTaskModal = (member = null) => {
  taskTargetMember.value = member;
  newTask.value = {
    title: '',
    description: '',
    deliverable: '',
    category: '',
    due_time: '',
    estimated_minutes: '',
    leader_note: '',
    priority: 'medium',
    task_type: 'once',
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: member ? member.id : '',
    assigned_to_list: member ? [member.id] : []
  };
  showTaskModal.value = true;
};

const closeTaskModal = () => {
  showTaskModal.value = false;
};

const submitTask = async () => {
  // Validar destinatarios
  const recipients = taskTargetMember.value
    ? [taskTargetMember.value.id]
    : (newTask.value.assigned_to_list || []);

  if (!recipients.length || !newTask.value.title || !newTask.value.due_date) {
    alert('Completa los campos requeridos: destinatario, título y fecha límite.');
    return;
  }
  
  if (!window.confirm('¿Estás seguro de que deseas asignar esta tarea?')) return;
  
  isSaving.value = true;

  try {
    const { data: session } = await supabase.auth.getSession();
    
    // Insertar una tarea por cada destinatario seleccionado
    const inserts = recipients.map(recipientId => ({
      title: newTask.value.title,
      description: newTask.value.description || null,
      deliverable: newTask.value.deliverable || null,
      category: newTask.value.category || null,
      due_time: newTask.value.due_time || null,
      estimated_minutes: newTask.value.estimated_minutes ? parseInt(newTask.value.estimated_minutes) : null,
      leader_note: newTask.value.leader_note || null,
      priority: newTask.value.priority,
      task_type: newTask.value.task_type,
      due_date: newTask.value.due_date,
      assigned_to: recipientId,
      assigned_by: session.session.user.id,
      status: 'pending'
    }));

    const { error } = await supabase.from('tasks').insert(inserts);
    if (error) throw error;
    
    closeTaskModal();
    successToastMessage.value = '¡Tarea asignada con éxito!';
    showSuccessToast.value = true;
    setTimeout(() => { showSuccessToast.value = false; }, 3000);
    await fetchData();
  } catch (error) {
    console.error('Error asignando tarea:', error);
    alert('Ocurrió un error al guardar la tarea.');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

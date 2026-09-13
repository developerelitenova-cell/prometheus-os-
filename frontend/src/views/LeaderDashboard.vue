<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased">
    <header class="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-lg shrink-0">
          <div class="flex items-center gap-space-sm cursor-pointer" @click="router.push('/')">
            <div class="h-14 w-auto flex-shrink-0">
              <img src="@/assets/elite-nova-logo.png" alt="Elite Nutrition Logo" class="h-full w-auto object-contain" />
            </div>
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm tracking-tight text-on-surface">Elite Nutrition</span>
              <span class="font-caption text-caption tracking-widest uppercase text-[#86868b] font-bold">Centro de Control</span>
            </div>
          </div>
          <nav class="hidden xl:flex items-center gap-space-lg">
            <router-link to="/" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Dashboard General</router-link>
            <router-link to="/team" class="text-primary font-semibold font-label-md text-label-md transition-colors border-b-2 border-primary-container pb-1">Liderazgo de Área</router-link>
            <router-link to="/mapa-cargos" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Equipos</router-link>
            <router-link to="/performance" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Reportes</router-link>
            <router-link to="/roles" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Gestión de Roles y Permisos</router-link>
          </nav>
        </div>
        <div class="flex items-center gap-space-md justify-end flex-1 max-w-md">
          <div class="relative w-full max-w-xs hidden sm:block">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-md">search</span>
            <input v-model="searchQuery" class="w-full pl-9 pr-space-md py-space-xs rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary-container transition-all" placeholder="Buscar colaboradores..." type="text"/>
          </div>
          <div class="flex items-center gap-space-sm pl-space-sm shrink-0">
            <div class="flex flex-col text-right hidden lg:flex">
              <span class="font-label-md text-label-md text-on-surface leading-tight">{{ currentUser?.full_name || 'Cargando...' }}</span>
              <span class="font-caption text-caption text-primary leading-tight font-medium">{{ currentUser?.is_master_admin ? 'Master Admin / Holding' : (currentUser?.roles?.name || 'Líder de Área') }}</span>
            </div>
            <button @click="router.push('/workspace')" class="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold hover:brightness-110 shadow-sm transition-all" title="Ir a Mi Espacio">
              {{ currentUser?.full_name ? currentUser.full_name.charAt(0) : 'E' }}
            </button>
            <button @click="handleSignOut" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-danger hover:bg-error-container/30 transition-all ml-1" title="Cerrar Sesión">
              <span class="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="w-full pt-20 bg-surface min-h-screen">
      <div v-if="!isLeader && !loading" class="flex flex-col items-center justify-center pt-24">
        <span class="material-symbols-outlined text-6xl text-danger mb-4">block</span>
        <h2 class="text-2xl font-bold">Acceso Restringido</h2>
        <p class="text-secondary mt-2">Este módulo es exclusivo para líderes de área.</p>
        <button @click="router.push('/')" class="mt-6 px-6 py-2 bg-primary text-white rounded-lg">Volver al Inicio</button>
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
                <button @click="router.push('/workspace')" class="group inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-outline-variant text-on-surface font-label-md text-label-md transition-all duration-200 shadow-sm" type="button">
                  <span class="material-symbols-outlined text-primary text-[18px] transition-transform group-hover:scale-110">monitoring</span>
                  <span>Ver Mis KPIs</span>
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
                
                <div class="flex items-center gap-space-lg text-right">
                  <div class="hidden sm:flex flex-col text-left w-24">
                    <span class="font-caption text-caption text-secondary">Estado ({{ selectedPeriod }})</span>
                    <span class="font-label-sm text-label-sm" :class="member.overdue_tasks_count > 0 ? 'text-danger font-semibold' : 'text-success'">
                      {{ member.pending_tasks_count }} Pend.
                    </span>
                  </div>
                  <div class="w-16 flex justify-end">
                    <span class="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[#e8f5e9] text-[#2e7d32] font-label-sm text-label-sm font-semibold border border-[#c8e6c9]">
                      {{ member.latest_score }}%
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
                  </div>
                  
                  <div class="grid grid-cols-2 gap-space-sm">
                    <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                      <span class="font-caption text-caption text-secondary block">Eficiencia</span>
                      <span class="font-headline-sm text-headline-sm font-semibold text-[#2e7d32]">{{ selectedMember.completion_rate }}%</span>
                    </div>
                    <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                      <span class="font-caption text-caption text-secondary block">T. Promedio</span>
                      <span class="font-headline-sm text-headline-sm font-semibold text-on-surface">{{ selectedMember.avg_time_hours }}h</span>
                    </div>
                  </div>
                  
                  <!-- Task Breakdown -->
                  <div class="bg-surface-container-low rounded-xl p-space-sm border border-surface-container mt-1">
                    <div class="flex items-center justify-between font-caption text-caption mb-1.5">
                      <span class="text-secondary">Desglose de Tareas</span>
                      <span class="font-semibold">{{ selectedMember.total_tasks }} Totales</span>
                    </div>
                    <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden flex mb-2">
                      <div class="h-full bg-emerald-500" :style="`width: ${selectedMember.completion_rate}%;`"></div>
                      <div class="h-full bg-amber-400" :style="`width: ${selectedMember.pending_rate}%;`"></div>
                      <div class="h-full bg-danger" :style="`width: ${selectedMember.overdue_rate}%;`"></div>
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
                  <button @click="openTaskModal(selectedMember)" class="w-full py-2.5 px-space-md rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md inline-flex items-center justify-center gap-2 shadow-sm transition-all">
                    <span class="material-symbols-outlined text-[18px]">assignment_add</span>
                    <span>Asignar Tarea Específica</span>
                  </button>
                  <button @click="auditWorkspace(selectedMember.id)" class="w-full py-2.5 px-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high text-on-surface font-label-md text-label-md text-center transition-all inline-flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">find_in_page</span>
                    <span>Auditar Espacio</span>
                  </button>
                  <div v-if="currentUser?.is_master_admin" class="flex gap-2 w-full pt-1">
                    <button @click="editProfileName(selectedMember)" class="flex-1 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant text-label-sm font-semibold transition-all flex items-center justify-center gap-1" title="Editar Nombre del Empleado">
                      <span class="material-symbols-outlined text-[16px]">edit</span> Editar Perfil
                    </button>
                    <button @click="manageLegal(selectedMember)" class="flex-1 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant text-label-sm font-semibold transition-all flex items-center justify-center gap-1" title="Gestionar Firmas y Contratos">
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

    <!-- Modal Asignar Tarea -->
    <div v-if="showTaskModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h2 class="text-2xl font-bold text-on-surface mb-1">Asignar Tarea</h2>
        <p class="text-secondary text-sm mb-6" v-if="taskTargetMember">Para: {{ taskTargetMember.full_name }}</p>
        <p class="text-secondary text-sm mb-6" v-else>Asignar tarea general</p>

        <form @submit.prevent="submitTask" class="space-y-4">
          <div v-if="!taskTargetMember" class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Colaborador <span class="text-danger">*</span></label>
            <select v-model="newTask.assigned_to" required class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option disabled value="">Seleccionar miembro...</option>
              <option v-for="m in teamMembers" :key="m.id" :value="m.id">{{ m.full_name }}</option>
            </select>
          </div>
          
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Título de la Tarea <span class="text-danger">*</span></label>
            <input v-model="newTask.title" required type="text" placeholder="Ej: Revisión de inventario trimestral" class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Descripción</label>
            <textarea v-model="newTask.description" rows="2" placeholder="Detalles de la asignación..." class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Frecuencia / Tipo <span class="text-danger">*</span></label>
              <select v-model="newTask.task_type" required class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Prioridad</label>
              <select v-model="newTask.priority" class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
            
          <div class="flex flex-col gap-1 mt-4">
            <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Fecha Límite (Due Date) <span class="text-danger">*</span></label>
            <input v-model="newTask.due_date" required type="date" class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-surface-container">
            <button type="button" @click="closeTaskModal" class="px-6 py-2.5 rounded-xl font-semibold text-secondary hover:bg-surface-container-low transition-colors">Cancelar</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white hover:brightness-105 shadow-md transition-all flex items-center gap-2">
              <span v-if="isSaving" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              <span>{{ isSaving ? 'Guardando...' : 'Asignar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Toast Notification -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform translate-y-2 opacity-0">
      <div v-if="showSuccessToast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#2e7d32] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-label-md text-label-md">
        <span class="material-symbols-outlined">check_circle</span>
        <span>¡Tarea asignada con éxito!</span>
      </div>
    </transition>

    <!-- Modals for Legal and Profile Edit -->
    <div v-if="showEditNameModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <h3 class="text-xl font-bold text-on-surface mb-4">Editar Nombre de Empleado</h3>
        <input type="text" v-model="editNameInput" class="w-full bg-surface-container-low border border-surface-container rounded-xl p-3 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container mb-4" />
        <div class="flex gap-3">
          <button @click="showEditNameModal = false" class="flex-1 py-2 rounded-xl border border-surface-container text-on-surface-variant font-semibold">Cancelar</button>
          <button @click="saveProfileName" class="flex-1 py-2 rounded-xl bg-primary text-white font-semibold shadow-md">Guardar</button>
        </div>
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
import { signOut } from '@/api/auth';

const router = useRouter();

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

const showEditNameModal = ref(false);
const editNameInput = ref('');
const currentEditingMember = ref(null);

const showLegalModal = ref(false);

const editProfileName = (member) => {
  currentEditingMember.value = member;
  editNameInput.value = member.full_name;
  showEditNameModal.value = true;
};

const saveProfileName = async () => {
  if (currentEditingMember.value && editNameInput.value) {
    currentEditingMember.value.full_name = editNameInput.value;
    // Logic to save to Supabase would go here
    showEditNameModal.value = false;
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
const newTask = ref({
  title: '',
  description: '',
  priority: 'medium',
  task_type: 'daily',
  due_date: '',
  assigned_to: ''
});

const calculateTimeDifferenceHours = (start, end) => {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffMs = d2 - d1;
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Hours
};

const filterTasksByPeriod = (tasks, periodStr) => {
  if (!tasks) return [];
  const now = new Date();
  let msLimit = 0;
  
  if (periodStr === 'Diario') msLimit = 24 * 60 * 60 * 1000;
  else if (periodStr === 'Semanal') msLimit = 7 * 24 * 60 * 60 * 1000;
  else if (periodStr === 'Mensual') msLimit = 30 * 24 * 60 * 60 * 1000;
  else if (periodStr === 'Trimestral') msLimit = 90 * 24 * 60 * 60 * 1000;
  else if (periodStr === 'Semestral') msLimit = 180 * 24 * 60 * 60 * 1000;
  else if (periodStr === 'Anual') msLimit = 365 * 24 * 60 * 60 * 1000;
  
  return tasks.filter(t => {
    const taskDate = new Date(t.created_at || t.due_date);
    return (now - taskDate) <= msLimit;
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
  router.push(`/workspace?view_as=${employeeId}`);
};

const openTaskModal = (member = null) => {
  taskTargetMember.value = member;
  newTask.value = {
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'daily',
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: member ? member.id : ''
  };
  showTaskModal.value = true;
};

const closeTaskModal = () => {
  showTaskModal.value = false;
};

const submitTask = async () => {
  if (!newTask.value.assigned_to || !newTask.value.title || !newTask.value.due_date) return;
  isSaving.value = true;

  try {
    const { data: session } = await supabase.auth.getSession();
    
    const payload = {
      title: newTask.value.title,
      description: newTask.value.description,
      priority: newTask.value.priority,
      task_type: newTask.value.task_type,
      due_date: newTask.value.due_date,
      assigned_to: newTask.value.assigned_to,
      assigned_by: session.session.user.id,
      status: 'pending'
    };

    await supabase.from('tasks').insert(payload);
    
    closeTaskModal();
    showSuccessToast.value = true;
    setTimeout(() => { showSuccessToast.value = false; }, 3000);
    await fetchData(); // Refresh all data to compute new metrics
  } catch (error) {
    console.error("Error asignando tarea:", error);
    alert("Ocurrió un error al guardar la tarea.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

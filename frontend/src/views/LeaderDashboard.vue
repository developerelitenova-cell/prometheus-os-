<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased">
    <header class="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-lg shrink-0">
          <div class="flex items-center gap-space-sm cursor-pointer" @click="router.push('/')">
            <div class="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-headline-sm">diamond</span>
            </div>
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm tracking-tight text-on-surface">ELITE NOVA</span>
              <span class="font-caption text-caption tracking-widest uppercase text-on-surface-variant">Nutrition Group</span>
            </div>
          </div>
          <nav class="hidden xl:flex items-center gap-space-lg">
            <router-link to="/" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Dashboard General</router-link>
            <router-link to="/leader" class="text-primary font-semibold font-label-md text-label-md transition-colors border-b-2 border-primary-container pb-1">Liderazgo de Área</router-link>
            <router-link to="/teams" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Equipos</router-link>
            <router-link to="/reports" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Reportes</router-link>
            <router-link to="/governance" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Gobernanza</router-link>
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
              <span class="font-caption text-caption text-primary leading-tight font-medium">{{ currentUser?.roles?.name || 'Líder de Área' }}</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
              {{ currentUser?.full_name ? currentUser.full_name.charAt(0) : 'E' }}
            </div>
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
          
          <!-- Hero / Leadership Header Module -->
          <div class="relative bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-space-lg md:p-space-xl mb-space-xl overflow-hidden">
            <div class="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-bl from-primary-container/10 via-primary-fixed/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg relative z-10">
              <div class="flex flex-col max-w-2xl">
                <div class="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container w-fit mb-space-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  <span class="font-caption text-caption tracking-wider text-on-surface-variant uppercase font-semibold">Dirección • {{ leaderArea?.name || 'Área' }}</span>
                </div>
                <h1 class="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Panel de Liderazgo</h1>
                <p class="font-body-md text-body-md text-secondary mt-1">Supervisión operativa y rendimiento de equipo consolidado.</p>
              </div>
              
              <div class="flex items-center gap-space-sm self-start lg:self-center shrink-0">
                <button class="group inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all duration-200 shadow-sm" type="button">
                  <span class="material-symbols-outlined text-primary text-[18px] transition-transform group-hover:scale-110">monitoring</span>
                  <span>Ver Mis KPIs</span>
                </button>
                <button @click="openTaskModal(null)" class="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md transition-all duration-200 shadow-[0_2px_10px_rgba(176,141,87,0.25)] active:scale-[0.98]">
                  <span class="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Asignar Tarea</span>
                </button>
              </div>
            </div>

            <!-- Quick Executive Summary Ribbon -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-md mt-space-lg pt-space-md border-t border-surface-container-high/60">
              <div class="flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low/50">
                <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                  <span class="material-symbols-outlined">group</span>
                </div>
                <div>
                  <span class="font-caption text-caption text-secondary uppercase tracking-wider block">Fuerza Operativa</span>
                  <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">{{ teamMembers.length }} Colaboradores</span>
                </div>
              </div>
              <div class="flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low/50">
                <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                  <span class="material-symbols-outlined">pie_chart</span>
                </div>
                <div>
                  <span class="font-caption text-caption text-secondary uppercase tracking-wider block">KPI Promedio del Equipo</span>
                  <div class="flex items-center gap-2">
                    <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">{{ averageKpi }}%</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low/50">
                <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                  <span class="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <span class="font-caption text-caption text-secondary uppercase tracking-wider block">Tiempo Promedio (Tareas)</span>
                  <div class="flex items-center gap-2">
                    <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">{{ averageTaskTimeHours }}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Bar: Title & Search/Filter Strip -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
            <div class="flex items-center gap-space-sm">
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">Mi Equipo</h2>
              <span class="font-label-md text-label-md px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">(Área: {{ leaderArea?.name }})</span>
            </div>
            
            <!-- Controls Group -->
            <div class="flex flex-wrap items-center gap-space-sm">
              <!-- Filtro de Tiempo -->
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
            
            <!-- Left Master List (65% width / 8 cols) -->
            <div class="lg:col-span-8 flex flex-col gap-space-md">
              <div v-if="loading" class="text-center py-10 text-secondary">Cargando equipo...</div>
              <div v-else-if="filteredTeam.length === 0" class="text-center py-10 text-secondary">No hay colaboradores que coincidan con la búsqueda.</div>
              
              <div v-for="member in filteredTeam" :key="member.id" 
                   @click="selectMember(member)"
                   :class="['bg-surface-container-lowest rounded-2xl p-space-md border transition-all duration-200 group cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)]', 
                            selectedMember?.id === member.id ? 'border-primary-container shadow-[0_4px_20px_rgba(0,0,0,0.04)] ring-1 ring-primary-container' : 'border-surface-container-high hover:border-outline-variant hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]']">
                
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div class="flex items-center gap-3">
                    <div class="relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-surface-container-high text-primary font-bold text-xl shadow-sm ring-2 ring-primary/10">
                      {{ member.full_name.charAt(0) }}
                      <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold truncate leading-tight group-hover:text-primary transition-colors">{{ member.full_name }}</h3>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] font-label-sm text-label-sm font-semibold">
                          <span class="material-symbols-outlined text-[12px]">trending_up</span>
                          {{ member.latest_score }}%
                        </span>
                      </div>
                      <span class="font-caption text-caption text-secondary block mt-0.5">{{ member.roles?.name || 'Sin cargo' }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-space-md sm:justify-end text-right">
                    <div class="flex flex-col">
                      <span class="font-caption text-caption text-secondary">T. Promedio</span>
                      <span class="font-label-md text-label-md font-semibold text-on-surface">{{ member.avg_time_hours }}h</span>
                    </div>
                    <div class="h-8 w-px bg-surface-container-high hidden sm:block"></div>
                    <div class="flex flex-col">
                      <span class="font-caption text-caption text-secondary">Atrasadas</span>
                      <span :class="['font-label-md text-label-md font-semibold', member.overdue_tasks_count > 0 ? 'text-danger' : 'text-success']">
                        {{ member.overdue_tasks_count }} Tareas
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Operational progress and action bar -->
                <div class="mt-space-md pt-space-sm border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div class="flex-1 max-w-sm">
                    <div class="flex items-center justify-between font-caption text-caption mb-1">
                      <span class="text-secondary font-medium">Progreso de Tareas (Periodo: {{ selectedPeriod }})</span>
                      <span class="text-on-surface font-semibold">
                        Pendientes: <span class="text-amber-700 font-bold">{{ member.pending_tasks_count }}</span> • 
                        Completadas: {{ member.completed_tasks_count }}
                      </span>
                    </div>
                    <div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex">
                      <div class="h-full bg-emerald-500" :style="`width: ${member.completion_rate}%;`"></div>
                      <div class="h-full bg-amber-400" :style="`width: ${member.pending_rate}%;`"></div>
                      <div class="h-full bg-danger" :style="`width: ${member.overdue_rate}%;`"></div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button @click.stop="auditWorkspace(member.id)" class="py-1.5 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all duration-200">Auditar</button>
                    <button @click.stop="openTaskModal(member)" class="py-1.5 px-space-md rounded-lg bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md inline-flex items-center gap-1 shadow-sm transition-all duration-200">
                      <span class="material-symbols-outlined text-[14px]">add</span>
                      <span>Asignar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Rail Inspector (35% width / 4 cols) -->
            <div class="lg:col-span-4 flex flex-col gap-space-md sticky top-24">
              
              <!-- Selected Executive Dossier Inspector Card -->
              <div v-if="selectedMember" class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-container-high relative overflow-hidden">
                <div class="flex items-center justify-between pb-3 border-b border-surface-container mb-space-md">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary"></span>
                    <span class="font-caption text-caption uppercase tracking-wider text-secondary font-semibold">Expediente Seleccionado</span>
                  </div>
                  <span class="font-caption text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{{ selectedPeriod }}</span>
                </div>
                
                <div class="flex items-center gap-3 mb-space-md">
                  <div class="w-14 h-14 rounded-xl bg-surface-container-high text-primary flex items-center justify-center font-bold text-2xl shadow-sm ring-2 ring-primary-container/30">
                    {{ selectedMember.full_name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="font-headline-sm text-headline-sm font-semibold text-on-surface leading-snug">{{ selectedMember.full_name }}</h4>
                    <span class="font-caption text-caption text-secondary">{{ selectedMember.roles?.name }}</span>
                    <div class="mt-1 flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] font-label-sm text-label-sm font-semibold">KPI: {{ selectedMember.latest_score }}%</span>
                    </div>
                  </div>
                </div>
                
                <div class="space-y-2.5 p-space-sm rounded-xl bg-surface-container-low/60 mb-space-md">
                  <div class="flex items-center justify-between font-caption text-caption">
                    <span class="text-secondary">Tiempo Prom. Ejecución</span>
                    <span class="font-label-md text-label-md font-semibold text-primary">{{ selectedMember.avg_time_hours }} Horas</span>
                  </div>
                  <div class="flex items-center justify-between font-caption text-caption">
                    <span class="text-secondary">Estado de Tareas</span>
                    <span class="font-label-md text-label-md font-semibold text-on-surface">
                      Completadas: <span class="text-success">{{ selectedMember.completed_tasks_count }}</span> • 
                      Vencidas: <span class="text-danger">{{ selectedMember.overdue_tasks_count }}</span>
                    </span>
                  </div>
                  <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden flex">
                    <div class="h-full bg-emerald-500" :style="`width: ${selectedMember.completion_rate}%;`"></div>
                    <div class="h-full bg-amber-400" :style="`width: ${selectedMember.pending_rate}%;`"></div>
                    <div class="h-full bg-danger" :style="`width: ${selectedMember.overdue_rate}%;`"></div>
                  </div>
                  <span class="font-caption text-caption text-secondary block text-right">{{ selectedMember.completion_rate }}% efectividad</span>
                </div>
                
                <div class="flex flex-col gap-2 pt-space-xs">
                  <button @click="openTaskModal(selectedMember)" class="w-full py-2.5 px-space-md rounded-xl bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white font-label-md text-label-md inline-flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(176,141,87,0.25)] transition-all">
                    <span class="material-symbols-outlined text-[16px]">add_task</span>
                    <span>Asignar Tarea</span>
                  </button>
                  <button @click="auditWorkspace(selectedMember.id)" class="w-full py-2.5 px-space-md rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md text-center transition-all">
                    Auditar Espacio
                  </button>
                </div>
              </div>

              <!-- Tactical Leadership Summary Card -->
              <div class="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-surface-container-high">
                <div class="flex items-center justify-between mb-space-sm">
                  <span class="font-caption text-caption uppercase tracking-wider text-secondary font-semibold">Resumen del Periodo</span>
                  <span class="material-symbols-outlined text-primary text-body-md">analytics</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <div class="p-2.5 rounded-xl bg-surface-container-low/50">
                    <span class="font-headline-sm text-headline-sm font-semibold text-danger block">{{ totalOverdue }}</span>
                    <span class="font-caption text-caption text-secondary">Tareas Vencidas</span>
                  </div>
                  <div class="p-2.5 rounded-xl bg-surface-container-low/50">
                    <span class="font-headline-sm text-headline-sm font-semibold text-[#2e7d32] block">{{ averageKpi }}%</span>
                    <span class="font-caption text-caption text-secondary">KPI Equipo</span>
                  </div>
                </div>
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
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Prioridad</label>
              <select v-model="newTask.priority" class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-secondary uppercase tracking-wide">Fecha Límite (Due Date) <span class="text-danger">*</span></label>
              <input v-model="newTask.due_date" required type="date" class="px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
            </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/api/supabase';
import { useRouter } from 'vue-router';
import { getLatestRoleKpiScore } from '@/api/kpi';

const router = useRouter();

const currentUser = ref(null);
const isLeader = ref(false);
const isMaster = ref(false);
const leaderArea = ref(null);
const teamMembers = ref([]);
const loading = ref(true);

const searchQuery = ref('');
const selectedPeriod = ref('Mensual'); // Default
const selectedMember = ref(null);

// Modal state
const showTaskModal = ref(false);
const taskTargetMember = ref(null);
const isSaving = ref(false);
const newTask = ref({
  title: '',
  description: '',
  priority: 'medium',
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
      due_date: newTask.value.due_date,
      assigned_to: newTask.value.assigned_to,
      assigned_by: session.session.user.id,
      status: 'pending'
    };

    await supabase.from('tasks').insert(payload);
    
    closeTaskModal();
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

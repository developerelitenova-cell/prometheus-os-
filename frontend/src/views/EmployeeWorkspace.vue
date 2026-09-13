
<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col">
    <!-- Navbar / Header -->
    <header class="sticky top-0 z-50 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-[#e5e5ea] px-6 py-4">
      <div class="max-w-[1600px] mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 flex items-center justify-center">
            <img src="@/assets/elite-nova-logo.png" alt="Elite Nutrition Logo" class="w-full h-full object-contain" />
          </div>
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-[#1d1d1f] leading-tight">Elite Nutrition</h1>
            <p class="text-sm text-[#86868b] font-medium leading-none mt-1">PROMETHEUS OS</p>
          </div>
          <div v-if="isAuditMode" class="ml-4 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200 flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">visibility</span>
            MODO AUDITORÍA
            <button @click="exitAuditMode" class="ml-2 underline hover:text-red-900 cursor-pointer">Salir</button>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 bg-white border border-[#e5e5ea] rounded-full px-4 py-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-[#34c759] shadow-[0_0_8px_rgba(52,199,89,0.4)]"></span>
            <span class="text-[13px] font-medium text-[#1d1d1f]">Sistema Activo</span>
          </div>
          
          <button @click="router.push('/')" class="p-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors rounded-full hover:bg-[#e5e5ea]/50">
            <span class="material-symbols-outlined">home</span>
          </button>
          <button @click="handleSignOut" class="p-2 text-[#86868b] hover:text-[#ff3b30] transition-colors rounded-full hover:bg-[#ffebee]">
            <span class="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Grid -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- LEFT COLUMN (3 cols): Perfil, KPI, Academia, Docs -->
        <div class="lg:col-span-3 space-y-6">
          
          <!-- Perfil -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-[#b08d57]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white text-xl font-medium shadow-md">
                {{ getInitials(currentProfile?.full_name) }}
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

        <!-- CENTER COLUMN (6 cols): Tareas y Alertas -->
        <div class="lg:col-span-6 space-y-6">
          
          <!-- Alertas de Productividad (IA) -->
          <div v-if="overdueTasks.length > 0" class="bg-[#ffebee] border border-[#ffcdd2] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <span class="material-symbols-outlined text-[#c62828] mt-0.5">warning</span>
            <div>
              <h4 class="text-[#c62828] font-bold text-[14px]">Alerta de Seguimiento (IA)</h4>
              <p class="text-[#b71c1c] text-[13px] mt-1 leading-snug">
                Tienes {{ overdueTasks.length }} tareas atrasadas del día anterior sin resolver. Esto impacta negativamente tu KPI de productividad. Ciérralas lo antes posible.
              </p>
            </div>
          </div>

          <!-- Tareas Atrasadas -->
          <div v-if="overdueTasks.length > 0" class="bg-white rounded-2xl border border-[#ffcdd2] shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-[#ffebee] bg-[#fff5f5]">
              <h3 class="text-[16px] font-semibold text-[#c62828] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">history</span>
                Pendientes Atrasados
              </h3>
            </div>
            <ul class="divide-y divide-[#e5e5ea]">
              <li v-for="task in overdueTasks" :key="task.id" class="p-4 hover:bg-[#f5f5f7]/50 transition-colors flex items-start gap-4">
                <input type="checkbox" @click="toggleTaskStatus(task)" class="w-5 h-5 mt-0.5 rounded-md border-[#d1d1d6] text-[#c62828] focus:ring-[#c62828] cursor-pointer" />
                <div class="flex-1 min-w-0">
                  <h4 class="text-[14px] font-medium text-[#1d1d1f] line-clamp-1">{{ task.title }}</h4>
                  <p class="text-[13px] text-[#86868b] mt-1 line-clamp-2">{{ task.description }}</p>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="px-2 py-0.5 rounded-md bg-[#ffebee] text-[#c62828] text-[11px] font-bold tracking-wide">
                      Venció: {{ new Date(task.due_date).toLocaleDateString() }}
                    </span>
                    <span class="text-[11px] text-[#86868b] flex items-center gap-1 font-medium">
                      <span class="material-symbols-outlined text-[14px]">timer</span>
                      Tiempo prom: 45 min
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Programados del Gerente -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-[#e5e5ea] flex justify-between items-center">
              <h3 class="text-[16px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#b08d57]">event_note</span>
                Programados del Día
              </h3>
              <span class="text-[12px] font-medium text-[#86868b] bg-[#f5f5f7] px-2 py-1 rounded-md">Asignados por Liderazgo</span>
            </div>
            <ul class="divide-y divide-[#e5e5ea]">
              <li v-for="task in scheduledTasks" :key="task.id" class="p-4 hover:bg-[#f5f5f7]/50 transition-colors flex items-start gap-4">
                <input type="checkbox" @click="toggleTaskStatus(task)" :checked="task.status === 'completed'" class="w-5 h-5 mt-0.5 rounded-md border-[#d1d1d6] text-[#b08d57] focus:ring-[#b08d57] cursor-pointer" />
                <div class="flex-1 min-w-0">
                  <h4 :class="['text-[14px] font-medium line-clamp-1', task.status === 'completed' ? 'text-[#86868b] line-through' : 'text-[#1d1d1f]']">{{ task.title }}</h4>
                  <p class="text-[13px] text-[#86868b] mt-1 line-clamp-2">{{ task.description }}</p>
                  <div class="flex items-center gap-3 mt-2">
                    <span v-if="task.priority === 'high'" class="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-bold tracking-wide">
                      Alta Prioridad
                    </span>
                    <span class="text-[11px] text-[#86868b] flex items-center gap-1 font-medium">
                      <span class="material-symbols-outlined text-[14px]">timer</span>
                      Tiempo prom: 30 min
                    </span>
                  </div>
                </div>
              </li>
              <li v-if="!scheduledTasks.length" class="p-6 text-center text-[13px] text-[#86868b]">No hay tareas programadas para hoy.</li>
            </ul>
          </div>

          <!-- Gestión Diaria -->
          <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-[#e5e5ea]">
              <h3 class="text-[16px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#34c759]">checklist</span>
                Gestiones Diarias
              </h3>
            </div>
            <ul class="divide-y divide-[#e5e5ea]">
              <li v-for="task in activeDailyTasks" :key="task.id" class="p-4 hover:bg-[#f5f5f7]/50 transition-colors flex items-start gap-4">
                <input type="checkbox" @click="toggleDmTaskStatus(task)" :checked="task.status === 'completed'" class="w-5 h-5 mt-0.5 rounded-md border-[#d1d1d6] text-[#34c759] focus:ring-[#34c759] cursor-pointer" />
                <div class="flex-1 min-w-0">
                  <h4 :class="['text-[14px] font-medium line-clamp-1', task.status === 'completed' ? 'text-[#86868b] line-through' : 'text-[#1d1d1f]']">{{ task.title }}</h4>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="text-[11px] text-[#86868b] flex items-center gap-1 font-medium bg-[#f5f5f7] px-2 py-0.5 rounded-md">
                      <span class="material-symbols-outlined text-[14px]">autorenew</span>
                      Recurrente
                    </span>
                    <span class="text-[11px] text-[#86868b] flex items-center gap-1 font-medium">
                      <span class="material-symbols-outlined text-[14px]">timer</span>
                      Tiempo prom: 15 min
                    </span>
                  </div>
                </div>
              </li>
              <li v-if="!dailyTasks.length" class="p-6 text-center text-[13px] text-[#86868b]">No hay gestiones diarias.</li>
            </ul>
          </div>
        </div>

        <!-- RIGHT COLUMN (3 cols): Agente Prometheus (Chat) -->
        <div class="lg:col-span-3 h-[calc(100vh-120px)] sticky top-[90px] flex flex-col bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#e5e5ea] bg-[#f5f5f7]/50 flex justify-between items-center">
            <div>
              <h3 class="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#b08d57]">smart_toy</span>
                Agente Prometheus
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
              Hola, soy la IA de Prometheus. ¿En qué te puedo asistir hoy?
            </div>
            
            <div v-for="(msg, index) in messages" :key="index" 
                 :class="['flex gap-3 max-w-[90%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '']">
              
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm', 
                            msg.sender === 'user' ? 'bg-[#1d1d1f] text-white' : 'bg-gradient-to-br from-[#b08d57] to-[#80663f] text-white']">
                {{ msg.sender === 'user' ? getInitials(currentProfile?.full_name) : 'AI' }}
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile as authProfile, loadCurrentProfile, signOut } from '../api/auth';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getPeriodKey } from '../utils/taskPeriods';
import { getRoleKpiDetail } from '../api/kpi';

// --- Inyección del Motor Matemático de Tiempo ---
const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const all = [...(dailyTasks.value||[]), ...(weeklyTasks.value||[]), ...(monthlyTasks.value||[])];
  return all.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < today);
});

const scheduledTasks = computed(() => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const all = [...(dailyTasks.value||[]), ...(weeklyTasks.value||[]), ...(monthlyTasks.value||[])];
  return all.filter(t => t.status !== 'completed' && (!t.due_date || new Date(t.due_date) >= today));
});

const activeDailyTasks = computed(() => {
  return [...(dmDailyTasks.value||[]), ...(dmWeeklyTasks.value||[]), ...(dmMonthlyTasks.value||[])];
});

const kpiPercentage = computed(() => {
  // Motor Matemático de Tiempos
  // Asignamos pesos en minutos:
  // Tarea de cronograma (scheduled/overdue) = 30 min
  // Gestión diaria (activeDailyTasks) = 15 min
  
  const allSched = [...(dailyTasks.value||[]), ...(weeklyTasks.value||[]), ...(monthlyTasks.value||[])];
  const allDaily = [...(dmDailyTasks.value||[]), ...(dmWeeklyTasks.value||[]), ...(dmMonthlyTasks.value||[])];
  
  const totalAllocatedTime = (allSched.length * 30) + (allDaily.length * 15);
  
  if (totalAllocatedTime === 0) return 100; // Día perfecto si no hay asignaciones
  
  const completedSched = allSched.filter(t => t.status === 'completed').length;
  const completedDaily = allDaily.filter(t => t.status === 'completed').length;
  
  const totalCompletedTime = (completedSched * 30) + (completedDaily * 15);
  
  return Math.round((totalCompletedTime / totalAllocatedTime) * 100);
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

// Cronograma Programacional (tareas asignadas por el líder, tabla `tasks`)
const dailyTasks = ref([]);
const weeklyTasks = ref([]);
const monthlyTasks = ref([]);

// Gestión Diaria (memoria del cargo, role_task_templates + task_completions)
const dmDailyTasks = ref([]);
const dmWeeklyTasks = ref([]);
const dmMonthlyTasks = ref([]);

// Plantillas
const templates = ref([]);

// Chat
const messages = ref([]);
const newMessage = ref('');
const isTyping = ref(false);
const chatContainer = ref(null);

onMounted(async () => {
  loadDismissed();
  await initWorkspace();
});

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

// --- Notificaciones ---

const DISMISSED_MESSAGES_KEY = 'prometheus_os_dismissed_messages';
const HIDDEN_MESSAGES_KEY = 'prometheus_os_hidden_messages';

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

const initWorkspace = async () => {
  loadingProfile.value = true;
  try {
    if (!authProfile.value) {
      await loadCurrentProfile();
    }
    
    // Lógica de Modo Auditoría (Impersonation)
    if (authProfile.value?.is_master_admin && route.query.view_as) {
      const { data: auditProfile } = await supabase
        .from('profiles')
        .select('*, roles(id, name, area_id, access_level)')
        .eq('id', route.query.view_as)
        .single();
        
      if (auditProfile) {
        currentProfile.value = auditProfile;
        isAuditMode.value = true;
      } else {
        currentProfile.value = authProfile.value;
      }
    } else {
      currentProfile.value = authProfile.value;
    }

    currentRole.value = currentProfile.value?.roles || null;

    if (!currentProfile.value) return;

    if (currentRole.value) {
      await fetchRoleData(currentRole.value.id);
      await fetchDailyManagement(currentRole.value.id, currentProfile.value.id);
      if (isManagerRole.value) {
        await fetchKpiDetail(currentRole.value.id);
      }
    }
    await fetchChecklists(currentProfile.value.id);
    await fetchNotifications(currentProfile.value.id, currentRole.value);
  } finally {
    loadingProfile.value = false;
  }
};

// Cronograma Programacional: tareas puntuales que el líder asignó a esta
// persona (tabla `tasks`).
const fetchChecklists = async (profileId) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profileId);

    if (error) throw error;

    if (tasks) {
      dailyTasks.value = tasks.filter(t => t.task_type === 'daily');
      weeklyTasks.value = tasks.filter(t => t.task_type === 'weekly');
      monthlyTasks.value = tasks.filter(t => t.task_type === 'monthly');
    }
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }
};

const toggleTaskStatus = async (task) => {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  const oldStatus = task.status;
  task.status = newStatus; // Optimistic update

  try {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  } catch (e) {
    task.status = oldStatus; // Revert on fail
    console.error(e);
  }
};

// Gestión Diaria: actividades recurrentes y estándar del cargo. Viven en la
// memoria del cargo (role_task_templates) y el marcado de cada persona se
// guarda en task_completions con la llave del período actual (día/semana/mes),
// así la casilla vuelve a verse vacía en el siguiente período sin perder el
// historial de cumplimiento.
const fetchDailyManagement = async (roleId, profileId) => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('role_task_templates')
      .select('*')
      .eq('role_id', roleId)
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (templatesError) throw templatesError;

    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_template_id, period_key')
      .eq('profile_id', profileId);
    if (completionsError) throw completionsError;

    const completedKeys = new Set((completions || []).map(c => `${c.task_template_id}::${c.period_key}`));

    const withStatus = (frequency) =>
      (templates || [])
        .filter(t => t.frequency === frequency)
        .map(t => ({
          ...t,
          periodKey: getPeriodKey(frequency),
          completed: completedKeys.has(`${t.id}::${getPeriodKey(frequency)}`)
        }));

    dmDailyTasks.value = withStatus('daily');
    dmWeeklyTasks.value = withStatus('weekly');
    dmMonthlyTasks.value = withStatus('monthly');
  } catch (e) {
    console.error('Error fetching Gestión Diaria:', e);
  }
};

const toggleDmTask = async (task) => {
  const wasCompleted = task.completed;
  task.completed = !wasCompleted; // Optimistic update

  try {
    if (wasCompleted) {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_template_id', task.id)
        .eq('profile_id', currentProfile.value.id)
        .eq('period_key', task.periodKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('task_completions').insert({
        task_template_id: task.id,
        profile_id: currentProfile.value.id,
        period_key: task.periodKey
      });
      if (error) throw error;
    }
  } catch (e) {
    task.completed = wasCompleted; // Revert on fail
    console.error(e);
  }
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
        roleContext: roleContextStr.value
      })
    });

    const data = await response.json();
    if (response.ok) {
      messages.value.push({ sender: 'ai', text: data.reply });
    } else {
      messages.value.push({ sender: 'ai', text: `Error: ${data.error}` });
    }
  } catch (error) {
    messages.value.push({ sender: 'ai', text: 'Error de conexión con PROMETHEUS OS AI.' });
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

const exitAuditMode = () => {
  router.push('/workspace');
  setTimeout(() => { window.location.reload(); }, 100);
};



</script>
<style scoped>
/* Tailwind classes handle the layout now */
.material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 1; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #d1d1d6; border-radius: 6px; }
</style>
<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pb-20">
    <header class="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-lg shrink-0">
          <div class="flex items-center gap-space-sm cursor-pointer" @click="router.push('/')">
            <div class="w-10 h-10 flex-shrink-0">
              <img src="@/assets/elite-nova-logo.png" alt="Elite Nutrition Logo" class="w-full h-full object-contain" />
            </div>
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm tracking-tight text-on-surface leading-tight">Elite Nutrition</span>
              <span class="font-caption text-caption tracking-widest uppercase text-[#b08d57] font-bold leading-tight">God Mode</span>
            </div>
          </div>
          <nav class="hidden xl:flex items-center gap-space-lg">
            <router-link to="/" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Inicio</router-link>
            <router-link to="/master" class="text-primary font-semibold font-label-md text-label-md transition-colors border-b-2 border-primary-container pb-1">Auditoría Global</router-link>
            <router-link to="/mapa-cargos" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Arquitectura</router-link>
            <router-link to="/performance" class="text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface">Rendimiento</router-link>
          </nav>
        </div>
        <div class="flex items-center gap-space-sm justify-end">
          <div class="flex flex-col text-right hidden sm:flex">
            <span class="font-label-md text-label-md text-on-surface leading-tight">{{ currentUser?.full_name || 'Admin Master' }}</span>
            <span class="font-caption text-caption text-[#b08d57] font-bold tracking-widest uppercase">Holding CEO</span>
          </div>
          <button @click="router.push('/workspace')" class="w-10 h-10 rounded-full bg-[#1d1d1f] text-[#d4b06a] flex items-center justify-center font-bold hover:scale-105 shadow-md transition-all border border-[#8a6d3d]/30" title="Mi Espacio">
            {{ currentUser?.full_name ? currentUser.full_name.charAt(0) : 'A' }}
          </button>
        </div>
      </div>
    </header>

    <main class="w-full pt-28">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>

      <div v-else-if="!isMasterAdmin" class="flex flex-col items-center justify-center pt-24">
        <span class="material-symbols-outlined text-6xl text-danger mb-4">gpp_bad</span>
        <h2 class="text-2xl font-bold">Acceso Denegado</h2>
        <p class="text-secondary mt-2">Esta sala es de uso exclusivo para el Directorio del Holding (Master Admin).</p>
        <button @click="router.push('/')" class="mt-6 px-6 py-2 bg-[#1d1d1f] text-white rounded-lg">Retirarse</button>
      </div>

      <div v-else class="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin">
        <!-- Dashboard Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1d1d1f] text-white mb-4 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
              <span class="font-caption text-caption tracking-widest uppercase font-bold text-[#e8d9b5]">Sincronización en Tiempo Real</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold tracking-tighter text-[#1d1d1f] leading-tight">Auditoría Central</h1>
            <p class="text-lg text-secondary mt-2">Consolidado métrico, financiero y operativo del Holding.</p>
          </div>
          
          <button @click="refreshData" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-surface-container-high hover:border-[#b08d57] text-[#1d1d1f] font-semibold text-sm transition-all shadow-sm group">
            <span class="material-symbols-outlined text-[20px] text-[#b08d57] group-hover:rotate-180 transition-transform duration-500">sync</span>
            Forzar Sincronización
          </button>
        </div>

        <!-- Telemetría Global (Bento Grid) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
          <!-- KPI -->
          <div class="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-[#d4b06a]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex justify-between items-start mb-6">
              <span class="text-xs font-bold text-secondary uppercase tracking-widest">Salud Operativa</span>
              <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-green-600">health_and_safety</span>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-[#1d1d1f]">94.2</span><span class="text-lg font-semibold text-secondary">%</span>
            </div>
            <p class="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">trending_up</span> +2.4% vs Mes Anterior
            </p>
          </div>

          <!-- Operatividad -->
          <div class="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm relative overflow-hidden group">
            <div class="flex justify-between items-start mb-6">
              <span class="text-xs font-bold text-secondary uppercase tracking-widest">Nodos Activos</span>
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-blue-600">account_tree</span>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-[#1d1d1f]">{{ metrics.totalProfiles }}</span>
            </div>
            <p class="text-xs font-medium text-secondary mt-2">Colaboradores en la red</p>
          </div>

          <!-- Presupuesto / Financiero -->
          <div class="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-sm relative overflow-hidden group">
            <div class="flex justify-between items-start mb-6">
              <span class="text-xs font-bold text-secondary uppercase tracking-widest">Ejecución CapEx</span>
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-purple-600">account_balance</span>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-[#1d1d1f]">$4.2</span><span class="text-lg font-semibold text-secondary">M</span>
            </div>
            <div class="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[65%]"></div>
            </div>
          </div>

          <!-- Alertas -->
          <div class="bg-[#1d1d1f] rounded-3xl p-6 border border-black shadow-lg relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
              <span class="text-xs font-bold text-[#d4b06a] uppercase tracking-widest">Riesgos Críticos</span>
              <div class="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center backdrop-blur-md">
                <span class="material-symbols-outlined text-red-400">warning</span>
              </div>
            </div>
            <div class="flex items-baseline gap-2 relative z-10">
              <span class="text-4xl font-bold text-white">{{ metrics.totalOverdue }}</span>
            </div>
            <p class="text-xs font-medium text-red-300 mt-2 relative z-10">Tareas tácticas vencidas (Global)</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          <!-- Flujos y Arquitectura (Visión Satelital) -->
          <div class="lg:col-span-7 flex flex-col gap-space-md">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-2xl font-bold text-[#1d1d1f]">Mando de Procesos (Flujos)</h3>
              <router-link to="/process" class="text-sm font-semibold text-[#b08d57] hover:text-[#8a6d3d] flex items-center gap-1">
                Ir a Procesos <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </router-link>
            </div>
            
            <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-2 flex flex-col gap-2">
              <div v-for="(flow, i) in activeFlows" :key="i" class="p-5 rounded-2xl bg-[#f5f5f7] hover:bg-[#e5e5ea]/50 transition-colors border border-transparent hover:border-[#d1d1d6] flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-black/5 text-[#1d1d1f]">
                    <span class="material-symbols-outlined">{{ flow.icon }}</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-[#1d1d1f]">{{ flow.title }}</h4>
                    <p class="text-xs text-secondary mt-1">{{ flow.status }}</p>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span class="text-sm font-bold" :class="flow.health === 'Óptimo' ? 'text-green-600' : 'text-amber-600'">
                    {{ flow.health }}
                  </span>
                  <div class="flex gap-1">
                     <span v-for="step in 5" :key="step" class="w-6 h-1.5 rounded-full" :class="step <= flow.progress ? 'bg-[#1d1d1f]' : 'bg-gray-200'"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 p-6 bg-gradient-to-br from-[#d4b06a]/10 to-[#8a6d3d]/5 rounded-3xl border border-[#d4b06a]/20">
              <h4 class="font-bold text-[#8a6d3d] mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">architecture</span>
                Arquitectura Organizacional
              </h4>
              <p class="text-sm text-[#1d1d1f]/70 leading-relaxed mb-4">
                El mapa de cargos (Compliance) y las matrices de permisos están resguardadas en la bóveda estructural. Para modificar la matriz, accede al DataHub.
              </p>
              <div class="flex gap-3">
                <router-link to="/mapa-cargos" class="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-[#1d1d1f] shadow-sm border border-[#e5e5ea] hover:border-[#1d1d1f] transition-colors">Ver Organigrama</router-link>
                <router-link to="/roles" class="px-4 py-2 bg-[#1d1d1f] text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-[#333] transition-colors">Matriz de Roles</router-link>
              </div>
            </div>
          </div>

          <!-- Auditoría Diaria (Checklist Paso a Paso) -->
          <div class="lg:col-span-5 flex flex-col gap-space-md">
            <h3 class="text-2xl font-bold text-[#1d1d1f] mb-2">Gestión Diaria Master</h3>
            
            <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden flex flex-col h-full">
              <div class="p-6 border-b border-[#e5e5ea] bg-[#fbfbfd]">
                <p class="text-sm text-secondary font-medium mb-4">
                  Protocolo de control sugerido por la IA para mantener la gobernanza corporativa al día de hoy.
                </p>
                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-[#1d1d1f] transition-all duration-500" :style="{ width: auditProgress + '%' }"></div>
                </div>
                <div class="flex justify-between mt-2 text-xs font-bold uppercase tracking-wider text-secondary">
                  <span>Progreso</span>
                  <span>{{ Math.round(auditProgress) }}%</span>
                </div>
              </div>

              <div class="p-2 flex-1 overflow-y-auto">
                <div v-for="(step, i) in auditSteps" :key="i" 
                     @click="toggleAuditStep(i)"
                     class="p-4 m-2 rounded-2xl cursor-pointer transition-all border"
                     :class="step.completed ? 'bg-green-50 border-green-200' : 'bg-white border-[#e5e5ea] hover:border-[#1d1d1f] hover:shadow-sm'">
                  
                  <div class="flex items-start gap-4">
                    <div class="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                         :class="step.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#d1d1d6]'">
                      <span v-if="step.completed" class="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <div>
                      <h4 class="font-bold text-[15px]" :class="step.completed ? 'text-green-900 line-through opacity-70' : 'text-[#1d1d1f]'">{{ step.title }}</h4>
                      <p class="text-xs mt-1" :class="step.completed ? 'text-green-700 opacity-70' : 'text-secondary'">{{ step.desc }}</p>
                    </div>
                  </div>
                  
                  <!-- Acciones contextuales del paso (opcional) -->
                  <div v-if="!step.completed && step.action" class="mt-4 ml-10">
                    <button @click.stop="router.push(step.link)" class="text-xs font-bold text-[#b08d57] bg-[#b08d57]/10 px-3 py-1.5 rounded-lg hover:bg-[#b08d57] hover:text-white transition-colors">
                      {{ step.action }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/api/supabase';

const router = useRouter();
const loading = ref(true);
const isMasterAdmin = ref(false);
const currentUser = ref(null);

const metrics = ref({
  totalProfiles: 0,
  totalOverdue: 0,
});

const activeFlows = ref([
  { title: 'Aprobación Presupuesto Q4', icon: 'account_balance', status: 'Esperando Gerencia Financiera', health: 'Advertencia', progress: 3 },
  { title: 'Onboarding Masivo Operarios', icon: 'groups', status: 'Ejecución Automática IA', health: 'Óptimo', progress: 4 },
  { title: 'Auditoría ISO 9001', icon: 'verified', status: 'Recopilación de Documentos', health: 'Óptimo', progress: 2 }
]);

const auditSteps = ref([
  { completed: false, title: 'Revisar Alertas de Cuellos de Botella', desc: 'Hay 2 equipos superando el tiempo límite de SLA operativo.', action: 'Ver Centro de Control', link: '/team' },
  { completed: false, title: 'Auditar Gastos y CapEx', desc: 'Existen presupuestos de Q4 pendientes de firma final.', action: 'Ver Presupuestos', link: '/kpis' },
  { completed: false, title: 'Monitorear Riesgos de Compliance', desc: 'Revisar matriz de perfiles para detectar accesos no autorizados.', action: 'Ver Gobernanza', link: '/roles' },
  { completed: false, title: 'Sincronizar Inteligencia Corporativa', desc: 'El oráculo ha detectado 3 desviaciones en manuales operativos.', action: 'Hablar con Oráculo', link: '/oracle' }
]);

const auditProgress = computed(() => {
  const completed = auditSteps.value.filter(s => s.completed).length;
  return (completed / auditSteps.value.length) * 100;
});

const toggleAuditStep = (index) => {
  auditSteps.value[index].completed = !auditSteps.value[index].completed;
};

const refreshData = async () => {
  loading.value = true;
  await fetchMasterData();
  loading.value = false;
};

const fetchMasterData = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;
    
    const userId = session.session.user.id;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    currentUser.value = profile;
    
    if (profile && profile.is_master_admin) {
      isMasterAdmin.value = true;
      
      // Fetch some real telemetry
      const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: overdueCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', new Date().toISOString());
      
      metrics.value.totalProfiles = profilesCount || 0;
      metrics.value.totalOverdue = overdueCount || 0;
    }
  } catch (error) {
    console.error('Error fetching master data:', error);
  }
};

onMounted(async () => {
  await fetchMasterData();
  loading.value = false;
});
</script>

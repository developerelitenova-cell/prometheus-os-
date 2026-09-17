<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pb-20">

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
              <span class="text-4xl font-bold text-[#1d1d1f]">{{ metrics.saludOperativa || '0' }}</span><span class="text-lg font-semibold text-secondary">%</span>
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
              <span class="text-4xl font-bold text-[#1d1d1f]">{{ metrics.totalRoles }}</span>
            </div>
            <p class="text-xs font-medium text-secondary mt-2">Cargos estructurales</p>
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

        <!-- Directorio de Nodos y Auditoría (Tabla Restaurada) -->
        <div class="mt-space-xl bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden mb-12">
          <div class="p-6 border-b border-[#e5e5ea] flex justify-between items-center bg-[#fbfbfd]">
            <div>
              <h3 class="text-xl font-bold text-[#1d1d1f]">Directorio de Nodos Operativos</h3>
              <p class="text-sm text-secondary mt-1">Auditoría global de cargos, estado de mapeo y base de conocimiento.</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#e5e5ea] bg-gray-50 text-xs uppercase tracking-widest text-secondary">
                  <th class="p-4 font-bold">Cargo / Nodo</th>
                  <th class="p-4 font-bold">Área (Nivel)</th>
                  <th class="p-4 font-bold">Estado Mapeo</th>
                  <th class="p-4 font-bold text-right">Acciones (Auditoría)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#e5e5ea]">
                <tr v-for="role in allRoles" :key="role.id" class="hover:bg-gray-50 transition-colors">
                  <td class="p-4">
                    <span class="font-bold text-[#1d1d1f] block">{{ role.name }}</span>
                    <span class="text-xs text-secondary font-mono">ID: EN-{{ role.id?.substring(0,4)?.toUpperCase() }}</span>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-[#1d1d1f] text-xs font-semibold">
                      {{ role.areas?.name || 'General' }} (Nivel {{ role.access_level }})
                    </span>
                  </td>
                  <td class="p-4">
                    <span v-if="mappedRolesSet.has(role.id)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                      <span class="material-symbols-outlined text-[14px]">check_circle</span> Mapeado
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      <span class="material-symbols-outlined text-[14px]">warning</span> Sin Mapear
                    </span>
                  </td>
                  <td class="p-4 text-right space-x-2">
                    <button @click="openDocsModal(role)" class="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm" title="Ver Documentación del Nodo">
                      <span class="material-symbols-outlined text-[18px]">folder_open</span>
                    </button>
                    <router-link :to="`/mapper/${role.id}`" class="inline-flex items-center justify-center p-2 rounded-xl bg-[#1d1d1f] text-[#d4b06a] hover:scale-105 transition-all shadow-sm" title="Estructurar Cadena (Mapear)">
                      <span class="material-symbols-outlined text-[18px]">account_tree</span>
                    </router-link>
                  </td>
                </tr>
                <tr v-if="allRoles.length === 0">
                  <td colspan="4" class="p-8 text-center text-secondary">No hay roles registrados en el sistema.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>

    <!-- Modal Información del Nodo -->
    <div v-if="showDocsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-[#1d1d1f]/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-6 border-b border-[#e5e5ea] flex justify-between items-center bg-[#fbfbfd]">
          <div>
            <h3 class="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">hub</span>
              Información del Nodo: {{ activeDocRole?.name }}
            </h3>
            <p class="text-sm text-secondary mt-1">Conocimiento inyectado y cartografía operativa.</p>
          </div>
          <button @click="closeDocsModal" class="p-2 text-secondary hover:text-[#1d1d1f] hover:bg-gray-100 rounded-full transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-0 overflow-y-auto flex-1 flex flex-col">
          <div v-if="loadingDocs" class="flex justify-center py-20">
             <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
          
          <div v-else class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#e5e5ea] h-full">
            
            <!-- Columna Izquierda: Cartografía Operativa (IA) -->
            <div class="flex-1 p-6 bg-white overflow-y-auto">
              <h4 class="font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-[#8a6d3d]">memory</span>
                Cartografía del Flujo (IA)
              </h4>
              
              <div v-if="roleWorkflow" class="space-y-6">
                <!-- Tareas -->
                <div v-if="roleWorkflow.tasks?.length">
                  <h5 class="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Tareas Principales</h5>
                  <ul class="space-y-2">
                    <li v-for="(task, idx) in roleWorkflow.tasks" :key="'t'+idx" class="text-sm text-[#1d1d1f] bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span class="font-bold text-[#8a6d3d] mr-1">{{ idx + 1 }}.</span> {{ task }}
                    </li>
                  </ul>
                </div>
                
                <!-- KPIs & Outputs -->
                <div class="grid grid-cols-2 gap-4">
                  <div v-if="roleWorkflow.kpis?.length">
                    <h5 class="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Métricas (KPIs)</h5>
                    <ul class="list-disc pl-4 space-y-1">
                      <li v-for="(kpi, idx) in roleWorkflow.kpis" :key="'k'+idx" class="text-sm text-[#1d1d1f]">{{ kpi }}</li>
                    </ul>
                  </div>
                  <div v-if="roleWorkflow.outputs?.length">
                    <h5 class="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Entregables</h5>
                    <ul class="list-disc pl-4 space-y-1">
                      <li v-for="(out, idx) in roleWorkflow.outputs" :key="'o'+idx" class="text-sm text-[#1d1d1f]">{{ out }}</li>
                    </ul>
                  </div>
                </div>

                <!-- Bottlenecks -->
                <div v-if="roleWorkflow.bottlenecks?.length" class="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h5 class="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">warning</span> Riesgos y Cuellos de Botella
                  </h5>
                  <ul class="list-disc pl-4 space-y-1 text-sm text-amber-900">
                    <li v-for="(bn, idx) in roleWorkflow.bottlenecks" :key="'b'+idx">{{ bn }}</li>
                  </ul>
                </div>
              </div>
              
              <div v-else class="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span class="material-symbols-outlined text-3xl text-secondary opacity-50 mb-2">account_tree</span>
                <p class="text-sm text-secondary font-medium">Este cargo aún no ha sido estructurado.</p>
                <router-link :to="`/mapper/${activeDocRole?.id}`" class="text-xs font-bold text-[#b08d57] hover:underline mt-2 inline-block">Iniciar Mapeo con IA</router-link>
              </div>
            </div>

            <!-- Columna Derecha: Base de Conocimiento Documental -->
            <div class="w-full md:w-80 p-6 bg-[#fbfbfd] overflow-y-auto shrink-0">
              <h4 class="font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">topic</span>
                Manuales Adjuntos
              </h4>
              
              <ul v-if="roleDocs.length > 0" class="space-y-3">
                <li v-for="doc in roleDocs" :key="doc.id" class="p-3 bg-white border border-[#e5e5ea] rounded-xl hover:border-primary/30 transition-colors group">
                  <div class="flex justify-between items-start gap-2">
                    <div>
                      <span class="font-bold text-[#1d1d1f] text-sm block leading-tight mb-1">{{ doc.title }}</span>
                      <span class="text-[10px] text-secondary uppercase font-bold">{{ doc.document_type || 'Documento' }}</span>
                    </div>
                    <a v-if="doc.file_url" :href="doc.file_url" target="_blank" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-100 transition-colors" title="Abrir PDF">
                      <span class="material-symbols-outlined text-[16px]">visibility</span>
                    </a>
                  </div>
                </li>
              </ul>
              
              <div v-else class="text-center py-8">
                <span class="material-symbols-outlined text-3xl text-secondary opacity-30 mb-2">description</span>
                <p class="text-xs text-secondary">No hay PDFs ni manuales inyectados en este nodo.</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
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
  saludOperativa: 0,
  totalRoles: 0
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

const allRoles = ref([]);
const mappedRolesSet = ref(new Set());
const showDocsModal = ref(false);
const activeDocRole = ref(null);
const roleDocs = ref([]);
const roleWorkflow = ref(null);
const loadingDocs = ref(false);

const openDocsModal = async (role) => {
  activeDocRole.value = role;
  showDocsModal.value = true;
  loadingDocs.value = true;
  roleDocs.value = [];
  roleWorkflow.value = null;

  try {
    const [docsRes, workflowRes] = await Promise.all([
      supabase.from('knowledge_base').select('*').eq('role_id', role.id).order('updated_at', { ascending: false }),
      supabase.from('role_workflows').select('*').eq('role_id', role.id).maybeSingle()
    ]);

    if (!docsRes.error && docsRes.data) {
      roleDocs.value = docsRes.data;
    }
    
    if (!workflowRes.error && workflowRes.data) {
      roleWorkflow.value = workflowRes.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingDocs.value = false;
  }
};
const closeDocsModal = () => {
  showDocsModal.value = false;
  activeDocRole.value = null;
};

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

      // Fetch roles
      const { data: rolesData } = await supabase.from('roles').select('*, areas(name)').order('name');
      
      let uniqueRoles = [];
      if (rolesData) {
        const seenNames = new Set();
        for (const r of rolesData) {
          if (!seenNames.has(r.name)) {
            seenNames.add(r.name);
            uniqueRoles.push(r);
          }
        }
        allRoles.value = uniqueRoles;
        metrics.value.totalRoles = uniqueRoles.length;
      }

      // Fetch mapped roles
      const { data: mappedData } = await supabase.from('role_workflows').select('role_id');
      if (mappedData) {
        // Only count unique mapped roles that are in our uniqueRoles list
        const validRoleIds = new Set(uniqueRoles.map(r => r.id));
        const validMappedIds = mappedData.map(w => w.role_id).filter(id => validRoleIds.has(id));
        mappedRolesSet.value = new Set(validMappedIds);
        
        metrics.value.saludOperativa = metrics.value.totalRoles > 0 
          ? Math.round((mappedRolesSet.value.size / metrics.value.totalRoles) * 100) 
          : 0;
      }
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

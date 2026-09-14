<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col relative overflow-hidden">
    
    <!-- Micro-dots Background Pattern (Subtle) -->
    <div class="absolute inset-0 pointer-events-none opacity-50 z-0 micro-dots"></div>


    <main class="flex-1 relative z-10 w-full">
      <!-- HERO SECTION -->
      <section class="max-w-[1400px] mx-auto px-6 pt-24 pb-32">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <!-- Content Left -->
          <div class="lg:col-span-7 flex flex-col items-start">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#8a6d3d]/20 shadow-sm mb-8">
              <span class="w-2 h-2 rounded-full bg-[#8a6d3d] animate-pulse"></span>
              <span class="text-[11px] font-bold text-[#8a6d3d] uppercase tracking-wider">Sistema de Gobernanza IA v2.0</span>
            </div>

            <h2 class="text-[4rem] sm:text-[5rem] lg:text-[5.5rem] font-bold tracking-tighter leading-[1.05] text-[#1d1d1f] mb-6">
              Plataforma de <br />
              <span class="gold-gradient-text">Inteligencia</span><br />
              Corporativa
            </h2>

            <p class="text-xl text-[#1d1d1f]/60 font-light max-w-2xl leading-relaxed mb-10">
              El cerebro digital del <strong>Holding Corporativo</strong>. Administra, consulta y automatiza 
              el flujo de trabajo de todos los nodos de la empresa con precisión absoluta.
            </p>

            <div class="flex flex-wrap items-center gap-4">
              <template v-if="isLoggedIn">
                <router-link v-if="isMasterUser" to="/master" class="h-14 px-8 rounded-full bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white text-[15px] font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-[#d4b06a]/20">
                  <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  Auditoría Global (God Mode)
                </router-link>
                <router-link v-else-if="isControlUser" to="/team" class="h-14 px-8 rounded-full bg-[#1d1d1f] text-white text-[15px] font-medium flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-black/10">
                  <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  Centro de Control
                </router-link>
                <router-link to="/workspace" class="h-14 px-8 rounded-full bg-white text-[#1d1d1f] border border-black/10 text-[15px] font-medium flex items-center gap-3 hover:border-[#8a6d3d] hover:text-[#8a6d3d] transition-all shadow-sm">
                  <span class="material-symbols-outlined text-[20px]">work</span>
                  Mi Espacio Elite
                </router-link>
              </template>
              <template v-else>
                <router-link to="/login" class="h-14 px-8 rounded-full bg-[#1d1d1f] text-white text-[15px] font-medium flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-black/10">
                  Acceso Autorizado
                  <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                </router-link>
              </template>
            </div>
          </div>

          <!-- Telemetry Right (Floating Matrix) -->
          <div class="lg:col-span-5 relative">
            <div class="absolute inset-0 bg-gradient-to-tr from-[#d4b06a]/20 to-transparent blur-3xl -z-10 rounded-full"></div>
            
            <div class="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-2xl shadow-[#8a6d3d]/5">
              <div class="flex items-center justify-between mb-8 pb-4 border-b border-black/5">
                <h3 class="text-sm font-bold text-[#1d1d1f] uppercase tracking-widest">Matriz de Telemetría</h3>
                <span class="material-symbols-outlined text-[#8a6d3d]">radar</span>
              </div>
              
              <div class="space-y-6">
                <!-- Nodos Mapeados (Cargos) -->
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center border border-black/5">
                    <span class="material-symbols-outlined text-[#1d1d1f] text-[28px]">group_work</span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-end">
                      <p class="text-3xl font-bold tracking-tight text-[#1d1d1f]">{{ statMappedRoles }}</p>
                      <p class="text-xs font-semibold text-[#8a6d3d] uppercase tracking-wider mb-1">Nodos Mapeados</p>
                    </div>
                    <div class="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div class="h-full bg-[#1d1d1f] rounded-full" :style="{ width: statCoverage + '%' }"></div>
                    </div>
                    <p class="text-[11px] text-gray-500 mt-1 font-medium">Faltan por mapear: {{ statMissingRoles }} cargos</p>
                  </div>
                </div>

                <!-- Unidades de Negocio (Áreas) -->
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center border border-black/5">
                    <span class="material-symbols-outlined text-[#1d1d1f] text-[28px]">domain</span>
                  </div>
                  <div>
                    <p class="text-3xl font-bold tracking-tight text-[#1d1d1f]">{{ statAreas }}</p>
                    <p class="text-xs font-semibold text-[#8a6d3d] uppercase tracking-wider mt-1">Áreas Activas</p>
                  </div>
                </div>

                <!-- Eficiencia -->
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4b06a] to-[#8a6d3d] flex items-center justify-center shadow-md">
                    <span class="material-symbols-outlined text-white text-[28px]">analytics</span>
                  </div>
                  <div>
                    <p class="text-3xl font-bold tracking-tight text-[#1d1d1f]">{{ statCoverage }}%</p>
                    <p class="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-wider mt-1">Cobertura del Sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- SECCIÓN BENTO GRID: Módulos Corporativos Integrados -->
      <section class="w-full bg-white border-y border-black/5 py-24 relative overflow-hidden">
        <!-- Decoración de fondo suave -->
        <div class="absolute top-0 right-0 w-1/2 h-[500px] bg-gradient-to-bl from-[#f5f5f7] to-transparent -z-10 rounded-bl-full opacity-50"></div>
        
        <div class="max-w-[1400px] mx-auto px-6">
          <div class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p class="text-sm font-bold text-[#8a6d3d] uppercase tracking-widest mb-3">Infraestructura Tecnológica B2B</p>
              <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">Módulos Corporativos Integrados</h2>
            </div>
            <p class="text-[#1d1d1f]/60 text-sm md:text-base max-w-md font-medium">
              Control total del holding en finanzas, gobernanza legal, supervisión de marcas y auditoría de directorio.
            </p>
          </div>

          <!-- Grid bento de 4 módulos de la imagen -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            <!-- Card 1: ERP & Presupuestos -->
            <router-link to="/kpis" class="group block bg-[#f5f5f7] hover:bg-white rounded-[2rem] p-8 border border-transparent hover:border-[#8a6d3d]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#8a6d3d]/5 relative overflow-hidden flex flex-col h-full">
              <div class="flex items-center justify-between mb-6 relative z-10">
                <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-white transition-colors">
                  <span class="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-[#8a6d3d] uppercase tracking-widest shadow-sm">CAPEX / OPEX</span>
              </div>
              <h3 class="text-xl font-bold text-[#1d1d1f] mb-3 relative z-10">ERP & Presupuestos Consolidados</h3>
              <p class="text-sm text-[#1d1d1f]/60 leading-relaxed mb-8 flex-1 relative z-10">
                Gestión de flujos financieros, centros de costos y aprobación de órdenes de compra corporativas.
              </p>
              
              <div class="bg-white rounded-xl p-4 mb-6 shadow-sm border border-black/5 relative z-10">
                <div class="flex justify-between items-end mb-2">
                  <span class="text-xs font-semibold text-[#1d1d1f]/60">Ejecución Presupuestaria</span>
                  <span class="text-lg font-bold text-[#1d1d1f]">84.2%</span>
                </div>
                <div class="w-full h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden mb-2">
                  <div class="h-full bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d]" style="width: 84.2%"></div>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
                  <span class="text-[11px] font-semibold text-[#1d1d1f]">Flujo Auditado: 32 Centros OK</span>
                </div>
              </div>

              <div class="flex items-center text-sm font-semibold text-[#8a6d3d] group-hover:text-[#1d1d1f] transition-colors mt-auto relative z-10">
                Gestionar presupuestos
                <span class="material-symbols-outlined ml-1 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </router-link>

            <!-- Card 2: Legal -->
            <router-link to="/manuals" class="group block bg-[#f5f5f7] hover:bg-white rounded-[2rem] p-8 border border-transparent hover:border-[#8a6d3d]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#8a6d3d]/5 relative overflow-hidden flex flex-col h-full">
              <div class="flex items-center justify-between mb-6 relative z-10">
                <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-white transition-colors">
                  <span class="material-symbols-outlined">gavel</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-[#8a6d3d] uppercase tracking-widest shadow-sm">Legal Tech</span>
              </div>
              <h3 class="text-xl font-bold text-[#1d1d1f] mb-3 relative z-10">Gestión Contractual y Legal</h3>
              <p class="text-sm text-[#1d1d1f]/60 leading-relaxed mb-8 flex-1 relative z-10">
                Repositorio de contratos comerciales, firmas notariales digitales y normativas mercantiles vigentes.
              </p>
              
              <div class="bg-white rounded-xl p-4 mb-6 shadow-sm border border-black/5 relative z-10 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-semibold text-[#1d1d1f]/60">Contratos Firmados</span>
                  <span class="text-lg font-bold text-[#1d1d1f]">1,420</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-[#8a6d3d]">lock</span>
                  <span class="text-[11px] font-semibold text-[#1d1d1f]">100% Cifrado Notarial Digital</span>
                </div>
                <div class="flex items-center gap-2 border-t border-black/5 pt-2">
                  <span class="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span class="text-[11px] font-semibold text-[#1d1d1f]/70">En revisión legal: 14 acuerdos</span>
                </div>
              </div>

              <div class="flex items-center text-sm font-semibold text-[#8a6d3d] group-hover:text-[#1d1d1f] transition-colors mt-auto relative z-10">
                Revisar contratos
                <span class="material-symbols-outlined ml-1 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </router-link>

            <!-- Card 3: Marcas -->
            <router-link to="/mapa-cargos" class="group block bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-[2rem] p-8 border border-black/10 transition-all duration-300 hover:shadow-2xl hover:shadow-[#1d1d1f]/20 relative overflow-hidden flex flex-col h-full text-white">
              <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20"></div>
              
              <div class="flex items-center justify-between mb-6 relative z-10">
                <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                  <span class="material-symbols-outlined">domain</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-[#8a6d3d] text-[10px] font-bold text-white uppercase tracking-widest">14 Marcas</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-3 relative z-10">Monitoreo de Filiales y Marcas</h3>
              <p class="text-sm text-white/60 leading-relaxed mb-8 flex-1 relative z-10">
                Supervisión en tiempo real de las líneas de producto, inventario central y distribución comercial.
              </p>
              
              <div class="bg-white/5 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10 relative z-10 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-semibold text-white/60">Unidades Comercializadas</span>
                  <span class="text-lg font-bold text-white">4.8M <span class="text-xs font-normal text-white/40">/ mes</span></span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs font-semibold text-white/60">Líneas Activas</span>
                  <span class="text-sm font-bold text-[#d4b06a]">88 SKUs masivos</span>
                </div>
                <div class="flex items-center gap-2 border-t border-white/10 pt-2">
                  <span class="material-symbols-outlined text-[14px] text-green-400">trending_up</span>
                  <span class="text-[11px] font-semibold text-white/80">Eficiencia Logística: 97.6% On-Time</span>
                </div>
              </div>

              <div class="flex items-center text-sm font-semibold text-white group-hover:text-[#d4b06a] transition-colors mt-auto relative z-10">
                Explorar filiales
                <span class="material-symbols-outlined ml-1 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </router-link>

            <!-- Card 4: Auditoría -->
            <router-link to="/oracle" class="group block bg-[#f5f5f7] hover:bg-white rounded-[2rem] p-8 border border-transparent hover:border-[#8a6d3d]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#8a6d3d]/5 relative overflow-hidden flex flex-col h-full">
              <div class="flex items-center justify-between mb-6 relative z-10">
                <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-white transition-colors">
                  <span class="material-symbols-outlined">account_balance</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-[#8a6d3d] uppercase tracking-widest shadow-sm">Governance</span>
              </div>
              <h3 class="text-xl font-bold text-[#1d1d1f] mb-3 relative z-10">Auditoría Interna y Directorio</h3>
              <p class="text-sm text-[#1d1d1f]/60 leading-relaxed mb-8 flex-1 relative z-10">
                Minutas de juntas directivas, matriz de riesgos corporativos y delegación de responsabilidades.
              </p>
              
              <div class="bg-white rounded-xl p-4 mb-6 shadow-sm border border-black/5 relative z-10 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-green-600">verified</span>
                    <span class="text-xs font-semibold text-[#1d1d1f]">Sesión Ordinaria #48</span>
                  </div>
                  <span class="text-[10px] font-bold text-white bg-[#1d1d1f] px-2 py-0.5 rounded">Aprobada</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-[#8a6d3d]">groups</span>
                  <span class="text-[11px] font-semibold text-[#1d1d1f]/80">Quorum Directivo: 100% Asistencia</span>
                </div>
                <div class="flex items-center gap-2 border-t border-black/5 pt-2">
                  <span class="material-symbols-outlined text-[14px] text-blue-600">security</span>
                  <span class="text-[11px] font-semibold text-[#1d1d1f]">Matriz Riesgos: Nivel Bajo</span>
                </div>
              </div>

              <div class="flex items-center text-sm font-semibold text-[#8a6d3d] group-hover:text-[#1d1d1f] transition-colors mt-auto relative z-10">
                Acceder a juntas
                <span class="material-symbols-outlined ml-1 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </router-link>

          </div>
        </div>
      </section>

      <!-- INSTITUCIONAL -->
      <section class="max-w-[1400px] mx-auto px-6 py-24">
        <div class="bg-[#1d1d1f] rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
          <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-bl from-[#d4b06a]/30 to-transparent rounded-full blur-3xl"></div>
          
          <div class="max-w-xl relative z-10">
            <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Estándar de Excelencia.</h2>
            <p class="text-lg text-white/70 font-light leading-relaxed mb-8">
              Nuestra plataforma asegura que cada filial, área y empleado esté alineado con los objetivos del holding, garantizando calidad, rentabilidad y gobernanza total.
            </p>
            <a href="#" class="inline-flex items-center gap-2 text-[#d4b06a] font-semibold hover:text-white transition-colors">
              Conoce nuestro framework operativo
              <span class="material-symbols-outlined text-[18px]">east</span>
            </a>
          </div>

          <div class="grid grid-cols-2 gap-6 relative z-10 shrink-0">
            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center min-w-[140px]">
              <span class="material-symbols-outlined text-[#d4b06a] text-[32px] mb-3">shield_locked</span>
              <p class="text-sm font-bold text-white">ISO 27001</p>
              <p class="text-[10px] text-white/50 uppercase tracking-wider mt-1">Seguridad</p>
            </div>
            <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center min-w-[140px]">
              <span class="material-symbols-outlined text-[#d4b06a] text-[32px] mb-3">balance</span>
              <p class="text-sm font-bold text-white">Compliance</p>
              <p class="text-[10px] text-white/50 uppercase tracking-wider mt-1">Auditoría Continua</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="w-full bg-[#f5f5f7] border-t border-black/5 py-12">
      <div class="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white font-bold text-sm">EN</div>
          <p class="text-sm font-semibold text-[#1d1d1f]">Elite Nova Group <span class="text-[#1d1d1f]/50 font-normal">© 2026 Todos los derechos reservados.</span></p>
        </div>
        <div class="flex items-center gap-6 text-sm font-medium text-[#1d1d1f]/60">
          <a href="#" class="hover:text-[#1d1d1f] transition-colors">Términos Legales</a>
          <a href="#" class="hover:text-[#1d1d1f] transition-colors">Política de Privacidad</a>
          <a href="#" class="hover:text-[#1d1d1f] transition-colors">Soporte Corporativo</a>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabase'
import { currentProfile, loadCurrentProfile, isMasterAdmin, isManager, signOut } from '../api/auth'

const router = useRouter()
const isLoggedIn = ref(false)
const isControlUser = computed(() => isMasterAdmin() || isManager())
const isMasterUser = computed(() => isMasterAdmin())

const statRoles = ref(0) // Total cargos
const statMappedRoles = ref(0) // Cargos que están en role_workflows
const statMissingRoles = ref(0) // statRoles - statMappedRoles
const statAreas = ref(0)
const statCoverage = ref(0)

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  isLoggedIn.value = !!data.session
  if (isLoggedIn.value) {
    if (!currentProfile.value) {
      await loadCurrentProfile()
    }
  }
  // Load stats regardless of login if we want them public, or restrict them.
  // We'll load them publicly so the telemetry matrix looks good for anyone.
  loadRealStats()
})

const handleSignOut = async () => {
  await signOut()
  isLoggedIn.value = false
  router.push('/login')
}

// Simple Count up animation
const animateValue = (targetRef, endValue, duration) => {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    targetRef.value = Math.floor(progress * endValue);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      targetRef.value = endValue;
    }
  };
  window.requestAnimationFrame(step);
};

const loadRealStats = async () => {
  try {
    const [{ count: rolesCount }, { count: areasCount }] = await Promise.all([
      supabase.from('roles').select('id', { count: 'exact', head: true }),
      supabase.from('areas').select('id', { count: 'exact', head: true }),
    ]);

    let mappedCount = 0;
    
    if (rolesCount) {
      const res = await supabase
        .from('role_workflows')
        .select('role_id', { count: 'exact', head: true });
      if (!res.error && typeof res.count === 'number') {
        mappedCount = res.count;
      }
    }

    const missingCount = (rolesCount || 0) - mappedCount;
    const coverage = rolesCount ? Math.round((mappedCount / rolesCount) * 100) : 0;

    setTimeout(() => {
      animateValue(statRoles, rolesCount || 0, 1500);
      animateValue(statAreas, areasCount || 0, 1500);
      animateValue(statMappedRoles, mappedCount || 0, 1500);
      animateValue(statMissingRoles, missingCount || 0, 1500);
      animateValue(statCoverage, coverage || 0, 1500);
    }, 300);

  } catch (e) {
    console.error('Error cargando estadísticas reales:', e);
  }
}
</script>

<style scoped>
.micro-dots {
  background-image: radial-gradient(rgba(138, 109, 61, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}
.gold-gradient-text {
  background: linear-gradient(135deg, #d4b06a 0%, #b08d57 50%, #8a6d3d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>

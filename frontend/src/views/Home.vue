<template>
  <div class="home-container">
    <!-- 顶部导航栏 / Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        <img src="../assets/elite-mark.png" alt="Elite Nutrition" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-wordmark">PROMETHEUS OS</span>
          <span class="brand-subtitle">Elite Nutrition</span>
        </div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <router-link v-if="!isLoggedIn" to="/login" class="nav-login-link">Iniciar Sesión</router-link>
        <router-link v-else-if="isControlUser" to="/team" class="nav-login-link">Centro de Control</router-link>
        <router-link v-else-if="isLoggedIn" to="/workspace" class="nav-login-link">Ir a mi Portal</router-link>
        <button v-if="isLoggedIn" class="btn-logout-global" @click="handleSignOut" title="Cerrar sesión">
          <span class="icon">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          Salir
        </button>
      </div>
    </nav>

    <div class="main-content">
      <!-- Hero 区域 -->
      <section class="hero-section">
        <div class="hero-left">
          <div class="tag-row">
            <span class="orange-tag">SISTEMA DE GOBERNANZA IA</span>
            <span class="version-text">v1.0</span>
          </div>
          
          <h1 class="main-title">
            Plataforma de<br>
            <span class="gradient-text glow-text">Inteligencia Corporativa</span>
          </h1>
          
          <div class="hero-desc">
            <p>
              El cerebro digital de <strong>Elite Nutrition & Futupro</strong>. Administra, consulta y automatiza
              el flujo de trabajo de <span class="highlight-orange">{{ statRoles }} Roles</span> con total precisión.
            </p>
            <p class="slogan-text">
              Directorio de Roles y Manuales de Cargo<span class="blinking-cursor">_</span>
            </p>
          </div>
           
          <div class="btn-group" v-if="isLoggedIn">
            <router-link v-if="isControlUser" to="/team" class="btn-primary">🧭 Centro de Control</router-link>
            <router-link to="/mapa-cargos" class="btn-primary" :class="{ 'btn-secondary': isControlUser }">Mapa de Cargos</router-link>
            <router-link to="/workspace" class="btn-tertiary">Mi Espacio Elite</router-link>
            <router-link to="/performance" class="btn-quaternary">KPIs y Rendimiento</router-link>
            <router-link v-if="isMasterAdmin()" to="/oracle" class="oracle-btn">Preguntar al Oráculo</router-link>
          </div>
          <div class="btn-group" v-else>
            <router-link to="/login" class="btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem;">Iniciar Sesión para Continuar</router-link>
          </div>

          <!-- Módulo de Simulación Corporativa: oculto hasta que exista un backend real (antes apuntaba a localhost:5001, que no existe en ningún entorno) -->
          <div v-if="SIMULATION_ENABLED" class="simulation-module">
            <h3>Simulación Corporativa & Predicción</h3>
            <div class="sim-input-wrapper">
              <input 
                v-model="simRequirement" 
                type="text" 
                placeholder="Ej: Impacto de nuevo KPI en el área logística..." 
                class="sim-input"
              />
              <input 
                type="file" 
                ref="fileInput" 
                multiple 
                @change="handleFileChange" 
                class="hidden-file-input" 
              />
              <button class="btn-attach" @click="$refs.fileInput.click()" :title="selectedFiles.length + ' archivos'">
                📎 {{ selectedFiles.length > 0 ? selectedFiles.length : '' }}
              </button>
              <button class="btn-simulate" @click="startSimulation" :disabled="!simRequirement && selectedFiles.length === 0">
                Iniciar Predicción
              </button>
            </div>
            <small v-if="selectedFiles.length > 0" class="file-count-text">Archivos cargados: {{ selectedFiles.map(f => f.name).join(', ') }}</small>
          </div>
        </div>
        
        <div class="hero-right">
          <!-- Right side decorative stats or visual -->
          <div class="stats-card glass-panel">
            <div class="stat-item">
              <h3 class="glow-text">{{ statRoles }}</h3>
              <p>Cargos Activos</p>
            </div>
            <div class="stat-item">
              <h3 class="glow-text">{{ statAreas }}</h3>
              <p>Áreas Funcionales</p>
            </div>
            <div class="stat-item" v-if="statCoverage !== null">
              <h3 class="glow-text">{{ statCoverage }}%</h3>
              <p>Cobertura de Mapeo</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setPendingUpload } from '../store/pendingUpload'
import { supabase } from '../api/supabase'
import { currentProfile, loadCurrentProfile, isMasterAdmin, isLeader, signOut } from '../api/auth'

const router = useRouter()
const isLoggedIn = ref(false)
const isControlUser = computed(() => isMasterAdmin() || isLeader())

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  isLoggedIn.value = !!data.session
  if (isLoggedIn.value && !currentProfile.value) {
    await loadCurrentProfile()
  }
})

const handleSignOut = async () => {
  await signOut()
  isLoggedIn.value = false
  router.push('/login')
}

// El módulo de Simulación Corporativa no tiene backend en ningún entorno (ver /process, /simulation, /report).
// Se mantiene el código para retomarlo cuando exista un servicio real detrás de él.
const SIMULATION_ENABLED = false
const simRequirement = ref('')
const selectedFiles = ref([])
const fileInput = ref(null)

// Stats Animation Logic -- valores reales desde Supabase (roles y áreas son
// legibles por cualquiera; la cobertura de mapeo requiere sesión, así que se
// omite esa tarjeta si no se puede leer role_workflows).
const statRoles = ref(0)
const statAreas = ref(0)
const statCoverage = ref(null)

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

onMounted(async () => {
  try {
    const [{ count: rolesCount }, { count: areasCount }] = await Promise.all([
      supabase.from('roles').select('id', { count: 'exact', head: true }),
      supabase.from('areas').select('id', { count: 'exact', head: true }),
    ]);

    setTimeout(() => {
      animateValue(statRoles, rolesCount || 0, 1500);
      animateValue(statAreas, areasCount || 0, 1500);
    }, 300);

    if (rolesCount) {
      const { count: mappedCount, error } = await supabase
        .from('role_workflows')
        .select('role_id', { count: 'exact', head: true });
      if (!error && typeof mappedCount === 'number') {
        setTimeout(() => {
          animateValue(statCoverage, Math.round((mappedCount / rolesCount) * 100), 2000);
        }, 300);
      }
    }
  } catch (e) {
    console.error('Error cargando estadísticas reales:', e);
  }
})

const goToDataHub = () => {
  router.push('/mapa-cargos')
}

const goToOracle = () => {
  router.push('/oracle')
}

const handleFileChange = (e) => {
  if (e.target.files) {
    selectedFiles.value = Array.from(e.target.files)
  }
}

const startSimulation = () => {
  if (!simRequirement.value && selectedFiles.value.length === 0) return
  setPendingUpload(selectedFiles.value, simRequirement.value)
  router.push('/process/new')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--bg-tertiary);
  font-family: var(--font-sans);
  color: var(--text-primary);
}

.navbar {
  height: 84px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 100%;
}

.brand-logo {
  height: 42px;
  width: 42px;
  border-radius: 10px;
  object-fit: cover;
  transform: scale(1.15);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-subtitle {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--gold-deep);
}

.brand-wordmark {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
}

.nav-login-link {
  color: var(--ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 9px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  transition: all 0.2s ease;
}

.nav-login-link:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
}

.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 60px;
}

.hero-left {
  flex: 1;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.orange-tag {
  background: var(--bg-secondary);
  color: var(--gold-deep);
  padding: 5px 12px;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 0.72rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
}

.version-text {
  color: var(--text-tertiary);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.main-title {
  font-size: 4.25rem;
  line-height: 1.1;
  font-weight: 600;
  margin: 0 0 30px 0;
  letter-spacing: -2px;
  color: var(--ink);
}

.gradient-text {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-desc {
  font-size: 1.15rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 600px;
  margin-bottom: 50px;
  font-weight: 400;
}

.hero-desc strong {
  color: var(--ink);
}

.highlight-orange {
  color: var(--gold-deep);
  font-weight: 700;
  font-family: var(--font-mono);
}

.slogan-text {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: 0.3px;
  border-left: 3px solid var(--gold);
  padding-left: 15px;
  margin-top: 30px;
}

.blinking-cursor {
  color: var(--gold);
  animation: blink 1s step-end infinite;
  font-weight: 700;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.btn-group {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.btn-arrow {
  font-family: sans-serif;
  transition: transform 0.3s;
}

.btn-primary, .btn-secondary, .btn-tertiary, .btn-quaternary, .oracle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 28px;
  border-radius: var(--radius-pill);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s var(--ease-apple);
  font-size: 1rem;
  letter-spacing: 0.2px;
  box-sizing: border-box;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.glow-text {
  /* Sin resplandor neón: se apoya en el degradado dorado del texto */
}

.btn-primary:hover {
  transform: translateY(-2px);
  background: #000;
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--ink);
  border: 1px solid var(--border-subtle);
}

.btn-secondary:hover {
  background: #ececee;
  transform: translateY(-2px);
}

.btn-tertiary {
  background: var(--surface);
  color: var(--gold-deep);
  border: 1px solid var(--gold-light);
}

.btn-tertiary:hover {
  background: var(--gold-light);
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-quaternary {
  background: var(--surface);
  color: var(--ink-secondary);
  border: 1px solid var(--border);
}

.btn-quaternary:hover {
  background: var(--bg-secondary);
  border-color: var(--text-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.oracle-btn {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.oracle-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold-deep);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.simulation-module {
  margin-top: 50px;
  background: var(--bg-secondary);
  padding: 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.simulation-module h3 {
  font-size: 1.05rem;
  color: var(--ink);
  margin-top: 0;
  margin-bottom: 16px;
  font-family: var(--font-sans);
  font-weight: 600;
}

.sim-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sim-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 1rem;
}

.sim-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.hidden-file-input {
  display: none;
}

.btn-attach {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.2rem;
}

.btn-attach:hover {
  background: var(--bg-secondary);
}

.btn-simulate {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-simulate:hover:not(:disabled) {
  background: #000;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-simulate:disabled {
  background: var(--text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}

.file-count-text {
  display: block;
  margin-top: 10px;
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.hero-right {
  flex: 0.8;
  display: flex;
  justify-content: center;
}

.stats-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  padding: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 40px;
  box-shadow: var(--shadow-lg);
}

.stat-item h3 {
  font-family: var(--font-mono);
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-item p {
  margin: 0;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .hero-section {
    flex-direction: column;
  }
  .hero-right {
    width: 100%;
    margin-top: 40px;
  }
  .stats-card {
    flex-direction: row;
    justify-content: space-around;
  }
}
</style>

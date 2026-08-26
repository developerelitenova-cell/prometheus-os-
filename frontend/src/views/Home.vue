<template>
  <div class="home-container">
    <!-- 顶部导航栏 / Navbar -->
    <nav class="navbar">
      <div class="nav-brand">ELITE NUTRITION AI</div>
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
              el flujo de trabajo de <span class="highlight-orange">115 Roles</span> con total precisión.
            </p>
            <p class="slogan-text">
              Directorio de Roles y Manuales de Cargo<span class="blinking-cursor">_</span>
            </p>
          </div>
           
          <div class="btn-group">
            <router-link to="/data-hub" class="btn-primary">Ir al DataHub</router-link>
            <router-link to="/workspace" class="btn-tertiary">Portal del Empleado</router-link>
            <router-link to="/performance" class="btn-quaternary">KPIs y Rendimiento</router-link>
            <router-link to="/oracle" class="oracle-btn" style="display:inline-block; margin-top:10px;">Preguntar al Oráculo</router-link>
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
            <div class="stat-item">
              <h3 class="glow-text">{{ statAccuracy }}%</h3>
              <p>Precisión Estructural</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setPendingUpload } from '../store/pendingUpload'

const router = useRouter()
// El módulo de Simulación Corporativa no tiene backend en ningún entorno (ver /process, /simulation, /report).
// Se mantiene el código para retomarlo cuando exista un servicio real detrás de él.
const SIMULATION_ENABLED = false
const simRequirement = ref('')
const selectedFiles = ref([])
const fileInput = ref(null)

// Stats Animation Logic
const statRoles = ref(0)
const statAreas = ref(0)
const statAccuracy = ref(0)

onMounted(() => {
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

  // Trigger animations after a short delay
  setTimeout(() => {
    animateValue(statRoles, 115, 1500);
    animateValue(statAreas, 11, 1500);
    animateValue(statAccuracy, 100, 2000);
  }, 300);
})

const goToDataHub = () => {
  router.push('/data-hub')
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
:root {
  --black: #000000;
  --white: #FFFFFF;
  --orange: #FF4500;
  --gray-light: #F5F5F5;
  --gray-text: #666666;
  --border: #E5E5E5;
  --font-mono: 'JetBrains Mono', monospace;
  --font-sans: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif;
}

.home-container {
  min-height: 100vh;
  background: #12121a; /* Dark theme to match the rest of the app */
  font-family: var(--font-sans);
  color: #ffffff;
}

.navbar {
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  color: var(--white);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-brand {
  font-family: var(--font-mono);
  font-weight: 800;
  letter-spacing: 2px;
  font-size: 1.2rem;
  background: linear-gradient(90deg, #00f0ff, #7000ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  background: #00f0ff;
  color: #000;
  padding: 4px 10px;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 0.75rem;
  border-radius: 4px;
}

.version-text {
  color: #999;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.main-title {
  font-size: 4.5rem;
  line-height: 1.1;
  font-weight: 600;
  margin: 0 0 30px 0;
  letter-spacing: -2px;
  color: #ffffff;
}

.gradient-text {
  background: linear-gradient(90deg, #00f0ff 0%, #7000ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-desc {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #a0a0a0;
  max-width: 600px;
  margin-bottom: 50px;
  font-weight: 400;
}

.hero-desc strong {
  color: #ffffff;
}

.highlight-orange {
  color: #00f0ff;
  font-weight: 700;
  font-family: var(--font-mono);
}

.slogan-text {
  font-size: 1.2rem;
  font-weight: 500;
  color: #ffffff;
  letter-spacing: 1px;
  border-left: 3px solid #00f0ff;
  padding-left: 15px;
  margin-top: 30px;
}

.blinking-cursor {
  color: #00f0ff;
  animation: blink 1s step-end infinite;
  font-weight: 700;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.btn-group {
  margin-top: 40px;
}

.start-engine-btn {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: var(--font-sans);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.2);
}

.start-engine-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(0, 240, 255, 0.3);
}

.oracle-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  font-family: var(--font-sans);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  margin-left: 16px;
}

.oracle-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: #00f0ff;
  transform: translateY(-2px);
}

.btn-arrow {
  font-family: sans-serif;
  transition: transform 0.3s;
}

.start-engine-btn:hover .btn-arrow {
  transform: translateX(5px);
}

.btn-primary, .btn-secondary, .btn-tertiary, .btn-quaternary {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  margin-right: 12px;
  margin-bottom: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
}

.glow-text {
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(112, 0, 255, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 25px rgba(0, 240, 255, 0.6);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 5px 25px rgba(255, 255, 255, 0.2);
}

.btn-tertiary {
  background: transparent;
  color: #00f0ff;
  border: 1px solid #00f0ff;
}

.btn-tertiary:hover {
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 5px 25px rgba(0, 240, 255, 0.4);
}

.btn-quaternary {
  background: #ffcc00;
  color: #000;
  border: none;
}

.btn-quaternary:hover {
  background: #ffdb4d;
  transform: translateY(-2px);
  box-shadow: 0 5px 25px rgba(255, 204, 0, 0.6);
}

.simulation-module {
  margin-top: 50px;
  background: rgba(255, 255, 255, 0.03);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.simulation-module h3 {
  font-size: 1.1rem;
  color: #00f0ff;
  margin-top: 0;
  margin-bottom: 16px;
  font-family: var(--font-mono);
}

.sim-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sim-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
}

.sim-input:focus {
  outline: none;
  border-color: #00f0ff;
}

.hidden-file-input {
  display: none;
}

.btn-attach {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.2rem;
}

.btn-attach:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-simulate {
  background: #ff3366;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-simulate:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 51, 102, 0.4);
}

.btn-simulate:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.5;
}

.file-count-text {
  display: block;
  margin-top: 10px;
  color: #999;
  font-size: 0.85rem;
}

.hero-right {
  flex: 0.8;
  display: flex;
  justify-content: center;
}

.stats-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.stat-item h3 {
  font-family: var(--font-mono);
  font-size: 3rem;
  margin: 0 0 10px 0;
  background: linear-gradient(90deg, #00f0ff, #7000ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-item p {
  margin: 0;
  color: #888;
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

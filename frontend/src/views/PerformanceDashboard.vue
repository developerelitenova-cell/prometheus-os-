<template>
  <div class="performance-dashboard">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-link cursor-pointer">← Volver</button>
        <h1>Centro de Evaluación Corporativa (KPIs)</h1>
        <p>Balanced Scorecard & OKRs - Basado en la IA de PROMETHEUS OS</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedPeriod" class="glass-select">
          <optgroup label="Diario">
            <option :value="todayPeriod">Hoy ({{ todayLabel }})</option>
          </optgroup>
          <optgroup label="Semanal">
            <option :value="currentWeekPeriod">Semana actual ({{ currentWeekPeriod }})</option>
          </optgroup>
          <optgroup label="Mensual">
            <option :value="currentMonthPeriod">{{ currentMonthLabel }}</option>
          </optgroup>
          <optgroup label="Trimestral">
            <option value="2026-Q3">Trimestre Q3 - 2026</option>
            <option value="2026-Q2">Trimestre Q2 - 2026</option>
          </optgroup>
        </select>
        <button class="btn-primary" @click="refreshAll" :disabled="loading">
          {{ loading ? 'Actualizando...' : 'Refrescar Datos' }}
        </button>
      </div>
    </header>

    <div class="dashboard-layout">
      <!-- Selector Superior (Top Bar) -->
      <div class="glass-panel role-selector-bar">
        <h3>Seleccionar Rol</h3>
        <select v-model="selectedRoleId" class="glass-select full-width-select">
          <option value="" disabled>Elige un rol para analizar el rendimiento...</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.name }} ({{ role.areas?.name || 'General' }})
          </option>
        </select>
      </div>

      <!-- Panel Central: Métricas -->
      <main class="content full-width">
        <div v-if="loading" class="glass-panel welcome-state">
          <TechLoader text="Recopilando Métricas de Rendimiento" />
        </div>
        
        <div v-else-if="!selectedRole" class="glass-panel welcome-state">
          <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></span>
          <h2>Selecciona un rol en la barra superior</h2>
          <p>Para ver su historial de rendimiento, OKRs y el análisis predictivo de la IA.</p>
        </div>

        <div v-else class="metrics-grid">
          <!-- Fila 1: Resumen Inmediato -->
          <div class="row-1">
            <!-- Overview Card -->
            <div class="glass-panel overview-card">
              <div class="overview-header">
                <div>
                  <h2>{{ selectedRole.name }}</h2>
                  <span class="role-level-badge" :class="'level-' + selectedRole.access_level">Nivel {{ selectedRole.access_level }}</span>
                  <span class="area-tag">{{ selectedRole.areas?.name || 'General' }}</span>
                </div>
                <div class="score-circle" :class="getScoreColor(currentKpi.overall_score)">
                  <span class="score-number">{{ currentKpi.overall_score.toFixed(1) }}</span>
                  <span class="score-label">Global</span>
                </div>
              </div>
            </div>

            <!-- Insight Card -->
            <div class="glass-panel ai-insight-card">
              <div class="ai-insight">
                <h4><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg> PROMETHEUS OS Insight</h4>
                <p>{{ currentKpi.ai_evaluation_notes || 'La Inteligencia Artificial aún no ha generado observaciones para este periodo. Faltan datos de flujos operacionales.' }}</p>
              </div>
            </div>
          </div>

          <!-- Fila 2: Detalles Profundos -->
          <div class="row-2">
            <!-- Radar Chart para Balanced Scorecard -->
            <div class="glass-panel chart-card">
              <h3>Balanced Scorecard</h3>
              <div class="dimension-stats-grid" v-if="chartData.datasets.length > 0">
                <div class="dimension-stat">
                  <span class="dimension-value">{{ currentKpi.score_financial }}</span>
                  <span class="dimension-label">Financiero</span>
                </div>
                <div class="dimension-stat">
                  <span class="dimension-value">{{ currentKpi.score_customer }}</span>
                  <span class="dimension-label">Cliente</span>
                </div>
                <div class="dimension-stat">
                  <span class="dimension-value">{{ currentKpi.score_process }}</span>
                  <span class="dimension-label">Procesos</span>
                </div>
                <div class="dimension-stat">
                  <span class="dimension-value">{{ currentKpi.score_growth }}</span>
                  <span class="dimension-label">Crecimiento</span>
                </div>
              </div>
              <div class="chart-container">
                <Radar v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="no-data">Faltan datos de evaluación</div>
              </div>
            </div>

            <!-- OKRs -->
            <div class="glass-panel okr-card">
              <h3>OKRs (Objetivos y Resultados Clave)</h3>
              <div v-if="currentKpi.okr_details && currentKpi.okr_details.length > 0" class="okr-list">
                <div v-for="(okr, idx) in currentKpi.okr_details" :key="idx" class="okr-item-wrapper">
                  <div class="okr-title">
                    <strong>O:</strong> {{ okr.objective }}
                  </div>
                  <div class="kr-list">
                    <div v-for="(kr, kIdx) in okr.key_results" :key="kIdx" class="kr-item">
                      <span class="kr-text"><strong>KR:</strong> {{ kr.text }}</span>
                      <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: kr.progress + '%', background: getProgressColor(kr.progress) }"></div>
                      </div>
                      <span class="kr-progress">{{ kr.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-data">
                <p>No se han mapeado OKRs para este periodo.</p>
                <button class="btn-secondary" @click="generateAIKpis" :disabled="generatingKpi">
                  {{ generatingKpi ? 'Analizando con IA...' : 'Generar con IA' }}
                </button>
                <p v-if="kpiError" class="error-text">{{ kpiError }}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { Radar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

import TechLoader from '../components/TechLoader.vue';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const roles = ref([]);
const filteredRoles = ref([]);
const searchQuery = ref('');
const selectedRoleId = ref('');
const selectedRole = ref(null);
const loading = ref(false);
const selectedPeriod = ref('2026-Q3');

// Periodos "actuales" para las opciones Diario/Semanal/Mensual del filtro --
// evaluation_period es un texto libre (ver kpi_migration.sql), así que estos
// valores son válidos igual que los trimestres ya cargados a mano.
const todayPeriod = computed(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
const currentMonthPeriod = computed(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
const currentWeekPeriod = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); // jueves de la semana ISO actual
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
});
const todayLabel = computed(() => new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }));
const currentMonthLabel = computed(() => new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }));

// Default KPI si no existe en DB
const defaultKpi = {
  overall_score: 0,
  score_financial: 0,
  score_customer: 0,
  score_process: 0,
  score_growth: 0,
  okr_details: [],
  ai_evaluation_notes: null
};

const currentKpi = ref({ ...defaultKpi });
const generatingKpi = ref(false);
const kpiError = ref('');

onMounted(async () => {
  await fetchRoles();
});

watch(selectedRoleId, async (newId) => {
  if (newId) {
    const role = roles.value.find(r => r.id === newId);
    if (role) {
      await selectRole(role);
    }
  }
});

// Cambiar el período del filtro debe recargar el KPI del rol seleccionado --
// antes no había ningún watcher acá, así que el select no hacía nada visible.
watch(selectedPeriod, async () => {
  if (selectedRole.value) {
    loading.value = true;
    await fetchKpisForRole(selectedRole.value.id, selectedPeriod.value);
    loading.value = false;
  }
});

const fetchRoles = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*, areas(name)')
      .order('name');
      
    if (!error) {
      const uniqueRoles = [];
      const seen = new Set();
      for (const role of (data || [])) {
        const key = `${role.name}-${role.areas?.name || 'General'}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRoles.push(role);
        }
      }
      roles.value = uniqueRoles;
      filteredRoles.value = [...roles.value];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const selectRole = async (role) => {
  selectedRole.value = role;
  await fetchKpisForRole(role.id, selectedPeriod.value);
};

const fetchKpisForRole = async (roleId, period) => {
  try {
    const { data, error } = await supabase
      .from('role_kpis')
      .select('*')
      .eq('role_id', roleId)
      .eq('evaluation_period', period)
      .single();
      
    if (data) {
      currentKpi.value = {
        ...data,
        // The DB overall_score is generated, we ensure it's a number
        overall_score: data.overall_score || ((data.score_financial + data.score_customer + data.score_process + data.score_growth) / 4)
      };
    } else {
      // Si no hay datos, mostrar valores en 0
      currentKpi.value = { ...defaultKpi };
    }
  } catch (error) {
    currentKpi.value = { ...defaultKpi };
  }
};

// "Refrescar Datos": recarga el directorio de roles y, si hay uno seleccionado,
// también su KPI del período actual (antes el botón solo recargaba el directorio).
const refreshAll = async () => {
  await fetchRoles();
  if (selectedRole.value) {
    await fetchKpisForRole(selectedRole.value.id, selectedPeriod.value);
  }
};

const generateAIKpis = async () => {
  if (!selectedRole.value || generatingKpi.value) return;
  generatingKpi.value = true;
  kpiError.value = '';

  try {
    const response = await fetch('/api/generate-kpi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId: selectedRole.value.id, period: selectedPeriod.value })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo generar la evaluación.');
    }

    // Recargar desde la base de datos para reflejar exactamente lo persistido
    await fetchKpisForRole(selectedRole.value.id, selectedPeriod.value);
  } catch (error) {
    console.error(error);
    kpiError.value = error.message || 'Error generando la evaluación con IA.';
  } finally {
    generatingKpi.value = false;
  }
};

// Utils para estilos
const getScoreColor = (score) => {
  if (score === 0) return 'gray';
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
};

const getProgressColor = (progress) => {
  if (progress >= 85) return '#34c759'; // var(--success)
  if (progress >= 50) return '#ff9500'; // var(--warning)
  return '#ff3b30'; // var(--danger)
};

// Configuración del Radar Chart (Chart.js)
const chartData = computed(() => {
  if (currentKpi.value.overall_score === 0) return { datasets: [] };
  
  return {
    labels: ['Financiero', 'Cliente', 'Procesos', 'Crecimiento/Aprendizaje'],
    datasets: [
      {
        label: `Rendimiento - ${selectedPeriod.value}`,
        backgroundColor: 'rgba(176, 141, 87, 0.2)', // var(--gold) tint
        borderColor: '#b08d57', // var(--gold)
        pointBackgroundColor: '#b08d57',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#b08d57',
        data: [
          currentKpi.value.score_financial,
          currentKpi.value.score_customer,
          currentKpi.value.score_process,
          currentKpi.value.score_growth
        ]
      },
      // Target Baseline
      {
        label: 'Meta Corporativa',
        backgroundColor: 'rgba(134, 134, 139, 0.08)', // neutral reference tint
        borderColor: 'rgba(134, 134, 139, 0.5)', // var(--text-tertiary)
        borderDash: [5, 5],
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        data: [80, 80, 80, 80]
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: { color: '#e8e8ed' }, // var(--border-subtle)
      grid: { color: '#e8e8ed' }, // var(--border-subtle)
      pointLabels: { color: '#6e6e73', font: { size: 12, family: "'Inter', sans-serif" } }, // var(--text-secondary)
      ticks: {
        color: 'transparent',
        backdropColor: 'transparent',
        min: 0,
        max: 100,
        stepSize: 20
      }
    }
  },
  plugins: {
    legend: { labels: { color: '#1d1d1f' } } // var(--ink)
  }
};
</script>

<style scoped>
.performance-dashboard {
  padding: 24px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-primary);
  color: var(--ink);
  font-family: var(--font-sans);
}

.glass.okr-item-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
}

.okr-title {
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 16px;
  font-size: 1.05rem;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}

.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.95rem;
  margin-bottom: 8px;
  display: inline-block;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-link:hover {
  transform: translateX(-2px);
}

.hub-header h1 {
  font-size: 1.8rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
}

.hub-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.glass-select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-family: inherit;
}

.glass-select:focus {
  outline: none;
  border-color: var(--gold);
}

.btn-primary {
  background: var(--gold-gradient);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold-deep);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--gold) 12%, transparent);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  color: var(--danger);
  margin-top: 8px;
  font-size: 0.9rem;
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.role-selector-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
}

.role-selector-bar h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.full-width-select {
  flex: 1;
  font-size: 1.05rem;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  color: var(--ink);
  border-radius: var(--radius-sm);
  outline: none;
}
.full-width-select:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold) 18%, transparent);
}

/* Sidebar */
.sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar h3 {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--gold-deep);
}

.search-input {
  margin: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--ink);
  padding: 10px;
  border-radius: var(--radius-sm);
  font-family: inherit;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.sidebar li {
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
}

.sidebar li:hover {
  background: var(--bg-secondary);
  border-left-color: color-mix(in srgb, var(--gold) 30%, transparent);
}

.sidebar li.active {
  background: color-mix(in srgb, var(--gold) 10%, transparent);
  border-left: 3px solid var(--gold);
  box-shadow: none;
}

.role-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--ink);
  letter-spacing: 0.3px;
}

.role-area {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Main Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px;
  min-height: 400px;
}

.welcome-state .icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.row-1 {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.overview-card, .ai-insight-card, .chart-card, .okr-card {
  display: flex;
  flex-direction: column;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.overview-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
}

.role-level-badge {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.role-level-badge.level-1 { background: var(--danger); }
.role-level-badge.level-2 { background: var(--warning); }
.role-level-badge.level-3 { background: var(--success); }

.area-tag {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.dimension-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.dimension-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.dimension-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-mono);
}

.dimension-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-tertiary);
  text-align: center;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--border);
}

.score-circle.green { border-color: var(--success); box-shadow: var(--shadow-sm); }
.score-circle.yellow { border-color: var(--warning); box-shadow: var(--shadow-sm); }
.score-circle.red { border-color: var(--danger); box-shadow: var(--shadow-sm); }
.score-circle.gray { border-color: var(--border); }

.score-number {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.ai-insight {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--gold);
  padding: 24px;
  border-radius: var(--radius-sm);
  height: 100%;
}

.ai-insight h4 {
  color: var(--gold-deep);
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-insight p {
  color: var(--ink-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
}

.chart-card, .okr-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-card h3, .okr-card h3 {
  margin: 0 0 20px 0;
  color: var(--ink);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}

.chart-container {
  flex: 1;
  min-height: 250px;
  position: relative;
}

.no-data {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-style: italic;
  gap: 16px;
}

.okr-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.okr-item {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-sm);
}

.okr-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--gold-deep);
}

.kr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kr-item {
  display: grid;
  grid-template-columns: 1fr 140px 50px;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
  color: var(--ink-secondary);
}

.progress-bar-container {
  height: 8px;
  background: var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.kr-progress {
  text-align: right;
  font-weight: bold;
}
</style>

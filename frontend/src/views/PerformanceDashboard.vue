<template>
  <div class="performance-dashboard">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <router-link to="/data-hub" class="back-link">← Volver al DataHub</router-link>
        <h1>Centro de Evaluación Corporativa (KPIs)</h1>
        <p>Balanced Scorecard & OKRs - Basado en la IA de PROMETHEUS OS</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedPeriod" class="glass-select">
          <option value="2026-Q3">Trimestre Q3 - 2026</option>
          <option value="2026-Q2">Trimestre Q2 - 2026</option>
        </select>
        <button class="btn-primary" @click="fetchKpis" :disabled="loading">
          {{ loading ? 'Actualizando...' : 'Refrescar Datos' }}
        </button>
      </div>
    </header>

    <div class="dashboard-layout">
      <!-- Panel Izquierdo: Selección de Rol -->
      <aside class="glass-panel sidebar">
        <h3>Roles Disponibles</h3>
        <input type="text" v-model="searchQuery" placeholder="Buscar rol..." class="search-input" />
        
        <ul v-if="filteredRoles.length > 0">
          <li v-for="role in filteredRoles" :key="role.id" 
              @click="selectRole(role)" 
              :class="{ active: selectedRole?.id === role.id }">
            <span class="role-name">{{ role.name }}</span>
            <span class="role-area">{{ role.areas?.name || 'General' }}</span>
          </li>
        </ul>
        <div v-else class="empty-state">No hay roles</div>
      </aside>

      <!-- Panel Central: Métricas -->
      <main class="content">
        <div v-if="!selectedRole" class="glass-panel welcome-state">
          <span class="icon">📈</span>
          <h2>Selecciona un rol a la izquierda</h2>
          <p>Para ver su historial de rendimiento, OKRs y el análisis predictivo de la IA.</p>
        </div>

        <div v-else class="metrics-grid">
          <!-- Overview Card -->
          <div class="glass-panel overview-card">
            <div class="overview-header">
              <div>
                <h2>{{ selectedRole.name }}</h2>
                <span class="badge">Nivel {{ selectedRole.access_level }}</span>
              </div>
              <div class="score-circle" :class="getScoreColor(currentKpi.overall_score)">
                <span class="score-number">{{ currentKpi.overall_score.toFixed(1) }}</span>
                <span class="score-label">Rendimiento</span>
              </div>
            </div>
            
            <div class="ai-insight">
              <h4>🤖 Prometheus Insight</h4>
              <p>{{ currentKpi.ai_evaluation_notes || 'La Inteligencia Artificial aún no ha generado observaciones para este periodo. Faltan datos de flujos operacionales.' }}</p>
            </div>
          </div>

          <!-- Radar Chart para Balanced Scorecard -->
          <div class="glass-panel chart-card">
            <h3>Balanced Scorecard</h3>
            <div class="chart-container">
              <Radar v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
              <div v-else class="no-data">Faltan datos de evaluación</div>
            </div>
          </div>

          <!-- OKRs -->
          <div class="glass-panel okr-card">
            <h3>OKRs (Objetivos y Resultados Clave)</h3>
            <div v-if="currentKpi.okr_details && currentKpi.okr_details.length > 0" class="okr-list">
              <div v-for="(okr, idx) in currentKpi.okr_details" :key="idx" class="okr-item">
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
const selectedRole = ref(null);
const loading = ref(false);
const selectedPeriod = ref('2026-Q3');

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

watch(searchQuery, (newVal) => {
  if (!newVal) {
    filteredRoles.value = roles.value;
  } else {
    const q = newVal.toLowerCase();
    filteredRoles.value = roles.value.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.areas?.name || '').toLowerCase().includes(q)
    );
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
      roles.value = data || [];
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

const fetchKpis = async () => {
  if (selectedRole.value) {
    loading.value = true;
    await fetchKpisForRole(selectedRole.value.id, selectedPeriod.value);
    loading.value = false;
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
  if (progress >= 85) return '#00ff99';
  if (progress >= 50) return '#00f0ff';
  return '#ff3366';
};

// Configuración del Radar Chart (Chart.js)
const chartData = computed(() => {
  if (currentKpi.value.overall_score === 0) return { datasets: [] };
  
  return {
    labels: ['Financiero', 'Cliente', 'Procesos', 'Crecimiento/Aprendizaje'],
    datasets: [
      {
        label: `Rendimiento - ${selectedPeriod.value}`,
        backgroundColor: 'rgba(0, 240, 255, 0.2)',
        borderColor: '#00f0ff',
        pointBackgroundColor: '#00f0ff',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00f0ff',
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
        backgroundColor: 'rgba(112, 0, 255, 0.1)',
        borderColor: 'rgba(112, 0, 255, 0.5)',
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
      angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      pointLabels: { color: '#a0a0b0', font: { size: 12, family: "'Space Grotesk', sans-serif" } },
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
    legend: { labels: { color: '#fff' } }
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
  background: #12121a;
  color: #fff;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
}

.back-link {
  color: #00f0ff;
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: inline-block;
}

.hub-header h1 {
  font-size: 1.5rem;
  background: linear-gradient(90deg, #00f0ff, #7000ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.hub-header p {
  color: #999;
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.glass-select {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: inherit;
}

.glass-select:focus {
  outline: none;
  border-color: #00f0ff;
}

.btn-primary {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #00f0ff;
  color: #00f0ff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(0, 240, 255, 0.1);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  color: #ff3366;
  margin-top: 8px;
  font-size: 0.9rem;
}

.dashboard-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #00f0ff;
}

.search-input {
  margin: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 10px;
  border-radius: 6px;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.sidebar li:hover {
  background: rgba(255, 255, 255, 0.02);
}

.sidebar li.active {
  background: rgba(0, 240, 255, 0.1);
  border-left: 3px solid #00f0ff;
}

.role-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.role-area {
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
}

/* Main Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a0a0b0;
  text-align: center;
}

.welcome-state .icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.overview-card {
  grid-column: 1 / -1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 4px solid #333;
}

.score-circle.green { border-color: #00ff99; box-shadow: 0 0 15px rgba(0,255,153,0.3); }
.score-circle.yellow { border-color: #ffcc00; box-shadow: 0 0 15px rgba(255,204,0,0.3); }
.score-circle.red { border-color: #ff3366; box-shadow: 0 0 15px rgba(255,51,102,0.3); }
.score-circle.gray { border-color: #444; }

.score-number {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #999;
  margin-top: 4px;
}

.ai-insight {
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-left: 4px solid #00f0ff;
  padding: 16px;
  border-radius: 0 8px 8px 0;
}

.ai-insight h4 {
  color: #00f0ff;
  margin: 0 0 8px 0;
}

.ai-insight p {
  margin: 0;
  color: #ddd;
  line-height: 1.5;
  font-size: 0.95rem;
}

.chart-card, .okr-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-card h3, .okr-card h3 {
  margin: 0 0 20px 0;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #666;
  font-style: italic;
  gap: 16px;
}

.okr-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.okr-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
}

.okr-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: #00f0ff;
}

.kr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kr-item {
  display: grid;
  grid-template-columns: 1fr 100px 40px;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
}

.progress-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
}

.kr-progress {
  text-align: right;
  font-weight: bold;
}
</style>

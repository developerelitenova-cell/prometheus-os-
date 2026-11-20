<template>
  <div data-testid="personal-kpi-panel" class="p-5 sm:p-6 space-y-5">
    <!-- Barra de Controles: Período, Tipo de Gráfico y Exportación Feedback -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#e5e5ea]">
      <!-- Selector Semanal / Quincenal / Mensual -->
      <div class="flex flex-wrap items-center gap-1.5 bg-[#f5f5f7] p-1 rounded-xl border border-[#e5e5ea]">
        <button
          v-for="opt in rangeOptions"
          :key="opt.key"
          type="button"
          :data-testid="`kpi-range-${opt.key}`"
          @click="selectedRange = opt.key"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            selectedRange === opt.key
              ? 'bg-white text-[#1d1d1f] shadow-xs'
              : 'text-[#86868b] hover:text-[#1d1d1f]',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Tipo de Gráfico + Exportar para Feedback -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-0.5 text-[11px] font-bold">
          <button
            type="button"
            @click="chartMode = 'line'"
            :class="[
              'px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer',
              chartMode === 'line' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#86868b]',
            ]"
          >
            <span class="material-symbols-outlined text-[14px]">show_chart</span>
            <span>Línea</span>
          </button>
          <button
            type="button"
            @click="chartMode = 'bar'"
            :class="[
              'px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer',
              chartMode === 'bar' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#86868b]',
            ]"
          >
            <span class="material-symbols-outlined text-[14px]">bar_chart</span>
            <span>Barras</span>
          </button>
        </div>

        <button
          type="button"
          data-testid="export-kpi-excel-btn"
          @click="handleExportExcel"
          class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Descargar gráfico e historial en Excel para feedback"
        >
          <span class="material-symbols-outlined text-[15px]">table_view</span>
          <span>Excel</span>
        </button>

        <button
          type="button"
          data-testid="export-kpi-word-btn"
          @click="handleExportWord"
          class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0071e3] border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="Descargar informe de retroalimentación en Word"
        >
          <span class="material-symbols-outlined text-[15px]">description</span>
          <span>Word</span>
        </button>
      </div>
    </div>

    <!-- 4 Tarjetas Resumen de KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-2xl bg-[#fbfbfd] border border-[#e5e5ea] p-3.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block">Promedio KPI</span>
        <div class="flex items-baseline justify-between gap-2 mt-1">
          <span data-testid="kpi-panel-avg" class="text-2xl font-black text-[#1d1d1f]">
            {{ series.summary.averageCompliance !== null ? `${series.summary.averageCompliance}%` : 'N/A' }}
          </span>
        </div>
        <span
          class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="statusBadgeClasses"
        >
          {{ series.summary.statusLabel }}
        </span>
      </div>

      <div class="rounded-2xl bg-[#fbfbfd] border border-[#e5e5ea] p-3.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block">Tendencia</span>
        <span
          class="text-2xl font-black mt-1 block"
          :class="
            series.summary.trendDelta === null
              ? 'text-[#86868b]'
              : series.summary.trendDelta >= 0
              ? 'text-[#248a3d]'
              : 'text-[#d70015]'
          "
        >
          {{
            series.summary.trendDelta !== null
              ? `${series.summary.trendDelta >= 0 ? '+' : ''}${series.summary.trendDelta}%`
              : 'N/A'
          }}
        </span>
        <span class="text-[11px] text-[#86868b] mt-1 block">Meta corporativa: ≥ {{ series.target }}%</span>
      </div>

      <div class="rounded-2xl bg-[#fbfbfd] border border-[#e5e5ea] p-3.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block">Días Cerrados</span>
        <span class="text-2xl font-black text-[#1d1d1f] mt-1 block">
          {{ series.summary.closedDaysCount }}
        </span>
        <span class="text-[11px] text-[#86868b] mt-1 block">
          De {{ series.summary.activeDaysCount }} jornadas con actividad
        </span>
      </div>

      <div class="rounded-2xl bg-[#fbfbfd] border border-[#e5e5ea] p-3.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#86868b] block">Tareas Cumplidas</span>
        <span class="text-2xl font-black text-[#1d1d1f] mt-1 block">
          {{ series.summary.totalCompleted }}
          <span class="text-sm font-semibold text-[#86868b]">/ {{ series.summary.totalTasks }}</span>
        </span>
        <span class="text-[11px] text-[#86868b] mt-1 block">
          No ejecutadas: {{ series.summary.totalUnfulfilled }}
        </span>
      </div>
    </div>

    <!-- Contenedor del Gráfico Chart.js (con fallback SVG/HTML para entornos sin Canvas 2D) -->
    <div class="rounded-2xl border border-[#e5e5ea] bg-white p-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="text-xs font-bold text-[#1d1d1f]">Evolución de Cumplimiento — {{ series.rangeLabel }}</h4>
          <p class="text-[11px] text-[#86868b]">{{ series.startDate }} a {{ series.endDate }} · Línea punteada = Meta 85%</p>
        </div>
        <span v-if="series.summary.bestDay" class="text-[11px] font-semibold text-[#8a6d3d] bg-[#b08d57]/10 px-2.5 py-1 rounded-full">
          Mejor día: {{ series.summary.bestDay.label }} ({{ series.summary.bestDay.compliance }}%)
        </span>
      </div>

      <div v-if="series.summary.activeDaysCount === 0" class="py-10 text-center space-y-2">
        <span class="material-symbols-outlined text-[34px] text-[#d1d1d6]">analytics</span>
        <p class="text-xs font-semibold text-[#86868b]">
          Aún no hay cierres de jornada ni actividades registradas en {{ series.rangeLabel.toLowerCase() }}.
        </p>
        <p class="text-[11px] text-[#86868b]">
          Al marcar tareas o pulsar «Guardar y Cerrar Día», el gráfico histórico se actualizará automáticamente.
        </p>
      </div>

      <div v-else class="h-64 w-full relative">
        <component
          v-if="hasCanvas2d"
          :is="chartMode === 'bar' ? Bar : Line"
          :data="chartData"
          :options="chartOptions"
        />

        <!-- Fallback HTML/CSS accesible cuando Canvas 2D no está disponible (ej. tests jsdom) -->
        <div
          v-else
          data-testid="kpi-chart-fallback"
          class="h-full w-full flex items-end gap-1.5 pt-6 pb-2 px-2 border-b border-l border-[#e5e5ea]"
        >
          <div
            v-for="pt in series.points"
            :key="pt.date"
            class="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
            :title="`${pt.date}: ${pt.compliance !== null ? pt.compliance + '%' : 'Sin registro'}`"
          >
            <div class="w-full flex-1 flex items-end justify-center">
              <div
                class="w-full max-w-[18px] rounded-t-md transition-all"
                :class="
                  pt.compliance === null
                    ? 'bg-gray-100 h-1'
                    : pt.compliance >= 85
                    ? 'bg-[#34c759]'
                    : pt.compliance >= 65
                    ? 'bg-[#b08d57]'
                    : 'bg-[#ff3b30]'
                "
                :style="{ height: pt.compliance !== null ? `${Math.max(6, Math.min(100, pt.compliance))}%` : '4px' }"
              ></div>
            </div>
            <span class="text-[9px] text-[#86868b] truncate w-full text-center">{{ pt.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Compacta del Historial Diario -->
    <div v-if="activeHistoryRows.length > 0" class="rounded-2xl border border-[#e5e5ea] overflow-hidden">
      <div class="px-4 py-2.5 bg-[#fbfbfd] border-b border-[#e5e5ea] flex items-center justify-between">
        <span class="text-xs font-bold text-[#1d1d1f]">Detalle de Jornadas en el Período</span>
        <span class="text-[11px] text-[#86868b]">Insumo oficial para sesiones de feedback</span>
      </div>
      <div class="overflow-x-auto max-h-60 overflow-y-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#f5f5f7] text-[#86868b] uppercase text-[10px] font-bold sticky top-0">
            <tr>
              <th class="px-4 py-2">Fecha</th>
              <th class="px-4 py-2 text-center">Cumplimiento</th>
              <th class="px-4 py-2 text-center">Completadas</th>
              <th class="px-4 py-2 text-center">No Ejecutadas</th>
              <th class="px-4 py-2 text-right">Cierre</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f2f2f7]">
            <tr v-for="row in activeHistoryRows" :key="row.date" class="hover:bg-[#fbfbfd]">
              <td class="px-4 py-2 font-semibold text-[#1d1d1f]">{{ row.date }}</td>
              <td class="px-4 py-2 text-center font-bold">
                <span
                  :class="
                    row.compliance >= 85
                      ? 'text-[#248a3d]'
                      : row.compliance >= 65
                      ? 'text-[#b46b00]'
                      : 'text-[#d70015]'
                  "
                >
                  {{ row.compliance }}%
                </span>
              </td>
              <td class="px-4 py-2 text-center text-[#5e6c84]">{{ row.completed }} / {{ row.total }}</td>
              <td class="px-4 py-2 text-center text-[#5e6c84]">{{ row.unfulfilled }}</td>
              <td class="px-4 py-2 text-right">
                <span
                  v-if="row.isClosed"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/15 text-[#248a3d]"
                >
                  Consolidado
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0071e3]"
                >
                  En progreso
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Line, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { buildPersonalKpiSeries } from '../utils/personalKpiSeries';
import { exportKpiFeedbackExcel, exportKpiFeedbackWord } from '../utils/reportExporter';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

const props = defineProps({
  profile: { type: Object, default: null },
  role: { type: Object, default: null },
  dailyClosings: { type: Array, default: () => [] },
  taskCompletions: { type: Array, default: () => [] },
  dailyTemplatesCount: { type: Number, default: 0 },
  adHocTasks: { type: Array, default: () => [] },
  referenceDate: { type: String, default: '' },
});

const emit = defineEmits(['exported']);

const selectedRange = ref('weekly');
const chartMode = ref('line');

const rangeOptions = [
  { key: 'weekly', label: 'Semanal (7d)' },
  { key: 'biweekly', label: 'Quincenal (15d)' },
  { key: 'monthly', label: 'Mensual (30d)' },
];

const hasCanvas2d = (() => {
  try {
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
      return false;
    }
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return Boolean(canvas && typeof canvas.getContext === 'function' && canvas.getContext('2d'));
  } catch {
    return false;
  }
})();

const series = computed(() =>
  buildPersonalKpiSeries({
    range: selectedRange.value,
    referenceDateStr: props.referenceDate || null,
    dailyClosings: props.dailyClosings,
    taskCompletions: props.taskCompletions,
    dailyTemplatesCount: props.dailyTemplatesCount,
    adHocTasks: props.adHocTasks,
  })
);

const statusBadgeClasses = computed(() => {
  const k = series.value.summary.statusKey;
  if (k === 'pass') return 'bg-[#e3fcef] text-[#006644]';
  if (k === 'warn') return 'bg-amber-50 text-amber-800 border border-amber-200';
  if (k === 'fail') return 'bg-[#ffebee] text-[#c62828]';
  return 'bg-gray-100 text-gray-600';
});

const activeHistoryRows = computed(() =>
  [...(series.value.points || [])].filter((p) => p.compliance !== null).reverse()
);

const chartData = computed(() => {
  const s = series.value;
  const targetLine = new Array(s.labels.length).fill(s.target);

  if (chartMode.value === 'bar') {
    const barColors = s.values.map((v) => {
      if (v === null) return 'rgba(209, 213, 219, 0.35)';
      if (v >= 85) return 'rgba(52, 199, 89, 0.8)';
      if (v >= 65) return 'rgba(176, 141, 87, 0.85)';
      return 'rgba(255, 59, 48, 0.8)';
    });
    return {
      labels: s.labels,
      datasets: [
        {
          label: 'Cumplimiento (%)',
          backgroundColor: barColors,
          borderRadius: 6,
          data: s.values.map((v) => (v === null ? 0 : v)),
        },
        {
          type: 'line',
          label: 'Meta (85%)',
          borderColor: 'rgba(134, 134, 139, 0.7)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false,
          data: targetLine,
        },
      ],
    };
  }

  return {
    labels: s.labels,
    datasets: [
      {
        label: 'Cumplimiento (%)',
        borderColor: '#b08d57',
        backgroundColor: 'rgba(176, 141, 87, 0.16)',
        pointBackgroundColor: '#b08d57',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
        spanGaps: true,
        data: s.values,
      },
      {
        label: 'Meta Corporativa (85%)',
        borderColor: 'rgba(134, 134, 139, 0.65)',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 1.5,
        fill: false,
        data: targetLine,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed.y;
          return `${ctx.dataset.label}: ${val !== null && val !== undefined ? val + '%' : 'Sin registro'}`;
        },
      },
    },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: {
        callback: (val) => `${val}%`,
        font: { size: 10 },
      },
      grid: { color: '#f2f2f7' },
    },
    x: {
      ticks: { font: { size: 10 }, maxRotation: 0 },
      grid: { display: false },
    },
  },
};

const handleExportExcel = () => {
  const res = exportKpiFeedbackExcel({
    userName: props.profile?.full_name || 'Colaborador',
    roleName: props.role?.name || 'Cargo Operativo',
    series: series.value,
  });
  emit('exported', { format: 'excel', ...res });
};

const handleExportWord = () => {
  const res = exportKpiFeedbackWord({
    userName: props.profile?.full_name || 'Colaborador',
    roleName: props.role?.name || 'Cargo Operativo',
    series: series.value,
  });
  emit('exported', { format: 'word', ...res });
};
</script>

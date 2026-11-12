<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased overflow-x-hidden pb-20 lg:pb-0">
    <main class="max-w-[1440px] mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#1d1d1f] text-[#d4b06a] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[28px]">query_stats</span>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                Informes de Rendimiento & Medición KPI
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#b08d57]/15 text-[#8a6d3d] border border-[#b08d57]/30">
                {{ scopeLabel }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-[#86868b] mt-0.5">
              Cálculo automático de KPIs sobre actividades reales + análisis ejecutivo con Agente IA (America/Bogota UTC-5)
            </p>
          </div>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-2.5">
          <select
            v-model="filters.periodType"
            data-testid="report-period-type"
            class="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-bold outline-none focus:border-[#b08d57]"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
          </select>

          <input
            v-model="filters.referenceDate"
            type="date"
            data-testid="report-ref-date"
            class="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold outline-none focus:border-[#b08d57]"
          />

          <select
            v-if="canSelectAnyArea"
            v-model="filters.areaId"
            data-testid="report-area-filter"
            class="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todas las áreas</option>
            <option v-for="a in areasList" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>

          <select
            v-model="filters.userId"
            data-testid="report-user-filter"
            class="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-semibold outline-none focus:border-[#b08d57]"
          >
            <option value="all">Todo el equipo</option>
            <option v-for="u in scopedUsers" :key="u.id" :value="u.id">{{ u.full_name }}</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-3xl border border-[#e5e5ea] p-12 text-center text-sm text-[#86868b]">
        Calculando indicadores de rendimiento...
      </div>

      <template v-else-if="report">
        <!-- Tarjetas de KPI del Catálogo (Req. 2.8) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="kpi in report.kpis"
            :key="kpi.key"
            :data-testid="`kpi-card-${kpi.key}`"
            class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs p-5 space-y-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-[#86868b]">{{ kpi.name }}</p>
                <p class="text-[11px] text-[#86868b] mt-0.5">{{ kpi.formula }}</p>
              </div>
              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase shrink-0"
                :class="kpiStatusBadge(kpi.status)"
              >
                {{ kpiStatusLabel(kpi.status) }}
              </span>
            </div>

            <div class="flex items-baseline justify-between pt-1">
              <span class="text-3xl font-black tracking-tight text-[#1d1d1f]" :data-testid="`kpi-value-${kpi.key}`">
                {{ kpi.value === null ? 'N/A' : `${kpi.value}%` }}
              </span>
              <span class="text-xs font-semibold text-[#5e6c84]">
                Meta: {{ kpi.operator }} {{ kpi.target }}{{ kpi.unit }}
              </span>
            </div>
          </div>
        </div>

        <!-- Resumen de Conteo -->
        <div class="bg-white rounded-2xl border border-[#e5e5ea] shadow-xs px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span class="font-bold text-[#1d1d1f]">{{ report.period.label }}</span>
          <div class="flex flex-wrap items-center gap-4 text-[#5e6c84]">
            <span>Programadas aplicables: <strong class="text-[#1d1d1f]">{{ report.summary.total_scheduled }}</strong></span>
            <span>Completadas: <strong class="text-[#248a3d]">{{ report.summary.completed }}</strong></span>
            <span>A tiempo: <strong class="text-[#0071e3]">{{ report.summary.on_time }}</strong></span>
            <span>Vencidas: <strong class="text-[#d70015]">{{ report.summary.overdue }}</strong></span>
            <span>Excluidas N/A: <strong class="text-[#1d1d1f]">{{ report.summary.na_excluded }}</strong></span>
          </div>
        </div>

        <!-- Panel Agente IA para Toma de Decisiones (Req. 2.5) -->
        <div class="bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e] text-white rounded-3xl p-6 shadow-lg space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-[#b08d57]/20 border border-[#b08d57]/40 flex items-center justify-center text-[#e8d9b5]">
                <span class="material-symbols-outlined text-[24px]">auto_awesome</span>
              </div>
              <div>
                <h2 class="text-base font-bold text-white">Agente IA — Resumen Ejecutivo de Rendimiento</h2>
                <p class="text-xs text-gray-300">
                  Diagnóstico basado estrictamente en los KPIs y actividades del período consultado
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="generate-ai-report-btn"
              @click="generateAiAnalysis"
              :disabled="aiLoading"
              class="px-5 py-2.5 rounded-xl bg-[#b08d57] hover:bg-[#8a6d3d] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <span v-if="aiLoading" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-[16px]">psychology</span>
              <span>{{ aiLoading ? 'Analizando métricas...' : 'Generar Análisis con Agente IA' }}</span>
            </button>
          </div>

          <div v-if="aiAnalysis" data-testid="ai-analysis-panel" class="bg-white/10 border border-white/15 rounded-2xl p-5 space-y-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#e8d9b5]">Resumen Ejecutivo</span>
              <p class="text-sm text-white/95 leading-relaxed mt-1">{{ aiAnalysis.executive_summary }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#e8d9b5] mb-2">Hallazgos Clave</h4>
                <ul class="space-y-1.5 text-xs text-gray-200 list-disc pl-4">
                  <li v-for="(f, idx) in aiAnalysis.key_findings" :key="'f-' + idx">{{ f }}</li>
                </ul>
              </div>
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">Cuellos de Botella</h4>
                <ul v-if="aiAnalysis.bottlenecks?.length" class="space-y-1.5 text-xs text-gray-200 list-disc pl-4">
                  <li v-for="(b, idx) in aiAnalysis.bottlenecks" :key="'b-' + idx">{{ b }}</li>
                </ul>
                <p v-else class="text-xs text-gray-400 italic">Sin cuellos de botella críticos detectados.</p>
              </div>
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">Recomendaciones</h4>
                <ul class="space-y-1.5 text-xs text-gray-200 list-disc pl-4">
                  <li v-for="(r, idx) in aiAnalysis.recommendations" :key="'r-' + idx">{{ r }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Desglose por Colaborador y Cuellos de Botella -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-3xl border border-[#e5e5ea] shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-[#e5e5ea] bg-[#fbfbfd]">
              <h3 class="text-sm font-bold text-[#1d1d1f]">Desglose por Colaborador</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#f5f5f7] text-[#86868b] uppercase text-[10px] font-bold">
                  <tr>
                    <th class="px-4 py-3">Colaborador</th>
                    <th class="px-4 py-3">Área</th>
                    <th class="px-4 py-3 text-center">Programadas</th>
                    <th class="px-4 py-3 text-center">Cumplimiento</th>
                    <th class="px-4 py-3 text-center">Puntualidad</th>
                    <th class="px-4 py-3 text-center">Vencidas</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#e5e5ea]">
                  <tr v-for="u in report.by_user" :key="u.user_id" class="hover:bg-[#fbfbfd]">
                    <td class="px-4 py-3 font-semibold text-[#1d1d1f]">{{ u.full_name }}</td>
                    <td class="px-4 py-3 text-[#5e6c84]">{{ u.area_name }}</td>
                    <td class="px-4 py-3 text-center font-medium">{{ u.summary.total_scheduled }}</td>
                    <td class="px-4 py-3 text-center font-bold">
                      {{ u.compliance_rate === null ? 'N/A' : `${u.compliance_rate}%` }}
                    </td>
                    <td class="px-4 py-3 text-center font-bold">
                      {{ u.on_time_rate === null ? 'N/A' : `${u.on_time_rate}%` }}
                    </td>
                    <td class="px-4 py-3 text-center font-bold text-[#d70015]">
                      {{ u.overdue_rate === null ? 'N/A' : `${u.overdue_rate}%` }}
                    </td>
                  </tr>
                  <tr v-if="!report.by_user.length">
                    <td colspan="6" class="px-4 py-8 text-center text-[#86868b] italic">
                      No hay registros de actividades para este período y filtros.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-[#e5e5ea] bg-[#fff5f5]">
              <h3 class="text-sm font-bold text-[#c62828]">Actividades Vencidas (Cuellos de Botella)</h3>
            </div>
            <div class="p-4 space-y-2.5 max-h-[360px] overflow-y-auto">
              <div
                v-for="b in report.bottlenecks"
                :key="b.id"
                class="p-3 rounded-xl bg-[#fff5f5]/70 border border-[#ffcdd2] text-xs space-y-1"
              >
                <p class="font-bold text-[#1d1d1f]">{{ b.title }}</p>
                <div class="flex items-center justify-between text-[11px] text-[#5e6c84]">
                  <span>{{ b.assignee_name }}</span>
                  <span class="text-[#c62828] font-semibold">Venció: {{ b.due_date }}</span>
                </div>
              </div>
              <p v-if="!report.bottlenecks.length" class="py-8 text-center text-xs text-[#86868b] italic">
                Sin actividades vencidas en este período.
              </p>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import { getBogotaDateStr } from '../utils/bogotaTime';
import {
  getPeriodBoundsBogota,
  calculateKpisFromActivities,
  buildLocalGroundedAnalysis,
} from '../utils/kpiCalculator';

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const loading = ref(true);
const aiLoading = ref(false);
const report = ref(null);
const aiAnalysis = ref(null);

const areasList = ref([]);
const profilesList = ref([]);

const filters = ref({
  periodType: 'monthly',
  referenceDate: getBogotaDateStr(),
  areaId: 'all',
  userId: 'all',
});

const isMaster = computed(() => Boolean(currentProfile.value?.is_master_admin));
const accessLevel = computed(() => currentProfile.value?.roles?.access_level ?? 3);
const isAreaLeader = computed(() => !isMaster.value && accessLevel.value === 2);
const leaderAreaId = computed(() => currentProfile.value?.roles?.area_id || null);
const canSelectAnyArea = computed(() => isMaster.value || accessLevel.value === 1);

const scopeLabel = computed(() => {
  if (isMaster.value) return 'Alcance Global · Master Admin';
  if (accessLevel.value === 1) return 'Alcance Gerencia · Nivel 1';
  if (isAreaLeader.value) return `Líder de Área · ${currentProfile.value?.roles?.areas?.name || 'Mi Área'}`;
  return 'Control';
});

const scopedUsers = computed(() => {
  let list = profilesList.value;
  if (isAreaLeader.value && leaderAreaId.value) {
    list = list.filter((p) => p.roles?.area_id === leaderAreaId.value);
  } else if (filters.value.areaId !== 'all') {
    list = list.filter((p) => p.roles?.area_id === filters.value.areaId);
  }
  return list;
});

const kpiStatusLabel = (s) => ({ pass: 'En Meta', fail: 'Bajo Meta', na: 'N/A' }[s] || 'N/A');
const kpiStatusBadge = (s) => {
  if (s === 'pass') return 'bg-[#e3fcef] text-[#006644]';
  if (s === 'fail') return 'bg-[#ffebee] text-[#c62828]';
  return 'bg-gray-100 text-gray-600';
};

const computeReportFromSupabase = async () => {
  const { startDate, endDate, label } = getPeriodBoundsBogota(
    filters.value.periodType,
    filters.value.referenceDate
  );

  const effectiveAreaId = isAreaLeader.value
    ? leaderAreaId.value
    : (filters.value.areaId !== 'all' ? filters.value.areaId : null);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  const profMap = new Map(profilesList.value.map((p) => [p.id, p]));
  const activities = [];

  for (const t of (tasks || [])) {
    const prof = profMap.get(t.assigned_to);
    const areaId = prof?.roles?.area_id || null;
    if (effectiveAreaId && areaId !== effectiveAreaId) continue;
    if (filters.value.userId !== 'all' && t.assigned_to !== filters.value.userId) continue;

    activities.push({
      id: t.id,
      title: t.title || 'Actividad',
      status: t.status || 'pending',
      due_date: t.due_date,
      due_time: t.due_time,
      completed_at: t.completed_at,
      assignee_id: t.assigned_to,
      assignee_name: prof?.full_name || 'Sin asignar',
      area_id: areaId,
      area_name: prof?.roles?.areas?.name || 'General',
    });
  }

  const overall = calculateKpisFromActivities(activities);

  const byUserMap = new Map();
  for (const act of activities) {
    const uid = act.assignee_id || 'unassigned';
    if (!byUserMap.has(uid)) byUserMap.set(uid, []);
    byUserMap.get(uid).push(act);
  }

  const byUser = [];
  for (const [uid, uActs] of byUserMap.entries()) {
    const uCalc = calculateKpisFromActivities(uActs);
    const kMap = Object.fromEntries(uCalc.kpis.map((k) => [k.key, k.value]));
    byUser.push({
      user_id: uid,
      full_name: uActs[0].assignee_name,
      area_name: uActs[0].area_name,
      summary: uCalc.summary,
      compliance_rate: kMap.compliance_rate,
      on_time_rate: kMap.on_time_rate,
      overdue_rate: kMap.overdue_rate,
    });
  }

  return {
    period: { type: filters.value.periodType, label, start_date: startDate, end_date: endDate },
    summary: overall.summary,
    kpis: overall.kpis,
    by_user: byUser,
    bottlenecks: overall.overdue_items.slice(0, 10).map((b) => ({
      id: b.id,
      title: b.title,
      assignee_name: b.assignee_name,
      due_date: b.due_date,
    })),
  };
};

const loadReport = async () => {
  loading.value = true;
  aiAnalysis.value = null;
  try {
    let loadedViaApi = false;
    if (apiUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const params = new URLSearchParams({
            period_type: filters.value.periodType,
            reference_date: filters.value.referenceDate,
          });
          if (filters.value.areaId !== 'all') params.set('area_id', filters.value.areaId);
          if (filters.value.userId !== 'all') params.set('user_id', filters.value.userId);
          const res = await fetch(`${apiUrl}/api/v1/kpis/auto?${params.toString()}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            report.value = await res.json();
            loadedViaApi = true;
          }
        }
      } catch (_) {}
    }

    if (!loadedViaApi) {
      report.value = await computeReportFromSupabase();
    }
  } finally {
    loading.value = false;
  }
};

const generateAiAnalysis = async () => {
  if (!report.value) return;
  aiLoading.value = true;
  try {
    let gotApi = false;
    if (apiUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch(`${apiUrl}/api/v1/reports/ai-insights`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ report: report.value }),
          });
          if (res.ok) {
            const json = await res.json();
            aiAnalysis.value = json.analysis;
            gotApi = true;
          }
        }
      } catch (_) {}
    }
    if (!gotApi) {
      aiAnalysis.value = buildLocalGroundedAnalysis(report.value);
    }
  } finally {
    aiLoading.value = false;
  }
};

onMounted(async () => {
  if (!currentProfile.value) await loadCurrentProfile();
  const [areasRes, profRes] = await Promise.all([
    supabase.from('areas').select('id, name').order('name'),
    supabase.from('profiles').select('id, full_name, role_id, roles(id, name, area_id, areas(id, name))').order('full_name'),
  ]);
  areasList.value = areasRes.data || [];
  profilesList.value = profRes.data || [];
  await loadReport();
});

watch(
  () => [filters.value.periodType, filters.value.referenceDate, filters.value.areaId, filters.value.userId],
  () => loadReport()
);
</script>


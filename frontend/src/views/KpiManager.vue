<template>
  <div class="kpi-manager">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/team" class="back-link">← Volver al Panel de Liderazgo</router-link>
        <h1>KPIs Reales por Cargo</h1>
        <p class="subtitle">
          Plantillas tomadas de las mediciones reales de la empresa. Cada KPI se mide en 4 cortes por mes
          (Semana 2, Semana 3, Semana 4 y Cierre). Solo lo ve el admin master y el líder del área responsable.
        </p>
      </div>
      <div class="tabs">
        <button :class="{ active: tab === 'templates' }" @click="tab = 'templates'">Plantillas</button>
        <button :class="{ active: tab === 'measurements' }" @click="tab = 'measurements'">Cargar Mediciones</button>
      </div>
    </header>

    <div v-if="loading" class="empty-state">Cargando...</div>

    <!-- ============ TAB: PLANTILLAS ============ -->
    <div v-else-if="tab === 'templates'" class="templates-tab">
      <div v-if="isMaster" class="toolbar">
        <button class="btn-primary" @click="openNewTemplate">+ Nueva Plantilla de Área</button>
      </div>

      <div v-for="template in templates" :key="template.id" class="template-card glass-panel">
        <div class="template-header">
          <div>
            <h3>{{ template.area_label }}</h3>
            <p class="template-note" v-if="template.source_note">{{ template.source_note }}</p>
          </div>
          <div class="template-link" v-if="isMaster">
            <label>Vincular a cargo real</label>
            <select v-model="template.role_id" @change="saveTemplateLink(template)">
              <option :value="null">— Sin vincular —</option>
              <option v-for="r in allRoles" :key="r.id" :value="r.id">
                {{ r.areas?.name ? r.areas.name + ' · ' : '' }}{{ r.name }}
              </option>
            </select>
          </div>
          <div class="template-link" v-else>
            <span class="linked-role" v-if="template.roles">{{ template.roles.name }}</span>
            <span class="linked-role muted" v-else>Sin vincular a un cargo todavía</span>
          </div>
        </div>

        <table class="metrics-table">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Meta</th>
              <th>Tipo</th>
              <th v-if="isMaster"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="metric in template.kpi_template_metrics" :key="metric.id">
              <td>
                <input v-if="isMaster" v-model="metric.name" @blur="saveMetric(metric)" />
                <span v-else>{{ metric.name }}</span>
              </td>
              <td>
                <input v-if="isMaster" v-model="metric.meta_label" @blur="saveMetric(metric)" class="meta-input" />
                <span v-else>{{ metric.meta_label }}</span>
              </td>
              <td>
                <select v-if="isMaster" v-model="metric.meta_type" @change="saveMetric(metric)">
                  <option value="percentage">%</option>
                  <option value="currency">$</option>
                  <option value="count">Conteo</option>
                  <option value="text">Texto</option>
                </select>
                <span v-else class="type-badge">{{ metaTypeLabel(metric.meta_type) }}</span>
              </td>
              <td v-if="isMaster">
                <button class="icon-btn danger" title="Quitar KPI" @click="deleteMetric(template, metric)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <button v-if="isMaster" class="btn-text" @click="addMetric(template)">+ Agregar KPI</button>

        <button v-if="isMaster" class="btn-text danger-text" @click="confirmDeleteTemplate(template)">Eliminar plantilla completa</button>
      </div>

      <div v-if="templates.length === 0" class="empty-state">Todavía no hay plantillas de KPI cargadas.</div>
    </div>

    <!-- ============ TAB: MEDICIONES ============ -->
    <div v-else class="measurements-tab">
      <div class="measurement-controls glass-panel">
        <div class="control-group">
          <label>Cargo</label>
          <select v-model="selectedTemplateId">
            <option :value="null">— Seleccioná un cargo —</option>
            <option v-for="t in linkedTemplatesForUser" :key="t.id" :value="t.id">
              {{ t.roles.areas?.name ? t.roles.areas.name + ' · ' : '' }}{{ t.roles.name }}
            </option>
          </select>
        </div>
        <div class="control-group">
          <label>Año</label>
          <input type="number" v-model.number="periodYear" min="2024" max="2100" />
        </div>
        <div class="control-group">
          <label>Mes</label>
          <input type="number" v-model.number="periodMonth" min="1" max="12" />
        </div>
        <div class="control-group">
          <label>Corte</label>
          <select v-model="periodCheckpoint">
            <option value="semana_2">Semana 2</option>
            <option value="semana_3">Semana 3</option>
            <option value="semana_4">Semana 4</option>
            <option value="cierre">Cierre</option>
          </select>
        </div>
      </div>

      <div v-if="!selectedTemplate" class="empty-state">
        {{ linkedTemplatesForUser.length === 0
          ? 'No hay ningún cargo con plantilla de KPI vinculada todavía en tu área. Pedile a un admin master que vincule una plantilla desde la pestaña "Plantillas".'
          : 'Elegí un cargo para cargar sus mediciones.' }}
      </div>

      <div v-else class="measurement-form glass-panel">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Meta</th>
              <th>Realizado</th>
              <th>%</th>
              <th>Estado</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in measurementRows" :key="row.metric_id">
              <td>{{ row.name }}</td>
              <td class="meta-cell">{{ row.meta_label }}</td>
              <td><input v-model="row.realizado_raw" placeholder="Dato crudo" /></td>
              <td><input type="number" v-model.number="row.percentage" placeholder="%" class="pct-input" /></td>
              <td>
                <select v-model="row.estado">
                  <option value="cumpliendo">Cumpliendo</option>
                  <option value="revisar">Revisar</option>
                </select>
              </td>
              <td><input v-model="row.notes" placeholder="Ej: llamada del 3/09" /></td>
            </tr>
          </tbody>
        </table>

        <div class="total-row">
          Total del corte: <strong>{{ computedTotal === null ? 'Sin datos' : computedTotal + '%' }}</strong>
        </div>

        <p v-if="saveError" class="error-text">{{ saveError }}</p>

        <div class="modal-actions">
          <button class="btn-primary" @click="saveMeasurements" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar Mediciones' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: nueva plantilla -->
    <div v-if="showNewTemplateModal" class="modal-overlay" @click.self="showNewTemplateModal = false">
      <div class="modal-content glass-panel small">
        <h2>Nueva Plantilla de Área</h2>
        <div class="form-group">
          <label>Nombre del área</label>
          <input v-model="newTemplateArea" placeholder="Ej: Logística" />
        </div>
        <p v-if="newTemplateError" class="error-text">{{ newTemplateError }}</p>
        <div class="modal-actions">
          <button class="btn-text" @click="showNewTemplateModal = false">Cancelar</button>
          <button class="btn-primary" @click="createTemplate">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: confirmar borrado de plantilla -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal-content glass-panel small">
        <h2>¿Eliminar la plantilla de {{ deleteTarget.area_label }}?</h2>
        <p class="subtitle">Se van a borrar todos sus KPIs y mediciones asociadas. No se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn-text" @click="deleteTarget = null">Cancelar</button>
          <button class="btn-danger" @click="deleteTemplate">Sí, eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { currentProfile, isMasterAdmin, isLeader } from '../api/auth';

const tab = ref('templates');
const loading = ref(true);
const templates = ref([]);
const allRoles = ref([]);

const isMaster = computed(() => isMasterAdmin());
const myAreaId = computed(() => currentProfile.value?.roles?.area_id || null);

const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('kpi_role_templates')
    .select('*, roles(name, area_id, areas(name)), kpi_template_metrics(*)')
    .order('area_label');
  if (error) {
    console.error('Error cargando plantillas de KPI:', error);
    templates.value = [];
    return;
  }
  (data || []).forEach(t => {
    t.kpi_template_metrics.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  });
  templates.value = data || [];
};

const fetchRoles = async () => {
  if (!isMaster.value) return;
  const { data, error } = await supabase.from('roles').select('id,name,area_id,areas(name)').order('name');
  if (!error) allRoles.value = data || [];
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchTemplates(), fetchRoles()]);
  loading.value = false;
});

const metaTypeLabel = (t) => ({ percentage: '%', currency: '$', count: 'Conteo', text: 'Texto' }[t] || t);

// --- Edición de plantillas (solo admin master; RLS igual lo exige) ---
const saveTemplateLink = async (template) => {
  const { error } = await supabase.from('kpi_role_templates').update({ role_id: template.role_id }).eq('id', template.id);
  if (error) alert('No se pudo vincular el cargo: ' + error.message);
  else await fetchTemplates();
};

const saveMetric = async (metric) => {
  const { error } = await supabase.from('kpi_template_metrics').update({
    name: metric.name,
    meta_label: metric.meta_label,
    meta_type: metric.meta_type
  }).eq('id', metric.id);
  if (error) alert('No se pudo guardar el KPI: ' + error.message);
};

const addMetric = async (template) => {
  const { data, error } = await supabase.from('kpi_template_metrics').insert([{
    template_id: template.id,
    name: 'Nuevo KPI',
    meta_label: '100%',
    meta_type: 'percentage',
    display_order: template.kpi_template_metrics.length + 1
  }]).select().single();
  if (error) { alert('No se pudo agregar el KPI: ' + error.message); return; }
  template.kpi_template_metrics.push(data);
};

const deleteMetric = async (template, metric) => {
  if (!confirm(`¿Quitar "${metric.name}"?`)) return;
  const { error } = await supabase.from('kpi_template_metrics').delete().eq('id', metric.id);
  if (error) { alert('No se pudo quitar el KPI: ' + error.message); return; }
  template.kpi_template_metrics = template.kpi_template_metrics.filter(m => m.id !== metric.id);
};

const showNewTemplateModal = ref(false);
const newTemplateArea = ref('');
const newTemplateError = ref('');

const openNewTemplate = () => {
  newTemplateArea.value = '';
  newTemplateError.value = '';
  showNewTemplateModal.value = true;
};

const createTemplate = async () => {
  if (!newTemplateArea.value.trim()) {
    newTemplateError.value = 'El nombre del área es obligatorio.';
    return;
  }
  const { error } = await supabase.from('kpi_role_templates').insert([{ area_label: newTemplateArea.value.trim() }]);
  if (error) { newTemplateError.value = error.message; return; }
  showNewTemplateModal.value = false;
  await fetchTemplates();
};

const deleteTarget = ref(null);
const confirmDeleteTemplate = (template) => { deleteTarget.value = template; };
const deleteTemplate = async () => {
  if (!deleteTarget.value) return;
  const { error } = await supabase.from('kpi_role_templates').delete().eq('id', deleteTarget.value.id);
  if (error) { alert('No se pudo eliminar: ' + error.message); return; }
  deleteTarget.value = null;
  await fetchTemplates();
};

// --- Mediciones ---
const linkedTemplatesForUser = computed(() => {
  return templates.value.filter(t => {
    if (!t.role_id || !t.roles) return false;
    if (isMaster.value) return true;
    return isLeader() && t.roles.area_id === myAreaId.value;
  });
});

const selectedTemplateId = ref(null);
const selectedTemplate = computed(() => templates.value.find(t => t.id === selectedTemplateId.value) || null);

const today = new Date();
const periodYear = ref(today.getFullYear());
const periodMonth = ref(today.getMonth() + 1);
const periodCheckpoint = ref('semana_2');

const measurementRows = ref([]);
const saving = ref(false);
const saveError = ref('');

const loadMeasurements = async () => {
  measurementRows.value = [];
  if (!selectedTemplate.value) return;

  const metrics = selectedTemplate.value.kpi_template_metrics;
  const roleId = selectedTemplate.value.role_id;

  const { data, error } = await supabase
    .from('kpi_metric_measurements')
    .select('*')
    .eq('role_id', roleId)
    .eq('period_year', periodYear.value)
    .eq('period_month', periodMonth.value)
    .eq('period_checkpoint', periodCheckpoint.value)
    .in('metric_id', metrics.map(m => m.id));

  if (error) console.error('Error cargando mediciones:', error);

  const existingByMetric = {};
  (data || []).forEach(m => { existingByMetric[m.metric_id] = m; });

  measurementRows.value = metrics.map(m => {
    const existing = existingByMetric[m.id];
    return {
      metric_id: m.id,
      name: m.name,
      meta_label: m.meta_label,
      realizado_raw: existing?.realizado_raw || '',
      percentage: existing?.percentage ?? null,
      estado: existing?.estado || 'revisar',
      notes: existing?.notes || ''
    };
  });
};

watch([selectedTemplateId, periodYear, periodMonth, periodCheckpoint], loadMeasurements);

const computedTotal = computed(() => {
  const withData = measurementRows.value.filter(r => r.percentage !== null && r.percentage !== '' && !Number.isNaN(r.percentage));
  if (withData.length === 0) return null;
  const avg = withData.reduce((sum, r) => sum + Number(r.percentage), 0) / withData.length;
  return Math.round(avg);
});

const saveMeasurements = async () => {
  if (!selectedTemplate.value) return;
  saveError.value = '';
  saving.value = true;
  try {
    const roleId = selectedTemplate.value.role_id;
    const payload = measurementRows.value.map(r => ({
      metric_id: r.metric_id,
      role_id: roleId,
      period_year: periodYear.value,
      period_month: periodMonth.value,
      period_checkpoint: periodCheckpoint.value,
      realizado_raw: r.realizado_raw || null,
      percentage: r.percentage === '' || r.percentage === null ? null : Number(r.percentage),
      estado: r.estado,
      notes: r.notes || null
    }));
    const { error } = await supabase
      .from('kpi_metric_measurements')
      .upsert(payload, { onConflict: 'metric_id,role_id,period_year,period_month,period_checkpoint' });
    if (error) throw error;
  } catch (e) {
    saveError.value = e.message || 'No se pudieron guardar las mediciones.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.kpi-manager { padding: 32px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
.back-link { color: var(--gold-deep); text-decoration: none; font-size: 0.85rem; margin-bottom: 8px; display: inline-block; }
.header-content h1 { font-size: 28px; color: var(--text-primary); margin: 4px 0 8px 0; }
.subtitle { color: var(--text-secondary); font-size: 0.9rem; max-width: 620px; }

.tabs { display: flex; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 4px; height: fit-content; }
.tabs button { padding: 9px 18px; border: none; background: transparent; cursor: pointer; border-radius: var(--radius-sm); font-family: inherit; font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); transition: all 0.2s; }
.tabs button.active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.empty-state { padding: 48px; text-align: center; color: var(--text-tertiary); background: var(--bg-secondary); border-radius: var(--radius-md); }

.toolbar { margin-bottom: 16px; }
.btn-primary { background: var(--ink); color: #fff; border: none; padding: 12px 24px; border-radius: var(--radius-pill); font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-primary:hover:not(:disabled) { background: #000; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.template-card { padding: 24px; margin-bottom: 20px; }
.template-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.template-header h3 { margin: 0 0 4px 0; color: var(--ink); font-size: 1.1rem; }
.template-note { font-size: 0.78rem; color: var(--text-tertiary); font-style: italic; margin: 0; }
.template-link { display: flex; flex-direction: column; gap: 4px; }
.template-link label { font-size: 0.72rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; }
.template-link select { padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); font-family: inherit; font-size: 0.85rem; min-width: 260px; }
.linked-role { font-weight: 600; color: var(--gold-deep); }
.linked-role.muted { color: var(--text-tertiary); font-weight: 400; font-style: italic; }

.metrics-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.metrics-table th { text-align: left; padding: 8px 10px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-tertiary); border-bottom: 1px solid var(--border-subtle); }
.metrics-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-subtle); color: var(--ink-secondary); }
.metrics-table input, .metrics-table select { width: 100%; padding: 7px 9px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font-family: inherit; font-size: 0.85rem; }
.metrics-table input:focus, .metrics-table select:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-light); }
.meta-input { max-width: 160px; }
.meta-cell { font-weight: 600; color: var(--gold-deep); white-space: nowrap; }
.pct-input { max-width: 80px; }
.type-badge { font-size: 0.75rem; color: var(--text-tertiary); }

.btn-text { background: none; border: none; cursor: pointer; color: var(--gold-deep); font-size: 0.85rem; font-weight: 600; margin-top: 12px; margin-right: 20px; }
.danger-text { color: var(--danger); }

.icon-btn { background: var(--bg-secondary); border: 1px solid var(--border-subtle); color: var(--ink); width: 30px; height: 30px; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem; }
.icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); }

.measurement-controls { display: flex; gap: 16px; padding: 20px 24px; margin-bottom: 20px; flex-wrap: wrap; }
.control-group { display: flex; flex-direction: column; gap: 6px; }
.control-group label { font-size: 0.72rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; }
.control-group select, .control-group input { padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font-family: inherit; font-size: 0.88rem; }
.control-group select { min-width: 280px; }

.measurement-form { padding: 24px; }
.total-row { margin-top: 16px; font-size: 0.95rem; color: var(--ink); }
.total-row strong { color: var(--gold-deep); }

.error-text { margin: 12px 0 0 0; color: var(--danger); font-size: 0.85rem; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { width: 100%; max-width: 480px; padding: 32px; }
.modal-content.small { max-width: 400px; }
.modal-content h2 { margin: 0 0 8px 0; font-size: 1.3rem; color: var(--ink); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600; color: var(--text-secondary); }
.form-group input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font-family: inherit; font-size: 0.9rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-danger { background: var(--danger); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-pill); font-weight: 600; cursor: pointer; }
</style>

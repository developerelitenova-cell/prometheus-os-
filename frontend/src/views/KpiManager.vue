<template>
  <div class="kpi-manager">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/team" class="back-link">← Volver al Panel de Liderazgo</router-link>
        <h1>Gestión de Indicadores Clave (KPIs)</h1>
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
            <label>Cargos vinculados</label>
            <div class="linked-roles-list">
              <span v-for="link in template.kpi_role_template_links" :key="link.id" class="role-chip">
                {{ link.roles?.areas?.name ? link.roles.areas.name + ' · ' : '' }}{{ link.roles?.name }}
                <button type="button" class="chip-remove" title="Quitar cargo" @click="unlinkRole(template, link)">×</button>
              </span>
              <span v-if="template.kpi_role_template_links.length === 0" class="linked-role muted">Sin vincular a ningún cargo todavía</span>
            </div>
            <div class="add-role-row">
              <select v-model="template._roleToAdd">
                <option :value="null">+ Agregar cargo…</option>
                <option v-for="r in availableRolesFor(template)" :key="r.id" :value="r.id">
                  {{ r.areas?.name ? r.areas.name + ' · ' : '' }}{{ r.name }}
                </option>
              </select>
              <button type="button" class="btn-text" :disabled="!template._roleToAdd" @click="linkRole(template)">Agregar</button>
            </div>
          </div>
          <div class="template-link" v-else>
            <span class="linked-role" v-if="template.kpi_role_template_links.length">
              {{ template.kpi_role_template_links.map(l => l.roles?.name).join(', ') }}
            </span>
            <span class="linked-role muted" v-else>Sin vincular a un cargo todavía</span>
          </div>
        </div>

        <div class="kpi-list">
          <div v-for="metric in template.kpi_template_metrics" :key="metric.id" class="kpi-item">
            <div class="kpi-main">
              <span class="kpi-icon">🎯</span>
              <div class="kpi-details">
                <input v-if="isMaster" v-model="metric.name" @blur="saveMetric(metric)" class="kpi-name-input" placeholder="Nombre del KPI" />
                <span v-else class="kpi-name">{{ metric.name }}</span>
                <span class="kpi-type-pill">{{ metaTypeLabel(metric.meta_type) }}</span>
              </div>
            </div>
            
            <div class="kpi-meta-section">
              <span class="meta-label">Meta:</span>
              <input v-if="isMaster" v-model="metric.meta_label" @blur="saveMetric(metric)" class="meta-input" placeholder="Ej: 100%" />
              <span v-else class="meta-value">{{ metric.meta_label }}</span>
              
              <select v-if="isMaster" v-model="metric.meta_type" @change="saveMetric(metric)" class="type-select">
                <option value="percentage">% Porcentaje</option>
                <option value="currency">$ Moneda</option>
                <option value="count"># Conteo</option>
                <option value="text">A Texto</option>
              </select>
              
              <button v-if="isMaster" class="icon-btn danger" title="Quitar KPI" @click="deleteMetric(template, metric)">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>

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
          <select v-model="selectedPairKey">
            <option :value="null">— Seleccioná un cargo —</option>
            <option v-for="p in linkedRolePairsForUser" :key="p.key" :value="p.key">
              {{ p.roleLabel }} ({{ p.template.area_label }})
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

      <div v-if="!selectedPair" class="empty-state">
        {{ linkedRolePairsForUser.length === 0
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
      <div class="modal-content glass-panel">
        <h2>Nueva Plantilla de KPIs</h2>
        <div class="form-group">
          <label>Nombre del área o cargo</label>
          <div class="input-with-ai">
            <input v-model="newTemplateArea" placeholder="Ej: Logística" />
            <button class="btn-magic" @click="generateAIKpis" :disabled="isGeneratingKpis || !newTemplateArea.trim()">
              {{ isGeneratingKpis ? 'Generando...' : '✨ Autocompletar KPIs' }}
            </button>
          </div>
        </div>
        
        <div class="kpi-draft-list" v-if="newTemplateKpis.length > 0">
          <label>KPIs Iniciales</label>
          <div v-for="(kpi, idx) in newTemplateKpis" :key="idx" class="kpi-draft-row">
            <input v-model="kpi.name" placeholder="Nombre KPI" class="flex-2" />
            <input v-model="kpi.meta_label" placeholder="Meta" class="flex-1" />
            <select v-model="kpi.meta_type" class="flex-1">
              <option value="percentage">%</option>
              <option value="currency">$</option>
              <option value="count">Conteo</option>
              <option value="text">Texto</option>
            </select>
            <button class="icon-btn danger" @click="newTemplateKpis.splice(idx, 1)">🗑</button>
          </div>
        </div>
        
        <button class="btn-text" @click="addDraftKpi">+ Agregar KPI vacío</button>

        <p v-if="newTemplateError" class="error-text">{{ newTemplateError }}</p>
        <div class="modal-actions">
          <button class="btn-text" @click="showNewTemplateModal = false">Cancelar</button>
          <button class="btn-primary" @click="createTemplate">Guardar Plantilla</button>
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
    .select('*, kpi_template_metrics(*), kpi_role_template_links(id, role_id, roles(id, name, area_id, areas(name)))')
    .order('area_label');
  if (error) {
    console.error('Error cargando plantillas de KPI:', error);
    templates.value = [];
    return;
  }
  (data || []).forEach(t => {
    t.kpi_template_metrics.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    t._roleToAdd = null;
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
const availableRolesFor = (template) => {
  const linkedIds = new Set(template.kpi_role_template_links.map(l => l.role_id));
  return allRoles.value.filter(r => !linkedIds.has(r.id));
};

const linkRole = async (template) => {
  if (!template._roleToAdd) return;
  const { data, error } = await supabase
    .from('kpi_role_template_links')
    .insert({ template_id: template.id, role_id: template._roleToAdd })
    .select('id, role_id, roles(id, name, area_id, areas(name))')
    .single();
  if (error) { alert('No se pudo vincular el cargo: ' + error.message); return; }
  template.kpi_role_template_links.push(data);
  template._roleToAdd = null;
};

const unlinkRole = async (template, link) => {
  const { error } = await supabase.from('kpi_role_template_links').delete().eq('id', link.id);
  if (error) { alert('No se pudo quitar el cargo: ' + error.message); return; }
  template.kpi_role_template_links = template.kpi_role_template_links.filter(l => l.id !== link.id);
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
const newTemplateKpis = ref([]);
const isGeneratingKpis = ref(false);

const openNewTemplate = () => {
  newTemplateArea.value = '';
  newTemplateError.value = '';
  newTemplateKpis.value = [];
  showNewTemplateModal.value = true;
};

const addDraftKpi = () => {
  newTemplateKpis.value.push({ name: '', meta_label: '100%', meta_type: 'percentage' });
};

const generateAIKpis = async () => {
  if (!newTemplateArea.value.trim()) return;
  isGeneratingKpis.value = true;
  newTemplateError.value = '';
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/generate-kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ area_name: newTemplateArea.value.trim() })
    });
    
    if (!res.ok) throw new Error('Error al generar KPIs');
    const result = await res.json();
    if (result.kpis && result.kpis.length > 0) {
      newTemplateKpis.value = result.kpis;
    }
  } catch (e) {
    newTemplateError.value = 'No se pudo contactar con la IA para generar los KPIs.';
    console.error(e);
  } finally {
    isGeneratingKpis.value = false;
  }
};

const createTemplate = async () => {
  if (!newTemplateArea.value.trim()) {
    newTemplateError.value = 'El nombre del área es obligatorio.';
    return;
  }
  // 1. Crear plantilla
  const { data: templateData, error: templateError } = await supabase
    .from('kpi_role_templates')
    .insert([{ area_label: newTemplateArea.value.trim() }])
    .select()
    .single();
    
  if (templateError) { newTemplateError.value = templateError.message; return; }
  
  // 2. Insertar KPIs si hay
  const validKpis = newTemplateKpis.value.filter(k => k.name.trim() !== '');
  if (validKpis.length > 0) {
    const metricsPayload = validKpis.map((k, idx) => ({
      template_id: templateData.id,
      name: k.name.trim(),
      meta_label: k.meta_label,
      meta_type: k.meta_type,
      display_order: idx + 1
    }));
    const { error: kpisError } = await supabase.from('kpi_template_metrics').insert(metricsPayload);
    if (kpisError) {
      console.error('Error insertando KPIs iniciales:', kpisError);
      alert('La plantilla se creó pero hubo un error guardando sus KPIs.');
    }
  }
  
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
// Una plantilla puede estar vinculada a varios cargos: cada combinación
// (plantilla, cargo) es una opción propia, porque las mediciones se
// anclan al cargo (role_id), no a la plantilla.
const linkedRolePairsForUser = computed(() => {
  const pairs = [];
  for (const t of templates.value) {
    for (const link of t.kpi_role_template_links || []) {
      if (!link.roles) continue;
      const allowed = isMaster.value || (isLeader() && link.roles.area_id === myAreaId.value);
      if (!allowed) continue;
      pairs.push({
        key: `${t.id}:${link.role_id}`,
        template: t,
        roleId: link.role_id,
        roleLabel: (link.roles.areas?.name ? link.roles.areas.name + ' · ' : '') + link.roles.name
      });
    }
  }
  return pairs;
});

const selectedPairKey = ref(null);
const selectedPair = computed(() => linkedRolePairsForUser.value.find(p => p.key === selectedPairKey.value) || null);
const selectedTemplate = computed(() => selectedPair.value?.template || null);

const today = new Date();
const periodYear = ref(today.getFullYear());
const periodMonth = ref(today.getMonth() + 1);
const periodCheckpoint = ref('semana_2');

const measurementRows = ref([]);
const saving = ref(false);
const saveError = ref('');

const loadMeasurements = async () => {
  measurementRows.value = [];
  if (!selectedPair.value) return;

  const metrics = selectedPair.value.template.kpi_template_metrics;
  const roleId = selectedPair.value.roleId;

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

watch([selectedPairKey, periodYear, periodMonth, periodCheckpoint], loadMeasurements);

const computedTotal = computed(() => {
  const withData = measurementRows.value.filter(r => r.percentage !== null && r.percentage !== '' && !Number.isNaN(r.percentage));
  if (withData.length === 0) return null;
  const avg = withData.reduce((sum, r) => sum + Number(r.percentage), 0) / withData.length;
  return Math.round(avg);
});

const saveMeasurements = async () => {
  if (!selectedPair.value) return;
  saveError.value = '';
  saving.value = true;
  try {
    const roleId = selectedPair.value.roleId;
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

.linked-roles-list { display: flex; flex-wrap: wrap; gap: 6px; max-width: 320px; }
.role-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; background: var(--gold-light); color: var(--gold-deep); border-radius: var(--radius-pill); font-size: 0.78rem; font-weight: 600; }
.chip-remove { background: none; border: none; cursor: pointer; color: var(--gold-deep); font-size: 0.95rem; line-height: 1; padding: 2px 4px; border-radius: 50%; }
.chip-remove:hover { background: rgba(0,0,0,0.08); }
.add-role-row { display: flex; gap: 8px; margin-top: 8px; }
.add-role-row select { padding: 7px 9px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); font-family: inherit; font-size: 0.82rem; min-width: 220px; }
.add-role-row .btn-text { margin: 0; }

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

.icon-btn { background: var(--bg-secondary); border: 1px solid var(--border-subtle); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.icon-btn:hover { background: var(--surface); color: var(--ink); }
.icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); background: rgba(255, 59, 48, 0.05); }

/* --- KPI List Styles --- */
.kpi-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; margin-bottom: 24px; }
.kpi-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(0, 0, 0, 0.015); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); transition: all 0.2s ease; gap: 16px; flex-wrap: wrap; }
.kpi-item:hover { border-color: var(--border); background: var(--surface); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.kpi-main { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 250px; }
.kpi-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: var(--surface); border: 1px solid var(--border-subtle); border-radius: 12px; font-size: 1.2rem; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.kpi-details { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.kpi-name-input { background: transparent; border: 1px dashed var(--border-subtle); color: var(--ink); font-size: 1.05rem; font-weight: 600; padding: 4px 8px; border-radius: 6px; width: 100%; transition: border-color 0.2s; }
.kpi-name-input:focus { outline: none; border-color: var(--gold); border-style: solid; background: var(--surface); }
.kpi-name { font-size: 1.05rem; font-weight: 600; color: var(--ink); }
.kpi-type-pill { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); font-weight: 600; }
.kpi-meta-section { display: flex; align-items: center; gap: 16px; }
.meta-label { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 1.1rem; font-weight: 700; color: var(--gold-deep); background: var(--gold-light); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2); }
.meta-input { background: var(--surface); border: 1px solid var(--border); color: var(--ink); font-size: 1rem; font-weight: 600; padding: 8px 12px; border-radius: 8px; width: 110px; text-align: center; transition: all 0.2s; }
.meta-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-light); outline: none; }
.type-select { background: var(--surface); border: 1px solid var(--border); color: var(--ink); font-size: 0.85rem; font-weight: 500; padding: 8px 12px; border-radius: 8px; outline: none; cursor: pointer; transition: all 0.2s; }
.type-select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-light); }

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

.input-with-ai { display: flex; gap: 8px; }
.btn-magic { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; border: none; padding: 0 16px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; }
.btn-magic:disabled { opacity: 0.5; cursor: not-allowed; }
.kpi-draft-list { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
.kpi-draft-list label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.kpi-draft-row { display: flex; gap: 8px; align-items: center; }
.kpi-draft-row input, .kpi-draft-row select { padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font-family: inherit; font-size: 0.85rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-danger { background: var(--danger); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-pill); font-weight: 600; cursor: pointer; }
</style>

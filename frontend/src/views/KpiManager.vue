<template>
  <div class="kpi-manager">
    <header class="page-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-link cursor-pointer">← Volver</button>
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

        <div class="template-actions">
          <button v-if="isMaster" class="btn-text" @click="addMetric(template)">+ Agregar KPI manual</button>
          <button v-if="isMaster" class="btn-text ai-btn" @click="openAiDesignerForTemplate(template)">✨ Diseñar Tabla con IA</button>
          <button v-if="isMaster" class="btn-text danger-text" @click="confirmDeleteTemplate(template)">Eliminar plantilla</button>
        </div>
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
        <!-- Banner Asistente IA de Calificación -->
        <div class="ai-evaluator-card">
          <div class="ai-evaluator-text">
            <div class="ai-title-row">
              <span class="ai-badge-chip">✨ Inteligencia Artificial</span>
              <span class="checkpoint-label">{{ periodCheckpointLabel }} · {{ periodMonthName }} {{ periodYear }}</span>
            </div>
            <h4>Flujo de Calificación Asistido por IA</h4>
            <p class="ai-desc">
              Pegá el reporte semanal, novedades o notas del líder y la IA extraerá los números, calculará matemáticamente el % contra cada meta y generará las observaciones para el 1 a 1.
            </p>
          </div>
          <button type="button" class="btn-ai-sparkle" @click="openAiEvaluatorModal">
            ✨ Calificar con IA
          </button>
        </div>

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

    <!-- ============ MODAL: ASISTENTE DE CALIFICACIÓN CON IA ============ -->
    <div v-if="showAiEvaluatorModal" class="modal-overlay" @click.self="showAiEvaluatorModal = false">
      <div class="modal-content glass-panel large-modal">
        <div class="modal-header-ai">
          <div class="ai-badge-chip">✨ Asistente de Calificación Inteligente</div>
          <h2>Calificar {{ selectedPair?.roleLabel }}</h2>
          <p class="subtitle">
            Corte: <strong>{{ periodCheckpointLabel }}</strong> · {{ periodMonthName }} {{ periodYear }}
          </p>
        </div>

        <div class="expected-metrics-bar">
          <span class="bar-title">Métricas de este cargo:</span>
          <div class="mini-metrics-chips">
            <span v-for="m in measurementRows" :key="m.metric_id" class="mini-metric-chip">
              {{ m.name }}: <strong>{{ m.meta_label }}</strong>
            </span>
          </div>
        </div>

        <div class="form-group">
          <div class="label-with-samples">
            <label>Reporte Semanal, Novedades o Resumen del Colaborador</label>
            <div class="samples-buttons">
              <span class="sample-label">Cargar ejemplo:</span>
              <button type="button" class="btn-sample" @click="loadSamplePerformance('comercial')">Comercial</button>
              <button type="button" class="btn-sample" @click="loadSamplePerformance('bodega')">Bodega</button>
              <button type="button" class="btn-sample" @click="loadSamplePerformance('general')">General</button>
            </div>
          </div>
          <textarea
            v-model="aiPerformanceText"
            rows="4"
            class="ai-textarea"
            placeholder="Pegá aquí el resumen de desempeño, reporte de WhatsApp, correos de cierre o notas del líder. Ej: 'Esta semana atendió 130 chats, cerró 20 ventas por $21.500.000, su tiempo promedio fue de 2.5 min y tuvo 0 quejas...'"
          ></textarea>
        </div>

        <div class="ai-action-row">
          <button
            type="button"
            class="btn-magic-action"
            :disabled="isEvaluatingAi || !aiPerformanceText.trim()"
            @click="runAiEvaluation"
          >
            {{ isEvaluatingAi ? 'Analizando con IA y calculando %...' : '🪄 Analizar y Calcular Calificación' }}
          </button>
        </div>

        <p v-if="aiEvaluationError" class="error-text">{{ aiEvaluationError }}</p>

        <!-- Resultados generados por la IA -->
        <div v-if="aiEvaluationResults" class="ai-results-preview">
          <div class="results-header">
            <h4>Propuesta de Calificación Calculada por IA</h4>
            <div class="preview-total-badge">
              Promedio: <strong>{{ aiEvaluationResults.average }}%</strong>
            </div>
          </div>
          <p class="summary-box" v-if="aiEvaluationResults.summary">
            💡 <strong>Resumen del Asistente:</strong> {{ aiEvaluationResults.summary }}
          </p>

          <table class="metrics-table preview-table">
            <thead>
              <tr>
                <th>KPI</th>
                <th>Meta</th>
                <th>Realizado Extraído</th>
                <th>% Calculado</th>
                <th>Estado</th>
                <th>Nota de Retroalimentación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in aiEvaluationResults.results" :key="res.metric_id">
                <td><strong>{{ res.name || metricNameById(res.metric_id) }}</strong></td>
                <td class="meta-cell">{{ metricMetaById(res.metric_id) }}</td>
                <td><input v-model="res.realizado_raw" class="preview-input" /></td>
                <td><input type="number" v-model.number="res.percentage" class="preview-input pct" /></td>
                <td>
                  <select v-model="res.estado" class="preview-select">
                    <option value="cumpliendo">Cumpliendo</option>
                    <option value="revisar">Revisar</option>
                  </select>
                </td>
                <td><input v-model="res.notes" class="preview-input" /></td>
              </tr>
            </tbody>
          </table>

          <div class="apply-cta-box">
            <p>Podés editar cualquier valor arriba antes de volcarlo a la tabla de mediciones.</p>
            <button type="button" class="btn-primary" @click="applyAiEvaluation">
              ✅ Aplicar Calificación a la Tabla
            </button>
          </div>
        </div>

        <div class="modal-actions" v-if="!aiEvaluationResults">
          <button class="btn-text" @click="showAiEvaluatorModal = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- ============ MODAL: DISEÑADOR DE TABLAS CON IA ============ -->
    <div v-if="showAiDesignerModal" class="modal-overlay" @click.self="showAiDesignerModal = false">
      <div class="modal-content glass-panel large-modal">
        <div class="modal-header-ai">
          <div class="ai-badge-chip">✨ Inteligencia Artificial</div>
          <h2>Diseñar Tabla de Medición para {{ designerTargetTemplate?.area_label }}</h2>
          <p class="subtitle">
            La IA consulta los manuales de cargo, tareas del día a día y cuellos de botella mapeados en <code>role_workflows</code> para proponer métricas calibradas.
          </p>
        </div>

        <div class="form-group">
          <label>Selecciona el Cargo Base para Extraer el Flujo</label>
          <div class="input-with-action">
            <select v-model="designerSelectedRoleId" class="designer-role-select">
              <option :value="null">— Selecciona un cargo —</option>
              <option v-for="r in allRoles" :key="r.id" :value="r.id">
                {{ r.areas?.name ? r.areas.name + ' · ' : '' }}{{ r.name }}
              </option>
            </select>
            <button
              type="button"
              class="btn-magic"
              :disabled="isGeneratingDesigner || !designerSelectedRoleId"
              @click="runAiDesigner"
            >
              {{ isGeneratingDesigner ? 'Analizando...' : '✨ Analizar Workflow' }}
            </button>
          </div>
        </div>

        <p v-if="designerError" class="error-text">{{ designerError }}</p>

        <!-- Lista de KPIs propuestos por la IA -->
        <div v-if="designerProposedKpis.length > 0" class="designer-proposals-box">
          <label class="section-title">Métricas Propuestas por la IA (Selecciona las que deseas incorporar):</label>
          <div v-for="(kpi, idx) in designerProposedKpis" :key="idx" class="kpi-proposal-card">
            <input type="checkbox" v-model="kpi.selected" class="proposal-check" />
            <div class="proposal-fields">
              <input v-model="kpi.name" placeholder="Nombre de la métrica" class="kpi-name-field" />
              <div class="proposal-meta-row">
                <span class="meta-tag">Meta:</span>
                <input v-model="kpi.meta_label" placeholder="Ej: 95%" class="meta-field" />
                <select v-model="kpi.meta_type" class="type-field">
                  <option value="percentage">% Porcentaje</option>
                  <option value="currency">$ Moneda</option>
                  <option value="count"># Conteo</option>
                  <option value="text">Texto</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-text" @click="showAiDesignerModal = false">Cancelar</button>
            <button class="btn-primary" @click="saveAiDesignerToTemplate">
              ➕ Agregar a la Plantilla {{ designerTargetTemplate?.area_label }}
            </button>
          </div>
        </div>

        <div class="modal-actions" v-else>
          <button class="btn-text" @click="showAiDesignerModal = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { currentProfile, isMasterAdmin, isLeader } from '../api/auth';
import { evaluateMeasurementsWithAi, generateRoleSpecificKpis } from '../api/kpiAi';

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
    
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
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

// ============ ASISTENTE DE CALIFICACIÓN CON IA ============
const showAiEvaluatorModal = ref(false);
const isEvaluatingAi = ref(false);
const aiEvaluationError = ref('');
const aiPerformanceText = ref('');
const aiEvaluationResults = ref(null);

const periodMonthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const periodMonthName = computed(() => periodMonthNames[periodMonth.value] || `Mes ${periodMonth.value}`);
const periodCheckpointLabel = computed(() => ({
  semana_2: 'Semana 2',
  semana_3: 'Semana 3',
  semana_4: 'Semana 4',
  cierre: 'Cierre Mensual'
}[periodCheckpoint.value] || periodCheckpoint.value));

const metricNameById = (metricId) => {
  const m = measurementRows.value.find(r => r.metric_id === metricId);
  return m ? m.name : 'KPI';
};

const metricMetaById = (metricId) => {
  const m = measurementRows.value.find(r => r.metric_id === metricId);
  return m ? m.meta_label : '-';
};

const openAiEvaluatorModal = () => {
  aiEvaluationError.value = '';
  aiPerformanceText.value = '';
  aiEvaluationResults.value = null;
  showAiEvaluatorModal.value = true;
};

const loadSamplePerformance = (type) => {
  if (type === 'comercial') {
    aiPerformanceText.value = 'Durante este corte de semana se atendieron 135 chats en el chatcenter, cerrando ventas por un total de $21.500.000. El tiempo promedio de primera respuesta fue de 2.5 minutos y no se recibió ningún reclamo o queja de clientes.';
  } else if (type === 'bodega') {
    aiPerformanceText.value = 'En esta semana se despachó el 99% de pedidos antes del horario límite de corte. Se ejecutaron 2 inventarios cíclicos programados con 0 diferencias en unidades y 0 errores de empaque reportados.';
  } else {
    aiPerformanceText.value = 'El colaborador completó el 95% de sus tareas asignadas dentro del plazo estipulado, entregó los reportes solicitados a tiempo y no se presentaron novedades críticas en la operación.';
  }
};

const runAiEvaluation = async () => {
  if (!aiPerformanceText.value.trim()) {
    aiEvaluationError.value = 'Por favor ingresá un reporte, novedades o resumen semanal para evaluar.';
    return;
  }
  isEvaluatingAi.value = true;
  aiEvaluationError.value = '';
  try {
    const res = await evaluateMeasurementsWithAi({
      roleName: selectedPair.value?.roleLabel || 'Cargo',
      areaName: selectedPair.value?.template?.area_label || 'Área',
      periodLabel: `${periodCheckpointLabel.value} · ${periodMonthName.value} ${periodYear.value}`,
      metrics: measurementRows.value.map(r => ({
        id: r.metric_id,
        name: r.name,
        meta_label: r.meta_label,
        meta_type: 'percentage'
      })),
      performanceText: aiPerformanceText.value.trim()
    });
    aiEvaluationResults.value = res;
  } catch (e) {
    aiEvaluationError.value = e.message || 'Error al procesar la evaluación con IA.';
  } finally {
    isEvaluatingAi.value = false;
  }
};

const applyAiEvaluation = () => {
  if (!aiEvaluationResults.value?.results) return;
  const byMetric = {};
  aiEvaluationResults.value.results.forEach(r => { byMetric[r.metric_id] = r; });

  measurementRows.value.forEach(row => {
    const evalData = byMetric[row.metric_id];
    if (evalData) {
      row.realizado_raw = evalData.realizado_raw || row.realizado_raw;
      row.percentage = evalData.percentage !== undefined && evalData.percentage !== null ? Number(evalData.percentage) : row.percentage;
      row.estado = evalData.estado || row.estado;
      row.notes = evalData.notes || row.notes;
    }
  });

  showAiEvaluatorModal.value = false;
};

// ============ DISEÑADOR DE TABLAS CON IA ============
const showAiDesignerModal = ref(false);
const designerTargetTemplate = ref(null);
const designerSelectedRoleId = ref(null);
const isGeneratingDesigner = ref(false);
const designerProposedKpis = ref([]);
const designerError = ref('');

const openAiDesignerForTemplate = (template) => {
  designerTargetTemplate.value = template;
  designerSelectedRoleId.value = template.kpi_role_template_links?.[0]?.role_id || null;
  designerProposedKpis.value = [];
  designerError.value = '';
  showAiDesignerModal.value = true;
};

const runAiDesigner = async () => {
  if (!designerSelectedRoleId.value) {
    designerError.value = 'Por favor selecciona un cargo para analizar su workflow.';
    return;
  }
  isGeneratingDesigner.value = true;
  designerError.value = '';
  try {
    const roleObj = allRoles.value.find(r => r.id === designerSelectedRoleId.value);
    const kpis = await generateRoleSpecificKpis(
      designerSelectedRoleId.value,
      roleObj?.name || 'Cargo',
      designerTargetTemplate.value?.area_label || 'Área'
    );
    designerProposedKpis.value = kpis.map(k => ({ ...k, selected: true }));
  } catch (e) {
    designerError.value = e.message || 'Error al generar la tabla de medición con IA.';
  } finally {
    isGeneratingDesigner.value = false;
  }
};

const saveAiDesignerToTemplate = async () => {
  const toAdd = designerProposedKpis.value.filter(k => k.selected && k.name.trim());
  if (toAdd.length === 0) {
    designerError.value = 'Selecciona al menos un KPI para agregar.';
    return;
  }
  try {
    const payload = toAdd.map((k, idx) => ({
      template_id: designerTargetTemplate.value.id,
      name: k.name,
      meta_label: k.meta_label,
      meta_type: k.meta_type || 'percentage',
      display_order: designerTargetTemplate.value.kpi_template_metrics.length + idx + 1
    }));
    const { data, error } = await supabase.from('kpi_template_metrics').insert(payload).select();
    if (error) throw error;
    designerTargetTemplate.value.kpi_template_metrics.push(...(data || []));
    showAiDesignerModal.value = false;
  } catch (e) {
    designerError.value = e.message || 'Error al guardar los KPIs en la plantilla.';
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

/* --- Estilos del Asistente y Diseñador de IA --- */
.template-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.ai-btn { color: #b08d57 !important; background: rgba(176, 141, 87, 0.1); padding: 6px 14px; border-radius: var(--radius-pill); border: 1px solid rgba(176, 141, 87, 0.3); transition: all 0.2s; margin-top: 0 !important; }
.ai-btn:hover { background: rgba(176, 141, 87, 0.2); transform: translateY(-1px); }

.ai-evaluator-card { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(176, 141, 87, 0.08) 0%, rgba(245, 245, 247, 0.8) 100%); border: 1px solid rgba(176, 141, 87, 0.25); border-radius: 14px; padding: 18px 22px; margin-bottom: 20px; gap: 20px; flex-wrap: wrap; }
.ai-evaluator-text { flex: 1; min-width: 280px; }
.ai-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.ai-badge-chip { display: inline-flex; align-items: center; gap: 4px; background: linear-gradient(135deg, #b08d57 0%, #80663f 100%); color: #fff; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 20px; box-shadow: 0 2px 6px rgba(176, 141, 87, 0.3); }
.checkpoint-label { font-size: 0.82rem; font-weight: 600; color: var(--gold-deep); }
.ai-evaluator-card h4 { margin: 0 0 4px 0; font-size: 1.05rem; color: var(--ink); }
.ai-desc { margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; }

.btn-ai-sparkle { background: linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%); color: #fff; border: 1px solid rgba(176, 141, 87, 0.5); padding: 10px 20px; border-radius: 22px; font-weight: 600; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.25s ease; box-shadow: 0 3px 10px rgba(0,0,0,0.1); white-space: nowrap; }
.btn-ai-sparkle:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(176, 141, 87, 0.25); border-color: #b08d57; }

/* Modales Grandes */
.modal-content.large-modal { max-width: 820px; max-height: 90vh; overflow-y: auto; }
.modal-header-ai { margin-bottom: 20px; }
.modal-header-ai h2 { margin: 8px 0 4px 0; }

.expected-metrics-bar { background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
.bar-title { display: block; font-size: 0.72rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; margin-bottom: 8px; }
.mini-metrics-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mini-metric-chip { background: var(--surface); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; color: var(--ink); }

.label-with-samples { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
.samples-buttons { display: flex; align-items: center; gap: 6px; }
.sample-label { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 500; }
.btn-sample { background: var(--surface); border: 1px solid var(--border); font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; cursor: pointer; color: var(--gold-deep); font-weight: 600; transition: all 0.15s; }
.btn-sample:hover { background: var(--gold-light); }

.ai-textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 12px; font-family: inherit; font-size: 0.88rem; color: var(--ink); background: var(--surface); resize: vertical; line-height: 1.45; }
.ai-textarea:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-light); }

.ai-action-row { margin-top: 14px; display: flex; justify-content: flex-end; }
.btn-magic-action { background: linear-gradient(135deg, #b08d57 0%, #80663f 100%); color: #fff; border: none; padding: 11px 24px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(176, 141, 87, 0.3); }
.btn-magic-action:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(176, 141, 87, 0.4); }
.btn-magic-action:disabled { opacity: 0.55; cursor: not-allowed; }

.ai-results-preview { margin-top: 24px; border-top: 2px dashed var(--border-subtle); padding-top: 20px; }
.results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.results-header h4 { margin: 0; font-size: 1.05rem; color: var(--ink); }
.preview-total-badge { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; padding: 4px 12px; border-radius: 14px; font-size: 0.85rem; font-weight: 600; }
.summary-box { background: rgba(176, 141, 87, 0.08); border-left: 4px solid var(--gold); padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; color: var(--ink); margin-bottom: 16px; line-height: 1.45; }

.preview-table { font-size: 0.82rem; }
.preview-input { width: 100%; padding: 5px 7px; border: 1px solid var(--border); border-radius: 5px; font-size: 0.8rem; font-family: inherit; }
.preview-input.pct { max-width: 60px; font-weight: 700; }
.preview-select { padding: 5px; border-radius: 5px; font-size: 0.8rem; }

.apply-cta-box { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-subtle); gap: 16px; flex-wrap: wrap; }
.apply-cta-box p { margin: 0; font-size: 0.8rem; color: var(--text-tertiary); }

/* Diseñador con IA */
.input-with-action { display: flex; gap: 10px; align-items: center; }
.designer-role-select { flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; font-family: inherit; background: var(--surface); }
.designer-proposals-box { margin-top: 20px; }
.section-title { font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 10px; }
.kpi-proposal-card { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 10px; }
.proposal-check { margin-top: 6px; transform: scale(1.15); cursor: pointer; }
.proposal-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.kpi-name-field { width: 100%; padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; font-weight: 600; font-size: 0.88rem; }
.proposal-meta-row { display: flex; gap: 8px; align-items: center; }
.meta-tag { font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; }
.meta-field { max-width: 120px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.82rem; font-weight: 600; }
.type-field { padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.82rem; }
</style>

<template>
  <div class="mapper-view">
    <header class="stitch-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-link cursor-pointer">
          <span class="material-symbols-outlined text-sm mr-1">arrow_back</span>
          Volver
        </button>
        <h1 class="gold-gradient-text text-2xl font-semibold tracking-tight mt-2">Mapeo de Flujo: {{ role?.name || 'Cargando...' }}</h1>
        <p class="text-sm text-gray-500 mt-1">Área: {{ role?.areas?.name || 'Cargando...' }}</p>
      </div>
    </header>

    <div class="mapper-layout">
      <!-- Sección 1: Preguntas Guía (Stitch Style) -->
      <aside class="surface-container guide-panel">
        <div class="guide-badge"><span class="material-symbols-outlined text-sm mr-1">lightbulb</span> Guía rápida</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Cuéntanos cómo es tu día a día</h3>
        <p class="guide-desc">No hace falta preparar nada especial: contesta con tus propias palabras, como si se lo explicaras a un compañero nuevo. Nosotros nos encargamos de organizar toda la información por ti.</p>

        <ul class="questions-list">
          <li>
            <span class="q-icon material-symbols-outlined">record_voice_over</span>
            <div>
              <strong>Sé natural</strong>
              <p>No necesitas usar términos técnicos ni seguir un formato.</p>
            </div>
          </li>
          <li>
            <span class="q-icon material-symbols-outlined">auto_awesome</span>
            <div>
              <strong>Ordenamos los detalles</strong>
              <p>Identificamos tareas, entregables y cuellos de botella.</p>
            </div>
          </li>
          <li>
            <span class="q-icon material-symbols-outlined">check_circle</span>
            <div>
              <strong>Queda listo para tu equipo</strong>
              <p>Tu información aparecerá estructurada en el Mapa de Cargos.</p>
            </div>
          </li>
        </ul>

        <div class="recording-tip">
          <span class="material-symbols-outlined text-gold-deep mr-2">mic</span>
          <small>También puedes grabar la conversación, pasarla a texto y subir el archivo.</small>
        </div>
      </aside>

      <!-- Panel Principal -->
      <main class="surface-container process-panel">
        
        <!-- Corporate Stepper -->
        <ol class="step-tracker">
          <li :class="{ active: step === 1, done: step > 1 }">
            <span class="step-dot"><span v-if="step > 1" class="material-symbols-outlined text-sm">check</span><span v-else>1</span></span> 
            <span class="step-label">Captura</span>
          </li>
          <li class="connector"></li>
          <li :class="{ active: step === 2 || step === 3, done: step > 3 }">
            <span class="step-dot"><span v-if="step > 3" class="material-symbols-outlined text-sm">check</span><span v-else>2</span></span> 
            <span class="step-label">Análisis Sintético</span>
          </li>
          <li class="connector"></li>
          <li :class="{ active: step === 4 }">
            <span class="step-dot">3</span> 
            <span class="step-label">Consolidación</span>
          </li>
        </ol>

        <!-- Paso 1: Subida -->
        <div class="step-content w-full" v-show="step === 1">
          <h2 class="text-xl font-medium text-gray-900 mb-6 text-center">Cuéntanos tu proceso</h2>

          <div class="stitch-tabs">
            <button :class="['stitch-tab', { active: inputMode === 'wizard' }]" @click="inputMode = 'wizard'">
              Asistente Interactivo (Recomendado)
            </button>
            <button :class="['stitch-tab', { active: inputMode === 'transcript' }]" @click="inputMode = 'transcript'">
              Subir Transcripción / Archivo
            </button>
          </div>

          <div v-if="inputMode === 'wizard'" class="mt-8">
            <WorkflowWizard @submit="handleWizardSubmit" />
            <p v-if="processError" class="error-text mt-4 text-center">{{ processError }}</p>
          </div>

          <div v-else class="transcript-form mt-8">
            <p class="text-center text-gray-500 text-sm mb-6">Sube el archivo de texto de la entrevista o pega la transcripción completa aquí.</p>

            <div class="drop-zone" @click="triggerFileInput">
              <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">upload_file</span>
              <p class="text-sm text-gray-600 font-medium">Haz clic para subir archivo (.txt, .md)</p>
              <input type="file" ref="fileInput" @change="handleFileUpload" accept=".txt,.md,.doc,.docx" style="display:none">
            </div>
            
            <div class="or-divider">O Pega el Texto Directamente</div>
            
            <textarea class="stitch-input" v-model="rawTranscript" placeholder="Pega aquí la transcripción de la entrevista..." rows="8"></textarea>
            
            <p v-if="processError" class="error-text mt-2">{{ processError }}</p>
            <div class="flex justify-center mt-6">
              <button class="btn-primary" :disabled="!rawTranscript.trim() || processing" @click="processWithAI(rawTranscript)">
                <span class="material-symbols-outlined mr-2" v-if="!processing">memory</span>
                {{ processing ? 'Procesando con IA...' : 'Procesar Transcripción' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Paso 2: Procesamiento -->
        <div class="processing-section w-full flex flex-col items-center justify-center py-12" v-if="step === 2">
          <NeuronAnimation />
          <p class="mt-6 text-gray-500 font-medium animate-pulse">Analizando correlaciones y estructurando el proceso...</p>
        </div>

        <!-- Paso 3: Resultados Visuales (Pipeline) -->
        <div class="results-section w-full" v-if="step === 3">
          <div class="text-center mb-8">
            <h2 class="text-xl font-medium text-gray-900">Cartografía de Procesos</h2>
            <p class="text-sm text-gray-500 mt-1">Revisa el flujo extraído. Si es correcto, presiona Guardar.</p>
          </div>
          
          <div class="pipeline-container">
            <!-- Columna 1: Inputs -->
            <div class="pipeline-col">
              <h4 class="col-title"><span class="material-symbols-outlined">login</span> Entradas (Inputs)</h4>
              <div class="nodes-list">
                <div class="node node-input" v-for="(item, idx) in extractedData.inputs" :key="'in'+idx">
                  {{ item }}
                </div>
                <div v-if="!extractedData.inputs?.length" class="empty-node">Sin entradas identificadas</div>
              </div>
            </div>

            <div class="pipeline-connector material-symbols-outlined">arrow_forward</div>

            <!-- Columna 2: Proceso (Tasks + Bottlenecks) -->
            <div class="pipeline-col pipeline-col-main">
              <h4 class="col-title"><span class="material-symbols-outlined">account_tree</span> Secuencia Operativa</h4>
              
              <!-- Badges de Herramientas -->
              <div class="tools-badges mb-4 flex flex-wrap gap-2 justify-center" v-if="extractedData.tools_used?.length">
                <span class="tool-badge" v-for="(tool, i) in extractedData.tools_used" :key="'tool'+i">
                  <span class="material-symbols-outlined text-xs mr-1">build</span> {{ tool }}
                </span>
              </div>

              <div class="process-nodes">
                <div class="node node-task relative" v-for="(task, idx) in extractedData.tasks" :key="'task'+idx">
                  <div class="task-number">{{ idx + 1 }}</div>
                  <p>{{ task }}</p>
                </div>
              </div>

              <!-- Badges de Cuellos de botella y Decisiones -->
              <div class="alerts-container mt-6 space-y-2">
                <div v-for="(bn, i) in extractedData.bottlenecks" :key="'bn'+i" class="alert-node danger">
                  <span class="material-symbols-outlined">warning</span>
                  <div class="text-xs">{{ bn }}</div>
                </div>
                <div v-for="(rule, i) in extractedData.decision_rules" :key="'rule'+i" class="alert-node warning">
                  <span class="material-symbols-outlined">alt_route</span>
                  <div class="text-xs">{{ rule }}</div>
                </div>
              </div>
            </div>

            <div class="pipeline-connector material-symbols-outlined">arrow_forward</div>

            <!-- Columna 3: Outputs & KPIs -->
            <div class="pipeline-col">
              <h4 class="col-title"><span class="material-symbols-outlined">logout</span> Entregables (Outputs)</h4>
              <div class="nodes-list">
                <div class="node node-output" v-for="(item, idx) in extractedData.outputs" :key="'out'+idx">
                  {{ item }}
                </div>
                <div v-if="!extractedData.outputs?.length" class="empty-node">Sin entregables identificados</div>
              </div>

              <h4 class="col-title mt-6"><span class="material-symbols-outlined">monitoring</span> KPIs</h4>
              <div class="nodes-list">
                <div class="node node-kpi" v-for="(item, idx) in extractedData.kpis" :key="'kpi'+idx">
                  <span class="material-symbols-outlined text-xs mr-1 text-green-600">trending_up</span> {{ item }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-center gap-4 mt-10 border-t border-gray-100 pt-6">
            <button class="btn-secondary" @click="step = 1">
              <span class="material-symbols-outlined mr-2">refresh</span> Volver a intentar
            </button>
            <button class="btn-primary" @click="saveWorkflow">
              <span class="material-symbols-outlined mr-2">save</span> Guardar Flujo
            </button>
          </div>
        </div>

        <!-- Paso 4: Éxito -->
        <div class="success-section w-full text-center py-12" v-if="step === 4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
            <span class="material-symbols-outlined text-3xl text-green-500">task_alt</span>
          </div>
          <h2 class="text-2xl font-medium text-gray-900 mb-2">¡Mapeo Exitoso!</h2>
          <p class="text-gray-500 max-w-md mx-auto mb-8">La cartografía del cargo <strong>{{ role?.name }}</strong> se ha registrado en la red central y está disponible en el Mapa de Cargos.</p>
          
          <p v-if="lockedForSelf" class="text-xs text-red-400 mb-6 font-medium">Información archivada. Como titular, ahora ingresarás directamente a tu Portal.</p>
          
          <a :href="isOwnRole ? '/workspace' : '/mapa-cargos'" class="btn-primary inline-flex">
            {{ isOwnRole ? 'Ir a mi Portal' : 'Volver al Directorio' }}
          </a>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import WorkflowWizard from '../components/WorkflowWizard.vue';
import NeuronAnimation from '../components/NeuronAnimation.vue';

const route = useRoute();
const role_id = route.params.role_id;

const lockedForSelf = computed(() => currentProfile.value?.role_id === role_id && !currentProfile.value?.is_master_admin);
const isOwnRole = computed(() => currentProfile.value?.role_id === role_id);

const role = ref(null);
const step = ref(1);
const inputMode = ref('wizard'); 
const rawTranscript = ref('');
const selectedFile = ref(null);
const fileInput = ref(null);
const processing = ref(false);
const processError = ref('');
const lastSourceText = ref('');

const extractedData = ref({
  inputs: [],
  tasks: [],
  outputs: [],
  tools_used: [],
  bottlenecks: [],
  kpis: [],
  decision_rules: [],
  coordination: [],
  unmet_needs: []
});

onMounted(async () => {
  if (!currentProfile.value) {
    await loadCurrentProfile();
  }

  const { data } = await supabase
    .from('roles')
    .select('*, areas(name)')
    .eq('id', role_id)
    .single();

  if (data) {
    role.value = data;
  }
});

const logMappingAudit = async (action, fileName = null) => {
  const profileId = currentProfile.value?.id;
  if (!profileId) return;
  try {
    await supabase.from('mapping_audit_log').insert({
      profile_id: profileId,
      role_id: role_id,
      action,
      file_name: fileName,
      user_agent: navigator.userAgent
    });
  } catch (e) {
    console.error('Error registrando auditoría de mapeo:', e);
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      rawTranscript.value = e.target.result;
    };
    reader.readAsText(file);
    logMappingAudit('file_uploaded', file.name);
  }
};

const handleWizardSubmit = (sourceText) => {
  processWithAI(sourceText);
};

const processWithAI = async (sourceText) => {
  if (!sourceText.trim() || processing.value) return;

  lastSourceText.value = sourceText;
  processError.value = '';
  processing.value = true;
  step.value = 2;

  try {
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://prometheus-os.onrender.com').replace(/\/+$/, '');
    const sessionResponse = await supabase.auth.getSession();
    const token = sessionResponse.data.session?.access_token;
    
    const response = await fetch(`${apiUrl}/api/v1/extract-workflow`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roleId: role_id, sourceText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'No se pudo procesar la información.');
    }

    extractedData.value = data.workflow;
    step.value = 3;
  } catch (err) {
    console.error('Error processing workflow:', err);
    processError.value = err.message || 'Error procesando la información con IA.';
    step.value = 1;
  } finally {
    processing.value = false;
  }
};

const saveWorkflow = async () => {
  try {
    const { error } = await supabase
      .from('role_workflows')
      .upsert({
        role_id: role_id,
        tasks: extractedData.value.tasks,
        inputs: extractedData.value.inputs,
        outputs: extractedData.value.outputs,
        tools_used: extractedData.value.tools_used,
        bottlenecks: extractedData.value.bottlenecks,
        kpis: extractedData.value.kpis,
        decision_rules: extractedData.value.decision_rules,
        coordination: extractedData.value.coordination,
        unmet_needs: extractedData.value.unmet_needs,
        raw_transcript: lastSourceText.value
      }, { onConflict: 'role_id' });

      if (error) {
        console.error('Error guardando mapeo en la red central:', error);
        alert('Error conectando con la red central: ' + error.message);
      } else {
        await logMappingAudit('workflow_saved');

        if (isOwnRole.value) {
          const { error: profileError } = await supabase.from('profiles').update({ mapping_completed: true }).eq('id', currentProfile.value.id);
          if (profileError) console.error("Error updating profile mapping status:", profileError);
          await loadCurrentProfile();
        }

        step.value = 4;
      }
  } catch (err) {
    console.error("Error saving workflow:", err);
    alert("Ocurrió un error al guardar: " + err.message);
  }
};
</script>

<style scoped>
.mapper-view {
  padding: 24px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--bg-tertiary, #f5f5f7);
  font-family: 'Inter', sans-serif;
}

.stitch-header {
  padding: 16px 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: #b08d57;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}
.back-link:hover { opacity: 0.8; }

.gold-gradient-text {
  background: linear-gradient(135deg, #d4b06a 0%, #b08d57 50%, #8a6d3d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mapper-layout {
  display: flex;
  gap: 24px;
  flex: 1;
}

.surface-container {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.guide-panel {
  width: 320px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.guide-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(212, 176, 106, 0.1);
  color: #b08d57;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  margin-bottom: 16px;
  align-self: flex-start;
}

.guide-desc {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 24px;
}

.questions-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.questions-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.q-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a6d3d;
  background: rgba(212, 176, 106, 0.05);
  border-radius: 8px;
}

.questions-list li strong {
  color: #1e293b;
  font-size: 0.875rem;
  display: block;
}

.questions-list li p {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 2px 0 0 0;
}

.recording-tip {
  margin-top: auto;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  color: #475569;
}
.recording-tip small { line-height: 1.4; }

.process-panel {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

/* Stepper */
.step-tracker {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin-bottom: 40px;
}

.step-tracker li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.step-tracker li.connector {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 16px;
  margin-bottom: 20px;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.step-tracker li.active .step-dot {
  background: #ffffff;
  border-color: #b08d57;
  color: #b08d57;
}

.step-tracker li.active .step-label { color: #1e293b; }

.step-tracker li.done .step-dot {
  background: #b08d57;
  border-color: #b08d57;
  color: #ffffff;
}
.step-tracker li.done .step-label { color: #b08d57; }


/* Form / Upload */
.stitch-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 99px;
  width: fit-content;
  margin: 0 auto;
}

.stitch-tab {
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.stitch-tab.active {
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8fafc;
}
.drop-zone:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.or-divider {
  text-align: center;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 24px 0;
  position: relative;
}
.or-divider::before, .or-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 100px);
  height: 1px;
  background: #e2e8f0;
}
.or-divider::before { left: 0; }
.or-divider::after { right: 0; }

.stitch-input {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #1e293b;
  font-size: 0.875rem;
  resize: vertical;
  transition: all 0.2s;
}
.stitch-input:focus {
  outline: none;
  border-color: #b08d57;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(176, 141, 87, 0.1);
}

/* Pipeline Visualizer (Paso 3) */
.pipeline-container {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  background: #f8fafc;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
}

.pipeline-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pipeline-col-main {
  flex: 2; /* El centro (procesos) es más ancho */
}

.pipeline-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 1.5rem;
  padding: 0 8px;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.col-title .material-symbols-outlined { font-size: 1.1rem; }

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node {
  padding: 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.node-input {
  border-left: 3px solid #3b82f6;
}

.node-output {
  border-left: 3px solid #b08d57;
}

.node-kpi {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
  display: flex;
  align-items: center;
}

.process-nodes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.process-nodes::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 14px;
  width: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.node-task {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 16px;
  border-color: #cbd5e1;
  position: relative;
  z-index: 1;
}

.task-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #cbd5e1;
  margin-top: -2px;
}

.tool-badge {
  display: inline-flex;
  align-items: center;
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.alert-node {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
}

.alert-node.danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-node.warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.alert-node .material-symbols-outlined { font-size: 1rem; margin-top: 1px; }

.empty-node {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Botones */
.btn-primary {
  display: inline-flex;
  align-items: center;
  background: #1e293b;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.15);
}
.btn-primary:hover:not(:disabled) {
  background: #0f172a;
  transform: translateY(-1px);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: #f8fafc; }

</style>

<template>
  <div class="mapper-view">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <router-link to="/mapa-cargos" class="back-link">← Volver al Directorio</router-link>
        <h1>Mapeo de Flujo: {{ role?.name || 'Cargando...' }}</h1>
        <p>Área: {{ role?.areas?.name || 'Cargando...' }}</p>
      </div>
    </header>

    <div class="mapper-layout">
      <!-- Sección 1: Preguntas Guía -->
      <aside class="glass-panel guide-panel">
        <div class="guide-badge"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Guía rápida</div>
        <h3>Cuéntanos cómo es tu día a día</h3>
        <p class="guide-desc">No hace falta preparar nada especial: contesta con tus propias palabras, como si se lo explicaras a un compañero nuevo. Nosotros nos encargamos de organizar toda la información por ti.</p>

        <ul class="questions-list">
          <li>
            <span class="q-icon">🗣️</span>
            <div>
              <strong>Sé natural</strong>
              <p>No necesitas usar términos técnicos ni seguir un formato. Simplemente cuenta lo que haces.</p>
            </div>
          </li>
          <li>
            <span class="q-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
            <div>
              <strong>Nosotros ordenamos los detalles</strong>
              <p>Identificamos tus tareas, lo que entregas y los puntos donde el proceso se traba.</p>
            </div>
          </li>
          <li>
            <span class="q-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></span>
            <div>
              <strong>Queda listo para tu equipo</strong>
              <p>Al terminar, tu información aparecerá organizada en el Mapa de Cargos.</p>
            </div>
          </li>
          <li>
            <span class="q-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
            <div>
              <strong>¿Tienes dudas?</strong>
              <p>Consulta a tu líder directo en cualquier momento.</p>
            </div>
          </li>
        </ul>

        <div class="recording-tip">
          <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></span>
          <small>Si prefieres, alguien puede grabar la conversación, pasarla a texto y pegarla en la pestaña "Subir Transcripción / Archivo".</small>
        </div>
      </aside>

      <!-- Sección 1: Carga y Procesamiento -->
      <main class="glass-panel process-panel">
        <ol class="step-tracker">
          <li :class="{ active: step === 1, done: step > 1 }">
            <span class="step-dot">{{ step > 1 ? '✓' : '1' }}</span> Cuéntanos
          </li>
          <li :class="{ active: step === 2 || step === 3, done: step > 3 }">
            <span class="step-dot">{{ step > 3 ? '✓' : '2' }}</span> Revisar
          </li>
          <li :class="{ active: step === 4 }">
            <span class="step-dot">3</span> Listo
          </li>
        </ol>

        <div class="upload-section" v-show="step === 1">
          <h2>Cuéntanos tu proceso</h2>

          <div class="tabs">
            <button
              :class="['tab-btn', { active: inputMode === 'wizard' }]"
              @click="inputMode = 'wizard'"
            >
              Asistente Interactivo (Recomendado)
            </button>
            <button
              :class="['tab-btn', { active: inputMode === 'transcript' }]"
              @click="inputMode = 'transcript'"
            >
              Subir Transcripción / Archivo
            </button>
          </div>

          <div v-if="inputMode === 'wizard'" class="fields-form">
            <WorkflowWizard @submit="handleWizardSubmit" />
            <p v-if="processError" class="error-text" style="margin-top: 15px; font-weight: bold;">{{ processError }}</p>
          </div>

          <div v-else class="transcript-form">
            <p>Sube el archivo de texto de la entrevista o pega la transcripción completa aquí.</p>

            <div class="drop-zone" @click="triggerFileInput">
              <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>
              <p>Haz clic para subir archivo (.txt, .md)</p>
              <input type="file" ref="fileInput" @change="handleFileUpload" accept=".txt,.md,.doc,.docx" style="display:none">
            </div>
            <div class="or-divider">O Pega el Texto Directamente</div>
            <textarea v-model="rawTranscript" placeholder="Pega aquí la transcripción de la entrevista..." rows="8"></textarea>
            
            <p v-if="processError" class="error-text">{{ processError }}</p>
            <button class="btn-primary" style="margin-top: 10px;" :disabled="!rawTranscript.trim() || processing" @click="processWithAI(rawTranscript)">
              {{ processing ? 'Procesando...' : 'Procesar Transcripción con IA' }}
            </button>
          </div>
        </div>

        <!-- Estado de Procesamiento -->
        <div class="processing-section" v-if="step === 2">
          <NeuronAnimation />
        </div>

        <!-- Resultados del Procesamiento -->
        <div class="results-section" v-if="step === 3">
          <h2>Revisa lo que entendimos</h2>
          <p>Así organizamos tu proceso. Revísalo y, si todo está correcto, guárdalo.</p>
          
          <div class="extracted-data">
            <div class="data-block">
              <label>Entradas (Inputs):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.inputs" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div class="data-block">
              <label>Tareas/Responsabilidades (Secuencia):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.tasks" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div class="data-block">
              <label>Herramientas, Sistemas y Soportes:</label>
              <div class="tags">
                <span class="tag" v-for="(item, idx) in extractedData.tools_used" :key="idx">{{ item }}</span>
              </div>
            </div>
            
            <div class="data-block">
              <label>Salidas y Entregables (Outputs):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.outputs" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div class="data-block">
              <label>Cuellos de Botella (Desperdicios y Demoras):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.bottlenecks" :key="idx" class="warning-item">{{ item }}</li>
              </ul>
            </div>

            <div class="data-block">
              <label>Indicadores de Éxito (KPIs):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.kpis" :key="idx" style="color: var(--success);">{{ item }}</li>
              </ul>
            </div>
            <div class="data-block" style="border-left: 4px solid var(--gold);">
              <label>Reglas de Decisión (Bifurcaciones):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.decision_rules" :key="idx">{{ item }}</li>
              </ul>
            </div>

            <div class="data-block" style="border-left: 4px solid var(--gold-deep);">
              <label>Coordinación Interdepartamental (Puntos de contacto):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.coordination" :key="idx">{{ item }}</li>
              </ul>
            </div>

            <div class="data-block" style="border-left: 4px solid var(--danger);">
              <label>Necesidades Operativas (Falta de herramientas/procesos):</label>
              <ul>
                <li v-for="(item, idx) in extractedData.unmet_needs" :key="idx" class="warning-item">{{ item }}</li>
              </ul>
            </div>
            
          </div>
          
          <div class="actions">
            <button class="btn-edit" @click="step = 1">Volver a intentar</button>
            <button class="btn-primary" @click="saveWorkflow">Guardar Flujo de Trabajo</button>
          </div>
        </div>

        <div class="success-section" v-if="step === 4">
          <span class="success-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></span>
          <h2>¡Listo! Tu proceso quedó registrado</h2>
          <p>Guardamos la información del cargo <strong>{{ role?.name }}</strong>. Ya está disponible para tu equipo en el Mapa de Cargos.</p>
          <p v-if="lockedForSelf" class="lock-note">Esta información queda archivada para futuras consultas. No podrás volver a editarla — ya tienes acceso a tu Portal del Empleado.</p>
          <router-link :to="lockedForSelf ? '/workspace' : '/mapa-cargos'" class="btn-primary">
            {{ lockedForSelf ? 'Ir a mi Portal del Empleado' : 'Volver al Directorio' }}
          </router-link>
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

// Si quien mapea es el dueño del rol (no un admin editando por otra persona),
// al guardar se le cierra el acceso a esta pantalla (ver saveWorkflow).
const lockedForSelf = computed(() => currentProfile.value?.role_id === role_id && !currentProfile.value?.is_master_admin);

const role = ref(null);
const step = ref(1);
const inputMode = ref('wizard'); // 'wizard' | 'transcript'
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

// Auditoría del proceso de mapeo -- queda registrado quién sube qué archivo
// y cuándo se guarda el flujo, para revisión de ciberseguridad posterior.
const logMappingAudit = async (action, fileName = null) => {
  const profileId = currentProfile.value?.id;
  if (!profileId) return; // Sin sesión (ej. entorno de pruebas) -- no bloquea el flujo, solo no queda registro.
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
    const apiUrl = import.meta.env.VITE_API_URL || 'https://prometheus-os.onrender.com';
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

        // Si quien mapeó es el dueño del rol, se le cierra el acceso a esta
        // pantalla -- de ahora en más solo entra a su Portal del Empleado.
        if (lockedForSelf.value) {
          await supabase.from('profiles').update({ mapping_completed: true }).eq('id', currentProfile.value.id);
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: var(--shadow-sm);
}

.hub-header {
  padding: 24px;
}

.back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.hub-header h1 {
  font-size: 1.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.hub-header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.mapper-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.guide-panel {
  width: 340px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.guide-badge {
  align-self: flex-start;
  background: var(--gold-light);
  color: var(--gold-deep);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  margin-bottom: 14px;
}

.guide-panel h3 {
  color: var(--ink);
  font-size: 1.25rem;
  line-height: 1.3;
  margin-bottom: 10px;
}

.guide-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.55;
  margin-bottom: 24px;
}

.questions-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.questions-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.q-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.questions-list li strong {
  color: var(--ink);
  display: block;
  font-size: 0.92rem;
  margin-bottom: 3px;
}

.questions-list li p {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.45;
  margin: 0;
}

.recording-tip {
  margin-top: auto;
  background: var(--gold-light);
  border: 1px solid var(--gold-light);
  padding: 14px;
  border-radius: var(--radius-sm);
  display: flex;
  gap: 12px;
  color: var(--gold-deep);
}

.recording-tip small {
  line-height: 1.4;
}

.process-panel {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.step-tracker {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  margin: 0 0 36px 0;
  width: 100%;
  max-width: 700px;
}

.step-tracker li {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.step-tracker li:not(:last-child)::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.step-dot {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
}

.step-tracker li.active {
  color: var(--ink);
}

.step-tracker li.active .step-dot {
  background: var(--gold-gradient);
  border-color: transparent;
  color: #fff;
}

.step-tracker li.done .step-dot {
  background: var(--success);
  border-color: transparent;
  color: #fff;
}

.upload-section {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tabs {
  display: flex;
  gap: 12px;
}

.tab-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-sans);
}

.tab-btn.active {
  background: var(--gold-light);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.fields-form, .transcript-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-text {
  color: var(--danger);
  font-size: 0.9rem;
  margin: 0;
}

.drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.drop-zone:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
}

.drop-zone .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 12px;
}

.or-divider {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 2px;
}

textarea {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--ink);
  padding: 16px;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  font-size: 1rem;
  box-shadow: var(--shadow-sm);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-edit {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.processing-section, .success-section {
  text-align: center;
  margin-top: 60px;
}

.success-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 12px;
}

.lock-note {
  max-width: 480px;
  margin: 16px auto 24px auto;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.results-section {
  width: 100%;
  max-width: 800px;
}

.results-section h2 {
  color: var(--ink);
  margin-bottom: 8px;
}

.results-section p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.data-block {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.data-block label {
  display: block;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--gold-deep);
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.data-block ul {
  margin: 0;
  padding-left: 20px;
  color: var(--ink-secondary);
}

.data-block li {
  margin-bottom: 8px;
}

.warning-item {
  color: var(--danger);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--bg-secondary);
  color: var(--ink-secondary);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-family: var(--font-mono);
}

.actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}
</style>

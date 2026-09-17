<template>
  <div class="knowledge-loader">
    <header class="glass-panel header">
      <button @click="$router.back()" class="back-link cursor-pointer">← Volver</button>
      <h1>Cargador de Conocimiento <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path><path d="M6.002 6.5A3 3 0 0 1 5.603 5.125"></path><path d="M11.8 12a1 1 0 0 0-1.6 0"></path></svg></h1>
      <p>Sube manuales, políticas y procesos para entrenar el Cerebro Corporativo.</p>
    </header>

    <main class="content-grid">
      <!-- Sección de Subida -->
      <section class="glass-panel upload-section">
        <h2>Inyectar Memoria</h2>
        
        <div class="tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'text' }]" 
            @click="activeTab = 'text'"
          >
            Pegar Texto
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'file' }]" 
            @click="activeTab = 'file'"
          >
            Subir Archivo
          </button>
        </div>

        <div v-if="activeTab === 'text'" class="tab-content text-input">
          <label>Origen (Ej: Manual de Ventas):</label>
          <input type="text" v-model="sourceName" placeholder="Nombre del documento fuente" />
          
          <label>Contenido (Copia y pega la información aquí):</label>
          <textarea
            v-model="rawText"
            placeholder="Pega aquí los procesos, políticas o descripciones..."
            rows="10"
          ></textarea>

          <label>Alcance de acceso (RBAC):</label>
          <select v-model="scopeAreaId">
            <option value="">General - Visible para toda la empresa (Nivel 1)</option>
            <option v-for="area in areas" :key="area.id" :value="area.id">
              Solo Área: {{ area.name }} (Nivel 2)
            </option>
          </select>

          <button class="btn-primary" @click="processText" :disabled="loading || !rawText">
            {{ loading ? 'Procesando...' : 'Inyectar al Cerebro' }}
          </button>
        </div>

        <div v-if="activeTab === 'file'" class="tab-content file-upload">
          <div class="drop-zone" @click="$refs.fileInput.click()">
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden-input" 
              accept=".txt,.md,.csv" 
              @change="handleFileUpload" 
            />
            <div class="drop-content">
              <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>
              <p>Haz clic para subir un archivo (TXT, MD)</p>
              <small>Próximamente: Soporte nativo para PDFs.</small>
            </div>
          </div>
          
          <div v-if="selectedFile" class="file-details">
            <p><strong>Archivo seleccionado:</strong> {{ selectedFile.name }}</p>
            <button class="btn-primary" @click="processFile" :disabled="loading">
              {{ loading ? 'Procesando...' : 'Extraer e Inyectar' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Sección de Estado / Log -->
      <section class="glass-panel status-section">
        <h2>Registro de Ingestión</h2>
        <div class="log-container">
          <div v-if="logs.length === 0" class="empty-log">
            No hay operaciones recientes.
          </div>
          <div 
            v-for="(log, idx) in logs" 
            :key="idx" 
            :class="['log-item', log.type]"
          >
            <span class="time">[{{ log.time }}]</span>
            <span class="msg">{{ log.message }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../api/supabase';

const activeTab = ref('text');
const sourceName = ref('');
const rawText = ref('');
const selectedFile = ref(null);
const loading = ref(false);
const logs = ref([]);
const areas = ref([]);
const scopeAreaId = ref('');

const addLog = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ time, message, type });
};

onMounted(async () => {
  const { data } = await supabase.from('areas').select('id, name').order('name');
  areas.value = data || [];
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    sourceName.value = file.name;
    addLog(`Archivo cargado en memoria local: ${file.name}`);
  }
};

const sendToApi = async (text, source) => {
  try {
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        source,
        metadata: {
          uploaded_by: 'Admin',
          chunk_size: text.length,
          area_id: scopeAreaId.value || null
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      addLog(`Éxito: Vector guardado. ID: ${data.recordId}`, 'success');
      rawText.value = '';
    } else {
      addLog(`Error del Servidor: ${data.error}`, 'error');
    }
  } catch (error) {
    addLog(`Fallo de conexión: ${error.message}`, 'error');
  }
};

const processText = async () => {
  if (!rawText.value) return;
  
  loading.value = true;
  addLog(`Iniciando fragmentación y vectorización (Voyage AI)...`);
  
  // Basic naive chunking (In production, use semantic chunking or LangChain)
  const chunks = rawText.value.split('\n\n').filter(c => c.trim().length > 10);
  
  addLog(`Se generaron ${chunks.length} párrafos lógicos.`);

  for (let i = 0; i < chunks.length; i++) {
    addLog(`Procesando chunk ${i + 1}/${chunks.length}...`);
    await sendToApi(chunks[i].trim(), sourceName.value || 'Ingreso Manual');
  }

  addLog(`Proceso finalizado. El Cerebro Corporativo ha sido actualizado.`, 'success');
  loading.value = false;
};

const processFile = () => {
  if (!selectedFile.value) return;
  
  loading.value = true;
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    rawText.value = e.target.result;
    await processText();
  };
  
  reader.onerror = () => {
    addLog(`Error al leer el archivo.`, 'error');
    loading.value = false;
  };
  
  reader.readAsText(selectedFile.value);
};
</script>

<style scoped>
.knowledge-loader {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
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
  padding: 24px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 1.8rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 10px 0;
}

.header p {
  color: var(--text-secondary);
}

.back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
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

.text-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-input label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.text-input input, .text-input textarea, .text-input select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-family: inherit;
}

.text-input input:focus, .text-input textarea:focus, .text-input select:focus {
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
  margin-top: 12px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  border-color: var(--gold);
  background: var(--gold-light);
}

.hidden-input {
  display: none;
}

.icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.file-details {
  margin-top: 24px;
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-sm);
}

.log-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 16px;
  height: 400px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.empty-log {
  color: var(--text-tertiary);
}

.log-item {
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 8px;
}

.time {
  color: var(--text-tertiary);
  margin-right: 8px;
}

.log-item.info .msg { color: var(--ink-secondary); }
.log-item.success .msg { color: var(--success); }
.log-item.error .msg { color: var(--danger); }

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="knowledge-loader">
    <header class="glass-panel header">
      <router-link to="/data-hub" class="back-link">← Volver al DataHub</router-link>
      <h1>Cargador de Conocimiento 🧠</h1>
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
              <span class="icon">📄</span>
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

  addLog(`✅ Proceso finalizado. El Cerebro Corporativo ha sido actualizado.`, 'success');
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
  color: #fff;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 24px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 1.8rem;
  background: linear-gradient(90deg, #00f0ff, #7000ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 10px 0;
}

.back-link {
  color: #00f0ff;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.tab-btn.active {
  background: rgba(0, 240, 255, 0.1);
  border-color: #00f0ff;
  color: #00f0ff;
}

.text-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-input input, .text-input textarea, .text-input select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  font-family: inherit;
}

.text-input input:focus, .text-input textarea:focus, .text-input select:focus {
  outline: none;
  border-color: #00f0ff;
}

.btn-primary {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-zone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: #00f0ff;
  background: rgba(0, 240, 255, 0.05);
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
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
}

.log-container {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 16px;
  height: 400px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}

.log-item {
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
}

.time {
  color: #666;
  margin-right: 8px;
}

.log-item.info .msg { color: #fff; }
.log-item.success .msg { color: #00ff99; }
.log-item.error .msg { color: #ff3366; }

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

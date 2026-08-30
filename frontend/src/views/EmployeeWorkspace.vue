<template>
  <div class="workspace-container">
    <!-- Navbar Superior -->
    <header class="glass-panel workspace-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
        <h1>Portal del Empleado</h1>
      </div>
      <div class="header-right">
        <!-- Selector de Rol (Simulador) -->
        <div class="role-selector">
          <label>Identidad Activa:</label>
          <select v-model="selectedRoleId" @change="changeRole" class="glass-select" :disabled="loadingRoles">
            <option value="" disabled>Selecciona tu rol...</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <div v-if="!selectedRoleId" class="empty-state glass-panel">
      <span class="icon">👋</span>
      <h2>Bienvenido al Portal de Elite Nutrition</h2>
      <p>Por favor, selecciona tu cargo en el menú superior para acceder a tu espacio de trabajo.</p>
    </div>

    <div v-else class="workspace-content">
      <!-- Columna Izquierda: KPIs y Tareas -->
      <div class="sidebar-column">
        <!-- Tarjeta de Identidad -->
        <div class="glass-panel profile-card">
          <div class="avatar">{{ getInitials(currentRole?.name) }}</div>
          <div class="profile-info">
            <h2>{{ currentRole?.name }}</h2>
            <p>{{ currentRole?.areas?.name || 'Área General' }}</p>
          </div>
        </div>

        <!-- Mini Dashboard de KPIs -->
        <div class="glass-panel mini-kpi">
          <h3>Mis Métricas Actuales</h3>
          <div v-if="loadingKpis" class="loading-text">Cargando métricas...</div>
          <div v-else class="kpi-score" :class="getScoreColor(currentKpi.overall_score)">
            <span class="score-number">{{ currentKpi.overall_score.toFixed(1) }}</span>
            <span class="score-label">Rendimiento General</span>
          </div>
          <p class="kpi-insight" v-if="currentKpi.ai_evaluation_notes">
            {{ currentKpi.ai_evaluation_notes }}
          </p>
        </div>

        <!-- Flujos / Tareas Asignadas -->
        <div class="glass-panel tasks-card">
          <h3>Mis Responsabilidades</h3>
          <ul class="task-list">
            <li v-for="(task, idx) in roleTasks" :key="idx">
              <span class="check-icon">✓</span>
              {{ task }}
            </li>
            <li v-if="roleTasks.length === 0" class="no-tasks">
              No hay tareas mapeadas para este rol.
            </li>
          </ul>
        </div>
      </div>

      <!-- Columna Central: Biblioteca Documental -->
      <div class="glass-panel documents-column">
        <div class="documents-header">
          <h3>📚 Biblioteca y Formatos</h3>
          <p>Documentos oficiales para tu cargo</p>
        </div>
        <div class="documents-list">
          <div v-if="loadingKpis" class="loading-text">Cargando biblioteca...</div>
          <div v-else-if="templates.length === 0" class="empty-state-mini">
            <p>No hay documentos asignados a este cargo aún.</p>
          </div>
          <div v-else class="template-grid">
            <a v-for="tpl in templates" :key="tpl.id" :href="tpl.url" target="_blank" class="template-card">
              <div class="template-icon">
                <span v-if="tpl.type === 'excel'">📊</span>
                <span v-else-if="tpl.type === 'word'">📝</span>
                <span v-else-if="tpl.type === 'pdf'">📕</span>
                <span v-else-if="tpl.type === 'notion'">📓</span>
                <span v-else>📄</span>
              </div>
              <div class="template-info">
                <h4>{{ tpl.title }}</h4>
                <small>{{ tpl.role_id ? 'Específico del Cargo' : 'Global' }}</small>
              </div>
              <div class="template-action">→</div>
            </a>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Chatbot Especializado -->
      <div class="glass-panel chat-column">
        <div class="chat-header">
          <h3>Asistente IA Prometheus</h3>
          <span class="status-dot"></span> <small>Especializado para {{ currentRole?.name }}</small>
        </div>
        
        <div class="chat-messages" ref="chatContainer">
          <div v-if="messages.length === 0" class="empty-chat">
            <p>Hola. Soy tu asistente IA exclusivo.</p>
            <p>Conozco el manual de tu cargo y los procesos de la empresa. ¿En qué te puedo ayudar hoy?</p>
          </div>
          
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.sender]"
          >
            <div class="avatar-small">{{ msg.sender === 'user' ? 'TÚ' : 'IA' }}</div>
            <div class="bubble" v-html="formatMessage(msg.text)"></div>
          </div>
          
          <div v-if="isTyping" class="message ai typing">
            <div class="avatar-small">IA</div>
            <div class="bubble">Pensando...</div>
          </div>
        </div>

        <div class="chat-input-area">
          <input 
            v-model="newMessage" 
            type="text" 
            placeholder="Pregunta sobre tus procesos, políticas o tareas..." 
            @keyup.enter="sendMessage"
            :disabled="isTyping"
          />
          <button class="send-btn" @click="sendMessage" :disabled="isTyping || !newMessage.trim()">
            Enviar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { supabase } from '../api/supabase';
import { marked } from 'marked';

const roles = ref([]);
const selectedRoleId = ref('');
const currentRole = ref(null);
const loadingRoles = ref(true);

// Datos del rol
const currentKpi = ref({ overall_score: 0, ai_evaluation_notes: null });
const loadingKpis = ref(false);
const roleTasks = ref([]);
const roleContextStr = ref('');

// Plantillas
const templates = ref([]);

// Chat
const messages = ref([]);
const newMessage = ref('');
const isTyping = ref(false);
const chatContainer = ref(null);

onMounted(async () => {
  await fetchRoles();
});

const fetchRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*, areas(name)')
      .order('name');
    if (!error) {
      roles.value = data || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingRoles.value = false;
  }
};

const changeRole = async () => {
  if (!selectedRoleId.value) return;
  
  currentRole.value = roles.value.find(r => r.id === selectedRoleId.value);
  messages.value = []; // Reset chat when changing role
  
  await fetchRoleData(selectedRoleId.value);
};

const fetchRoleData = async (roleId) => {
  loadingKpis.value = true;
  try {
    // 1. Fetch KPIs
    const { data: kpiData } = await supabase
      .from('role_kpis')
      .select('*')
      .eq('role_id', roleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (kpiData) {
      currentKpi.value = {
        overall_score: kpiData.overall_score || ((kpiData.score_financial + kpiData.score_customer + kpiData.score_process + kpiData.score_growth) / 4),
        ai_evaluation_notes: kpiData.ai_evaluation_notes
      };
    } else {
      currentKpi.value = { overall_score: 0, ai_evaluation_notes: null };
    }

    // 2. Fetch Workflows/Context for this role
    const { data: flowData } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', roleId)
      .limit(1)
      .single();

    if (flowData) {
      roleTasks.value = flowData.tasks || [];
      // Prepare context string for the AI
      roleContextStr.value = `
Tareas Principales: ${JSON.stringify(flowData.tasks)}
Inputs requeridos: ${JSON.stringify(flowData.inputs)}
Outputs entregables: ${JSON.stringify(flowData.outputs)}
KPIs esperados: ${JSON.stringify(flowData.kpis)}
      `.trim();
    } else {
      roleTasks.value = [];
      roleContextStr.value = '';
    }

    // 3. Fetch Templates (Global or specific to this role)
    const { data: templateData } = await supabase
      .from('document_templates')
      .select('*')
      .or(`role_id.is.null,role_id.eq.${roleId}`)
      .order('title');
      
    templates.value = templateData || [];

  } catch (error) {
    console.error('Error fetching role data:', error);
  } finally {
    loadingKpis.value = false;
  }
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || !currentRole.value) return;

  messages.value.push({ sender: 'user', text });
  newMessage.value = '';
  isTyping.value = true;
  scrollToBottom();

  try {
    const response = await fetch('/api/role-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        roleId: currentRole.value.id,
        roleName: currentRole.value.name,
        roleContext: roleContextStr.value
      })
    });

    const data = await response.json();
    if (response.ok) {
      messages.value.push({ sender: 'ai', text: data.reply });
    } else {
      messages.value.push({ sender: 'ai', text: `Error: ${data.error}` });
    }
  } catch (error) {
    messages.value.push({ sender: 'ai', text: 'Error de conexión con Prometheus AI.' });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const formatMessage = (text) => {
  return marked.parse(text);
};

const getInitials = (name) => {
  if (!name) return 'EN';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getScoreColor = (score) => {
  if (score === 0) return 'gray';
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  return 'red';
};
</script>

<style scoped>
.workspace-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 24px;
  gap: 24px;
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

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.header-left .back-link {
  color: var(--gold-deep);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: inline-block;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--ink);
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-selector label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.glass-select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-weight: 600;
  min-width: 250px;
}

.glass-select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state .icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.workspace-content {
  display: flex;
  flex: 1;
  gap: 24px;
  min-height: 0;
}

/* Sidebar Column */
.sidebar-column {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.profile-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--gold-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
}

.profile-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  color: var(--ink);
}

.profile-info p {
  margin: 0;
  color: var(--gold-deep);
  font-size: 0.9rem;
}

.mini-kpi {
  padding: 24px;
  text-align: center;
}

.mini-kpi h3, .tasks-card h3 {
  margin: 0 0 16px 0;
  color: var(--ink);
  font-size: 1.1rem;
}

.kpi-score {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--border-subtle);
  margin: 0 auto 16px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.kpi-score.gray { border-color: var(--border); color: var(--text-tertiary); }
.kpi-score.green { border-color: var(--success); color: var(--success); }
.kpi-score.yellow { border-color: var(--warning); color: var(--warning); }
.kpi-score.red { border-color: var(--danger); color: var(--danger); }

.score-number {
  font-size: 2.2rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.kpi-insight {
  font-size: 0.85rem;
  color: var(--ink-secondary);
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: var(--radius-sm);
  text-align: left;
}

.tasks-card {
  padding: 24px;
  flex: 1;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-list li {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--ink-secondary);
}

.check-icon {
  color: var(--gold);
  font-weight: bold;
}

.no-tasks {
  color: var(--text-tertiary);
  font-style: italic;
  justify-content: center;
}

/* Documents Column */
.documents-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.documents-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.documents-header h3 {
  margin: 0 0 4px 0;
  color: var(--ink);
  font-size: 1.2rem;
}

.documents-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.documents-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.template-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--ink);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.template-card:hover {
  background: var(--bg-secondary);
  border-color: var(--gold-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.template-icon {
  font-size: 1.8rem;
  background: var(--bg-secondary);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.template-info {
  flex: 1;
}

.template-info h4 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: var(--ink);
}

.template-info small {
  color: var(--gold-deep);
  font-size: 0.75rem;
}

.template-action {
  color: var(--gold);
  font-weight: bold;
  font-size: 1.2rem;
}

.empty-state-mini {
  color: var(--text-tertiary);
  text-align: center;
  padding: 40px 0;
  font-style: italic;
}

/* Chat Column */
.chat-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header h3 {
  margin: 0;
  color: var(--ink);
}

.status-dot {
  width: 10px;
  height: 10px;
  background: var(--success);
  border-radius: 50%;
}

.chat-header small {
  color: var(--text-secondary);
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-chat {
  text-align: center;
  color: var(--text-tertiary);
  margin: auto 0;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  flex-shrink: 0;
}

.message.ai .avatar-small {
  background: var(--gold-gradient);
  color: #fff;
}

.message.user .avatar-small {
  background: var(--ink);
  color: #fff;
}

.bubble {
  padding: 16px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  line-height: 1.5;
}

.message.ai .bubble {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  color: var(--ink-secondary);
  border-top-left-radius: 0;
  box-shadow: var(--shadow-sm);
}

.message.user .bubble {
  background: var(--gold-light);
  border: 1px solid var(--gold-light);
  color: var(--ink);
  border-top-right-radius: 0;
}

.typing .bubble {
  color: var(--gold-deep);
  font-style: italic;
}

.chat-input-area {
  padding: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 12px;
}

.chat-input-area input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 16px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 1rem;
}

.chat-input-area input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.send-btn {
  background: var(--gold-gradient);
  color: #fff;
  border: none;
  padding: 0 32px;
  border-radius: var(--radius-sm);
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Fix for marked HTML in bubble */
:deep(.bubble p) {
  margin-top: 0;
  margin-bottom: 10px;
}
:deep(.bubble p:last-child) {
  margin-bottom: 0;
}
:deep(.bubble ul) {
  margin: 10px 0;
  padding-left: 20px;
}
</style>

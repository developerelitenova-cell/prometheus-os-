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
  background: #12121a;
  color: #fff;
  padding: 24px;
  gap: 24px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.header-left .back-link {
  color: #00f0ff;
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: inline-block;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-selector label {
  color: #999;
  font-size: 0.9rem;
}

.glass-select {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  min-width: 250px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #a0a0b0;
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
  width: 350px;
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
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.profile-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
}

.profile-info p {
  margin: 0;
  color: #00f0ff;
  font-size: 0.9rem;
}

.mini-kpi {
  padding: 24px;
  text-align: center;
}

.mini-kpi h3, .tasks-card h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 1.1rem;
}

.kpi-score {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #333;
  margin: 0 auto 16px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.kpi-score.green { border-color: #00ff99; box-shadow: 0 0 20px rgba(0,255,153,0.2); color: #00ff99; }
.kpi-score.yellow { border-color: #ffcc00; box-shadow: 0 0 20px rgba(255,204,0,0.2); color: #ffcc00; }
.kpi-score.red { border-color: #ff3366; box-shadow: 0 0 20px rgba(255,51,102,0.2); color: #ff3366; }

.score-number {
  font-size: 2.2rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #999;
}

.kpi-insight {
  font-size: 0.85rem;
  color: #ddd;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.check-icon {
  color: #00f0ff;
  font-weight: bold;
}

.no-tasks {
  color: #666;
  font-style: italic;
  justify-content: center;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header h3 {
  margin: 0;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: #00ff99;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ff99;
}

.chat-header small {
  color: #999;
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
  color: #888;
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
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
}

.message.user .avatar-small {
  background: #333;
  color: #fff;
}

.bubble {
  padding: 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.message.ai .bubble {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-top-left-radius: 0;
}

.message.user .bubble {
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-top-right-radius: 0;
}

.typing .bubble {
  color: #00f0ff;
  font-style: italic;
}

.chat-input-area {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
}

.chat-input-area input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
}

.chat-input-area input:focus {
  outline: none;
  border-color: #00f0ff;
}

.send-btn {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 0 32px;
  border-radius: 8px;
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

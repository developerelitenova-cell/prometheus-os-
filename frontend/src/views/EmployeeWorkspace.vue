<template>
  <div class="workspace-container">
    <!-- Navbar Superior -->
    <header class="glass-panel workspace-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
        <h1>Mi Espacio Elite</h1>
        
        <div v-if="isAuditMode" class="audit-badge">
          🕵️‍♂️ <strong>MODO AUDITORÍA:</strong> Estás viendo el espacio de {{ currentProfile?.full_name }}
          <button class="btn-exit-audit" @click="exitAuditMode">Salir</button>
        </div>
      </div>
      <div class="header-right">
        <!-- Campana de Notificaciones -->
        <div class="notif-bell-wrapper">
          <button
            class="notif-bell"
            @click="showNotifPanel = !showNotifPanel"
            :disabled="!currentProfile"
            title="Notificaciones"
          >
            🔔
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>

          <div v-if="showNotifPanel" class="notif-panel-backdrop" @click="showNotifPanel = false"></div>

          <div v-if="showNotifPanel" class="notif-panel glass-panel">
            <div class="notif-panel-header">
              <h4>Notificaciones</h4>
              <button class="mark-all-btn" v-if="unreadCount > 0" @click="markAllRead">Marcar todas como leídas</button>
            </div>
            <div class="notif-panel-list">
              <div v-if="loadingNotifications" class="loading-text">Cargando...</div>
              <div v-else-if="unifiedFeed.length === 0" class="empty-state-mini">No tienes notificaciones.</div>
              <div
                v-else
                v-for="item in unifiedFeed"
                :key="item.id"
                class="notif-item"
                :class="{ unread: item.unread }"
                @click="handleNotifClick(item)"
              >
                <span class="notif-icon">{{ notifIcon(item) }}</span>
                <div class="notif-body">
                  <div class="notif-source">{{ notifSourceLabel(item) }}</div>
                  <p class="notif-text">{{ item.text }}</p>
                  <span class="notif-time">{{ formatRelativeTime(item.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Identidad de la sesión -->
        <div class="session-identity" v-if="currentProfile">
          <span class="session-name">{{ currentProfile.full_name }}</span>
          <button class="signout-btn" @click="handleSignOut" title="Cerrar sesión">Salir</button>
        </div>
      </div>
    </header>

    <div v-if="loadingProfile" class="empty-state glass-panel">
      <span class="icon">⏳</span>
      <h2>Cargando tu espacio de trabajo...</h2>
    </div>

    <div v-else-if="!currentProfile" class="empty-state glass-panel">
      <span class="icon">👋</span>
      <h2>Bienvenido a Mi Espacio Elite</h2>
      <p>No pudimos cargar tu perfil. Iniciá sesión nuevamente.</p>
      <router-link to="/login" class="btn-primary" style="margin-top: 16px;">Ir a iniciar sesión</router-link>
    </div>

    <div v-else-if="currentProfile && bannerItems.length" class="announce-banner">
      <div
        v-for="item in bannerItems"
        :key="'b-' + item.id"
        class="announce-card glass-panel"
        :class="{ urgente: item.category === 'urgente' }"
      >
        <span class="announce-icon">{{ notifIcon(item) }}</span>
        <div class="announce-content">
          <strong>{{ notifSourceLabel(item) }}</strong>
          <p>{{ item.text }}</p>
        </div>
        <button class="announce-dismiss" @click="handleNotifClick(item)" title="Descartar">✕</button>
      </div>
    </div>

    <!-- Alerta de Mapeo Incompleto -->
    <div v-if="currentProfile && !currentProfile.mapping_completed && !currentProfile.is_master_admin" class="announce-banner">
      <div class="announce-card glass-panel urgente">
        <span class="announce-icon">⚠️</span>
        <div class="announce-content">
          <strong>Acción Requerida: Mapeo de Cargo Pendiente</strong>
          <p>Para personalizar tu IA y activar todas las funciones de tu Espacio Elite, necesitamos conocer los detalles de tus responsabilidades.</p>
        </div>
        <router-link :to="`/mapper/${currentProfile.role_id}`" class="btn-primary" style="margin-left: auto;">
          Completar Mapeo Ahora
        </router-link>
      </div>
    </div>

    <div v-if="currentProfile" class="workspace-content">
      <!-- Columna Izquierda: KPIs y Tareas -->
      <div class="sidebar-column">
        <!-- Tarjeta de Identidad -->
        <div class="glass-panel profile-card">
          <div class="avatar">{{ getInitials(currentProfile?.full_name) }}</div>
          <div class="profile-info">
            <h2>{{ currentProfile?.full_name }}</h2>
            <p>{{ currentRole?.name }} - {{ currentRole?.areas?.name || 'Área General' }}</p>
            <div v-if="isLeader" style="margin-top: 12px;">
              <router-link to="/team" class="btn-primary" style="font-size: 0.85rem; padding: 8px 12px; display: inline-block;">
                👑 Panel de Liderazgo (Aprobaciones y Tareas)
              </router-link>
            </div>
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
          
          <div class="kpi-insight" v-if="currentKpi.ai_evaluation_notes">
            <h4>Análisis de la IA:</h4>
            <div class="markdown-content kpi-notes-scroll" v-html="DOMPurify.sanitize(marked.parse(currentKpi.ai_evaluation_notes))"></div>
          </div>
        </div>

        <!-- Flujos / Tareas Asignadas -->
        <div class="glass-panel tasks-card checklist-card">
          <h3>Mis Checklists</h3>
          
          <div class="checklist-section">
            <h4>📅 Diario</h4>
            <ul class="task-list interactive">
              <li v-for="task in dailyTasks" :key="task.id" :class="task.status">
                <input type="checkbox" :checked="task.status === 'completed'" @change="toggleTaskStatus(task)" />
                <span class="task-title">{{ task.title }}</span>
              </li>
              <li v-if="dailyTasks.length === 0" class="no-tasks">No hay tareas diarias.</li>
            </ul>
          </div>

          <div class="checklist-section">
            <h4>🗓 Semanal</h4>
            <ul class="task-list interactive">
              <li v-for="task in weeklyTasks" :key="task.id" :class="task.status">
                <input type="checkbox" :checked="task.status === 'completed'" @change="toggleTaskStatus(task)" />
                <span class="task-title">{{ task.title }}</span>
              </li>
              <li v-if="weeklyTasks.length === 0" class="no-tasks">No hay tareas semanales.</li>
            </ul>
          </div>

          <div class="checklist-section">
            <h4>📆 Mensual</h4>
            <ul class="task-list interactive">
              <li v-for="task in monthlyTasks" :key="task.id" :class="task.status">
                <input type="checkbox" :checked="task.status === 'completed'" @change="toggleTaskStatus(task)" />
                <span class="task-title">{{ task.title }}</span>
              </li>
              <li v-if="monthlyTasks.length === 0" class="no-tasks">No hay tareas mensuales.</li>
            </ul>
          </div>
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
            <p>Hola. Hazme preguntas o pídeme ayuda para completar tus tareas y objetivos.</p>
          </div>
          
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.sender]"
          >
            <div class="avatar-small">{{ msg.sender === 'user' ? 'TÚ' : 'IA' }}</div>
            <div class="bubble" v-html="DOMPurify.sanitize(formatMessage(msg.text))"></div>
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
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile as authProfile, loadCurrentProfile, signOut } from '../api/auth';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const router = useRouter();
const route = useRoute();

const currentProfile = ref(null);
const currentRole = ref(null);
const loadingProfile = ref(true);
const isAuditMode = ref(false);

// Notificaciones (avisos de la empresa / notifications) y mensajes del líder de área (categorization_messages)
const notifications = ref([]);
const categorizationMessages = ref([]);
const showNotifPanel = ref(false);
const loadingNotifications = ref(false);
const dismissedMessageIds = ref(new Set());

// Datos del rol
const currentKpi = ref({ overall_score: 0, ai_evaluation_notes: null });
const loadingKpis = ref(false);
const roleContextStr = ref('');

// Tareas / Checklists
const dailyTasks = ref([]);
const weeklyTasks = ref([]);
const monthlyTasks = ref([]);

// Plantillas
const templates = ref([]);

// Chat
const messages = ref([]);
const newMessage = ref('');
const isTyping = ref(false);
const chatContainer = ref(null);

onMounted(async () => {
  loadDismissed();
  await initWorkspace();
});

const handleSignOut = async () => {
  await signOut();
  router.push('/login');
};

// --- Notificaciones ---

const DISMISSED_MESSAGES_KEY = 'prometheus_dismissed_messages';

const loadDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_MESSAGES_KEY);
    dismissedMessageIds.value = new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    dismissedMessageIds.value = new Set();
  }
};

const persistDismissed = () => {
  try {
    localStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify(Array.from(dismissedMessageIds.value)));
  } catch (e) {
    // localStorage no disponible (modo privado, etc.) - no es crítico, se pierde solo la marca de "leído" local
  }
};

const fetchNotifications = async (profileId, role) => {
  loadingNotifications.value = true;
  try {
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);
    notifications.value = notifData || [];

    if (role?.id) {
      const orFilter = role.area_id
        ? `target_role_id.eq.${role.id},target_area_id.eq.${role.area_id}`
        : `target_role_id.eq.${role.id}`;
      const { data: msgData } = await supabase
        .from('categorization_messages')
        .select('*')
        .or(orFilter)
        .order('created_at', { ascending: false })
        .limit(50);
      categorizationMessages.value = msgData || [];
    } else {
      categorizationMessages.value = [];
    }
  } catch (e) {
    console.error('Error cargando notificaciones:', e);
    notifications.value = [];
    categorizationMessages.value = [];
  } finally {
    loadingNotifications.value = false;
  }
};

const unifiedFeed = computed(() => {
  const fromNotifications = notifications.value.map(n => ({
    id: `n-${n.id}`,
    rawId: n.id,
    source: 'notification',
    type: n.type,
    text: n.message,
    created_at: n.created_at,
    unread: !n.is_read
  }));
  const fromMessages = categorizationMessages.value.map(m => ({
    id: `m-${m.id}`,
    rawId: m.id,
    source: 'message',
    category: m.category,
    text: m.content,
    created_at: m.created_at,
    unread: !dismissedMessageIds.value.has(m.id)
  }));
  return [...fromNotifications, ...fromMessages].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
});

const unreadCount = computed(() => unifiedFeed.value.filter(i => i.unread).length);

watch(unreadCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal > oldVal) {
    playNotificationSound();
  }
});

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error('No se pudo reproducir el sonido de notificación', e);
  }
};

const bannerItems = computed(() => unifiedFeed.value.filter(i => i.unread).slice(0, 3));

const notifIcon = (item) => {
  if (item.source === 'message') {
    if (item.category === 'urgente') return '🚨';
    if (item.category === 'operativo') return '⚙️';
    return '📢';
  }
  const map = { manual_update: '📘', new_task: '✅', system_alert: '⚠️', message: '💬' };
  return map[item.type] || '🔔';
};

const notifSourceLabel = (item) => {
  return item.source === 'message' ? 'Tu líder / Elite Nutrition' : 'Notificación del sistema';
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(dateStr).toLocaleDateString('es-CO');
};

const markNotificationRead = async (notifId) => {
  const target = notifications.value.find(n => n.id === notifId);
  if (!target || target.is_read) return;
  target.is_read = true; // Optimista
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  } catch (e) {
    target.is_read = false; // Revertir si falla
    console.error('Error marcando notificación como leída:', e);
  }
};

const handleNotifClick = (item) => {
  if (item.source === 'notification') {
    markNotificationRead(item.rawId);
  } else {
    dismissedMessageIds.value.add(item.rawId);
    persistDismissed();
  }
};

const markAllRead = async () => {
  const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
  notifications.value.forEach(n => { n.is_read = true; }); // Optimista
  categorizationMessages.value.forEach(m => dismissedMessageIds.value.add(m.id));
  persistDismissed();

  if (unreadIds.length) {
    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    } catch (e) {
      console.error('Error marcando todas como leídas:', e);
    }
  }
};

const initWorkspace = async () => {
  loadingProfile.value = true;
  try {
    if (!authProfile.value) {
      await loadCurrentProfile();
    }
    
    // Lógica de Modo Auditoría (Impersonation)
    if (authProfile.value?.is_master_admin && route.query.view_as) {
      const { data: auditProfile } = await supabase
        .from('profiles')
        .select('*, roles(id, name, area_id)')
        .eq('id', route.query.view_as)
        .single();
        
      if (auditProfile) {
        currentProfile.value = auditProfile;
        isAuditMode.value = true;
      } else {
        currentProfile.value = authProfile.value;
      }
    } else {
      currentProfile.value = authProfile.value;
    }

    currentRole.value = currentProfile.value?.roles || null;

    if (!currentProfile.value) return;

    if (currentRole.value) {
      await fetchRoleData(currentRole.value.id);
    }
    await fetchChecklists(currentProfile.value.id);
    await fetchNotifications(currentProfile.value.id, currentRole.value);
  } finally {
    loadingProfile.value = false;
  }
};

const fetchChecklists = async (profileId) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profileId);
      
    if (tasks) {
      dailyTasks.value = tasks.filter(t => t.task_type === 'daily');
      weeklyTasks.value = tasks.filter(t => t.task_type === 'weekly');
      monthlyTasks.value = tasks.filter(t => t.task_type === 'monthly');
    }
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }
};

const toggleTaskStatus = async (task) => {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  const oldStatus = task.status;
  task.status = newStatus; // Optimistic update
  
  try {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  } catch (e) {
    task.status = oldStatus; // Revert on fail
    console.error(e);
  }
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
      // Prepare context string for the AI
      roleContextStr.value = `
Tareas Principales: ${JSON.stringify(flowData.tasks)}
Inputs requeridos: ${JSON.stringify(flowData.inputs)}
Outputs entregables: ${JSON.stringify(flowData.outputs)}
KPIs esperados: ${JSON.stringify(flowData.kpis)}
      `.trim();
    } else {
      roleContextStr.value = '';
    }

    // 3. Fetch Templates (Global or specific to this role)
    const { data: templateData } = await supabase
      .from('document_templates')
      .select('*')
      .or(`role_id.is.null,role_id.eq.${roleId}`)
      .order('title');
      
    templates.value = templateData || [];

    await fetchChatHistory(roleId);

  } catch (error) {
    console.error('Error fetching role data:', error);
  } finally {
    loadingKpis.value = false;
  }
};

const fetchChatHistory = async (roleId) => {
  try {
    const { data: history, error } = await supabase
      .from('chat_history')
      .select('sender, message, created_at')
      .eq('role_id', roleId)
      .order('created_at', { ascending: true });
      
    if (history && !error) {
      messages.value = history.map(msg => ({
        sender: msg.sender,
        text: msg.message
      }));
      scrollToBottom();
    }
  } catch (e) {
    console.error('Error fetching chat history:', e);
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
    const session = await supabase.auth.getSession();
    const response = await fetch('/api/role-chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token || ''}`
      },
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

const exitAuditMode = () => {
  router.push('/workspace');
  setTimeout(() => { window.location.reload(); }, 100);
};
</script>

<style scoped>
.workspace-container {
  height: 100vh;
  overflow: hidden;
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

.audit-badge {
  margin-top: 10px;
  background: rgba(255, 149, 0, 0.15);
  border: 1px solid var(--warning);
  color: #b46b00;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-exit-audit {
  background: var(--warning);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.session-name {
  font-weight: 600;
  color: var(--ink);
  font-size: 0.9rem;
}

.signout-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signout-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--danger);
  color: var(--danger);
}

/* Notificaciones */
.notif-bell-wrapper {
  position: relative;
}

.notif-bell {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.notif-bell:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--gold);
}

.notif-bell:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--bg-primary);
}

.notif-panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
}

.notif-panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.notif-panel-header h4 {
  margin: 0;
  color: var(--ink);
  font-size: 1rem;
}

.mark-all-btn {
  background: none;
  border: none;
  color: var(--gold-deep);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.mark-all-btn:hover {
  text-decoration: underline;
}

.notif-panel-list {
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.2s;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: var(--bg-secondary);
}

.notif-item.unread {
  background: var(--gold-light);
}

.notif-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-source {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--gold-deep);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}

.notif-text {
  margin: 0 0 4px 0;
  font-size: 0.87rem;
  color: var(--ink-secondary);
  line-height: 1.4;
}

.notif-time {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

/* Banner de anuncios importantes */
.announce-banner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.announce-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  border-left: 4px solid var(--gold);
}

.announce-card.urgente {
  border-left-color: var(--danger);
}

.announce-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.announce-content {
  flex: 1;
  min-width: 0;
}

.announce-content strong {
  display: block;
  font-size: 0.75rem;
  color: var(--gold-deep);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}

.announce-content p {
  margin: 0;
  color: var(--ink);
  font-size: 0.92rem;
  line-height: 1.4;
}

.announce-dismiss {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1rem;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  flex-shrink: 0;
}

.announce-dismiss:hover {
  color: var(--ink);
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

.empty-state .btn-primary {
  display: inline-block;
  background: var(--ink);
  color: #fff;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s var(--ease-apple);
}

.empty-state .btn-primary:hover {
  background: #000;
  transform: translateY(-1px);
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

/* Tasks Checklist Styles */
.checklist-card {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.checklist-section {
  margin-bottom: 20px;
}

.checklist-section h4 {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-list.interactive li {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-secondary);
}

.task-list.interactive li:last-child {
  border-bottom: none;
}

.task-list.interactive input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--gold);
}

.task-list.interactive li.completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.no-tasks {
  color: var(--text-tertiary);
  font-style: italic;
  font-size: 0.85rem;
  padding: 8px 0;
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

.kpi-notes-scroll {
  max-height: 150px;
  overflow-y: auto;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: rgba(0,0,0,0.2);
  padding: 10px;
  border-radius: 6px;
  margin-top: 10px;
}
.kpi-notes-scroll::-webkit-scrollbar {
  width: 4px;
}
.kpi-notes-scroll::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}
</style>

<template>
  <div class="workspace-container">
    <!-- Navbar Superior -->
    <header class="glass-panel workspace-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
        <h1>Mi Espacio Elite</h1>
        
        <div v-if="isAuditMode" class="audit-badge">
          🕵️‍♂️ <strong>MODO AUDITORÍA:</strong> Estás viendo el espacio de {{ currentProfile?.full_name }}
          <button class="btn-logout-global" @click="exitAuditMode" style="margin-left: 12px;">
            <span class="icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            Salir
          </button>
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
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
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
                <span class="notif-icon" v-html="notifIcon(item)"></span>
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
          <button class="btn-logout-global" @click="handleSignOut" title="Cerrar sesión">
            <span class="icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            Salir
          </button>
        </div>
      </div>
    </header>

    <div v-if="loadingProfile" class="empty-state glass-panel">
      <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></span>
      <h2>Cargando tu espacio de trabajo...</h2>
    </div>

    <div v-else-if="!currentProfile" class="empty-state glass-panel">
      <span class="icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg></span>
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
        <span class="announce-icon" v-html="notifIcon(item)"></span>
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

    <div v-if="currentProfile" class="workspace-body">
      <!-- Resumen rápido -->
      <div class="workspace-stats-grid">
        <div class="stat-card glass-panel">
          <span class="stat-card-value">{{ totalPendingTasks }}</span>
          <span class="stat-card-label">Tareas Pendientes</span>
        </div>
        <div class="stat-card glass-panel">
          <span class="stat-card-value">{{ totalCompletedTasks }}</span>
          <span class="stat-card-label">Tareas Completadas</span>
        </div>
        <div class="stat-card glass-panel">
          <span class="stat-card-value">{{ templates.length }}</span>
          <span class="stat-card-label">Documentos Disponibles</span>
        </div>
      </div>

    <div class="workspace-content">
      <!-- Columna Izquierda: Perfil, Notificaciones y Biblioteca -->
      <div class="sidebar-column">
        <!-- Tarjeta de Identidad -->
        <div class="glass-panel profile-card">
          <div class="avatar">{{ getInitials(currentProfile?.full_name) }}</div>
          <div class="profile-info">
            <h2>{{ currentProfile?.full_name }}</h2>
            <p>
              {{ currentRole?.name }} - {{ currentRole?.areas?.name || 'Área General' }}
              <span v-if="currentRole?.access_level" class="role-level-badge" :class="'level-' + currentRole.access_level">
                Nivel {{ currentRole.access_level }}
              </span>
            </p>
            <div v-if="isLeaderRole" style="margin-top: 12px;">
              <router-link to="/team" class="btn-primary" style="font-size: 0.85rem; padding: 8px 12px; display: inline-block;">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 4h20"></path><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4"></path><polyline points="2 12 12 22 22 12"></polyline></svg> Panel de Liderazgo
              </router-link>
            </div>
          </div>
        </div>

        <!-- Gestión Diaria: actividades recurrentes y estándar del cargo -->
        <div class="glass-panel checklist-card">
          <h3>Gestión Diaria</h3>

          <div class="checklist-tabs">
            <button :class="{ active: dmTab === 'daily' }" @click="dmTab = 'daily'"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Diario</button>
            <button :class="{ active: dmTab === 'weekly' }" @click="dmTab = 'weekly'">🗓 Semanal</button>
            <button :class="{ active: dmTab === 'monthly' }" @click="dmTab = 'monthly'"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Mensual</button>
          </div>

          <ul class="dm-task-list">
            <li v-for="task in activeDmTaskList" :key="task.id" :class="{ completed: task.completed }">
              <input type="checkbox" :checked="task.completed" @change="toggleDmTask(task)" />
              <span class="task-title">{{ task.title }}</span>
            </li>
            <li v-if="activeDmTaskList.length === 0" class="no-tasks">Tu cargo aún no tiene tareas de Gestión Diaria asignadas.</li>
          </ul>
        </div>

        <!-- Canal de Notificaciones Permanente -->
        <div class="glass-panel notif-permanent-card">
          <h3>Canal de Notificaciones</h3>
          <div class="notif-list-mini">
            <div v-if="loadingNotifications" class="loading-text">Cargando...</div>
            <div v-else-if="unifiedFeed.length === 0" class="empty-state-mini">No tienes notificaciones.</div>
            <div
              v-else
              v-for="item in unifiedFeed.slice(0, 4)"
              :key="'perm-' + item.id"
              class="notif-item"
              :class="{ unread: item.unread }"
              @click="handleNotifClick(item)"
            >
              <span class="notif-icon" v-html="notifIcon(item)"></span>
              <div class="notif-body">
                <div class="notif-source">{{ notifSourceLabel(item) }}</div>
                <p class="notif-text">{{ item.text }}</p>
                <span class="notif-time">{{ formatRelativeTime(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Biblioteca Documental Mini -->
        <div class="glass-panel documents-column-mini">
          <div class="documents-header">
            <h3><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Biblioteca Oficial</h3>
          </div>
          <div class="documents-list-mini">
            <div v-if="loadingKpis" class="loading-text">Cargando biblioteca...</div>
            <div v-else-if="templates.length === 0" class="empty-state-mini">
              <p>Sin documentos.</p>
            </div>
            <div v-else class="template-list-mini">
              <a v-for="tpl in templates" :key="tpl.id" :href="tpl.url" target="_blank" class="template-card-mini">
                <div class="template-icon"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
                <div class="template-info">
                  <h4>{{ tpl.title }}</h4>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Central: Cronograma Programacional -->
      <div class="glass-panel schedule-column">
        <div class="schedule-header">
          <h3>Cronograma Programacional</h3>
          <p>Compromisos, reportes y tareas asignadas por tu líder</p>
        </div>
        
        <div class="schedule-calendar-tabs">
          <button :class="{ active: taskTab === 'daily' }" @click="taskTab = 'daily'">Rutina Diaria</button>
          <button :class="{ active: taskTab === 'weekly' }" @click="taskTab = 'weekly'">Plan Semanal</button>
          <button :class="{ active: taskTab === 'monthly' }" @click="taskTab = 'monthly'">Plan Mensual</button>
        </div>

        <div class="schedule-calendar-view">
           <ul class="task-list interactive schedule-list">
            <li v-for="task in activeTaskList" :key="task.id" :class="{ completed: task.status === 'completed' }">
              <input type="checkbox" :checked="task.status === 'completed'" @change="toggleTaskStatus(task)" />
              <div class="task-details">
                <span class="task-title">{{ task.title }}</span>
                <span v-if="task.description" class="task-desc">{{ task.description }}</span>
                <span v-if="task.due_date" class="task-date">Vence: {{ new Date(task.due_date).toLocaleDateString('es-CO') }}</span>
              </div>
            </li>
            <li v-if="activeTaskList.length === 0" class="no-tasks">
              No tienes compromisos asignados en esta vista.
            </li>
          </ul>
        </div>
      </div>

      <!-- Columna Derecha: Chatbot Especializado -->
      <div class="glass-panel chat-column">
        <div class="chat-header">
          <h3>Asistente IA PROMETHEUS OS</h3>
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
            placeholder="Pregunta sobre tus procesos..." 
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile as authProfile, loadCurrentProfile, signOut } from '../api/auth';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getPeriodKey } from '../utils/taskPeriods';

const router = useRouter();
const route = useRoute();

const currentProfile = ref(null);
const currentRole = ref(null);
const loadingProfile = ref(true);
const isAuditMode = ref(false);

// Nivel de acceso del rol que se está viendo (el propio, o el auditado en Modo
// Auditoría) -- determina si se muestra el acceso directo al Panel de Liderazgo.
const isLeaderRole = computed(() => currentRole.value && [1, 2].includes(currentRole.value.access_level));

// Cronograma Programacional: tareas puntuales que el líder asigna a ESTA
// persona (tabla `tasks`), con fecha de vencimiento. Se muestran en un único
// bloque con pestañas (Diario/Semanal/Mensual) en vez de tres secciones
// apiladas, para reducir el ruido visual.
const taskTab = ref('daily');
const activeTaskList = computed(() => {
  if (taskTab.value === 'weekly') return weeklyTasks.value;
  if (taskTab.value === 'monthly') return monthlyTasks.value;
  return dailyTasks.value;
});
const totalPendingTasks = computed(() =>
  [...dailyTasks.value, ...weeklyTasks.value, ...monthlyTasks.value].filter(t => t.status !== 'completed').length
);
const totalCompletedTasks = computed(() =>
  [...dailyTasks.value, ...weeklyTasks.value, ...monthlyTasks.value].filter(t => t.status === 'completed').length
);

// Gestión Diaria: actividades recurrentes y estándar del cargo (revisar
// correos, enviar facturas, etc.), definidas una sola vez en la memoria del
// cargo (role_task_templates) y compartidas por todos los que tienen ese
// cargo -- distinta del Cronograma Programacional de arriba, que son
// encargos puntuales de un líder a una persona.
const dmTab = ref('daily');
const activeDmTaskList = computed(() => {
  if (dmTab.value === 'weekly') return dmWeeklyTasks.value;
  if (dmTab.value === 'monthly') return dmMonthlyTasks.value;
  return dmDailyTasks.value;
});

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

// Cronograma Programacional (tareas asignadas por el líder, tabla `tasks`)
const dailyTasks = ref([]);
const weeklyTasks = ref([]);
const monthlyTasks = ref([]);

// Gestión Diaria (memoria del cargo, role_task_templates + task_completions)
const dmDailyTasks = ref([]);
const dmWeeklyTasks = ref([]);
const dmMonthlyTasks = ref([]);

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

const DISMISSED_MESSAGES_KEY = 'prometheus_os_dismissed_messages';

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
    if (item.category === 'urgente') return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    if (item.category === 'operativo') return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
  }
  const map = { 
    manual_update: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>', 
    new_task: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', 
    system_alert: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', 
    message: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' 
  };
  return map[item.type] || '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
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
        .select('*, roles(id, name, area_id, access_level)')
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
      await fetchDailyManagement(currentRole.value.id, currentProfile.value.id);
    }
    await fetchChecklists(currentProfile.value.id);
    await fetchNotifications(currentProfile.value.id, currentRole.value);
  } finally {
    loadingProfile.value = false;
  }
};

// Cronograma Programacional: tareas puntuales que el líder asignó a esta
// persona (tabla `tasks`).
const fetchChecklists = async (profileId) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profileId);

    if (error) throw error;

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

// Gestión Diaria: actividades recurrentes y estándar del cargo. Viven en la
// memoria del cargo (role_task_templates) y el marcado de cada persona se
// guarda en task_completions con la llave del período actual (día/semana/mes),
// así la casilla vuelve a verse vacía en el siguiente período sin perder el
// historial de cumplimiento.
const fetchDailyManagement = async (roleId, profileId) => {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('role_task_templates')
      .select('*')
      .eq('role_id', roleId)
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (templatesError) throw templatesError;

    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_template_id, period_key')
      .eq('profile_id', profileId);
    if (completionsError) throw completionsError;

    const completedKeys = new Set((completions || []).map(c => `${c.task_template_id}::${c.period_key}`));

    const withStatus = (frequency) =>
      (templates || [])
        .filter(t => t.frequency === frequency)
        .map(t => ({
          ...t,
          periodKey: getPeriodKey(frequency),
          completed: completedKeys.has(`${t.id}::${getPeriodKey(frequency)}`)
        }));

    dmDailyTasks.value = withStatus('daily');
    dmWeeklyTasks.value = withStatus('weekly');
    dmMonthlyTasks.value = withStatus('monthly');
  } catch (e) {
    console.error('Error fetching Gestión Diaria:', e);
  }
};

const toggleDmTask = async (task) => {
  const wasCompleted = task.completed;
  task.completed = !wasCompleted; // Optimistic update

  try {
    if (wasCompleted) {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_template_id', task.id)
        .eq('profile_id', currentProfile.value.id)
        .eq('period_key', task.periodKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('task_completions').insert({
        task_template_id: task.id,
        profile_id: currentProfile.value.id,
        period_key: task.periodKey
      });
      if (error) throw error;
    }
  } catch (e) {
    task.completed = wasCompleted; // Revert on fail
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
    messages.value.push({ sender: 'ai', text: 'Error de conexión con PROMETHEUS OS AI.' });
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
  min-height: 100vh;
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
  /* Debe quedar por encima de las tarjetas del cuerpo (todas .glass-panel con
     z-index:1) para que el panel de notificaciones, que cuelga de aquí, no
     quede pintado detrás de ellas. */
  z-index: 30;
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
  max-width: calc(100vw - 48px);
  max-height: 420px;
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
  /* Fondo propio y más sólido que el glass-panel base: este panel flota sobre
     contenido con el que puede superponerse, y necesita leerse como una
     tarjeta opaca, no como un cristal translúcido. */
  background: var(--surface);
  box-shadow: var(--shadow-lg);
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

.workspace-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 24px;
  min-height: 0;
}

.workspace-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  font-family: var(--font-mono);
}

.stat-card-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  font-weight: 600;
}

.stat-card.green .stat-card-value { color: var(--success); }
.stat-card.yellow .stat-card-value { color: var(--warning); }
.stat-card.red .stat-card-value { color: var(--danger); }
.stat-card.gray .stat-card-value { color: var(--text-tertiary); }

.role-level-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.role-level-badge.level-1 { background: var(--danger); }
.role-level-badge.level-2 { background: var(--warning); }
.role-level-badge.level-3 { background: var(--success); }

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
}

.mini-kpi h3, .tasks-card h3 {
  margin: 0 0 16px 0;
  color: var(--ink);
  font-size: 1.1rem;
}

.kpi-insight {
  font-size: 0.85rem;
  color: var(--ink-secondary);
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: var(--radius-sm);
  text-align: left;
}

/* Gestión Diaria (memoria del cargo) */
.checklist-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.checklist-card h3 {
  margin: 0 0 16px 0;
  color: var(--ink);
  font-size: 1.1rem;
}

.checklist-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.checklist-tabs button {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.checklist-tabs button.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.dm-task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dm-task-list li {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-secondary);
}

.dm-task-list li:last-child {
  border-bottom: none;
}

.dm-task-list input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--gold);
  flex-shrink: 0;
}

.dm-task-list li.completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.no-tasks {
  color: var(--text-tertiary);
  font-style: italic;
  font-size: 0.85rem;
  padding: 8px 0;
}

.notif-permanent-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notif-permanent-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--ink);
}

.notif-list-mini {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-list-mini .notif-item {
  padding: 8px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  margin-bottom: 0;
}

.notif-list-mini .notif-item.unread {
  border-left: 3px solid var(--gold);
}

.documents-column-mini {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.documents-header h3 {
  margin: 0;
  padding: 16px;
  font-size: 1rem;
  color: var(--ink);
  border-bottom: 1px solid var(--border-subtle);
}

.documents-list-mini {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-list-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-card-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--ink);
  transition: all 0.2s ease;
}

.template-card-mini:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* Schedule Column (Central) */
.schedule-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.schedule-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.schedule-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.4rem;
  color: var(--ink);
}

.schedule-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.schedule-calendar-tabs {
  display: flex;
  gap: 12px;
  padding: 16px 24px 0;
}

.schedule-calendar-tabs button {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.schedule-calendar-tabs button.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}

.schedule-calendar-view {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.schedule-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface);
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.schedule-list li:hover {
  border-color: var(--gold-light);
}

.schedule-list input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--gold);
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--ink);
}

.task-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.task-date {
  font-size: 0.8rem;
  color: var(--gold-deep);
  font-weight: 600;
  margin-top: 4px;
}

.schedule-list li.completed {
  opacity: 0.7;
}

.schedule-list li.completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.template-icon {
  font-size: 1.2rem;
  background: var(--bg-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.template-info {
  flex: 1;
}

.template-info h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--ink);
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

/* --- Mobile Responsiveness --- */
@media (max-width: 1024px) {
  .workspace-layout {
    grid-template-columns: 1fr !important;
    gap: 24px;
  }
  .workspace-sidebar {
    position: static;
    height: auto;
    overflow: visible;
  }
}
@media (max-width: 768px) {
  .workspace-container {
    padding: 16px;
  }
  .header-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn-action, .btn-primary, .btn-danger-outline {
    width: 100%;
    justify-content: center;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .modal-content {
    width: 95% !important;
    padding: 24px 16px;
    margin: 20px auto;
  }
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-row select, .filters-row input {
    width: 100%;
  }
}
</style>

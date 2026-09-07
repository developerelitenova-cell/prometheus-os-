<template>
  <div class="oracle-view">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
        <h1>Oráculo PROMETHEUS OS (Cerebro Corporativo)</h1>
        <p>Conectado a la Memoria Inteligente de Elite Nutrition</p>
      </div>
      <div class="tabs">
        <button :class="{ active: tab === 'chat' }" @click="tab = 'chat'">Chat</button>
        <button :class="{ active: tab === 'panorama' }" @click="tab = 'panorama'; loadPanorama()">Panorama de Conocimiento</button>
      </div>
    </header>

    <div v-if="tab === 'chat'" class="oracle-layout">
      <!-- Chat interface -->
      <main class="glass-panel chat-container">
        <div class="chat-history" ref="chatHistory">
          <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
            <div class="avatar">{{ msg.role === 'ai' ? '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>' : '👤' }}</div>
            <div class="bubble">
              <div v-html="DOMPurify.sanitize(formatMessage(msg.text))"></div>
            </div>
          </div>
          <div v-if="loading" class="message ai loading-msg">
            <div class="avatar"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg></div>
            <div class="bubble">
              <span class="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="input-wrapper">
            <input 
              type="text" 
              v-model="currentQuery" 
              placeholder="Ej: ¿Cuáles son las métricas del Gerente Comercial?" 
              @keyup.enter="sendQuery"
            />
            <button class="btn-send" @click="sendQuery" :disabled="!currentQuery.trim() || loading">
              Enviar
            </button>
          </div>
          <small class="hint">Usando RAG Neural con la Memoria de Elite Nutrition.</small>
        </div>
      </main>

      <!-- Sidebar -->
      <aside class="glass-panel memory-stats">
        <h3>Estado de la Memoria</h3>
        <div class="stat-card">
          <div class="stat-value" :class="{ 'connected': dbStatus, 'disconnected': !dbStatus }">
            {{ dbStatus ? 'Establecida' : 'Desconectada' }}
          </div>
          <div class="stat-label">Conexión Neuronal Vectorial</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">PROMETHEUS OS</div>
          <div class="stat-label">Motor de Razonamiento</div>
        </div>
        <div class="info-text">
          <p>Este oráculo busca dentro de:</p>
          <ul>
            <li>Manuales de Cargo</li>
            <li>Entrevistas de Mapeo</li>
            <li>Políticas Corporativas</li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- Panorama de Conocimiento: qué sabe y qué NO sabe el Oráculo, por área/cargo -->
    <div v-else class="oracle-layout panorama-layout">
      <div v-if="panoramaLoading" class="glass-panel panorama-loading">Analizando la memoria corporativa...</div>
      <template v-else>
        <div class="panorama-summary-row">
          <div class="glass-panel summary-card">
            <div class="summary-value">{{ panorama.length }}</div>
            <div class="summary-label">Áreas</div>
          </div>
          <div class="glass-panel summary-card">
            <div class="summary-value">{{ totalRoles }}</div>
            <div class="summary-label">Cargos</div>
          </div>
          <div class="glass-panel summary-card">
            <div class="summary-value good">{{ fullyCoveredRoles }}</div>
            <div class="summary-label">Cargos con cobertura completa</div>
          </div>
          <div class="glass-panel summary-card">
            <div class="summary-value bad">{{ totalRoles - fullyCoveredRoles }}</div>
            <div class="summary-label">Cargos con al menos un vacío</div>
          </div>
        </div>

        <div class="glass-panel area-block" v-for="area in panorama" :key="area.id">
          <div class="area-header">
            <h3>{{ area.name }}</h3>
            <div class="coverage-bar-wrap">
              <div class="coverage-bar"><div class="coverage-fill" :style="{ width: area.coveragePct + '%' }"></div></div>
              <span class="coverage-pct">{{ area.coveragePct }}% cubierto</span>
            </div>
          </div>
          <table class="panorama-table">
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Mapeo</th>
                <th>Manual</th>
                <th>KPI vinculado</th>
                <th>Conocimiento en el Oráculo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in area.roles" :key="role.id">
                <td>{{ role.name }}</td>
                <td><span :class="['dot', role.hasMapping ? 'ok' : 'gap']">{{ role.hasMapping ? '✓' : '✗' }}</span></td>
                <td><span :class="['dot', role.hasManual ? 'ok' : 'gap']">{{ role.hasManual ? '✓' : '✗' }}</span></td>
                <td><span :class="['dot', role.hasKpi ? 'ok' : 'gap']">{{ role.hasKpi ? '✓' : '✗' }}</span></td>
                <td>
                  <span :class="['dot', role.memoryCount > 0 ? 'ok' : 'gap']">
                    {{ role.memoryCount > 0 ? `✓ (${role.memoryCount})` : '✗' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '../api/supabase';

const currentQuery = ref('');
const loading = ref(false);
const chatHistory = ref(null);
const dbStatus = ref(true);
const tab = ref('chat');
const panorama = ref([]);
const panoramaLoading = ref(false);
let panoramaLoaded = false;

const totalRoles = computed(() => panorama.value.reduce((sum, a) => sum + a.roles.length, 0));
const fullyCoveredRoles = computed(() =>
  panorama.value.reduce((sum, a) => sum + a.roles.filter(r => r.hasMapping && r.hasManual && r.hasKpi && r.memoryCount > 0).length, 0)
);

const loadPanorama = async () => {
  if (panoramaLoaded) return;
  panoramaLoading.value = true;
  try {
    const [areasRes, rolesRes, workflowsRes, manualsRes, templatesRes, memoryRes] = await Promise.all([
      supabase.from('areas').select('id,name').order('name'),
      supabase.from('roles').select('id,name,area_id'),
      supabase.from('role_workflows').select('role_id'),
      supabase.from('manuals').select('role_id'),
      supabase.from('kpi_role_templates').select('role_id').not('role_id', 'is', null),
      supabase.from('corporate_memory').select('metadata')
    ]);

    const mappedRoleIds = new Set((workflowsRes.data || []).map(w => w.role_id));
    const manualRoleIds = new Set((manualsRes.data || []).map(m => m.role_id));
    const kpiLinkedRoleIds = new Set((templatesRes.data || []).map(t => t.role_id));

    const memoryCountByRole = {};
    (memoryRes.data || []).forEach(m => {
      const roleId = m.metadata?.role_id;
      if (roleId) memoryCountByRole[roleId] = (memoryCountByRole[roleId] || 0) + 1;
    });

    const roles = rolesRes.data || [];
    const areas = (areasRes.data || []).map(area => {
      const areaRoles = roles
        .filter(r => r.area_id === area.id)
        .map(r => ({
          id: r.id,
          name: r.name,
          hasMapping: mappedRoleIds.has(r.id),
          hasManual: manualRoleIds.has(r.id),
          hasKpi: kpiLinkedRoleIds.has(r.id),
          memoryCount: memoryCountByRole[r.id] || 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const dimensions = areaRoles.length * 4;
      const covered = areaRoles.reduce((sum, r) =>
        sum + (r.hasMapping ? 1 : 0) + (r.hasManual ? 1 : 0) + (r.hasKpi ? 1 : 0) + (r.memoryCount > 0 ? 1 : 0), 0);

      return {
        id: area.id,
        name: area.name,
        roles: areaRoles,
        coveragePct: dimensions > 0 ? Math.round((covered / dimensions) * 100) : 0
      };
    }).filter(a => a.roles.length > 0)
      .sort((a, b) => a.coveragePct - b.coveragePct);

    panorama.value = areas;
    panoramaLoaded = true;
  } catch (e) {
    console.error('Error cargando el panorama de conocimiento:', e);
  } finally {
    panoramaLoading.value = false;
  }
};

const messages = ref([
  {
    role: 'ai',
    text: 'Saludos. Soy el Oráculo de PROMETHEUS OS. He indexado la base de conocimiento de Elite Nutrition. ¿Qué deseas consultar sobre el ecosistema de la empresa?'
  }
]);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatHistory.value) {
      chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
    }
  });
};

const sendQuery = async () => {
  const query = currentQuery.value.trim();
  if (!query) return;

  messages.value.push({ role: 'user', text: query });
  currentQuery.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'chat',
        query: query,
        history: messages.value
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      messages.value.push({ role: 'ai', text: data.response });
    } else {
      messages.value.push({ role: 'ai', text: `Error de conexión con el Oráculo: ${data.error || 'Configura tu ANTHROPIC_API_KEY en Vercel.'}` });
    }
  } catch (error) {
    messages.value.push({ role: 'ai', text: 'Error de red. Asegúrate de que estás en producción (Vercel) o configuraste tu backend localmente.' });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const formatMessage = (text) => {
  return marked.parse(text);
};
</script>

<style scoped>
.oracle-view {
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 4px;
  height: fit-content;
}

.tabs button {
  padding: 9px 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.tabs button.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.panorama-layout {
  flex-direction: column;
  overflow-y: auto;
  gap: 20px;
}

.panorama-loading {
  padding: 48px;
  text-align: center;
  color: var(--text-tertiary);
}

.panorama-summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
  text-align: center;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink);
}

.summary-value.good { color: var(--success); }
.summary-value.bad { color: var(--danger); }

.summary-label {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 4px;
}

.area-block {
  padding: 20px 24px;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.area-header h3 {
  margin: 0;
  color: var(--ink);
  font-size: 1.05rem;
}

.coverage-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.coverage-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.coverage-fill {
  height: 100%;
  background: var(--gold-gradient);
  border-radius: var(--radius-pill);
}

.coverage-pct {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.panorama-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.panorama-table th {
  text-align: left;
  padding: 8px 10px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}

.panorama-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-secondary);
}

.dot.ok { color: var(--success); font-weight: 600; }
.dot.gap { color: var(--danger); font-weight: 600; }

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

.oracle-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 16px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 50%;
  flex-shrink: 0;
}

.message.ai .avatar {
  background: var(--gold-light);
}

.bubble {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  padding: 16px;
  border-radius: var(--radius-md);
  line-height: 1.5;
  color: var(--ink-secondary);
  box-shadow: var(--shadow-sm);
}

.message.user .bubble {
  background: var(--gold-light);
  color: var(--ink);
  border-bottom-right-radius: 0;
}

.message.ai .bubble {
  border-bottom-left-radius: 0;
}

.bubble :deep(p) {
  margin-top: 0;
  margin-bottom: 10px;
}

.bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.bubble :deep(ul) {
  margin: 10px 0;
  padding-left: 20px;
}

.typing-indicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--gold);
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  padding: 24px;
  border-top: 1px solid var(--border-subtle);
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.input-wrapper input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 16px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 1rem;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.btn-send {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 0 32px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.hint {
  display: block;
  margin-top: 8px;
  color: var(--text-tertiary);
  text-align: center;
}

.memory-stats {
  width: 300px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-stats h3 {
  color: var(--ink);
  margin-bottom: 8px;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--ink);
}

.stat-value.connected { color: var(--success); }
.stat-value.disconnected { color: var(--danger); }

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-top: 4px;
}

.info-text {
  margin-top: auto;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.info-text ul {
  padding-left: 16px;
  margin-top: 8px;
}

.info-text li {
  margin-bottom: 4px;
}
</style>

<template>
  <div class="oracle-view">
    <header class="glass-panel hub-header">
      <div class="header-content">
        <router-link to="/" class="back-link">← Volver al Inicio</router-link>
        <h1>Oráculo PROMETHEUS (Cerebro Corporativo)</h1>
        <p>Conectado a la Memoria Inteligente de Elite Nutrition</p>
      </div>
    </header>

    <div class="oracle-layout">
      <!-- Chat interface -->
      <main class="glass-panel chat-container">
        <div class="chat-history" ref="chatHistory">
          <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
            <div class="avatar">{{ msg.role === 'ai' ? '🤖' : '👤' }}</div>
            <div class="bubble">
              <div v-html="formatMessage(msg.text)"></div>
            </div>
          </div>
          <div v-if="loading" class="message ai loading-msg">
            <div class="avatar">🤖</div>
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
          <div class="stat-value">PROMETHEUS</div>
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
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { marked } from 'marked';

const currentQuery = ref('');
const loading = ref(false);
const chatHistory = ref(null);

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

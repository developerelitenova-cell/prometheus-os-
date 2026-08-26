<template>
  <div class="academia-layout">
    <nav class="glass-panel side-nav">
      <div class="brand">
        <div class="logo-box">AE</div>
      </div>
      <div class="nav-links">
        <a href="#" class="active"><i>📋</i> Mi Cargo</a>
        <a href="#"><i>📊</i> Mis KPIs</a>
        <a href="#"><i>📚</i> Biblioteca Documental</a>
        <a href="#"><i>🔗</i> Plataformas</a>
        <a href="#"><i>🎓</i> Tutorías</a>
      </div>
      <div class="user-profile">
        <div class="avatar">LC</div>
        <div class="info">
          <p class="name">Leidy Cordoba</p>
          <p class="role">Gerente de Auditoria</p>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <header class="glass-panel top-bar">
        <h2>Panel Principal - Pentágono</h2>
        <div class="search-box">
          <input type="text" placeholder="Buscar en la empresa...">
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- Organigram Widget -->
        <div class="glass-panel widget organigram-widget">
          <div class="widget-header">
            <h3>Organigrama Interactivo (Mi Área)</h3>
            <button class="btn-text">Ver Completo</button>
          </div>
          <div class="organigram-placeholder">
            <!-- D3.js will mount here -->
            <div class="node top">Leidy Cordoba<br><span>Nivel 1</span></div>
            <div class="lines"></div>
            <div class="sub-nodes">
              <div class="node">Jonathan Diaz<br><span>Líder</span></div>
              <div class="node">Brandon M.<br><span>Analista</span></div>
            </div>
          </div>
        </div>

        <!-- Chatbot Widget -->
        <div class="glass-panel widget chat-widget">
          <div class="widget-header">
            <h3>Asistente IA del Cargo</h3>
            <span class="status online"></span>
          </div>
          <div class="chat-area">
            <div class="message bot">
              Hola Leidy, soy tu asistente de Auditoría. Tienes acceso Nivel 1. ¿Qué documento necesitas revisar hoy?
            </div>
            <div class="message user">
              Muéstrame el manual de calidad.
            </div>
          </div>
          <div class="chat-input">
            <input type="text" placeholder="Pregúntale a la IA...">
            <button>Enviar</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// Lógica de Academia Elite
</script>

<style scoped>
.academia-layout {
  display: flex;
  height: 100vh;
  padding: 16px;
  gap: 16px;
}

.side-nav {
  width: 240px;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.brand {
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}

.logo-box {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-secondary);
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.nav-links a:hover, .nav-links a.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-links a.active {
  border-left: 3px solid var(--accent-primary);
}

.nav-links i {
  font-style: normal;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--glass-border);
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--glass-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.info .name {
  font-size: 0.9rem;
  font-weight: 600;
}

.info .role {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.top-bar h2 {
  font-size: 1.2rem;
  font-weight: 500;
}

.search-box input {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--glass-border);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-primary);
  width: 250px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.widget {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.widget-header h3 {
  font-size: 1.1rem;
  font-weight: 500;
}

.btn-text {
  background: none;
  border: none;
  color: var(--accent-primary);
  cursor: pointer;
  font-weight: 500;
}

.organigram-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--glass-border);
  border-radius: 12px;
  padding: 20px;
}

.node {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 24px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--glass-border);
}

.node span {
  font-size: 0.75rem;
  color: var(--accent-primary);
}

.lines {
  height: 40px;
  width: 2px;
  background: var(--glass-border);
}

.sub-nodes {
  display: flex;
  gap: 20px;
  border-top: 2px solid var(--glass-border);
  padding-top: 20px;
}

/* Chat Widget */
.chat-widget {
  padding: 0;
  overflow: hidden;
}

.chat-widget .widget-header {
  padding: 20px;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 0;
}

.status.online {
  width: 10px;
  height: 10px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--success);
}

.chat-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.message.bot {
  background: rgba(255, 255, 255, 0.05);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.message.user {
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-primary);
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid var(--glass-border);
  display: flex;
  gap: 12px;
}

.chat-input input {
  flex: 1;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--glass-border);
  padding: 10px 16px;
  border-radius: 20px;
  color: var(--text-primary);
}

.chat-input button {
  background: var(--accent-primary);
  color: #000;
  border: none;
  padding: 0 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}
</style>

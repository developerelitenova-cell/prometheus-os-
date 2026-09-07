<template>
  <div class="academia-layout">
    <nav class="glass-panel side-nav">
      <div class="brand">
        <div class="logo-box">AE</div>
      </div>
      <div class="nav-links">
        <a href="#" class="active"><i><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></i> Mi Cargo</a>
        <a href="#"><i><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></i> Mis KPIs</a>
        <a href="#"><i><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></i> Biblioteca Documental</a>
        <a href="#"><i><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></i> Plataformas</a>
        <a href="#"><i><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 4h20"></path><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4"></path><polyline points="2 12 12 22 22 12"></polyline></svg></i> Tutorías</a>
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
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: var(--font-sans);
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
  background: var(--gold-gradient);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: #fff;
  box-shadow: var(--shadow-md);
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
  background: var(--bg-secondary);
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
  background: var(--gold-light);
  color: var(--gold-deep);
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
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
  background: var(--bg-secondary);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  text-align: center;
  border: 1px solid var(--border-subtle);
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
  background: var(--bg-secondary);
  color: var(--ink-secondary);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.message.user {
  background: var(--gold-light);
  color: var(--gold-deep);
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  padding: 10px 16px;
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.chat-input button {
  background: var(--accent-primary);
  color: var(--ink);
  border: none;
  padding: 0 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}
</style>

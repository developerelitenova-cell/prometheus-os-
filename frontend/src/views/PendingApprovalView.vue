<template>
  <div class="pending-container">
    <TechNodesBackground />
    <div class="pending-card glass-panel">
      <img src="../assets/prometheus-os-logo.png" alt="PROMETHEUS OS" class="brand-lockup" />
      <img src="../assets/hourglass.jpg" alt="Pendiente" class="status-icon-img" />
      <h1>Registro exitoso</h1>
      <p class="subtitle">Tu solicitud de acceso quedó registrada.</p>
      <p class="detail">
        Un líder o administrador tiene que aprobar tu cuenta antes de que puedas ingresar.
        Te avisaremos apenas esté lista — por ahora podés cerrar esta ventana.
      </p>
      <router-link to="/login" class="btn-primary">Volver al inicio de sesión</router-link>

      <div class="developed-by">
        <span>Desarrollado por</span>
        <img src="../assets/elite-logo.jpeg" alt="Elite Nova" />
      </div>
    </div>
  </div>
</template>

<script setup>
import TechNodesBackground from '../components/TechNodesBackground.vue';
</script>

<style scoped>
.pending-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-family: var(--font-sans);
  padding: 24px;
}

.pending-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.brand-lockup {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto 24px;
}

.status-icon-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 12px;
  mix-blend-mode: multiply;
  border-radius: 50%;
}

.pending-card h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 16px 0;
}

.detail {
  color: var(--ink-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 28px 0;
}

.btn-primary {
  display: inline-block;
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 13px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s var(--ease-apple);
}

.btn-primary:hover {
  background: #000;
  transform: translateY(-1px);
}

.developed-by {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.developed-by span {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.developed-by img {
  height: 24px;
  width: auto;
  opacity: 0.8;
  transition: opacity 0.2s var(--ease-apple);
}

.developed-by img:hover {
  opacity: 1;
}
</style>

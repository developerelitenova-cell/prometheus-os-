<template>
  <div class="pending-container">
    <div class="pending-card glass-panel">
      <img src="../assets/elite-logo.jpeg" alt="Elite Nutrition" class="pending-logo" />
      <div class="status-icon">⏳</div>
      <h1>Registro exitoso</h1>
      <p class="subtitle">Tu solicitud de acceso quedó registrada.</p>
      <p class="detail">
        Un líder o administrador tiene que aprobar tu cuenta antes de que puedas ingresar.
        Te avisaremos apenas esté lista — por ahora podés cerrar esta ventana.
      </p>
      <router-link to="/login" class="btn-primary">Volver al inicio de sesión</router-link>
    </div>
  </div>
</template>

<script setup>
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
}

.pending-logo {
  height: 110px;
  margin-bottom: 20px;
}

.status-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
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
</style>

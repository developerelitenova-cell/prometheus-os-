<template>
  <div class="app-container">
    <!-- Router View con Animación de Transición -->
    <router-view v-slot="{ Component }">
      <transition name="fade-up" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Modal Global de Eventos Obligatorios -->
    <MandatoryEventModal />
  </div>
</template>

<script setup>
import MandatoryEventModal from '@/components/MandatoryEventModal.vue';
</script>

<style>
/*
  === Elite Nutrition · Design Tokens ===
  Paleta derivada del isotipo de marca (negro/carbón + dorado sobre blanco).
  Inspirada en la claridad y el aire de las interfaces de Apple.

  NOTA: estos tokens fueron pisados más de una vez por otra sesión con una
  paleta "tech" cian/morado neón, en contra de lo pedido explícitamente por
  el usuario (marca Elite Nutrition + estética Apple). Si volvés a ver la
  app en cian/morado, es porque volvieron a sobrescribir este bloque -- la
  paleta correcta y aprobada es esta.
*/
:root {
  /* Superficies */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-tertiary: #fbfbfd;
  --surface: #ffffff;
  --surface-elevated: rgba(255, 255, 255, 0.8);

  /* Glass / paneles flotantes (nav, modales) */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(0, 0, 0, 0.06);

  /* Bordes y separadores */
  --border: #d2d2d7;
  --border-subtle: #e8e8ed;

  /* Tinta (texto y elementos primarios) */
  --ink: #1d1d1f;
  --ink-secondary: #424245;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #86868b;

  /* Marca — dorado Elite Nutrition */
  --gold: #b08d57;
  --gold-deep: #8a6d3d;
  --gold-light: #e8d9b5;
  --gold-gradient: linear-gradient(135deg, #d4b06a 0%, #8a6d3d 100%);

  /* Compatibilidad con nombres previos usados en componentes existentes */
  --accent-primary: var(--gold);
  --accent-secondary: var(--gold-deep);

  /* Semánticos */
  --success: #34c759;
  --danger: #ff3b30;
  --warning: #ff9500;

  /* Radios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 980px;

  /* Sombras — suaves, difusas, sin resplandor de neón */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.12);

  /* Tipografía */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Noto Sans SC', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Curva de animación estilo Apple */
  --ease-apple: cubic-bezier(0.16, 1, 0.3, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* --- Panel flotante (glassmorphism sutil, tipo barra de navegación de macOS) --- */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  z-index: 1;
}

/* --- Transición de vistas --- */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.35s ease, transform 0.45s var(--ease-apple);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* --- Scrollbar --- */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: var(--radius-pill);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>

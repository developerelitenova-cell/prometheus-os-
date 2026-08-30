<template>
  <div class="tech-loader-container">
    <div class="tech-spinner">
      <div class="orbit orbit-1"></div>
      <div class="orbit orbit-2"></div>
      <div class="orbit orbit-3"></div>
      <div class="core"></div>
    </div>
    <div class="tech-text">
      <span class="glitch-text" :data-text="text">{{ text }}</span>
      <span class="dots">...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  text: {
    type: String,
    default: 'Sincronizando Sistema'
  }
});
</script>

<style scoped>
.tech-loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 24px;
}

.tech-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: var(--gold);
  border-bottom-color: var(--gold-light);
  animation: spin linear infinite;
}

.orbit-1 {
  width: 100%;
  height: 100%;
  animation-duration: 2s;
  border-left-color: var(--gold-light);
}

.orbit-2 {
  width: 75%;
  height: 75%;
  animation-duration: 1.5s;
  animation-direction: reverse;
  border-top-color: var(--gold-deep);
  border-bottom-color: var(--gold);
}

.orbit-3 {
  width: 50%;
  height: 50%;
  animation-duration: 1s;
  border-top-color: var(--ink);
}

.core {
  width: 15px;
  height: 15px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  animation: pulse 1.5s ease-in-out infinite alternate;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.2); opacity: 1; }
}

.tech-text {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--gold-deep);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
}

.glitch-text {
  position: relative;
}

.dots {
  animation: blink 1.5s infinite steps(4, end);
  width: 1.5em;
  text-align: left;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
}

@keyframes blink {
  0% { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}
</style>

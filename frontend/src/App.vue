<template>
  <div class="app-container" @mousemove="updateCursor" @mousedown="onMouseDown" @mouseup="onMouseUp">
    <!-- Fondo Animado Interactivo (Red Neuronal) -->
    <canvas ref="bgCanvas" class="cyber-canvas"></canvas>
    
    <!-- Puntero Tecnológico -->
    <div class="cyber-cursor" :class="{ 'cursor-active': isMouseDown }" :style="{ left: cursorX + 'px', top: cursorY + 'px' }"></div>
    <div class="cyber-cursor-trail" :class="{ 'cursor-active': isMouseDown }" :style="{ left: trailX + 'px', top: trailY + 'px' }"></div>

    <!-- Router View con Animación de Transición -->
    <router-view v-slot="{ Component }">
      <transition name="fade-up" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// --- CURSOR LOGIC ---
const cursorX = ref(-100);
const cursorY = ref(-100);
const trailX = ref(-100);
const trailY = ref(-100);
const isMouseDown = ref(false);

const updateCursor = (e) => {
  cursorX.value = e.clientX;
  cursorY.value = e.clientY;
};

const onMouseDown = () => { isMouseDown.value = true; };
const onMouseUp = () => { isMouseDown.value = false; };

// Lerp logic for the trail
let animationFrame;
const animateTrail = () => {
  trailX.value += (cursorX.value - trailX.value) * 0.15;
  trailY.value += (cursorY.value - trailY.value) * 0.15;
  animationFrame = requestAnimationFrame(animateTrail);
};

// --- CANVAS LOGIC (CYBER NETWORK) ---
const bgCanvas = ref(null);
let ctx;
let particlesArray = [];

class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5;
  }
  update(mouseX, mouseY) {
    this.x += this.speedX;
    this.y += this.speedY;

    // Boundary check
    if (this.x < 0 || this.x > this.canvasWidth) this.speedX *= -1;
    if (this.y < 0 || this.y > this.canvasHeight) this.speedY *= -1;

    // Mouse interaction (repel)
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 100) {
      this.x -= dx * 0.05;
      this.y -= dy * 0.05;
    }
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.fill();
  }
}

const initCanvas = () => {
  const canvas = bgCanvas.value;
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  };

  const initParticles = () => {
    particlesArray = [];
    const numberOfParticles = (canvas.width * canvas.height) / 15000;
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle(canvas.width, canvas.height));
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const animateCanvas = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Connect particles
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update(cursorX.value, cursorY.value);
      particlesArray[i].draw(ctx);
      
      for (let j = i; j < particlesArray.length; j++) {
        const dx = particlesArray[i].x - particlesArray[j].x;
        const dy = particlesArray[i].y - particlesArray[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 - distance / 800})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
          ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animateCanvas);
  };

  animateCanvas();
};

onMounted(() => {
  animateTrail();
  initCanvas();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

:root {
  --bg-primary: #050508;
  --bg-secondary: #0a0a0f;
  --glass-bg: rgba(10, 10, 15, 0.45);
  --glass-border: rgba(0, 240, 255, 0.15);
  --accent-primary: #00f0ff;
  --accent-secondary: #7000ff;
  --text-primary: #f0f0f5;
  --text-secondary: #a0a0b0;
  --danger: #ff3366;
  --success: #00ff99;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  cursor: none !important; /* Esconde el cursor del sistema para usar el nuestro */
}

body {
  font-family: 'Outfit', sans-serif;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(112, 0, 255, 0.05), transparent 30%),
    radial-gradient(circle at 85% 30%, rgba(0, 240, 255, 0.05), transparent 30%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* --- CYBER CANVAS --- */
.cyber-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

/* --- CUSTOM CURSOR --- */
.cyber-cursor {
  position: fixed;
  width: 8px;
  height: 8px;
  background: var(--accent-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 0 10px var(--accent-primary), 0 0 20px var(--accent-primary);
  transition: transform 0.1s;
}

.cyber-cursor-trail {
  position: fixed;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 240, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9998;
  transition: width 0.2s, height 0.2s, background 0.2s;
}

.cursor-active {
  transform: translate(-50%, -50%) scale(0.5);
}
.cyber-cursor-trail.cursor-active {
  background: rgba(0, 240, 255, 0.1);
  width: 48px;
  height: 48px;
}

/* --- GLASSMORPHISM V2 --- */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

/* --- ANIMACIONES DE TRANSICIÓN --- */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Scrollbar futurista */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-primary);
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 240, 255, 0.2);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}
</style>

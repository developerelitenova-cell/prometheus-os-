<template>
  <canvas ref="canvasRef" class="tech-nodes-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let animationFrameId = null
let particles = []
let canvas = null
let ctx = null
let width = 0
let height = 0

// Configuración visual adaptada a PROMETHEUS OS (tonos dorados y oscuros)
const PARTICLE_COUNT = 85;
const MAX_DISTANCE = 160;
const PARTICLE_SPEED = 0.4;

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * PARTICLE_SPEED;
    this.vy = (Math.random() - 0.5) * PARTICLE_SPEED;
    this.radius = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Rebote suave en los bordes
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = 'rgba(212, 175, 55, 0.7)'; // Dorado para los nodos
    context.fill();
  }
}

const resizeCanvas = () => {
  if (!canvasRef.value) return;
  canvas = canvasRef.value;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

const initParticles = () => {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

const animate = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw(ctx);

    // Dibujar conexiones entre nodos cercanos
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MAX_DISTANCE) {
        ctx.beginPath();
        // Opacidad depende de la cercanía
        const opacity = 1 - (distance / MAX_DISTANCE);
        ctx.strokeStyle = `rgba(212, 175, 55, ${opacity * 0.4})`; // Dorado semitransparente para las líneas
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  animationFrameId = requestAnimationFrame(animate);
}

onMounted(() => {
  canvas = canvasRef.value;
  ctx = canvas.getContext('2d');
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  initParticles();
  animate();
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
})
</script>

<style scoped>
.tech-nodes-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none; /* Permite clicks a los elementos por debajo/arriba */
}
</style>

<template>
  <div class="neuron-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <div class="overlay-text">
      <h3 class="glow-text">Estructurando Flujo de Trabajo...</h3>
      <p>La Inteligencia Artificial está analizando tu proceso</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref(null);
const containerRef = ref(null);
let animationId = null;

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  const container = containerRef.value;
  
  // Set canvas size
  const resize = () => {
    canvas.width = container.clientWidth;
    canvas.height = 300; // Fixed height for the animation area
  };
  
  window.addEventListener('resize', resize);
  resize();

  // Neuron properties
  const particles = [];
  const particleCount = 60;
  const maxDistance = 100;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.radius = Math.random() * 2 + 1;
      // Use Elite Nutrition brand gold tones
      this.color = Math.random() > 0.5 ? '#b08d57' : '#8a6d3d';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      
      // Draw synapses
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const opacity = 1 - (distance / maxDistance);
          ctx.strokeStyle = `rgba(176, 141, 87, ${opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    animationId = requestAnimationFrame(animate);
  };

  animate();

  onUnmounted(() => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(animationId);
  });
});
</script>

<style scoped>
.neuron-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.overlay-text {
  position: relative;
  z-index: 10;
  text-align: center;
  background: var(--glass-bg);
  padding: 1.5rem 2rem;
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
}

.glow-text {
  color: var(--ink);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: pulse-glow 2s infinite alternate;
}

.overlay-text p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

@keyframes pulse-glow {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.15); }
}
</style>

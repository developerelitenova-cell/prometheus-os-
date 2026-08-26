<template>
  <div class="role-graph-container" ref="containerRef">
    <canvas ref="canvasRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave"></canvas>
    <div v-if="hoveredNode && hoveredNode.type !== 'center'" class="node-tooltip" :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
      <div class="tooltip-badge" :style="{ backgroundColor: hoveredNode.color }">{{ hoveredNode.typeLabel }}</div>
      <div class="tooltip-content">{{ hoveredNode.text }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  role: { type: Object, required: true },
  workflow: { type: Object, required: true }
});

const containerRef = ref(null);
const canvasRef = ref(null);

let animationId = null;
let nodes = [];
let centerX = 0;
let centerY = 0;
let time = 0;

const hoveredNode = ref(null);
const tooltipX = ref(0);
const tooltipY = ref(0);
let mouseX = -1000;
let mouseY = -1000;

// Configuración de categorías de nodos
const categories = [
  { key: 'tasks', label: 'Tarea / Responsabilidad', color: '#7000ff', radius: 140 },
  { key: 'inputs', label: 'Entrada (Input)', color: '#3b82f6', radius: 100 },
  { key: 'outputs', label: 'Salida (Output)', color: '#10b981', radius: 180 },
  { key: 'tools_used', label: 'Herramienta', color: '#f97316', radius: 220 },
  { key: 'kpis', label: 'Indicador (KPI)', color: '#00f0ff', radius: 260 }
];

const initGraph = () => {
  nodes = [];
  
  // Nodo central
  nodes.push({
    id: 'center',
    type: 'center',
    text: props.role?.name || 'Cargo',
    x: 0,
    y: 0,
    baseX: 0,
    baseY: 0,
    color: '#ffffff',
    size: 20
  });

  // Nodos satélites
  categories.forEach(cat => {
    const items = props.workflow[cat.key] || [];
    if (!Array.isArray(items)) return;

    const angleStep = (Math.PI * 2) / items.length;
    let currentAngle = Math.random() * Math.PI; // random start angle

    items.forEach((item, index) => {
      // Evitar textos vacíos
      if (!item || typeof item !== 'string' || item.trim() === '') return;
      
      nodes.push({
        id: `${cat.key}-${index}`,
        type: cat.key,
        typeLabel: cat.label,
        text: item,
        angle: currentAngle,
        orbitRadius: cat.radius,
        baseRadius: cat.radius,
        speed: 0.001 + (Math.random() * 0.002), // velocidad de órbita
        wobbleOffset: Math.random() * Math.PI * 2,
        color: cat.color,
        size: 6,
        x: 0, y: 0
      });
      currentAngle += angleStep;
    });
  });
};

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Fondo
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const isHoveringAny = hoveredNode.value !== null;

  // Actualizar posiciones (si no estamos en hover)
  if (!isHoveringAny) {
    time += 1;
  }

  // Dibujar sinapsis (líneas)
  nodes.forEach(node => {
    if (node.type === 'center') {
      node.x = centerX;
      node.y = centerY;
      return;
    }

    if (!isHoveringAny) {
      // Movimiento orbital y flotante
      node.angle += node.speed;
      const wobble = Math.sin(time * 0.02 + node.wobbleOffset) * 10;
      const currentRadius = node.baseRadius + wobble;
      
      node.x = centerX + Math.cos(node.angle) * currentRadius;
      node.y = centerY + Math.sin(node.angle) * currentRadius;
    }

    // Dibujar línea al centro
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(node.x, node.y);
    
    // Opacidad de la línea
    let lineOpacity = 0.15;
    if (isHoveringAny) {
      if (hoveredNode.value.id === node.id) lineOpacity = 0.8;
      else lineOpacity = 0.05;
    }
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
    ctx.lineWidth = isHoveringAny && hoveredNode.value.id === node.id ? 2 : 1;
    ctx.stroke();
  });

  // Dibujar Nodos
  nodes.forEach(node => {
    let nodeOpacity = 1;
    let drawSize = node.size;
    
    if (isHoveringAny && node.type !== 'center') {
      if (hoveredNode.value.id === node.id) {
        nodeOpacity = 1;
        drawSize = node.size * 1.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;
      } else {
        nodeOpacity = 0.2;
        ctx.shadowBlur = 0;
      }
    } else {
      ctx.shadowBlur = node.type === 'center' ? 20 : 5;
      ctx.shadowColor = node.color;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = node.type === 'center' ? '#fff' : node.color;
    ctx.globalAlpha = nodeOpacity;
    ctx.fill();
    ctx.globalAlpha = 1; // reset
    ctx.shadowBlur = 0;

    // Etiqueta del nodo central
    if (node.type === 'center') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.text, node.x, node.y + 35);
    }
  });

  animationId = requestAnimationFrame(draw);
};

const resize = () => {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;
  
  canvas.width = container.clientWidth;
  canvas.height = 600; // Altura fija grande para el grafo
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
};

const onMouseMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  // Detección de colisión simple
  let found = null;
  for (const node of nodes) {
    if (node.type === 'center') continue;
    const dx = mouseX - node.x;
    const dy = mouseY - node.y;
    if (Math.sqrt(dx * dx + dy * dy) < node.size * 3) { // hit box más grande
      found = node;
      break;
    }
  }

  if (found) {
    hoveredNode.value = found;
    tooltipX.value = found.x + 15;
    tooltipY.value = found.y + 15;
  } else {
    hoveredNode.value = null;
  }
};

const onMouseLeave = () => {
  hoveredNode.value = null;
};

onMounted(() => {
  initGraph();
  window.addEventListener('resize', resize);
  resize();
  draw();
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  if (animationId) cancelAnimationFrame(animationId);
});

watch(() => props.workflow, () => {
  initGraph();
}, { deep: true });

</script>

<style scoped>
.role-graph-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: radial-gradient(circle at center, #12121a 0%, #08080c 100%);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 240, 255, 0.1);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.05) inset;
}

canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.node-tooltip {
  position: absolute;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 16px;
  border-radius: 8px;
  width: 280px;
  pointer-events: none; /* No bloquear eventos del mouse */
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(-50%);
}

.tooltip-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.tooltip-content {
  color: #e2e8f0;
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>

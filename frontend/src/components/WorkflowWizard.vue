<template>
  <div class="wizard-container">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: (currentStep / questions.length) * 100 + '%' }"></div>
    </div>
    
    <div class="wizard-step glass-panel">
      <div class="step-indicator">Paso {{ currentStep }} de {{ questions.length }}</div>
      <h2 class="question-title">{{ currentQuestion.title }}</h2>
      <p class="question-desc" v-if="currentQuestion.desc">{{ currentQuestion.desc }}</p>
      
      <textarea 
        v-model="answers[currentStep - 1]" 
        rows="6" 
        placeholder="Escribe tu respuesta aquí de la forma más natural posible..."
      ></textarea>
      
      <div class="wizard-actions">
        <button class="btn-edit" @click="prevStep" :disabled="currentStep === 1">← Anterior</button>
        <button class="btn-primary" @click="nextStep" v-if="currentStep < questions.length" :disabled="!answers[currentStep - 1].trim()">Siguiente →</button>
        <button class="btn-primary finish-btn" @click="finish" v-if="currentStep === questions.length" :disabled="!answers[currentStep - 1].trim()">Finalizar y Procesar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['submit']);

const currentStep = ref(1);
const answers = ref(Array(9).fill(''));

const questions = [
  {
    title: "Antes de hablar de un proceso específico, ¿cuáles son TODAS las responsabilidades, tareas diarias, semanales o mensuales por las que respondes en tu cargo?",
    desc: "Mapeo General de Responsabilidades"
  },
  {
    title: "Ahora, pensando en la tarea o proceso más crítico que haces: ¿Qué situación, mensaje o documento te avisa que es momento de empezar, y quién te lo entrega?",
    desc: "El Disparador del Trabajo (Inicio del proceso)"
  },
  {
    title: "Cuéntame, paso a paso y en el orden en que lo haces, ¿cuáles son las acciones que realizas desde que recibes ese aviso inicial hasta que terminas por completo tu labor?",
    desc: "La Secuencia Operativa paso a paso"
  },
  {
    title: "¿Qué programas de computadora, planillas de Excel, carpetas físicas o herramientas utilizas para llevar a cabo cada uno de esos pasos?",
    desc: "Herramientas, Tecnología y Soportes"
  },
  {
    title: "Durante tu rutina, ¿hay momentos en los que debes revisar algo y tomar una decisión? ¿Qué criterios usas para elegir un camino u otro?",
    desc: "Por ejemplo: 'si todo está bien, hago el paso A; pero si hay un error, hago el paso B'."
  },
  {
    title: "Cuando terminas por completo tu labor, ¿cuál es el resultado final o documento terminado que generas, y a quién se lo entregas?",
    desc: "El Entregable Final y el Usuario (Fin del proceso)"
  },
  {
    title: "¿Qué es lo que más te hace perder tiempo, te frena, te genera frustración o te obliga a repetir el trabajo durante el día?",
    desc: "Obstáculos, Desperdicios y Demoras (Cuellos de Botella)"
  },
  {
    title: "Para terminar este trabajo, ¿necesitas pedir información o coordinar con compañeros de otros departamentos? ¿Quién da el visto bueno final?",
    desc: "Coordinación Interdepartamental"
  },
  {
    title: "¿Cómo sabes que hiciste un trabajo excelente? ¿Qué medida, número o meta usas tú o tu jefe para evaluar si la tarea salió bien?",
    desc: "El Criterio de Éxito (Medición)"
  }
];

const currentQuestion = computed(() => questions[currentStep.value - 1]);

const nextStep = () => {
  if (currentStep.value < questions.length) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const finish = () => {
  // Combine all answers into a single structured narrative
  let combinedSourceText = "";
  questions.forEach((q, index) => {
    combinedSourceText += `Pregunta: ${q.title}\n`;
    combinedSourceText += `Respuesta: ${answers.value[index]}\n\n`;
  });
  
  emit('submit', combinedSourceText);
};
</script>

<style scoped>
.wizard-container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gold-gradient);
  transition: width 0.3s ease;
}

.wizard-step {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: var(--shadow-sm);
}

.step-indicator {
  color: var(--gold-deep);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: var(--font-mono);
}

.question-title {
  color: var(--ink);
  font-size: 1.4rem;
  line-height: 1.4;
  margin: 0;
}

.question-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

textarea {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--ink);
  padding: 16px;
  font-family: inherit;
  font-size: 1.05rem;
  resize: vertical;
  margin-top: 10px;
  transition: border-color 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-light);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn-primary {
  background: var(--ink);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.finish-btn {
  background: var(--success);
  color: #fff;
}

.btn-edit {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.btn-edit:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>

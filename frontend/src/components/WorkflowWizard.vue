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
const answers = ref(Array(8).fill(''));

const questions = [
  {
    title: "¿Qué situación, mensaje o documento te avisa que es momento de empezar a trabajar en esta tarea, y quién te lo entrega o envía?",
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7000ff, #00f0ff);
  transition: width 0.3s ease;
}

.wizard-step {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.step-indicator {
  color: #00f0ff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.question-title {
  color: #fff;
  font-size: 1.4rem;
  line-height: 1.4;
  margin: 0;
}

.question-desc {
  color: #a0a0a0;
  font-size: 0.95rem;
  margin: 0;
}

textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  padding: 16px;
  font-family: inherit;
  font-size: 1.05rem;
  resize: vertical;
  margin-top: 10px;
  transition: border-color 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: #00f0ff;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, #7000ff, #00f0ff);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s ease;
  min-width: 150px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.finish-btn {
  background: linear-gradient(135deg, #00f0ff, #00ffaa);
  color: #000;
}

.btn-edit {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #00f0ff;
  color: #00f0ff;
}

.btn-edit:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>

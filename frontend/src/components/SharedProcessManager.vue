<template>
  <div class="glass-panel process-manager">
    <h3>Asignación de Procesos Compartidos</h3>
    <p>Área Seleccionada: <strong>{{ activeArea }}</strong></p>
    
    <div class="process-form">
      <input type="text" placeholder="Nombre del Proceso (Ej. Apertura de Sede)" v-model="newProcessName" class="inline-edit">
      <textarea placeholder="Descripción del proceso..." v-model="newProcessDesc" class="inline-edit mt-2"></textarea>
      
      <div class="roles-selector mt-4">
        <h4>Aplica a los siguientes cargos:</h4>
        <div class="checkbox-group">
          <label v-for="role in areaRoles" :key="role.role" class="checkbox-label">
            <input type="checkbox" :value="role.role" v-model="selectedRoles">
            {{ role.role }}
          </label>
        </div>
      </div>
      
      <button class="btn-primary mt-4" @click="assignProcess">Asignar a Múltiples Cargos</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps({
  activeArea: String,
  areaRoles: Array
});

const newProcessName = ref('');
const newProcessDesc = ref('');
const selectedRoles = ref([]);

const assignProcess = () => {
  if (!newProcessName.value || selectedRoles.value.length === 0) {
    alert("Ingresa un proceso y selecciona al menos un cargo.");
    return;
  }
  alert(`Proceso asignado exitosamente a ${selectedRoles.value.length} cargos.`);
  newProcessName.value = '';
  newProcessDesc.value = '';
  selectedRoles.value = [];
};
</script>

<style scoped>
.process-manager {
  padding: 20px;
  margin-top: 20px;
}

.process-manager h3 {
  color: var(--accent-primary);
  margin-bottom: 8px;
}

.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }

.inline-edit {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-family: inherit;
  padding: 10px;
  border-radius: 8px;
  width: 100%;
}

.inline-edit:focus {
  outline: none;
  border-color: var(--accent-primary);
}

textarea.inline-edit {
  resize: vertical;
  min-height: 80px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input {
  accent-color: var(--accent-primary);
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>

<template>
  <div class="w-full h-full relative" style="min-height: 200px;">
    <TresCanvas clear-color="transparent" :alpha="true">
      <TresPerspectiveCamera :position="[0, 1.2, 3.5]" :look-at="[0, 1, 0]" />
      
      <!-- Luces para resaltar el acabado metálico/plástico -->
      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" cast-shadow />
      <TresDirectionalLight :position="[-5, 3, -5]" :intensity="1" color="#8a6d3d" />

      <Suspense>
        <GLTFModel path="/oracle-avatar.glb" @load="onModelLoad" />
      </Suspense>
      
      <OrbitControls :enable-pan="false" :enable-zoom="false" :min-polar-angle="Math.PI/2" :max-polar-angle="Math.PI/2" />
    </TresCanvas>
  </div>
</template>

<script setup>
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { OrbitControls, GLTFModel } from '@tresjs/cientos'
import { shallowRef, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  isThinking: Boolean,
  isTalking: Boolean
})

const modelRef = shallowRef(null)
const mixer = shallowRef(null)
const currentAction = shallowRef(null)

const onModelLoad = (model) => {
  modelRef.value = model
  
  if (model.animations && model.animations.length > 0) {
    mixer.value = new THREE.AnimationMixer(model.scene || model)
    currentAction.value = mixer.value.clipAction(model.animations[0])
    currentAction.value.play()
    
    // Set initial speed based on props
    currentAction.value.timeScale = props.isThinking ? 2.5 : 1.0
  }
}

const { onLoop } = useRenderLoop()
onLoop(({ delta }) => {
  if (mixer.value) {
    mixer.value.update(delta)
  }
})

// Watchers para reaccionar al estado del Oráculo
watch(() => props.isThinking, (newVal) => {
  if (currentAction.value) {
    // Si está pensando, aceleramos la animación para que parezca que procesa
    currentAction.value.timeScale = newVal ? 2.5 : 1.0
  }
})

watch(() => props.isTalking, (newVal) => {
  if (currentAction.value && !props.isThinking) {
    // Si habla (y no está pensando), velocidad media
    currentAction.value.timeScale = newVal ? 1.5 : 1.0
  }
})
</script>

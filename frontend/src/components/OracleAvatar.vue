<template>
  <div class="w-full h-full relative" style="min-height: 200px;">
    <TresCanvas clear-color="transparent" alpha>
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
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, GLTFModel } from '@tresjs/cientos'
import { ref, watch, shallowRef } from 'vue'

const props = defineProps({
  isThinking: Boolean,
  isTalking: Boolean
})

const modelRef = shallowRef(null)

const onModelLoad = (model) => {
  modelRef.value = model
  console.log("Model loaded successfully!", model)
  // Nota: una vez que sepamos el nombre de las animaciones, implementaremos useAnimations
}
</script>

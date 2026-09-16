<template>
  <div class="welcome-container">
    <TechNodesBackground />
    <div class="welcome-card glass-panel">
      <img src="../assets/elite-nova-logo.png" alt="PROMETHEUS OS" class="brand-lockup" />
      
      <div class="status-icon">
        <span class="material-symbols-outlined text-4xl text-[#d4b06a]">verified_user</span>
      </div>

      <h1 class="welcome-title">¡Bienvenido a PROMETHEUS OS!</h1>
      
      <p class="subtitle" v-if="profile">
        Acceso verificado como <strong>{{ profile.roles?.name || 'Colaborador' }}</strong>
      </p>

      <p class="detail">
        Para activar tu perfil corporativo y habilitar tu Panel de Trabajo, tómate tu <strong>foto de verificación de identidad</strong>.
      </p>

      <!-- MÓDULO DE FOTO DE VERIFICACIÓN -->
      <div class="photo-capture-box">
        <!-- Vista previa de foto capturada -->
        <div v-if="capturedPhoto" class="preview-container">
          <img :src="capturedPhoto" alt="Foto de verificación" class="captured-image" />
          <div class="verified-badge">
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
            Foto Verificada
          </div>
        </div>

        <!-- Vista en vivo de la cámara -->
        <div v-else class="camera-viewport">
          <video ref="videoRef" autoplay playsinline class="video-feed" :class="{ 'video-hidden': !cameraActive }"></video>
          
          <div v-if="cameraActive" class="face-guide">
            <div class="guide-oval"></div>
            <span class="guide-text">Centra tu rostro en el óvalo</span>
          </div>

          <div v-else class="camera-placeholder">
            <span class="material-symbols-outlined camera-icon">photo_camera</span>
            <p class="text-xs text-secondary mt-2">La cámara se activará para verificar tu identidad</p>
          </div>

          <div v-if="cameraActive" class="live-indicator">
            <span class="pulse-dot"></span> EN VIVO
          </div>
        </div>

        <canvas ref="canvasRef" style="display: none;"></canvas>
        <input type="file" accept="image/*" ref="fileInputRef" style="display: none;" @change="handleFileUpload" />

        <!-- Acciones de captura -->
        <div class="photo-actions">
          <div v-if="!capturedPhoto" class="flex flex-col items-center gap-2 w-full">
            <button 
              v-if="!cameraActive" 
              type="button" 
              class="btn-camera-action"
              @click="startCamera"
            >
              <span class="material-symbols-outlined text-[18px]">videocam</span>
              Activar Cámara Web
            </button>
            <button 
              v-else 
              type="button" 
              class="btn-capture"
              @click="takePhoto"
            >
              <span class="material-symbols-outlined text-[20px]">camera</span>
              Tomar Foto de Verificación
            </button>

            <button 
              type="button" 
              class="btn-upload-link"
              @click="fileInputRef?.click()"
            >
              <span class="material-symbols-outlined text-[14px]">upload_file</span>
              O subir foto desde tu dispositivo
            </button>
          </div>

          <div v-else class="flex justify-center w-full">
            <button 
              type="button" 
              class="btn-retake"
              @click="retakePhoto"
            >
              <span class="material-symbols-outlined text-[16px]">refresh</span>
              Tomar otra foto
            </button>
          </div>
        </div>

        <p v-if="cameraError" class="text-xs text-amber-600 mt-2 font-medium">{{ cameraError }}</p>
      </div>

      <!-- BOTÓN PRINCIPAL DE ACCESO DIRECTO -->
      <button 
        class="btn-primary" 
        :disabled="loading || !capturedPhoto" 
        @click="continueOnboarding"
      >
        <span v-if="loading" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        {{ loading ? 'Activando...' : (capturedPhoto ? 'Ingresar a mi Panel de Trabajo →' : 'Tómate la foto para continuar') }}
      </button>

      <div class="developed-by">
        <span>Desarrollado por</span>
        <img src="../assets/elite-nova-logo.png" alt="Elite Nova" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../api/supabase';
import { currentProfile, loadCurrentProfile } from '../api/auth';
import TechNodesBackground from '../components/TechNodesBackground.vue';

const router = useRouter();
const profile = ref(null);
const loading = ref(false);

// State de verificación de foto
const videoRef = ref(null);
const canvasRef = ref(null);
const fileInputRef = ref(null);
const cameraActive = ref(false);
const cameraError = ref('');
const capturedPhoto = ref(null);
let mediaStream = null;

onMounted(async () => {
  if (!currentProfile.value) {
    await loadCurrentProfile();
  }
  profile.value = currentProfile.value;

  // Si el perfil ya tiene foto de verificación previa, cargarla
  if (profile.value?.verification_photo || profile.value?.avatar_url) {
    capturedPhoto.value = profile.value.verification_photo || profile.value.avatar_url;
  } else {
    // Intentar iniciar la cámara automáticamente
    startCamera();
  }
});

onUnmounted(() => {
  stopCamera();
});

const startCamera = async () => {
  cameraError.value = '';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      audio: false
    });
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
      cameraActive.value = true;
    }
  } catch (err) {
    console.warn('Acceso a cámara no disponible:', err);
    cameraActive.value = false;
    cameraError.value = 'No se detectó cámara web o permisos. Puedes subir una foto desde tu dispositivo.';
  }
};

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  cameraActive.value = false;
};

const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const width = video.videoWidth || 480;
  const height = video.videoHeight || 480;
  const size = Math.min(width, height);

  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  const startX = (width - size) / 2;
  const startY = (height - size) / 2;

  // Espejo para vista frontal natural
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, startX, startY, size, size, 0, 0, canvas.width, canvas.height);

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.85);
  stopCamera();
};

const retakePhoto = () => {
  capturedPhoto.value = null;
  startCamera();
};

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    capturedPhoto.value = event.target.result;
    stopCamera();
  };
  reader.readAsDataURL(file);
};

const continueOnboarding = async () => {
  if (!profile.value || !capturedPhoto.value) return;
  loading.value = true;
  try {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    
    // 1. Guardar foto de verificación en backend
    try {
      await fetch(`${apiUrl}/api/v1/user/verification-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.value.id,
          photo: capturedPhoto.value
        })
      });
    } catch (e) {
      console.warn('Fallback backend save:', e);
    }

    // 2. Actualizar profiles en Supabase
    try {
      await supabase.from('profiles').update({ 
        welcome_seen: true,
        verification_photo: capturedPhoto.value,
        avatar_url: capturedPhoto.value
      }).eq('id', profile.value.id);
    } catch (e) {
      await supabase.from('profiles').update({ welcome_seen: true }).eq('id', profile.value.id);
    }

    stopCamera();
    await loadCurrentProfile();
    
    // Entrar directo al panel de trabajo
    router.replace('/workspace');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  font-family: var(--font-sans);
  padding: 24px;
}

.welcome-card {
  width: 100%;
  max-width: 480px;
  padding: 36px 32px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.brand-lockup {
  display: block;
  width: 100%;
  max-width: 260px;
  margin: 0 auto 16px;
}

.status-icon {
  margin-bottom: 8px;
}

.welcome-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin: 0 0 12px 0;
}

.subtitle strong {
  color: var(--ink);
}

.detail {
  color: var(--ink-secondary);
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0 0 20px 0;
}

/* Box de captura de foto */
.photo-capture-box {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e5e5ea);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.camera-viewport,
.preview-container {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 14px;
  border-radius: 50%;
  overflow: hidden;
  background: #000;
  border: 3px solid var(--gold, #d4b06a);
  box-shadow: 0 4px 14px rgba(212, 176, 106, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.video-hidden {
  display: none;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #fff;
}

.camera-placeholder .camera-icon {
  font-size: 48px;
  color: var(--gold, #d4b06a);
}

.face-guide {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.guide-oval {
  width: 130px;
  height: 160px;
  border: 2px dashed rgba(255, 255, 255, 0.75);
  border-radius: 50%;
}

.guide-text {
  position: absolute;
  bottom: 12px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.live-indicator {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 38, 38, 0.85);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.captured-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.verified-badge {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  white-space: nowrap;
}

.btn-camera-action,
.btn-capture {
  background: var(--ink, #1d1d1f);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-capture {
  background: #10b981;
}

.btn-capture:hover {
  background: #059669;
  transform: scale(1.02);
}

.btn-camera-action:hover {
  background: #000;
}

.btn-upload-link {
  background: transparent;
  border: none;
  color: var(--text-secondary, #6b7280);
  font-size: 0.76rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.btn-upload-link:hover {
  color: var(--ink, #1d1d1f);
  text-decoration: underline;
}

.btn-retake {
  background: var(--surface-container, #f3f4f6);
  border: 1px solid var(--border, #e5e5ea);
  color: var(--ink, #1d1d1f);
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-retake:hover {
  background: #e5e7eb;
}

.btn-primary {
  width: 100%;
  background: var(--ink, #1d1d1f);
  color: #fff;
  border: none;
  padding: 14px 24px;
  border-radius: var(--radius-pill, 30px);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-apple);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.developed-by {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.developed-by span {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.developed-by img {
  height: 22px;
  width: auto;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .welcome-card {
    padding: 24px 16px;
  }
  .camera-viewport,
  .preview-container {
    width: 190px;
    height: 190px;
  }
}
</style>

<template>
  <header class="relative z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0">
    <div class="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
      
      <!-- Logo & Context -->
      <div class="flex items-center gap-3">
        <router-link to="/" class="h-14 w-auto flex-shrink-0 hover:opacity-90 transition-opacity">
          <img src="@/assets/elite-nova-logo.png" alt="Elite Nova Group" class="h-full w-auto object-contain" />
        </router-link>
        <div class="hidden sm:block">
          <h1 class="text-xl font-bold tracking-tight text-[#1d1d1f] leading-none">Elite Nutrition</h1>
          <p class="text-[11px] font-semibold text-[#86868b] tracking-widest uppercase mt-1">PROMETHEUS OS</p>
        </div>
      </div>

      <!-- Main Navigation Links -->
      <nav class="hidden lg:flex items-center gap-8">
        <router-link v-if="isLoggedIn" to="/workspace" class="text-sm font-medium text-[#1d1d1f]/70 hover:text-[#8a6d3d] transition-colors" active-class="text-[#8a6d3d] font-bold">Portal Corporativo</router-link>
        <router-link v-if="isLoggedIn" to="/mapa-cargos" class="text-sm font-medium text-[#1d1d1f]/70 hover:text-[#8a6d3d] transition-colors" active-class="text-[#8a6d3d] font-bold">Estructura Corporativa</router-link>
        <router-link v-if="isLoggedIn" to="/team" class="text-sm font-medium text-[#1d1d1f]/70 hover:text-[#8a6d3d] transition-colors" active-class="text-[#8a6d3d] font-bold">Directorio</router-link>
        
        <router-link v-if="isLoggedIn" to="/oracle" class="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1" active-class="text-primary/90 font-bold">
          <span class="material-symbols-outlined text-[16px]">auto_awesome</span> Oráculo IA
        </router-link>
        
        <router-link v-if="isMasterUser" to="/master" class="text-sm font-bold text-[#8a6d3d] hover:text-[#d4b06a] transition-colors flex items-center gap-1" active-class="text-[#d4b06a]">
          <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span> Auditoría Master
        </router-link>
      </nav>

      <!-- User Actions -->
      <div class="flex items-center gap-3 md:gap-4">
        <template v-if="!isLoggedIn">
          <router-link to="/login" class="text-sm font-medium text-[#1d1d1f] hover:text-[#8a6d3d] transition-colors hidden sm:block">
            Acceso Restringido
          </router-link>
          <router-link to="/login" class="h-10 px-6 rounded-full bg-[#1d1d1f] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#8a6d3d] transition-all shadow-md">
            <span class="material-symbols-outlined text-[18px]">lock</span>
            Iniciar Sesión
          </router-link>
        </template>
        
        <template v-else>
          <router-link v-if="isControlUser && route.path !== '/team' && route.path !== '/leader'" to="/team" class="text-sm font-medium text-[#1d1d1f] hover:text-[#8a6d3d] transition-colors hidden md:block">
            Centro de Control
          </router-link>
          
          <router-link v-if="route.path !== '/workspace'" to="/workspace" class="h-10 px-5 rounded-full bg-[#1d1d1f] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#8a6d3d] transition-all shadow-md">
            Mi Espacio Elite
          </router-link>
          <div v-else class="h-10 px-5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-sm font-semibold flex items-center gap-2 shadow-sm pointer-events-none">
            {{ currentProfile?.full_name || 'Mi Espacio' }}
          </div>

          <button @click="handleSignOut" class="h-10 w-10 md:w-auto md:px-4 rounded-full bg-red-50 text-red-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-all ml-1" title="Cerrar sesión">
            <span class="material-symbols-outlined text-[18px]">logout</span>
            <span class="hidden md:inline">Salir</span>
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../api/supabase'
import { currentProfile, loadCurrentProfile, isMasterAdmin, isManager, signOut } from '../api/auth'

const router = useRouter()
const route = useRoute()

const isLoggedIn = ref(false)
const isControlUser = computed(() => isMasterAdmin() || isManager())
const isMasterUser = computed(() => isMasterAdmin())

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  isLoggedIn.value = !!data.session
  if (isLoggedIn.value && !currentProfile.value) {
    await loadCurrentProfile()
  }
})

// Listen to auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  isLoggedIn.value = !!session;
})

const handleSignOut = async () => {
  await signOut()
  isLoggedIn.value = false
  router.push('/login')
}
</script>

<template>
  <header class="relative z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0">
    <div class="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4 overflow-hidden">

      <!-- Logo & Context — shrink-0 para que nunca se comprima -->
      <div class="flex items-center gap-2.5 shrink-0">
        <router-link to="/" class="h-11 w-auto flex-shrink-0 hover:opacity-90 transition-opacity">
          <img src="@/assets/elite-nova-logo.png" alt="Elite Nova Group" class="h-full w-auto object-contain" />
        </router-link>
        <div class="hidden sm:block">
          <h1 class="text-[15px] font-bold tracking-tight text-[#1d1d1f] leading-none">Elite Nutrition</h1>
          <p class="text-[9px] font-semibold text-[#86868b] tracking-widest uppercase mt-0.5">PROMETHEUS OS</p>
        </div>
      </div>

      <!-- Main Navigation Links — ocupa el espacio sobrante, nunca crece más -->
      <nav class="hidden lg:flex items-center gap-3 xl:gap-4 flex-1 min-w-0 overflow-x-auto no-scrollbar">
        <router-link
          v-if="isLoggedIn"
          to="/workspace"
          class="text-[12px] xl:text-[13px] font-medium text-[#1d1d1f]/70 hover:text-[#8a6d3d] transition-colors whitespace-nowrap"
          active-class="text-[#8a6d3d] font-bold"
        >Portal Corporativo</router-link>

        <router-link
          v-if="isLoggedIn"
          to="/mapa-cargos"
          class="text-[12px] xl:text-[13px] font-medium text-[#1d1d1f]/70 hover:text-[#8a6d3d] transition-colors whitespace-nowrap"
          active-class="text-[#8a6d3d] font-bold"
        >Estructura Corporativa</router-link>

        <router-link
          v-if="isLoggedIn"
          to="/oracle"
          class="text-[12px] xl:text-[13px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 whitespace-nowrap"
          active-class="text-primary/90 font-bold"
        >
          <span class="material-symbols-outlined text-[15px]">auto_awesome</span> Oráculo IA
        </router-link>

        <!-- Centro de Control: solo para líderes/admin, dentro del nav principal -->
        <router-link
          v-if="isLoggedIn && isControlUser"
          to="/leader"
          class="text-[12px] xl:text-[13px] font-medium transition-colors whitespace-nowrap px-2.5 py-1 rounded-md"
          :class="['/leader', '/kpis', '/events', '/rrhh', '/roles', '/manuals', '/support-contacts'].includes(route.path) ? 'text-[#8a6d3d] font-bold bg-[#8a6d3d]/10' : 'text-[#1d1d1f]/70 hover:text-[#8a6d3d] hover:bg-[#8a6d3d]/5'"
        >Centro de Control</router-link>

        <router-link
          v-if="isLoggedIn && canManageAccounts"
          to="/cuentas"
          class="text-[12px] xl:text-[13px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md"
          :class="['/cuentas'].includes(route.path) ? 'text-[#8a6d3d] font-bold bg-[#8a6d3d]/10' : 'text-[#1d1d1f]/70 hover:text-[#8a6d3d] hover:bg-[#8a6d3d]/5'"
        >
          <span class="material-symbols-outlined text-[15px]">key</span> Cuentas & Accesos
        </router-link>

        <router-link
          v-if="isMasterUser"
          to="/master"
          class="text-[12px] xl:text-[13px] font-bold text-[#8a6d3d] hover:text-[#d4b06a] transition-colors flex items-center gap-1 whitespace-nowrap"
          active-class="text-[#d4b06a]"
        >
          <span class="material-symbols-outlined text-[15px]">admin_panel_settings</span> Auditoría Master
        </router-link>
      </nav>

      <!-- Spacer para pantallas sin nav -->
      <div class="flex-1 lg:hidden"></div>

      <!-- User Actions & Hamburger -->
      <div class="flex items-center gap-2 shrink-0">
        <template v-if="!isLoggedIn">
          <router-link
            to="/login"
            class="h-9 px-5 rounded-full bg-[#1d1d1f] text-white text-[12px] xl:text-[13px] font-medium flex items-center gap-2 hover:bg-[#8a6d3d] transition-all shadow-md whitespace-nowrap"
          >
            <span class="material-symbols-outlined text-[16px]">lock</span>
            <span class="hidden sm:inline">Iniciar Sesión</span>
          </router-link>
        </template>

        <template v-else>
          <!-- Botón Volver Global -->
          <button
            v-if="route.path !== '/' && route.path !== '/workspace'"
            @click="router.back()"
            class="hidden md:flex h-9 px-3 mr-2 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#e5e5ea] transition-colors items-center gap-1.5 shadow-sm whitespace-nowrap"
            title="Volver atrás"
          >
            <span class="material-symbols-outlined text-[17px]">arrow_back</span>
            <span class="text-[13px] font-medium">Volver</span>
          </button>

          <!-- Mi Espacio / Nombre (Desktop solo si hay espacio, o comprimido) -->
          <router-link
            v-if="route.path !== '/workspace'"
            to="/workspace"
            class="hidden md:flex h-9 px-4 rounded-full bg-[#1d1d1f] text-white text-[12px] xl:text-[13px] font-medium items-center gap-1.5 hover:bg-[#8a6d3d] transition-all shadow-md whitespace-nowrap"
          >
            <span class="material-symbols-outlined text-[15px]">home</span>
            <span>Mi Espacio</span>
          </router-link>
          <div
            v-else
            class="hidden md:flex h-9 px-3 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] text-[12px] xl:text-[13px] font-semibold items-center gap-1.5 shadow-sm whitespace-nowrap max-w-[140px] truncate"
          >
            <img 
              v-if="currentProfile?.verification_photo || currentProfile?.avatar_url" 
              :src="currentProfile?.verification_photo || currentProfile?.avatar_url" 
              class="w-5 h-5 rounded-full object-cover shrink-0 border border-emerald-500" 
              alt="Avatar"
            />
            <span v-else class="w-5 h-5 rounded-full bg-[#b08d57] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {{ (currentProfile?.full_name || 'U').charAt(0) }}
            </span>
            <span class="truncate">{{ currentProfile?.full_name?.split(' ')[0] || 'Mi Espacio' }}</span>
          </div>

          <!-- Cerrar sesión (Desktop) -->
          <button
            @click="handleSignOut"
            class="hidden md:flex h-9 px-3.5 rounded-full bg-[#fcf2f2] text-[#8a2a2a] text-[12px] xl:text-[13px] font-medium items-center justify-center gap-1.5 hover:bg-[#fae6e6] transition-all whitespace-nowrap"
            title="Cerrar sesión"
          >
            <span class="material-symbols-outlined text-[17px]">logout</span>
            <span>Salir</span>
          </button>

          <!-- Hamburger Button (Mobile & Tablet) -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden h-10 w-10 flex items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Mobile Drawer Overlay -->
    <transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 top-[64px] z-40 lg:hidden" @click="closeMobileMenu">
        <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div class="absolute top-0 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-[#e5e5ea] shadow-xl p-6 flex flex-col gap-3 lg:gap-4" @click.stop>
          
          <!-- Perfil Móvil -->
          <div v-if="isLoggedIn" class="flex items-center gap-3 pb-4 border-b border-[#e5e5ea]">
            <img 
              v-if="currentProfile?.verification_photo || currentProfile?.avatar_url" 
              :src="currentProfile?.verification_photo || currentProfile?.avatar_url" 
              class="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-[#b08d57]/30" 
            />
            <div v-else class="w-12 h-12 rounded-full bg-[#1d1d1f] text-white text-xl font-medium flex items-center justify-center shrink-0">
              {{ (currentProfile?.full_name || 'U').charAt(0) }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-[#1d1d1f] truncate">{{ currentProfile?.full_name || 'Usuario' }}</span>
              <span class="text-xs text-secondary truncate">{{ currentProfile?.roles?.name || 'Cargando perfil...' }}</span>
            </div>
          </div>

          <!-- Links Móviles -->
          <nav v-if="isLoggedIn" class="flex flex-col gap-1">
            <router-link to="/workspace" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] active-class='bg-[#f5f5f7] text-[#8a6d3d] font-bold'">
              <span class="material-symbols-outlined text-[20px] text-secondary">home</span> Portal Corporativo
            </router-link>
            <router-link to="/mapa-cargos" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]">
              <span class="material-symbols-outlined text-[20px] text-secondary">account_tree</span> Estructura Corporativa
            </router-link>
            <router-link to="/oracle" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]">
              <span class="material-symbols-outlined text-[20px] text-primary">auto_awesome</span> Oráculo IA
            </router-link>
            <router-link v-if="isControlUser" to="/leader" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]">
              <span class="material-symbols-outlined text-[20px] text-secondary">dashboard</span> Centro de Control
            </router-link>
            <router-link v-if="canManageAccounts" to="/cuentas" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]">
              <span class="material-symbols-outlined text-[20px] text-secondary">key</span> Cuentas & Accesos
            </router-link>
            <router-link v-if="isMasterUser" to="/master" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold text-[#8a6d3d] bg-amber-50/50 hover:bg-amber-50">
              <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span> Auditoría Master
            </router-link>
          </nav>

          <!-- Cerrar sesión móvil -->
          <div v-if="isLoggedIn" class="pt-2">
            <button @click="handleSignOut" class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#fcf2f2] text-[#8a2a2a] font-semibold text-[15px] hover:bg-[#fae6e6] transition-colors">
              <span class="material-symbols-outlined text-[20px]">logout</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </transition>
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
const mobileMenuOpen = ref(false)

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
const isControlUser = computed(() => isMasterAdmin() || isManager())
const isMasterUser = computed(() => isMasterAdmin())
const canManageAccounts = computed(() => {
  if (!currentProfile.value) return false
  if (isMasterAdmin()) return true
  const roleName = currentProfile.value.roles?.name?.toLowerCase() || ''
  if (roleName.includes('auditor') || roleName.includes('auditoria') || roleName.includes('recursos humanos')) return true
  return !!currentProfile.value.roles?.can_manage_passwords
})

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
  closeMobileMenu()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-[#e5e5ea] sticky top-0 z-30 shadow-sm">
      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#005a9e] flex items-center justify-center text-white shadow-md">
            <span class="material-symbols-outlined text-[24px]">folder_open</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">Centro de Manuales & OneDrive</h1>
              <span class="px-2 py-0.5 bg-[#0078d4]/10 text-[#0078d4] text-[11px] font-bold rounded-full uppercase">Repositorio Oficial</span>
            </div>
            <p class="text-xs text-[#86868b]">Documentación operativa, protocolos y carpetas de Microsoft OneDrive por rol</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Abrir Outlook Webmail -->
          <a
            href="https://outlook.office.com/mail/"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm border border-blue-200 bg-blue-50/80 text-[#0078d4] hover:bg-blue-100 cursor-pointer"
            title="Abrir Correo Corporativo en Outlook Web"
          >
            <span class="material-symbols-outlined text-[18px]">mail</span>
            <span class="hidden md:inline">Abrir Correo</span>
          </a>

          <button
            v-if="canManage"
            @click="activeViewTab = activeViewTab === 'all' ? 'my' : 'all'"
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm border"
            :class="activeViewTab === 'all' ? 'bg-[#1d1d1f] text-white border-transparent' : 'bg-white text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'"
          >
            <span class="material-symbols-outlined text-[18px]">manage_search</span>
            <span>{{ activeViewTab === 'all' ? 'Ver Mis Manuales' : 'Gestionar Todos los Manuales' }}</span>
          </button>

          <button
            v-if="canManage"
            @click="showUploadModal = true"
            class="px-4 py-2 bg-gradient-to-r from-[#0078d4] to-[#005a9e] hover:brightness-105 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">add_link</span>
            <span>+ Vincular Manual / OneDrive</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
      
      <!-- Banner Informativo de Conexión con OneDrive & Correo -->
      <div class="bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-2xl border border-blue-200/80 p-5 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-[#0078d4] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span class="material-symbols-outlined text-2xl">cloud</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#1d1d1f]">Conexión Oficial con Microsoft OneDrive / SharePoint & Outlook</h3>
              <p class="text-xs text-[#555] mt-0.5 leading-relaxed max-w-2xl">
                Toda la documentación y manuales residen en el OneDrive institucional de <strong>Elite Nutrition</strong> y <strong>Futupro</strong>. Los colaboradores pueden consultarlos y solicitar la incorporación de nuevos formatos por correo.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-start md:self-center shrink-0">
            <span class="px-3 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-[#0078d4] shadow-sm flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#34c759]"></span> OneDrive Cloud Sync
            </span>
          </div>
        </div>

        <!-- Barra rápida para solicitar documentos al correo institucional -->
        <div class="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/70 backdrop-blur rounded-xl p-3 border border-blue-100">
          <div class="flex items-center gap-2 text-xs text-[#555]">
            <span class="material-symbols-outlined text-[18px] text-[#0078d4]">forward_to_inbox</span>
            <span>Para solicitar agregar o actualizar un manual o formato en la Biblioteca oficial, escribe a: <strong class="text-[#0078d4]">gestion@elitenutrition.com.co</strong></span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              href="mailto:gestion@elitenutrition.com.co?subject=%5BNOVA%20WORD%5D%20Solicitud%20de%20nuevo%20manual%20o%20documento%20para%20OneDrive&body=Hola%20Equipo%20de%20Gesti%C3%B3n%2C%0A%0ASolicito%20la%20incorporaci%C3%B3n%20del%20siguiente%20documento%20o%20formato%20en%20el%20Centro%20de%20Manuales%20%2F%20OneDrive%3A%0A%0A-%20Nombre%20del%20Documento%2FManual%3A%20%0A-%20Cargo%20%2F%20%C3%81rea%3A%20%0A-%20Enlace%20OneDrive%20o%20Archivo%20adjunto%3A%20%0A-%20Descripci%C3%B3n%20y%20Objetivo%3A%20%0A%0AGracias."
              class="px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] rounded-lg text-xs font-semibold transition-colors border border-[#e5e5ea] flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[15px] text-[#8a6d3d]">send</span>
              <span>Enviar Solicitud</span>
            </a>
            <a
              href="https://outlook.office.com/mail/"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[15px]">open_in_new</span>
              <span>Abrir Outlook</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-96">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-[20px]">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar manual por nombre o palabra clave..."
            class="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0078d4] shadow-sm transition-all"
          />
        </div>

        <div v-if="canManage && activeViewTab === 'all'" class="flex items-center gap-2 self-start sm:self-center">
          <span class="text-xs text-[#86868b] font-medium">Filtrar por Rol:</span>
          <select
            v-model="selectedRoleFilter"
            class="bg-white border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0078d4] shadow-sm cursor-pointer"
          >
            <option value="">Todos los Roles</option>
            <option v-for="r in availableRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
      </div>

      <!-- Listado de Manuales -->
      <div v-if="displayedManuals.length === 0" class="bg-white rounded-2xl border border-[#e5e5ea] p-12 text-center shadow-sm">
        <div class="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto text-[#86868b] mb-3">
          <span class="material-symbols-outlined text-3xl">description</span>
        </div>
        <h3 class="text-base font-bold text-[#1d1d1f]">No hay manuales disponibles</h3>
        <p class="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">
          {{ activeViewTab === 'my' ? 'Tu cargo no tiene manuales asignados actualmente.' : 'No hay manuales cargados en este filtro.' }}
        </p>
        <button v-if="canManage" @click="showUploadModal = true" class="mt-4 px-4 py-2 bg-[#0078d4] text-white text-xs font-semibold rounded-xl hover:bg-[#005a9e] transition-all">
          + Vincular Primer Manual
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="manual in displayedManuals"
          :key="manual.id"
          class="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
        >
          <div>
            <!-- Header de Tarjeta -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" :class="isOneDriveUrl(manual.content_url) ? 'bg-blue-50 text-[#0078d4]' : 'bg-amber-50 text-[#8a6d3d]'">
                <span class="material-symbols-outlined text-2xl">
                  {{ isOneDriveUrl(manual.content_url) ? 'cloud' : 'description' }}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span
                  class="px-2 py-0.5 text-[10px] font-bold rounded-md"
                  :class="isOneDriveUrl(manual.content_url) ? 'bg-blue-100 text-[#0078d4]' : 'bg-gray-100 text-gray-700'"
                >
                  {{ isOneDriveUrl(manual.content_url) ? 'OneDrive / SharePoint' : 'Documento Web' }}
                </span>
                <button
                  v-if="canManage"
                  @click="deleteManual(manual.id)"
                  class="p-1 text-red-400 hover:text-red-600 rounded"
                  title="Eliminar Manual"
                >
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>

            <!-- Título y Rol -->
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#8a6d3d] block mb-1">
              {{ manual.roles?.name || 'General' }}
            </span>
            <h3 class="text-base font-bold text-[#1d1d1f] group-hover:text-[#0078d4] transition-colors line-clamp-2 leading-snug">
              {{ manual.title }}
            </h3>
            <p class="text-xs text-[#86868b] mt-2 line-clamp-3 leading-relaxed">
              {{ manual.description || 'Documentación y manual de procedimientos oficial del cargo.' }}
            </p>
          </div>

          <!-- Pie de Tarjeta con Acción -->
          <div class="mt-5 pt-3.5 border-t border-[#e5e5ea] flex items-center justify-between gap-2">
            <span class="text-[11px] text-[#86868b]">
              Actualizado: {{ formatDate(manual.updated_at) }}
            </span>

            <a
              :href="manual.content_url"
              target="_blank"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              :class="isOneDriveUrl(manual.content_url) ? 'bg-[#0078d4] hover:bg-[#005a9e] text-white' : 'bg-[#1d1d1f] hover:bg-[#8a6d3d] text-white'"
            >
              <span>{{ isOneDriveUrl(manual.content_url) ? 'Abrir en OneDrive' : 'Abrir Manual' }}</span>
              <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL VINCULAR NUEVO MANUAL O CARPETA ONEDRIVE -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#e5e5ea]">
        <div class="p-5 bg-[#1d1d1f] text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#0078d4]">cloud_upload</span>
            <h3 class="text-base font-bold">Vincular Manual o Carpeta OneDrive</h3>
          </div>
          <button @click="showUploadModal = false" class="text-white/70 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="uploadManual" class="p-5 space-y-4">
          
          <!-- Guía rápida para OneDrive -->
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#005a9e] flex items-start gap-2.5">
            <span class="material-symbols-outlined text-lg shrink-0 mt-0.5">info</span>
            <div>
              <p class="font-bold">¿Cómo conectar tu OneDrive?</p>
              <p class="mt-0.5 text-[11px] leading-relaxed">
                En tu OneDrive institucional, haz clic derecho sobre el archivo o carpeta del cargo -> <strong>Compartir</strong> -> <strong>Copiar vínculo</strong> y pégalo abajo. Los colaboradores accederán al documento en tiempo real.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Título del Manual o Carpeta *</label>
            <input
              v-model="newManual.title"
              type="text"
              required
              placeholder="Ej: Manual de Funciones - Analista de Inventarios"
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0078d4]"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Cargo Destino *</label>
            <select
              v-model="newManual.role_id"
              required
              class="w-full px-3 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0078d4]"
            >
              <option value="" disabled>Selecciona el cargo que consulta este manual...</option>
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">URL de OneDrive / SharePoint / Enlace Externo *</label>
            <input
              v-model="newManual.content_url"
              type="url"
              required
              placeholder="https://elitenutrition-my.sharepoint.com/... o https://1drv.ms/..."
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0078d4]"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Descripción Breve</label>
            <textarea
              v-model="newManual.description"
              rows="3"
              placeholder="Describe los procedimientos, protocolos o actas que contiene este documento..."
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0078d4]"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#e5e5ea]">
            <button
              type="button"
              @click="showUploadModal = false"
              class="px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isUploading"
              class="px-5 py-2 bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              {{ isUploading ? 'Vinculando...' : 'Publicar y Notificar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/api/supabase'

const activeViewTab = ref('my') // 'my' | 'all'
const searchQuery = ref('')
const selectedRoleFilter = ref('')

const myManuals = ref([])
const allManuals = ref([])
const availableRoles = ref([])
const currentUser = ref(null)
const canManage = ref(false)

const showUploadModal = ref(false)
const isUploading = ref(false)
const newManual = ref({ title: '', description: '', role_id: '', content_url: '' })

const isOneDriveUrl = (url) => {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('sharepoint.com') || lower.includes('1drv.ms') || lower.includes('onedrive.live.com') || lower.includes('office.com')
}

const fetchData = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  const userId = session.user.id

  const { data: profile } = await supabase.from('profiles').select('*, roles(*)').eq('id', userId).single()
  currentUser.value = profile

  const userAccessLevel = profile?.roles?.access_level
  if (profile?.is_master_admin || [1, 2].includes(userAccessLevel)) {
    canManage.value = true
    const { data: roles } = await supabase.from('roles').select('*').order('name')
    availableRoles.value = roles || []

    const { data: all } = await supabase.from('manuals').select('*, roles(name)').order('title')
    allManuals.value = all || []
  }

  if (profile?.role_id) {
    const { data: manuals } = await supabase.from('manuals').select('*, roles(name)').eq('role_id', profile.role_id)
    myManuals.value = manuals || []
  }
}

const displayedManuals = computed(() => {
  let list = activeViewTab.value === 'all' && canManage.value ? allManuals.value : myManuals.value

  if (selectedRoleFilter.value) {
    list = list.filter(m => m.role_id === selectedRoleFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    )
  }

  return list
})

const uploadManual = async () => {
  if (!newManual.value.title || !newManual.value.content_url || !newManual.value.role_id) return
  isUploading.value = true

  try {
    const payload = {
      ...newManual.value,
      created_by: currentUser.value.id
    }
    const { data: manual, error } = await supabase.from('manuals').insert([payload]).select('*, roles(name)').single()
    if (error) throw error

    if (manual) {
      allManuals.value.unshift(manual)
      if (manual.role_id === currentUser.value.role_id) {
        myManuals.value.unshift(manual)
      }
    }

    // Notificaciones
    const { data: usersToNotify } = await supabase.from('profiles').select('id').eq('role_id', newManual.value.role_id)
    if (usersToNotify && usersToNotify.length > 0) {
      const notifsToInsert = usersToNotify.map(u => ({
        profile_id: u.id,
        type: 'manual_update',
        message: `Se ha publicado un nuevo manual en OneDrive: ${newManual.value.title}`,
        action_url: '/manuals'
      }))
      await supabase.from('notifications').insert(notifsToInsert)
    }

    showUploadModal.value = false
    newManual.value = { title: '', description: '', role_id: '', content_url: '' }
  } catch (error) {
    console.error('Error al subir manual:', error)
    alert('Error al publicar el manual.')
  } finally {
    isUploading.value = false
  }
}

const deleteManual = async (manualId) => {
  if (!confirm('¿Estás seguro de eliminar este manual?')) return
  allManuals.value = allManuals.value.filter(m => m.id !== manualId)
  myManuals.value = myManuals.value.filter(m => m.id !== manualId)
  try {
    await supabase.from('manuals').delete().eq('id', manualId)
  } catch {}
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Reciente'
  return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchData()
})
</script>

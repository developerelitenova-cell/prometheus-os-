<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col">
    <!-- Header de la Academia -->
    <header class="bg-white border-b border-[#e5e5ea] sticky top-0 z-30 shadow-sm">
      <div class="max-w-[1500px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4b06a] to-[#8a6d3d] flex items-center justify-center text-white shadow-md">
            <span class="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">Escuela & Academia NOVA WORK</h1>
              <span class="px-2 py-0.5 bg-[#8a6d3d]/10 text-[#8a6d3d] text-[11px] font-bold rounded-full uppercase">Formación Continua</span>
            </div>
            <p class="text-xs text-[#86868b]">Videos de inducción, tutoriales operativos y guías por cargo para Elite Nutrition & Futupro</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Botón de Gestionar Encargados (solo Super Admin) -->
          <button
            v-if="isMasterAdmin"
            @click="openManagersModal"
            class="px-3.5 py-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea] text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Asignar colaboradores que pueden subir y editar videos"
          >
            <span class="material-symbols-outlined text-[18px] text-[#8a6d3d]">admin_panel_settings</span>
            <span class="hidden sm:inline">Encargados</span>
          </button>

          <!-- Botón de Ver Progreso del Equipo (solo líderes y encargados) -->
          <button
            v-if="canManage"
            @click="activeTab = activeTab === 'team' ? 'videos' : 'team'"
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm border"
            :class="activeTab === 'team' ? 'bg-[#1d1d1f] text-white border-transparent' : 'bg-white text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'"
          >
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>{{ activeTab === 'team' ? 'Ver Catálogo de Videos' : 'Progreso del Equipo' }}</span>
          </button>

          <!-- Botón Agregar Video (solo encargados y admin) -->
          <button
            v-if="canManage"
            @click="openAddVideoModal"
            class="px-4 py-2 bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Agregar Video</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-[1500px] w-full mx-auto px-4 py-6 sm:px-6">
      
      <!-- VISTA 1: CATÁLOGO DE VIDEOS PARA EL EMPLEADO -->
      <div v-if="activeTab === 'videos'" class="space-y-6">
        
        <!-- Tarjeta de Progreso Personal del Empleado -->
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f7" stroke-width="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#8a6d3d" stroke-width="8" stroke-linecap="round"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * userProgressPercentage) / 100"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <span class="absolute text-sm font-bold text-[#1d1d1f]">{{ userProgressPercentage }}%</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-[#1d1d1f]">Mi Progreso en la Academia</h3>
                <span v-if="userProgressPercentage === 100" class="px-2 py-0.5 bg-[#34c759]/10 text-[#34c759] text-[10px] font-bold rounded-full">¡Al día!</span>
              </div>
              <p class="text-xs text-[#86868b] mt-0.5">
                Has completado <strong class="text-[#1d1d1f]">{{ completedVideosCount }}</strong> de <strong class="text-[#1d1d1f]">{{ userAssignedVideos.length }}</strong> videos obligatorios de tu cargo.
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs">
                <span class="text-[#86868b]">Cargo actual: <strong class="text-[#8a6d3d]">{{ currentProfile?.roles?.name || 'General' }}</strong></span>
                <span class="text-[#86868b]">Área: <strong class="text-[#1d1d1f]">{{ currentProfile?.areas?.name || 'General' }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Filtros de Navegación Rápida -->
          <div class="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <button
              @click="filterType = 'assigned'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              :class="filterType === 'assigned' ? 'bg-[#8a6d3d] text-white border-transparent' : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-[#e5e5ea]'"
            >
              Mis Videos Asignados ({{ userAssignedVideos.length }})
            </button>
            <button
              @click="filterType = 'all'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              :class="filterType === 'all' ? 'bg-[#8a6d3d] text-white border-transparent' : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-[#e5e5ea]'"
            >
              Todos los Videos ({{ allVideos.length }})
            </button>
            <button
              @click="filterType = 'completed'"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              :class="filterType === 'completed' ? 'bg-[#8a6d3d] text-white border-transparent' : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-[#e5e5ea]'"
            >
              Completados ({{ completedVideosCount }})
            </button>
          </div>
        </div>

        <!-- Barra de Búsqueda y Selector de Categoría -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="relative w-full sm:w-96">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-[20px]">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por título, función o tema..."
              class="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d] shadow-sm transition-all"
            />
          </div>
          <div class="flex items-center gap-2 self-start sm:self-center">
            <span class="text-xs text-[#86868b] font-medium">Filtrar por Área:</span>
            <select
              v-model="selectedAreaFilter"
              class="bg-white border border-[#e5e5ea] rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#8a6d3d] shadow-sm cursor-pointer"
            >
              <option value="">Todas las Áreas</option>
              <option v-for="area in availableAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
            </select>
          </div>
        </div>

        <!-- Grid de Tarjetas de Video -->
        <div v-if="filteredVideos.length === 0" class="bg-white rounded-2xl border border-[#e5e5ea] p-12 text-center shadow-sm">
          <div class="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto text-[#86868b] mb-3">
            <span class="material-symbols-outlined text-3xl">smart_display</span>
          </div>
          <h3 class="text-base font-bold text-[#1d1d1f]">No se encontraron videos</h3>
          <p class="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">No hay videos disponibles bajo este filtro o todavía no se han asignado a este cargo.</p>
          <button v-if="canManage" @click="openAddVideoModal" class="mt-4 px-4 py-2 bg-[#8a6d3d] text-white text-xs font-semibold rounded-xl hover:bg-[#b08d57] transition-all">
            + Agregar Primer Video
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="video in filteredVideos"
            :key="video.id"
            class="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
          >
            <!-- Miniatura / Reproductor Preview -->
            <div class="relative w-full aspect-video bg-[#1d1d1f] overflow-hidden cursor-pointer" @click="playVideo(video)">
              <img
                v-if="video.thumbnail_url"
                :src="video.thumbnail_url"
                :alt="video.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#141416] via-[#201f1c] to-[#141416] p-5 text-center relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-28 h-28 bg-[#8a6d3d]/20 rounded-full blur-xl pointer-events-none"></div>
                <div class="w-12 h-12 rounded-2xl bg-white/5 border border-[#8a6d3d]/30 flex items-center justify-center mb-2 shadow-inner">
                  <span class="material-symbols-outlined text-[#d4b06a] text-2xl">school</span>
                </div>
                <span class="text-xs font-bold text-white line-clamp-2 px-3 leading-snug">{{ video.title }}</span>
                <span class="text-[10px] text-[#d4b06a] font-bold tracking-wider uppercase mt-1">NOVA WORK</span>
              </div>

              <!-- Overlay Botón Play -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-[#8a6d3d] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-2xl">play_arrow</span>
                </div>
              </div>

              <!-- Insignias Superiores -->
              <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                <span v-if="video.is_mandatory" class="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md shadow uppercase tracking-wider">
                  Obligatorio
                </span>
                <span v-if="isVideoCompleted(video.id)" class="px-2 py-0.5 bg-[#34c759] text-white text-[10px] font-bold rounded-md shadow flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">check_circle</span> Completado
                </span>
                <span v-if="isDirectVideo(video.video_url)" class="px-1.5 py-0.5 bg-blue-600/90 text-white text-[9px] font-bold rounded shadow uppercase tracking-wider">
                  MP4 Directo
                </span>
                <span v-else-if="video.video_url?.includes('onedrive') || video.video_url?.includes('sharepoint')" class="px-1.5 py-0.5 bg-[#0078d4] text-white text-[9px] font-bold rounded shadow uppercase tracking-wider">
                  OneDrive
                </span>
              </div>

              <!-- Duración -->
              <span v-if="video.duration_minutes" class="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 text-white text-[11px] font-medium rounded backdrop-blur-sm">
                {{ video.duration_minutes }} min
              </span>
            </div>

            <!-- Contenido de la Tarjeta -->
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-[11px] font-semibold text-[#8a6d3d] uppercase tracking-wider">
                    {{ video.roles?.name || (video.areas?.name ? `Área: ${video.areas.name}` : 'General (Toda la Empresa)') }}
                  </span>
                </div>
                <h4 class="text-base font-bold text-[#1d1d1f] line-clamp-2 leading-snug group-hover:text-[#8a6d3d] transition-colors">
                  {{ video.title }}
                </h4>
                <p class="text-xs text-[#86868b] mt-1.5 line-clamp-2 leading-relaxed">
                  {{ video.description || 'Sin descripción detallada.' }}
                </p>
              </div>

              <!-- Barra de Progreso Individual y Botón -->
              <div class="mt-4 pt-3 border-t border-[#e5e5ea] flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]" :class="isVideoCompleted(video.id) ? 'text-[#34c759]' : 'text-[#86868b]'">
                    {{ isVideoCompleted(video.id) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  <span class="text-xs font-semibold" :class="isVideoCompleted(video.id) ? 'text-[#34c759]' : 'text-[#86868b]'">
                    {{ isVideoCompleted(video.id) ? 'Visto' : 'Pendiente' }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    @click="playVideo(video)"
                    class="px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#8a6d3d] hover:text-white text-[#1d1d1f] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Ver Video</span>
                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>

                  <button
                    v-if="canManage"
                    @click="openEditVideoModal(video)"
                    class="p-1.5 text-[#8a6d3d] hover:bg-[#8a6d3d]/10 rounded-lg transition-colors cursor-pointer"
                    title="Editar Video y Audiencia"
                  >
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                  </button>

                  <button
                    v-if="canManage"
                    @click="deleteVideo(video.id)"
                    class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar Video"
                  >
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA 2: TABLERO DE SEGUIMIENTO PARA LÍDERES (PROGRESO DEL EQUIPO) -->
      <div v-else class="space-y-6">
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="text-lg font-bold text-[#1d1d1f]">Seguimiento de Capacitación del Equipo</h2>
              <p class="text-xs text-[#86868b] mt-0.5">Audita el progreso de cada colaborador en la visualización de videos obligatorios y formativos.</p>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-[#86868b]">Total Empleados Evaluados:</span>
              <span class="px-2.5 py-1 bg-[#8a6d3d]/10 text-[#8a6d3d] text-xs font-bold rounded-lg">{{ teamMembers.length }}</span>
            </div>
          </div>

          <!-- Tabla de Empleados y Avance -->
          <div class="overflow-x-auto border border-[#e5e5ea] rounded-xl">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#f5f5f7] text-[#86868b] font-semibold border-b border-[#e5e5ea]">
                <tr>
                  <th class="py-3 px-4">Colaborador</th>
                  <th class="py-3 px-4">Cargo / Área</th>
                  <th class="py-3 px-4">Empresa</th>
                  <th class="py-3 px-4 text-center">Videos Asignados</th>
                  <th class="py-3 px-4 text-center">Completados</th>
                  <th class="py-3 px-4 text-center">Cumplimiento</th>
                  <th class="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#e5e5ea]">
                <tr v-if="teamMembers.length === 0">
                  <td colspan="7" class="py-8 text-center text-[#86868b]">
                    No se encontraron colaboradores en tu área asignada.
                  </td>
                </tr>
                <tr v-for="member in teamMembers" :key="member.id" class="hover:bg-[#f5f5f7]/50 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {{ getInitials(member.full_name) }}
                      </div>
                      <div>
                        <span class="font-bold text-[#1d1d1f] block">{{ member.full_name }}</span>
                        <span class="text-[11px] text-[#86868b]">{{ member.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="font-medium text-[#1d1d1f] block">{{ member.roles?.name || 'Sin Rol' }}</span>
                    <span class="text-[11px] text-[#86868b]">{{ member.areas?.name || 'General' }}</span>
                  </td>
                  <td class="py-3.5 px-4 font-semibold text-[#8a6d3d]">
                    {{ member.company || 'Elite Nutrition' }}
                  </td>
                  <td class="py-3.5 px-4 text-center font-bold text-[#1d1d1f]">
                    {{ getMemberTotalVideos(member) }}
                  </td>
                  <td class="py-3.5 px-4 text-center font-bold text-[#34c759]">
                    {{ getMemberCompletedVideos(member.id) }}
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <div class="inline-flex items-center gap-2">
                      <div class="w-16 h-2 bg-[#e5e5ea] rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="getMemberPercentage(member) >= 100 ? 'bg-[#34c759]' : (getMemberPercentage(member) >= 50 ? 'bg-amber-500' : 'bg-red-500')"
                          :style="{ width: `${getMemberPercentage(member)}%` }"
                        ></div>
                      </div>
                      <span class="font-bold text-xs" :class="getMemberPercentage(member) >= 100 ? 'text-[#34c759]' : (getMemberPercentage(member) >= 50 ? 'text-amber-600' : 'text-red-500')">
                        {{ getMemberPercentage(member) }}%
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      @click="viewMemberDetail(member)"
                      class="px-3 py-1 bg-white border border-[#e5e5ea] hover:border-[#8a6d3d] hover:text-[#8a6d3d] rounded-lg text-xs font-semibold transition-colors"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>

    <!-- MODAL REPRODUCTOR DE VIDEO -->
    <div v-if="activeVideoPlaying" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-[#e5e5ea] flex flex-col max-h-[90vh]">
        <!-- Cabecera del Reproductor -->
        <div class="p-4 bg-[#1d1d1f] text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8a6d3d]">play_circle</span>
            <h3 class="text-sm sm:text-base font-bold line-clamp-1">{{ activeVideoPlaying.title }}</h3>
          </div>
          <button @click="closeVideoModal" class="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Cuerpo del Video -->
        <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          
          <!-- 1. CASO ESPECIAL: Microsoft Stream / SharePoint Corporativo -->
          <div
            v-if="isSharePointOrStream(activeVideoPlaying.video_url)"
            class="w-full h-full p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#0c1427] via-[#0f172a] to-[#1e1b4b] text-white relative overflow-hidden"
          >
            <!-- Portada de fondo con desenfoque elegante si existe -->
            <div
              v-if="activeVideoPlaying.thumbnail_url"
              class="absolute inset-0 opacity-25 bg-center bg-cover filter blur-xl scale-110 pointer-events-none"
              :style="{ backgroundImage: `url(${activeVideoPlaying.thumbnail_url})` }"
            ></div>

            <div class="relative z-10 max-w-lg flex flex-col items-center">
              <!-- Insignia Corporativa Stream -->
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078d4]/20 border border-[#0078d4]/40 text-[#60a5fa] text-xs font-semibold mb-3 backdrop-blur-sm">
                <span class="material-symbols-outlined text-sm">cloud</span>
                <span>Microsoft Stream & SharePoint Corporativo</span>
              </div>

              <!-- Título del Video -->
              <h4 class="text-lg sm:text-2xl font-bold tracking-tight mb-2 text-white">
                {{ activeVideoPlaying.title }}
              </h4>

              <!-- Explicación amigable -->
              <p class="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed max-w-md">
                Este video está protegido bajo la infraestructura corporativa de Microsoft 365 (Futupro / Elite Nutrition). Por directivas de seguridad de Microsoft (<code class="text-[11px] bg-black/40 px-1 py-0.5 rounded text-blue-300">frame-ancestors</code>), se reproduce directamente con tu cuenta institucional.
              </p>

              <!-- Botones de Acción Principal -->
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a
                  :href="activeVideoPlaying.video_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full sm:w-auto px-6 py-3 bg-[#0078d4] hover:bg-[#106ebe] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                  <span>Abrir y Reproducir en Stream</span>
                  <span class="material-symbols-outlined text-[15px] text-white/70">open_in_new</span>
                </a>

                <button
                  type="button"
                  @click="toggleVideoCompletion(activeVideoPlaying.id)"
                  class="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px]" :class="isVideoCompleted(activeVideoPlaying.id) ? 'text-[#34c759]' : 'text-gray-300'">
                    {{ isVideoCompleted(activeVideoPlaying.id) ? 'check_circle' : 'task_alt' }}
                  </span>
                  <span>{{ isVideoCompleted(activeVideoPlaying.id) ? 'Completado ✓' : 'Marcar como Visto' }}</span>
                </button>
              </div>

              <!-- Tip para encargados y administradores -->
              <div v-if="canManage" class="mt-6 pt-4 border-t border-white/10 text-[11px] text-gray-400 flex items-center gap-2 text-left">
                <span class="material-symbols-outlined text-amber-400 text-sm shrink-0">lightbulb</span>
                <span>
                  Tip: Para reproducirlo directo dentro de NOVA WORK sin salir, descarga el archivo <strong>.mp4</strong> desde SharePoint y cárgalo en <strong>Editar Video</strong>.
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Embebido Iframe Directo (YouTube, Vimeo, Loom, Google Drive) -->
          <iframe
            v-else-if="getEmbedUrl(activeVideoPlaying.video_url)"
            :src="getEmbedUrl(activeVideoPlaying.video_url)"
            class="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowfullscreen
          ></iframe>

          <!-- 3. Enlace Directo HTML5 (MP4 / WebM / QuickTime en Supabase o Servidor) -->
          <div v-else-if="isDirectVideo(activeVideoPlaying.video_url)" class="relative w-full h-full flex items-center justify-center bg-black">
            <video
              :key="activeVideoPlaying.video_url"
              :src="activeVideoPlaying.video_url"
              controls
              autoplay
              playsinline
              preload="metadata"
              class="w-full h-full object-contain"
              @ended="handleVideoEnded(activeVideoPlaying.id)"
            >
              <source :src="activeVideoPlaying.video_url" type="video/mp4" />
              <source :src="activeVideoPlaying.video_url" type="video/webm" />
              Tu navegador no soporta la reproducción directa de video HTML5 en MP4.
            </video>
            <span class="absolute top-3 right-3 px-2 py-0.5 bg-black/70 text-blue-400 text-[10px] font-bold rounded backdrop-blur border border-blue-400/30 pointer-events-none">
              REPRODUCTOR MP4 NATIVO
            </span>
          </div>

          <!-- 4. Fallback si el enlace no es integrable -->
          <div v-else class="p-8 text-center text-white flex flex-col items-center">
            <span class="material-symbols-outlined text-5xl text-[#8a6d3d] mb-3">play_circle</span>
            <h4 class="text-lg font-bold">{{ activeVideoPlaying.title }}</h4>
            <p class="text-xs text-white/70 mt-1 max-w-md">Para reproducir este video, pulsa el botón a continuación:</p>
            <a
              :href="activeVideoPlaying.video_url"
              target="_blank"
              class="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white font-bold text-xs rounded-xl shadow hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Abrir Video</span>
              <span class="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>

        <!-- Pie de Información y Botón Completar -->
        <div class="p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e5e5ea]">
          <div class="max-w-md">
            <span class="text-xs font-bold text-[#8a6d3d] uppercase tracking-wider block">
              {{ activeVideoPlaying.roles?.name || (activeVideoPlaying.areas?.name ? `Área: ${activeVideoPlaying.areas.name}` : 'General (Toda la Empresa)') }}
            </span>
            <p class="text-xs text-[#86868b] mt-0.5 line-clamp-2">{{ activeVideoPlaying.description || 'Sin notas adicionales.' }}</p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <!-- Botón opcional para abrir en ventana externa si Microsoft pide login -->
            <a
              v-if="activeVideoPlaying.video_url?.includes('sharepoint') || activeVideoPlaying.video_url?.includes('onedrive')"
              :href="activeVideoPlaying.video_url"
              target="_blank"
              class="px-3.5 py-2 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-xl flex items-center gap-1.5 transition-colors border border-[#e5e5ea]"
              title="Abrir en Microsoft Stream si tu navegador bloquea la sesión"
            >
              <span class="material-symbols-outlined text-[15px]">open_in_new</span>
              <span class="hidden sm:inline">Ver en Stream</span>
            </a>

            <button
              @click="toggleVideoCompletion(activeVideoPlaying.id)"
              class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              :class="isVideoCompleted(activeVideoPlaying.id) ? 'bg-[#34c759] text-white hover:bg-[#2db24f]' : 'bg-[#1d1d1f] text-white hover:bg-[#8a6d3d]'"
            >
              <span class="material-symbols-outlined text-[18px]">
                {{ isVideoCompleted(activeVideoPlaying.id) ? 'check_circle' : 'task_alt' }}
              </span>
              <span>{{ isVideoCompleted(activeVideoPlaying.id) ? 'Completado ✓' : 'Marcar como Visto' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL AGREGAR / EDITAR VIDEO (OPERADORES Y LÍDERES) -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#e5e5ea] flex flex-col max-h-[92vh]">
        <div class="p-5 bg-[#1d1d1f] text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8a6d3d]">{{ editingVideoId ? 'edit_square' : 'video_call' }}</span>
            <h3 class="text-base font-bold">{{ editingVideoId ? 'Editar Video & Audiencia' : 'Agregar Video a la Academia' }}</h3>
          </div>
          <button @click="showAddModal = false" class="text-white/70 hover:text-white cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="saveNewVideo" class="p-5 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Título del Video *</label>
            <input
              v-model="newVideo.title"
              type="text"
              required
              placeholder="Ej: Inducción a Conteo Físico en Bodega"
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            />
          </div>

          <!-- Selector de Modo: Enlace vs Subir Archivo MP4 -->
          <div class="flex items-center gap-2 bg-[#f5f5f7] p-1 rounded-xl border border-[#e5e5ea]">
            <button
              type="button"
              @click="videoInputMode = 'link'"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              :class="videoInputMode === 'link' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'"
            >
              <span class="material-symbols-outlined text-[16px]">link</span>
              <span>Enlace / URL</span>
            </button>
            <button
              type="button"
              @click="videoInputMode = 'file'"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              :class="videoInputMode === 'file' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'"
            >
              <span class="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Subir Archivo .MP4</span>
            </button>
          </div>

          <!-- Modo 1: URL -->
          <div v-if="videoInputMode === 'link'">
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">URL del Video (MP4 directo, YouTube, OneDrive o Vimeo) *</label>
            <input
              v-model="newVideo.video_url"
              type="url"
              :required="videoInputMode === 'link' && !editingVideoId"
              placeholder="https://.../video.mp4 o enlace de YouTube/OneDrive"
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            />
            <p class="text-[10px] text-[#86868b] mt-1">
              Admite enlaces directos a archivos <strong>.mp4</strong>, <strong>.webm</strong>, YouTube o Microsoft OneDrive / SharePoint.
            </p>
            <div v-if="newVideo.video_url && isSharePointOrStream(newVideo.video_url)" class="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-[#0078d4]">
              <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
              <div>
                <strong>Video de Microsoft SharePoint / Stream detectado:</strong>
                Por directivas de seguridad corporativa de Microsoft (<code class="text-[11px] bg-blue-100 px-1 py-0.2 rounded font-mono">frame-ancestors 'none'</code>), se abrirá directamente con la cuenta corporativa activa del usuario. Si deseas que se reproduzca dentro de NOVA WORK, te recomendamos cambiar arriba a <strong>"Subir Archivo .MP4"</strong> y subir el archivo descargado.
              </div>
            </div>
          </div>

          <!-- Modo 2: Subir archivo MP4 -->
          <div v-else class="space-y-2">
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
              Archivo de Video .MP4 {{ editingVideoId ? '(Opcional si conservas el anterior)' : '*' }}
            </label>
            <div
              class="border-2 border-dashed border-[#e5e5ea] hover:border-[#8a6d3d] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-[#fbfbfd]"
              @click="$refs.videoFileInput?.click()"
            >
              <input
                ref="videoFileInput"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                class="hidden"
                @change="handleVideoFileSelect"
              />
              <div v-if="!selectedVideoFile" class="py-2 flex flex-col items-center">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#0078d4] flex items-center justify-center mb-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-2xl">movie</span>
                </div>
                <p class="text-xs font-bold text-[#1d1d1f]">
                  {{ editingVideoId ? 'Haz clic para reemplazar por un nuevo .MP4' : 'Haz clic para seleccionar tu video .MP4' }}
                </p>
                <p class="text-[11px] text-[#86868b] mt-0.5">Formatos compatibles: .mp4, .webm, .mov (Hasta 500MB)</p>
              </div>
              <div v-else class="py-2 flex items-center justify-between px-3 bg-white rounded-xl border border-[#e5e5ea]">
                <div class="flex items-center gap-2.5 truncate">
                  <span class="material-symbols-outlined text-[#34c759]">check_circle</span>
                  <div class="text-left truncate">
                    <p class="text-xs font-bold text-[#1d1d1f] truncate">{{ selectedVideoFile.name }}</p>
                    <p class="text-[10px] text-[#86868b]">{{ formatBytes(selectedVideoFile.size) }}</p>
                  </div>
                </div>
                <button type="button" @click.stop="removeSelectedVideoFile" class="text-red-500 hover:text-red-700 text-xs font-bold">Cambiar</button>
              </div>
            </div>
            <p v-if="uploadProgressMsg" class="text-xs font-bold text-[#8a6d3d] flex items-center gap-1.5 animate-pulse">
              <span class="material-symbols-outlined text-base animate-spin">sync</span>
              <span>{{ uploadProgressMsg }}</span>
            </p>
          </div>

          <!-- SECCIÓN: PORTADA / MINIATURA DEL VIDEO -->
          <div class="p-4 bg-[#fbfbfd] border border-[#e5e5ea] rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#8a6d3d] text-[18px]">image</span>
                <label class="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">Portada del Video</label>
              </div>
              <span v-if="newVideo.thumbnail_url" class="text-[11px] text-[#34c759] font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">check_circle</span> Con Portada
              </span>
              <span v-else class="text-[11px] text-[#86868b]">Genera o sube una portada</span>
            </div>

            <!-- Preview 16:9 de la portada -->
            <div class="relative w-full aspect-video bg-[#141416] rounded-xl overflow-hidden border border-[#e5e5ea] shadow-inner flex items-center justify-center">
              <img
                v-if="newVideo.thumbnail_url"
                :src="newVideo.thumbnail_url"
                alt="Vista previa de portada"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-center p-4">
                <span class="material-symbols-outlined text-white/30 text-4xl mb-1">wallpaper</span>
                <p class="text-xs font-semibold text-white/70">Sin portada asignada</p>
                <p class="text-[10px] text-white/40 mt-0.5">Puedes generarla con el título en 1 clic o subir un archivo</p>
              </div>

              <!-- Botón quitar portada si ya existe -->
              <button
                v-if="newVideo.thumbnail_url"
                type="button"
                @click="newVideo.thumbnail_url = ''"
                class="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer shadow"
                title="Quitar portada"
              >
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <!-- Botones de Acción de Portada -->
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="generateAutoThumbnail()"
                :disabled="generatingThumbnail"
                class="py-2 px-3 bg-gradient-to-r from-[#8a6d3d] to-[#d4b06a] hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span class="material-symbols-outlined text-[16px]">auto_fix_high</span>
                <span>{{ generatingThumbnail ? 'Diseñando...' : '🎨 Generar Portada' }}</span>
              </button>

              <button
                type="button"
                @click="$refs.thumbnailFileInput?.click()"
                class="py-2 px-3 bg-white border border-[#e5e5ea] hover:border-[#8a6d3d] hover:text-[#8a6d3d] text-[#1d1d1f] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Subir Imagen</span>
              </button>
              <input
                ref="thumbnailFileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                class="hidden"
                @change="handleThumbnailFileSelect"
              />
            </div>

            <!-- Presets de estilo de portada -->
            <div>
              <p class="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5">Estilos de Portada Rápida:</p>
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  v-for="preset in thumbnailPresets"
                  :key="preset.id"
                  type="button"
                  @click="generateAutoThumbnail(preset)"
                  class="px-2.5 py-1 bg-white hover:bg-[#8a6d3d]/10 border border-[#e5e5ea] hover:border-[#8a6d3d] rounded-lg text-[10px] font-semibold text-[#1d1d1f] whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>{{ preset.emoji }}</span>
                  <span>{{ preset.name }}</span>
                </button>
              </div>
            </div>

            <!-- Campo URL opcional -->
            <input
              v-model="newVideo.thumbnail_url"
              type="url"
              placeholder="O pega directamente una URL de imagen..."
              class="w-full px-3 py-1.5 bg-white border border-[#e5e5ea] rounded-lg text-[11px] text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Área Destino (Audiencia)</label>
              <select
                v-model="newVideo.area_id"
                class="w-full px-3 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
              >
                <option value="">Toda la Empresa</option>
                <option v-for="area in availableAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Cargo Específico</label>
              <select
                v-model="newVideo.role_id"
                class="w-full px-3 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
              >
                <option value="">Todos los Cargos</option>
                <option v-for="role in availableRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Duración (Minutos)</label>
              <input
                v-model.number="newVideo.duration_minutes"
                type="number"
                min="1"
                placeholder="10"
                class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
              />
            </div>
            
            <div class="flex items-center pt-5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="newVideo.is_mandatory" type="checkbox" class="w-4 h-4 text-[#8a6d3d] rounded" />
                <span class="text-xs font-bold text-[#1d1d1f]">¿Es Obligatorio?</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Descripción / Objetivos de Aprendizaje</label>
            <textarea
              v-model="newVideo.description"
              rows="2"
              placeholder="Explica qué aprenderá el colaborador en este video..."
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#e5e5ea]">
            <button
              type="button"
              @click="showAddModal = false"
              class="px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingVideo"
              class="px-5 py-2 bg-[#8a6d3d] hover:bg-[#b08d57] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {{ savingVideo ? 'Guardando...' : (editingVideoId ? 'Guardar Cambios' : 'Guardar y Publicar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL GESTIONAR ENCARGADOS DE LA ACADEMIA (SOLO SUPER ADMIN) -->
    <div v-if="showManagersModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#e5e5ea] flex flex-col max-h-[85vh]">
        <div class="p-5 bg-[#1d1d1f] text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8a6d3d]">admin_panel_settings</span>
            <div>
              <h3 class="text-base font-bold">Encargados de la Escuela</h3>
              <p class="text-xs text-white/70">Otorga el rol para subir videos y definir la audiencia</p>
            </div>
          </div>
          <button @click="showManagersModal = false" class="text-white/70 hover:text-white cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Buscador de colaboradores -->
        <div class="p-4 border-b border-[#e5e5ea] bg-[#fbfbfd]">
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] text-[18px]">search</span>
            <input
              v-model="managerSearchQuery"
              type="text"
              placeholder="Buscar colaborador por nombre o cargo..."
              class="w-full pl-9 pr-3 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            />
          </div>
        </div>

        <!-- Lista de colaboradores -->
        <div class="p-4 space-y-2.5 overflow-y-auto flex-1">
          <div v-if="filteredManagersList.length === 0" class="text-center py-8 text-xs text-[#86868b]">
            No se encontraron colaboradores.
          </div>
          <div
            v-for="user in filteredManagersList"
            :key="user.id"
            class="flex items-center justify-between p-3 rounded-xl border border-[#e5e5ea] hover:bg-[#f9f9fb] transition-colors gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#8a6d3d] to-[#d4b06a] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {{ user.full_name?.charAt(0) || 'U' }}
              </div>
              <div class="min-w-0">
                <p class="text-xs sm:text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5 truncate">
                  <span class="truncate">{{ user.full_name }}</span>
                  <span v-if="user.is_master_admin" class="px-1.5 py-0.2 bg-[#8a6d3d]/10 text-[#8a6d3d] text-[9px] font-bold rounded shrink-0">Master Admin</span>
                </p>
                <p class="text-[11px] text-[#86868b] truncate">
                  {{ user.roles?.name || 'Sin Cargo' }} • {{ user.areas?.name || 'Sin Área' }}
                </p>
              </div>
            </div>

            <!-- Switch / Toggle -->
            <div class="shrink-0 flex items-center">
              <span v-if="user.is_master_admin" class="text-[11px] font-bold text-[#8a6d3d] italic">
                Control Total
              </span>
              <label v-else class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="!!user.can_manage_academy"
                  :disabled="updatingManagerId === user.id"
                  @change="toggleAcademyManagerRole(user)"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8a6d3d]"></div>
              </label>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f5f7] border-t border-[#e5e5ea] flex justify-end">
          <button @click="showManagersModal = false" class="px-5 py-2 bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE PROGRESO POR EMPLEADO -->
    <div v-if="selectedMemberDetail" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#e5e5ea]">
        <div class="p-5 bg-[#1d1d1f] text-white flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold">{{ selectedMemberDetail.full_name }}</h3>
            <p class="text-xs text-white/70">{{ selectedMemberDetail.roles?.name }} • {{ selectedMemberDetail.areas?.name }}</p>
          </div>
          <button @click="selectedMemberDetail = null" class="text-white/70 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <h4 class="text-xs font-bold uppercase tracking-wider text-[#86868b]">Historial de Videos Asignados</h4>
          <div class="space-y-2">
            <div
              v-for="video in getMemberVideosList(selectedMemberDetail)"
              :key="video.id"
              class="p-3 bg-[#f5f5f7] rounded-xl flex items-center justify-between gap-3 border border-[#e5e5ea]"
            >
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[20px]" :class="isMemberVideoDone(selectedMemberDetail.id, video.id) ? 'text-[#34c759]' : 'text-[#86868b]'">
                  {{ isMemberVideoDone(selectedMemberDetail.id, video.id) ? 'check_circle' : 'schedule' }}
                </span>
                <div>
                  <h5 class="text-xs font-bold text-[#1d1d1f] line-clamp-1">{{ video.title }}</h5>
                  <span class="text-[10px] text-[#86868b]">
                    {{ video.is_mandatory ? 'Obligatorio' : 'Opcional' }} • {{ video.duration_minutes || 5 }} min
                  </span>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="isMemberVideoDone(selectedMemberDetail.id, video.id) ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-amber-500/10 text-amber-600'">
                {{ isMemberVideoDone(selectedMemberDetail.id, video.id) ? 'Completado' : 'Pendiente' }}
              </span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-[#f5f5f7] border-t border-[#e5e5ea] flex justify-end">
          <button @click="selectedMemberDetail = null" class="px-4 py-1.5 bg-[#1d1d1f] text-white text-xs font-semibold rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { currentProfile, loadCurrentProfile } from '@/api/auth'

// Estados de interfaz
const activeTab = ref('videos') // 'videos' | 'team'
const filterType = ref('assigned') // 'assigned' | 'all' | 'completed'
const searchQuery = ref('')
const selectedAreaFilter = ref('')
const showAddModal = ref(false)
const editingVideoId = ref(null)
const showManagersModal = ref(false)
const managerSearchQuery = ref('')
const updatingManagerId = ref(null)
const allCompanyUsers = ref([])
const savingVideo = ref(false)
const activeVideoPlaying = ref(null)
const selectedMemberDetail = ref(null)
const videoInputMode = ref('link') // 'link' | 'file'
const selectedVideoFile = ref(null)
const uploadProgressMsg = ref('')

// Datos reactivos
const allVideos = ref([])
const userProgress = ref([])
const teamMembers = ref([])
const availableRoles = ref([])
const availableAreas = ref([])

// Formulario nuevo video
const newVideo = ref({
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  role_id: '',
  area_id: '',
  duration_minutes: 10,
  is_mandatory: true
})

// Semillero fallback para demostración si la tabla aún no se ha creado
const fallbackVideos = [
  {
    id: 'f001-video',
    title: 'Inducción General y Cultura NOVA WORK',
    description: 'Conoce los valores corporativos, procesos clave y directrices operativas de Elite Nutrition y Futupro.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
    duration_minutes: 8,
    is_mandatory: true,
    roles: null,
    areas: null
  },
  {
    id: 'f002-video',
    title: 'Buenas Prácticas de Almacenamiento y Conteo de Inventarios',
    description: 'Protocolo de recepción de mercancía, verificación de sellos de seguridad y registro de mermas.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
    duration_minutes: 12,
    is_mandatory: true,
    roles: null,
    areas: null
  }
]

// Permisos: Super Admin y usuarios a los que se les concedió el rol de encargado can_manage_academy
const isMasterAdmin = computed(() => !!currentProfile.value?.is_master_admin)

const canManage = computed(() => {
  if (!currentProfile.value) return false
  return (
    currentProfile.value.is_master_admin ||
    currentProfile.value.can_manage_academy ||
    [1, 2].includes(currentProfile.value.roles?.access_level)
  )
})

// Cargar Datos
const loadData = async () => {
  await loadCurrentProfile()
  const userId = currentProfile.value?.id

  // 1. Cargar áreas y roles
  const { data: areas } = await supabase.from('areas').select('*').order('name')
  availableAreas.value = areas || []

  const { data: roles } = await supabase.from('roles').select('*').order('name')
  availableRoles.value = roles || []

  // 2. Cargar videos de Supabase
  try {
    const { data: vids, error } = await supabase
      .from('academy_videos')
      .select('*, roles(name), areas(name)')
      .order('sequence_order', { ascending: true })

    if (error) {
      console.warn('Error cargando videos de Supabase:', error)
      allVideos.value = []
    } else {
      allVideos.value = vids || []
    }
  } catch (err) {
    console.error('Error en loadData:', err)
    allVideos.value = []
  }

  // 3. Cargar progreso del usuario
  if (userId) {
    try {
      const { data: prog } = await supabase
        .from('user_video_progress')
        .select('*')
        .eq('user_id', userId)

      userProgress.value = prog || []
    } catch {
      // Usar localStorage fallback
      const saved = localStorage.getItem(`novawork_prog_${userId}`)
      userProgress.value = saved ? JSON.parse(saved) : []
    }
  }

  // 4. Si es líder, cargar su equipo y progresos globales
  if (canManage.value) {
    loadTeamData()
  }
}

// Cargar equipo para el líder
const loadTeamData = async () => {
  let query = supabase.from('profiles').select('*, roles(*), areas(*)').eq('approval_status', 'approved')

  // Si es líder de área y no es master, filtrar por su área
  if (!currentProfile.value?.is_master_admin && currentProfile.value?.area_id) {
    query = query.eq('area_id', currentProfile.value.area_id)
  }

  const { data: members } = await query
  teamMembers.value = members || []

  // Cargar progreso de todos los miembros del equipo
  try {
    const { data: allProg } = await supabase.from('user_video_progress').select('*')
    if (allProg) {
      allTeamProgress.value = allProg
    }
  } catch {
    allTeamProgress.value = []
  }
}

const allTeamProgress = ref([])

// Videos asignados al rol del usuario
const userAssignedVideos = computed(() => {
  const userRoleId = currentProfile.value?.role_id
  const userAreaId = currentProfile.value?.area_id

  return allVideos.value.filter(v => {
    // Si no tiene rol_id ni area_id, es para toda la empresa
    if (!v.role_id && !v.area_id) return true
    // Si coincide con su rol o área
    if (v.role_id && v.role_id === userRoleId) return true
    if (v.area_id && v.area_id === userAreaId) return true
    return false
  })
})

// Filtrado de Videos en Catálogo
const filteredVideos = computed(() => {
  let list = []
  if (filterType.value === 'assigned') {
    list = userAssignedVideos.value
  } else if (filterType.value === 'completed') {
    list = allVideos.value.filter(v => isVideoCompleted(v.id))
  } else {
    list = allVideos.value
  }

  if (selectedAreaFilter.value) {
    list = list.filter(v => v.area_id === selectedAreaFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(v =>
      v.title.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    )
  }

  return list
})

// Métricas de progreso personal
const completedVideosCount = computed(() => {
  const assignedIds = new Set(userAssignedVideos.value.map(v => v.id))
  return userProgress.value.filter(p => p.is_completed && assignedIds.has(p.video_id)).length
})

const userProgressPercentage = computed(() => {
  const total = userAssignedVideos.value.length
  if (total === 0) return 100
  return Math.round((completedVideosCount.value / total) * 100)
})

const isVideoCompleted = (videoId) => {
  return userProgress.value.some(p => p.video_id === videoId && p.is_completed)
}

// Reproducción y Completitud
const playVideo = (video) => {
  activeVideoPlaying.value = video
}

const closeVideoModal = () => {
  activeVideoPlaying.value = null
}

const toggleVideoCompletion = async (videoId) => {
  const userId = currentProfile.value?.id
  if (!userId) return

  const currentlyDone = isVideoCompleted(videoId)
  const newStatus = !currentlyDone

  // Actualizar estado local
  const existingIdx = userProgress.value.findIndex(p => p.video_id === videoId)
  if (existingIdx >= 0) {
    userProgress.value[existingIdx].is_completed = newStatus
    userProgress.value[existingIdx].completed_at = newStatus ? new Date().toISOString() : null
  } else {
    userProgress.value.push({
      user_id: userId,
      video_id: videoId,
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null
    })
  }

  // Guardar en Supabase
  try {
    await supabase.from('user_video_progress').upsert({
      user_id: userId,
      video_id: videoId,
      is_completed: newStatus,
      completed_at: newStatus ? new Date().toISOString() : null,
      last_watched_at: new Date().toISOString(),
      progress_percent: newStatus ? 100 : 0
    }, { onConflict: 'user_id, video_id' })
  } catch {
    localStorage.setItem(`novawork_prog_${userId}`, JSON.stringify(userProgress.value))
  }
}

// Helpers para streaming directo de videos (OneDrive, SharePoint, Google Drive, YouTube, Vimeo, Loom)
const getEmbedUrl = (url) => {
  if (!url) return null
  const cleanUrl = url.trim()

  // 1. YouTube standard, shorts, embed & youtu.be
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i)
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&autoplay=1`
  }

  // 2. Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/)
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`
  }

  // 3. Loom
  const loomMatch = cleanUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`
  }

  // 4. Google Drive
  const gdriveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`
  }

  // 5. Microsoft SharePoint & OneDrive for Business / Personal
  // NOTA: Microsoft 365 bloquea por defecto iframes de terceros con 'frame-ancestors none' y 'X-Frame-Options: SAMEORIGIN'.
  // Se retorna null para delegar a la tarjeta corporativa de Microsoft Stream con apertura segura y autorizada.
  if (isSharePointOrStream(cleanUrl)) {
    return null
  }

  return null
}

const isSharePointOrStream = (url) => {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.includes('sharepoint.com') ||
    lower.includes('stream.aspx') ||
    lower.includes('1drv.ms') ||
    lower.includes('onedrive.live.com') ||
    lower.includes('stream.office.com') ||
    lower.includes('microsoftstream.com')
  )
}

const isDirectVideo = (url) => {
  if (!url) return false
  // Si es un enlace de SharePoint (aunque termine con .mp4 en la ruta), no es accesible sin cookies de Microsoft Entra
  if (isSharePointOrStream(url)) return false

  const clean = url.toLowerCase().split('?')[0].split('#')[0]
  return clean.endsWith('.mp4') || 
         clean.endsWith('.webm') || 
         clean.endsWith('.ogg') || 
         clean.endsWith('.mov') || 
         clean.endsWith('.m4v') ||
         url.includes('/storage/v1/object/public/') ||
         url.includes('/academy_videos/')
}

const handleVideoEnded = (videoId) => {
  if (!isVideoCompleted(videoId)) {
    toggleVideoCompletion(videoId)
  }
}

// Selector y manejo de archivo MP4 local
const handleVideoFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  selectedVideoFile.value = file
  if (!newVideo.value.title) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    newVideo.value.title = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  }
}

const removeSelectedVideoFile = () => {
  selectedVideoFile.value = null
}

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// ==========================================
// SISTEMA DE PORTADAS Y MINIATURAS INTERNAS
// ==========================================
const generatingThumbnail = ref(false)

const thumbnailPresets = [
  { id: 'gold', name: 'Oro Corporativo', emoji: '👑', bg1: '#141416', bg2: '#23221e', accent: '#d4b06a', tag: 'NOVA WORK' },
  { id: 'audit', name: 'Auditoría & Calidad', emoji: '🔍', bg1: '#0b1626', bg2: '#132845', accent: '#38bdf8', tag: 'AUDITORÍA' },
  { id: 'warehouse', name: 'Almacén & Logística', emoji: '📦', bg1: '#18181b', bg2: '#27272a', accent: '#f59e0b', tag: 'LOGÍSTICA' },
  { id: 'commercial', name: 'Comercial & Ventas', emoji: '💼', bg1: '#1a102f', bg2: '#2e1c54', accent: '#c084fc', tag: 'COMERCIAL' },
  { id: 'systems', name: 'Sistemas & TI', emoji: '💻', bg1: '#090d16', bg2: '#111d33', accent: '#22c55e', tag: 'TECNOLOGÍA' }
]

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const generateAutoThumbnail = async (presetChoice = null) => {
  const preset = presetChoice || thumbnailPresets[0]
  const title = (newVideo.value.title || 'Guía Operativa y Capacitación').trim()
  
  const areaObj = availableAreas.value.find(a => a.id === newVideo.value.area_id)
  const roleObj = availableRoles.value.find(r => r.id === newVideo.value.role_id)
  const audienceLabel = roleObj?.name || (areaObj ? `Área: ${areaObj.name}` : 'General • Toda la Empresa')

  generatingThumbnail.value = true

  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')

    // 1. Fondo degradado principal
    const grad = ctx.createLinearGradient(0, 0, 1280, 720)
    grad.addColorStop(0, preset.bg1)
    grad.addColorStop(1, preset.bg2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1280, 720)

    // 2. Destello radial elegante en la esquina superior derecha
    const radial = ctx.createRadialGradient(1050, 200, 20, 1050, 200, 600)
    radial.addColorStop(0, `${preset.accent}33`)
    radial.addColorStop(1, 'transparent')
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, 1280, 720)

    // 3. Patrón de líneas geométricas decorativas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
    ctx.lineWidth = 1.5
    for (let x = -720; x < 1280; x += 90) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 720, 720)
      ctx.stroke()
    }

    // 4. Borde sutil exterior
    ctx.strokeStyle = `${preset.accent}44`
    ctx.lineWidth = 12
    ctx.strokeRect(6, 6, 1268, 708)

    // 5. Encabezado de Marca: "ELITE NOVA GROUP • NOVA WORK"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    drawRoundedRect(ctx, 80, 75, 430, 48, 12)
    ctx.fill()
    ctx.strokeStyle = `${preset.accent}66`
    ctx.lineWidth = 1.5
    drawRoundedRect(ctx, 80, 75, 430, 48, 12)
    ctx.stroke()

    ctx.fillStyle = preset.accent
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('ELITE NOVA GROUP', 105, 106)

    ctx.fillStyle = '#ffffff'
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('•  NOVA WORK', 315, 106)

    // Badge de categoría (derecha)
    const categoryText = preset.tag
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const catWidth = ctx.measureText(categoryText).width
    ctx.fillStyle = preset.accent
    drawRoundedRect(ctx, 1200 - catWidth - 40, 75, catWidth + 40, 48, 12)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.fillText(categoryText, 1200 - catWidth - 20, 106)

    // 6. Título del video con auto-wrap (hasta 3 líneas)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 4

    const maxTextWidth = 1120
    const words = title.split(' ')
    let currentLine = ''
    const lines = []
    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxTextWidth && n > 0) {
        lines.push(currentLine.trim())
        currentLine = words[n] + ' '
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine.trim())

    const startY = lines.length === 1 ? 320 : (lines.length === 2 ? 280 : 240)
    for (let k = 0; k < Math.min(lines.length, 3); k++) {
      ctx.fillText(lines[k], 80, startY + (k * 70))
    }

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // 7. Línea divisoria acento
    const lineY = startY + (Math.min(lines.length, 3) * 70) + 15
    const lineGrad = ctx.createLinearGradient(80, lineY, 800, lineY)
    lineGrad.addColorStop(0, preset.accent)
    lineGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = lineGrad
    ctx.fillRect(80, lineY, 600, 4)

    // 8. Audiencia / Subtítulo
    ctx.fillStyle = '#d1d5db'
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(`Dirigido a: ${audienceLabel}`, 80, lineY + 50)

    // 9. Pie de portada
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText('ACADEMIA DE FORMACIÓN Y EXCELENCIA OPERATIVA', 80, 650)

    // 10. Watermark con ícono de reproducción en la esquina inferior derecha
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.arc(1140, 580, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `${preset.accent}aa`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(1140, 580, 50, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = preset.accent
    ctx.beginPath()
    ctx.moveTo(1130, 560)
    ctx.lineTo(1160, 580)
    ctx.lineTo(1130, 600)
    ctx.closePath()
    ctx.fill()

    const dataUrl = canvas.toDataURL('image/png')
    
    // Subir a Supabase Storage
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (blob) {
      const fileName = `thumbnails/portada_${Date.now()}.png`
      const { data: uploadRes, error: upErr } = await supabase.storage
        .from('academy_videos')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true })

      if (!upErr && uploadRes) {
        const { data: pubData } = supabase.storage
          .from('academy_videos')
          .getPublicUrl(fileName)
        newVideo.value.thumbnail_url = pubData?.publicUrl || dataUrl
      } else {
        newVideo.value.thumbnail_url = dataUrl
      }
    } else {
      newVideo.value.thumbnail_url = dataUrl
    }
  } catch (err) {
    console.error('Error generando portada:', err)
  } finally {
    generatingThumbnail.value = false
  }
}

const handleThumbnailFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen de portada no debe superar 5MB.')
    return
  }

  // Previsualización inmediata en local
  const localUrl = URL.createObjectURL(file)
  newVideo.value.thumbnail_url = localUrl

  // Subir a Supabase Storage
  try {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `thumbnails/custom_${Date.now()}.${ext}`
    const { data: uploadRes, error: upErr } = await supabase.storage
      .from('academy_videos')
      .upload(fileName, file, { contentType: file.type, upsert: true })

    if (!upErr && uploadRes) {
      const { data: pubData } = supabase.storage
        .from('academy_videos')
        .getPublicUrl(fileName)
      if (pubData?.publicUrl) {
        newVideo.value.thumbnail_url = pubData.publicUrl
      }
    }
  } catch (err) {
    console.warn('Error subiendo miniatura a Supabase, manteniendo URL local:', err)
  }
}

// Abrir Modal para Agregar Video
const openAddVideoModal = () => {
  editingVideoId.value = null
  newVideo.value = {
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    role_id: '',
    area_id: currentProfile.value?.area_id || '',
    duration_minutes: 10,
    is_mandatory: true
  }
  selectedVideoFile.value = null
  videoInputMode.value = 'link'
  uploadProgressMsg.value = ''
  showAddModal.value = true
}

// Abrir Modal para Editar Video y Audiencia
const openEditVideoModal = (video) => {
  editingVideoId.value = video.id
  newVideo.value = {
    title: video.title || '',
    description: video.description || '',
    video_url: video.video_url || '',
    thumbnail_url: video.thumbnail_url || '',
    role_id: video.role_id || '',
    area_id: video.area_id || '',
    duration_minutes: video.duration_minutes || 10,
    is_mandatory: !!video.is_mandatory
  }
  selectedVideoFile.value = null
  videoInputMode.value = isDirectVideo(video.video_url) ? 'file' : 'link'
  uploadProgressMsg.value = ''
  showAddModal.value = true
}

const saveNewVideo = async () => {
  if (!newVideo.value.title) {
    alert('Por favor indica un título para el video.')
    return
  }

  savingVideo.value = true
  uploadProgressMsg.value = ''
  let finalVideoUrl = newVideo.value.video_url?.trim() || ''

  try {
    if (videoInputMode.value === 'file') {
      if (selectedVideoFile.value) {
        uploadProgressMsg.value = 'Subiendo video .MP4 al almacenamiento seguro...'
        const safeName = `${Date.now()}_${selectedVideoFile.value.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `academy_videos/${safeName}`

        try {
          const { error: uploadError } = await supabase.storage
            .from('academy_videos')
            .upload(filePath, selectedVideoFile.value, { upsert: true })

          if (uploadError) {
            console.error('Almacenamiento en nube falló:', uploadError)
            alert(`No se pudo subir el archivo de video a Supabase Storage: ${uploadError.message}\n\nPor favor asegúrate de haber ejecutado el script SQL de migración de storage en tu base de datos Supabase.`)
            savingVideo.value = false
            return
          }

          const { data: publicUrlData } = supabase.storage
            .from('academy_videos')
            .getPublicUrl(filePath)
          
          if (!publicUrlData?.publicUrl) {
            alert('El archivo se subió pero no se pudo obtener su URL pública.')
            savingVideo.value = false
            return
          }
          finalVideoUrl = publicUrlData.publicUrl
        } catch (uploadCatch) {
          console.error('Error inesperado en storage:', uploadCatch)
          alert('Error inesperado al subir el video: ' + (uploadCatch.message || uploadCatch))
          savingVideo.value = false
          return
        }
      } else if (!finalVideoUrl && !editingVideoId.value) {
        alert('Por favor selecciona un archivo .mp4 de tu computadora.')
        savingVideo.value = false
        return
      }
    } else {
      if (!finalVideoUrl) {
        alert('Por favor escribe o pega la URL del video.')
        savingVideo.value = false
        return
      }
    }

    const payload = {
      title: newVideo.value.title.trim(),
      description: (newVideo.value.description || '').trim(),
      video_url: finalVideoUrl,
      thumbnail_url: newVideo.value.thumbnail_url?.trim() || null,
      role_id: newVideo.value.role_id || null,
      area_id: newVideo.value.area_id || null,
      duration_minutes: newVideo.value.duration_minutes || 5,
      is_mandatory: !!newVideo.value.is_mandatory
    }

    if (editingVideoId.value) {
      // Actualizar video existente
      const { data, error } = await supabase
        .from('academy_videos')
        .update(payload)
        .eq('id', editingVideoId.value)
        .select('*, roles(name), areas(name)')
        .single()

      if (error) {
        alert('Error al actualizar el video: ' + error.message)
        return
      }
      if (data) {
        const idx = allVideos.value.findIndex(v => v.id === editingVideoId.value)
        if (idx !== -1) allVideos.value[idx] = data
      }
    } else {
      // Crear nuevo video
      payload.created_by = currentProfile.value?.id
      const { data, error } = await supabase
        .from('academy_videos')
        .insert(payload)
        .select('*, roles(name), areas(name)')
        .single()

      if (error) {
        alert('Error al guardar el video en la base de datos: ' + error.message)
        return
      }
      if (data) {
        allVideos.value.unshift(data)
      }
    }

    showAddModal.value = false
    selectedVideoFile.value = null
    editingVideoId.value = null
    newVideo.value.video_url = ''
    newVideo.value.thumbnail_url = ''
    newVideo.value.title = ''
  } catch (err) {
    console.error('Error guardando video:', err)
    alert('Ocurrió un error inesperado al guardar el video: ' + (err.message || err))
  } finally {
    savingVideo.value = false
    uploadProgressMsg.value = ''
  }
}

const deleteVideo = async (videoId) => {
  if (!confirm('¿Estás seguro de eliminar este video de la academia?')) return
  try {
    const { error } = await supabase.from('academy_videos').delete().eq('id', videoId)
    if (error) {
      alert('Error al eliminar en la base de datos: ' + error.message)
      return
    }
    allVideos.value = allVideos.value.filter(v => v.id !== videoId)
  } catch (err) {
    alert('Error al intentar eliminar: ' + (err.message || err))
  }
}

// Gestión de Encargados de la Escuela (Solo Super Admin)
const openManagersModal = async () => {
  showManagersModal.value = true
  await loadCompanyUsers()
}

const loadCompanyUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role_id, area_id, is_master_admin, can_manage_academy, roles(name), areas(name)')
      .eq('approval_status', 'approved')
      .order('full_name')

    if (!error && data) {
      allCompanyUsers.value = data
    } else {
      // Si la columna can_manage_academy aún no está en la base de datos, fallback
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, full_name, role_id, area_id, is_master_admin, roles(name), areas(name)')
        .eq('approval_status', 'approved')
        .order('full_name')
      allCompanyUsers.value = (fallbackData || []).map(u => ({ ...u, can_manage_academy: false }))
    }
  } catch (err) {
    console.warn('Error cargando colaboradores:', err)
  }
}

const filteredManagersList = computed(() => {
  if (!managerSearchQuery.value.trim()) return allCompanyUsers.value
  const q = managerSearchQuery.value.toLowerCase()
  return allCompanyUsers.value.filter(u =>
    u.full_name?.toLowerCase().includes(q) ||
    u.roles?.name?.toLowerCase().includes(q) ||
    u.areas?.name?.toLowerCase().includes(q)
  )
})

const toggleAcademyManagerRole = async (user) => {
  updatingManagerId.value = user.id
  const newRoleVal = !user.can_manage_academy

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ can_manage_academy: newRoleVal })
      .eq('id', user.id)

    if (!error) {
      user.can_manage_academy = newRoleVal
    } else {
      console.error('Error actualizando rol de encargado en base de datos:', error)
      // Si falló por falta de la columna en la BD, notificar al usuario
      alert('Aviso: Debes ejecutar la migración SQL en Supabase para habilitar la columna "can_manage_academy".')
      user.can_manage_academy = newRoleVal // reflejo visual temporal
    }
  } catch (err) {
    console.error('Error al cambiar rol:', err)
  } finally {
    updatingManagerId.value = null
  }
}

// Métricas de Equipo
const getMemberVideosList = (member) => {
  return allVideos.value.filter(v => {
    if (!v.role_id && !v.area_id) return true
    if (v.role_id && v.role_id === member.role_id) return true
    if (v.area_id && v.area_id === member.area_id) return true
    return false
  })
}

const getMemberTotalVideos = (member) => {
  return getMemberVideosList(member).length
}

const getMemberCompletedVideos = (memberId) => {
  return allTeamProgress.value.filter(p => p.user_id === memberId && p.is_completed).length
}

const getMemberPercentage = (member) => {
  const total = getMemberTotalVideos(member)
  if (total === 0) return 100
  const completed = getMemberCompletedVideos(member.id)
  return Math.min(100, Math.round((completed / total) * 100))
}

const isMemberVideoDone = (memberId, videoId) => {
  return allTeamProgress.value.some(p => p.user_id === memberId && p.video_id === videoId && p.is_completed)
}

const viewMemberDetail = (member) => {
  selectedMemberDetail.value = member
}

const getInitials = (name) => {
  if (!name) return 'NW'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

onMounted(() => {
  loadData()
})
</script>

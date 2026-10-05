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
              <h1 class="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">Escuela & Academia NOVA WORD</h1>
              <span class="px-2 py-0.5 bg-[#8a6d3d]/10 text-[#8a6d3d] text-[11px] font-bold rounded-full uppercase">Formación Continua</span>
            </div>
            <p class="text-xs text-[#86868b]">Videos de inducción, tutoriales operativos y guías por cargo para Elite Nutrition & Futupro</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Botón de Ver Progreso del Equipo (solo líderes) -->
          <button
            v-if="canManage"
            @click="activeTab = activeTab === 'team' ? 'videos' : 'team'"
            class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm border"
            :class="activeTab === 'team' ? 'bg-[#1d1d1f] text-white border-transparent' : 'bg-white text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'"
          >
            <span class="material-symbols-outlined text-[18px]">group</span>
            <span>{{ activeTab === 'team' ? 'Ver Catálogo de Videos' : 'Progreso del Equipo' }}</span>
          </button>

          <!-- Botón Agregar Video (solo líderes y admin) -->
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
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e] p-4 text-center">
                <span class="material-symbols-outlined text-white/40 text-5xl mb-2">play_circle</span>
                <span class="text-xs font-medium text-white/80 line-clamp-1">{{ video.title }}</span>
              </div>

              <!-- Overlay Botón Play -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-[#8a6d3d] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-2xl">play_arrow</span>
                </div>
              </div>

              <!-- Insignias Superiores -->
              <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span v-if="video.is_mandatory" class="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md shadow uppercase tracking-wider">
                  Obligatorio
                </span>
                <span v-if="isVideoCompleted(video.id)" class="px-2 py-0.5 bg-[#34c759] text-white text-[10px] font-bold rounded-md shadow flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">check_circle</span> Completado
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
                    @click="deleteVideo(video.id)"
                    class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div class="relative w-full aspect-video bg-black flex items-center justify-center">
          <!-- YouTube Iframe -->
          <iframe
            v-if="getEmbedUrl(activeVideoPlaying.video_url)"
            :src="getEmbedUrl(activeVideoPlaying.video_url)"
            class="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

          <!-- Enlace Directo HTML5 (MP4 / WebM) -->
          <video
            v-else-if="isDirectVideo(activeVideoPlaying.video_url)"
            :src="activeVideoPlaying.video_url"
            controls
            autoplay
            playsinline
            class="w-full h-full"
          ></video>

          <!-- Enlace Externo (OneDrive / SharePoint / Stream) -->
          <div v-else class="p-8 text-center text-white flex flex-col items-center">
            <span class="material-symbols-outlined text-5xl text-[#8a6d3d] mb-3">cloud_download</span>
            <h4 class="text-lg font-bold">Video Alojado en OneDrive / SharePoint</h4>
            <p class="text-xs text-white/70 mt-1 max-w-md">Este video está protegido bajo las políticas de seguridad de Microsoft 365.</p>
            <a
              :href="activeVideoPlaying.video_url"
              target="_blank"
              class="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#d4b06a] to-[#8a6d3d] text-white font-bold text-xs rounded-xl shadow hover:brightness-105 transition-all flex items-center gap-2"
            >
              <span>Abrir Video en Microsoft Stream</span>
              <span class="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>

        <!-- Pie de Información y Botón Completar -->
        <div class="p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e5e5ea]">
          <div>
            <span class="text-xs font-bold text-[#8a6d3d] uppercase tracking-wider block">
              {{ activeVideoPlaying.roles?.name || 'General' }}
            </span>
            <p class="text-xs text-[#86868b] mt-0.5 line-clamp-2">{{ activeVideoPlaying.description || 'Sin notas adicionales.' }}</p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
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

    <!-- MODAL AGREGAR NUEVO VIDEO (OPERADORES Y LÍDERES) -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#e5e5ea]">
        <div class="p-5 bg-[#1d1d1f] text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#8a6d3d]">video_call</span>
            <h3 class="text-base font-bold">Agregar Video a la Academia</h3>
          </div>
          <button @click="showAddModal = false" class="text-white/70 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form @submit.prevent="saveNewVideo" class="p-5 space-y-4">
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

          <div>
            <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">URL del Video (YouTube, Vimeo, OneDrive o MP4) *</label>
            <input
              v-model="newVideo.video_url"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... o link OneDrive"
              class="w-full px-3.5 py-2 bg-white border border-[#e5e5ea] rounded-xl text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#8a6d3d]"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Área Destino</label>
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
              class="px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="savingVideo"
              class="px-5 py-2 bg-[#8a6d3d] hover:bg-[#b08d57] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              {{ savingVideo ? 'Guardando...' : 'Guardar y Publicar' }}
            </button>
          </div>
        </form>
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
const savingVideo = ref(false)
const activeVideoPlaying = ref(null)
const selectedMemberDetail = ref(null)

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
  role_id: '',
  area_id: '',
  duration_minutes: 10,
  is_mandatory: true
})

// Semillero fallback para demostración si la tabla aún no se ha creado
const fallbackVideos = [
  {
    id: 'f001-video',
    title: 'Inducción General y Cultura NOVA WORD',
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

// Permisos
const canManage = computed(() => {
  if (!currentProfile.value) return false
  return currentProfile.value.is_master_admin || [1, 2].includes(currentProfile.value.roles?.access_level)
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

    if (error || !vids || vids.length === 0) {
      allVideos.value = fallbackVideos
    } else {
      allVideos.value = vids
    }
  } catch (err) {
    allVideos.value = fallbackVideos
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
      const saved = localStorage.getItem(`novaword_prog_${userId}`)
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
    localStorage.setItem(`novaword_prog_${userId}`, JSON.stringify(userProgress.value))
  }
}

// Helpers para YouTube y tipos de video
const getEmbedUrl = (url) => {
  if (!url) return null
  // YouTube standard
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&autoplay=1`
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/)
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`
  }
  return null
}

const isDirectVideo = (url) => {
  if (!url) return false
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/storage/v1/object/public/')
}

// Agregar Nuevo Video
const openAddVideoModal = () => {
  newVideo.value = {
    title: '',
    description: '',
    video_url: '',
    role_id: '',
    area_id: currentProfile.value?.area_id || '',
    duration_minutes: 10,
    is_mandatory: true
  }
  showAddModal.value = true
}

const saveNewVideo = async () => {
  if (!newVideo.value.title || !newVideo.value.video_url) return
  savingVideo.value = true

  const payload = {
    title: newVideo.value.title.trim(),
    description: newVideo.value.description.trim(),
    video_url: newVideo.value.video_url.trim(),
    role_id: newVideo.value.role_id || null,
    area_id: newVideo.value.area_id || null,
    duration_minutes: newVideo.value.duration_minutes || 5,
    is_mandatory: !!newVideo.value.is_mandatory,
    created_by: currentProfile.value?.id
  }

  try {
    const { data, error } = await supabase.from('academy_videos').insert(payload).select().single()
    if (!error && data) {
      allVideos.value.unshift(data)
    } else {
      // Agregar a lista local si la tabla aún se está migrando
      allVideos.value.unshift({ id: 'loc-' + Date.now(), ...payload })
    }
  } catch {
    allVideos.value.unshift({ id: 'loc-' + Date.now(), ...payload })
  } finally {
    savingVideo.value = false
    showAddModal.value = false
  }
}

const deleteVideo = async (videoId) => {
  if (!confirm('¿Estás seguro de eliminar este video de la academia?')) return
  allVideos.value = allVideos.value.filter(v => v.id !== videoId)
  try {
    await supabase.from('academy_videos').delete().eq('id', videoId)
  } catch {}
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

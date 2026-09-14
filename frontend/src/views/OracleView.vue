<template>
  <div class="oracle-view bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
    
    <main class="w-full pt-6 bg-background max-w-7xl mx-auto px-margin min-h-screen">
      <div class="flex flex-col w-full">
        <!-- Sub-Header Status Ribbon -->
        <div class="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.02)] mb-space-md rounded-xl p-space-sm px-space-md flex flex-wrap items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-sm text-on-surface-variant">
            <button @click="router.back()" class="mr-1 p-1.5 rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center text-on-surface-variant hover:text-on-surface" title="Volver al Workspace">
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container text-primary">
              <span class="material-symbols-outlined text-[18px]">account_tree</span>
            </span>
            <div class="flex items-center gap-1.5 font-label-sm text-label-sm">
              <router-link to="/" class="text-on-surface font-semibold hover:text-primary transition-colors">Elite Nova Group</router-link>
              <span class="text-outline-variant">/</span>
              <span class="text-on-surface">Centro de Conocimiento</span>
              <span class="text-outline-variant">/</span>
              <span class="text-primary font-medium">El Oráculo Enterprise</span>
            </div>
          </div>
          <div class="flex items-center gap-space-md">
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-caption text-caption">
              <span class="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(52,199,89,0.5)]" :class="dbStatus ? 'bg-[#34c759]' : 'bg-error'"></span>
              <span class="font-medium text-on-surface">Base de Conocimiento: {{ dbStatus ? 'Sincronizada' : 'Desconectada' }}</span>
              <span class="text-secondary" v-if="panoramaLoaded">• {{ totalRoles }} Nodos Activos</span>
            </div>
            <div class="hidden md:flex items-center gap-1 font-caption text-caption text-on-surface-variant">
              <span class="material-symbols-outlined text-[15px] text-primary">verified_user</span>
              <span>Normativa ISO-9001 & RGPD</span>
            </div>
            <!-- Toggle Tab Button -->
            <button class="text-caption px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-semibold" @click="toggleTab">
              {{ tab === 'chat' ? 'Ver Panorama' : 'Volver al Chat' }}
            </button>
          </div>
        </div>

        <!-- TWO-COLUMN ARCHITECTURE -->
        <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start pb-space-xl">
          
          <!-- LEFT SIDEBAR: Historial & Sesiones (Col span 3.5 ~ 4) -->
          <aside class="lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_8px_24px_-4px_rgba(0,0,0,0.03)] h-full lg:max-h-[820px]">
            <!-- Search & New Session -->
            <div class="flex flex-col gap-space-sm">
              <button @click="messages = [{role: 'ai', text: 'Nueva sesión iniciada. ¿En qué puedo asistirte hoy?'}]" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all group shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span class="material-symbols-outlined text-primary text-[20px] transition-transform group-hover:rotate-90">add</span>
                <span class="font-semibold text-primary">Nueva Consulta</span>
              </button>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
                <input class="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg text-on-surface placeholder:text-secondary font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="Buscar consultas anteriores..." type="text"/>
              </div>
            </div>
            
            <!-- Categories & History Feed (MOCKUP VISUAL PRESERVADO) -->
            <div class="flex flex-col gap-space-md overflow-y-auto pr-1 flex-1">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between px-2">
                  <span class="font-caption text-caption uppercase tracking-wider text-secondary font-semibold">Hoy</span>
                  <span class="text-[10px] text-secondary font-mono">1 chat</span>
                </div>
                <!-- Active Conversation Card -->
                <div class="relative p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-1 cursor-pointer transition-all hover:bg-surface-container">
                  <div class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#d4b06a] to-[#8a6d3d]"></div>
                  <div class="flex items-center justify-between pl-1">
                    <span class="font-label-md text-label-md font-semibold text-on-surface truncate">Consulta en Curso</span>
                    <span class="font-caption text-caption text-secondary shrink-0">Ahora</span>
                  </div>
                  <p class="pl-1 font-body-sm text-body-sm text-secondary line-clamp-1">Interacción actual con el Oráculo</p>
                  <div class="flex items-center gap-2 pl-1 mt-1 font-caption text-caption text-on-surface-variant">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {{ messages.length }} mensajes
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col gap-1.5 opacity-60">
                <div class="flex items-center justify-between px-2 pt-2">
                  <span class="font-caption text-caption uppercase tracking-wider text-secondary font-semibold">Ayer</span>
                </div>
                <div class="p-3 rounded-xl hover:bg-surface-container-low flex flex-col gap-1 cursor-pointer transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-label-md text-on-surface truncate">Estatutos de Gobernanza COFEPRIS</span>
                  </div>
                  <p class="font-body-sm text-body-sm text-secondary line-clamp-1">Certificación sanitaria de formulación aminoácidos</p>
                </div>
                <div class="p-3 rounded-xl hover:bg-surface-container-low flex flex-col gap-1 cursor-pointer transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-label-md text-on-surface truncate">Flujo de Auditoría ISO-9001</span>
                  </div>
                  <p class="font-body-sm text-body-sm text-secondary line-clamp-1">Cronograma de revisiones internas para laboratorio</p>
                </div>
              </div>
            </div>

            <!-- Bottom System Stamp -->
            <div class="mt-auto pt-3 flex flex-col gap-2">
              <div class="p-2.5 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified</span>
                <div class="flex flex-col">
                  <span class="font-label-sm text-label-sm font-semibold text-on-surface">Oráculo Enterprise v4.2</span>
                  <span class="font-caption text-caption text-secondary leading-tight">Certificado para Gobernanza Institucional</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- MAIN CHAT AREA (Col span 8.5 ~ 9) -->
          <section v-if="tab === 'chat'" class="lg:col-span-8 xl:col-span-9 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.03)] h-[820px] relative overflow-hidden">
            <!-- Top Action Bar inside Chat Window -->
            <div class="px-space-lg py-space-md bg-surface-container-lowest flex flex-wrap items-center justify-between gap-space-sm shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-10 shrink-0">
              <div class="flex items-center gap-space-md">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffdea3]/40 via-[#e8c086]/20 to-transparent flex items-center justify-center text-primary shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">auto_awesome</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Oráculo IA — Asistente Corporativo</h2>
                    <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#248a3d] font-caption text-caption font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#34c759]"></span> En Línea
                    </span>
                  </div>
                  <p class="font-body-sm text-body-sm text-secondary">Motor de Conocimiento y Gobernanza de Procesos</p>
                </div>
              </div>
              <!-- Action tools -->
              <div class="flex items-center gap-2">
                <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors">
                  <span class="material-symbols-outlined text-[16px] text-secondary">picture_as_pdf</span>
                  <span class="hidden md:inline">Exportar (.PDF)</span>
                </button>
              </div>
            </div>

            <!-- Scrollable Message Canvas -->
            <div class="flex-1 p-space-md lg:p-space-lg flex flex-col gap-space-lg overflow-y-auto" ref="chatHistory">
              
              <!-- Timestamp Separator -->
              <div class="flex items-center justify-center my-1">
                <span class="px-3 py-1 rounded-full bg-surface-container-low text-secondary font-caption text-caption tracking-wider uppercase">
                  Sesión iniciada
                </span>
              </div>

              <!-- DYNAMIC MESSAGES LOOP -->
              <div v-for="(msg, index) in messages" :key="index" :class="[msg.role === 'user' ? 'flex justify-end w-full' : 'flex justify-start w-full']">
                
                <!-- USER QUERY -->
                <div v-if="msg.role === 'user'" class="max-w-2xl flex flex-col items-end gap-1">
                  <div class="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tr-sm shadow-sm font-body-md text-body-md leading-relaxed whitespace-pre-wrap">{{ msg.text }}</div>
                  <div class="flex items-center gap-1 text-secondary font-caption text-caption pr-1">
                    <span class="material-symbols-outlined text-[13px] text-primary">done_all</span>
                  </div>
                </div>

                <!-- ORACLE AI RESPONSE -->
                <div v-else class="max-w-3xl flex items-start gap-space-md">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffdea3] to-[#af8e4c] flex items-center justify-center text-on-primary shrink-0 shadow-sm mt-1">
                    <span class="material-symbols-outlined text-[18px]">neurology</span>
                  </div>
                  <div class="flex flex-col gap-space-sm w-full">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-label-md text-label-md font-semibold text-on-surface">Oráculo IA</span>
                      <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#b08d57]/10 text-primary font-caption text-caption font-semibold">
                        <span class="material-symbols-outlined text-[13px]">verified</span> Respaldo Corporativo
                      </div>
                    </div>
                    
                    <div class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-[0_4px_16px_rgba(0,0,0,0.03)] bg-gradient-to-br from-surface-container-lowest to-surface-container-low/40 flex flex-col gap-space-md">
                      
                      <!-- Markdown Rendered Content -->
                      <div class="text-on-surface font-body-md text-body-md leading-relaxed markdown-body" v-html="DOMPurify.sanitize(formatMessage(msg.text))"></div>
                      
                      <!-- Action Footer inside Card -->
                      <div class="pt-3 flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container-low mt-2">
                        <div class="flex items-center gap-1">
                          <button class="p-1.5 rounded-lg hover:bg-surface-container-low text-secondary hover:text-primary transition-colors" title="Respuesta útil">
                            <span class="material-symbols-outlined text-[18px]">thumb_up</span>
                          </button>
                          <button class="p-1.5 rounded-lg hover:bg-surface-container-low text-secondary hover:text-error transition-colors" title="Reportar inconsistencia">
                            <span class="material-symbols-outlined text-[18px]">thumb_down</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TYPING INDICATOR -->
              <div v-if="loading" class="flex justify-start w-full">
                <div class="max-w-3xl flex items-start gap-space-md">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffdea3] to-[#af8e4c] flex items-center justify-center text-on-primary shrink-0 shadow-sm mt-1">
                    <span class="material-symbols-outlined text-[18px]">neurology</span>
                  </div>
                  <div class="flex flex-col justify-center h-10 px-4 bg-surface-container-lowest rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <span class="flex gap-1">
                      <span class="w-2 h-2 rounded-full bg-surface-container-highest animate-bounce" style="animation-delay: 0s;"></span>
                      <span class="w-2 h-2 rounded-full bg-surface-container-highest animate-bounce" style="animation-delay: 0.2s;"></span>
                      <span class="w-2 h-2 rounded-full bg-surface-container-highest animate-bounce" style="animation-delay: 0.4s;"></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- FLOATING INPUT AREA (Bottom Anchor) -->
            <div class="p-space-md lg:p-space-lg bg-surface-container-lowest/95 backdrop-blur-md mt-auto shadow-[0_-4px_16px_rgba(0,0,0,0.02)] shrink-0 z-20">
              <div class="flex flex-col gap-2">
                
                <!-- Main Input Field Capsule -->
                <div class="relative flex items-center bg-surface-container-low rounded-2xl p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-primary-container focus-within:bg-surface-container-lowest transition-all">
                  <input 
                    class="w-full py-3 px-4 bg-transparent text-on-surface placeholder:text-secondary font-body-md text-body-md focus:outline-none" 
                    placeholder="Pregunta sobre cualquier proceso corporativo, manual de cargo o gobernanza..." 
                    type="text"
                    v-model="currentQuery"
                    @keyup.enter="sendQuery"
                    :disabled="loading"
                  />
                  <!-- Send Action Button -->
                  <button 
                    @click="sendQuery"
                    :disabled="loading || !currentQuery.trim()"
                    class="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4b06a] to-[#8a6d3d] hover:brightness-105 active:scale-95 disabled:opacity-50 text-on-primary flex items-center justify-center transition-transform shadow-[0_2px_8px_rgba(176,141,87,0.3)]" 
                    title="Enviar Consulta">
                    <span class="material-symbols-outlined text-[22px]">arrow_upward</span>
                  </button>
                </div>
                
                <div class="flex items-center justify-center gap-1.5 text-secondary font-caption text-caption text-center px-4">
                  <span class="material-symbols-outlined text-[13px] text-primary">verified_user</span>
                  <span>El Oráculo IA responde exclusivamente con base en la documentación oficial aprobada.</span>
                </div>
              </div>
            </div>
          </section>

          <!-- PANORAMA VIEW (Alternative Tab) -->
          <section v-else class="lg:col-span-8 xl:col-span-9 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.03)] h-[820px] p-8 overflow-y-auto">
            <div class="mb-6">
              <h2 class="font-headline-md text-headline-md font-semibold text-on-surface">Panorama de Conocimiento (Gobernanza)</h2>
              <p class="text-secondary font-body-sm text-body-sm mt-2">Visibilidad de cobertura del Oráculo sobre los Nodos Corporativos.</p>
            </div>

            <div v-if="panoramaLoading" class="w-full flex justify-center py-20 text-secondary">
              Calculando métricas de cobertura...
            </div>
            
            <template v-else>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span class="font-display text-display font-semibold text-on-surface">{{ panorama.length }}</span>
                  <span class="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Áreas</span>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span class="font-display text-display font-semibold text-on-surface">{{ totalRoles }}</span>
                  <span class="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Cargos</span>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span class="font-display text-display font-semibold text-[#248a3d]">{{ fullyCoveredRoles }}</span>
                  <span class="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Óptimos</span>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span class="font-display text-display font-semibold text-error">{{ totalRoles - fullyCoveredRoles }}</span>
                  <span class="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Con Vacíos</span>
                </div>
              </div>

              <div class="space-y-6">
                <div v-for="area in panorama" :key="area.id" class="border border-surface-container rounded-2xl overflow-hidden">
                  <div class="bg-surface-container-low p-4 flex items-center justify-between border-b border-surface-container">
                    <h3 class="font-label-md text-label-md font-bold text-on-surface">{{ area.name }}</h3>
                    <div class="flex items-center gap-3">
                      <div class="w-32 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div class="h-full bg-primary transition-all" :style="{ width: area.coveragePct + '%' }"></div>
                      </div>
                      <span class="font-caption text-caption text-secondary font-semibold">{{ area.coveragePct }}% Cubierto</span>
                    </div>
                  </div>
                  
                  <div class="overflow-x-auto">
                    <table class="w-full text-left font-body-sm text-body-sm">
                      <thead class="bg-surface-container-lowest text-secondary font-caption text-caption uppercase tracking-wider">
                        <tr>
                          <th class="py-3 px-4 font-semibold">Cargo (Nodo)</th>
                          <th class="py-3 px-4 font-semibold text-center">Mapeo</th>
                          <th class="py-3 px-4 font-semibold text-center">Manual</th>
                          <th class="py-3 px-4 font-semibold text-center">KPI</th>
                          <th class="py-3 px-4 font-semibold text-center">Memoria IA</th>
                          <th class="py-3 px-4 font-semibold text-center">Información</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-surface-container">
                        <tr v-for="role in area.roles" :key="role.id" class="hover:bg-surface-container-lowest/50 transition-colors">
                          <td class="py-3 px-4 font-medium text-on-surface">{{ role.name }}</td>
                          <td class="py-3 px-4 text-center">
                            <span class="material-symbols-outlined text-[18px]" :class="role.hasMapping ? 'text-[#248a3d]' : 'text-error'">{{ role.hasMapping ? 'check_circle' : 'cancel' }}</span>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <span class="material-symbols-outlined text-[18px]" :class="role.hasManual ? 'text-[#248a3d]' : 'text-error'">{{ role.hasManual ? 'check_circle' : 'cancel' }}</span>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <span class="material-symbols-outlined text-[18px]" :class="role.hasKpi ? 'text-[#248a3d]' : 'text-error'">{{ role.hasKpi ? 'check_circle' : 'cancel' }}</span>
                          </td>
                          <td class="py-3 px-4 text-center font-semibold">
                            <span v-if="role.memoryCount > 0" class="text-[#248a3d] inline-flex items-center gap-1">
                              <span class="material-symbols-outlined text-[18px]">check_circle</span> ({{ role.memoryCount }})
                            </span>
                            <span v-else class="material-symbols-outlined text-[18px] text-error">cancel</span>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <button @click="openDocsModal(role)" class="text-xs font-semibold text-primary underline hover:text-[#d4b06a] transition-colors">
                              Ver Mapeo
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </section>

        </div>
      </div>
    </main>

    <!-- Docs Modal -->
    <div v-if="showDocsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest w-full max-w-4xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button @click="showDocsModal = false" class="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
        <h3 class="text-xl font-bold text-on-surface mb-2">Información del Cargo Mapeada</h3>
        <p class="text-secondary font-body-sm text-body-sm mb-6">Mapeo del rol <strong>{{ selectedRole?.name }}</strong> recuperado de la base de conocimiento.</p>
        
        <div class="overflow-y-auto pr-2 flex-1 space-y-6">
          <div v-if="loadingMapping" class="flex flex-col items-center justify-center py-10 text-secondary">
            <span class="material-symbols-outlined text-4xl mb-2 animate-spin">refresh</span>
            Cargando información...
          </div>
          <div v-else-if="!roleMappingData" class="flex flex-col items-center justify-center py-10 text-secondary bg-surface-container-low rounded-xl">
            <span class="material-symbols-outlined text-4xl mb-2">find_in_page</span>
            No hay datos de mapeo registrados para este cargo.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">task_alt</span> Tareas y Responsabilidades</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
                <li v-for="(task, i) in roleMappingData.tasks" :key="'task'+i">{{ task }}</li>
                <li v-if="!roleMappingData.tasks?.length">Ninguna registrada</li>
              </ul>
            </div>

            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">input</span> Entradas / Insumos</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
                <li v-for="(input, i) in roleMappingData.inputs" :key="'input'+i">{{ input }}</li>
                <li v-if="!roleMappingData.inputs?.length">Ninguna registrada</li>
              </ul>
            </div>

            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">output</span> Entregables / Outputs</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
                <li v-for="(out, i) in roleMappingData.outputs" :key="'out'+i">{{ out }}</li>
                <li v-if="!roleMappingData.outputs?.length">Ninguno registrado</li>
              </ul>
            </div>

            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">build</span> Herramientas Utilizadas</h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="(tool, i) in roleMappingData.tools_used" :key="'tool'+i" class="px-2.5 py-1 bg-surface-container border border-surface-container-high rounded-lg text-xs font-medium">{{ tool }}</span>
                <span v-if="!roleMappingData.tools_used?.length" class="text-sm text-secondary">Ninguna registrada</span>
              </div>
            </div>

            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-error text-[18px]">warning</span> Cuellos de Botella</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm text-error">
                <li v-for="(bn, i) in roleMappingData.bottlenecks" :key="'bn'+i">{{ bn }}</li>
                <li v-if="!roleMappingData.bottlenecks?.length" class="text-secondary">Ninguno registrado</li>
              </ul>
            </div>

            <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
              <h4 class="font-label-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-[#2e7d32] text-[18px]">monitoring</span> KPIs Asignados</h4>
              <ul class="list-disc pl-5 space-y-1 text-sm text-[#2e7d32] font-medium">
                <li v-for="(kpi, i) in roleMappingData.kpis" :key="'kpi'+i">{{ kpi }}</li>
                <li v-if="!roleMappingData.kpis?.length" class="text-secondary font-normal">Ninguno registrado</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- 3D Avatar Floating -->
    <div v-if="tab === 'chat'" class="fixed bottom-32 right-12 w-48 h-48 md:w-64 md:h-64 z-[90] pointer-events-none drop-shadow-2xl">
      <OracleAvatar :is-thinking="loading" :is-talking="false" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '../api/supabase';
import OracleAvatar from '../components/OracleAvatar.vue';

const router = useRouter();

const currentQuery = ref('');
const loading = ref(false);
const chatHistory = ref(null);
const dbStatus = ref(true);
const tab = ref('chat');
const panorama = ref([]);
const panoramaLoading = ref(false);
const panoramaLoaded = ref(false);

const showDocsModal = ref(false);
const selectedRole = ref(null);
const loadingMapping = ref(false);
const roleMappingData = ref(null);

const openDocsModal = async (role) => {
  selectedRole.value = role;
  showDocsModal.value = true;
  loadingMapping.value = true;
  roleMappingData.value = null;

  try {
    const { data, error } = await supabase
      .from('role_workflows')
      .select('*')
      .eq('role_id', role.id)
      .single();
    
    if (data && !error) {
      roleMappingData.value = data;
    }
  } catch (err) {
    console.error("Error fetching role mapping:", err);
  } finally {
    loadingMapping.value = false;
  }
};

const messages = ref([
  {
    role: 'ai',
    text: 'Saludos. Soy el Oráculo de PROMETHEUS OS. He indexado la base de conocimiento de la corporación. ¿Qué deseas consultar sobre el ecosistema de la empresa?'
  }
]);

const toggleTab = () => {
  tab.value = tab.value === 'chat' ? 'panorama' : 'chat';
  if (tab.value === 'panorama') {
    loadPanorama();
  }
};

const totalRoles = computed(() => panorama.value.reduce((sum, a) => sum + a.roles.length, 0));
const fullyCoveredRoles = computed(() =>
  panorama.value.reduce((sum, a) => sum + a.roles.filter(r => r.hasMapping && r.hasManual && r.hasKpi && r.memoryCount > 0).length, 0)
);

const loadPanorama = async () => {
  if (panoramaLoaded.value) return;
  panoramaLoading.value = true;
  try {
    const [areasRes, rolesRes, workflowsRes, manualsRes, templatesRes, memoryRes] = await Promise.all([
      supabase.from('areas').select('id,name').order('name'),
      supabase.from('roles').select('id,name,area_id'),
      supabase.from('role_workflows').select('role_id'),
      supabase.from('manuals').select('role_id'),
      supabase.from('kpi_role_templates').select('role_id').not('role_id', 'is', null),
      supabase.from('corporate_memory').select('metadata')
    ]);

    const mappedRoleIds = new Set((workflowsRes.data || []).map(w => w.role_id));
    const manualRoleIds = new Set((manualsRes.data || []).map(m => m.role_id));
    const kpiLinkedRoleIds = new Set((templatesRes.data || []).map(t => t.role_id));

    const memoryCountByRole = {};
    (memoryRes.data || []).forEach(m => {
      const roleId = m.metadata?.role_id;
      if (roleId) memoryCountByRole[roleId] = (memoryCountByRole[roleId] || 0) + 1;
    });

    const roles = rolesRes.data || [];
    const areas = (areasRes.data || []).map(area => {
      const areaRoles = roles
        .filter(r => r.area_id === area.id)
        .map(r => ({
          id: r.id,
          name: r.name,
          hasMapping: mappedRoleIds.has(r.id),
          hasManual: manualRoleIds.has(r.id),
          hasKpi: kpiLinkedRoleIds.has(r.id),
          memoryCount: memoryCountByRole[r.id] || 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const dimensions = areaRoles.length * 4;
      const covered = areaRoles.reduce((sum, r) =>
        sum + (r.hasMapping ? 1 : 0) + (r.hasManual ? 1 : 0) + (r.hasKpi ? 1 : 0) + (r.memoryCount > 0 ? 1 : 0), 0);

      return {
        id: area.id,
        name: area.name,
        roles: areaRoles,
        coveragePct: dimensions > 0 ? Math.round((covered / dimensions) * 100) : 0
      };
    }).filter(a => a.roles.length > 0)
      .sort((a, b) => b.coveragePct - a.coveragePct); // Sort by lowest coverage first

    panorama.value = areas;
    panoramaLoaded.value = true;
  } catch (e) {
    console.error('Error cargando el panorama de conocimiento:', e);
  } finally {
    panoramaLoading.value = false;
  }
};

onMounted(() => {
  // Pre-load panorama in background to have stats ready
  loadPanorama();
});

const scrollToBottom = () => {
  nextTick(() => {
    if (chatHistory.value) {
      chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
    }
  });
};

const sendQuery = async () => {
  const query = currentQuery.value.trim();
  if (!query) return;

  messages.value.push({ role: 'user', text: query });
  currentQuery.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'chat',
        query: query,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    messages.value.push({ role: 'ai', text: data.answer || data.response || "No recibí respuesta del oráculo." });
  } catch (e) {
    console.error('Error querying Oracle:', e);
    messages.value.push({ role: 'ai', text: 'Lo siento, ha ocurrido un error al conectar con la base de conocimiento vectorial. Verifica la consola para más detalles.' });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const formatMessage = (text) => {
  if (!text) return '';
  try {
    const rawHtml = marked(text);
    const purify = DOMPurify.sanitize ? DOMPurify : (DOMPurify.default || {});
    return purify.sanitize ? purify.sanitize(rawHtml) : rawHtml;
  } catch (err) {
    console.error("Markdown parse error:", err);
    return text;
  }
};
</script>

<style scoped>
/* Markdown Styling overrides */
.markdown-body :deep(h1), 
.markdown-body :deep(h2), 
.markdown-body :deep(h3) {
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.markdown-body :deep(p) {
  margin-bottom: 0.75rem;
}
.markdown-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.markdown-body :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}
.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--color-primary);
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid var(--color-surface-container-high);
  padding: 0.5rem;
}
.markdown-body :deep(th) {
  background-color: var(--color-surface-container-low);
  font-weight: 600;
}
</style>

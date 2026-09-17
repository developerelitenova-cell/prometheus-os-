<template>
  <div class="organigrama-view bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen pb-12">
    
    <main class="w-full pt-6 bg-surface">
      <div class="flex flex-col w-full">
        <!-- Section Title & Meta Header -->
        <section class="max-w-7xl mx-auto px-6 lg:px-12 w-full pb-4">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-caption text-caption uppercase tracking-wider">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  Estructura Corporativa Oficial
                </span>
                <span class="font-caption text-caption text-secondary">Actualizado: En tiempo real</span>
              </div>
              <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Organigrama y Estructura
              </h1>
              <p class="font-body-md text-body-md text-secondary max-w-3xl">
                Directorio organizacional, dependencias jerárquicas y base de conocimiento de procesos operacionales en tiempo real (<span class="text-on-surface font-semibold">{{ roles.length }} Nodos</span>).
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 shrink-0">
              <!-- Corporate Config Button — Master Admin only -->
              <button
                v-if="isMaster"
                @click="showCorporateModal = true"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:shadow-md hover:bg-primary/90 transition-all"
              >
                <span class="material-symbols-outlined text-[18px]">corporate_fare</span>
                <span>Configuración Corporativa</span>
              </button>
              <router-link to="/workspace" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:shadow-md transition-all">
                <span class="material-symbols-outlined text-primary-container text-[18px]">arrow_back</span>
                <span>Ir al Workspace</span>
              </router-link>
            </div>
          </div>

          <!-- Interactive Filter & Canvas Toolbar -->
          <div class="bg-surface-container-lowest p-3 rounded-2xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              <!-- Search Input -->
              <div class="relative w-full sm:w-80">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">search</span>
                <input v-model="searchQuery" class="w-full bg-surface-container-low pl-10 pr-4 py-2 rounded-xl text-on-surface font-body-sm text-body-sm placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all" id="node-search" placeholder="Buscar por cargo..." type="text"/>
              </div>
              
              <!-- Filter Dropdown -->
              <div class="relative w-full sm:w-56">
                <select v-model="activeArea" class="w-full appearance-none bg-surface-container-low px-4 py-2 rounded-xl text-on-surface font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all cursor-pointer pr-10" id="area-filter">
                  <option value="all">Todas las Áreas ({{ roles.length }} Nodos)</option>
                  <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            
            <!-- Canvas Navigation Controls -->
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0">
              <div class="flex items-center bg-surface-container-low rounded-xl p-1 gap-1">
                <button @click="zoomOut" class="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Reducir Zoom">
                  <span class="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <span class="px-2 font-caption text-caption font-semibold text-on-surface-variant min-w-[48px] text-center" id="zoom-indicator">{{ Math.round(currentZoom * 100) }}%</span>
                <button @click="zoomIn" class="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Aumentar Zoom">
                  <span class="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <div class="w-px h-4 bg-surface-container-highest mx-0.5"></div>
                <button @click="resetZoom" class="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-lowest transition-all" title="Re-centrar">
                  <span class="material-symbols-outlined text-[18px]">center_focus_strong</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div v-if="loading" class="w-full flex justify-center py-20 text-secondary">
          <p>Cargando nodos...</p>
        </div>

        <!-- Interactive Org Canvas & Drawer Workspace -->
        <section v-else class="max-w-7xl mx-auto px-6 lg:px-12 w-full mt-4 mb-12 relative overflow-hidden">
          <div class="relative bg-surface-container-low rounded-3xl overflow-hidden shadow-sm flex min-h-[820px]">
            
            <!-- Flow Board Area -->
            <div class="flex-1 overflow-auto p-10 cursor-grab active:cursor-grabbing relative" id="chart-viewport" @mousedown="startPan" @mousemove="pan" @mouseup="endPan" @mouseleave="endPan">
              <div class="absolute inset-0 bg-[radial-gradient(#d1c5b6_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
              
              <div :style="{ transform: `scale(${currentZoom}) translate(${panX}px, ${panY}px)` }" class="relative flex flex-col items-center min-w-[1100px] transition-transform duration-100 origin-top" id="canvas-content">
                
                <!-- LEVEL 1: DIRECCIÓN EJECUTIVA -->
                <div v-if="level1Roles.length > 0" class="relative flex flex-col items-center z-20">
                  <div class="flex gap-12">
                    <div v-for="role in level1Roles" :key="role.id" class="node-card group bg-surface-container-lowest rounded-2xl shadow-sm p-4 w-64 hover:shadow-md transition-all relative cursor-pointer" @click="selectRole(role)">
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-caption font-semibold">
                          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Nivel 1 • Activo
                        </span>
                        <span class="font-caption text-caption text-secondary">EN-{{ role.id.substring(0, 3).toUpperCase() }}</span>
                      </div>
                      <div class="space-y-0.5 mb-3">
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">{{ role.name }}</h3>
                        <p class="font-caption text-caption text-primary-container font-semibold tracking-wide uppercase">{{ role.areas?.name || 'Dirección' }}</p>
                      </div>
                      <div class="flex items-center gap-3 pt-3 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                        <div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {{ role.name?.substring(0, 2).toUpperCase() }}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="font-label-sm text-label-sm text-on-surface font-semibold truncate">Posición Core</span>
                          <span class="font-caption text-caption text-secondary">{{ mappedRoleIds.has(role.id) ? 'Flujo Mapeado' : 'Sin Mapear' }}</span>
                        </div>
                      </div>
                      <!-- Master Admin quick-edit overlay -->
                      <div v-if="isMaster" class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 flex gap-1">
                        <button @click.stop="openEditRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-primary hover:bg-primary/10 transition-all" title="Editar cargo">
                          <span class="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button @click.stop="confirmDeleteRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-error hover:bg-error/10 transition-all" title="Eliminar cargo">
                          <span class="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-2 -bottom-4 z-30 flex items-center justify-center gap-2 pointer-events-none">
                        <span class="px-2.5 py-1 rounded-full bg-inverse-surface text-inverse-on-surface font-caption text-caption shadow-md inline-flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px] text-tertiary-fixed">visibility</span> Abrir Ficha
                        </span>
                      </div>
                    </div>
                  </div>
                  <!-- Stem line dropping from CEO -->
                  <div class="w-0.5 h-10 bg-surface-container-highest"></div>
                </div>

                <!-- LEVEL 2 CONNECTOR SVG -->
                <div v-if="areasList.length > 0 && level1Roles.length > 0" class="w-full flex justify-center -mt-0.5 z-10 pointer-events-none">
                  <svg class="overflow-visible stroke-surface-container-highest" fill="none" height="40" :width="Math.max(200, (areasList.length - 1) * 260)">
                    <path :d="`M 0 20 H ${Math.max(200, (areasList.length - 1) * 260)}`" stroke-width="2"></path>
                    <path v-for="(area, i) in areasList" :key="'drop'+i" :d="`M ${i * 260} 20 V 40`" stroke-width="2"></path>
                    <path :d="`M ${(Math.max(200, (areasList.length - 1) * 260)) / 2} 0 V 20`" stroke-width="2"></path>
                  </svg>
                </div>

                <!-- LEVEL 2 & 3 GRIDS BY AREA -->
                <div class="flex gap-6 w-auto justify-center z-20 pt-2">
                  <div v-for="area in areasList" :key="area" class="flex flex-col items-center w-60">
                    
                    <!-- L2 Roles for this area -->
                    <div class="flex flex-col items-center gap-4 w-full">
                      <div v-for="role in getRolesByLevelAndArea(2, area)" :key="role.id" class="node-card group bg-surface-container-lowest rounded-2xl shadow-sm p-4 w-full hover:shadow-md transition-all relative cursor-pointer" @click="selectRole(role)">
                        <div class="flex items-center justify-between gap-2 mb-2">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary font-caption text-caption font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Nivel 2
                          </span>
                        </div>
                        <div class="space-y-0.5 mb-3">
                          <h4 class="font-label-md text-label-md text-on-surface font-bold">{{ role.name }}</h4>
                          <p class="font-caption text-caption text-primary-container font-semibold uppercase">{{ role.areas?.name }}</p>
                        </div>
                        <div class="flex items-center gap-2.5 pt-2.5 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                          <div class="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-secondary shrink-0">L2</div>
                          <div class="flex flex-col min-w-0">
                            <span class="font-label-sm text-label-sm text-on-surface font-semibold truncate">{{ mappedRoleIds.has(role.id) ? 'Flujo Mapeado' : 'Sin Mapear' }}</span>
                          </div>
                        </div>
                        <!-- Master Admin quick-edit overlay -->
                        <div v-if="isMaster" class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 flex gap-1">
                          <button @click.stop="openEditRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-primary hover:bg-primary/10 transition-all" title="Editar cargo">
                            <span class="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button @click.stop="confirmDeleteRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-error hover:bg-error/10 transition-all" title="Eliminar cargo">
                            <span class="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Connection Line to Level 3 -->
                    <div v-if="getRolesByLevelAndArea(3, area).length > 0" class="w-0.5 h-12 bg-surface-container-highest"></div>

                    <!-- L3 Roles for this area -->
                    <div class="flex flex-col items-center gap-4 w-full mt-2">
                      <div v-for="role in getRolesByLevelAndArea(3, area)" :key="role.id" class="node-card group bg-surface-container-lowest rounded-2xl shadow-sm p-3.5 w-full hover:shadow-md transition-all relative cursor-pointer" @click="selectRole(role)">
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="px-1.5 py-0.5 rounded bg-surface-container-low text-secondary font-caption text-caption">Nivel 3</span>
                        </div>
                        <h5 class="font-label-md text-label-md font-bold text-on-surface leading-tight">{{ role.name }}</h5>
                        <div class="flex items-center gap-2 pt-2 bg-surface-container-low/40 -mx-3.5 -mb-3.5 px-3 py-2 rounded-b-2xl mt-2">
                          <div class="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-caption text-caption font-bold">L3</div>
                          <span class="font-body-sm text-body-sm text-secondary truncate">{{ mappedRoleIds.has(role.id) ? 'Mapeado' : 'Sin Mapear' }}</span>
                        </div>
                        <!-- Master Admin quick-edit overlay -->
                        <div v-if="isMaster" class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-30 flex gap-1">
                          <button @click.stop="openEditRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-primary hover:bg-primary/10 transition-all" title="Editar cargo">
                            <span class="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button @click.stop="confirmDeleteRole(role)" class="p-1 rounded-lg bg-surface-container-highest/90 text-secondary hover:text-error hover:bg-error/10 transition-all" title="Eliminar cargo">
                            <span class="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            <!-- Slide-in Details Drawer for Cargo Seleccionado -->
            <aside 
              :class="['bg-surface-container-lowest shadow-xl flex flex-col transition-all duration-300 transform relative z-30 shrink-0 border-l border-surface-container-high', drawerOpen ? 'translate-x-0 w-full sm:w-[420px] max-w-full opacity-100' : 'translate-x-full w-0 opacity-0 overflow-hidden border-none']" 
            >
              <!-- Drawer Header -->
              <div class="p-6 bg-surface-container-low/50 flex items-center justify-between border-b border-surface-container">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div>
                    <span class="font-caption text-caption text-secondary uppercase tracking-wider block">Ficha de Posición</span>
                    <span class="font-label-md text-label-md font-bold text-on-surface">ID: EN-{{ selectedRole?.id?.substring(0,4).toUpperCase() }}</span>
                  </div>
                </div>
                <button class="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-all" @click="closeDrawer" title="Cerrar panel">
                  <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <!-- Drawer Body -->
              <div class="p-6 overflow-y-auto space-y-6 flex-1">
                <div v-if="selectedRole">
                  <!-- Role Main Title -->
                  <div class="space-y-1 mb-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-caption font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Nivel {{ selectedRole.access_level }} • {{ mappedRoleIds.has(selectedRole.id) ? 'Mapeado' : 'Sin Mapear' }}
                    </span>
                    <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight mt-2 leading-snug">{{ selectedRole.name }}</h2>
                    <p class="font-label-md text-label-md text-primary-container font-medium">{{ selectedRole.areas?.name || 'Área General' }}</p>
                  </div>

                  <!-- Actions -->
                  <div class="space-y-2 mb-6">
                    <router-link :to="`/mapper/${selectedRole.id}`" class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all shadow-sm">
                      <span class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">account_tree</span>
                        {{ mappedRoleIds.has(selectedRole.id) ? 'Editar Mapeo de Flujo' : 'Mapear Cadena Operativa' }}
                      </span>
                      <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </router-link>
                    <!-- Quick edit from drawer (Master Admin) -->
                    <button v-if="isMaster" @click="openEditRole(selectedRole)" class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all">
                      <span class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                        Editar / Mover Cargo
                      </span>
                      <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>

                  <hr class="border-surface-container-high my-6">

                  <!-- Daily Management Section -->
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-label-md text-label-md font-bold text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[18px]">checklist</span>
                        Gestión Diaria (Memoria Consciente)
                      </h4>
                      <p class="font-caption text-caption text-secondary mt-1 leading-relaxed">
                        Estas tareas alimentarán directamente la bandeja de pendientes del colaborador para asegurar el seguimiento diario.
                      </p>
                    </div>

                    <div v-if="loadingRoleTasks" class="text-sm text-secondary">Cargando tareas...</div>
                    <div v-else class="space-y-5">
                      
                      <!-- Tasks Grouped by frequency -->
                      <div v-for="freq in FREQUENCIES" :key="freq" class="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden">
                        <div class="bg-surface-container-low px-3 py-2 font-label-sm text-label-sm font-semibold text-on-surface-variant flex items-center justify-between">
                          {{ FREQUENCY_LABELS[freq] }}
                          <span class="bg-surface-container-highest text-secondary px-2 rounded-full text-[10px]">{{ tasksByFrequency[freq].length }}</span>
                        </div>
                        
                        <ul class="divide-y divide-surface-container-high">
                          <li v-for="task in tasksByFrequency[freq]" :key="task.id" class="p-3 hover:bg-surface-container/30 transition-colors" :class="{ 'opacity-50': !task.active }">
                            <div class="flex justify-between items-start gap-2">
                              <div>
                                <span class="font-label-sm text-label-sm text-on-surface font-medium block">{{ task.title }}</span>
                                <p v-if="task.description" class="font-caption text-caption text-secondary mt-0.5">{{ task.description }}</p>
                              </div>
                              <div v-if="canManageTasks" class="flex items-center gap-1 shrink-0">
                                <button @click="toggleTaskActive(task)" class="p-1 rounded text-secondary hover:bg-surface-container hover:text-on-surface transition-colors" :title="task.active ? 'Desactivar' : 'Activar'">
                                  <span class="material-symbols-outlined text-[14px]">{{ task.active ? 'visibility_off' : 'visibility' }}</span>
                                </button>
                                <button @click="deleteRoleTask(task)" class="p-1 rounded text-error hover:bg-error-container transition-colors" title="Eliminar">
                                  <span class="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              </div>
                            </div>
                          </li>
                          <li v-if="tasksByFrequency[freq].length === 0" class="p-3 text-center text-secondary font-caption text-caption italic">
                            Sin tareas registradas
                          </li>
                        </ul>
                      </div>

                      <!-- Add New Task Form -->
                      <form v-if="canManageTasks" @submit.prevent="addRoleTask" class="mt-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-highest">
                        <span class="font-label-sm text-label-sm text-on-surface font-bold mb-3 block">Inyectar nueva tarea a la memoria</span>
                        <div class="space-y-2">
                          <input type="text" v-model="newRoleTask.title" placeholder="Ej: Reporte de Cierre" required class="w-full bg-surface-container-lowest px-3 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"/>
                          <input type="text" v-model="newRoleTask.description" placeholder="Instrucciones breves (Opcional)" class="w-full bg-surface-container-lowest px-3 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"/>
                          
                          <div class="flex gap-2">
                            <select v-model="newRoleTask.frequency" class="flex-1 bg-surface-container-lowest px-2 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none">
                              <option value="daily">Diario</option>
                              <option value="weekly">Semanal</option>
                              <option value="monthly">Mensual</option>
                            </select>
                            <select v-model="newRoleTask.priority" class="w-24 bg-surface-container-lowest px-2 py-1.5 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none">
                              <option value="high">Alta</option>
                              <option value="medium">Media</option>
                              <option value="low">Baja</option>
                            </select>
                          </div>
                          <button type="submit" :disabled="savingRoleTask" class="w-full mt-2 bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm py-2 rounded-lg hover:bg-on-surface transition-colors">
                            {{ savingRoleTask ? 'Guardando...' : 'Agregar Tarea' }}
                          </button>
                        </div>
                      </form>

                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <!-- Governance Footprint -->
        <section class="max-w-7xl mx-auto px-6 lg:px-12 w-full pb-8">
          <div class="bg-surface-container-lowest p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-surface-container">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span class="material-symbols-outlined text-[22px]">policy</span>
              </div>
              <div>
                <h4 class="font-label-md text-label-md font-bold text-on-surface">Marco de Gobernanza de Prometeus OS</h4>
                <p class="font-caption text-caption text-secondary">La alteración de la memoria consciente requiere auditoría.</p>
              </div>
            </div>
            <div class="flex items-center gap-6 shrink-0">
              <div class="flex items-center gap-2 text-secondary font-caption text-caption">
                <span class="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                <span>{{ roles.length }} Posiciones Auditables</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- =====================================================
         CORPORATE CONFIG MODAL — Master Admin Only
    ====================================================== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCorporateModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" @click.self="closeCorporateModal">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <!-- Modal Panel -->
          <div class="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-surface-container-lowest border border-surface-container-high">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-5 bg-surface-container-low border-b border-surface-container">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-on-primary text-[20px]">corporate_fare</span>
                </div>
                <div>
                  <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Configuración Corporativa</h2>
                  <p class="font-caption text-caption text-secondary">Gestión del organigrama en tiempo real</p>
                </div>
              </div>
              <button @click="closeCorporateModal" class="p-2 rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container transition-all">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Tab Bar -->
            <div class="flex border-b border-surface-container px-6 bg-surface-container-low/30">
              <button
                v-for="tab in corporateTabs"
                :key="tab.id"
                @click="corporateTab = tab.id"
                class="flex items-center gap-2 px-4 py-3.5 font-label-md text-label-md transition-all border-b-2 -mb-px"
                :class="corporateTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'"
              >
                <span class="material-symbols-outlined text-[17px]">{{ tab.icon }}</span>
                {{ tab.label }}
              </button>
            </div>

            <!-- Notification Banner -->
            <Transition name="fade-slide">
              <div v-if="corpNotification.message" class="mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium"
                :class="corpNotification.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'">
                <span class="material-symbols-outlined text-[18px]">{{ corpNotification.type === 'success' ? 'check_circle' : 'error' }}</span>
                {{ corpNotification.message }}
              </div>
            </Transition>

            <!-- Modal Body — Scrollable -->
            <div class="flex-1 overflow-y-auto p-6">

              <!-- TAB: Añadir Cargo -->
              <div v-if="corporateTab === 'add'" class="space-y-5">
                <p class="font-body-sm text-body-sm text-secondary">Crea un nuevo cargo y asígnalo al área y nivel jerárquico que corresponda.</p>
                
                <form @submit.prevent="addRole" class="space-y-4">
                  <!-- Nombre del cargo -->
                  <div class="space-y-1.5">
                    <label class="font-label-sm text-label-sm font-semibold text-on-surface">Nombre del Cargo <span class="text-error">*</span></label>
                    <input
                      v-model="newRole.name"
                      required
                      type="text"
                      placeholder="Ej: Gerente de Operaciones"
                      class="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-on-surface font-body-sm text-body-sm border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  <!-- Área -->
                  <div class="space-y-1.5">
                    <label class="font-label-sm text-label-sm font-semibold text-on-surface">Área <span class="text-error">*</span></label>
                    <div class="relative">
                      <select
                        v-model="newRole.area_id"
                        required
                        class="w-full appearance-none bg-surface-container-low px-4 py-2.5 rounded-xl text-on-surface font-body-sm text-body-sm border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all pr-10 cursor-pointer"
                      >
                        <option value="">— Seleccionar Área —</option>
                        <option v-for="a in areasWithId" :key="a.id" :value="a.id">{{ a.name }}</option>
                      </select>
                      <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">expand_more</span>
                    </div>
                  </div>

                  <!-- Nivel de Acceso -->
                  <div class="space-y-1.5">
                    <label class="font-label-sm text-label-sm font-semibold text-on-surface">Nivel Jerárquico <span class="text-error">*</span></label>
                    <div class="grid grid-cols-3 gap-3">
                      <label
                        v-for="lvl in [1, 2, 3]"
                        :key="lvl"
                        class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all"
                        :class="newRole.access_level === lvl
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-surface-container-high bg-surface-container-low text-secondary hover:border-surface-container-highest'"
                      >
                        <input type="radio" v-model="newRole.access_level" :value="lvl" class="sr-only" />
                        <span class="font-headline-sm text-headline-sm font-bold">{{ lvl }}</span>
                        <span class="font-caption text-caption text-center leading-tight">
                          {{ lvl === 1 ? 'Ejecutivo' : lvl === 2 ? 'Gerencial' : 'Operativo' }}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    :disabled="savingRole"
                    class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all disabled:opacity-60 mt-2"
                  >
                    <span v-if="savingRole" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span class="material-symbols-outlined text-[18px]" v-else>add_circle</span>
                    {{ savingRole ? 'Creando Cargo...' : 'Crear Cargo' }}
                  </button>
                </form>
              </div>

              <!-- TAB: Editar / Mover Cargo -->
              <div v-if="corporateTab === 'edit'" class="space-y-4">
                <p class="font-body-sm text-body-sm text-secondary">Selecciona un cargo para editar su nombre, moverlo a otra área o cambiar su nivel jerárquico.</p>
                
                <!-- Inline edit form (shown when a role is selected for editing) -->
                <div v-if="editingRole" class="bg-surface-container-low rounded-2xl border border-primary/30 p-4 space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="font-label-md text-label-md font-bold text-primary flex items-center gap-2">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                      Editando: {{ editingRole.name }}
                    </span>
                    <button @click="editingRole = null" class="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-all">
                      <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div class="space-y-3">
                    <!-- Nombre -->
                    <div class="space-y-1">
                      <label class="font-label-sm text-label-sm font-semibold text-on-surface">Nombre del Cargo</label>
                      <input
                        v-model="editForm.name"
                        type="text"
                        class="w-full bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                    <!-- Área -->
                    <div class="space-y-1">
                      <label class="font-label-sm text-label-sm font-semibold text-on-surface">Área</label>
                      <div class="relative">
                        <select
                          v-model="editForm.area_id"
                          class="w-full appearance-none bg-surface-container-lowest px-3 py-2 rounded-lg text-on-surface font-body-sm text-body-sm border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-8 cursor-pointer"
                        >
                          <option v-for="a in areasWithId" :key="a.id" :value="a.id">{{ a.name }}</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[16px]">expand_more</span>
                      </div>
                    </div>
                    <!-- Nivel -->
                    <div class="space-y-1">
                      <label class="font-label-sm text-label-sm font-semibold text-on-surface">Nivel Jerárquico</label>
                      <div class="flex gap-2">
                        <label
                          v-for="lvl in [1, 2, 3]"
                          :key="lvl"
                          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 cursor-pointer transition-all font-label-sm text-label-sm font-semibold"
                          :class="editForm.access_level === lvl
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-surface-container-highest bg-surface-container-lowest text-secondary hover:border-surface-container-high'"
                        >
                          <input type="radio" v-model="editForm.access_level" :value="lvl" class="sr-only" />
                          Nivel {{ lvl }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 pt-1">
                    <button @click="editingRole = null" class="flex-1 py-2 rounded-xl bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-all">
                      Cancelar
                    </button>
                    <button
                      @click="saveEditRole"
                      :disabled="savingRole"
                      class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary/90 transition-all disabled:opacity-60"
                    >
                      <span v-if="savingRole" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      {{ savingRole ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </div>

                <!-- Roles list -->
                <div class="space-y-2">
                  <div
                    v-for="role in roles"
                    :key="role.id"
                    class="flex items-center justify-between p-3 rounded-xl border transition-all"
                    :class="editingRole?.id === role.id
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-surface-container-high bg-surface-container-low hover:bg-surface-container'"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span
                          class="w-2 h-2 rounded-full"
                          :class="role.access_level === 1 ? 'bg-primary' : role.access_level === 2 ? 'bg-secondary' : 'bg-surface-container-highest'"
                        ></span>
                        <span class="font-caption text-caption text-secondary whitespace-nowrap">Nv.{{ role.access_level }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="font-label-sm text-label-sm font-semibold text-on-surface truncate">{{ role.name }}</p>
                        <p class="font-caption text-caption text-secondary truncate">{{ role.areas?.name || '—' }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        @click="openEditRole(role)"
                        class="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-all"
                        title="Editar"
                      >
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        @click="confirmDeleteRole(role)"
                        class="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error/10 transition-all"
                        title="Eliminar"
                      >
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div v-if="roles.length === 0" class="text-center py-8 text-secondary font-body-sm text-body-sm">
                    No hay cargos registrados.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- =====================================================
         CONFIRM DELETE MODAL
    ====================================================== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="roleToDelete" class="fixed inset-0 z-[10000] flex items-center justify-center p-4" @click.self="roleToDelete = null">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-sm rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-6 space-y-5">
            <div class="flex flex-col items-center text-center gap-3">
              <div class="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-error text-[28px]">warning</span>
              </div>
              <div>
                <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface">Eliminar Cargo</h3>
                <p class="font-body-sm text-body-sm text-secondary mt-2">
                  ¿Confirmas la eliminación de <strong class="text-on-surface">{{ roleToDelete.name }}</strong>?
                  Esta acción no se puede deshacer y puede afectar a colaboradores asignados a este cargo.
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              <button @click="roleToDelete = null" class="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all">
                Cancelar
              </button>
              <button
                @click="deleteRole"
                :disabled="savingRole"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-error text-on-error font-label-md text-label-md hover:bg-error/90 transition-all disabled:opacity-60"
              >
                <span v-if="savingRole" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                {{ savingRole ? 'Eliminando...' : 'Sí, Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../api/supabase';
import { FREQUENCIES, FREQUENCY_LABELS } from '../utils/taskPeriods';

// Base reactive state
const roles = ref([]);
const loading = ref(true);
const activeArea = ref('all');
const searchQuery = ref('');
const mappedRoleIds = ref(new Set());

// Drawer & Selection state
const selectedRole = ref(null);
const drawerOpen = ref(false);

// Zoom and Pan state
const currentZoom = ref(1);
const panX = ref(0);
const panY = ref(0);
let isPanning = false;
let startX = 0;
let startY = 0;

// User session state
const currentProfile = ref(null);
const isMaster = computed(() => !!currentProfile.value?.is_master_admin);
const leaderAreaId = computed(() => currentProfile.value?.roles?.area_id || null);

const fetchCurrentProfile = async () => {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return;
  const { data } = await supabase
    .from('profiles')
    .select('is_master_admin, roles(area_id, access_level)')
    .eq('id', userId)
    .single();
  currentProfile.value = data || null;
};

// Fetch roles
const fetchRoles = async () => {
  loading.value = true;
  try {
    let query = supabase.from('roles').select('*, areas(name)');
    if (!isMaster.value && leaderAreaId.value) {
      query = query.eq('area_id', leaderAreaId.value);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching nodes:', error);
    } else {
      const uniqueRoles = [];
      const seenNames = new Set();
      for (const r of (data || [])) {
        if (!seenNames.has(r.name)) {
          seenNames.add(r.name);
          uniqueRoles.push(r);
        }
      }
      roles.value = uniqueRoles.sort((a, b) => (a.areas?.name || '').localeCompare(b.areas?.name || ''));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    loading.value = false;
  }
};

const fetchMappedRoleIds = async () => {
  const { data, error } = await supabase.from('role_workflows').select('role_id');
  if (!error && data) {
    mappedRoleIds.value = new Set(data.map((w) => w.role_id));
  }
};

// Areas with IDs for selects
const areasWithId = ref([]);
const fetchAreas = async () => {
  const { data, error } = await supabase.from('areas').select('id, name').order('name');
  if (!error && data) {
    areasWithId.value = data;
  }
};

onMounted(async () => {
  await fetchCurrentProfile();
  await fetchRoles();
  await fetchAreas();
  fetchMappedRoleIds();
});

// Filtering and Grouping Logic
const filteredRoles = computed(() => {
  let result = roles.value;
  if (activeArea.value !== 'all') {
    result = result.filter(r => (r.areas?.name || 'General') === activeArea.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(r => r.name.toLowerCase().includes(q) || (r.areas?.name || '').toLowerCase().includes(q));
  }
  return result;
});

const areas = computed(() => {
  const allAreas = roles.value.map(r => r.areas?.name).filter(a => a);
  return [...new Set(allAreas)].sort();
});

const level1Roles = computed(() => filteredRoles.value.filter(r => r.access_level === 1));

const areasList = computed(() => {
  const l2l3 = filteredRoles.value.filter(r => r.access_level === 2 || r.access_level === 3);
  const relevantAreas = l2l3.map(r => r.areas?.name || 'General').filter(a => a);
  return [...new Set(relevantAreas)].sort();
});

const getRolesByLevelAndArea = (level, areaName) => {
  return filteredRoles.value.filter(r => r.access_level === level && (r.areas?.name || 'General') === areaName);
};

// Zoom / Pan
const zoomIn = () => { if (currentZoom.value < 1.5) currentZoom.value += 0.1; };
const zoomOut = () => { if (currentZoom.value > 0.5) currentZoom.value -= 0.1; };
const resetZoom = () => { currentZoom.value = 1; panX.value = 0; panY.value = 0; };

const startPan = (e) => { isPanning = true; startX = e.clientX - panX.value; startY = e.clientY - panY.value; };
const pan = (e) => { if (!isPanning) return; panX.value = e.clientX - startX; panY.value = e.clientY - startY; };
const endPan = () => { isPanning = false; };

const selectRole = async (role) => {
  selectedRole.value = role;
  drawerOpen.value = true;
  await fetchRoleTasks(role.id);
};

const closeDrawer = () => {
  drawerOpen.value = false;
  setTimeout(() => { selectedRole.value = null; }, 300);
};

// ========================================================
// CORPORATE CONFIG MODAL — State & Logic
// ========================================================

const showCorporateModal = ref(false);
const corporateTab = ref('add');
const savingRole = ref(false);
const roleToDelete = ref(null);
const editingRole = ref(null);

const corporateTabs = [
  { id: 'add',  label: 'Añadir Cargo',   icon: 'add_circle' },
  { id: 'edit', label: 'Editar / Mover', icon: 'edit_note' },
];

// Notification state
const corpNotification = ref({ message: '', type: 'success' });
let notifTimer = null;

const showNotif = (message, type = 'success') => {
  clearTimeout(notifTimer);
  corpNotification.value = { message, type };
  notifTimer = setTimeout(() => { corpNotification.value = { message: '', type: 'success' }; }, 4000);
};

// New Role form
const newRole = ref({ name: '', area_id: '', access_level: 2 });

// Edit form
const editForm = ref({ name: '', area_id: '', access_level: 2 });

const closeCorporateModal = () => {
  showCorporateModal.value = false;
  editingRole.value = null;
  corpNotification.value = { message: '', type: 'success' };
};

const openEditRole = (role) => {
  // If called from the canvas, open the modal on the edit tab
  if (!showCorporateModal.value) {
    showCorporateModal.value = true;
    corporateTab.value = 'edit';
  } else {
    corporateTab.value = 'edit';
  }
  editingRole.value = role;
  editForm.value = {
    name: role.name,
    area_id: role.area_id,
    access_level: role.access_level,
  };
};

// CREATE role
const addRole = async () => {
  if (!newRole.value.name.trim() || !newRole.value.area_id) return;
  savingRole.value = true;
  try {
    const { error } = await supabase.from('roles').insert({
      name: newRole.value.name.trim(),
      area_id: newRole.value.area_id,
      access_level: newRole.value.access_level,
    });
    if (error) throw error;
    showNotif(`Cargo "${newRole.value.name.trim()}" creado exitosamente.`, 'success');
    newRole.value = { name: '', area_id: '', access_level: 2 };
    await fetchRoles();
  } catch (err) {
    showNotif('Error al crear el cargo: ' + err.message, 'error');
  } finally {
    savingRole.value = false;
  }
};

// UPDATE role
const saveEditRole = async () => {
  if (!editingRole.value || !editForm.value.name.trim()) return;
  savingRole.value = true;
  try {
    const { error } = await supabase
      .from('roles')
      .update({
        name: editForm.value.name.trim(),
        area_id: editForm.value.area_id,
        access_level: editForm.value.access_level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingRole.value.id);
    if (error) throw error;
    showNotif(`Cargo actualizado correctamente.`, 'success');
    editingRole.value = null;
    await fetchRoles();
  } catch (err) {
    showNotif('Error al guardar cambios: ' + err.message, 'error');
  } finally {
    savingRole.value = false;
  }
};

// CONFIRM DELETE
const confirmDeleteRole = (role) => {
  roleToDelete.value = role;
  // Close corporate modal to show the confirmation over the canvas
  showCorporateModal.value = false;
};

// DELETE role
const deleteRole = async () => {
  if (!roleToDelete.value) return;
  savingRole.value = true;
  try {
    const { error } = await supabase.from('roles').delete().eq('id', roleToDelete.value.id);
    if (error) throw error;
    // If deleted role was open in drawer, close it
    if (selectedRole.value?.id === roleToDelete.value.id) closeDrawer();
    roleToDelete.value = null;
    await fetchRoles();
  } catch (err) {
    alert('No se pudo eliminar el cargo: ' + err.message);
    savingRole.value = false;
  } finally {
    savingRole.value = false;
  }
};

// ========================================================
// GESTIÓN DIARIA (memoria del cargo)
// ========================================================
const roleTasks = ref([]);
const loadingRoleTasks = ref(false);
const savingRoleTask = ref(false);
const newRoleTask = ref({ title: '', description: '', frequency: 'daily', priority: 'medium' });

const canManageTasks = computed(() => {
  if (isMaster.value) return true;
  if (!selectedRole.value || !leaderAreaId.value) return false;
  return selectedRole.value.area_id === leaderAreaId.value;
});

const tasksByFrequency = computed(() => {
  const grouped = { daily: [], weekly: [], monthly: [] };
  for (const t of roleTasks.value) {
    if (grouped[t.frequency]) grouped[t.frequency].push(t);
  }
  return grouped;
});

const fetchRoleTasks = async (roleId) => {
  loadingRoleTasks.value = true;
  try {
    const { data, error } = await supabase
      .from('role_task_templates')
      .select('*')
      .eq('role_id', roleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    roleTasks.value = data || [];
  } catch (err) {
    console.error('Error cargando tareas:', err);
    roleTasks.value = [];
  } finally {
    loadingRoleTasks.value = false;
  }
};

const addRoleTask = async () => {
  if (!selectedRole.value || !newRoleTask.value.title.trim()) return;
  savingRoleTask.value = true;
  try {
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from('role_task_templates').insert({
      role_id: selectedRole.value.id,
      title: newRoleTask.value.title.trim(),
      description: newRoleTask.value.description.trim() || null,
      frequency: newRoleTask.value.frequency,
      priority: newRoleTask.value.priority,
      created_by: session?.session?.user?.id || null
    });
    if (error) throw error;
    newRoleTask.value = { title: '', description: '', frequency: 'daily', priority: 'medium' };
    await fetchRoleTasks(selectedRole.value.id);
  } catch (err) {
    alert('No se pudo agregar: ' + err.message);
  } finally {
    savingRoleTask.value = false;
  }
};

const toggleTaskActive = async (task) => {
  const previous = task.active;
  task.active = !previous;
  try {
    const { error } = await supabase
      .from('role_task_templates')
      .update({ active: task.active, updated_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) throw error;
  } catch (err) {
    task.active = previous;
  }
};

const deleteRoleTask = async (task) => {
  if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
  try {
    const { error } = await supabase.from('role_task_templates').delete().eq('id', task.id);
    if (error) throw error;
    roleTasks.value = roleTasks.value.filter((t) => t.id !== task.id);
  } catch (err) {
    alert('No se pudo eliminar: ' + err.message);
  }
};
</script>

<style scoped>
.node-card {
  border: 1px solid rgba(0,0,0,0.03);
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-active .relative.w-full,
.modal-fade-leave-active .relative.w-full {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative.w-full,
.modal-fade-leave-to .relative.w-full {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

/* Notification transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<template>
  <div class="bg-surface font-body-md text-body-md text-on-surface antialiased">
    <main class="w-full pt-20 bg-surface min-h-screen">
      
      <!-- Loader -->
      <div v-if="loading" class="flex flex-col items-center justify-center pt-32">
        <span class="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <p class="text-secondary mt-4 font-label-md">Cargando Módulo HR...</p>
      </div>

      <!-- Access Denied -->
      <div v-else-if="!hasAccess" class="flex flex-col items-center justify-center pt-32">
        <span class="material-symbols-outlined text-6xl text-danger mb-4">block</span>
        <h2 class="text-2xl font-bold">Acceso Restringido</h2>
        <p class="text-secondary mt-2">Este módulo es exclusivo para la Gerencia de Auditoría, Recursos Humanos y roles autorizados para provisión de credenciales.</p>
        <button @click="$router.back()" class="mt-6 px-6 py-2 bg-primary text-white rounded-lg">Volver</button>
      </div>

      <!-- HR Module -->
      <div v-else class="flex flex-col w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-xl">
        <div class="mb-space-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="font-headline-lg text-headline-lg font-semibold text-on-surface tracking-tight">Gestión de Cuentas y Personal Corporativo</h1>
            <p class="text-secondary mt-1">Control de Accesos, Asignación de Contraseñas y Contratos — Supervisado por Gerencia de Auditoría</p>
          </div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold">
            <span class="material-symbols-outlined text-[16px]">verified_user</span>
            Control de Credenciales Corporativas
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 border-b border-surface-container-high mb-space-xl overflow-x-auto no-scrollbar whitespace-nowrap">
          <button @click="activeTab = 'employees'" class="pb-3 px-2 font-label-lg transition-colors border-b-2" :class="activeTab === 'employees' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-on-surface'">
            Usuarios y Personal
            <span v-if="pendingUsers.length > 0" class="ml-2 bg-amber-500 text-black font-bold text-xs px-2 py-0.5 rounded-full">{{ pendingUsers.length }}</span>
          </button>
          <button @click="activeTab = 'contracts'" class="pb-3 px-2 font-label-lg transition-colors border-b-2" :class="activeTab === 'contracts' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-on-surface'">
            Contratos Legales
          </button>
          <button @click="activeTab = 'news'" class="pb-3 px-2 font-label-lg transition-colors border-b-2" :class="activeTab === 'news' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-on-surface'">
            Noticias & Flyers
          </button>
        </div>

        <!-- Tab 1: Usuarios y Personal -->
        <div v-if="activeTab === 'employees'" class="flex flex-col gap-6">
          <!-- Action Bar -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm">
            <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div class="relative w-full sm:w-72">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar colaborador o cargo..."
                  class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-surface-container-low outline-none focus:border-primary"
                />
              </div>
              <select v-model="statusFilter" class="w-full sm:w-auto p-2 text-sm rounded-xl border bg-surface-container-low outline-none">
                <option value="all">Todos los estados</option>
                <option value="approved">Activos</option>
                <option value="suspended">Suspendidos</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>

            <button
              @click="openCreateModal"
              class="w-full sm:w-auto px-4 py-2.5 bg-primary text-white rounded-xl font-label-md font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
            >
              <span class="material-symbols-outlined text-[20px]">person_add</span>
              Asignar Nueva Cuenta
            </button>
          </div>

          <!-- Pending Approvals Alert Banner (si hay solicitudes residuales) -->
          <div v-if="pendingUsers.length > 0" class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2 text-amber-700 font-semibold">
                <span class="material-symbols-outlined">warning</span>
                <span>Hay {{ pendingUsers.length }} cuenta(s) pendiente(s) de activación</span>
              </div>
              <button @click="showPendingSection = !showPendingSection" class="text-xs text-amber-800 underline font-medium">
                {{ showPendingSection ? 'Ocultar' : 'Ver solicitudes' }}
              </button>
            </div>

            <div v-if="showPendingSection" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div v-for="user in pendingUsers" :key="user.id" class="p-3 bg-surface-container-lowest rounded-xl border border-amber-300 flex justify-between items-center shadow-xs">
                <div class="flex flex-col">
                  <span class="font-semibold text-sm">{{ user.full_name }}</span>
                  <span class="text-secondary text-xs">{{ user.email || 'Sin correo asignado' }}</span>
                </div>
                <div class="flex gap-2">
                  <button @click="updateStatus(user.id, 'approved')" class="px-3 py-1 bg-[#2e7d32] text-white text-xs rounded-lg font-medium flex items-center gap-1 hover:bg-[#1b5e20]">
                    <span class="material-symbols-outlined text-[16px]">check</span> Activar
                  </button>
                  <button @click="updateStatus(user.id, 'rejected')" class="px-3 py-1 bg-surface-container text-danger border border-danger/30 text-xs rounded-lg font-medium flex items-center gap-1 hover:bg-danger/10">
                    <span class="material-symbols-outlined text-[16px]">close</span> Descartar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabla de Directorio de Empleados / Usuarios -->
          <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden shadow-sm">
            <div v-if="filteredEmployees.length === 0" class="p-8 text-center text-secondary">
              <span class="material-symbols-outlined text-4xl mb-2 text-secondary/60">group_off</span>
              <p>No se encontraron colaboradores con los criterios seleccionados.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-surface-container-high bg-surface-container-low/50 text-xs font-semibold text-secondary uppercase tracking-wider">
                    <th class="py-3 px-4">Colaborador</th>
                    <th class="py-3 px-4">Cargo & Área</th>
                    <th class="py-3 px-4">Estado</th>
                    <th class="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container-high text-sm">
                  <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-surface-container-low/40 transition-colors">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="relative w-9 h-9 shrink-0">
                          <img 
                            v-if="emp.verification_photo || emp.avatar_url" 
                            :src="emp.verification_photo || emp.avatar_url" 
                            class="w-9 h-9 rounded-full object-cover border border-emerald-500 shadow-2xs"
                            alt="Foto de identidad"
                          />
                          <div 
                            v-else 
                            class="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20"
                          >
                            {{ getInitials(emp.full_name) }}
                          </div>
                          <span 
                            v-if="emp.verification_photo || emp.avatar_url" 
                            class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"
                            title="Foto de verificación registrada"
                          ></span>
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-on-surface leading-tight">{{ emp.full_name }}</span>
                          <span class="text-xs text-secondary">{{ emp.email || 'Correo empresarial asignado' }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="flex flex-col">
                        <span class="font-medium text-on-surface">{{ emp.roles?.name || 'Sin cargo asignado' }}</span>
                        <span class="text-xs text-secondary">{{ emp.roles?.areas?.name || 'Área no asignada' }}</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span
                        v-if="emp.approval_status === 'approved'"
                        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 border border-green-500/20"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-green-600"></span> Activo
                      </span>
                      <span
                        v-else-if="emp.approval_status === 'suspended'"
                        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-700 border border-red-500/20"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span> Suspendido
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Pendiente
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          @click="openEditModal(emp)"
                          class="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Editar datos o reasignar cargo"
                        >
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          @click="openPasswordModal(emp)"
                          class="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Restablecer contraseña"
                        >
                          <span class="material-symbols-outlined text-[18px]">key</span>
                        </button>
                        <button
                          @click="toggleUserStatus(emp)"
                          class="p-1.5 text-secondary hover:bg-surface-container rounded-lg transition-colors"
                          :class="emp.approval_status === 'suspended' ? 'hover:text-green-600' : 'hover:text-amber-600'"
                          :title="emp.approval_status === 'suspended' ? 'Reactivar acceso' : 'Suspender acceso'"
                        >
                          <span class="material-symbols-outlined text-[18px]">{{ emp.approval_status === 'suspended' ? 'check_circle' : 'block' }}</span>
                        </button>
                        <button
                          @click="handleDeleteEmployee(emp)"
                          class="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Eliminar cuenta"
                        >
                          <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 2: Contratos -->
        <div v-if="activeTab === 'contracts'" class="flex flex-col gap-6">
          
          <div class="flex gap-4">
            <div class="w-1/3 flex flex-col gap-2">
              <label class="font-semibold text-sm uppercase text-secondary">Seleccionar Empleado</label>
              <select v-model="selectedEmployeeForContract" class="p-3 rounded-xl border bg-surface-container-low outline-none">
                <option value="">-- Seleccionar --</option>
                <option v-for="emp in allEmployees" :key="emp.id" :value="emp">{{ emp.full_name }} ({{ emp.roles?.name || 'Sin Cargo' }})</option>
              </select>
            </div>
          </div>

          <!-- Si hay empleado seleccionado, mostrar Canvas -->
          <div v-if="selectedEmployeeForContract" class="p-6 bg-surface-container-lowest border rounded-2xl shadow-sm">
            <h3 class="text-xl font-bold mb-4">Firma Digital de Contrato Laboral</h3>
            <p class="mb-4">Documento a nombre de: <strong>{{ selectedEmployeeForContract.full_name }}</strong>. DNI: {{ selectedEmployeeForContract.identificacion || 'N/A' }}</p>
            
            <div class="bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-xl h-64 mb-4 relative" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing" @touchstart.prevent="startDrawingTouch" @touchmove.prevent="drawTouch" @touchend.prevent="stopDrawing">
              <canvas ref="signatureCanvas" class="w-full h-full cursor-crosshair"></canvas>
              <div v-if="!hasDrawn" class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                <span class="text-2xl text-secondary">Firmar aquí con el dedo o mouse</span>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button @click="clearSignature" class="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high font-semibold border">Limpiar</button>
              <button @click="saveContract" :disabled="!hasDrawn" class="px-6 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-50">Guardar Contrato Firmado</button>
            </div>
          </div>

        </div>

        <!-- Tab 3: Noticias / Flyers -->
        <div v-if="activeTab === 'news'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Formulario de Noticias -->
          <div class="p-6 bg-surface-container-lowest border rounded-2xl shadow-sm h-fit">
            <h3 class="text-xl font-bold mb-4">Publicar Nueva Noticia</h3>
            <form @submit.prevent="publishNews" class="flex flex-col gap-4">
              <div>
                <label class="block font-semibold text-sm mb-1 text-secondary">Título de la Noticia</label>
                <input v-model="newsForm.title" required type="text" class="w-full p-3 rounded-xl border bg-surface-container-low outline-none" placeholder="Ej: Fiesta de Fin de Año">
              </div>
              <div>
                <label class="block font-semibold text-sm mb-1 text-secondary">Flyer / Imagen</label>
                <input type="file" required accept="image/*" @change="onNewsImageChange" class="w-full p-2 border border-dashed rounded-xl bg-surface-container-low">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-sm mb-1 text-secondary">Válido Desde</label>
                  <input v-model="newsForm.start_date" required type="date" class="w-full p-3 rounded-xl border bg-surface-container-low outline-none">
                </div>
                <div>
                  <label class="block font-semibold text-sm mb-1 text-secondary">Válido Hasta</label>
                  <input v-model="newsForm.end_date" required type="date" class="w-full p-3 rounded-xl border bg-surface-container-low outline-none">
                </div>
              </div>
              <button type="submit" :disabled="uploadingNews" class="mt-4 px-6 py-3 rounded-xl bg-primary text-white font-bold flex justify-center items-center gap-2 disabled:opacity-70">
                <span v-if="uploadingNews" class="material-symbols-outlined animate-spin">progress_activity</span>
                {{ uploadingNews ? 'Publicando...' : 'Publicar Noticia' }}
              </button>
            </form>
          </div>

          <!-- Lista de Noticias Activas -->
          <div class="flex flex-col gap-4">
            <h3 class="text-xl font-bold">Noticias Publicadas</h3>
            <div v-if="activeNews.length === 0" class="text-center py-6 bg-surface-container-low rounded-xl text-secondary">
              No hay noticias activas.
            </div>
            <div v-for="news in activeNews" :key="news.id" class="p-3 border rounded-xl bg-surface-container-lowest flex gap-4 shadow-sm items-center">
              <img :src="news.image_url" class="w-24 h-24 object-cover rounded-lg border">
              <div class="flex flex-col flex-1">
                <span class="font-bold text-lg leading-tight">{{ news.title }}</span>
                <span class="text-xs text-secondary mt-1">Desde: {{ new Date(news.start_date).toLocaleDateString() }}</span>
                <span class="text-xs text-secondary">Hasta: {{ new Date(news.end_date).toLocaleDateString() }}</span>
              </div>
              <button @click="deleteNews(news.id)" class="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Eliminar Noticia">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- Modal: Asignar Nueva Cuenta -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">person_add</span>
              Asignar Cuenta Corporativa
            </h3>
            <button @click="showCreateModal = false" class="text-secondary hover:text-on-surface">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="submitCreateEmployee" class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Nombre Completo *</label>
              <input 
                v-model="createForm.full_name" 
                @input="onNameInput"
                required 
                type="text" 
                placeholder="Ej. Juan Pérez" 
                class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary"
              >
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-secondary uppercase">Correo Corporativo *</label>
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    @click="suggestEmailByName" 
                    class="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
                    title="Generar correo con nombre y apellido"
                  >
                    <span class="material-symbols-outlined text-[13px]">person</span> Por Nombre
                  </button>
                  <span class="text-secondary text-[10px]">|</span>
                  <button 
                    type="button" 
                    @click="suggestEmailByRole" 
                    class="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
                    title="Generar correo con el cargo seleccionado"
                  >
                    <span class="material-symbols-outlined text-[13px]">badge</span> Por Cargo
                  </button>
                </div>
              </div>
              <input 
                v-model="createForm.email" 
                required 
                type="email" 
                placeholder="juan.perez@elitenutrition.com" 
                class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm font-mono text-xs focus:border-primary"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Cargo / Rol Asignado</label>
              <select 
                v-model="createForm.role_id" 
                @change="onRoleChange"
                class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary"
              >
                <option value="">-- Sin cargo asignado aún --</option>
                <option v-for="r in rolesList" :key="r.id" :value="r.id">
                  {{ r.name }} {{ r.areas?.name ? `(${r.areas.name})` : '' }}
                </option>
              </select>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-secondary uppercase">Contraseña Inicial *</label>
                <button type="button" @click="createForm.password = generateRandomPassword()" class="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                  <span class="material-symbols-outlined text-[14px]">shuffle</span> Generar segura
                </button>
              </div>
              <input v-model="createForm.password" required minlength="6" type="text" placeholder="Mínimo 6 caracteres" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm font-mono focus:border-primary">
            </div>

            <p v-if="createError" class="text-xs text-danger font-medium">{{ createError }}</p>

            <div class="flex justify-end gap-3 mt-2">
              <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm font-semibold">
                Cancelar
              </button>
              <button type="submit" :disabled="createLoading" class="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <span v-if="createLoading" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                {{ createLoading ? 'Creando...' : 'Crear y Activar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Editar / Reasignar Cuenta -->
      <div v-if="showEditModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-md p-6 shadow-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">edit</span>
              Editar / Reasignar Colaborador
            </h3>
            <button @click="showEditModal = false" class="text-secondary hover:text-on-surface">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="submitEditEmployee" class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Nombre Completo *</label>
              <input v-model="editForm.full_name" required type="text" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary">
            </div>

            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Correo Corporativo</label>
              <input v-model="editForm.email" type="email" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary">
              <span class="text-[11px] text-secondary mt-0.5 block">Actualiza las credenciales asociadas a esta cuenta.</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Cargo / Rol</label>
              <select v-model="editForm.role_id" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary">
                <option value="">-- Sin cargo asignado --</option>
                <option v-for="r in rolesList" :key="r.id" :value="r.id">
                  {{ r.name }} {{ r.areas?.name ? `(${r.areas.name})` : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-secondary uppercase mb-1">Estado de Acceso</label>
              <select v-model="editForm.approval_status" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm focus:border-primary">
                <option value="approved">Activo (Aprobado)</option>
                <option value="suspended">Suspendido</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>

            <p v-if="editError" class="text-xs text-danger font-medium">{{ editError }}</p>

            <div class="flex justify-end gap-3 mt-2">
              <button type="button" @click="showEditModal = false" class="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm font-semibold">
                Cancelar
              </button>
              <button type="submit" :disabled="editLoading" class="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <span v-if="editLoading" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                {{ editLoading ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Restablecer Contraseña -->
      <div v-if="showPasswordModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-surface-container-lowest border border-surface-container-high rounded-2xl w-full max-w-md p-6 shadow-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">key</span>
              Restablecer Contraseña
            </h3>
            <button @click="showPasswordModal = false" class="text-secondary hover:text-on-surface">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="text-xs text-secondary mb-4">
            Nueva contraseña para: <strong class="text-on-surface">{{ passwordForm.full_name }}</strong> ({{ passwordForm.email }}).
          </p>

          <form @submit.prevent="submitResetPassword" class="flex flex-col gap-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-secondary uppercase">Nueva Contraseña *</label>
                <button type="button" @click="passwordForm.newPassword = generateRandomPassword()" class="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                  <span class="material-symbols-outlined text-[14px]">shuffle</span> Generar aleatoria
                </button>
              </div>
              <input v-model="passwordForm.newPassword" required minlength="6" type="text" placeholder="Mínimo 6 caracteres" class="w-full p-2.5 rounded-xl border bg-surface-container-low outline-none text-sm font-mono focus:border-primary">
            </div>

            <p v-if="passwordError" class="text-xs text-danger font-medium">{{ passwordError }}</p>

            <div class="flex justify-end gap-3 mt-2">
              <button type="button" @click="showPasswordModal = false" class="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm font-semibold">
                Cancelar
              </button>
              <button type="submit" :disabled="passwordLoading" class="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <span v-if="passwordLoading" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                {{ passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../api/supabase';

const router = useRouter();
const loading = ref(true);
const hasAccess = ref(false);
const activeTab = ref('employees');

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

// Data
const pendingUsers = ref([]);
const allEmployees = ref([]);
const rolesList = ref([]);
const activeNews = ref([]);

// Filtros y búsqueda
const searchQuery = ref('');
const statusFilter = ref('all');
const showPendingSection = ref(true);

const filteredEmployees = computed(() => {
  return allEmployees.value.filter(emp => {
    // Filtro estado
    if (statusFilter.value !== 'all' && emp.approval_status !== statusFilter.value) {
      return false;
    }
    // Búsqueda
    if (!searchQuery.value.trim()) return true;
    const q = searchQuery.value.toLowerCase();
    const nameMatch = emp.full_name?.toLowerCase().includes(q);
    const emailMatch = emp.email?.toLowerCase().includes(q);
    const roleMatch = emp.roles?.name?.toLowerCase().includes(q);
    const areaMatch = emp.roles?.areas?.name?.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch || areaMatch;
  });
});

// State - Modales Usuario
const showCreateModal = ref(false);
const createForm = ref({ full_name: '', email: '', role_id: '', password: '' });
const createLoading = ref(false);
const createError = ref('');

const showEditModal = ref(false);
const editForm = ref({ id: '', full_name: '', email: '', role_id: '', approval_status: 'approved' });
const editLoading = ref(false);
const editError = ref('');

const showPasswordModal = ref(false);
const passwordForm = ref({ id: '', full_name: '', email: '', newPassword: '' });
const passwordLoading = ref(false);
const passwordError = ref('');

// State - Contratos
const selectedEmployeeForContract = ref('');
const signatureCanvas = ref(null);
const isDrawing = ref(false);
const hasDrawn = ref(false);
let ctx = null;

// State - Noticias
const newsForm = ref({ title: '', start_date: new Date().toISOString().split('T')[0], end_date: '', file: null });
const uploadingNews = ref(false);

onMounted(async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    router.push('/login');
    return;
  }
  
  const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', session.session.user.id).single();
  
  const roleName = profile?.roles?.name?.toLowerCase() || '';
  const isMaster = !!profile?.is_master_admin;
  const isAuditor = roleName.includes('auditor');
  const isHR = roleName.includes('recursos humanos');

  let isDelegated = false;
  if (profile?.role_id) {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/password-delegated-roles`);
      if (res.ok) {
        const data = await res.json();
        isDelegated = (data.delegated_role_ids || []).includes(profile.role_id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Validar si es Master Admin, Gerente de Auditoría, RRHH o rol con tarea delegada
  if (isMaster || isAuditor || isHR || isDelegated) {
    hasAccess.value = true;
    await loadData();
  }
  
  loading.value = false;
});

const loadData = async () => {
  // 1. Cargos disponibles
  const { data: rolesData } = await supabase
    .from('roles')
    .select('id, name, access_level, areas(name)')
    .order('name');
  rolesList.value = rolesData || [];

  // 2. Colaboradores / Empleados (intentar vía backend para obtener correos de Auth, fallback a Supabase)
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/employees`);
    if (res.ok) {
      const data = await res.json();
      allEmployees.value = data.employees || [];
    } else {
      throw new Error('Backend offline');
    }
  } catch (err) {
    const { data: emps } = await supabase
      .from('profiles')
      .select('*, roles(id, name, access_level, area_id, areas(id, name))')
      .order('full_name');
    allEmployees.value = emps || [];
  }

  // 3. Pendientes residuales
  pendingUsers.value = allEmployees.value.filter(u => u.approval_status === 'pending');

  // 4. Noticias
  const { data: news } = await supabase.from('corporate_news').select('*').order('created_at', { ascending: false });
  activeNews.value = news || [];
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

// --- GENERADOR DE CORREO CORPORATIVO ---
const normalizeForEmail = (text) => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
};

const onNameInput = () => {
  if (!createForm.value.full_name.trim()) return;
  const parts = createForm.value.full_name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = normalizeForEmail(parts[0]);
    const last = normalizeForEmail(parts[parts.length - 1]);
    createForm.value.email = `${first}.${last}@elitenutrition.com`;
  } else if (parts.length === 1) {
    createForm.value.email = `${normalizeForEmail(parts[0])}@elitenutrition.com`;
  }
};

const suggestEmailByName = () => {
  onNameInput();
};

const suggestEmailByRole = () => {
  if (!createForm.value.role_id) return;
  const role = rolesList.value.find(r => r.id === createForm.value.role_id);
  if (role) {
    createForm.value.email = `${normalizeForEmail(role.name)}@elitenutrition.com`;
  }
};

const onRoleChange = () => {
  if (!createForm.value.email || createForm.value.email === '@elitenutrition.com') {
    suggestEmailByRole();
  }
};

// --- CRUD USUARIOS ---
const openCreateModal = () => {
  createForm.value = {
    full_name: '',
    email: '',
    role_id: '',
    password: generateRandomPassword()
  };
  createError.value = '';
  showCreateModal.value = true;
};

const submitCreateEmployee = async () => {
  createError.value = '';
  if (!createForm.value.full_name.trim() || !createForm.value.email.trim() || !createForm.value.password) {
    createError.value = 'Completa todos los campos obligatorios.';
    return;
  }
  if (createForm.value.password.length < 6) {
    createError.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  createLoading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/create-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: createForm.value.full_name.trim(),
        email: createForm.value.email.trim(),
        role_id: createForm.value.role_id || null,
        password: createForm.value.password
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Error al crear la cuenta.');
    }
    showCreateModal.value = false;
    await loadData();
    alert('Cuenta corporativa asignada y activada exitosamente.');
  } catch (e) {
    createError.value = e.message;
  } finally {
    createLoading.value = false;
  }
};

const openEditModal = (emp) => {
  editForm.value = {
    id: emp.id,
    full_name: emp.full_name || '',
    email: emp.email || '',
    role_id: emp.role_id || '',
    approval_status: emp.approval_status || 'approved'
  };
  editError.value = '';
  showEditModal.value = true;
};

const submitEditEmployee = async () => {
  editError.value = '';
  if (!editForm.value.full_name.trim()) {
    editError.value = 'El nombre es obligatorio.';
    return;
  }
  editLoading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/employee/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: editForm.value.full_name.trim(),
        email: editForm.value.email ? editForm.value.email.trim() : undefined,
        role_id: editForm.value.role_id || null,
        approval_status: editForm.value.approval_status
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Error al actualizar el usuario.');
    }
    showEditModal.value = false;
    await loadData();
  } catch (e) {
    editError.value = e.message;
  } finally {
    editLoading.value = false;
  }
};

const openPasswordModal = (emp) => {
  passwordForm.value = {
    id: emp.id,
    full_name: emp.full_name,
    email: emp.email,
    newPassword: generateRandomPassword()
  };
  passwordError.value = '';
  showPasswordModal.value = true;
};

const submitResetPassword = async () => {
  passwordError.value = '';
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }
  passwordLoading.value = true;
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/employee/${passwordForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: passwordForm.value.newPassword
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Error al restablecer la contraseña.');
    }
    showPasswordModal.value = false;
    alert('Contraseña actualizada con éxito.');
  } catch (e) {
    passwordError.value = e.message;
  } finally {
    passwordLoading.value = false;
  }
};

const toggleUserStatus = async (user) => {
  const newStatus = user.approval_status === 'suspended' ? 'approved' : 'suspended';
  const actionName = newStatus === 'suspended' ? 'suspender' : 'reactivar';
  if (!confirm(`¿Estás seguro de que deseas ${actionName} el acceso a ${user.full_name}?`)) return;

  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/employee/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_status: newStatus })
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
    await loadData();
  } catch (e) {
    alert(e.message);
  }
};

const handleDeleteEmployee = async (user) => {
  if (!confirm(`¿Estás seguro de eliminar permanentemente la cuenta de ${user.full_name}? Esta acción no se puede deshacer.`)) return;

  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/employee/${user.id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar cuenta');
    await loadData();
  } catch (e) {
    alert(e.message);
  }
};

// --- APROBACIONES RESIDUALES ---
const updateStatus = async (id, status) => {
  const { error } = await supabase.from('profiles').update({ approval_status: status }).eq('id', id);
  if (!error) {
    await loadData();
    alert(`Usuario ${status === 'approved' ? 'Aprobado' : 'Rechazado'} correctamente`);
  } else {
    alert('Error actualizando usuario');
  }
};

// --- FIRMA DIGITAL CONTRATOS ---
const setupCanvas = () => {
  if (!signatureCanvas.value) return;
  const canvas = signatureCanvas.value;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
};

const getPos = (e) => {
  const rect = signatureCanvas.value.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const startDrawing = (e) => {
  if (!ctx) setupCanvas();
  isDrawing.value = true;
  hasDrawn.value = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};
const startDrawingTouch = (e) => startDrawing(e);

const draw = (e) => {
  if (!isDrawing.value || !ctx) return;
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
};
const drawTouch = (e) => draw(e);

const stopDrawing = () => {
  isDrawing.value = false;
};

const clearSignature = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height);
  hasDrawn.value = false;
};

const saveContract = async () => {
  if (!hasDrawn.value) return;
  const dataUrl = signatureCanvas.value.toDataURL('image/png');
  
  const { error } = await supabase.from('employee_contracts').insert({
    employee_id: selectedEmployeeForContract.value.id,
    contract_type: 'Contrato Laboral Base',
    signature_data: dataUrl
  });

  if (error) {
    console.error(error);
    alert('Error al guardar el contrato.');
  } else {
    alert('Contrato guardado exitosamente.');
    selectedEmployeeForContract.value = '';
    clearSignature();
  }
};

// --- NOTICIAS ---
const onNewsImageChange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    newsForm.value.file = e.target.files[0];
  }
};

const publishNews = async () => {
  if (!newsForm.value.file) return;
  uploadingNews.value = true;

  try {
    const file = newsForm.value.file;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `flyers/${fileName}`;

    // Subir a Storage
    const { error: uploadError } = await supabase.storage.from('news_flyers').upload(filePath, file);
    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from('news_flyers').getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    // Insertar en BD
    const { data: userData } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('corporate_news').insert({
      title: newsForm.value.title,
      image_url: imageUrl,
      start_date: newsForm.value.start_date,
      end_date: newsForm.value.end_date,
      created_by: userData.user.id
    });
    
    if (insertError) throw insertError;
    
    alert('Noticia publicada exitosamente.');
    newsForm.value = { title: '', start_date: new Date().toISOString().split('T')[0], end_date: '', file: null };
    await loadData(); // recargar
  } catch (err) {
    console.error(err);
    alert('Error publicando noticia: ' + err.message);
  } finally {
    uploadingNews.value = false;
  }
};

const deleteNews = async (id) => {
  if (confirm('¿Seguro que deseas eliminar esta noticia?')) {
    await supabase.from('corporate_news').delete().eq('id', id);
    await loadData();
  }
};

</script>

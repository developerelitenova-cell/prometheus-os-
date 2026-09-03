import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LoginView from '../views/LoginView.vue'
import Process from '../views/MainView.vue'
import SimulationView from '../views/SimulationView.vue'
import SimulationRunView from '../views/SimulationRunView.vue'
import ReportView from '../views/ReportView.vue'
import InteractionView from '../views/InteractionView.vue'
import { supabase } from '../api/supabase'
import { currentProfile, loadCurrentProfile, authReady } from '../api/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/mapa-cargos',
    name: 'DataHub',
    component: () => import('../views/MapaCargos.vue')
  },
  {
    path: '/academia',
    name: 'AcademiaElite',
    component: () => import('../views/AcademiaElite.vue')
  },
  {
    path: '/mapper/:role_id',
    name: 'Mapper',
    component: () => import('../views/MapperView.vue'),
    props: true,
    meta: { mapperRoute: true }
  },
  {
    path: '/process/:projectId',
    name: 'Process',
    component: Process,
    props: true
  },
  {
    path: '/simulation/:simulationId',
    name: 'Simulation',
    component: SimulationView,
    props: true
  },
  {
    path: '/simulation/:simulationId/start',
    name: 'SimulationRun',
    component: SimulationRunView,
    props: true
  },
  {
    path: '/report/:reportId',
    name: 'Report',
    component: ReportView,
    props: true
  },
  {
    path: '/interaction/:reportId',
    name: 'Interaction',
    component: InteractionView,
    props: true
  },
  {
    path: '/oracle',
    name: 'Oracle',
    component: () => import('../views/OracleView.vue'),
    meta: { masterAdminOnly: true }
  },
  {
    path: '/knowledge-loader',
    name: 'KnowledgeLoader',
    component: () => import('../views/KnowledgeLoader.vue')
  },
  {
    path: '/performance',
    name: 'PerformanceDashboard',
    component: () => import('../views/PerformanceDashboard.vue')
  },
  {
    path: '/workspace',
    name: 'EmployeeWorkspace',
    component: () => import('../views/EmployeeWorkspace.vue'),
    meta: { requiresMappingComplete: true }
  },
  {
    path: '/roles',
    name: 'RolePermissionManager',
    component: () => import('../views/RolePermissionManager.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/manuals',
    name: 'ManualsManager',
    component: () => import('../views/ManualsManager.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/team',
    name: 'LeaderDashboard',
    component: () => import('../views/LeaderDashboard.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/planner',
    name: 'Planner',
    component: () => import('../views/Planner.vue')
  },
  {
    path: '/events',
    name: 'EventCalendar',
    component: () => import('../views/EventCalendar.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/support-contacts',
    name: 'SupportContactsManager',
    component: () => import('../views/SupportContactsManager.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/kpis',
    name: 'KpiManager',
    component: () => import('../views/KpiManager.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- Guard de navegación ---
// La protección real de los datos vive en RLS (auth_access_control_migration.sql);
// este guard es la capa de UX que evita que alguien sin sesión o sin el nivel
// adecuado ni siquiera llegue a ver la pantalla.
router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!authReady.value || !currentProfile.value) {
    await loadCurrentProfile()
  }

  const profile = currentProfile.value
  if (!profile) return true // La sesión es válida; si el perfil no cargó, RLS igual protege los datos.

  // Cuentas auto-registradas (signUp) pendientes de aprobación por un líder --
  // LoginView.vue ya avisa esto en el flujo normal de login, pero eso es solo
  // UX: si la persona entra directo por URL con una sesión válida, sin este
  // chequeo se saltaría el bloqueo. Perfiles sin approval_status (creados
  // antes de esta migración, o por el endpoint de admin) se tratan como
  // aprobados -- solo bloquea un valor explícito no aprobado.
  const blockedStatuses = ['pending', 'rejected', 'suspended'];
  if (!profile.is_master_admin && blockedStatuses.includes(profile.approval_status)) {
    await supabase.auth.signOut();
    return { path: '/login', query: { pending: profile.approval_status } };
  }

  if (to.meta.masterAdminOnly && !profile.is_master_admin) {
    return { path: '/workspace' }
  }

  if (to.meta.leaderOnly && !profile.is_master_admin && !(profile.roles && [1, 2].includes(profile.roles.access_level))) {
    return { path: '/workspace' }
  }

  if (to.meta.mapperRoute && !profile.is_master_admin) {
    if (profile.mapping_completed) return { path: '/workspace' }
    if (profile.role_id !== to.params.role_id) return { path: '/workspace' }
  }

  if (to.meta.requiresMappingComplete && !profile.is_master_admin && !profile.mapping_completed) {
    return profile.role_id ? { path: `/mapper/${profile.role_id}` } : { path: '/login' }
  }

  return true
})

export default router

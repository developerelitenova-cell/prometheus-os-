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
    path: '/pending-approval',
    name: 'PendingApproval',
    component: () => import('../views/PendingApprovalView.vue'),
    meta: { public: true }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('../views/WelcomeView.vue')
  },
  {
    path: '/mapa-cargos',
    name: 'DataHub',
    component: () => import('../views/MapaCargos.vue'),
    // Antes era masterAdminOnly; ahora un líder también entra aquí para
    // gestionar la Gestión Diaria (memoria del cargo) de su equipo. El
    // propio MapaCargos.vue filtra a los cargos de su área si no es admin,
    // y esconde las acciones exclusivas del admin (Inyectar Conocimiento).
    meta: { leaderOnly: true }
  },
  {
    path: '/mapa-procesos',
    alias: ['/procesos-ia', '/miro-map'],
    name: 'ProcessMap',
    component: () => import('../views/MiroProcessMap.vue')
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
    path: '/master',
    name: 'MasterDashboard',
    component: () => import('../views/MasterDashboard.vue'),
    meta: { masterAdminOnly: true }
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
    component: () => import('../views/KnowledgeLoader.vue'),
    // Único punto de entrada en la UI es el botón "Inyectar Conocimiento" dentro
    // de /mapa-cargos, que ya es masterAdminOnly -- esta ruta debe serlo también.
    meta: { masterAdminOnly: true }
  },
  {
    path: '/performance',
    name: 'PerformanceDashboard',
    component: () => import('../views/PerformanceDashboard.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/workspace',
    name: 'EmployeeWorkspace',
    component: () => import('../views/EmployeeWorkspace.vue')
  },
  {
    path: '/roles',
    name: 'RolePermissionManager',
    component: () => import('../views/RolePermissionManager.vue'),
    // No es leaderOnly a propósito: esta pantalla puede reestructurar áreas/roles
    // de TODA la empresa y crear cuentas nuevas marcadas como Admin Master, algo
    // que ni siquiera un líder Nivel 1 debe poder hacer (LeaderDashboard.vue ya
    // solo muestra el enlace a este panel cuando isMaster, no isControlUser).
    meta: { masterAdminOnly: true }
  },
  {
    path: '/manuals',
    name: 'ManualsManager',
    component: () => import('../views/ManualsManager.vue'),
    meta: { leaderOnly: true }
  },
  {
    path: '/leader',
    name: 'LeaderDashboard',
    component: () => import('../views/LeaderDashboard.vue'),
    meta: { managerOnly: true }
  },
  {
    path: '/rrhh',
    alias: ['/cuentas', '/usuarios'],
    name: 'HRDashboard',
    component: () => import('../views/HRDashboard.vue'),
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

  // Primera vez que entra con la cuenta ya aprobada: pantalla de bienvenida
  // única, antes de seguir a su cuestionario de mapeo o a su portal.
  if (!profile.is_master_admin && profile.approval_status === 'approved' && !profile.welcome_seen && to.path !== '/welcome') {
    return { path: '/welcome' };
  }

  if (to.meta.masterAdminOnly && !profile.is_master_admin) {
    return { path: '/workspace' }
  }

  if (to.meta.leaderOnly && !profile.is_master_admin && !(profile.roles && [1, 2].includes(profile.roles.access_level))) {
    return { path: '/workspace' }
  }

  if (to.meta.managerOnly && !profile.is_master_admin && !(profile.roles && profile.roles.access_level === 1)) {
    return { path: '/workspace' }
  }

  if (to.meta.mapperRoute && !profile.is_master_admin) {
    if (profile.role_id !== to.params.role_id) return { path: '/workspace' }
  }

  return true
})

router.onError((error, to) => {
  if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
    window.location.href = to.fullPath;
  }
});

export default router

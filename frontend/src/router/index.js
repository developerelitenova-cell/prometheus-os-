import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Process from '../views/MainView.vue'
import SimulationView from '../views/SimulationView.vue'
import SimulationRunView from '../views/SimulationRunView.vue'
import ReportView from '../views/ReportView.vue'
import InteractionView from '../views/InteractionView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/data-hub',
    name: 'DataHub',
    component: () => import('../views/DataHub.vue')
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
    props: true
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
    component: () => import('../views/OracleView.vue')
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
    component: () => import('../views/EmployeeWorkspace.vue')
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

export default router

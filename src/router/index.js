import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/AuthView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  { path: '/', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/goals', name: 'goals', component: () => import('../views/GoalsView.vue') },
  { path: '/habits', name: 'habits', component: () => import('../views/HabitsView.vue') },
  { path: '/planner', name: 'planner', component: () => import('../views/PlannerView.vue') },
  { path: '/journal', name: 'journal', component: () => import('../views/JournalView.vue') },
  { path: '/learning', name: 'learning', component: () => import('../views/LearningView.vue') },
  { path: '/analytics', name: 'analytics', component: () => import('../views/AnalyticsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()

  if (to.meta.public) {
    if (authStore.isAuthenticated && to.name === 'login') {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router

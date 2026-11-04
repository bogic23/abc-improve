import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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

export default createRouter({
  history: createWebHistory(),
  routes,
})
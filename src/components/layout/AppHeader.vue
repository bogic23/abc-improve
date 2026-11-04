<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores/settings'
import { useAuthStore } from '../../stores/auth'
import AppIcon from '../ui/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const titles = {
  dashboard: 'Dashboard',
  goals: 'Goals',
  habits: 'Habits',
  planner: 'Planner',
  journal: 'Journal',
  learning: 'Learning',
  analytics: 'Analytics',
  settings: 'Settings',
}

const pageTitle = computed(() => titles[route.name] ?? 'Improve')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const today = computed(() =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
)

const initials = computed(() => {
  const name = (settingsStore.displayName || 'User').trim()
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

onMounted(settingsStore.applyTheme)

async function handleLogout() {
  try {
    await authStore.logout()
  } finally {
    router.replace({ name: 'login' })
  }
}
</script>

<template>
  <header class="relative z-10 flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:px-6 lg:px-8">
    <div class="min-w-0">
      <p class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ greeting }}, {{ settingsStore.displayName || 'there' }}
        <span class="mx-1 text-slate-300 dark:text-slate-600">/</span>
        <span class="text-slate-400 dark:text-slate-500">{{ today }}</span>
      </p>
      <h1 class="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="group grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 active:scale-90 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
        :aria-label="settingsStore.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="settingsStore.toggleTheme"
      >
        <Transition name="page" mode="out-in">
          <AppIcon
            :key="settingsStore.theme"
            :name="settingsStore.theme === 'dark' ? 'sun' : 'moon'"
            class="h-5 w-5 transition-transform duration-500 group-hover:rotate-12"
          />
        </Transition>
      </button>

      <button
        type="button"
        class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20 active:scale-90 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        aria-label="Sign out"
        :title="`Sign out${authStore.user?.email ? ` of ${authStore.user.email}` : ''}`"
        @click="handleLogout"
      >
        <AppIcon name="logout" class="h-5 w-5" />
      </button>

      <div
        class="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 dark:border-slate-700 dark:bg-slate-900 sm:flex"
        :title="authStore.user?.email"
      >
        <span class="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
          {{ initials }}
        </span>
        <span class="max-w-[8rem] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          {{ settingsStore.displayName || 'User' }}
        </span>
      </div>
    </div>
  </header>
</template>

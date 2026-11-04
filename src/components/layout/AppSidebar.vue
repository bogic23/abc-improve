<script setup>
import { useRoute } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'

const route = useRoute()

const links = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/goals', label: 'Goals', icon: 'goals' },
  { path: '/habits', label: 'Habits', icon: 'habits' },
  { path: '/planner', label: 'Planner', icon: 'planner' },
  { path: '/journal', label: 'Journal', icon: 'journal' },
  { path: '/learning', label: 'Learning', icon: 'learning' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
]
</script>

<template>
  <aside class="relative z-10 flex w-full shrink-0 flex-col border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:h-full md:w-64 md:border-b-0 md:border-r">
    <div class="flex items-center gap-3 px-4 py-4 md:px-5 md:py-6">
      <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <AppIcon name="sparkles" class="h-5 w-5" />
      </div>
      <div class="leading-tight">
        <p class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Improve</p>
        <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Personal growth
        </p>
      </div>
    </div>

    <nav class="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-3 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto md:px-3">
      <RouterLink
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        class="group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white md:gap-3"
        :class="route.path === link.path
          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
          : ''"
      >
        <span
          class="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500 transition-all duration-300 md:block"
          :class="route.path === link.path ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'"
        />
        <AppIcon
          :name="link.icon"
          class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
        />
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>

    <div class="hidden p-3 md:block">
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-lg shadow-indigo-500/20">
        <div class="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
        <div class="absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-white/5" />
        <p class="relative text-sm font-semibold">Keep going!</p>
        <p class="relative mt-1 text-xs leading-relaxed text-indigo-100">
          Small steps every day add up to big change.
        </p>
      </div>
    </div>
  </aside>
</template>

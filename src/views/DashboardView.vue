<script setup>
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  ArrowRight,
  Sparkles,
  PartyPopper,
} from 'lucide-vue-next'

const store = useProjectStore()

const stats = computed(() => {
  const allTasks = store.tasks
  const overdue = allTasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date(),
  )
  const completed = allTasks.filter((t) => t.status === 'done').length
  return {
    totalProjects: store.projects.filter((p) => !p.archived).length,
    totalTasks: allTasks.length,
    completed,
    overdue: overdue.length,
    overdueTasks: overdue,
    completionRate: allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0,
  }
})

const cards = computed(() => [
  {
    label: 'Active Projects',
    value: stats.value.totalProjects,
    icon: FolderKanban,
    iconWrap: 'bg-brand-soft text-brand',
    accent: 'from-cyan-400 to-blue-600',
    hint: 'In your workspace',
  },
  {
    label: 'Total Tasks',
    value: stats.value.totalTasks,
    icon: ListChecks,
    iconWrap: 'bg-sky-50 text-sky-600',
    accent: 'from-sky-400 to-cyan-500',
    hint: 'Across all projects',
  },
  {
    label: 'Completed',
    value: stats.value.completed,
    icon: CheckCircle2,
    iconWrap: 'bg-emerald-50 text-emerald-600',
    accent: 'from-emerald-400 to-teal-500',
    hint: `${stats.value.completionRate}% completion rate`,
  },
  {
    label: 'Overdue',
    value: stats.value.overdue,
    icon: AlertCircle,
    iconWrap: 'bg-red-50 text-red-600',
    accent: 'from-red-400 to-rose-500',
    hint: stats.value.overdue ? 'Needs attention' : 'All caught up',
  },
])

const topProjects = computed(() =>
  store.projects
    .filter((p) => !p.archived)
    .map((p) => ({ ...p, progress: store.getProjectProgress(p.id) }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4),
)

const donutStyle = computed(() => ({
  background: `conic-gradient(#06b6d4 ${stats.value.completionRate * 3.6}deg, #ecfeff 0deg)`,
}))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const motivation = computed(() => {
  const rate = stats.value.completionRate
  if (rate >= 100) return 'Everything is done. Take a well-earned break!'
  if (rate >= 75) return 'Almost there — a final push will get you across the line.'
  if (rate >= 40) return 'Great momentum. Keep knocking out those tasks.'
  if (rate > 0) return 'A good start. Small steps add up fast.'
  return 'A fresh board. Pick a task and get rolling!'
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div class="animate-fade-up">
        <div class="flex items-center gap-2 text-sm font-medium text-brand">
          <Sparkles class="h-4 w-4" />
          {{ greeting }}
        </div>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Dashboard</h2>
        <p class="mt-1 text-sm text-gray-500">Here's what's happening across your projects.</p>
      </div>
      <div
        class="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm"
        style="animation-delay: 80ms"
      >
        <Clock class="h-4 w-4 text-brand" />
        {{ todayLabel }}
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="(card, i) in cards"
        :key="card.label"
        class="card-hover group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-fade-up"
        :style="{ animationDelay: `${100 + i * 70}ms` }"
      >
        <div
          class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.16]"
          :class="card.accent"
        ></div>
        <div class="relative flex items-start justify-between">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            :class="card.iconWrap"
          >
            <component :is="card.icon" class="h-5 w-5" />
          </div>
        </div>
        <p class="relative mt-4 text-3xl font-bold tracking-tight text-gray-900">
          <AnimatedNumber :value="card.value" />
        </p>
        <p class="relative mt-0.5 text-sm font-medium text-gray-500">{{ card.label }}</p>
        <p class="relative mt-2 text-xs text-gray-400">{{ card.hint }}</p>
      </div>
    </div>

    <!-- Lower grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Overdue Tasks -->
      <div
        class="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2"
        style="animation-delay: 220ms"
      >
        <div class="flex items-center justify-between border-b border-gray-100 p-5">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <AlertCircle class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Overdue Tasks</h3>
              <p class="text-xs text-gray-400">Tasks that need your attention</p>
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="
              stats.overdue > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            "
          >
            {{ stats.overdue }}
          </span>
        </div>

        <div
          v-if="stats.overdueTasks.length === 0"
          class="flex flex-col items-center gap-3 p-10 text-center"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"
          >
            <PartyPopper class="h-7 w-7" />
          </div>
          <div>
            <p class="font-semibold text-gray-800">No overdue tasks</p>
            <p class="mt-0.5 text-sm text-gray-500">You're right on schedule. Great job!</p>
          </div>
        </div>

        <ul v-else class="stagger divide-y divide-gray-100">
          <li
            v-for="task in stats.overdueTasks"
            :key="task.id"
            class="group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-red-50/40"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="h-8 w-1 flex-shrink-0 rounded-full bg-red-400 transition-all group-hover:h-10"
              ></span>
              <div class="min-w-0">
                <p class="truncate font-medium text-gray-800">{{ task.title }}</p>
                <p class="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <Clock class="h-3 w-3" />
                  Due {{ task.dueDate }}
                </p>
              </div>
            </div>
            <span
              class="flex-shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
            >
              Overdue
            </span>
          </li>
        </ul>
      </div>

      <!-- Progress Overview -->
      <div
        class="animate-fade-up rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        style="animation-delay: 280ms"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900">Progress Overview</h3>
          <Sparkles class="h-4 w-4 text-brand" />
        </div>

        <div class="mt-6 flex justify-center">
          <div
            class="relative flex h-40 w-40 items-center justify-center rounded-full transition-all duration-700"
            :style="donutStyle"
          >
            <div
              class="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white shadow-inner"
            >
              <span class="text-3xl font-bold text-gray-900">
                <AnimatedNumber :value="stats.completionRate" />%
              </span>
              <span class="text-xs font-medium text-gray-400">complete</span>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-emerald-50 p-3 text-center">
            <p class="text-lg font-bold text-emerald-600">{{ stats.completed }}</p>
            <p class="text-[11px] font-medium uppercase tracking-wide text-emerald-500/80">Done</p>
          </div>
          <div class="rounded-xl bg-brand-soft p-3 text-center">
            <p class="text-lg font-bold text-brand">{{ stats.totalTasks - stats.completed }}</p>
            <p class="text-[11px] font-medium uppercase tracking-wide text-brand/70">Open</p>
          </div>
        </div>

        <p
          class="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500"
        >
          <Sparkles class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
          {{ motivation }}
        </p>
      </div>
    </div>

    <!-- Top projects -->
    <div
      v-if="topProjects.length"
      class="animate-fade-up rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      style="animation-delay: 340ms"
    >
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-gray-900">Project Momentum</h3>
        <RouterLink
          to="/projects"
          class="group inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
        >
          View all
          <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </RouterLink>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RouterLink
          v-for="project in topProjects"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="group rounded-xl border border-gray-100 p-4 transition-all duration-200 hover:border-brand/30 hover:bg-brand-soft/40"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2.5">
              <span
                class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                :style="{ backgroundColor: project.color }"
              ></span>
              <p class="truncate text-sm font-semibold text-gray-800 group-hover:text-brand">
                {{ project.name }}
              </p>
            </div>
            <span class="text-xs font-bold text-brand">{{ project.progress }}%</span>
          </div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${project.progress}%`, backgroundColor: project.color }"
            ></div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
} from 'chart.js'
import { useGoalsStore } from '../stores/goals'
import { useHabitsStore } from '../stores/habits'
import { usePlannerStore } from '../stores/planner'
import { localDateKey } from '../utils/date'
import AppIcon from '../components/ui/AppIcon.vue'
import CountUp from '../components/ui/CountUp.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const goalsStore = useGoalsStore()
const habitsStore = useHabitsStore()
const plannerStore = usePlannerStore()

const today = localDateKey()
const range = ref('week')

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rangeOptions = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

const habitsDone = computed(
  () => habitsStore.habits.filter((habit) => habitsStore.isCompleted(habit.id, today)).length,
)
const tasksDone = computed(() => plannerStore.todayTasks.filter((task) => task.done).length)

const habitPercent = computed(() => {
  if (!habitsStore.habits.length) return 0
  return Math.round((habitsDone.value / habitsStore.habits.length) * 100)
})

const periodDays = computed(() => (range.value === 'week' ? 7 : 30))

const periodDates = computed(() =>
  Array.from({ length: periodDays.value }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (periodDays.value - 1 - index))
    return localDateKey(date)
  }),
)

const periodCounts = computed(() =>
  periodDates.value.map(
    (date) => habitsStore.habits.filter((habit) => habitsStore.isCompleted(habit.id, date)).length,
  ),
)

const periodTotal = computed(() => periodCounts.value.reduce((sum, count) => sum + count, 0))
const periodAverage = computed(() =>
  Math.round((periodTotal.value / periodDays.value) * 10) / 10,
)
const periodBest = computed(() => Math.max(0, ...periodCounts.value))

const chartLabels = computed(() =>
  periodDates.value.map((date) => {
    const parsed = new Date(`${date}T00:00:00`)
    return range.value === 'week'
      ? parsed.toLocaleDateString(undefined, { weekday: 'short' })
      : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }),
)

const chartData = computed(() => ({
  labels: chartLabels.value,
  datasets: [
    {
      label: 'Habits completed',
      data: periodCounts.value,
      borderColor: '#6366f1',
      backgroundColor: (context) => {
        const { chart } = context
        const { ctx, chartArea } = chart
        if (!chartArea) return 'rgba(99, 102, 241, 0.12)'
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)')
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: range.value === 'week' ? 3.5 : 0,
      pointHoverRadius: 6,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: prefersReducedMotion ? false : { duration: 700, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
      displayColors: false,
      titleFont: { family: 'Inter', size: 12, weight: '600' },
      bodyFont: { family: 'Inter', size: 12 },
      callbacks: {
        label: (context) =>
          `${context.parsed.y} habit${context.parsed.y === 1 ? '' : 's'} completed`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        maxTicksLimit: range.value === 'week' ? 7 : 6,
        maxRotation: 0,
        font: { family: 'Inter', size: 11 },
      },
    },
    y: {
      beginAtZero: true,
      suggestedMax: Math.max(1, habitsStore.habits.length),
      grid: { color: 'rgba(148, 163, 184, 0.16)' },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        precision: 0,
        stepSize: 1,
        font: { family: 'Inter', size: 11 },
      },
    },
  },
}))

function isHabitDone(habitId) {
  return habitsStore.isCompleted(habitId, today)
}

function goalPercent(goal) {
  return Math.min(Math.round((goal.current / goal.target) * 100), 100)
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article class="card card-hover group animate-fade-up p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Active Goals</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              <CountUp :value="goalsStore.activeGoals.length" />
            </p>
          </div>
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:bg-indigo-500/10 dark:text-indigo-300">
            <AppIcon name="goals" class="h-5 w-5" />
          </span>
        </div>
        <p class="mt-3 text-xs text-slate-400 dark:text-slate-500">Targets in progress</p>
      </article>

      <article class="card card-hover group animate-fade-up p-5 [animation-delay:80ms]">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Habits Today</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              <CountUp :value="habitsDone" />
              <span class="text-lg font-semibold text-slate-400 dark:text-slate-500">/ {{ habitsStore.habits.length }}</span>
            </p>
          </div>
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:bg-emerald-500/10 dark:text-emerald-300">
            <AppIcon name="habits" class="h-5 w-5" />
          </span>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <div class="progress-track h-1.5">
            <div class="progress-bar from-emerald-500 to-teal-500" :style="{ width: `${habitPercent}%` }" />
          </div>
          <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">{{ habitPercent }}%</span>
        </div>
      </article>

      <article class="card card-hover group animate-fade-up p-5 [animation-delay:160ms] sm:col-span-2 lg:col-span-1">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks Today</p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              <CountUp :value="tasksDone" />
              <span class="text-lg font-semibold text-slate-400 dark:text-slate-500">/ {{ plannerStore.todayTasks.length }}</span>
            </p>
          </div>
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:bg-amber-500/10 dark:text-amber-300">
            <AppIcon name="planner" class="h-5 w-5" />
          </span>
        </div>
        <p class="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {{ plannerStore.todayTasks.length - tasksDone }} remaining for today
        </p>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="card animate-fade-up p-5 [animation-delay:220ms]">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-slate-900 dark:text-white">Today's Habits</h2>
            <p class="text-xs text-slate-400 dark:text-slate-500">Check off what you have completed</p>
          </div>
          <span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {{ habitsDone }} / {{ habitsStore.habits.length }}
          </span>
        </div>

        <div v-if="habitsStore.habits.length" class="stagger space-y-1">
          <div
            v-for="habit in habitsStore.habits"
            :key="habit.id"
            class="group flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span class="min-w-0 truncate text-sm text-slate-700 dark:text-slate-300">{{ habit.name }}</span>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-90"
              :class="isHabitDone(habit.id)
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              @click="habitsStore.toggleCompletion(habit.id, today)"
            >
              <AppIcon :name="isHabitDone(habit.id) ? 'check' : 'plus'" class="h-3.5 w-3.5" :class="isHabitDone(habit.id) ? 'animate-pop' : ''" />
              {{ isHabitDone(habit.id) ? 'Done' : 'Mark' }}
            </button>
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No habits yet. Add one from the Habits page.
        </p>
      </section>

      <section class="card animate-fade-up p-5 [animation-delay:280ms]">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-slate-900 dark:text-white">Goal Progress</h2>
            <p class="text-xs text-slate-400 dark:text-slate-500">Your momentum at a glance</p>
          </div>
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <AppIcon name="trending" class="h-4 w-4" />
          </span>
        </div>

        <div v-if="goalsStore.activeGoals.length" class="space-y-4">
          <div v-for="goal in goalsStore.activeGoals" :key="goal.id">
            <div class="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span class="min-w-0 truncate font-medium text-slate-700 dark:text-slate-300">{{ goal.title }}</span>
              <span class="shrink-0 text-xs text-slate-400 dark:text-slate-500">{{ goal.current }} / {{ goal.target }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="progress-track">
                <div class="progress-bar" :style="{ width: `${goalPercent(goal)}%` }" />
              </div>
              <span class="w-9 shrink-0 text-right text-xs font-semibold text-indigo-600 dark:text-indigo-400">{{ goalPercent(goal) }}%</span>
            </div>
          </div>
        </div>
        <p v-else class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Add a goal to see your progress here.
        </p>
      </section>
    </div>

    <section class="card animate-fade-up p-5 [animation-delay:340ms]">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <AppIcon name="analytics" class="h-4 w-4" />
            </span>
            <h2 class="font-semibold text-slate-900 dark:text-white">Progress overview</h2>
          </div>
          <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Habit completions over the last {{ periodDays }} days
          </p>
        </div>

        <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80" role="group" aria-label="Chart range">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
            :class="range === option.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            :aria-pressed="range === option.value"
            @click="range = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="mb-5 grid grid-cols-3 gap-3">
        <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</p>
          <p class="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <CountUp :value="periodTotal" />
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Daily average</p>
          <p class="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <CountUp :value="periodAverage" :decimals="1" />
          </p>
        </div>
        <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Best day</p>
          <p class="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <CountUp :value="periodBest" />
          </p>
        </div>
      </div>

      <div class="h-64 sm:h-72">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </section>
  </div>
</template>

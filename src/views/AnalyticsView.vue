<script setup>
import { computed } from 'vue'
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
import { useHabitsStore } from '../stores/habits'
import { localDateKey } from '../utils/date'
import AppIcon from '../components/ui/AppIcon.vue'
import CountUp from '../components/ui/CountUp.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const habitsStore = useHabitsStore()

const last7Days = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateKey(d)
  })
})

const dailyCounts = computed(() =>
  last7Days.value.map((date) =>
    habitsStore.habits.filter((habit) => habitsStore.isCompleted(habit.id, date)).length,
  ),
)

const totalCompleted = computed(() => dailyCounts.value.reduce((sum, count) => sum + count, 0))
const dailyAverage = computed(() => Math.round((totalCompleted.value / 7) * 10) / 10)
const bestDay = computed(() => Math.max(0, ...dailyCounts.value))

const chartData = computed(() => ({
  labels: last7Days.value.map((d) => d.slice(5)),
  datasets: [
    {
      label: 'Habits Completed',
      data: dailyCounts.value,
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
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
    },
    y: {
      beginAtZero: true,
      suggestedMax: Math.max(1, habitsStore.habits.length),
      grid: { color: 'rgba(148, 163, 184, 0.16)' },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, precision: 0 },
    },
  },
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="card card-hover group animate-fade-up p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Completed (7d)</p>
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-500/10 dark:text-indigo-300">
            <AppIcon name="check" class="h-4 w-4" />
          </span>
        </div>
        <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <CountUp :value="totalCompleted" />
        </p>
      </div>

      <div class="card card-hover group animate-fade-up p-5 [animation-delay:80ms]">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Daily average</p>
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-500/10 dark:text-emerald-300">
            <AppIcon name="trending" class="h-4 w-4" />
          </span>
        </div>
        <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <CountUp :value="dailyAverage" :decimals="1" />
        </p>
      </div>

      <div class="card card-hover group animate-fade-up p-5 [animation-delay:160ms]">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Best day</p>
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-500/10 dark:text-amber-300">
            <AppIcon name="flame" class="h-4 w-4" />
          </span>
        </div>
        <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <CountUp :value="bestDay" />
        </p>
      </div>
    </div>

    <div class="card animate-fade-up p-5 [animation-delay:220ms]">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-slate-900 dark:text-white">Habit consistency</h2>
          <p class="text-xs text-slate-400 dark:text-slate-500">Completions over the last 7 days</p>
        </div>
        <span class="badge bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          Last 7 days
        </span>
      </div>

      <div class="h-72 sm:h-80">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

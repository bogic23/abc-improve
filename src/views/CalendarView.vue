<script setup>
import { computed, ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from 'lucide-vue-next'

const store = useProjectStore()
const currentDate = ref(new Date())

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()

  const daysArray = []
  // Padding for start of month (Monday-first)
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    daysArray.push({ day: null, tasks: [] })
  }
  // Days
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const tasks = store.tasks.filter((t) => t.dueDate === dateStr)
    daysArray.push({ day: d, dateStr, tasks })
  }
  return daysArray
})

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const todayStr = new Date().toLocaleDateString('en-CA')

const monthTaskCount = computed(() => {
  return daysInMonth.value.reduce((sum, cell) => sum + (cell.day ? cell.tasks.length : 0), 0)
})

function changeMonth(offset) {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + offset,
    1,
  )
}

function goToday() {
  currentDate.value = new Date()
}

function isToday(cell) {
  return cell.dateStr === todayStr
}

function isWeekend(index) {
  return index % 7 >= 5
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <!-- Header -->
    <div
      class="animate-fade-up flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25"
        >
          <CalendarDays class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight text-gray-900">{{ monthLabel }}</h2>
          <p class="text-xs text-gray-400">
            {{ monthTaskCount }} task{{ monthTaskCount === 1 ? '' : 's' }} scheduled this month
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="goToday"
          class="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand active:scale-95"
        >
          Today
        </button>
        <div class="flex items-center overflow-hidden rounded-xl border border-gray-200">
          <button
            @click="changeMonth(-1)"
            class="p-2 text-gray-500 transition hover:bg-gray-50 hover:text-brand active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="h-5 w-px bg-gray-200"></span>
          <button
            @click="changeMonth(1)"
            class="p-2 text-gray-500 transition hover:bg-gray-50 hover:text-brand active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div
      class="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      style="animation-delay: 90ms"
    >
      <!-- Weekday header -->
      <div class="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80">
        <div
          v-for="day in weekDays"
          :key="day"
          class="p-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs"
        >
          <span class="hidden sm:inline">{{ day }}</span>
          <span class="sm:hidden">{{ day.charAt(0) }}</span>
        </div>
      </div>

      <!-- Days -->
      <Transition name="fade" mode="out-in">
        <div :key="monthLabel" class="grid grid-cols-7 auto-rows-fr">
          <div
            v-for="(cell, index) in daysInMonth"
            :key="index"
            class="group relative min-h-[72px] border-b border-r border-gray-100 p-1.5 transition-colors sm:min-h-[110px] sm:p-2"
            :class="[
              !cell.day ? 'bg-gray-50/60' : 'bg-white hover:bg-brand-soft/40',
              isWeekend(index) && cell.day ? 'bg-gray-50/40' : '',
            ]"
          >
            <div v-if="cell.day" class="flex items-center justify-between">
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors sm:h-7 sm:w-7 sm:text-sm"
                :class="
                  isToday(cell)
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'text-gray-700 group-hover:text-brand'
                "
              >
                {{ cell.day }}
              </span>
              <span
                v-if="cell.tasks.length"
                class="text-[10px] font-semibold text-gray-400 sm:hidden"
              >
                {{ cell.tasks.length }}
              </span>
            </div>

            <div v-if="cell.day && cell.tasks.length > 0" class="mt-1 space-y-1">
              <div
                v-for="task in cell.tasks"
                :key="task.id"
                class="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-transform hover:translate-x-0.5 sm:text-xs"
                :class="
                  task.status === 'done'
                    ? 'bg-emerald-50 text-emerald-600 line-through'
                    : 'bg-brand-soft text-brand'
                "
                :title="task.title"
              >
                <Circle
                  class="hidden h-1.5 w-1.5 flex-shrink-0 fill-current sm:block"
                  :class="task.status === 'done' ? 'text-emerald-400' : 'text-brand/60'"
                />
                <span class="truncate">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

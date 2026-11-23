<script setup>
import { computed, ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from 'lucide-vue-next'
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  createTaskCalendarEvent,
  googleCalendarError,
  isGoogleCalendarConnected,
  loadGoogleEvents as fetchGoogleEvents,
} from '@/services/googleCalendar'

const store = useProjectStore()
const currentDate = ref(new Date())
const calendarId = ref(localStorage.getItem('google-calendar-id') || '')
const googleEvents = ref([])
const googleLoading = ref(false)
const googleSyncingTasks = ref(false)
const googleSyncNotice = ref('')

let requestId = 0

async function loadGoogleEvents() {
  const id = ++requestId
  googleEvents.value = []
  googleCalendarError.value = ''
  if (!isGoogleCalendarConnected.value && !calendarId.value.trim()) return

  googleLoading.value = true
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  try {
    googleEvents.value = await fetchGoogleEvents(new Date(year, month, 1), new Date(year, month + 1, 1))
  } catch (error) {
    if (id === requestId) googleCalendarError.value = error.message
  } finally {
    if (id === requestId) googleLoading.value = false
  }
}

watch(calendarId, (value) => {
  localStorage.setItem('google-calendar-id', value)
  loadGoogleEvents()
}, { immediate: true })

watch(currentDate, loadGoogleEvents)

function handleConnectGoogle() {
  connectGoogleCalendar()
    .then(async () => {
      await loadGoogleEvents()
      await syncPendingTasks()
    })
    .catch(() => {})
}

function handleDisconnectGoogle() {
  disconnectGoogleCalendar()
  googleEvents.value = []
}

async function syncPendingTasks() {
  if (googleSyncingTasks.value) return
  const pendingTasks = store.tasks.filter((task) => task.dueDate && !task.googleCalendarEventId)
  if (!pendingTasks.length) {
    googleSyncNotice.value = 'All dated project tasks are already synced.'
    return
  }

  googleSyncingTasks.value = true
  googleSyncNotice.value = ''
  let synced = 0
  const failures = []
  for (const task of pendingTasks) {
    try {
      const event = await createTaskCalendarEvent(task)
      const saved = await store.updateTask(task.id, {
        googleCalendarEventId: event.id,
        googleCalendarId: localStorage.getItem('google-calendar-id')?.trim() || 'primary',
      })
      if (!saved) throw new Error(store.error || 'Could not save the event link.')
      synced += 1
    } catch (error) {
      failures.push(`${task.title}: ${error.message}`)
    }
  }

  googleSyncNotice.value = failures.length
    ? `${synced} task${synced === 1 ? '' : 's'} synced; ${failures.length} failed. ${failures[0]}`
    : `${synced} task${synced === 1 ? '' : 's'} synced to Google Calendar.`
  await loadGoogleEvents()
  googleSyncingTasks.value = false
}

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const linkedEventIds = new Set(store.tasks.map((task) => task.googleCalendarEventId).filter(Boolean))

  const daysArray = []
  // Padding for start of month (Monday-first)
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    daysArray.push({ day: null, tasks: [] })
  }
  // Days
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const tasks = store.tasks.filter((t) => t.dueDate === dateStr)
    const events = googleEvents.value.filter(
      (event) => event.date === dateStr && !linkedEventIds.has(event.id),
    )
    daysArray.push({ day: d, dateStr, tasks, events })
  }
  return daysArray
})

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const todayStr = new Date().toLocaleDateString('en-CA')

const monthTaskCount = computed(() => {
  return daysInMonth.value.reduce((sum, cell) => sum + (cell.day ? cell.tasks.length + cell.events.length : 0), 0)
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

    <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <label for="google-calendar-id" class="block text-sm font-semibold text-gray-800">Google Calendar</label>
      <p class="mt-1 text-xs text-gray-500">Connect Google Calendar to read events and sync project tasks with due dates. Or enter a public calendar ID.</p>
      <div class="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="google-calendar-id"
          v-model="calendarId"
          type="text"
          placeholder="Calendar ID (leave blank for your primary calendar)"
          class="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button v-if="!isGoogleCalendarConnected" @click="handleConnectGoogle" class="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90">Connect Google</button>
        <button v-else @click="handleDisconnectGoogle" class="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Disconnect</button>
        <button v-if="isGoogleCalendarConnected" @click="syncPendingTasks" :disabled="googleSyncingTasks" class="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          {{ googleSyncingTasks ? 'Syncing tasks…' : 'Sync pending tasks' }}
        </button>
        <span v-if="googleLoading" class="self-center text-xs text-gray-500">Loading events…</span>
        <span v-else-if="googleCalendarError" class="self-center text-xs text-red-600">{{ googleCalendarError }}</span>
        <span v-else-if="googleEvents.length" class="self-center text-xs text-emerald-700">{{ googleEvents.length }} events loaded</span>
      </div>
      <p v-if="googleSyncNotice" class="mt-2 text-xs text-blue-700">{{ googleSyncNotice }}</p>
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
                v-if="cell.tasks.length + cell.events.length"
                class="text-[10px] font-semibold text-gray-400 sm:hidden"
              >
                {{ cell.tasks.length + cell.events.length }}
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
            <div v-if="cell.day && cell.events.length > 0" class="mt-1 space-y-1">
              <a
                v-for="event in cell.events"
                :key="event.id"
                :href="event.link || undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="block truncate rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 sm:text-xs"
                :title="`Google Calendar: ${event.title}`"
              >
                {{ event.title }}
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

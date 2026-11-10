<script setup>
import { computed, ref } from 'vue'
import { usePlannerStore } from '../stores/planner'
import AppIcon from '../components/ui/AppIcon.vue'

const store = usePlannerStore()
const newTask = ref('')
const taskDate = ref(store.todayKey)
const priority = ref('medium')
const showCompleted = ref(false)

const priorityRank = { high: 0, medium: 1, low: 2 }

const sortedTasks = computed(() => {
  return [...store.tasks]
    .filter(task => !task.done)
    .sort((a, b) => {
      const rankDiff = (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3)
      if (rankDiff !== 0) return rankDiff
      return a.date.localeCompare(b.date)
    })
})

const completedTasks = computed(() => {
  return store.tasks
    .filter(task => task.done)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
})

function submit() {
  store.addTask(newTask.value, taskDate.value, priority.value)
  newTask.value = ''
}

function priorityClass(value) {
  return {
    high: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    medium: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  }[value] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function dateLabel(value) {
  if (value === store.todayKey) return 'Today'
  return value
}

function isOverdue(task) {
  return !task.done && task.date < store.todayKey
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <div
      v-if="store.overdueTasks.length"
      class="mb-5 flex items-start gap-3 rounded-xl border border-rose-200/70 bg-rose-50/70 p-3 text-xs text-rose-700 sm:p-4 sm:text-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
    >
      <AppIcon name="alert" class="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        You still have
        <strong class="font-semibold">{{ store.overdueTasks.length }}</strong>
        {{ store.overdueTasks.length === 1 ? 'task' : 'tasks' }}
        from before today that {{ store.overdueTasks.length === 1 ? 'is' : 'are' }} not finished yet.
      </p>
    </div>

    <form class="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]" @submit.prevent="submit">
      <input
        v-model="newTask"
        required
        maxlength="120"
        placeholder="What needs to get done?"
        class="input min-w-0 sm:col-span-2 lg:col-span-1"
      >
      <input v-model="taskDate" type="date" required class="input min-w-0" aria-label="Task date">
      <select v-model="priority" class="input min-w-0" aria-label="Task priority">
        <option value="low">Low priority</option>
        <option value="medium">Medium priority</option>
        <option value="high">High priority</option>
      </select>
      <button class="btn-primary sm:col-span-2 lg:col-span-1" type="submit">
        <AppIcon name="plus" class="h-4 w-4" />
        Add task
      </button>
    </form>

    <ul v-if="sortedTasks.length" class="card stagger divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      <li
        v-for="task in sortedTasks"
        :key="task.id"
        class="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 gap-y-1 p-4 transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
        :class="{ 'bg-rose-50/40 dark:bg-rose-500/5': isOverdue(task) }"
      >
        <input
          :checked="task.done"
          type="checkbox"
          class="row-start-1 mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 transition dark:border-slate-600"
          :aria-label="`Mark ${task.text} ${task.done ? 'incomplete' : 'complete'}`"
          @change="store.toggleTask(task.id)"
        >
        <span
          class="col-start-2 min-w-0 break-words whitespace-normal text-slate-800 transition-all duration-200 dark:text-slate-100"
          :class="{ 'text-slate-400 line-through dark:text-slate-500': task.done }"
        >
          {{ task.text }}
        </span>
        <div class="col-start-2 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span
            class="inline-flex items-center gap-1"
            :class="isOverdue(task)
              ? 'font-medium text-rose-600 dark:text-rose-300'
              : 'text-slate-400 dark:text-slate-500'"
          >
            <AppIcon name="calendar" class="h-3.5 w-3.5" />
            <template v-if="isOverdue(task)">Late · {{ task.date }}</template>
            <template v-else>{{ dateLabel(task.date) }}</template>
          </span>
          <span
            v-if="task.done && task.completedAt"
            class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-300"
          >
            <AppIcon name="clock" class="h-3.5 w-3.5" />
            Done at {{ formatTime(task.completedAt) }}
          </span>
        </div>
        <span class="badge row-span-2 self-center capitalize" :class="priorityClass(task.priority)">{{ task.priority }}</span>
        <button
          type="button"
          class="icon-btn row-span-2 shrink-0 self-center"
          :aria-label="`Remove ${task.text}`"
          @click="store.removeTask(task.id)"
        >
          <AppIcon name="trash" class="h-4 w-4" />
        </button>
      </li>
    </ul>

    <div v-else class="card animate-fade-in flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300">
        <AppIcon name="planner" class="h-6 w-6" />
      </span>
      <p class="font-medium text-slate-700 dark:text-slate-200">Your planner is clear</p>
      <p class="max-w-xs text-sm text-slate-500 dark:text-slate-400">Add a task above and start moving things forward.</p>
    </div>

    <div v-if="completedTasks.length" class="mt-6">
      <button
        type="button"
        class="flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/60"
        :aria-expanded="showCompleted"
        @click="showCompleted = !showCompleted"
      >
        <span class="inline-flex items-center gap-2">
          <AppIcon name="check" class="h-4 w-4" />
          Completed tasks ({{ completedTasks.length }})
        </span>
        <span class="text-xs">{{ showCompleted ? 'Hide' : 'Show' }}</span>
      </button>

      <ul v-if="showCompleted" class="card stagger mt-3 divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        <li
          v-for="task in completedTasks"
          :key="task.id"
          class="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 gap-y-1 p-4 transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
        >
          <input
            :checked="task.done"
            type="checkbox"
            class="row-start-1 mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 transition dark:border-slate-600"
            :aria-label="`Mark ${task.text} incomplete`"
            @change="store.toggleTask(task.id)"
          >
          <span class="col-start-2 min-w-0 break-words whitespace-normal text-slate-400 line-through dark:text-slate-500">
            {{ task.text }}
          </span>
          <div class="col-start-2 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span class="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <AppIcon name="calendar" class="h-3.5 w-3.5" />
              {{ dateLabel(task.date) }}
            </span>
            <span
              v-if="task.completedAt"
              class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-300"
            >
              <AppIcon name="clock" class="h-3.5 w-3.5" />
              Done at {{ formatTime(task.completedAt) }}
            </span>
          </div>
          <span class="badge row-span-2 self-center capitalize opacity-60" :class="priorityClass(task.priority)">{{ task.priority }}</span>
          <button
            type="button"
            class="icon-btn row-span-2 shrink-0 self-center"
            :aria-label="`Remove ${task.text}`"
            @click="store.removeTask(task.id)"
          >
            <AppIcon name="trash" class="h-4 w-4" />
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

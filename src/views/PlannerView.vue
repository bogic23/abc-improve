<script setup>
import { computed, ref } from 'vue'
import { usePlannerStore } from '../stores/planner'
import AppIcon from '../components/ui/AppIcon.vue'

const store = usePlannerStore()
const newTask = ref('')
const taskDate = ref(store.todayKey)
const priority = ref('medium')

const sortedTasks = computed(() => [...store.tasks].sort((a, b) => a.date.localeCompare(b.date)))

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
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <form class="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]" @submit.prevent="submit">
      <input
        v-model="newTask"
        required
        maxlength="120"
        placeholder="What needs to get done?"
        class="input min-w-0"
      >
      <input v-model="taskDate" type="date" required class="input" aria-label="Task date">
      <select v-model="priority" class="input" aria-label="Task priority">
        <option value="low">Low priority</option>
        <option value="medium">Medium priority</option>
        <option value="high">High priority</option>
      </select>
      <button class="btn-primary" type="submit">
        <AppIcon name="plus" class="h-4 w-4" />
        Add task
      </button>
    </form>

    <ul v-if="sortedTasks.length" class="card stagger divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      <li
        v-for="task in sortedTasks"
        :key="task.id"
        class="group flex items-center gap-3 p-4 transition-colors duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
      >
        <input
          :checked="task.done"
          type="checkbox"
          class="h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600 transition dark:border-slate-600"
          :aria-label="`Mark ${task.text} ${task.done ? 'incomplete' : 'complete'}`"
          @change="store.toggleTask(task.id)"
        >
        <span
          class="min-w-0 flex-1 truncate text-slate-800 transition-all duration-200 dark:text-slate-100"
          :class="{ 'text-slate-400 line-through dark:text-slate-500': task.done }"
        >
          {{ task.text }}
        </span>
        <span class="hidden items-center gap-1 text-xs text-slate-400 dark:text-slate-500 sm:inline-flex">
          <AppIcon name="calendar" class="h-3.5 w-3.5" />
          {{ dateLabel(task.date) }}
        </span>
        <span class="badge capitalize" :class="priorityClass(task.priority)">{{ task.priority }}</span>
        <button
          type="button"
          class="icon-btn shrink-0"
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
  </section>
</template>

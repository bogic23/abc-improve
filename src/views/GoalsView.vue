<script setup>
import { ref } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { localDateKey } from '../utils/date'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useGoalsStore()
const newTitle = ref('')
const target = ref(10)
const deadline = ref(`${new Date().getFullYear()}-12-31`)

function submit() {
  const title = newTitle.value.trim()
  if (!title) return

  store.addGoal({ title, category: 'General', target: Number(target.value), deadline: deadline.value })
  newTitle.value = ''
  target.value = 10
}

function goalPercent(goal) {
  return Math.min(Math.round((goal.current / goal.target) * 100), 100)
}
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <form class="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]" @submit.prevent="submit">
      <input
        v-model="newTitle"
        required
        maxlength="100"
        placeholder="What do you want to achieve?"
        class="input min-w-0"
      >
      <input
        v-model.number="target"
        type="number"
        min="1"
        required
        aria-label="Goal target"
        class="input sm:w-24"
      >
      <input
        v-model="deadline"
        type="date"
        :min="localDateKey()"
        required
        aria-label="Goal deadline"
        class="input"
      >
      <button type="submit" class="btn-primary">
        <AppIcon name="plus" class="h-4 w-4" />
        Add goal
      </button>
    </form>

    <div v-if="store.goals.length" class="stagger grid gap-4 md:grid-cols-2">
      <article
        v-for="goal in store.goals"
        :key="goal.id"
        class="card card-hover group p-5"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate font-semibold text-slate-900 dark:text-white">{{ goal.title }}</h2>
              <span
                v-if="goal.status === 'completed'"
                class="badge bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <AppIcon name="check" class="h-3 w-3" />
                Completed
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ goal.category }}</span>
              <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <AppIcon name="calendar" class="h-3.5 w-3.5" />
                Due {{ goal.deadline }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="icon-btn shrink-0"
            :aria-label="`Remove ${goal.title}`"
            @click="store.removeGoal(goal.id)"
          >
            <AppIcon name="trash" class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-5">
          <div class="mb-1.5 flex items-center justify-between text-xs">
            <span class="font-medium text-slate-500 dark:text-slate-400">{{ goalPercent(goal) }}% complete</span>
            <span class="text-slate-400 dark:text-slate-500">{{ goal.current }} / {{ goal.target }}</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-bar"
              :class="goal.status === 'completed' ? 'from-emerald-500 to-teal-500' : ''"
              :style="{ width: `${goalPercent(goal)}%` }"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <button
            v-if="goal.status !== 'completed'"
            type="button"
            class="btn bg-indigo-50 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            @click="store.updateProgress(goal.id, 1)"
          >
            <AppIcon name="plus" class="h-3.5 w-3.5" />
            Log progress
          </button>
          <span v-else class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <AppIcon name="check" class="h-4 w-4" />
            Goal reached
          </span>
        </div>
      </article>
    </div>

    <div v-else class="card animate-fade-in flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
        <AppIcon name="goals" class="h-6 w-6" />
      </span>
      <p class="font-medium text-slate-700 dark:text-slate-200">No goals yet</p>
      <p class="max-w-xs text-sm text-slate-500 dark:text-slate-400">Add one above to start tracking your progress and momentum.</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useHabitsStore } from '../stores/habits'
import { localDateKey } from '../utils/date'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useHabitsStore()
const newHabit = ref('')
const today = localDateKey()

function submit() {
  store.addHabit(newHabit.value)
  newHabit.value = ''
}

function checkedAt(habitId) {
  const iso = store.completionTime(habitId, today)
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <div class="mb-5 flex items-start gap-3 rounded-xl bg-indigo-50/60 p-3 text-xs text-indigo-700 sm:p-4 sm:text-sm dark:bg-indigo-500/10 dark:text-indigo-200">
      <AppIcon name="sparkles" class="mt-0.5 h-5 w-5 shrink-0" />
      <p>Build consistency by checking off the habits you complete each day.</p>
    </div>

    <form class="card mb-6 flex flex-col gap-2 p-3 sm:flex-row" @submit.prevent="submit">
      <input
        v-model="newHabit"
        required
        maxlength="80"
        placeholder="Add a daily habit..."
        class="input min-w-0 flex-1"
      >
      <button class="btn-primary w-full shrink-0 sm:w-auto" type="submit">
        <AppIcon name="plus" class="h-4 w-4" />
        Add habit
      </button>
    </form>

    <ul v-if="store.habits.length" class="card stagger divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
      <li
        v-for="habit in store.habits"
        :key="habit.id"
        class="group flex items-start gap-2 p-3 transition-colors duration-200 hover:bg-slate-50/70 sm:items-center sm:gap-3 sm:p-4 dark:hover:bg-slate-800/40"
      >
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
          :aria-label="store.isCompleted(habit.id, today) ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`"
          :aria-pressed="store.isCompleted(habit.id, today)"
          @click="store.toggleCompletion(habit.id, today)"
        >
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200"
            :class="store.isCompleted(habit.id, today)
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'border-slate-300 text-transparent group-hover:border-emerald-400 dark:border-slate-600'"
          >
            <AppIcon
              name="check"
              :stroke-width="2.5"
              class="h-4 w-4"
              :class="store.isCompleted(habit.id, today) ? 'animate-pop' : ''"
            />
          </span>
        </button>

        <div class="min-w-0 flex-1 py-0.5">
          <p class="break-words text-sm font-medium text-slate-800 sm:truncate sm:text-base dark:text-slate-100">{{ habit.name }}</p>
          <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span
              v-if="checkedAt(habit.id)"
              class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-300"
            >
              <AppIcon name="check" class="h-3 w-3" :stroke-width="2.5" />
              Checked at {{ checkedAt(habit.id) }}
            </span>

            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
              :class="store.streak(habit.id) > 0
                ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
            >
              <AppIcon name="flame" class="h-3 w-3" />
              {{ store.streak(habit.id) }} day streak
            </span>
          </div>
        </div>

        <button
          type="button"
          class="icon-btn -mr-1 mt-0.5 h-10 w-10 shrink-0 sm:mr-0 sm:mt-0 sm:h-9 sm:w-9"
          :aria-label="`Remove ${habit.name}`"
          @click="store.removeHabit(habit.id)"
        >
          <AppIcon name="trash" class="h-4 w-4" />
        </button>
      </li>
    </ul>

    <div v-else class="card animate-fade-in flex flex-col items-center justify-center gap-3 border-dashed p-6 text-center sm:p-10">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300">
        <AppIcon name="habits" class="h-6 w-6" />
      </span>
      <p class="font-medium text-slate-700 dark:text-slate-200">No habits yet</p>
      <p class="max-w-xs text-sm text-slate-500 dark:text-slate-400">Add one above to start building a routine that sticks.</p>
    </div>
  </section>
</template>

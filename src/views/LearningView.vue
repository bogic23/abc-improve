<script setup>
import { ref } from 'vue'
import { useLearningStore } from '../stores/learning'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useLearningStore()
const title = ref('')
const type = ref('course')

const typeIcons = {
  course: 'learning',
  book: 'learning',
  article: 'journal',
  other: 'sparkles',
}

function submit() {
  store.addResource(title.value, type.value)
  title.value = ''
}
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <form class="card mb-6 flex flex-col gap-3 p-4 sm:flex-row" @submit.prevent="submit">
      <input
        v-model="title"
        required
        maxlength="120"
        placeholder="Add a course, book, or resource..."
        class="input min-w-0 flex-1"
      >
      <select v-model="type" class="input sm:w-40" aria-label="Resource type">
        <option value="course">Course</option>
        <option value="book">Book</option>
        <option value="article">Article</option>
        <option value="other">Other</option>
      </select>
      <button type="submit" class="btn-primary shrink-0">
        <AppIcon name="plus" class="h-4 w-4" />
        Add resource
      </button>
    </form>

    <div v-if="store.resources.length" class="stagger grid gap-4 md:grid-cols-2">
      <article
        v-for="resource in store.resources"
        :key="resource.id"
        class="card card-hover group p-5"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <AppIcon :name="typeIcons[resource.type] ?? 'learning'" class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <h2 class="truncate font-semibold text-slate-900 dark:text-white">{{ resource.title }}</h2>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span class="badge bg-slate-100 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ resource.type }}</span>
                <span
                  class="badge capitalize"
                  :class="resource.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'"
                >
                  {{ resource.status }}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="icon-btn shrink-0"
            :aria-label="`Remove ${resource.title}`"
            @click="store.removeResource(resource.id)"
          >
            <AppIcon name="trash" class="h-4 w-4" />
          </button>
        </div>

        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Progress</span>
          <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ resource.progress }}%</span>
        </div>
        <input
          :id="`progress-${resource.id}`"
          :value="resource.progress"
          type="range"
          min="0"
          max="100"
          step="5"
          class="h-2 w-full cursor-pointer accent-indigo-600"
          :aria-label="`Progress for ${resource.title}`"
          @input="store.updateProgress(resource.id, Number($event.target.value))"
        >
      </article>
    </div>

    <div v-else class="card animate-fade-in flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
        <AppIcon name="learning" class="h-6 w-6" />
      </span>
      <p class="font-medium text-slate-700 dark:text-slate-200">Nothing to learn yet</p>
      <p class="max-w-xs text-sm text-slate-500 dark:text-slate-400">Add something you want to learn and track your progress here.</p>
    </div>
  </section>
</template>

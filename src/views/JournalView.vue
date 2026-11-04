<script setup>
import { computed, ref } from 'vue'
import { useJournalStore } from '../stores/journal'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useJournalStore()
const content = ref('')
const mood = ref('neutral')

const moods = [
  { value: 'great', label: 'Great', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'low', label: 'Low', emoji: '😔' },
]

const entries = computed(() => [...store.entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id))

function emojiFor(value) {
  return moods.find((item) => item.value === value)?.emoji ?? '😐'
}

function submit() {
  if (!content.value.trim()) return
  store.addEntry(content.value.trim(), mood.value)
  content.value = ''
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <form class="card mb-6 space-y-4 p-5" @submit.prevent="submit">
      <div class="flex items-center gap-2">
        <span class="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <AppIcon name="journal" class="h-5 w-5" />
        </span>
        <label for="journal-entry" class="font-semibold text-slate-900 dark:text-white">
          How are you feeling today?
        </label>
      </div>

      <div class="relative">
        <textarea
          id="journal-entry"
          v-model="content"
          required
          maxlength="2000"
          rows="5"
          placeholder="Write a note to yourself..."
          class="input resize-y"
        />
        <span class="absolute bottom-2.5 right-3 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
          {{ content.length }} / 2000
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="item in moods"
            :key="item.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95"
            :class="mood === item.value
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'"
            :aria-pressed="mood === item.value"
            @click="mood = item.value"
          >
            <span class="text-base">{{ item.emoji }}</span>
            {{ item.label }}
          </button>
        </div>

        <button class="btn-primary" type="submit">
          <AppIcon name="check" class="h-4 w-4" />
          Save entry
        </button>
      </div>
    </form>

    <div v-if="entries.length" class="stagger space-y-3">
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="card card-hover group p-4"
      >
        <div class="mb-2 flex items-center justify-between gap-3 text-sm">
          <span class="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span class="text-base">{{ emojiFor(entry.mood) }}</span>
            <span class="font-medium capitalize text-slate-700 dark:text-slate-200">{{ entry.mood }}</span>
            <span class="text-slate-300 dark:text-slate-600">/</span>
            <span>{{ entry.date }}</span>
          </span>
          <button
            type="button"
            class="icon-btn h-8 w-8 shrink-0"
            aria-label="Delete entry"
            @click="store.removeEntry(entry.id)"
          >
            <AppIcon name="trash" class="h-4 w-4" />
          </button>
        </div>
        <p class="whitespace-pre-wrap text-slate-800 dark:text-slate-100">{{ entry.content }}</p>
      </article>
    </div>

    <div v-else class="card animate-fade-in flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-300">
        <AppIcon name="journal" class="h-6 w-6" />
      </span>
      <p class="font-medium text-slate-700 dark:text-slate-200">Your journal is empty</p>
      <p class="max-w-xs text-sm text-slate-500 dark:text-slate-400">Capture a thought above and it will appear here.</p>
    </div>
  </section>
</template>

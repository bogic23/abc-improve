<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import AppIcon from '../components/ui/AppIcon.vue'

const store = useSettingsStore()

const initials = computed(() => {
  const name = (store.displayName || 'User').trim()
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

const isDark = computed(() => store.theme === 'dark')
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-4">
    <div class="card animate-fade-up p-5">
      <div class="mb-4 flex items-center gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
          {{ initials }}
        </span>
        <div>
          <h2 class="font-semibold text-slate-900 dark:text-white">Your profile</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Personalize how the app addresses you.</p>
        </div>
      </div>

      <label for="display-name" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Your name</label>
      <input
        id="display-name"
        v-model="store.displayName"
        maxlength="60"
        placeholder="How should we address you?"
        class="input"
      >
      <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">Your name appears in the welcome message.</p>
    </div>

    <div class="card animate-fade-up p-5 [animation-delay:80ms]">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <AppIcon :name="isDark ? 'moon' : 'sun'" class="h-5 w-5" />
          </span>
          <div>
            <h2 class="font-medium text-slate-900 dark:text-white">Appearance</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Currently using {{ isDark ? 'dark' : 'light' }} mode.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          :aria-checked="isDark"
          :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
          class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
          :class="isDark ? 'bg-indigo-600' : 'bg-slate-300'"
          @click="store.toggleTheme"
        >
          <span
            class="grid h-5 w-5 place-items-center rounded-full bg-white text-slate-600 shadow-md transition-transform duration-300"
            :class="isDark ? 'translate-x-6' : 'translate-x-1'"
          >
            <AppIcon :name="isDark ? 'moon' : 'sun'" :stroke-width="2" class="h-3 w-3" />
          </span>
        </button>
      </div>
    </div>

    <div class="card animate-fade-up p-5 [animation-delay:160ms]">
      <div class="flex items-start gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <AppIcon name="sparkles" class="h-5 w-5" />
        </span>
        <div>
          <h2 class="font-medium text-slate-900 dark:text-white">Everything stays on this device</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your goals, habits, and notes are saved locally in your browser. No account needed.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

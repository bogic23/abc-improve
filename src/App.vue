<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppIcon from './components/ui/AppIcon.vue'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import { clearSyncError, syncError } from './lib/syncStatus'

const route = useRoute()
const authStore = useAuthStore()
const dataStore = useDataStore()
const mainRef = ref(null)

const isAuthLayout = computed(() => route.meta.layout === 'auth')
const isReady = computed(() => authStore.ready && dataStore.ready)

watch(
  () => authStore.user?.uid,
  (uid) => {
    if (uid) {
      void dataStore.load(uid)
    } else if (authStore.ready) {
      dataStore.reset()
    }
  },
  { flush: 'sync' },
)

if (authStore.user?.uid) {
  void dataStore.load(authStore.user.uid)
}

watch(
  () => route.fullPath,
  () => {
    mainRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, behavior: 'auto' })
  },
)
</script>

<template>
  <div v-if="!isReady" class="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
    <div class="flex flex-col items-center gap-4">
      <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <AppIcon name="sparkles" class="h-6 w-6" />
      </div>
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-500/30 dark:border-t-indigo-400" />
    </div>
  </div>

  <div v-else-if="isAuthLayout" class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>

  <div v-else class="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:h-screen md:flex-row">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
      <div class="absolute right-0 top-1/3 h-80 w-80 animate-blob rounded-full bg-violet-400/20 blur-3xl [animation-delay:-6s] dark:bg-violet-500/10" />
      <div class="absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-emerald-300/20 blur-3xl [animation-delay:-12s] dark:bg-emerald-500/10" />
    </div>

    <AppSidebar />

    <div class="relative flex min-h-0 flex-1 flex-col">
      <AppHeader />
      <main ref="mainRef" class="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div
          v-if="syncError"
          class="mx-auto mb-4 flex max-w-6xl items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AppIcon name="shield" class="mt-0.5 h-4 w-4 shrink-0" />
          <p class="flex-1">{{ syncError }}</p>
          <button type="button" class="text-xs font-semibold underline" @click="clearSyncError">Dismiss</button>
        </div>
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

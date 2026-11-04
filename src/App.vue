<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const mainRef = ref(null)

watch(
  () => route.fullPath,
  () => {
    mainRef.value?.scrollTo({ top: 0, behavior: 'auto' })
  },
)
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:h-screen md:flex-row">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />
      <div class="absolute right-0 top-1/3 h-80 w-80 animate-blob rounded-full bg-violet-400/20 blur-3xl [animation-delay:-6s] dark:bg-violet-500/10" />
      <div class="absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-emerald-300/20 blur-3xl [animation-delay:-12s] dark:bg-emerald-500/10" />
    </div>

    <AppSidebar />

    <div class="relative flex min-h-0 flex-1 flex-col">
      <AppHeader />
      <main ref="mainRef" class="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

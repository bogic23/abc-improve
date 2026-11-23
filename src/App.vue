<script setup>
import { computed, ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  X,
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const auth = useAuthStore()
const projects = useProjectStore()
const router = useRouter()
const route = useRoute()
const isSidebarOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
]

const isAuthPage = computed(() => route.meta.layout === 'auth')

function isActive(item) {
  return item.path === '/' ? route.path === '/' : route.path.startsWith(item.path)
}

const currentTitle = computed(() => {
  if (route.name === 'project-detail') return 'Project Board'
  if (route.name === 'admin-users') return 'User Management'
  const active = navItems.find((item) => isActive(item))
  return active ? active.name : 'ABC Improve'
})

async function handleLogout() {
  await auth.logout()
  router.replace({ name: 'login' })
}

watch(
  () => auth.isAuthenticated,
  (authenticated) => {
    if (!authenticated && !isAuthPage.value) {
      router.replace({ name: 'login' })
    }
  },
)

watch(
  () => auth.user?.uid,
  (uid) => {
    if (uid) projects.subscribe(uid)
    else projects.reset()
  },
  { immediate: true },
)
</script>

<template>
  <!-- Auth layout -->
  <RouterView v-if="isAuthPage" />

  <!-- App layout -->
  <div v-else class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Mobile Sidebar Overlay -->
    <Transition name="fade">
      <div
        v-if="isSidebarOpen"
        @click="isSidebarOpen = false"
        class="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <aside
      class="app-sidebar fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <RouterLink to="/" class="group flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105"
          >
            <Activity class="h-5 w-5" />
          </div>
          <div class="leading-tight">
            <h1 class="text-lg font-bold tracking-tight text-white">ABC Improve</h1>
            <p class="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Workspace
            </p>
          </div>
        </RouterLink>
        <button
          @click="isSidebarOpen = false"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1.5 p-3">
        <p
          class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
        >
          Menu
        </p>
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            isActive(item)
              ? 'bg-linear-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          "
          @click="isSidebarOpen = false"
        >
          <component
            :is="item.icon"
            class="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
          />
          {{ item.name }}
          <span
            v-if="isActive(item)"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse-ring"
          ></span>
        </RouterLink>

        <template v-if="auth.isAdmin">
          <div class="my-3 h-px bg-gray-100"></div>
          <p class="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Admin
          </p>
          <RouterLink
            to="/admin/users"
            class="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200"
            :class="
              route.path.startsWith('/admin')
                ? 'bg-linear-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            "
            @click="isSidebarOpen = false"
          >
            <ShieldCheck class="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            User Management
            <span
              v-if="route.path.startsWith('/admin')"
              class="ml-auto h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse-ring"
            ></span>
          </RouterLink>
        </template>
      </nav>

      <!-- Footer card -->
      <div class="space-y-3 border-t border-slate-800 p-3">
        <div
          class="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-700"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            ></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          All systems operational
        </div>

        <div class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-900">
          <img
            v-if="auth.photoURL"
            :src="auth.photoURL"
            alt=""
            referrerpolicy="no-referrer"
            class="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-white"
          />
          <div
            v-else
            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600 text-xs font-bold text-slate-950"
          >
            {{ auth.initials }}
          </div>
          <div class="min-w-0 flex-1 leading-tight">
            <p class="truncate text-sm font-semibold text-white">{{ auth.displayName }}</p>
            <p class="truncate text-xs text-slate-500">{{ auth.email || 'Signed in' }}</p>
          </div>
          <button
            @click="handleLogout"
            :disabled="auth.pending"
            class="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            title="Sign out"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <!-- Mobile Header -->
      <header class="glass flex h-16 items-center gap-3 border-b border-gray-200/70 px-4 lg:hidden">
        <button
          @click="isSidebarOpen = true"
          class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Menu class="h-5 w-5" />
        </button>
        <div class="flex items-center gap-2">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 text-slate-950"
          >
            <Activity class="h-4 w-4" />
          </div>
          <span class="font-semibold tracking-tight">ABC Improve</span>
        </div>
        <button
          @click="toggleTheme"
          class="ml-auto rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>
        <img
          v-if="auth.photoURL"
          :src="auth.photoURL"
          alt=""
          referrerpolicy="no-referrer"
          class="h-8 w-8 rounded-full object-cover ring-2 ring-white"
        />
        <div
          v-else
          class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600 text-[11px] font-bold text-slate-950"
        >
          {{ auth.initials }}
        </div>
      </header>

      <!-- Desktop Header -->
      <header
        class="glass hidden h-16 items-center justify-between border-b border-gray-200/70 px-8 lg:flex"
      >
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <span>Workspace</span>
          <ChevronRight class="h-4 w-4" />
          <span class="font-semibold text-gray-800">{{ currentTitle }}</span>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="toggleTheme"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Sun v-if="isDark" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>
          <div
            class="flex items-center gap-1.5 rounded-full border border-brand/15 bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand"
          >
            <Sparkles class="h-3.5 w-3.5" />
            {{ auth.displayName }}
          </div>
          <img
            v-if="auth.photoURL"
            :src="auth.photoURL"
            alt=""
            referrerpolicy="no-referrer"
            class="h-9 w-9 rounded-full object-cover ring-2 ring-white"
          />
          <div
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600 text-xs font-bold text-slate-950 ring-2 ring-white"
          >
            {{ auth.initials }}
          </div>
        </div>
      </header>

      <div class="relative flex-1 overflow-hidden">
        <!-- Decorative background blobs -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="animate-float absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          ></div>
          <div
            class="animate-float absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
            style="animation-delay: -3s"
          ></div>
        </div>

        <Transition name="fade">
          <div
            v-if="projects.loading"
            class="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-brand/10"
          >
            <div
              class="loading-bar h-full w-1/3 rounded-full bg-linear-to-r from-cyan-400 to-blue-600"
            ></div>
          </div>
        </Transition>

        <main class="relative h-full overflow-y-auto p-4 lg:p-8">
          <div
            v-if="projects.error"
            class="mx-auto mb-4 flex w-full max-w-7xl items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span class="flex-1">{{ projects.error }}</span>
            <button
              @click="projects.clearError"
              class="rounded p-0.5 text-red-400 transition hover:bg-red-100 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </main>
      </div>
    </div>
  </div>
</template>

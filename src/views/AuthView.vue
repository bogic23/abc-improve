<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { isFirebaseConfigured } from '../lib/firebase'
import AppIcon from '../components/ui/AppIcon.vue'

const auth = useAuthStore()
const settings = useSettingsStore()
const route = useRoute()
const router = useRouter()

const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const localError = ref('')

const tabs = [
  { value: 'login', label: 'Sign in' },
  { value: 'register', label: 'Create account' },
]

const isRegister = computed(() => mode.value === 'register')
const displayError = computed(() => localError.value || auth.error)

function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function switchMode(nextMode) {
  mode.value = nextMode
  localError.value = ''
  auth.clearError()
  password.value = ''
  confirmPassword.value = ''
}

async function finish() {
  if (settings.displayName === 'User') {
    const profileName = auth.user?.displayName?.trim()
    const fallback = name.value.trim() || auth.user?.email?.split('@')[0] || ''
    const nextName = profileName || fallback
    if (nextName) settings.displayName = nextName
  }

  await router.replace(safeRedirect(route.query.redirect))
}

async function submit() {
  if (!isFirebaseConfigured || auth.loading) return

  localError.value = ''
  auth.clearError()

  if (isRegister.value && password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match.'
    return
  }

  if (password.value.length < 6) {
    localError.value = 'Your password should be at least 6 characters.'
    return
  }

  try {
    if (isRegister.value) {
      await auth.register(email.value, password.value, name.value)
    } else {
      await auth.login(email.value, password.value)
    }
    await finish()
  } catch {
    // The store exposes a friendly error message.
  }
}

async function signInWithGoogle() {
  if (!isFirebaseConfigured || auth.loading) return

  localError.value = ''
  auth.clearError()

  try {
    await auth.loginWithGoogle()
    await finish()
  } catch {
    // The store exposes a friendly error message.
  }
}
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-24 h-80 w-80 animate-blob rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/10" />
      <div class="absolute -right-20 top-1/4 h-96 w-96 animate-blob rounded-full bg-violet-400/20 blur-3xl [animation-delay:-6s] dark:bg-violet-500/10" />
      <div class="absolute bottom-0 left-1/3 h-80 w-80 animate-blob rounded-full bg-emerald-300/20 blur-3xl [animation-delay:-12s] dark:bg-emerald-500/10" />
    </div>

    <div class="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
      <section class="hidden animate-fade-up lg:block">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <AppIcon name="sparkles" class="h-6 w-6" />
          </div>
          <div class="leading-tight">
            <p class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Improve</p>
            <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Personal growth
            </p>
          </div>
        </div>

        <h1 class="mt-10 text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          Grow a little
          <span class="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">every day.</span>
        </h1>
        <p class="mt-4 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">
          Track your goals, build lasting habits, plan your days, and reflect on your progress — all in one calm space.
        </p>

        <ul class="mt-8 space-y-3">
          <li class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <AppIcon name="goals" class="h-4 w-4" />
            </span>
            Set meaningful goals and watch them grow
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <AppIcon name="habits" class="h-4 w-4" />
            </span>
            Build habits that stick with daily streaks
          </li>
          <li class="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <AppIcon name="analytics" class="h-4 w-4" />
            </span>
            See weekly and monthly progress at a glance
          </li>
        </ul>

        <p class="mt-10 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <AppIcon name="shield" class="h-4 w-4" />
          Securely signed in with Firebase. Your data stays yours.
        </p>
      </section>

      <section class="w-full max-w-md justify-self-center animate-fade-up [animation-delay:100ms]">
        <div class="mb-6 flex items-center gap-3 lg:hidden">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <AppIcon name="sparkles" class="h-5 w-5" />
          </div>
          <div class="leading-tight">
            <p class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Improve</p>
            <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Personal growth
            </p>
          </div>
        </div>

        <div class="card p-6 shadow-xl sm:p-8">
          <div class="mb-6">
            <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {{ isRegister ? 'Create your account' : 'Welcome back' }}
            </h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ isRegister ? 'Start building better habits today.' : 'Sign in to continue your progress.' }}
            </p>
          </div>

          <div
            v-if="!isFirebaseConfigured"
            class="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <p class="font-semibold">Firebase is not configured</p>
            <p class="mt-1 text-xs leading-relaxed">
              Add your <code class="font-mono">VITE_FIREBASE_*</code> keys to <code class="font-mono">.env</code> and restart the app.
            </p>
          </div>

          <div class="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80" role="tablist" aria-label="Authentication mode">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              role="tab"
              class="rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200"
              :class="mode === tab.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
              :aria-selected="mode === tab.value"
              @click="switchMode(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submit">
            <div v-if="isRegister">
              <label for="auth-name" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Name <span class="font-normal text-slate-400">(optional)</span>
              </label>
              <div class="relative">
                <AppIcon name="user" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-name"
                  v-model="name"
                  type="text"
                  maxlength="60"
                  autocomplete="name"
                  placeholder="Your name"
                  class="input pl-10"
                >
              </div>
            </div>

            <div>
              <label for="auth-email" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <div class="relative">
                <AppIcon name="mail" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="input pl-10"
                >
              </div>
            </div>

            <div>
              <label for="auth-password" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
              </label>
              <div class="relative">
                <AppIcon name="lock" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :autocomplete="isRegister ? 'new-password' : 'current-password'"
                  placeholder="At least 6 characters"
                  class="input px-10"
                >
                <button
                  type="button"
                  class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <AppIcon :name="showPassword ? 'eye-off' : 'eye'" class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="isRegister">
              <label for="auth-confirm" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirm password
              </label>
              <div class="relative">
                <AppIcon name="lock" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-confirm"
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  placeholder="Repeat your password"
                  class="input pl-10"
                >
              </div>
            </div>

            <div
              v-if="displayError"
              class="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              role="alert"
            >
              <AppIcon name="x" class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ displayError }}</span>
            </div>

            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="auth.loading || !isFirebaseConfigured"
            >
              <span
                v-if="auth.loading"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <AppIcon v-else :name="isRegister ? 'plus' : 'arrow-right'" class="h-4 w-4" />
              {{ auth.loading ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in') }}
            </button>
          </form>

          <div class="my-6 flex items-center gap-3">
            <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span class="text-[11px] font-medium uppercase tracking-wider text-slate-400">or continue with</span>
            <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            class="btn-ghost w-full"
            :disabled="auth.loading || !isFirebaseConfigured"
            @click="signInWithGoogle"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
            <button
              type="button"
              class="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              @click="switchMode(isRegister ? 'login' : 'register')"
            >
              {{ isRegister ? 'Sign in' : 'Create one' }}
            </button>
          </p>
        </div>

        <p class="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          By continuing, you agree to keep showing up for yourself.
        </p>
      </section>
    </div>
  </div>
</template>

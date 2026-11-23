<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isFirebaseConfigured } from '@/firebase'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  Zap,
} from 'lucide-vue-next'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const mode = ref('login')
const isLogin = computed(() => mode.value === 'login')

const form = reactive({ name: '', email: '', password: '' })
const showPassword = ref(false)
const localError = ref('')

const errorMessage = computed(() => localError.value || auth.error)

const features = [
  {
    icon: LayoutDashboard,
    title: 'See the big picture',
    text: 'Live stats and progress rings across every project.',
  },
  {
    icon: FolderKanban,
    title: 'Boards that feel alive',
    text: 'Drag-free kanban with smooth, satisfying transitions.',
  },
  {
    icon: CalendarDays,
    title: 'Never miss a deadline',
    text: 'A calendar view that keeps the whole team in sync.',
  },
]

const strength = computed(() => {
  const value = form.password
  let score = 0
  if (value.length >= 6) score += 1
  if (value.length >= 10) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(score, 4)
})

const strengthLabel = computed(
  () => ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength.value],
)

const strengthColor = computed(
  () =>
    ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-500'][strength.value],
)

function setMode(next) {
  mode.value = next
  localError.value = ''
  auth.clearError()
  form.password = ''
  showPassword.value = false
}

function clearMessages() {
  localError.value = ''
  auth.clearError()
}

function validate() {
  if (!form.email.trim()) {
    localError.value = 'Please enter your email address.'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    localError.value = 'Please enter a valid email address.'
    return false
  }
  if (!isLogin.value && !form.name.trim()) {
    localError.value = 'Please tell us your name.'
    return false
  }
  if (!form.password) {
    localError.value = 'Please enter your password.'
    return false
  }
  if (form.password.length < 6) {
    localError.value = 'Your password must be at least 6 characters.'
    return false
  }
  return true
}

function goToApp() {
  const redirect =
    typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
  router.replace(redirect)
}

async function handleSubmit() {
  clearMessages()
  if (!validate()) return
  const ok = isLogin.value
    ? await auth.login(form.email.trim(), form.password)
    : await auth.register({ name: form.name, email: form.email.trim(), password: form.password })
  if (ok) goToApp()
}

async function handleGoogle() {
  clearMessages()
  const ok = await auth.loginWithGoogle()
  if (ok) goToApp()
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- Brand panel -->
    <div
      class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-cyan-700 p-10 text-white lg:flex xl:p-14"
    >
      <div class="auth-grid pointer-events-none absolute inset-0"></div>
      <div
        class="animate-float pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      ></div>
      <div
        class="animate-float pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
        style="animation-delay: -4s"
      ></div>

      <!-- Logo -->
      <div class="relative flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25"
        >
          <Activity class="h-5 w-5" />
        </div>
        <div class="leading-tight">
          <p class="text-lg font-bold tracking-tight">PulsePM</p>
          <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
            Project workspace
          </p>
        </div>
      </div>

      <!-- Headline -->
      <div class="relative max-w-md">
        <div
          class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15"
        >
          <Sparkles class="h-3.5 w-3.5" />
          Built for focused teams
        </div>
        <h2 class="mt-5 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          Where your team's momentum lives.
        </h2>
        <p class="mt-4 text-base leading-relaxed text-white/70">
          Plan projects, move tasks forward, and ship on time — all in one calm, beautifully simple
          workspace.
        </p>

        <ul class="mt-8 space-y-4">
          <li v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
            <div
              class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15"
            >
              <component :is="feature.icon" class="h-4 w-4" />
            </div>
            <div>
              <p class="text-sm font-semibold">{{ feature.title }}</p>
              <p class="text-sm text-white/60">{{ feature.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Mini preview card -->
      <div
        class="relative max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">This week</p>
          <span
            class="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white/80"
          >
            +18%
          </span>
        </div>
        <div class="mt-4 flex items-end gap-2">
          <div
            v-for="(height, i) in [38, 56, 44, 72, 60, 88, 70]"
            :key="i"
            class="flex-1 rounded-md bg-linear-to-t from-white/20 to-white/70 transition-all duration-500 hover:from-white/30 hover:to-white"
            :style="{ height: `${height}px` }"
          ></div>
        </div>
        <div class="mt-3 flex items-center justify-between text-[11px] text-white/50">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span
          ><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </div>

    <!-- Form panel -->
    <div class="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
      <div class="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl"></div>
        <div
          class="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
        ></div>
      </div>

      <div class="relative w-full max-w-md">
        <!-- Mobile logo -->
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25"
          >
            <Activity class="h-5 w-5" />
          </div>
          <span class="text-lg font-bold tracking-tight text-gray-900">PulsePM</span>
        </div>

        <div class="animate-fade-up">
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">
            {{ isLogin ? 'Welcome back' : 'Create your account' }}
          </h1>
          <p class="mt-2 text-sm text-gray-500">
            {{
              isLogin
                ? 'Sign in to pick up right where you left off.'
                : 'Start organizing your projects in under a minute.'
            }}
          </p>
        </div>

        <!-- Firebase setup notice -->
        <div
          v-if="!isFirebaseConfigured"
          class="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Firebase isn't configured yet. Add your project keys to a <code>.env</code> file to
            enable sign-in.
          </span>
        </div>

        <!-- Mode switch -->
        <div class="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            @click="setMode('login')"
            class="rounded-lg py-2 text-sm font-semibold transition-all"
            :class="
              isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            "
          >
            Sign in
          </button>
          <button
            type="button"
            @click="setMode('register')"
            class="rounded-lg py-2 text-sm font-semibold transition-all"
            :class="
              !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            "
          >
            Create account
          </button>
        </div>

        <!-- Google -->
        <button
          type="button"
          @click="handleGoogle"
          :disabled="auth.pending"
          class="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Loader2 v-if="auth.pending" class="h-5 w-5 animate-spin text-gray-400" />
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
            />
          </svg>
          Continue with Google
        </button>

        <!-- Divider -->
        <div class="my-5 flex items-center gap-3">
          <span class="h-px flex-1 bg-gray-200"></span>
          <span class="text-xs font-medium text-gray-400">or continue with email</span>
          <span class="h-px flex-1 bg-gray-200"></span>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSubmit" @input="clearMessages">
          <Transition name="fade">
            <div v-if="!isLogin">
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Full name
              </label>
              <div class="relative">
                <User class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="form.name"
                  type="text"
                  autocomplete="name"
                  placeholder="Alex Morgan"
                  class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>
          </Transition>

          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email address
            </label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="you@company.com"
                class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                placeholder="••••••••"
                class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-11 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:text-gray-600"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>

            <!-- Strength meter -->
            <div v-if="!isLogin && form.password" class="mt-2.5">
              <div class="flex gap-1.5">
                <span
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors duration-300"
                  :class="i <= strength ? strengthColor : 'bg-gray-200'"
                ></span>
              </div>
              <p class="mt-1.5 text-[11px] font-medium text-gray-400">
                Password strength:
                <span
                  class="font-semibold"
                  :class="
                    strength >= 3
                      ? 'text-emerald-500'
                      : strength >= 2
                        ? 'text-amber-500'
                        : 'text-red-400'
                  "
                >
                  {{ strengthLabel }}
                </span>
              </p>
            </div>
          </div>

          <!-- Error message -->
          <Transition name="fade">
            <div
              v-if="errorMessage"
              class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
            >
              <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <button
            type="submit"
            :disabled="auth.pending"
            class="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Loader2 v-if="auth.pending" class="h-4 w-4 animate-spin" />
            <template v-else>
              {{ isLogin ? 'Sign in' : 'Create account' }}
              <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </template>
          </button>
        </form>

        <!-- Footer -->
        <p class="mt-5 text-center text-sm text-gray-500">
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
          <button
            type="button"
            @click="setMode(isLogin ? 'register' : 'login')"
            class="font-semibold text-brand transition hover:text-brand-hover"
          >
            {{ isLogin ? 'Create one' : 'Sign in' }}
          </button>
        </p>

        <div class="mt-6 flex items-center justify-center gap-3 text-[11px] text-gray-400">
          <span class="inline-flex items-center gap-1">
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-400" /> Secure auth
          </span>
          <span class="h-3 w-px bg-gray-200"></span>
          <span class="inline-flex items-center gap-1">
            <Zap class="h-3.5 w-3.5 text-amber-400" /> Powered by Firebase
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

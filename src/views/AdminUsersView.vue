<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import {
  AlertCircle,
  Loader2,
  Search,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
  Users,
} from 'lucide-vue-next'

const auth = useAuthStore()
const admin = useAdminStore()
const router = useRouter()

const search = ref('')

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return admin.users
  return admin.users.filter(
    (user) =>
      (user.displayName || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term),
  )
})

const stats = computed(() => [
  {
    label: 'Total users',
    value: admin.users.length,
    icon: Users,
    iconWrap: 'bg-brand-soft text-brand',
    accent: 'from-cyan-400 to-blue-600',
  },
  {
    label: 'Admins',
    value: admin.admins.length,
    icon: ShieldCheck,
    iconWrap: 'bg-blue-50 text-blue-600',
    accent: 'from-blue-500 to-cyan-400',
  },
  {
    label: 'Members',
    value: admin.members.length,
    icon: UserRound,
    iconWrap: 'bg-sky-50 text-sky-600',
    accent: 'from-sky-400 to-cyan-500',
  },
])

function joinedLabel(user) {
  const value = user.createdAt
  if (!value) return '—'
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initialsFor(user) {
  const source = user.displayName || user.email || 'User'
  return (
    source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'U'
  )
}

async function onRoleChange(user, event) {
  const nextRole = event.target.value
  if (nextRole === user.role) return

  if (nextRole === 'member') {
    const label = user.displayName || user.email || 'this user'
    if (!window.confirm(`Remove admin access from ${label}?`)) {
      event.target.value = user.role
      return
    }
  }

  const ok = await admin.setRole(user.id, nextRole)
  if (!ok) event.target.value = user.role
}

onMounted(() => admin.subscribe())
onUnmounted(() => admin.reset())

watch(
  () => auth.isAdmin,
  (isAdmin) => {
    if (!isAdmin) router.replace({ name: 'dashboard' })
  },
)
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div class="animate-fade-up">
        <div class="flex items-center gap-2 text-sm font-medium text-brand">
          <ShieldCheck class="h-4 w-4" />
          Admin area
        </div>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          User Management
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          Review everyone in the workspace and manage admin access.
        </p>
      </div>
      <div
        class="animate-fade-up inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3.5 py-2 text-xs font-medium text-cyan-700"
        style="animation-delay: 60ms"
      >
        <ShieldCheck class="h-4 w-4" />
        {{ auth.displayName }} · Admin
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="(card, i) in stats"
        :key="card.label"
        class="card-hover group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-fade-up"
        :style="{ animationDelay: `${80 + i * 70}ms` }"
      >
        <div
          class="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br opacity-[0.08] transition-opacity group-hover:opacity-[0.16]"
          :class="card.accent"
        ></div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            :class="card.iconWrap"
          >
            <component :is="card.icon" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-2xl font-bold tracking-tight text-gray-900">
              <AnimatedNumber :value="card.value" />
            </p>
            <p class="text-xs font-medium text-gray-500">{{ card.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div
      class="animate-fade-up flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      style="animation-delay: 240ms"
    >
      <div class="relative w-full sm:max-w-xs">
        <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="w-full rounded-xl border border-transparent bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand/30 focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
      </div>
      <p class="px-1 text-xs text-gray-400">
        {{ filteredUsers.length }} of {{ admin.users.length }} users
      </p>
    </div>

    <!-- Error -->
    <div
      v-if="admin.error"
      class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{{ admin.error }}</span>
    </div>

    <!-- Users -->
    <div
      class="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      style="animation-delay: 300ms"
    >
      <div class="flex items-center justify-between border-b border-gray-100 p-5">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Users class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900">Workspace users</h3>
            <p class="text-xs text-gray-400">Roles update instantly across the app.</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="admin.loading" class="divide-y divide-gray-100">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-4">
          <div class="h-10 w-10 animate-pulse rounded-full bg-gray-100"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-40 animate-pulse rounded bg-gray-100"></div>
            <div class="h-3 w-56 animate-pulse rounded bg-gray-100"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredUsers.length === 0"
        class="flex flex-col items-center gap-2 p-12 text-center"
      >
        <ShieldQuestion class="h-8 w-8 text-gray-300" />
        <p class="font-semibold text-gray-700">No users found</p>
        <p class="text-sm text-gray-500">Try a different search term.</p>
      </div>

      <!-- List -->
      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="user in filteredUsers"
          :key="user.id"
          class="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/70 sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <img
              v-if="user.photoURL"
              :src="user.photoURL"
              alt=""
              referrerpolicy="no-referrer"
              class="h-10 w-10 flex-shrink-0 rounded-full object-cover"
            />
            <div
              v-else
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600 text-xs font-bold text-slate-950"
            >
              {{ initialsFor(user) }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-semibold text-gray-900">
                  {{ user.displayName || 'Unnamed user' }}
                </p>
                <span
                  v-if="user.id === auth.user?.uid"
                  class="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500"
                >
                  You
                </span>
              </div>
              <p class="truncate text-xs text-gray-500">{{ user.email || 'No email' }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 pl-13 sm:justify-end sm:pl-0">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              :class="
                user.role === 'admin' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'
              "
            >
              <ShieldCheck v-if="user.role === 'admin'" class="h-3 w-3" />
              <UserRound v-else class="h-3 w-3" />
              {{ user.role === 'admin' ? 'Admin' : 'Member' }}
            </span>

            <span class="hidden text-xs text-gray-400 md:inline">
              Joined {{ joinedLabel(user) }}
            </span>

            <div class="flex items-center gap-2">
              <Loader2 v-if="admin.pendingId === user.id" class="h-4 w-4 animate-spin text-brand" />
              <select
                v-else
                :value="user.role === 'admin' ? 'admin' : 'member'"
                :disabled="user.id === auth.user?.uid"
                @change="onRoleChange(user, $event)"
                class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                :title="
                  user.id === auth.user?.uid ? 'You cannot change your own role' : 'Change role'
                "
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Note -->
    <div
      class="animate-fade-up flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-700"
      style="animation-delay: 360ms"
    >
      <ShieldCheck class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>
        New accounts are created as <strong>members</strong> on first sign-in. Promote trusted
        teammates to admin here. You cannot change your own role, which helps prevent accidental
        lockouts.
      </span>
    </div>
  </div>
</template>

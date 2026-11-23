<script setup>
import { computed, ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { RouterLink } from 'vue-router'
import {
  Plus,
  Search,
  Archive,
  FolderOpen,
  FolderKanban,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-vue-next'
import {
  connectGoogleCalendar,
  deleteTaskCalendarEvent,
  hasValidGoogleCalendarConnection,
} from '@/services/googleCalendar'

const store = useProjectStore()
const search = ref('')
const statusFilter = ref('')
const showArchived = ref(false)

const filteredProjects = computed(() => {
  return store.getFilteredProjects(search.value, statusFilter.value, showArchived.value)
})

const isModalOpen = ref(false)
const newProject = ref({ name: '', description: '', color: '#06b6d4' })
const editingProjectId = ref(null)
const isSavingProject = ref(false)
const projectActionError = ref('')
const swatches = ['#06b6d4', '#2563eb', '#020617', '#0ea5e9', '#22d3ee', '#10b981', '#8b5cf6']

function openModal() {
  editingProjectId.value = null
  projectActionError.value = ''
  newProject.value = { name: '', description: '', color: '#06b6d4' }
  isModalOpen.value = true
}

function openEditModal(project) {
  editingProjectId.value = project.id
  projectActionError.value = ''
  newProject.value = {
    name: project.name,
    description: project.description || '',
    color: project.color || '#06b6d4',
  }
  isModalOpen.value = true
}

async function handleSaveProject() {
  if (!newProject.value.name.trim()) return
  isSavingProject.value = true
  projectActionError.value = ''
  try {
    const ok = editingProjectId.value
      ? await store.updateProject(editingProjectId.value, {
          name: newProject.value.name.trim(),
          description: newProject.value.description.trim(),
          color: newProject.value.color,
        })
      : await store.addProject(newProject.value)
    if (!ok) {
      projectActionError.value = store.error || 'Could not save the project.'
      return
    }
    isModalOpen.value = false
    editingProjectId.value = null
    newProject.value = { name: '', description: '', color: '#06b6d4' }
  } finally {
    isSavingProject.value = false
  }
}

async function handleDeleteProject(project) {
  projectActionError.value = ''
  const tasks = store.tasks.filter((task) => task.projectId === project.id)
  if (!window.confirm(`Delete “${project.name}” and its ${tasks.length} task${tasks.length === 1 ? '' : 's'}? This cannot be undone.`)) return

  try {
    const linkedTasks = tasks.filter((task) => task.googleCalendarEventId)
    if (linkedTasks.length) {
      if (!hasValidGoogleCalendarConnection()) await connectGoogleCalendar()
      for (const task of linkedTasks) await deleteTaskCalendarEvent(task)
    }
    const ok = await store.deleteProject(project.id)
    if (!ok) projectActionError.value = store.error || 'Could not delete the project.'
  } catch (error) {
    projectActionError.value = `Project kept. Could not remove its linked Google Calendar events: ${error.message}`
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <!-- Header & Actions -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Projects</h2>
        <p class="mt-1 text-sm text-gray-500">
          Create, organize and track everything in one place.
        </p>
      </div>
      <button
        @click="openModal"
        class="group inline-flex w-fit items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95"
      >
        <Plus class="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
        New Project
      </button>
    </div>

    <!-- Filters -->
    <div
      class="animate-fade-up flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
      style="animation-delay: 70ms"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search projects..."
          class="w-full rounded-xl border border-transparent bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-brand/30 focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
      </div>
      <select
        v-model="statusFilter"
        class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-brand/30 focus:ring-4 focus:ring-brand/10"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <button
        @click="showArchived = !showArchived"
        class="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all"
        :class="
          showArchived
            ? 'border-brand/30 bg-brand-soft text-brand'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        "
      >
        <Archive class="h-4 w-4" />
        {{ showArchived ? 'Viewing Archived' : 'Show Archived' }}
      </button>
    </div>

    <p v-if="projectActionError" class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ projectActionError }}
    </p>

    <!-- Empty state -->
    <div
      v-if="filteredProjects.length === 0"
      class="animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm"
      style="animation-delay: 120ms"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
        <FolderOpen class="h-8 w-8" />
      </div>
      <p class="mt-4 font-semibold text-gray-700">No projects found</p>
      <p class="mt-1 max-w-xs text-sm text-gray-500">
        Try adjusting your filters, or create a brand new project to get started.
      </p>
      <button
        @click="openModal"
        class="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        <Plus class="h-4 w-4" /> New Project
      </button>
    </div>

    <!-- Project Grid -->
    <div v-else class="stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="card-hover group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div
          class="h-1.5 w-full"
          :style="{ background: `linear-gradient(90deg, ${project.color}, ${project.color}80)` }"
        ></div>

        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                :style="{ backgroundColor: project.color }"
              >
                <FolderKanban class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p
                  class="truncate font-semibold text-gray-900 transition-colors group-hover:text-brand"
                >
                  {{ project.name }}
                </p>
                <p class="text-xs font-medium text-gray-400">
                  {{ project.archived ? 'Archived' : 'Active project' }}
                </p>
              </div>
            </div>
            <div class="flex flex-shrink-0 items-center gap-1">
              <span
                v-if="project.archived"
                class="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500"
              >
                Archived
              </span>
              <button
                type="button"
                :aria-label="`Edit ${project.name}`"
                title="Edit project"
                @click="openEditModal(project)"
                class="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                type="button"
                :aria-label="`Delete ${project.name}`"
                title="Delete project"
                @click="handleDeleteProject(project)"
                class="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p class="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
            {{ project.description || 'No description provided.' }}
          </p>

          <!-- Progress -->
          <div class="mt-5">
            <div class="mb-1.5 flex items-center justify-between text-xs">
              <span class="font-medium text-gray-500">Progress</span>
              <span class="font-bold text-brand">{{ store.getProjectProgress(project.id) }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                class="progress-shimmer h-full rounded-full transition-all duration-700"
                :style="{
                  width: `${store.getProjectProgress(project.id)}%`,
                  backgroundColor: project.color,
                }"
              ></div>
            </div>
            <div class="mt-2.5 flex items-center justify-between text-xs text-gray-400">
              <span class="inline-flex items-center gap-1">
                <CheckCircle2 class="h-3.5 w-3.5 text-emerald-400" />
                {{ store.getProjectStats(project.id).completed }}/{{
                  store.getProjectStats(project.id).total
                }}
                tasks
              </span>
              <span
                v-if="store.getProjectStats(project.id).overdue > 0"
                class="inline-flex items-center gap-1 font-medium text-red-500"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                {{ store.getProjectStats(project.id).overdue }} overdue
              </span>
              <span v-else class="inline-flex items-center gap-1 text-emerald-500">On track</span>
            </div>
          </div>

          <RouterLink
            :to="`/projects/${project.id}`"
            class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-gray-500 transition-colors group-hover:text-brand"
          >
            Open board
            <ArrowUpRight
              class="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Transition name="modal">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        @click.self="isModalOpen = false"
      >
        <div class="modal-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-900">
                {{ editingProjectId ? 'Edit Project' : 'Create New Project' }}
              </h3>
              <p class="mt-0.5 text-sm text-gray-500">
                {{ editingProjectId ? 'Update the project name, description, or color.' : 'Give your project a name and a splash of color.' }}
              </p>
            </div>
            <button
              @click="isModalOpen = false"
              class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-5 space-y-4">
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Project Name
              </label>
              <input
                v-model="newProject.name"
                placeholder="e.g. Website Redesign"
                class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Description
              </label>
              <textarea
                v-model="newProject.description"
                placeholder="What is this project about?"
                rows="3"
                class="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              ></textarea>
            </div>
            <div>
              <label
                class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                <Palette class="h-3.5 w-3.5" /> Color
              </label>
              <div class="flex flex-wrap items-center gap-2.5">
                <button
                  v-for="color in swatches"
                  :key="color"
                  type="button"
                  @click="newProject.color = color"
                  class="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  :class="
                    newProject.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  "
                  :style="{ backgroundColor: color }"
                ></button>
                <label
                  class="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300"
                >
                  <input
                    v-model="newProject.color"
                    type="color"
                    class="absolute -inset-2 h-12 w-12 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="isModalOpen = false"
              class="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              @click="handleSaveProject"
              class="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover active:scale-95 disabled:opacity-50"
              :disabled="!newProject.name.trim() || isSavingProject"
            >
              <Loader2 v-if="isSavingProject" class="h-4 w-4 animate-spin" />
              <Plus v-else class="h-4 w-4" />
              {{ isSavingProject ? 'Saving…' : editingProjectId ? 'Save Changes' : 'Create Project' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

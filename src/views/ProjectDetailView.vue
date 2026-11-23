<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import {
  connectGoogleCalendar,
  createTaskCalendarEvent,
  deleteTaskCalendarEvent,
  hasValidGoogleCalendarConnection,
  selectedGoogleCalendarId,
} from '@/services/googleCalendar'
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Archive,
  Flag,
  X,
  ListTodo,
  Loader2,
  CheckCheck,
  Trash2,
  Sparkles,
  Timer,
  Play,
  RotateCcw,
  Check,
  GripVertical,
} from 'lucide-vue-next'

const route = useRoute()
const store = useProjectStore()
const projectId = route.params.id

const project = computed(() => store.projects.find((p) => p.id === projectId))
const projectTasks = computed(() => store.tasks.filter((t) => t.projectId === projectId))
const progress = computed(() => store.getProjectProgress(projectId))

const tasksByColumn = computed(() => {
  const groups = { todo: [], 'in-progress': [], done: [] }
  for (const task of projectTasks.value) {
    if (groups[task.status]) groups[task.status].push(task)
  }
  return groups
})

const isTaskModalOpen = ref(false)
const newTask = ref({ title: '', dueDate: '', priority: 'medium' })
const draggingTaskId = ref(null)
const dragOverColumn = ref(null)
const progressDrafts = reactive({})
const taskSyncNotice = ref('')
const isAddingTask = ref(false)

async function handleAddTask() {
  if (!newTask.value.title.trim() || isAddingTask.value) return
  taskSyncNotice.value = ''
  const task = { ...newTask.value, projectId }
  isAddingTask.value = true
  try {
    if (task.dueDate) {
      if (!hasValidGoogleCalendarConnection()) await connectGoogleCalendar()
    }

    const taskId = await store.addTask(task)
    if (!taskId) {
      taskSyncNotice.value = store.error
        ? `Task was not saved: ${store.error}`
        : 'Task was not saved. Check your connection and try again.'
      return
    }

    if (task.dueDate) {
      try {
        const event = await createTaskCalendarEvent({ ...task, id: taskId })
        const linked = await store.updateTask(taskId, {
          googleCalendarEventId: event.id,
          googleCalendarId: selectedGoogleCalendarId(),
        })
        if (!linked) {
          taskSyncNotice.value = 'Task and Google Calendar event were created, but their link could not be saved. Use Sync tasks in the Calendar section to repair it.'
        }
      } catch (error) {
        taskSyncNotice.value = `Task saved, but Google Calendar sync failed: ${error.message}. Use Sync tasks in the Calendar section to retry.`
      }
    }

    isTaskModalOpen.value = false
    newTask.value = { title: '', dueDate: '', priority: 'medium' }
  } catch (error) {
    taskSyncNotice.value = `Task was not saved: ${error.message}`
  } finally {
    isAddingTask.value = false
  }
}

async function handleDeleteTask(task) {
  taskSyncNotice.value = ''
  if (task.googleCalendarEventId) {
    try {
      if (!hasValidGoogleCalendarConnection()) await connectGoogleCalendar()
      await deleteTaskCalendarEvent(task)
    } catch (error) {
      taskSyncNotice.value = `Task kept. Could not remove its Google Calendar event: ${error.message}`
      return
    }
  }
  const deleted = await store.deleteTask(task.id)
  if (!deleted) taskSyncNotice.value = `Google Calendar event removed, but Firestore could not delete the task: ${store.error}`
}

function openTaskModal() {
  newTask.value = { title: '', dueDate: '', priority: 'medium' }
  isTaskModalOpen.value = true
}

function displayProgress(task) {
  return progressDrafts[task.id] ?? task.progress ?? 0
}

function sliderStyle(task) {
  const value = displayProgress(task)
  return { background: `linear-gradient(to right, #0ea5e9 ${value}%, #e0f2fe ${value}%)` }
}

function onProgressInput(task, event) {
  progressDrafts[task.id] = Number(event.target.value)
}

async function commitProgress(task, event) {
  const value = Number(event.target.value)
  progressDrafts[task.id] = value
  if (value >= 100) {
    await store.updateTask(task.id, { status: 'done', progress: 100 })
  } else {
    await store.updateTask(task.id, { progress: value })
  }
}

// Clear local drafts once Firestore confirms the new value.
watch(projectTasks, (list) => {
  for (const task of list) {
    if (progressDrafts[task.id] !== undefined && (task.progress ?? 0) === progressDrafts[task.id]) {
      delete progressDrafts[task.id]
    }
  }
})

async function moveTaskTo(task, status) {
  if (task.status === status) return
  const current = task.progress ?? 0

  if (status === 'todo') {
    await store.updateTask(task.id, { status: 'todo', progress: 0 })
  } else if (status === 'done') {
    await store.updateTask(task.id, { status: 'done', progress: 100 })
  } else {
    const nextProgress = current >= 100 ? 95 : current
    await store.updateTask(task.id, { status: 'in-progress', progress: nextProgress })
  }
}

function onDragStart(task, event) {
  draggingTaskId.value = task.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', task.id)
}

function onDragOver(columnId, event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragOverColumn.value = columnId
}

function onDrop(columnId, event) {
  event.preventDefault()
  const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId.value
  const task = projectTasks.value.find((t) => t.id === taskId)
  dragOverColumn.value = null
  draggingTaskId.value = null
  if (task) moveTaskTo(task, columnId)
}

function onDragEnd() {
  dragOverColumn.value = null
  draggingTaskId.value = null
}

const columns = [
  {
    id: 'todo',
    label: 'To Do',
    hint: 'Drag a task to start working on it',
    icon: ListTodo,
    iconWrap: 'bg-slate-100 text-slate-500',
    count: 'bg-slate-100 text-slate-600',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    hint: 'Drop a task here, then set its progress',
    icon: Loader2,
    iconWrap: 'bg-sky-50 text-sky-500',
    count: 'bg-sky-100 text-sky-600',
  },
  {
    id: 'done',
    label: 'Done',
    hint: 'Tasks land here automatically at 100%',
    icon: CheckCheck,
    iconWrap: 'bg-emerald-50 text-emerald-500',
    count: 'bg-emerald-100 text-emerald-600',
  },
]

const priorityMeta = {
  low: { label: 'Low', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', dot: 'bg-amber-400', pill: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', dot: 'bg-red-500', pill: 'bg-red-100 text-red-700' },
}

const priorityOptions = [
  { value: 'low', label: 'Low', dot: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', dot: 'bg-red-500' },
]

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
}
</script>

<template>
  <div v-if="!project" class="mx-auto max-w-7xl text-center py-16">
    <p class="text-lg font-semibold text-gray-700">Project not found.</p>
    <RouterLink
      to="/projects"
      class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand"
    >
      <ArrowLeft class="h-4 w-4" /> Back to projects
    </RouterLink>
  </div>

  <div v-else class="mx-auto w-full max-w-7xl space-y-6">
    <!-- Project Header -->
    <div
      class="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div
        class="h-1.5 w-full"
        :style="{ background: `linear-gradient(90deg, ${project.color}, ${project.color}66)` }"
      ></div>
      <div class="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
        <div class="min-w-0">
          <RouterLink
            to="/projects"
            class="group mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-brand"
          >
            <ArrowLeft class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            All projects
          </RouterLink>
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              :style="{ backgroundColor: project.color }"
            >
              <ListTodo class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-2xl font-bold tracking-tight text-gray-900">
                {{ project.name }}
              </h2>
              <p class="mt-0.5 line-clamp-1 text-sm text-gray-500">
                {{ project.description || 'No description' }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="min-w-[140px] flex-1 rounded-xl bg-gray-50 p-3 sm:flex-none">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-gray-500">Progress</span>
              <span class="font-bold text-brand">{{ progress }}%</span>
            </div>
            <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                class="progress-shimmer h-full rounded-full bg-linear-to-r from-cyan-400 to-blue-600 transition-all duration-700"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>
          <button
            @click="store.toggleArchive(projectId)"
            class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95"
          >
            <Archive class="h-4 w-4" />
            {{ project.archived ? 'Unarchive' : 'Archive' }}
          </button>
          <button
            @click="openTaskModal"
            class="group inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover active:scale-95"
          >
            <Plus class="h-4 w-4 transition-transform group-hover:rotate-90" />
            Add Task
          </button>
        </div>
      </div>
    </div>

    <div v-if="taskSyncNotice" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <span>{{ taskSyncNotice }}</span>
    </div>

    <!-- Flow hint -->
    <div
      class="animate-fade-up flex items-start gap-2.5 rounded-xl border border-brand/15 bg-brand-soft/70 px-4 py-2.5 text-xs leading-relaxed text-brand"
      style="animation-delay: 60ms"
    >
      <GripVertical class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>
        Drag tasks from <strong>To Do</strong> into <strong>In Progress</strong>, then adjust the
        percentage. Reaching <strong>100%</strong> moves the task to <strong>Done</strong>
        automatically.
      </span>
    </div>

    <!-- Kanban Board -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div
        v-for="(col, idx) in columns"
        :key="col.id"
        class="animate-fade-up flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 lg:h-[600px]"
        :class="
          dragOverColumn === col.id ? 'border-brand/50 ring-2 ring-brand/20' : 'border-gray-100'
        "
        :style="{ animationDelay: `${100 + idx * 80}ms` }"
        @dragover="onDragOver(col.id, $event)"
        @drop="onDrop(col.id, $event)"
      >
        <div class="flex items-center justify-between border-b border-gray-100 p-4">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="col.iconWrap">
              <component :is="col.icon" class="h-4 w-4" />
            </div>
            <h3 class="font-semibold text-gray-700">{{ col.label }}</h3>
          </div>
          <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="col.count">
            {{ tasksByColumn[col.id].length }}
          </span>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto p-3">
          <TransitionGroup name="task" tag="div" class="relative space-y-3">
            <div
              v-for="task in tasksByColumn[col.id]"
              :key="task.id"
              class="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-brand/30 hover:shadow-md"
              :class="{
                'opacity-40': draggingTaskId === task.id,
                'bg-emerald-50/30': task.status === 'done',
              }"
            >
              <!-- Draggable area -->
              <div
                draggable="true"
                class="flex cursor-grab items-start gap-2.5 p-3.5 pb-2 active:cursor-grabbing"
                title="Drag to move"
                @dragstart="onDragStart(task, $event)"
                @dragend="onDragEnd"
              >
                <div class="mt-0.5 flex-shrink-0">
                  <CheckCircle2 v-if="task.status === 'done'" class="h-5 w-5 text-emerald-500" />
                  <Timer v-else-if="task.status === 'in-progress'" class="h-5 w-5 text-sky-500" />
                  <Circle v-else class="h-5 w-5 text-gray-300" />
                </div>

                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-medium text-gray-800 transition-colors"
                    :class="{ 'line-through text-gray-400': task.status === 'done' }"
                  >
                    {{ task.title }}
                  </p>
                  <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      :class="priorityMeta[task.priority]?.pill || priorityMeta.medium.pill"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="priorityMeta[task.priority]?.dot || priorityMeta.medium.dot"
                      ></span>
                      {{ priorityMeta[task.priority]?.label || 'Medium' }}
                    </span>
                    <span
                      v-if="task.dueDate"
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="
                        isOverdue(task) ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                      "
                    >
                      <Clock class="h-3 w-3" />
                      {{ task.dueDate }}
                    </span>
                  </div>
                </div>

              </div>

              <!-- Progress control (In Progress only) -->
              <div v-if="task.status === 'in-progress'" class="px-3.5 pb-2">
                <div class="rounded-lg bg-sky-50/70 p-2.5">
                  <div
                    class="flex items-center justify-between text-[11px] font-semibold text-sky-700"
                  >
                    <span>Progress</span>
                    <span class="tabular-nums">{{ displayProgress(task) }}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    :value="displayProgress(task)"
                    class="progress-slider mt-2 w-full"
                    aria-label="Task progress"
                    :style="sliderStyle(task)"
                    @input="onProgressInput(task, $event)"
                    @change="commitProgress(task, $event)"
                  />
                  <p class="mt-1.5 text-[10px] font-medium text-sky-600/70">
                    Reaches 100% → moves to Done
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center justify-between gap-2 border-t border-gray-100 px-3.5 py-2"
              >
                <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {{ col.label }}
                </span>
                <div class="flex items-center gap-1.5">
                  <button
                    @click="handleDeleteTask(task)"
                    class="rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete task"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                  <button
                    v-if="task.status === 'todo'"
                    @click="moveTaskTo(task, 'in-progress')"
                    class="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-600 transition hover:bg-sky-100 active:scale-95"
                    title="Start working on this task"
                  >
                    <Play class="h-3 w-3" /> Start
                  </button>
                  <button
                    v-else-if="task.status === 'in-progress'"
                    @click="moveTaskTo(task, 'done')"
                    class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600 transition hover:bg-emerald-100 active:scale-95"
                    title="Mark as done"
                  >
                    <Check class="h-3 w-3" /> Complete
                  </button>
                  <button
                    v-else
                    @click="moveTaskTo(task, 'todo')"
                    class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-200 active:scale-95"
                    title="Move back to To Do"
                  >
                    <RotateCcw class="h-3 w-3" /> Reopen
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div
            v-if="tasksByColumn[col.id].length === 0"
            class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center"
          >
            <Sparkles class="h-6 w-6 text-gray-300" />
            <p class="mt-2 text-xs font-medium text-gray-400">{{ col.hint }}</p>
          </div>
        </div>

        <div class="border-t border-gray-100 p-3">
          <button
            v-if="col.id === 'todo'"
            @click="openTaskModal"
            class="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-gray-500 transition hover:bg-brand-soft hover:text-brand"
          >
            <Plus class="h-4 w-4" /> Add Task
          </button>
          <p v-else class="py-1.5 text-center text-[11px] font-medium text-gray-400">
            {{
              col.id === 'in-progress'
                ? 'Drag a card here · set progress to advance'
                : 'Completed tasks appear here at 100%'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <Transition name="modal">
      <div
        v-if="isTaskModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        @click.self="isTaskModalOpen = false"
      >
        <div class="modal-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Add Task</h3>
              <p class="mt-0.5 text-sm text-gray-500">New tasks start in the To Do column.</p>
            </div>
            <button
              @click="isTaskModalOpen = false"
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
                Task Title
              </label>
              <input
                v-model="newTask.title"
                placeholder="e.g. Design the landing page"
                class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Due Date
              </label>
              <input
                v-model="newTask.dueDate"
                type="date"
                class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
              />
            </div>
            <div>
              <label
                class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                <Flag class="h-3.5 w-3.5" /> Priority
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  type="button"
                  @click="newTask.priority = opt.value"
                  class="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition"
                  :class="
                    newTask.priority === opt.value
                      ? 'border-brand/40 bg-brand-soft text-brand'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  "
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="opt.dot"></span>
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="isTaskModalOpen = false"
              class="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              @click="handleAddTask"
              class="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover active:scale-95 disabled:opacity-50"
              :disabled="!newTask.title.trim() || isAddingTask"
            >
              <Loader2 v-if="isAddingTask" class="h-4 w-4 animate-spin" />
              <Plus v-else class="h-4 w-4" />
              {{ isAddingTask ? 'Syncing…' : 'Add Task' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

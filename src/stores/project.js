import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase'

function withId(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref([])
  const tasks = ref([])
  const loading = ref(false)
  const error = ref('')

  let currentUid = null
  let unsubProjects = null
  let unsubTasks = null

  const loaded = { projects: false, tasks: false }

  function finishLoading() {
    loading.value = !(loaded.projects && loaded.tasks)
  }

  function handleError(err) {
    error.value = err?.message || 'Failed to sync with Firestore.'
    loading.value = false
  }

  function subscribe(uid) {
    if (!uid) return
    if (currentUid === uid && (unsubProjects || unsubTasks)) return

    reset()
    currentUid = uid
    loading.value = true
    error.value = ''
    loaded.projects = false
    loaded.tasks = false

    unsubProjects = onSnapshot(
      collection(db, 'users', uid, 'projects'),
      (snapshot) => {
        projects.value = withId(snapshot)
        loaded.projects = true
        finishLoading()
      },
      handleError,
    )

    unsubTasks = onSnapshot(
      collection(db, 'users', uid, 'tasks'),
      (snapshot) => {
        tasks.value = withId(snapshot)
        loaded.tasks = true
        finishLoading()
      },
      handleError,
    )
  }

  function reset() {
    unsubProjects?.()
    unsubTasks?.()
    unsubProjects = null
    unsubTasks = null
    currentUid = null
    projects.value = []
    tasks.value = []
    loading.value = false
    error.value = ''
    loaded.projects = false
    loaded.tasks = false
  }

  function clearError() {
    error.value = ''
  }

  async function run(action) {
    if (!currentUid) {
      error.value = 'You need to be signed in to do that.'
      return false
    }
    try {
      error.value = ''
      await action(currentUid)
      return true
    } catch (err) {
      error.value = err?.message || 'Something went wrong while saving.'
      return false
    }
  }

  // --- Getters ---
  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.value.filter((t) => t.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const total = projectTasks.reduce((sum, task) => {
      if (task.status === 'done') return sum + 100
      const value = Number(task.progress)
      return sum + (Number.isFinite(value) ? Math.min(Math.max(value, 0), 99) : 0)
    }, 0)
    return Math.round(total / projectTasks.length)
  }

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.value.filter((t) => t.projectId === projectId)
    const now = new Date().toISOString().split('T')[0]
    return {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.status === 'done').length,
      overdue: projectTasks.filter((t) => t.status !== 'done' && t.dueDate < now).length,
    }
  }

  const getFilteredProjects = (searchTerm, statusFilter, showArchived = false) => {
    return projects.value.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter ? p.status === statusFilter : true
      const matchesArchive = showArchived ? p.archived : !p.archived
      return matchesSearch && matchesStatus && matchesArchive
    })
  }

  const projectCount = computed(() => projects.value.filter((p) => !p.archived).length)

  // --- Actions ---
  function addProject(project) {
    return run((uid) =>
      addDoc(collection(db, 'users', uid, 'projects'), {
        name: project.name.trim(),
        description: project.description?.trim() || '',
        color: project.color || '#4f46e5',
        status: 'active',
        archived: false,
        createdAt: new Date().toISOString(),
      }),
    )
  }

  function updateProject(id, updates) {
    return run((uid) => updateDoc(doc(db, 'users', uid, 'projects', id), updates))
  }

  function deleteProject(id) {
    return run(async (uid) => {
      const batch = writeBatch(db)
      const projectTasks = await getDocs(
        query(collection(db, 'users', uid, 'tasks'), where('projectId', '==', id)),
      )
      projectTasks.forEach((task) => batch.delete(task.ref))
      batch.delete(doc(db, 'users', uid, 'projects', id))
      await batch.commit()
    })
  }

  function toggleArchive(id) {
    const project = projects.value.find((p) => p.id === id)
    if (!project) return Promise.resolve(false)
    return updateProject(id, { archived: !project.archived })
  }

  // --- Task Actions ---
  function addTask(task) {
    return run((uid) =>
      addDoc(collection(db, 'users', uid, 'tasks'), {
        projectId: task.projectId,
        title: task.title.trim(),
        description: task.description?.trim() || '',
        status: 'todo',
        progress: 0,
        priority: task.priority || 'medium',
        dueDate: task.dueDate || '',
        createdAt: new Date().toISOString(),
      }),
    )
  }

  function updateTask(taskId, updates) {
    return run((uid) => updateDoc(doc(db, 'users', uid, 'tasks', taskId), updates))
  }

  function deleteTask(taskId) {
    return run((uid) => deleteDoc(doc(db, 'users', uid, 'tasks', taskId)))
  }

  return {
    projects,
    tasks,
    loading,
    error,
    projectCount,
    subscribe,
    reset,
    clearError,
    getProjectProgress,
    getProjectStats,
    getFilteredProjects,
    addProject,
    updateProject,
    deleteProject,
    toggleArchive,
    addTask,
    updateTask,
    deleteTask,
  }
})

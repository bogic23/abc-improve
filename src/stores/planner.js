import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { localDateKey } from '../utils/date'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

export const usePlannerStore = defineStore('planner', () => {
  const auth = useAuthStore()
  const tasks = ref([])

  const todayKey = computed(() => localDateKey())
  const todayTasks = computed(() => tasks.value.filter(t => t.date === todayKey.value))

  function persist(task) {
    saveItem(auth.user?.uid, 'tasks', task).catch((err) => {
      reportSyncError('Could not save your planner to Firebase.', err)
    })
  }

  function addTask(text, date = todayKey.value, priority = 'medium') {
    const trimmedText = text.trim()
    if (!trimmedText || !date) return

    const task = {
      id: Date.now(),
      text: trimmedText,
      date,
      done: false,
      priority,
    }

    tasks.value.push(task)
    persist(task)
  }

  function toggleTask(id) {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return
    task.done = !task.done
    persist(task)
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(task => task.id !== id)
    deleteItem(auth.user?.uid, 'tasks', id).catch((err) => {
      reportSyncError('Could not delete that task from Firebase.', err)
    })
  }

  function hydrate(items) {
    tasks.value = Array.isArray(items) ? items : []
  }

  function reset() {
    tasks.value = []
  }

  return { tasks, todayKey, todayTasks, addTask, toggleTask, removeTask, hydrate, reset }
}, { persist: true })

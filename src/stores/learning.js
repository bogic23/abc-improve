import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

export const useLearningStore = defineStore('learning', () => {
  const auth = useAuthStore()
  const resources = ref([])
  const progressTimers = new Map()

  function persist(resource) {
    saveItem(auth.user?.uid, 'learning', resource).catch((err) => {
      reportSyncError('Could not save your learning progress to Firebase.', err)
    })
  }

  function addResource(title, type = 'course') {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const resource = {
      id: Date.now(),
      title: trimmedTitle,
      type,
      progress: 0,
      status: 'in-progress',
    }

    resources.value.push(resource)
    persist(resource)
  }

  function updateProgress(id, percent) {
    const item = resources.value.find(r => r.id === id)
    if (!item || !Number.isFinite(percent)) return

    item.progress = Math.max(0, Math.min(percent, 100))
    item.status = item.progress === 100 ? 'completed' : 'in-progress'

    clearTimeout(progressTimers.get(id))
    progressTimers.set(id, setTimeout(() => {
      persist(item)
      progressTimers.delete(id)
    }, 500))
  }

  function removeResource(id) {
    clearTimeout(progressTimers.get(id))
    progressTimers.delete(id)
    resources.value = resources.value.filter(resource => resource.id !== id)
    deleteItem(auth.user?.uid, 'learning', id).catch((err) => {
      reportSyncError('Could not delete that resource from Firebase.', err)
    })
  }

  function hydrate(items) {
    resources.value = Array.isArray(items) ? items : []
  }

  function reset() {
    for (const timer of progressTimers.values()) clearTimeout(timer)
    progressTimers.clear()
    resources.value = []
  }

  return { resources, addResource, updateProgress, removeResource, hydrate, reset }
}, { persist: true })

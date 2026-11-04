import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLearningStore = defineStore('learning', () => {
  const resources = ref([
    { id: 1, title: 'Vue 3 Deep Dive', type: 'course', progress: 60, status: 'in-progress' },
  ])

  function addResource(title, type = 'course') {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    resources.value.push({
      id: Date.now(),
      title: trimmedTitle,
      type,
      progress: 0,
      status: 'in-progress',
    })
  }

  function updateProgress(id, percent) {
    const item = resources.value.find(r => r.id === id)
    if (item && Number.isFinite(percent)) {
      item.progress = Math.max(0, Math.min(percent, 100))
      item.status = item.progress === 100 ? 'completed' : 'in-progress'
    }
  }

  function removeResource(id) {
    resources.value = resources.value.filter(resource => resource.id !== id)
  }

  return { resources, addResource, updateProgress, removeResource }
}, { persist: true })
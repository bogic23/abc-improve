import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { localDateKey } from '../utils/date'

export const usePlannerStore = defineStore('planner', () => {
  const tasks = ref([])

  const todayKey = computed(() => localDateKey())
  const todayTasks = computed(() => tasks.value.filter(t => t.date === todayKey.value))

  function addTask(text, date = todayKey.value, priority = 'medium') {
    const trimmedText = text.trim()
    if (!trimmedText || !date) return

    tasks.value.push({
      id: Date.now(),
      text: trimmedText,
      date,
      done: false,
      priority,
    })
  }

  function toggleTask(id) {
    const task = tasks.value.find(t => t.id === id)
    if (task) task.done = !task.done
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(task => task.id !== id)
  }

  return { tasks, todayKey, todayTasks, addTask, toggleTask, removeTask }
}, { persist: true })
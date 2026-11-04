import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

export const useGoalsStore = defineStore('goals', () => {
  const auth = useAuthStore()
  const goals = ref([])

  const activeGoals = computed(() => goals.value.filter(g => g.status === 'active'))

  function persist(goal) {
    saveItem(auth.user?.uid, 'goals', goal).catch((err) => {
      reportSyncError('Could not save your goals to Firebase.', err)
    })
  }

  function addGoal(goal) {
    const item = { ...goal, id: Date.now(), current: 0, status: 'active' }
    goals.value.push(item)
    persist(item)
  }

  function updateProgress(id, amount) {
    const goal = goals.value.find(g => g.id === id)
    if (!goal || !Number.isFinite(amount)) return

    goal.current = Math.max(0, Math.min(goal.current + amount, goal.target))
    if (goal.current >= goal.target) goal.status = 'completed'
    persist(goal)
  }

  function removeGoal(id) {
    goals.value = goals.value.filter(goal => goal.id !== id)
    deleteItem(auth.user?.uid, 'goals', id).catch((err) => {
      reportSyncError('Could not delete that goal from Firebase.', err)
    })
  }

  function hydrate(items) {
    goals.value = Array.isArray(items) ? items : []
  }

  function reset() {
    goals.value = []
  }

  return { goals, activeGoals, addGoal, updateProgress, removeGoal, hydrate, reset }
}, { persist: true })

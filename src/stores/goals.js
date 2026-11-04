import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref([
    { id: 1, title: 'Read 24 books this year', category: 'Learning', target: 24, current: 7, deadline: '2026-12-31', status: 'active' },
    { id: 2, title: 'Run a half marathon', category: 'Health', target: 1, current: 0, deadline: '2026-09-01', status: 'active' },
  ])

  const activeGoals = computed(() => goals.value.filter(g => g.status === 'active'))

  function addGoal(goal) {
    goals.value.push({ ...goal, id: Date.now(), current: 0, status: 'active' })
  }

  function updateProgress(id, amount) {
    const goal = goals.value.find(g => g.id === id)
    if (!goal || !Number.isFinite(amount)) return

    goal.current = Math.max(0, Math.min(goal.current + amount, goal.target))
    if (goal.current >= goal.target) goal.status = 'completed'
  }

  function removeGoal(id) {
    goals.value = goals.value.filter(goal => goal.id !== id)
  }

  return { goals, activeGoals, addGoal, updateProgress, removeGoal }
}, { persist: true })
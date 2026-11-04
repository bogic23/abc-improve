import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref([{ id: 1, name: 'Morning meditation', frequency: 'daily', completions: [] }])

  function addHabit(name) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    habits.value.push({
      id: Date.now(),
      name: trimmedName,
      frequency: 'daily',
      completions: [],
    })
  }

  function removeHabit(habitId) {
    habits.value = habits.value.filter(habit => habit.id !== habitId)
  }

  function toggleCompletion(habitId, dateKey) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return
    const idx = habit.completions.indexOf(dateKey)
    if (idx >= 0) habit.completions.splice(idx, 1)
    else habit.completions.push(dateKey)
  }

  function isCompleted(habitId, dateKey) {
    const habit = habits.value.find(h => h.id === habitId)
    return habit?.completions.includes(dateKey) ?? false
  }

  function streak(habitId) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return 0
    let count = 0
    const today = new Date()
    for (let i = 0; ; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (habit.completions.includes(key)) count++
      else break
    }
    return count
  }

  return { habits, addHabit, removeHabit, toggleCompletion, isCompleted, streak }
}, { persist: true })
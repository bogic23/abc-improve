import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

export const useHabitsStore = defineStore('habits', () => {
  const auth = useAuthStore()
  const habits = ref([])

  function persist(habit) {
    saveItem(auth.user?.uid, 'habits', habit).catch((err) => {
      reportSyncError('Could not save your habits to Firebase.', err)
    })
  }

  function addHabit(name) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const habit = {
      id: Date.now(),
      name: trimmedName,
      frequency: 'daily',
      completions: [],
    }

    habits.value.push(habit)
    persist(habit)
  }

  function removeHabit(habitId) {
    habits.value = habits.value.filter(habit => habit.id !== habitId)
    deleteItem(auth.user?.uid, 'habits', habitId).catch((err) => {
      reportSyncError('Could not delete that habit from Firebase.', err)
    })
  }

  function toggleCompletion(habitId, dateKey) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return
    const idx = habit.completions.indexOf(dateKey)
    if (idx >= 0) habit.completions.splice(idx, 1)
    else habit.completions.push(dateKey)
    persist(habit)
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

  function hydrate(items) {
    habits.value = Array.isArray(items) ? items : []
  }

  function reset() {
    habits.value = []
  }

  return { habits, addHabit, removeHabit, toggleCompletion, isCompleted, streak, hydrate, reset }
}, { persist: true })

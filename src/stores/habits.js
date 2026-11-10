import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { localDateKey } from '../utils/date'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

const DEFAULT_SET_NAME = 'Daily routine'

function compareNames(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export const useHabitsStore = defineStore('habits', () => {
  const auth = useAuthStore()
  const habits = ref([])
  const sets = ref([])
  const selections = ref([])

  const todayKey = computed(() => localDateKey())

  function persist(name, item) {
    saveItem(auth.user?.uid, name, item).catch((err) => {
      reportSyncError('Could not save your habits to Firebase.', err)
    })
  }

  function persistHabit(habit) {
    persist('habits', habit)
  }

  function persistSet(set) {
    persist('habitSets', set)
  }

  function persistSelection(selection) {
    persist('habitSelections', selection)
  }

  function addSet(name) {
    const trimmedName = name.trim()
    if (!trimmedName) return null

    const set = { id: Date.now(), name: trimmedName }
    sets.value.push(set)
    persistSet(set)
    return set
  }

  function removeSet(setId) {
    sets.value = sets.value.filter(set => set.id !== setId)

    const removedSelections = selections.value.filter(selection => selection.setId === setId)
    selections.value = selections.value.filter(selection => selection.setId !== setId)
    removedSelections.forEach(selection => {
      deleteItem(auth.user?.uid, 'habitSelections', selection.id).catch((err) => {
        reportSyncError('Could not delete that routine selection from Firebase.', err)
      })
    })

    const removedHabits = habits.value.filter(habit => habit.setId === setId)
    habits.value = habits.value.filter(habit => habit.setId !== setId)
    removedHabits.forEach(habit => {
      deleteItem(auth.user?.uid, 'habits', habit.id).catch((err) => {
        reportSyncError('Could not delete those habits from Firebase.', err)
      })
    })

    deleteItem(auth.user?.uid, 'habitSets', setId).catch((err) => {
      reportSyncError('Could not delete that routine from Firebase.', err)
    })
  }

  function selectionFor(dateKey) {
    return selections.value.find(selection => selection.id === dateKey) ?? null
  }

  function selectSetForDate(setId, dateKey = localDateKey()) {
    const existing = selectionFor(dateKey)
    if (existing) {
      existing.setId = setId
      persistSelection(existing)
      return
    }

    const selection = { id: dateKey, setId }
    selections.value.push(selection)
    persistSelection(selection)
  }

  function addHabit(name, setId) {
    const trimmedName = name.trim()
    if (!trimmedName || setId == null) return

    const habit = {
      id: Date.now(),
      name: trimmedName,
      setId,
      frequency: 'daily',
      completions: [],
      completionTimes: {},
    }

    habits.value.push(habit)
    persistHabit(habit)
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
    if (idx >= 0) {
      habit.completions.splice(idx, 1)
      if (habit.completionTimes) delete habit.completionTimes[dateKey]
    } else {
      habit.completions.push(dateKey)
      if (!habit.completionTimes) habit.completionTimes = {}
      habit.completionTimes[dateKey] = new Date().toISOString()
    }
    persistHabit(habit)
  }

  function isCompleted(habitId, dateKey) {
    const habit = habits.value.find(h => h.id === habitId)
    return habit?.completions.includes(dateKey) ?? false
  }

  function completionTime(habitId, dateKey) {
    const habit = habits.value.find(h => h.id === habitId)
    return habit?.completionTimes?.[dateKey] ?? null
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

  const todaySetId = computed(() => selectionFor(todayKey.value)?.setId ?? null)
  const todaySet = computed(() => sets.value.find(set => set.id === todaySetId.value) ?? null)
  const sortedSets = computed(() => [...sets.value].sort((a, b) => compareNames(a.name, b.name)))
  const todayHabits = computed(() => {
    if (todaySetId.value == null) return []
    return habits.value
      .filter(habit => habit.setId === todaySetId.value)
      .sort((a, b) => compareNames(a.name, b.name))
  })

  function habitsForSet(setId) {
    return habits.value
      .filter(habit => habit.setId === setId)
      .sort((a, b) => compareNames(a.name, b.name))
  }

  function migrateLegacyHabits(uid) {
    const orphans = habits.value.filter(habit => !habit.setId)
    if (!orphans.length) return

    let set = sets.value.find(item => item.name === DEFAULT_SET_NAME)
    if (!set) {
      set = { id: Date.now(), name: DEFAULT_SET_NAME }
      sets.value.push(set)
      if (uid) {
        saveItem(uid, 'habitSets', set).catch((err) => {
          reportSyncError('Could not save your default routine to Firebase.', err)
        })
      }
    }

    orphans.forEach((habit) => {
      habit.setId = set.id
      if (uid) {
        saveItem(uid, 'habits', habit).catch((err) => {
          reportSyncError('Could not migrate your habits in Firebase.', err)
        })
      }
    })
  }

  function hydrate(items) {
    habits.value = Array.isArray(items)
      ? items.map(item => ({
          ...item,
          setId: item.setId ?? null,
          completions: Array.isArray(item.completions) ? item.completions : [],
          completionTimes: item.completionTimes && typeof item.completionTimes === 'object'
            ? item.completionTimes
            : {},
        }))
      : []
  }

  function hydrateSets(items) {
    sets.value = Array.isArray(items) ? items.map(item => ({ ...item })) : []
  }

  function hydrateSelections(items) {
    selections.value = Array.isArray(items) ? items.map(item => ({ ...item })) : []
  }

  function reset() {
    habits.value = []
    sets.value = []
    selections.value = []
  }

  return {
    habits,
    sets,
    selections,
    todayKey,
    todaySetId,
    todaySet,
    todayHabits,
    sortedSets,
    addSet,
    removeSet,
    selectSetForDate,
    habitsForSet,
    addHabit,
    removeHabit,
    toggleCompletion,
    isCompleted,
    completionTime,
    streak,
    migrateLegacyHabits,
    hydrate,
    hydrateSets,
    hydrateSelections,
    reset,
  }
}, { persist: true })

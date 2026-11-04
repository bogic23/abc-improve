import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { localDateKey } from '../utils/date'
import { deleteItem, saveItem } from '../lib/userData'
import { reportSyncError } from '../lib/syncStatus'

export const useJournalStore = defineStore('journal', () => {
  const auth = useAuthStore()
  const entries = ref([])

  function persist(entry) {
    saveItem(auth.user?.uid, 'journal', entry).catch((err) => {
      reportSyncError('Could not save your journal entry to Firebase.', err)
    })
  }

  function addEntry(content, mood = 'neutral') {
    const entry = {
      id: Date.now(),
      date: localDateKey(),
      content,
      mood,
    }

    entries.value.push(entry)
    persist(entry)
  }

  function removeEntry(id) {
    entries.value = entries.value.filter(entry => entry.id !== id)
    deleteItem(auth.user?.uid, 'journal', id).catch((err) => {
      reportSyncError('Could not delete that journal entry from Firebase.', err)
    })
  }

  function getByDate(dateKey) {
    return entries.value.filter(e => e.date === dateKey)
  }

  function hydrate(items) {
    entries.value = Array.isArray(items) ? items : []
  }

  function reset() {
    entries.value = []
  }

  return { entries, addEntry, removeEntry, getByDate, hydrate, reset }
}, { persist: true })

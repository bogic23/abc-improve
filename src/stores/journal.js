import { defineStore } from 'pinia'
import { ref } from 'vue'
import { localDateKey } from '../utils/date'

export const useJournalStore = defineStore('journal', () => {
  const entries = ref([])

  function addEntry(content, mood = 'neutral') {
    entries.value.push({
      id: Date.now(),
      date: localDateKey(),
      content,
      mood,
    })
  }

  function removeEntry(id) {
    entries.value = entries.value.filter(entry => entry.id !== id)
  }

  function getByDate(dateKey) {
    return entries.value.filter(e => e.date === dateKey)
  }

  return { entries, addEntry, removeEntry, getByDate }
}, { persist: true })
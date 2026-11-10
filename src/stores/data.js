import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGoalsStore } from './goals'
import { useHabitsStore } from './habits'
import { usePlannerStore } from './planner'
import { useJournalStore } from './journal'
import { useLearningStore } from './learning'
import { loadUserData, saveItem } from '../lib/userData'
import { clearSyncError, reportSyncError } from '../lib/syncStatus'

export const useDataStore = defineStore('data', () => {
  const ready = ref(true)
  const loading = ref(false)

  const DATA_OWNER_KEY = 'improve:dataOwner'

  const goalsStore = useGoalsStore()
  const habitsStore = useHabitsStore()
  const plannerStore = usePlannerStore()
  const journalStore = useJournalStore()
  const learningStore = useLearningStore()

  const collections = [
    { name: 'goals', store: goalsStore, items: () => goalsStore.goals, hydrate: (items) => goalsStore.hydrate(items) },
    { name: 'habits', store: habitsStore, items: () => habitsStore.habits, hydrate: (items) => habitsStore.hydrate(items) },
    { name: 'habitSets', store: habitsStore, items: () => habitsStore.sets, hydrate: (items) => habitsStore.hydrateSets(items) },
    { name: 'habitSelections', store: habitsStore, items: () => habitsStore.selections, hydrate: (items) => habitsStore.hydrateSelections(items) },
    { name: 'tasks', store: plannerStore, items: () => plannerStore.tasks, hydrate: (items) => plannerStore.hydrate(items) },
    { name: 'journal', store: journalStore, items: () => journalStore.entries, hydrate: (items) => journalStore.hydrate(items) },
    { name: 'learning', store: learningStore, items: () => learningStore.resources, hydrate: (items) => learningStore.hydrate(items) },
  ]

  let loadedUid = null
  let requestedUid = null
  let requestId = 0

  function getDataOwner() {
    try {
      return localStorage.getItem(DATA_OWNER_KEY)
    } catch {
      return null
    }
  }

  function setDataOwner(uid) {
    try {
      if (uid) localStorage.setItem(DATA_OWNER_KEY, uid)
      else localStorage.removeItem(DATA_OWNER_KEY)
    } catch {
      // ignore storage errors
    }
  }

  function compareIds(a, b) {
    const aId = Number(a.id)
    const bId = Number(b.id)
    if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId
    return String(a.id).localeCompare(String(b.id))
  }

  function mergeItems(remoteItems, localItems) {
    const merged = new Map(remoteItems.map((item) => [item.id, item]))
    const localOnly = []

    for (const item of localItems) {
      if (!merged.has(item.id)) {
        merged.set(item.id, item)
        localOnly.push(item)
      }
    }

    return { items: [...merged.values()].sort(compareIds), localOnly }
  }

  function resetStores() {
    const stores = new Set(collections.map(collection => collection.store))
    stores.forEach(store => store.reset())
  }

  async function load(uid) {
    if (!uid) {
      reset()
      return
    }

    if (loadedUid === uid && ready.value) return
    if (requestedUid === uid && !ready.value) return

    const owner = getDataOwner()
    if (
      (loadedUid && loadedUid !== uid) ||
      (requestedUid && requestedUid !== uid) ||
      (owner && owner !== uid)
    ) {
      resetStores()
    }

    requestedUid = uid
    const currentRequest = ++requestId
    loading.value = true
    ready.value = false

    try {
      const remote = await loadUserData(uid)
      if (currentRequest !== requestId) return

      if (!remote) {
        clearSyncError()
        return
      }

      let hadWriteError = false

      for (const collection of collections) {
        const remoteItems = remote[collection.name] ?? []
        const localItems = collection.items() ?? []
        const { items, localOnly } = mergeItems(remoteItems, localItems)

        collection.hydrate(items)

        if (localOnly.length) {
          const results = await Promise.allSettled(
            localOnly.map((item) => saveItem(uid, collection.name, item)),
          )
          const failed = results.find((result) => result.status === 'rejected')
          if (failed) {
            hadWriteError = true
            reportSyncError('Some local data could not be saved to Firebase.', failed.reason)
          }
        }
      }

      habitsStore.migrateLegacyHabits(uid)

      loadedUid = uid
      setDataOwner(uid)
      if (!hadWriteError) clearSyncError()
    } catch (err) {
      if (currentRequest === requestId) {
        reportSyncError('Could not load your data from Firebase.', err)
      }
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
        ready.value = true
      }
    }
  }

  function reset() {
    requestId++
    loadedUid = null
    requestedUid = null
    resetStores()
    setDataOwner(null)
    loading.value = false
    ready.value = true
    clearSyncError()
  }

  return { ready, loading, load, reset }
})

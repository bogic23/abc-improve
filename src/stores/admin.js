import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref('')
  const pendingId = ref('')

  let unsubscribe = null

  const admins = computed(() => users.value.filter((u) => u.role === 'admin'))
  const members = computed(() => users.value.filter((u) => u.role !== 'admin'))

  function subscribe() {
    if (unsubscribe) return
    loading.value = true
    error.value = ''

    unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        users.value = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) =>
            (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''),
          )
        loading.value = false
      },
      (err) => {
        error.value = err?.message || 'Could not load users.'
        loading.value = false
      },
    )
  }

  function reset() {
    unsubscribe?.()
    unsubscribe = null
    users.value = []
    loading.value = false
    error.value = ''
    pendingId.value = ''
  }

  async function setRole(uid, role) {
    pendingId.value = uid
    error.value = ''
    try {
      await updateDoc(doc(db, 'users', uid), { role })
      return true
    } catch (err) {
      error.value = err?.message || 'Could not update this user.'
      return false
    } finally {
      pendingId.value = ''
    }
  }

  return {
    users,
    loading,
    error,
    pendingId,
    admins,
    members,
    subscribe,
    reset,
    setRole,
  }
})

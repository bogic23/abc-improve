import { app } from './firebase'

export const USER_COLLECTIONS = ['goals', 'habits', 'tasks', 'journal', 'learning']

let firestorePromise = null

export function loadFirestore() {
  if (!firestorePromise) {
    firestorePromise = import('firebase/firestore').catch((err) => {
      firestorePromise = null
      throw err
    })
  }
  return firestorePromise
}

async function getApi() {
  if (!app) return null

  const firestore = await loadFirestore()
  return { db: firestore.getFirestore(app), ...firestore }
}

function normalizeItem(snapshot) {
  const data = snapshot.data()
  const rawId = data.id ?? snapshot.id
  const id = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : rawId
  return { ...data, id }
}

export async function loadCollection(uid, name) {
  if (!uid) return []

  const api = await getApi()
  if (!api) return []

  const snapshot = await api.getDocs(api.collection(api.db, 'users', uid, name))
  return snapshot.docs.map(normalizeItem)
}

export async function loadUserData(uid) {
  if (!uid) return null

  const api = await getApi()
  if (!api) return null

  const entries = await Promise.all(
    USER_COLLECTIONS.map(async (name) => {
      const snapshot = await api.getDocs(api.collection(api.db, 'users', uid, name))
      return [name, snapshot.docs.map(normalizeItem)]
    }),
  )

  return Object.fromEntries(entries)
}

export async function saveItem(uid, name, item) {
  if (!uid || !item) return

  const api = await getApi()
  if (!api) return

  const payload = JSON.parse(JSON.stringify(item))
  await api.setDoc(api.doc(api.db, 'users', uid, name, String(item.id)), payload)
}

export async function deleteItem(uid, name, id) {
  if (!uid || id == null) return

  const api = await getApi()
  if (!api) return

  await api.deleteDoc(api.doc(api.db, 'users', uid, name, String(id)))
}

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { app, auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { loadFirestore } from '../lib/userData'

function friendlyError(error) {
  const code = error?.code ?? ''

  const messages = {
    'auth/invalid-email': 'That email address does not look valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with that email address.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email address.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email. Sign in with your password instead.',
    'auth/credential-already-in-use': 'This sign-in method is already linked to another account.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/weak-password': 'Your password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
    'auth/unauthorized-domain': 'This domain is not authorized for sign-in in Firebase.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/missing-password': 'Please enter your password.',
  }

  return messages[code] ?? error?.message ?? 'Something went wrong. Please try again.'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  const loading = ref(false)
  const error = ref('')
  const profile = ref(null)
  const profileLoading = ref(false)
  const profileError = ref('')

  const isAuthenticated = computed(() => Boolean(user.value))
  const role = computed(() => profile.value?.role || 'guest')
  const displayName = computed(
    () => user.value?.displayName || user.value?.email?.split('@')[0] || 'User',
  )

  let initPromise = null

  function initialize() {
    if (initPromise) return initPromise

    initPromise = new Promise((resolve) => {
      if (!isFirebaseConfigured || !auth) {
        ready.value = true
        resolve()
        return
      }

      onAuthStateChanged(
        auth,
        (currentUser) => {
          user.value = currentUser
          ready.value = true
          resolve()

          if (currentUser) {
            void loadOrCreateProfile(currentUser)
          } else {
            profile.value = null
            profileError.value = ''
          }
        },
        () => {
          ready.value = true
          resolve()
        },
      )
    })

    return initPromise
  }

  function clearError() {
    error.value = ''
  }

  function ensureConfigured() {
    if (!isFirebaseConfigured || !auth) {
      error.value = 'Firebase is not configured. Add your VITE_FIREBASE_* keys to .env and restart the app.'
      throw new Error(error.value)
    }
  }

  async function loadOrCreateProfile(currentUser, { touch = false } = {}) {
    if (!isFirebaseConfigured || !app || !currentUser) return null

    profileLoading.value = true
    profileError.value = ''

    try {
      const { getFirestore, doc, getDoc, serverTimestamp, setDoc } = await loadFirestore()
      const db = getFirestore(app)
      const userRef = doc(db, 'users', currentUser.uid)
      const snapshot = await getDoc(userRef)
      const existing = snapshot.exists() ? snapshot.data() : null

      const base = {
        uid: currentUser.uid,
        email: currentUser.email ?? '',
        displayName: currentUser.displayName ?? currentUser.email?.split('@')[0] ?? '',
        photoURL: currentUser.photoURL ?? '',
      }

      const payload = {
        ...base,
        ...(existing?.role ? {} : { role: 'guest' }),
        ...(touch ? { lastLoginAt: serverTimestamp() } : {}),
      }

      if (!existing) {
        payload.createdAt = serverTimestamp()
        payload.lastLoginAt = serverTimestamp()
      }

      await setDoc(userRef, payload, { merge: true })

      if (user.value?.uid === currentUser.uid) {
        profile.value = {
          ...existing,
          ...base,
          role: existing?.role ?? 'guest',
        }
      }

      return profile.value
    } catch (err) {
      console.error('Failed to sync Firestore profile:', err)
      if (user.value?.uid === currentUser.uid) {
        profileError.value = 'We could not sync your profile with Firebase.'
        profile.value = {
          uid: currentUser.uid,
          email: currentUser.email ?? '',
          displayName: currentUser.displayName ?? '',
          role: 'guest',
        }
      }
      return profile.value
    } finally {
      profileLoading.value = false
    }
  }

  async function login(email, password) {
    ensureConfigured()
    loading.value = true
    error.value = ''

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      user.value = credential.user
      await loadOrCreateProfile(credential.user, { touch: true })
      return credential.user
    } catch (err) {
      error.value = friendlyError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, name = '') {
    ensureConfigured()
    loading.value = true
    error.value = ''

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)

      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() })
      }

      user.value = credential.user
      await loadOrCreateProfile(credential.user, { touch: true })
      return credential.user
    } catch (err) {
      error.value = friendlyError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle() {
    ensureConfigured()
    loading.value = true
    error.value = ''

    try {
      const credential = await signInWithPopup(auth, googleProvider)
      user.value = credential.user
      await loadOrCreateProfile(credential.user, { touch: true })
      return credential.user
    } catch (err) {
      error.value = friendlyError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (auth) {
      await signOut(auth)
    }
    user.value = null
    profile.value = null
    profileLoading.value = false
    profileError.value = ''
    error.value = ''
  }

  return {
    user,
    ready,
    loading,
    error,
    profile,
    profileLoading,
    profileError,
    isAuthenticated,
    role,
    displayName,
    initialize,
    clearError,
    login,
    register,
    loginWithGoogle,
    logout,
  }
})

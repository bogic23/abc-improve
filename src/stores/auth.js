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
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/firebase'

let resolveReady
const authReady = new Promise((resolve) => {
  resolveReady = resolve
})

function friendlyError(error) {
  const code = error?.code || ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/missing-password':
      return 'Please enter your password.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/weak-password':
      return 'Your password is too weak. Use at least 6 characters.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups and try again.'
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'This sign-in method is not enabled in Firebase yet.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/cancelled-popup-request':
      return ''
    default:
      return error?.message?.replace('Firebase: ', '') || 'Something went wrong. Please try again.'
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null)
  const initialized = ref(false)
  const pending = ref(false)
  const error = ref('')

  let resolveRole = null
  let roleReady = Promise.resolve()
  let unsubscribeProfile = null

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => role.value === 'admin')

  const displayName = computed(() => {
    if (user.value?.displayName) return user.value.displayName
    if (user.value?.email) return user.value.email.split('@')[0]
    return 'Guest'
  })

  const email = computed(() => user.value?.email || '')
  const photoURL = computed(() => user.value?.photoURL || '')

  const initials = computed(() => {
    return (
      displayName.value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase() || 'U'
    )
  })

  function beginRoleLoad() {
    role.value = null
    roleReady = new Promise((resolve) => {
      resolveRole = resolve
    })
  }

  function finishRoleLoad() {
    if (resolveRole) {
      resolveRole()
      resolveRole = null
    }
  }

  async function ensureProfile(uid) {
    try {
      await setDoc(doc(db, 'users', uid), {
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || '',
        photoURL: auth.currentUser?.photoURL || '',
        role: 'member',
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Could not create user profile:', err)
      role.value = 'member'
      finishRoleLoad()
    }
  }

  function watchProfile(uid) {
    unsubscribeProfile?.()
    unsubscribeProfile = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          ensureProfile(uid)
          return
        }
        const data = snapshot.data()
        role.value = data.role === 'admin' ? 'admin' : 'member'
        finishRoleLoad()
      },
      (err) => {
        console.error('Could not load user role:', err)
        role.value = 'member'
        finishRoleLoad()
      },
    )
  }

  function stopProfileWatch() {
    unsubscribeProfile?.()
    unsubscribeProfile = null
    role.value = null
    finishRoleLoad()
  }

  function init() {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      initialized.value = true
      resolveReady()

      unsubscribeProfile?.()
      unsubscribeProfile = null

      if (currentUser) {
        beginRoleLoad()
        watchProfile(currentUser.uid)
      } else {
        stopProfileWatch()
      }
    })
  }

  async function waitUntilReady() {
    if (!initialized.value) await authReady
    if (user.value) await roleReady
  }

  function clearError() {
    error.value = ''
  }

  async function run(action) {
    pending.value = true
    error.value = ''
    try {
      await action()
      return true
    } catch (err) {
      error.value = friendlyError(err)
      return false
    } finally {
      pending.value = false
    }
  }

  function login(emailValue, password) {
    return run(() => signInWithEmailAndPassword(auth, emailValue, password))
  }

  function register({ name, email: emailValue, password }) {
    return run(async () => {
      const credential = await createUserWithEmailAndPassword(auth, emailValue, password)
      if (name?.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() })
        user.value = { ...credential.user }
        try {
          await roleReady
          await updateDoc(doc(db, 'users', credential.user.uid), {
            displayName: name.trim(),
          })
        } catch (err) {
          console.error('Could not sync display name:', err)
        }
      }
    })
  }

  function loginWithGoogle() {
    return run(() => signInWithPopup(auth, googleProvider))
  }

  function logout() {
    return run(() => signOut(auth))
  }

  return {
    user,
    role,
    initialized,
    pending,
    error,
    isAuthenticated,
    isAdmin,
    displayName,
    email,
    photoURL,
    initials,
    init,
    waitUntilReady,
    clearError,
    login,
    register,
    loginWithGoogle,
    logout,
  }
})

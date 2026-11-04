import { ref } from 'vue'

export const syncError = ref('')

export function reportSyncError(message, error) {
  syncError.value = message
  console.error(message, error)
}

export function clearSyncError() {
  syncError.value = ''
}

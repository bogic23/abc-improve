import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const displayName = ref('User')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  return { theme, displayName, toggleTheme, applyTheme }
}, { persist: true })
import { ref } from 'vue'

const isDark = ref(localStorage.getItem('abc-improve-theme') === 'dark')

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('abc-improve-theme', isDark.value ? 'dark' : 'light')
}

applyTheme()

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  return { isDark, toggleTheme }
}

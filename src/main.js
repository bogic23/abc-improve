import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// Tailwind CSS v4 (imports @import "tailwindcss" and @theme)
import './assets/main.css'

const app = createApp(App)

// Register Pinia for state management
const pinia = createPinia()
app.use(pinia)

// Start listening for Firebase auth state before the router guards run
useAuthStore(pinia).init()

// Register Vue Router for navigation
app.use(router)

// Mount the app
app.mount('#app')

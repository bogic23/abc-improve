import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

useAuthStore(pinia).initialize()

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')

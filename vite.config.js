import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  // Google Calendar API keys are public client credentials. Only expose this
  // single setting to the browser; keep the rest of .env private.
  define: {
    'import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY': JSON.stringify(env.GOOGLE_CALENDAR_API_KEY || ''),
    'import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID': JSON.stringify(env.GOOGLE_CALENDAR_CLIENT_ID || ''),
  },
  plugins: [
    vue(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              maxSize: 550_000,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
  }
})

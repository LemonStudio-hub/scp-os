import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vue-vendor'
            }
            if (id.includes('xterm')) {
              return 'terminal'
            }
            if (id.includes('axios')) {
              return 'network'
            }
            if (id.includes('hammer')) {
              return 'gestures'
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
})
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-service-worker',
      generateBundle() {
        // 复制 Service Worker 到 dist 目录
        const swSource = join(process.cwd(), 'public/sw.ts')
        const swDest = join(process.cwd(), 'dist/sw.js')
        
        if (existsSync(swSource)) {
          copyFileSync(swSource, swDest)
          console.log('Service Worker copied to dist/sw.js')
        }
        
        // 复制 manifest.json
        const manifestSource = join(process.cwd(), 'public/manifest.json')
        const manifestDest = join(process.cwd(), 'dist/manifest.json')
        
        if (existsSync(manifestSource)) {
          copyFileSync(manifestSource, manifestDest)
          console.log('Manifest copied to dist/manifest.json')
        }
        
        // 复制离线页面
        const offlineSource = join(process.cwd(), 'public/offline.html')
        const offlineDest = join(process.cwd(), 'dist/offline.html')
        
        if (existsSync(offlineSource)) {
          copyFileSync(offlineSource, offlineDest)
          console.log('Offline page copied to dist/offline.html')
        }
      }
    }
  ],
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
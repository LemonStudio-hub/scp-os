import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-service-worker',
      generateBundle() {
        // 复制 Service Worker 到 dist 目录
        const swSource = join(__dirname, 'public/sw.ts')
        const swDest = join(__dirname, '../../dist/sw.js')
        
        if (existsSync(swSource)) {
          copyFileSync(swSource, swDest)
          console.log('Service Worker copied to dist/sw.js')
        }
        
        // 复制 manifest.json
        const manifestSource = join(__dirname, 'public/manifest.json')
        const manifestDest = join(__dirname, '../../dist/manifest.json')
        
        if (existsSync(manifestSource)) {
          copyFileSync(manifestSource, manifestDest)
          console.log('Manifest copied to dist/manifest.json')
        }
        
        // 复制离线页面
        const offlineSource = join(__dirname, 'public/offline.html')
        const offlineDest = join(__dirname, '../../dist/offline.html')
        
        if (existsSync(offlineSource)) {
          copyFileSync(offlineSource, offlineDest)
          console.log('Offline page copied to dist/offline.html')
        }
      }
    }
  ],
  publicDir: 'public',
  build: {
    outDir: '../../dist',
    minify: 'terser',
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
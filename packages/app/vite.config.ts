import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as esbuild from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-service-worker',
      async generateBundle() {
        // 编译 Service Worker TypeScript 到 JavaScript
        const swSource = join(__dirname, 'public/sw.ts')
        const swDest = join(__dirname, '../../dist/sw.js')

        if (existsSync(swSource)) {
          try {
            // 使用 esbuild 编译 TypeScript
            const sourceCode = readFileSync(swSource, 'utf-8')
            const result = await esbuild.transform(sourceCode, {
              loader: 'ts',
              target: 'es2020',
              format: 'esm'
            })
            writeFileSync(swDest, result.code)
            console.log('Service Worker compiled and copied to dist/sw.js')
          } catch (error) {
            console.error('Failed to compile Service Worker:', error)
            // Fallback: copy as-is if compilation fails
            copyFileSync(swSource, swDest)
            console.log('Service Worker copied as-is to dist/sw.js')
          }
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
    emptyOutDir: true,
    minify: 'terser',
    modulePreload: { polyfill: false },
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    },
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
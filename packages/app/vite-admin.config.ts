import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { renameSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'rename-admin-entry',
      closeBundle() {
        const src = join(__dirname, '../../dist/admin-index.html')
        const dest = join(__dirname, '../../dist/index.html')
        if (existsSync(src)) {
          renameSync(src, dest)
        }
      },
    },
  ],
  publicDir: 'admin-public',
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
      },
    },
    rollupOptions: {
      input: {
        main: join(__dirname, 'admin-index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vue-vendor'
            }
            if (id.includes('axios')) {
              return 'network'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})

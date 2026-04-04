import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { errorHandler, ErrorType, ErrorSeverity } from './utils/errorHandler'
import { useTerminalStore } from './stores'
import indexedDBService from './utils/indexedDB'

// Initialize user ID early (before app mounts)
indexedDBService.getUserId().then(userId => {
  // Store globally for easy access
  window.__USER_ID__ = userId
  console.log('[App] User ID initialized:', userId)
}).catch(err => {
  console.error('[App] Failed to initialize user ID:', err)
})

// Create Pinia instance
const pinia = createPinia()

// Set up global error handling
window.addEventListener('error', (event) => {
  errorHandler.handleError({
    type: ErrorType.GLOBAL_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: 'Global error',
    details: event.error ? event.error.message : event.message,
    stack: event.error ? event.error.stack : undefined,
    logToConsole: true,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError({
    type: ErrorType.UNHANDLED_PROMISE_REJECTION,
    severity: ErrorSeverity.HIGH,
    message: 'Unhandled Promise rejection',
    details: event.reason instanceof Error ? event.reason.message : String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
    logToConsole: true,
  })
})

const app = createApp(App)

// Use Pinia
app.use(pinia)

// Initialize terminal store
const terminalStore = useTerminalStore()
terminalStore.checkMobile()
terminalStore.updateFontSize()

// Listen for window size changes
window.addEventListener('resize', () => {
  terminalStore.checkMobile()
  terminalStore.updateFontSize()
})

// Set up Vue error handler
app.config.errorHandler = (err, _instance, info) => {
  errorHandler.handleError({
    type: ErrorType.VUE_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: 'Vue error',
    details: err instanceof Error ? err.message : String(err),
    context: info,
    stack: err instanceof Error ? err.stack : undefined,
    logToConsole: true,
  })
}

app.mount('#app')

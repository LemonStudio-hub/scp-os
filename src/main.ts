import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { errorHandler, ErrorType, ErrorSeverity } from './utils/errorHandler'

// 设置全局错误处理
window.addEventListener('error', (event) => {
  errorHandler.handleError({
    type: ErrorType.GLOBAL_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: '全局错误',
    details: event.error ? event.error.message : event.message,
    stack: event.error ? event.error.stack : undefined,
    logToConsole: true,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError({
    type: ErrorType.UNHANDLED_PROMISE_REJECTION,
    severity: ErrorSeverity.HIGH,
    message: '未处理的 Promise 拒绝',
    details: event.reason instanceof Error ? event.reason.message : String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
    logToConsole: true,
  })
})

const app = createApp(App)

// 设置 Vue 错误处理器
app.config.errorHandler = (err, _instance, info) => {
  errorHandler.handleError({
    type: ErrorType.VUE_ERROR,
    severity: ErrorSeverity.CRITICAL,
    message: 'Vue 错误',
    details: err instanceof Error ? err.message : String(err),
    context: info,
    stack: err instanceof Error ? err.stack : undefined,
    logToConsole: true,
  })
}

app.mount('#app')

/**
 * 统一配置管理模块
 * 从环境变量读取配置，提供默认值
 */

export const config = {
  api: {
    workerUrl: import.meta.env.VITE_WORKER_API_URL || 'https://api.scpos.site',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  },
  cache: {
    duration: Number(import.meta.env.VITE_CACHE_DURATION) || 30 * 60 * 1000,
    maxSize: Number(import.meta.env.VITE_CACHE_MAX_SIZE) || 100,
  },
  scraper: {
    retryAttempts: Number(import.meta.env.VITE_SCRAPER_RETRY_ATTEMPTS) || 3,
    retryDelay: Number(import.meta.env.VITE_SCRAPER_RETRY_DELAY) || 1000,
  },
  terminal: {
    scrollback: Number(import.meta.env.VITE_TERMINAL_SCROLLBACK) || 1000,
    tabStopWidth: Number(import.meta.env.VITE_TERMINAL_TAB_STOP_WIDTH) || 4,
  },
  app: {
    version: import.meta.env.VITE_APP_VERSION || 'v0.1.0',
    name: import.meta.env.VITE_APP_NAME || 'SCP Foundation Terminal',
    fastBoot: import.meta.env.VITE_FAST_BOOT === 'true' || false,
  },
} as const

export type Config = typeof config
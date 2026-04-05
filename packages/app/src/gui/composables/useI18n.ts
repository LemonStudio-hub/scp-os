/**
 * useI18n Composable
 * Lightweight i18n system without external dependencies.
 * Detects user language preference from localStorage or browser.
 */

import { ref, computed } from 'vue'
import { messages, localeNames, type Locale } from '../../locales'

const LOCALE_STORAGE_KEY = 'scp-os-locale'

function detectLocale(): Locale {
  // 1. Check localStorage
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'zh-CN')) return saved
  } catch { /* ignore */ }

  // 2. Check browser language
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as any).userLanguage || ''
    if (lang.toLowerCase().startsWith('zh')) return 'zh-CN'
  }

  // 3. Default to English
  return 'en'
}

// Global reactive locale
const currentLocale = ref<Locale>(detectLocale())

export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (val: Locale) => {
      currentLocale.value = val
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, val)
      } catch { /* ignore */ }
    },
  })

  const t = computed(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const msgs = messages[currentLocale.value] || messages.en
      let str = msgs[key] || messages.en[key] || key

      // Replace params like {n}, {name}, etc.
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }

      return str
    }
  })

  const availableLocales = computed<Locale[]>(() => ['en', 'zh-CN'])
  const localeName = computed(() => localeNames[currentLocale.value] || 'English')

  // Helper for date formatting with current locale
  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return d.toLocaleString(currentLocale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options,
    })
  }

  const formatDateShort = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return d.toLocaleDateString(currentLocale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return {
    locale,
    t: t.value,
    availableLocales,
    localeName,
    formatDate,
    formatDateShort,
  }
}

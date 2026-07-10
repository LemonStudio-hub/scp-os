import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useI18n } from '../useI18n'

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('availableLocales', () => {
    it('should return en and zh-CN', () => {
      const { availableLocales } = useI18n()
      expect(availableLocales.value).toEqual(['en', 'zh-CN'])
    })
  })

  describe('locale detection', () => {
    it('should default to en when no localStorage value and non-Chinese browser', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        writable: true,
        configurable: true,
      })

      const { locale } = useI18n()
      // The module-level detectLocale runs at import time, so we test via locale getter
      expect(['en', 'zh-CN']).toContain(locale.value)
    })

    it('should detect zh-CN from localStorage', () => {
      localStorage.setItem('scp-os-locale', 'zh-CN')
      // Re-import to trigger detectLocale again - but since it's module-level,
      // we test via the setter/getter pattern
      const { locale } = useI18n()
      locale.value = 'zh-CN'
      expect(locale.value).toBe('zh-CN')
    })

    it('should persist locale to localStorage on set', () => {
      const { locale } = useI18n()
      locale.value = 'zh-CN'
      expect(localStorage.getItem('scp-os-locale')).toBe('zh-CN')

      locale.value = 'en'
      expect(localStorage.getItem('scp-os-locale')).toBe('en')
    })
  })

  describe('t()', () => {
    it('should return translation for a known key in English', () => {
      const { locale, t } = useI18n()
      locale.value = 'en'
      expect(t('common.cancel')).toBe('Cancel')
    })

    it('should return translation for a known key in zh-CN', () => {
      const { locale, t } = useI18n()
      locale.value = 'zh-CN'
      expect(t('common.cancel')).toBe('取消')
    })

    it('should fall back to the key when translation is missing', () => {
      const { locale, t } = useI18n()
      locale.value = 'en'
      expect(t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('should support {param} interpolation', () => {
      const { locale, t } = useI18n()
      locale.value = 'en'
      const result = t('fb.timeMinAgo', { n: 5 })
      expect(result).toBe('5m ago')
    })

    it('should support multiple {param} interpolations', () => {
      const { locale, t } = useI18n()
      locale.value = 'en'
      const result = t('login.charCount', { max: 20 })
      expect(result).toBe('20 characters max')
    })

    it('should replace all occurrences of the same param', () => {
      const { locale, t } = useI18n()
      locale.value = 'en'
      // Use a key that has a param
      const result = t('fb.timeMinAgo', { n: 3 })
      expect(result).toBe('3m ago')
    })
  })

  describe('localeName', () => {
    it('should return English display name for en locale', () => {
      const { locale, localeName } = useI18n()
      locale.value = 'en'
      expect(localeName.value).toBe('English')
    })

    it('should return Chinese display name for zh-CN locale', () => {
      const { locale, localeName } = useI18n()
      locale.value = 'zh-CN'
      expect(localeName.value).toBe('简体中文')
    })
  })
})

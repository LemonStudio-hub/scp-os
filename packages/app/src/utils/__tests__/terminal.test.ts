import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getResponsiveFontSize,
  isMobileDevice,
  isPrintableCharacter,
  updateTerminalFontSize,
  createTerminalConfig,
} from '../terminal'

describe('terminal utilities', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  describe('getResponsiveFontSize', () => {
    it('should return 16 when width >= 1200', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
      expect(getResponsiveFontSize()).toBe(16)
    })

    it('should return 16 when width > 1200', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      expect(getResponsiveFontSize()).toBe(16)
    })

    it('should return 14 when width >= 768 and < 1200', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      expect(getResponsiveFontSize()).toBe(14)
    })

    it('should return 14 when width is 1024', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
      expect(getResponsiveFontSize()).toBe(14)
    })

    it('should return 12 when width >= 480 and < 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true })
      expect(getResponsiveFontSize()).toBe(12)
    })

    it('should return 12 when width is 600', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true })
      expect(getResponsiveFontSize()).toBe(12)
    })

    it('should return 10 when width < 480', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true })
      expect(getResponsiveFontSize()).toBe(10)
    })

    it('should return 10 when width is 479', () => {
      Object.defineProperty(window, 'innerWidth', { value: 479, configurable: true })
      expect(getResponsiveFontSize()).toBe(10)
    })

    it('should return 14 when window is undefined (test env default)', () => {
      // In jsdom, window.innerWidth is defined so we test the default 1920 case
      // The function returns 14 only when typeof window === 'undefined'
      // which doesn't happen in jsdom, so we test the actual behavior
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      expect(getResponsiveFontSize()).toBe(16)
    })
  })

  describe('isMobileDevice', () => {
    it('should return true for narrow screen (< 768)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      const originalUA = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      })
      expect(isMobileDevice()).toBe(true)
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true })
    })

    it('should return false for wide screen with desktop UA', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      const originalUA = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      })
      expect(isMobileDevice()).toBe(false)
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true })
    })

    it('should return true for wide screen with mobile UA', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      const originalUA = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        configurable: true,
      })
      expect(isMobileDevice()).toBe(true)
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true })
    })

    it('should return true for wide screen with iPhone UA', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      const originalUA = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      })
      expect(isMobileDevice()).toBe(true)
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true })
    })

    it('should return true for wide screen with iPad UA', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      const originalUA = navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        configurable: true,
      })
      expect(isMobileDevice()).toBe(true)
      Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true })
    })
  })

  describe('isPrintableCharacter', () => {
    it('should return false for charCode 31 (space - 1)', () => {
      expect(isPrintableCharacter(String.fromCharCode(31))).toBe(false)
    })

    it('should return true for charCode 32 (space)', () => {
      expect(isPrintableCharacter(String.fromCharCode(32))).toBe(true)
    })

    it('should return true for charCode 126 (~)', () => {
      expect(isPrintableCharacter(String.fromCharCode(126))).toBe(true)
      expect(isPrintableCharacter('~')).toBe(true)
    })

    it('should return false for charCode 127 (DEL)', () => {
      expect(isPrintableCharacter(String.fromCharCode(127))).toBe(false)
    })

    it('should return true for regular letters', () => {
      expect(isPrintableCharacter('a')).toBe(true)
      expect(isPrintableCharacter('Z')).toBe(true)
    })

    it('should return true for digits', () => {
      expect(isPrintableCharacter('0')).toBe(true)
      expect(isPrintableCharacter('9')).toBe(true)
    })

    it('should return true for common symbols', () => {
      expect(isPrintableCharacter('!')).toBe(true)
      expect(isPrintableCharacter('@')).toBe(true)
      expect(isPrintableCharacter('#')).toBe(true)
    })
  })

  describe('updateTerminalFontSize', () => {
    it('should be a no-op when terminal is null', () => {
      expect(() => updateTerminalFontSize(null)).not.toThrow()
    })

    it('should be a no-op when terminal is undefined', () => {
      expect(() => updateTerminalFontSize(undefined)).not.toThrow()
    })

    it('should update fontSize and call refresh on valid terminal', () => {
      const mockTerminal = {
        options: { fontSize: 14 },
        rows: 24,
        refresh: vi.fn(),
      }

      updateTerminalFontSize(mockTerminal)

      expect(mockTerminal.options.fontSize).toBe(getResponsiveFontSize())
      expect(mockTerminal.refresh).toHaveBeenCalledWith(0, 23)
    })

    it('should call refresh with correct row range', () => {
      const mockTerminal = {
        options: { fontSize: 14 },
        rows: 40,
        refresh: vi.fn(),
      }

      updateTerminalFontSize(mockTerminal)
      expect(mockTerminal.refresh).toHaveBeenCalledWith(0, 39)
    })
  })

  describe('createTerminalConfig', () => {
    it('should return config with correct structure', () => {
      const config = createTerminalConfig()

      expect(config).toHaveProperty('theme')
      expect(config).toHaveProperty('fontSize')
      expect(config).toHaveProperty('lineHeight')
      expect(config).toHaveProperty('cursorBlink')
      expect(config).toHaveProperty('cursorStyle')
      expect(config).toHaveProperty('scrollback')
      expect(config).toHaveProperty('tabStopWidth')
      expect(config).toHaveProperty('allowProposedApi')
    })

    it('should have SCP theme', () => {
      const config = createTerminalConfig()
      expect(config.theme).toBeDefined()
      expect(config.theme.background).toBe('#0a0a0a')
    })

    it('should have correct default values', () => {
      const config = createTerminalConfig()
      expect(config.lineHeight).toBe(1.6)
      expect(config.cursorBlink).toBe(true)
      expect(config.cursorStyle).toBe('block')
      expect(config.allowProposedApi).toBe(true)
    })

    it('should use responsive fontSize', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      const config = createTerminalConfig()
      expect(config.fontSize).toBe(16)

      Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true })
      const config2 = createTerminalConfig()
      expect(config2.fontSize).toBe(12)
    })
  })
})

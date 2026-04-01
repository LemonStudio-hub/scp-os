import { describe, it, expect, vi } from 'vitest'
import {
  getResponsiveFontSize,
  createTerminalConfig,
  updateTerminalFontSize,
  sleep,
  randomDelay,
  isPrintableCharacter
} from './terminal'

describe('terminal utils', () => {
  describe('getResponsiveFontSize', () => {
    it('应该返回 16px 用于大屏幕 (>= 1200px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
      expect(getResponsiveFontSize()).toBe(16)
    })

    it('应该返回 14px 用于中等屏幕 (768px - 1199px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      expect(getResponsiveFontSize()).toBe(14)
    })

    it('应该返回 14px 用于中等屏幕 (1000px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
      expect(getResponsiveFontSize()).toBe(14)
    })

    it('应该返回 12px 用于移动端大屏 (480px - 767px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true })
      expect(getResponsiveFontSize()).toBe(12)
    })

    it('应该返回 10px 用于移动端小屏 (< 480px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 479, configurable: true })
      expect(getResponsiveFontSize()).toBe(10)
    })
  })

  describe('createTerminalConfig', () => {
    it('应该返回有效的终端配置', () => {
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

    it('应该使用 SCP_THEME 作为主题', () => {
      const config = createTerminalConfig()
      expect(config.theme).toBeDefined()
    })

    it('应该根据屏幕宽度设置字体大小', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
      const config = createTerminalConfig()
      expect(config.fontSize).toBe(14)
    })

    it('应该设置正确的默认值', () => {
      const config = createTerminalConfig()
      expect(config.lineHeight).toBe(1.6)
      expect(config.cursorBlink).toBe(true)
      expect(config.cursorStyle).toBe('block')
      expect(config.scrollback).toBe(1000)
      expect(config.tabStopWidth).toBe(4)
      expect(config.allowProposedApi).toBe(true)
    })
  })

  describe('updateTerminalFontSize', () => {
    it('应该在终端为 null 时不执行任何操作', () => {
      expect(() => updateTerminalFontSize(null)).not.toThrow()
    })

    it('应该在终端为 undefined 时不执行任何操作', () => {
      expect(() => updateTerminalFontSize(undefined)).not.toThrow()
    })

    it('应该更新终端字体大小', () => {
      const mockTerminal = {
        options: { fontSize: 14 },
        refresh: vi.fn(),
        rows: 10
      }
      
      updateTerminalFontSize(mockTerminal)
      
      expect(mockTerminal.options.fontSize).toBe(getResponsiveFontSize())
      expect(mockTerminal.refresh).toHaveBeenCalledWith(0, mockTerminal.rows - 1)
    })
  })

  describe('sleep', () => {
    it('应该在指定时间后解析', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(95)
    })
  })

  describe('randomDelay', () => {
    it('应该返回 min 和 max 之间的随机数', () => {
      const min = 10
      const max = 20
      const result = randomDelay(min, max)
      
      expect(result).toBeGreaterThanOrEqual(min)
      expect(result).toBeLessThanOrEqual(max)
    })

    it('应该返回不同的随机数', () => {
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        results.add(randomDelay(10, 20))
      }
      // 理论上应该有多个不同的值
      expect(results.size).toBeGreaterThan(1)
    })

    it('应该处理边界值', () => {
      expect(randomDelay(10, 10)).toBe(10)
      expect(randomDelay(5, 10)).toBeGreaterThanOrEqual(5)
      expect(randomDelay(5, 10)).toBeLessThanOrEqual(10)
    })
  })

  describe('isPrintableCharacter', () => {
    it('应该识别可打印的 ASCII 字符', () => {
      expect(isPrintableCharacter('A')).toBe(true)
      expect(isPrintableCharacter('z')).toBe(true)
      expect(isPrintableCharacter('0')).toBe(true)
      expect(isPrintableCharacter(' ')).toBe(true)
      expect(isPrintableCharacter('!')).toBe(true)
    })

    it('应该拒绝不可打印的控制字符', () => {
      expect(isPrintableCharacter(String.fromCharCode(31))).toBe(false)
      expect(isPrintableCharacter(String.fromCharCode(127))).toBe(false)
    })

    it('应该拒绝扩展 ASCII 字符', () => {
      expect(isPrintableCharacter(String.fromCharCode(127))).toBe(false)
      expect(isPrintableCharacter(String.fromCharCode(200))).toBe(false)
    })
  })
})
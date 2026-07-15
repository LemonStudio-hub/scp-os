import { describe, expect, it } from 'vitest'
import {
  adjustColorBrightness,
  hexToRgb,
  hexToRgbA,
  normalizeHex,
  rgbToHex,
} from '../accentColor'

describe('accentColor helpers', () => {
  it('normalizeHex accepts 3 and 6 digit forms', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('AABBCC')).toBe('#aabbcc')
    expect(normalizeHex('not-a-color')).toBeNull()
    expect(normalizeHex('')).toBeNull()
  })

  it('hexToRgb / rgbToHex round-trip', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 })
    expect(rgbToHex({ r: 255, g: 136, b: 0 })).toBe('#ff8800')
  })

  it('hexToRgbA includes alpha', () => {
    expect(hexToRgbA('#112233', 0.5)).toBe('rgba(17, 34, 51, 0.5)')
  })

  it('adjustColorBrightness lightens without channel washout', () => {
    const out = adjustColorBrightness('#808080', 50)
    expect(out).toMatch(/^#[0-9a-f]{6}$/)
    expect(out).not.toBe('#ffffff')
    expect(out).not.toBe('#808080')
  })
})

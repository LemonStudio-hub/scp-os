import { describe, it, expect } from 'vitest'
import {
  createBox,
  createSectionHeader,
  createWarning,
  createError,
  createSuccess,
  createInfo,
} from '../commandFormatter'
import { ANSICode } from '../../constants/theme'

describe('commandFormatter', () => {
  describe('createBox', () => {
    it('should create a box without title', () => {
      const lines = ['Line 1', 'Line 2']
      const result = createBox(lines)

      // Structure: [separator, separator, ...lines, separator]
      // The function pushes separator, then separator again, then lines, then separator
      // So: sep + sep + lines.length + sep = 3 + lines.length
      expect(result).toHaveLength(3 + lines.length)
      // First and last lines should be the red separator
      expect(result[0]).toContain(ANSICode.red)
      expect(result[0]).toContain(ANSICode.reset)
      expect(result[result.length - 1]).toContain(ANSICode.red)
    })

    it('should create a box with title', () => {
      const lines = ['Content']
      const result = createBox(lines, 'My Title')

      // Structure: [separator, title, separator, ...lines, separator]
      expect(result).toHaveLength(4 + lines.length)
      // Title line should be green
      expect(result[1]).toContain(ANSICode.green)
      expect(result[1]).toContain('My Title')
    })

    it('should have correct line count for empty lines with title', () => {
      const result = createBox([], 'Title')
      // sep + title + sep + sep = 4
      expect(result).toHaveLength(4)
    })

    it('should have correct line count for empty lines without title', () => {
      const result = createBox([])
      // sep + sep + sep = 3
      expect(result).toHaveLength(3)
    })
  })

  describe('createSectionHeader', () => {
    it('should return a colored string with default green', () => {
      const result = createSectionHeader('Test Header')
      expect(result).toBe(`${ANSICode.green}Test Header${ANSICode.reset}`)
    })

    it('should accept custom color', () => {
      const result = createSectionHeader('Red Header', ANSICode.red)
      expect(result).toBe(`${ANSICode.red}Red Header${ANSICode.reset}`)
    })
  })

  describe('createWarning', () => {
    it('should return a yellow-colored string containing the message', () => {
      const result = createWarning('Be careful')
      expect(result).toContain(ANSICode.yellow)
      expect(result).toContain(ANSICode.reset)
      expect(result).toContain('Be careful')
      expect(result).toBe(`${ANSICode.yellow}Be careful${ANSICode.reset}`)
    })
  })

  describe('createError', () => {
    it('should return a red-colored string containing the message', () => {
      const result = createError('Something broke')
      expect(result).toContain(ANSICode.red)
      expect(result).toContain('Something broke')
      expect(result).toBe(`${ANSICode.red}Something broke${ANSICode.reset}`)
    })
  })

  describe('createSuccess', () => {
    it('should return a green-colored string containing the message', () => {
      const result = createSuccess('All good')
      expect(result).toContain(ANSICode.green)
      expect(result).toContain('All good')
      expect(result).toBe(`${ANSICode.green}All good${ANSICode.reset}`)
    })
  })

  describe('createInfo', () => {
    it('should return a white-colored string containing the message', () => {
      const result = createInfo('FYI')
      expect(result).toContain(ANSICode.white)
      expect(result).toContain('FYI')
      expect(result).toBe(`${ANSICode.white}FYI${ANSICode.reset}`)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { HTMLParser } from '../parsers/htmlParser'

describe('HTMLParser', () => {
  const parser = new HTMLParser()

  describe('validateHTML', () => {
    it('should return valid: true for proper scp-wiki HTML', () => {
      const html =
        '<html><body><div id="page-content">SCP-173 is a sculpture constructed from concrete and rebar. It is animate and extremely hostile. The object cannot move while within a direct line of sight.</div></body></html>'
      const result = parser.validateHTML(html)
      expect(result.valid).toBe(true)
    })

    it('should return valid: false for empty string', () => {
      const result = parser.validateHTML('')
      expect(result.valid).toBe(false)
    })

    it('should return valid: false for content without SCP reference', () => {
      const html =
        '<html><body><div id="page-content">This is some regular web content that is long enough to pass the minimum length requirement but does not contain any SCP reference at all.</div></body></html>'
      const result = parser.validateHTML(html)
      expect(result.valid).toBe(false)
    })
  })

  describe('extractText', () => {
    it('should extract text from simple HTML fragment', () => {
      const html = '<div id="page-content"><p>Hello World</p></div>'
      const text = parser.extractText(html)
      expect(text).toBe('Hello World')
    })

    it('should normalize whitespace within text nodes', () => {
      const html =
        '<div id="page-content"><p>Hello   World Second   paragraph</p></div>'
      const text = parser.extractText(html)
      expect(text).toBe('Hello World Second paragraph')
    })
  })
})

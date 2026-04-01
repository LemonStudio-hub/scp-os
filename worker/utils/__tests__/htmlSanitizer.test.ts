/**
 * HTMLSanitizer 测试
 * 测试 XSS 防护功能
 */

import { describe, it, expect } from 'vitest'
import { HTMLSanitizer } from '../htmlSanitizer'

describe('HTMLSanitizer', () => {
  const sanitizer = new HTMLSanitizer()

  describe('sanitize', () => {
    it('应该移除脚本标签', () => {
      const html = '<p>安全内容</p><script>alert("XSS")</script>'
      const result = sanitizer.sanitize(html)

      expect(result).not.toContain('<script>')
      expect(result).toContain('安全内容')
    })

    it('应该移除事件处理器', () => {
      const html = '<p onclick="alert("XSS")">点击我</p>'
      const result = sanitizer.sanitize(html)

      expect(result).not.toContain('onclick')
    })

    it('应该移除 javascript: 协议', () => {
      const html = '<a href="javascript:alert("XSS")">链接</a>'
      const result = sanitizer.sanitize(html)

      expect(result).not.toContain('javascript:')
    })

    it('应该保留安全的 HTML 标签', () => {
      const html = '<p><strong>加粗</strong>和<em>斜体</em></p>'
      const result = sanitizer.sanitize(html)

      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })

    it('应该保留安全的链接', () => {
      const html = '<a href="https://example.com">安全链接</a>'
      const result = sanitizer.sanitize(html)

      expect(result).toContain('href="https://example.com"')
    })

    it('应该移除危险的链接', () => {
      const html = '<a href="data:text/html,<script>alert("XSS")</script>">危险链接</a>'
      const result = sanitizer.sanitize(html)

      expect(result).not.toContain('data:')
    })
  })

  describe('sanitizeText', () => {
    it('应该移除所有 HTML 标签', () => {
      const html = '<p><strong>文本</strong></p>'
      const result = sanitizer.sanitizeText(html)

      expect(result).not.toContain('<')
      expect(result).toBe('文本')
    })

    it('应该保留纯文本内容', () => {
      const html = '<p>纯文本内容</p>'
      const result = sanitizer.sanitizeText(html)

      expect(result).toBe('纯文本内容')
    })
  })

  describe('sanitizeLink', () => {
    it('应该保留安全的 HTTP 链接', () => {
      const url = 'http://example.com'
      const result = sanitizer.sanitizeLink(url)

      expect(result).toBe(url)
    })

    it('应该保留安全的 HTTPS 链接', () => {
      const url = 'https://example.com'
      const result = sanitizer.sanitizeLink(url)

      expect(result).toBe(url)
    })

    it('应该移除 javascript: 链接', () => {
      const url = 'javascript:alert("XSS")'
      const result = sanitizer.sanitizeLink(url)

      expect(result).toBe('')
    })

    it('应该移除 data: 链接', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>'
      const result = sanitizer.sanitizeLink(url)

      expect(result).toBe('')
    })

    it('应该处理空链接', () => {
      const result = sanitizer.sanitizeLink('')

      expect(result).toBe('')
    })
  })

  describe('isSafe', () => {
    it('应该识别安全的 HTML', () => {
      const html = '<p>安全内容</p>'
      const result = sanitizer.isSafe(html)

      expect(result).toBe(true)
    })

    it('应该识别不安全的 HTML', () => {
      const html = '<script>alert("XSS")</script>'
      const result = sanitizer.isSafe(html)

      expect(result).toBe(false)
    })

    it('应该识别包含事件处理器的 HTML', () => {
      const html = '<p onclick="alert("XSS")">点击</p>'
      const result = sanitizer.isSafe(html)

      expect(result).toBe(false)
    })
  })

  describe('cleanEntities', () => {
    it('应该解码 HTML 实体', () => {
      const text = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      const result = sanitizer.cleanEntities(text)

      expect(result).toBe('<script>alert("XSS")</script>')
    })

    it('应该移除危险的十六进制实体', () => {
      const text = 'Hello &#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;'
      const result = sanitizer.cleanEntities(text)

      expect(result).not.toContain('<script>')
    })

    it('应该移除危险的十进制实体', () => {
      const text = 'Hello &#60;script&#62;alert("XSS")&#60;/script&#62;'
      const result = sanitizer.cleanEntities(text)

      expect(result).not.toContain('<script>')
    })
  })

  describe('sanitizeMany', () => {
    it('应该批量消毒多个 HTML', () => {
      const htmls = [
        '<p>安全1</p>',
        '<p>安全2</p>',
        '<script>alert("XSS")</script>',
      ]
      const results = sanitizer.sanitizeMany(htmls)

      expect(results).toHaveLength(3)
      expect(results[0]).toContain('安全1')
      expect(results[1]).toContain('安全2')
      expect(results[2]).not.toContain('<script>')
    })
  })
})
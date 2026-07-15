import { describe, it, expect, vi } from 'vitest'

vi.mock('../../config', () => ({
  config: {
    api: {
      workerUrl: 'https://api.example.com',
    },
  },
}))

import { proxyImageUrl } from '../imageProxy'

describe('imageProxy', () => {
  describe('proxyImageUrl', () => {
    it('should return proxied URL for allowed host (scp-wiki.wdfiles.com)', () => {
      const url = 'https://scp-wiki.wdfiles.com/files/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(`https://api.example.com/image-proxy?url=${encodeURIComponent(url)}`)
    })

    it('should return proxied URL for wikidot.com', () => {
      const url = 'https://wikidot.com/some-image.jpg'
      const result = proxyImageUrl(url)
      expect(result).toBe(`https://api.example.com/image-proxy?url=${encodeURIComponent(url)}`)
    })

    it('should return proxied URL for scp-wiki-cn.wdfiles.com', () => {
      const url = 'https://scp-wiki-cn.wdfiles.com/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(`https://api.example.com/image-proxy?url=${encodeURIComponent(url)}`)
    })

    it('should return proxied URL for scpfoundation.ru', () => {
      const url = 'https://scpfoundation.ru/pic/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(`https://api.example.com/image-proxy?url=${encodeURIComponent(url)}`)
    })

    it('should handle subdomain match (sub.scp-wiki.wdfiles.com)', () => {
      const url = 'https://sub.scp-wiki.wdfiles.com/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(`https://api.example.com/image-proxy?url=${encodeURIComponent(url)}`)
    })

    it('should return original URL for disallowed hosts', () => {
      const url = 'https://example.com/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(url)
    })

    it('should return original URL for similar but not matching hosts', () => {
      const url = 'https://not-wdfiles.com/image.png'
      const result = proxyImageUrl(url)
      expect(result).toBe(url)
    })

    it('should return original URL for invalid URL', () => {
      const result = proxyImageUrl('not-a-valid-url')
      expect(result).toBe('not-a-valid-url')
    })

    it('should return original URL for empty string', () => {
      const result = proxyImageUrl('')
      expect(result).toBe('')
    })
  })
})

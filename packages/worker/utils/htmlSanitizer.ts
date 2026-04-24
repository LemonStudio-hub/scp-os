/**
 * HTML 消毒器
 * 使用正则表达式和文本处理防止 XSS 攻击
 * Cloudflare Workers 兼容版本
 */

import { getConfig } from '../shared/config'

const DANGEROUS_CHAR_CODES = new Set([60, 62, 34, 39, 47, 61])

function filterNumericEntity(code: number): string {
  if (DANGEROUS_CHAR_CODES.has(code)) return ''
  if (code > 31 && code < 127) return String.fromCharCode(code)
  return ''
}

export class HTMLSanitizer {
  private config = getConfig()

  sanitize(html: string): string {
    let sanitized = html

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button|textarea|select)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    sanitized = sanitized.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
    sanitized = sanitized.replace(/href\s*=\s*javascript:[^\s>]*/gi, 'href="#"')
    sanitized = sanitized.replace(/src\s*=\s*["']\s*data:(?!image\/)[^"']*["']/gi, 'src=""')
    sanitized = sanitized.replace(/src\s*=\s*data:(?!image\/)[^\s>]*/gi, 'src=""')
    sanitized = sanitized.replace(/href\s*=\s*["']\s*data:[^"']*["']/gi, 'href="#"')
    sanitized = sanitized.replace(/href\s*=\s*data:[^\s>]*/gi, 'href="#"')
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')

    return sanitized
  }

  sanitizeText(html: string): string {
    const sanitized = this.sanitize(html)
    return sanitized.replace(/<[^>]+>/g, '')
  }

  sanitizeLink(url: string): string {
    if (!url) return ''
    if (!url.startsWith('http://') && !url.startsWith('https://')) return ''
    return url
  }

  sanitizeMany(htmls: string[]): string[] {
    return htmls.map(html => this.sanitize(html))
  }

  isSafe(html: string): boolean {
    const dangerousPatterns = [
      /<script\b/i,
      /<style\b/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i,
      /javascript:/i,
      /on\w+\s*=/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(html)) return false
    }

    return true
  }

  cleanEntities(text: string): string {
    let decoded = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")

    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
      return filterNumericEntity(parseInt(hex, 16))
    })

    decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
      return filterNumericEntity(parseInt(dec, 10))
    })

    return decoded
  }
}

export const htmlSanitizer = new HTMLSanitizer()

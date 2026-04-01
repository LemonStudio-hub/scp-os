/**
 * HTML 消毒器
 * 使用 DOMPurify 防止 XSS 攻击
 */

import DOMPurify from 'isomorphic-dompurify'
import { getConfig } from '../shared/config'

export class HTMLSanitizer {
  private config = getConfig()

  /**
   * 消毒 HTML
   * 移除危险内容，防止 XSS 攻击
   */
  sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      // 允许的标签
      ALLOWED_TAGS: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's',
        'ul', 'ol', 'li',
        'a', 'br', 'hr',
        'blockquote', 'code', 'pre',
        'div', 'span',
      ],
      // 允许的属性
      ALLOWED_ATTR: [
        'href',
        'title',
        'class',
        'id',
      ],
      // 移除所有脚本和事件处理器
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
      // 保留安全的 URL
      SAFE_FOR_TEMPLATES: false,
      // 移除所有注释
      REMOVE_COMMENT: true,
      // 移除空标签
      REMOVE_EMPTY: true,
      // 移除空段落
      REMOVE_EMPTY_TAGS: ['p', 'div', 'span'],
      // 保留格式
      KEEP_CONTENT: true,
    })
  }

  /**
   * 消毒并清理文本
   * 移除 HTML 标签，只保留纯文本
   */
  sanitizeText(html: string): string {
    const sanitized = this.sanitize(html)

    // 移除所有 HTML 标签
    return sanitized.replace(/<[^>]+>/g, '')
  }

  /**
   * 消毒链接
   * 确保链接是安全的
   */
  sanitizeLink(url: string): string {
    if (!url) return ''

    // 只允许 http 和 https 协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return ''
    }

    // 防止 javascript: 协议
    if (url.startsWith('javascript:')) {
      return ''
    }

    // 防止 data: 协议
    if (url.startsWith('data:')) {
      return ''
    }

    return url
  }

  /**
   * 批量消毒多个 HTML 片段
   */
  sanitizeMany(htmls: string[]): string[] {
    return htmls.map(html => this.sanitize(html))
  }

  /**
   * 验证 HTML 是否安全
   */
  isSafe(html: string): boolean {
    const sanitized = this.sanitize(html)

    // 如果消毒后的内容与原始内容相同，说明是安全的
    return sanitized === html
  }

  /**
   * 清理危险的 HTML 实体
   */
  cleanEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        const code = parseInt(hex, 16)
        // 只允许安全的字符
        if (code > 31 && code < 127) {
          return String.fromCharCode(code)
        }
        return ''
      })
      .replace(/&#(\d+);/g, (match, dec) => {
        const code = parseInt(dec, 10)
        // 只允许安全的字符
        if (code > 31 && code < 127) {
          return String.fromCharCode(code)
        }
        return ''
      })
  }
}

// 导出单例
export const htmlSanitizer = new HTMLSanitizer()
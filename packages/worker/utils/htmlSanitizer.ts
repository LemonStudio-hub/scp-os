/**
 * HTML 消毒器
 * 使用正则表达式和文本处理防止 XSS 攻击
 * Cloudflare Workers 兼容版本
 */

import { getConfig } from '../shared/config'

export class HTMLSanitizer {
  private config = getConfig()

  /**
   * 消毒 HTML
   * 移除危险内容，防止 XSS 攻击
   */
    sanitize(html: string): string {
      let sanitized = html
  
      // 移除脚本标签
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
      // 移除样式标签
      sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
      // 移除 iframe, object, embed 等危险标签
      sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button|textarea|select)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
  
      // 移除所有事件处理器
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
  
      // 移除 javascript: 协议
      sanitized = sanitized.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
      sanitized = sanitized.replace(/href\s*=\s*javascript:[^\s>]*/gi, 'href="#"')
  
      // 移除 data: 协议（除了图片）
      sanitized = sanitized.replace(/src\s*=\s*["']\s*data:(?!image\/)[^"']*["']/gi, 'src=""')
      sanitized = sanitized.replace(/src\s*=\s*data:(?!image\/)[^\s>]*/gi, 'src=""')
  
      // 移除 href 属性中的 data: 协议
      sanitized = sanitized.replace(/href\s*=\s*["']\s*data:[^"']*["']/gi, 'href="#"')
      sanitized = sanitized.replace(/href\s*=\s*data:[^\s>]*/gi, 'href="#"')
  
      // 移除注释
      sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')
  
      return sanitized
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
    // 检查是否包含危险标签
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
      if (pattern.test(html)) {
        return false
      }
    }

    return true
  }

  /**

   * 清理危险的 HTML 实体

   */

    cleanEntities(text: string): string {

      let decoded = text

  

      // 解码命名的 HTML 实体

      decoded = decoded.replace(/&lt;/g, '<')

        .replace(/&gt;/g, '>')

        .replace(/&amp;/g, '&')

        .replace(/&quot;/g, '"')

        .replace(/&apos;/g, "'")

  

      // 处理数字实体（阻止危险字符）

      decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {

        const code = parseInt(hex, 16)

  

        // 阻止危险字符：<, >, ", ', /, = 等

        if (code === 60 ||  // <

            code === 62 ||  // >

            code === 34 ||  // "

            code === 39 ||  // '

            code === 47 ||  // /

            code === 61) {  // =

          return ''  // 移除这些危险字符

        }

  

        // 只允许安全的字符

        if (code > 31 && code < 127) {

          return String.fromCharCode(code)

        }

        return ''

      })

  

      decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {

        const code = parseInt(dec, 10)

  

        // 阻止危险字符：<, >, ", ', /, = 等

        if (code === 60 ||  // <

            code === 62 ||  // >

            code === 34 ||  // "

            code === 39 ||  // '

            code === 47 ||  // /

            code === 61) {  // =

          return ''  // 移除这些危险字符

        }

  

        // 只允许安全的字符

        if (code > 31 && code < 127) {

          return String.fromCharCode(code)

        }

        return ''

      })

  

      return decoded

    }}

// 导出单例
export const htmlSanitizer = new HTMLSanitizer()
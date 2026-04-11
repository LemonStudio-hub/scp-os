/**
 * HTML 解析器
 * 负责清理和提取 HTML 内容
 */

import * as cheerio from 'cheerio'
import { getConfig } from '../shared/config'

export class HTMLParser {
  private config = getConfig()

  /**
   * 清理 HTML
   * 移除不需要的元素和内容
   */
  cleanHTML(html: string): string {
    const $ = cheerio.load(html)

    // 尝试找到主要内容容器
    let $content = this.findContentContainer($)

    // 批量移除不需要的元素
    $(this.config.htmlCleanup.removeSelectors.join(', ')).remove()

    // 移除导航链接段落
    $content.find('p').filter(function() {
      const text = $(this).text()
      return text.includes('SCP-') && (text.includes('«') || text.includes('&#171;') || text.includes('|'))
    }).remove()

    // 移除所有脚本和样式标签（再次确保）
    $content.find('script, style, noscript, iframe').remove()

    return $content.html() || ''
  }

  /**
   * 查找主要内容容器
   */
  private findContentContainer($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
    const selectors = ['#page-content', '#main-content', '.page-content', 'main']

    for (const selector of selectors) {
      const $el = $(selector)
      if ($el.length > 0) {
        return $el
      }
    }

    // 如果没找到，使用 body
    console.warn('No content container found, using body as fallback')
    return $('body')
  }

  /**
   * 提取文本内容
   */
  extractText(html: string): string {
    const $ = cheerio.load(html)

    // 移除 HTML 标签，保留文本
    let text = $.text()

    // 规范化空白字符
    text = text.replace(/\s+/g, ' ').trim()

    return text
  }

  /**
   * 提取标题
   */
  extractTitle(html: string): string | null {
    const $ = cheerio.load(html)

    // 尝试多个选择器
    const titleSelectors = ['#page-title', 'h1', '.title']

    for (const selector of titleSelectors) {
      const $title = $(selector).first()
      if ($title.length > 0) {
        return $title.text().trim()
      }
    }

    return null
  }

  /**
   * 提取链接
   */
  extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html)
    const links: string[] = []

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href) {
        // 转换为绝对 URL
        const absoluteUrl = new URL(href, baseUrl).href
        links.push(absoluteUrl)
      }
    })

    return links
  }

  /**
   * 验证 HTML 内容
   */
  validateHTML(html: string): { valid: boolean; reason?: string } {
    if (!html || html.length < this.config.htmlCleanup.minContentLength) {
      return { valid: false, reason: 'HTML content too short' }
    }

    if (!html.includes('SCP-')) {
      return { valid: false, reason: 'HTML does not contain SCP content' }
    }

    return { valid: true }
  }
}
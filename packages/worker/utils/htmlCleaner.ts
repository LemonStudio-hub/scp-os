/**
 * HTML 清理器
 * 优化的 HTML 清理逻辑，单次批量操作
 */

import * as cheerio from 'cheerio'
import { getConfig } from '../shared/config'

export class HTMLCleaner {
  private config = getConfig()

  /**
   * 清理 HTML
   * 一次性批量移除所有不需要的元素
   */
  clean(html: string): string {
    const $ = cheerio.load(html)

    // 查找内容容器
    let $content = this.findContentContainer($)

    // 批量移除不需要的元素（单次操作）
    $(this.config.htmlCleanup.removeSelectors.join(', ')).remove()

    // 额外移除 Wikidot 常见广告容器
    $('#adsquare, #container-wrap .adsense, .ad-container, .side-box, #extra-div-1, #extra-div-2').remove()
    $('[id*="nitro"], [class*="nitro"], [id*="adsense"], [class*="adsense"]').remove()
    $('[style*="display:none"], [hidden]').remove()

    // 移除侧边栏和导航区域
    $('#side-bar, #top-bar, #header, #footer, #navi-bar, #login-status, #account-topbar').remove()
    $('#action-area-top, #action-area-bottom, .page-watch-options').remove()

    // 移除导航链接段落
    $content.find('p').filter(function() {
      const text = $(this).text()
      return text.includes('SCP-') && (text.includes('«') || text.includes('&#171;') || text.includes('|'))
    }).remove()

    // 再次确保移除所有脚本和样式
    $content.find('script, style, noscript, iframe').remove()

    // 移除空段落
    $content.find('p').filter(function() {
      return !$(this).text().trim()
    }).remove()

    return $content.html() || ''
  }

  /**
   * 查找内容容器
   */
  private findContentContainer($: cheerio.CheerioAPI): cheerio.Cheerio<cheerio.Element> {
    const selectors = ['#page-content', '#main-content', '.page-content', 'main']

    for (const selector of selectors) {
      const $el = $(selector)
      if ($el.length > 0) {
        return $el
      }
    }

    return $('body')
  }

  /**
   * 验证清理后的 HTML
   */
  validate(html: string): { valid: boolean; reason?: string } {
    if (!html || html.length < this.config.htmlCleanup.minContentLength) {
      return { valid: false, reason: 'HTML content too short' }
    }

    if (!html.includes('SCP-')) {
      return { valid: false, reason: 'HTML does not contain SCP content' }
    }

    return { valid: true }
  }
}

import * as cheerio from 'cheerio'
import { getConfig } from '../shared/config'
import { findContentContainer, validateHTMLContent } from './htmlUtils'

export class HTMLCleaner {
  private config = getConfig()

  clean(html: string): string {
    const $ = cheerio.load(html)
    const $content = findContentContainer($)

    $(this.config.htmlCleanup.removeSelectors.join(', ')).remove()

    $('#adsquare, #container-wrap .adsense, .ad-container, .side-box, #extra-div-1, #extra-div-2').remove()
    $('[id*="nitro"], [class*="nitro"], [id*="adsense"], [class*="adsense"]').remove()
    $('[style*="display:none"], [hidden]').remove()

    $('#side-bar, #top-bar, #header, #footer, #navi-bar, #login-status, #account-topbar').remove()
    $('#action-area-top, #action-area-bottom, .page-watch-options').remove()

    $content.find('p').filter(function() {
      const text = $(this).text()
      return text.includes('SCP-') && (text.includes('«') || text.includes('&#171;') || text.includes('|'))
    }).remove()

    $content.find('script, style, noscript, iframe').remove()

    $content.find('p').filter(function() {
      return !$(this).text().trim()
    }).remove()

    return $content.html() || ''
  }

  validate(html: string): { valid: boolean; reason?: string } {
    return validateHTMLContent(html)
  }
}

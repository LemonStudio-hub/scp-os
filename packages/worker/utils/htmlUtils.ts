import * as cheerio from 'cheerio'
import { getConfig } from '../shared/config'

const CONTENT_SELECTORS = ['#page-content', '#main-content', '.page-content', 'main']

export function findContentContainer($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  for (const selector of CONTENT_SELECTORS) {
    const $el = $(selector)
    if ($el.length > 0) {
      return $el
    }
  }

  return $('body')
}

export function validateHTMLContent(html: string): { valid: boolean; reason?: string } {
  const config = getConfig()
  if (!html || html.length < config.htmlCleanup.minContentLength) {
    return { valid: false, reason: 'HTML content too short' }
  }

  if (!html.includes('SCP-')) {
    return { valid: false, reason: 'HTML does not contain SCP content' }
  }

  return { valid: true }
}

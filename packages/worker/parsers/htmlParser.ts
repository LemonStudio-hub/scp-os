import * as cheerio from 'cheerio'
import { getConfig } from '../shared/config'
import { findContentContainer, validateHTMLContent } from '../utils/htmlUtils'

export class HTMLParser {
  private config = getConfig()

  cleanHTML(html: string): string {
    const $ = cheerio.load(html)
    const $content = findContentContainer($)

    $(this.config.htmlCleanup.removeSelectors.join(', ')).remove()

    $content.find('p').filter(function() {
      const text = $(this).text()
      return text.includes('SCP-') && (text.includes('«') || text.includes('&#171;') || text.includes('|'))
    }).remove()

    $content.find('script, style, noscript, iframe').remove()

    return $content.html() || ''
  }

  extractText(html: string): string {
    const $ = cheerio.load(html)
    let text = $.text()
    text = text.replace(/\s+/g, ' ').trim()
    return text
  }

  extractTitle(html: string): string | null {
    const $ = cheerio.load(html)
    const titleSelectors = ['#page-title', 'h1', '.title']

    for (const selector of titleSelectors) {
      const $title = $(selector).first()
      if ($title.length > 0) {
        return $title.text().trim()
      }
    }

    return null
  }

  extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html)
    const links: string[] = []

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href) {
        const absoluteUrl = new URL(href, baseUrl).href
        links.push(absoluteUrl)
      }
    })

    return links
  }

  validateHTML(html: string): { valid: boolean; reason?: string } {
    return validateHTMLContent(html)
  }
}

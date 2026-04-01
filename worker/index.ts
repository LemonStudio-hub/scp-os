/**
 * SCP Scraper Worker
 * 重构版本 - 使用模块化架构
 */

import { getConfig } from './shared/config'
import type { Env, ScraperResult, SCPWikiData, RequestContext } from './shared/types'

// 解析器
import { HTMLParser } from './parsers/htmlParser'
import { SectionParser } from './parsers/sectionParser'
import { ClassParser } from './parsers/classParser'

// 工具
import { HTMLCleaner } from './utils/htmlCleaner'
import { HTMLSanitizer } from './utils/htmlSanitizer'
import { ParagraphFilter } from './utils/paragraphFilter'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performanceMonitor'

// 安全
import { RateLimiter } from './security/rateLimiter'
import { CORSManager } from './security/cors'

// 错误处理
import { ScraperError } from './errors/scraperError'
import { RetryStrategy } from './errors/retryStrategy'

/**
 * SCP Scraper 类
 */
class SCPScraper {
  private config = getConfig()
  private htmlParser = new HTMLParser()
  private sectionParser = new SectionParser()
  private classParser = new ClassParser()
  private htmlCleaner = new HTMLCleaner()
  private htmlSanitizer = new HTMLSanitizer()
  private paragraphFilter = new ParagraphFilter()
  private retryStrategy = new RetryStrategy()

  constructor(private kv?: KVNamespace) {}

  /**
   * 爬取指定 SCP 的详细信息
   */
  async scrapeSCP(scpNumber: string): Promise<ScraperResult> {
    const endTimer = performanceMonitor.startTimer('scrapeSCP')
    const cacheKey = `scp-${scpNumber}`

    try {
      // 检查缓存
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        endTimer()
        return { success: true, data: cached, cached: true }
      }

      // 获取 HTML
      const html = await this.fetchHTML(scpNumber)

      // 解析 HTML
      const data = await this.parseHTML(html, scpNumber)

      // 保存到缓存
      await this.saveToCache(cacheKey, data)

      endTimer()
      return { success: true, data }
    } catch (error) {
      endTimer()
      const scraperError = ScraperError.fromError(error as Error)
      logger.error('Failed to scrape SCP', scraperError, { scpNumber })
      return { success: false, error: scraperError.message }
    }
  }

  /**
   * 搜索 SCP
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      const url = `${this.config.baseUrl}/search:site/q/${encodeURIComponent(keyword)}`
      const html = await this.fetchURL(url)

      // 提取搜索结果
      const results = this.extractSearchResults(html)

      if (results.length === 0) {
        return { success: false, error: `未找到包含 "${keyword}" 的SCP对象` }
      }

      // 返回第一个结果
      const firstResult = results[0]
      const number = firstResult.replace('SCP-', '')
      return this.scrapeSCP(number)
    } catch (error) {
      const scraperError = ScraperError.fromError(error as Error)
      logger.error('Failed to search SCP', scraperError, { keyword })
      return { success: false, error: scraperError.message }
    }
  }

  /**
   * 获取原始 HTML（用于调试）
   */
  async getRawHTML(scpNumber: string): Promise<{ success: boolean; html?: string; error?: string }> {
    try {
      const html = await this.fetchHTML(scpNumber)
      return { success: true, html }
    } catch (error) {
      const scraperError = ScraperError.fromError(error as Error)
      return { success: false, error: scraperError.message }
    }
  }

  /**
   * 获取 HTML
   */
  private async fetchHTML(scpNumber: string): Promise<string> {
    const url = `${this.config.baseUrl}/scp-${scpNumber}`
    return this.fetchURL(url)
  }

  /**
   * 获取 URL 内容（带重试）
   */
  private async fetchURL(url: string): Promise<string> {
    return this.retryStrategy.executeWithRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
          redirect: 'follow',
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw ScraperError.networkError(`HTTP ${response.status}: ${response.statusText}`, response.status)
        }

        const html = await response.text()

        // 验证 HTML
        const validation = this.htmlParser.validateHTML(html)
        if (!validation.valid) {
          throw ScraperError.validationError(validation.reason || 'Invalid HTML')
        }

        return html
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          throw ScraperError.timeoutError()
        }

        throw error
      }
    }, this.config.retryAttempts, this.config.retryDelay)
  }

  /**
   * 解析 HTML
   */
  private async parseHTML(html: string, scpNumber: string): Promise<SCPWikiData> {
    const parseTimer = performanceMonitor.startTimer('parseHTML')

    try {
      // 先消毒 HTML（防止 XSS）
      const sanitizedHTML = this.htmlSanitizer.sanitize(html)

      // 清理 HTML
      const cleanedHTML = this.htmlCleaner.clean(sanitizedHTML)

      // 提取文本
      const text = this.htmlParser.extractText(cleanedHTML)

      // 解析章节
      const sections = this.sectionParser.parseSections(text)

      // 构建数据
      const data: SCPWikiData = {
        id: sections.title || `SCP-${scpNumber}`,
        name: sections.title || `SCP-${scpNumber}`,
        objectClass: sections.objectClass,
        containment: sections.containment,
        description: sections.description,
        appendix: sections.appendix,
        author: sections.author,
        url: `${this.config.baseUrl}/scp-${scpNumber}`,
      }

      // 验证数据
      this.validateData(data)

      parseTimer()
      return data
    } catch (error) {
      parseTimer()
      throw ScraperError.parseError((error as Error).message)
    }
  }

  /**
   * 提取搜索结果
   */
  private extractSearchResults(html: string): string[] {
    const results: string[] = []

    // 简单的链接提取
    const linkPattern = /href="\/scp-(\d+)"/g
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      results.push(`SCP-${match[1]}`)
    }

    return results
  }

  /**
   * 验证数据
   */
  private validateData(data: SCPWikiData): void {
    if (!data.id || !data.id.startsWith('SCP-')) {
      throw ScraperError.validationError('Invalid SCP ID')
    }

    if (!this.classParser.isValidClass(data.objectClass)) {
      throw ScraperError.validationError(`Invalid object class: ${data.objectClass}`)
    }

    if (!data.url) {
      throw ScraperError.validationError('Missing URL')
    }
  }

  /**
   * 从缓存获取
   */
  private async getFromCache(key: string): Promise<SCPWikiData | null> {
    if (!this.kv) return null

    try {
      const cached = await this.kv.get(key, 'text')
      if (cached) {
        return JSON.parse(cached) as SCPWikiData
      }
    } catch (error) {
      logger.error('Cache read error', error as Error)
    }

    return null
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(key: string, data: SCPWikiData): Promise<void> {
    if (!this.kv) return

    try {
      await this.kv.put(key, JSON.stringify(data), {
        expirationTtl: Math.floor(this.config.cacheDuration / 1000),
      })
    } catch (error) {
      logger.error('Cache write error', error as Error)
    }
  }
}

/**
 * Worker 入口点
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsManager = new CORSManager()
    const rateLimiter = new RateLimiter()

    // 构建请求上下文
    const context: RequestContext = {
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
      userAgent: request.headers.get('User-Agent') || '',
      timestamp: Date.now(),
    }

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return corsManager.handlePreflight(context)
    }

    try {
      // 速率限制
      const ip = context.ip
      if (!await rateLimiter.checkLimit(ip)) {
        logger.warn('Rate limit exceeded', { ip })
        return corsManager.createErrorResponse('Rate limit exceeded', 429, context)
      }

      const scraper = new SCPScraper(env.SCP_CACHE)
      const url = new URL(request.url)
      const path = url.pathname

      // 路由处理
      if (path === '/scrape') {
        const scpNumber = url.searchParams.get('number')
        if (!scpNumber) {
          return corsManager.createErrorResponse('Missing number parameter', 400, context)
        }

        logger.info('Scraping SCP', { scpNumber, ip })
        const result = await scraper.scrapeSCP(scpNumber)

        if (result.success) {
          logger.info('Scrape successful', { scpNumber, cached: result.cached })
        } else {
          logger.warn('Scrape failed', { scpNumber, error: result.error })
        }

        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/search') {
        const keyword = url.searchParams.get('keyword')
        if (!keyword) {
          return corsManager.createErrorResponse('Missing keyword parameter', 400, context)
        }

        logger.info('Searching SCP', { keyword, ip })
        const result = await scraper.searchSCP(keyword)
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/debug') {
        const scpNumber = url.searchParams.get('number') || '173'
        logger.info('Debug mode', { scpNumber, ip })
        const result = await scraper.getRawHTML(scpNumber)
        return corsManager.createResponse(result, 200, context)
      } else if (path === '/') {
        return corsManager.createResponse(
          {
            name: 'SCP Scraper Worker',
            version: '2.0.0',
            status: 'online',
            endpoints: {
              '/scrape?number={number}': '爬取指定SCP的信息',
              '/search?keyword={keyword}': '搜索SCP',
              '/debug?number={number}': '调试：返回原始HTML',
            },
            features: {
              modular: true,
              caching: `${this.config.cacheDuration / 1000 / 60} minutes`,
              retry: `${this.config.retryAttempts} attempts`,
              rateLimit: `${this.config.rateLimit.maxRequests} requests / ${this.config.rateLimit.windowMs / 1000}s`,
            },
          },
          200,
          context
        )
      } else {
        return corsManager.createErrorResponse('Not found', 404, context)
      }
    } catch (error) {
      logger.error('Worker error', error as Error, { context })
      return corsManager.createErrorResponse('Internal server error', 500, context)
    }
  },
}
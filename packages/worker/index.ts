/**
 * SCP Scraper Worker
 * 重构版本 - 使用模块化架构
 */

import { getConfig } from './shared/config'
import type { Env, ScraperResult, SCPWikiData, RequestContext, ChatMessage, ChatApiResponse, ChatRoom, ChatRoomInput, ObjectClass, ChatSendMessageBody, CreateChatRoomBody, SetNicknameBody, SubmitFeedbackBody, LikeFeedbackBody, SubmitCommentBody, VoteFeedbackBody, RegisterUserBody, PerformanceMetricsBody, D1StatRow, D1ClearanceRow } from './shared/types'
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
import Defuddle from '@flicknote/defuddle'
import { parseHTML } from 'linkedom'
import * as cheerio from 'cheerio'

// 安全
import { RateLimiter } from './security/rateLimiter'
import { D1RateLimiter } from './security/d1RateLimiter'
import { CORSManager } from './security/cors'
import { requireAuth } from './security/auth'

// 错误处理
import { ScraperError } from './errors/scraperError'
import { RetryStrategy } from './errors/retryStrategy'
import { getNavigateHeaders } from './utils/browserHeaders'

// 统一错误码
import { validationError, notFoundError, rateLimitedError, unauthorizedError, internalError } from './shared/errors'

// Durable Objects
import { ChatRoomDO } from './durableObjects/ChatRoomDO'

// 路由
import { Router } from './router'
import { registerRoutes } from './routes'

export { ChatRoomDO }

/**
 * SCP Scraper 类
 */
export class SCPScraper {
  private config = getConfig()
  private htmlParser = new HTMLParser()
  private sectionParser = new SectionParser()
  private classParser = new ClassParser()
  private htmlCleaner = new HTMLCleaner()
  private htmlSanitizer = new HTMLSanitizer()
  private paragraphFilter = new ParagraphFilter()
  private retryStrategy = new RetryStrategy()

  constructor(private db?: D1Database) {}

  getDatabase(): D1Database | undefined {
    return this.db
  }

  requireDB(): D1Database {
    if (!this.db) {
      throw new Error('Database not available. Ensure SCP_DB binding is configured.')
    }
    return this.db
  }

  async scrapeSCP(scpNumber: string, branch: string = 'en'): Promise<ScraperResult> {
    const endTimer = performanceMonitor.startTimer('scrapeSCP')
    const cacheKey = `scp-${branch}-${scpNumber}` // 缓存键包含分部信息

    try {
      // 检查缓存
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        endTimer()
        return { success: true, data: cached, cached: true }
      }

      // 获取 HTML
      const html = await this.fetchHTML(scpNumber, branch)

      // 解析 HTML
      const data = await this.parseHTML(html, scpNumber, branch)

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
  async searchSCP(keyword: string, branch: string = 'en'): Promise<ScraperResult> {
    try {
      const branchUrl = branch === 'cn'
        ? 'https://scp-wiki-cn.wikidot.com'
        : 'https://scp-wiki.wikidot.com'

      const url = `${branchUrl}/search:site/q/${encodeURIComponent(keyword)}`
      
      // 获取搜索结果页面（不验证 HTML）
      const html = await this.fetchURLWithoutValidation(url)

      // 提取搜索结果
      const results = this.extractSearchResults(html)

      if (results.length === 0) {
        return { success: false, error: `未找到包含 "${keyword}" 的SCP对象` }
      }

      // 返回第一个结果的详细信息
      const firstResult = results[0]
      const number = firstResult.replace('SCP-', '')
      return this.scrapeSCP(number, branch)
    } catch (error) {
      const scraperError = ScraperError.fromError(error as Error)
      logger.error('Failed to search SCP', scraperError, { keyword })
      return { success: false, error: scraperError.message }
    }
  }

  private async fetchURLWithoutValidation(url: string): Promise<string> {
    return this.fetchURL(url, { validate: false })
  }

  private async fetchURL(url: string, options: { validate?: boolean } = {}): Promise<string> {
    const { validate = true } = options
    return this.retryStrategy.executeWithRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          headers: getNavigateHeaders(`${this.config.baseUrl}/`),
          signal: controller.signal,
          redirect: 'follow',
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw ScraperError.networkError(`HTTP ${response.status}: ${response.statusText}`, response.status)
        }

        const html = await response.text()

        if (validate) {
          const validation = this.htmlParser.validateHTML(html)
          if (!validation.valid) {
            throw ScraperError.validationError(validation.reason || 'Invalid HTML')
          }
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
  private async fetchHTML(scpNumber: string, branch: string = 'en'): Promise<string> {
    const branchUrl = branch === 'cn'
      ? 'https://scp-wiki-cn.wikidot.com'
      : 'https://scp-wiki.wikidot.com'

    const url = `${branchUrl}/scp-${scpNumber}`
    return this.fetchURL(url)
  }

  private async parseHTML(html: string, scpNumber: string, branch: string = 'en'): Promise<SCPWikiData> {
    const parseTimer = performanceMonitor.startTimer('parseHTML')

    try {
      const sanitizedHTML = this.htmlSanitizer.sanitize(html)

      const branchUrl = branch === 'cn'
        ? 'https://scp-wiki-cn.wikidot.com'
        : 'https://scp-wiki.wikidot.com'
      const pageUrl = `${branchUrl}/scp-${scpNumber}`

      let data: SCPWikiData | null = null

      try {
        data = await this.parseWithOriginalFlow(sanitizedHTML, scpNumber, branch)
      } catch (primaryError) {
        logger.warn('Original parsing failed, trying Defuddle fallback', { error: (primaryError as Error).message })
        data = await this.parseWithDefuddleFallback(sanitizedHTML, scpNumber, branch, pageUrl)
      }

      data = this.enrichWithDefuddleMetadata(data, sanitizedHTML, pageUrl)

      this.validateData(data)

      parseTimer()
      return data
    } catch (error) {
      parseTimer()
      throw ScraperError.parseError((error as Error).message)
    }
  }

  private async parseWithOriginalFlow(html: string, scpNumber: string, branch: string): Promise<SCPWikiData> {
    if (branch === 'en') {
      return await this.parseEnglishPage(html, scpNumber, branch)
    } else {
      const cleanedHTML = this.htmlCleaner.clean(html)
      const text = this.htmlParser.extractText(cleanedHTML)
      const sections = this.sectionParser.parseSections(text)
      return this.buildDataFromSections(sections, scpNumber, branch)
    }
  }

  private async parseWithDefuddleFallback(html: string, scpNumber: string, branch: string, url: string): Promise<SCPWikiData> {
    try {
      const { document } = parseHTML(html)
      const defuddle = new Defuddle(document, {
        url,
        removeExactSelectors: true,
        removePartialSelectors: true,
      })
      const result = defuddle.parse()

      if (result.content && result.content.length > 100) {
        const wrappedHTML = `<html><body><div id="page-content">${result.content}</div></body></html>`
        if (branch === 'en') {
          return await this.parseEnglishPage(wrappedHTML, scpNumber, branch)
        } else {
          const text = this.htmlParser.extractText(wrappedHTML)
          const sections = this.sectionParser.parseSections(text)
          return this.buildDataFromSections(sections, scpNumber, branch)
        }
      }

      throw new Error('Defuddle extraction produced no usable content')
    } catch (defuddleError) {
      throw new Error(`Both original and Defuddle parsing failed: ${(defuddleError as Error).message}`)
    }
  }

  /**
   * 使用 Defuddle 提取元数据增强 SCP 数据
   */
  private enrichWithDefuddleMetadata(data: SCPWikiData, html: string, url: string): SCPWikiData {
    try {
      const { document } = parseHTML(html)
      const defuddle = new Defuddle(document, { url })
      const result = defuddle.parse()

      return {
        ...data,
        name: result.title || data.name,
        author: result.author || data.author,
      }
    } catch (error) {
      logger.error('Defuddle metadata extraction failed', error as Error)
      return data
    }
  }

  /**
   * 解析英文页面（直接使用 HTML 结构）
   */
  private async parseEnglishPage(html: string, scpNumber: string, branch: string): Promise<SCPWikiData> {
    const $ = cheerio.load(html)

    // 找到主内容区域
    const $content = $('#page-content')
    if ($content.length === 0) {
      throw new Error('Page content not found')
    }

    // 获取所有段落和块级元素（包括嵌套的）
    const elements: string[] = []
    $content.find('p, div, blockquote, h1, h2, h3, h4, h5, h6').each((_: number, el) => {
      // 只处理最内层的元素，避免重复
      const $el = $(el)
      if ($el.children('p, div, blockquote, h1, h2, h3, h4, h5, h6').length === 0) {
        const text = $el.text().trim()
        if (text) {
          // 过滤广告和无关内容
          const cleaned = this.cleanEnglishText(text)
          if (cleaned) {
            elements.push(cleaned)
          }
        }
      }
    })

    // 将内容分为几个部分
    let currentSection: 'header' | 'containment' | 'description' | 'appendix' = 'header'
    const sections = {
      header: [] as string[],
      containment: [] as string[],
      description: [] as string[],
      appendix: [] as string[],
    }

    for (const text of elements) {
      // 检测章节标题 - 支持章节标题在文本开头的情况
      const containmentMatch = text.match(/^(Special\s+)?Containment\s+Procedures[:：]?\s*(.*)/i)
      if (containmentMatch) {
        currentSection = 'containment'
        const remaining = containmentMatch[2]
        if (remaining && remaining.length > 10) {
          sections.containment.push(remaining)
        }
        continue
      }

      const descMatch = text.match(/^Description[:：]?\s*(.*)/i)
      if (descMatch) {
        currentSection = 'description'
        const remaining = descMatch[1]
        if (remaining && remaining.length > 10) {
          sections.description.push(remaining)
        }
        continue
      }

      const appendixMatch = text.match(/^(Appendix|Addendum|Document\s*#?|Interview\s+Log|Experiment\s+Log|Recovery\s+Log)[:：]?\s*(.*)/i)
      if (appendixMatch) {
        currentSection = 'appendix'
        const remaining = appendixMatch[2]
        if (remaining && remaining.length > 10) {
          sections.appendix.push(remaining)
        }
        continue
      }

      // 检查文本中是否包含章节标题（不仅是在开头）
      if (currentSection === 'containment' && /[\s。]Description[:：]/i.test(text)) {
        // 文本中包含 Description 标记，分割内容
        const parts = text.split(/[\s。]Description[:：]/i)
        if (parts[0] && parts[0].length > 10) {
          sections.containment.push(parts[0].trim())
        }
        if (parts[1] && parts[1].length > 10) {
          sections.description.push(parts[1].trim())
        }
        currentSection = 'description'
        continue
      }

      // 添加到当前部分（过滤太短的文本和导航文本）
      if (text.length > 20 && !/^[«»|]/.test(text) && !/scp-.*«/i.test(text)) {
        sections[currentSection].push(text)
      }
    }

    // 从头部提取项目等级 - 在整个内容中搜索
    const fullContent = elements.join(' ')
    const objectClassMatch = fullContent.match(/Object\s+Class[:：]?\s*([A-Z]+)/i)
    const objectClass = (objectClassMatch ? objectClassMatch[1].toUpperCase() : 'UNKNOWN') as ObjectClass

    const branchUrl = branch === 'cn'
      ? 'https://scp-wiki-cn.wikidot.com'
      : 'https://scp-wiki.wikidot.com'

    return {
      id: `SCP-${scpNumber}`,
      name: `SCP-${scpNumber}`,
      objectClass,
      containment: sections.containment,
      description: sections.description,
      appendix: sections.appendix,
      author: undefined, // 暂时不提取作者
      url: `${branchUrl}/scp-${scpNumber}`,
    }
  }

  /**
   * 清理英文页面文本，过滤广告和无关内容
   */
  private cleanEnglishText(text: string): string | null {
    // 移除 NitroAds 相关文本
    if (/nitroAds|Report Ad|window\['nitroAds'\]/i.test(text)) {
      return null
    }

    // 移除页面导航/工具栏文本
    if (/^(Edit|Rate|Tags|History|Print|Page source|Lock|Rename|Delete)\b/i.test(text)) {
      return null
    }

    // 移除版本信息
    if (/^Page version:\s*\d+/i.test(text)) {
      return null
    }
    if (/^Last edited on/i.test(text)) {
      return null
    }

    // 移除导航符号
    if (/^[«»|]+$/.test(text)) {
      return null
    }

    // 移除 SCP 导航链接文本
    if (/scp-\d+.*«/i.test(text)) {
      return null
    }

    // 移除版权/许可信息
    if (/CC BY-SA|knowledge.*commons|creativecommons/i.test(text)) {
      return null
    }

    // 移除作者归属样板文字
    if (/unless.*stated.*otherwise|community.*content.*licensed/i.test(text)) {
      return null
    }

    // 移除纯符号行
    if (/^[=*\-#_]{3,}$/.test(text)) {
      return null
    }

    // 移除太短的文本（但保留可能的章节标题）
    if (text.length < 15 && !/[.。:：]$/.test(text)) {
      return null
    }

    return text
  }

  /**
   * 从页面中提取作者信息
   */
  private extractAuthorFromPage($content: import('cheerio').CheerioAPI): string | undefined {
    // 查找作者信息通常在页面底部
    const authorSelectors = [
      'p strong:contains("Author")',
      'p:contains("Author:")',
      '.rate-box-with-credits-button',
    ]

    for (const selector of authorSelectors) {
      const $author = $content(selector).first()
      if ($author.length > 0) {
        const text = $author.text()
        const match = text.match(/Author[:：]\s*([^,\n]+)/i)
        if (match) {
          return match[1].trim()
        }
      }
    }

    return undefined
  }

  /**
   * 从章节数据构建 SCPWikiData
   */
  private buildDataFromSections(sections: any, scpNumber: string, branch: string): SCPWikiData {
    const branchUrl = branch === 'cn'
      ? 'https://scp-wiki-cn.wikidot.com'
      : 'https://scp-wiki.wikidot.com'

    return {
      id: `SCP-${scpNumber}`,
      name: sections.title || `SCP-${scpNumber}`,
      objectClass: sections.objectClass,
      containment: sections.containment,
      description: sections.description,
      appendix: sections.appendix,
      author: sections.author,
      url: `${branchUrl}/scp-${scpNumber}`,
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
   * 从 D1 缓存获取
   */
  private async getFromCache(key: string): Promise<SCPWikiData | null> {
    if (!this.db) return null

    try {
      const row = await this.db.prepare(
        'SELECT value FROM cache_entries WHERE key = ? AND expires_at > ?'
      ).bind(key, Date.now()).first<{ value: string }>()

      if (row) {
        return JSON.parse(row.value) as SCPWikiData
      }
    } catch (error) {
      logger.error('Cache read error', error as Error)
    }

    return null
  }

  /**
   * 保存到 D1 缓存
   */
  private async saveToCache(key: string, data: SCPWikiData): Promise<void> {
    if (!this.db) return

    try {
      const expiresAt = Date.now() + this.config.cacheDuration
      await this.db.prepare(
        'INSERT OR REPLACE INTO cache_entries (key, value, expires_at) VALUES (?, ?, ?)'
      ).bind(key, JSON.stringify(data), expiresAt).run()

      // 顺便清理过期缓存（每次写入时概率触发）
      if (Math.random() < 0.1) {
        await this.db.prepare(
          'DELETE FROM cache_entries WHERE expires_at < ?'
        ).bind(Date.now()).run()
      }
    } catch (error) {
      logger.error('Cache write error', error as Error)
    }
  }

  /**
   * 列出所有 SCP 编号
   */
  async listSCPs(limit: number = 100, offset: number = 0, clearanceLevel?: number): Promise<{
    success: boolean
    data?: any[]
    total?: number
    error?: string
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 构建查询条件
      let whereClause = ''
      let params: any[] = []

      if (clearanceLevel !== undefined) {
        whereClause = 'WHERE clearance_level <= ?'
        params.push(clearanceLevel)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM scp_index ${whereClause}`
      const countResult = await this.db.prepare(countQuery)
        .bind(...params)
        .first<{ total: number }>()

      const total = countResult?.total || 0

      // 获取分页数据
      const dataQuery = `SELECT scp_id, name, object_class, tags, clearance_level, updated_at FROM scp_index ${whereClause} ORDER BY scp_id ASC LIMIT ? OFFSET ?`
      const result = await this.db.prepare(dataQuery)
        .bind(...params, limit, offset)
        .all()

      return {
        success: true,
        data: result.results,
        total,
      }
    } catch (error) {
      logger.error('Database query error', error as Error)
      return {
        success: false,
        error: `Database query failed: ${(error as Error).message}`
      }
    }
  }

  /**
   * 在数据库中搜索 SCP
   */
  async searchInDatabase(keyword: string, clearanceLevel?: number): Promise<{
    success: boolean
    data?: any[]
    error?: string
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 使用 LIKE 进行模糊搜索
      let query = `
        SELECT scp_id, name, object_class, tags, clearance_level, updated_at
        FROM scp_index
        WHERE name LIKE ? OR tags LIKE ?
      `
      
      const likeKeyword = `%${keyword}%`
      let params: any[] = [likeKeyword, likeKeyword]

      // 如果指定了权限等级，添加筛选条件
      if (clearanceLevel !== undefined) {
        query += ' AND clearance_level <= ?'
        params.push(clearanceLevel)
      }

      query += ' ORDER BY scp_id ASC LIMIT 20'

      const result = await this.db.prepare(query)
        .bind(...params)
        .all()

      return {
        success: true,
        data: result.results || [],
      }
    } catch (error) {
      logger.error('Database search error', error as Error)
      return {
        success: false,
        error: `Database search failed: ${(error as Error).message}`
      }
    }
  }

  async broadcastNewMessages(): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 查询未广播的消息
      const messages = await this.db.prepare(
        'SELECT * FROM chat_messages WHERE is_broadcast = 0 ORDER BY created_at ASC'
      ).all<ChatMessage>()

      if (!messages.results || messages.results.length === 0) {
        return { success: true, count: 0 }
      }

      // 标记为已广播
      await this.db.prepare(
        'UPDATE chat_messages SET is_broadcast = 1, broadcast_count = broadcast_count + 1 WHERE is_broadcast = 0'
      ).run()

      logger.info(`Broadcasted ${messages.results.length} new chat messages`)
      return {
        success: true,
        count: messages.results.length,
      }
    } catch (error) {
      logger.error('Failed to broadcast chat messages', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  // ==================== Chat Room Methods ====================

  /**
   * 获取所有聊天室
   */
  async getChatRooms(): Promise<ChatApiResponse<ChatRoom[]>> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 获取聊天室列表，包含成员数量和最后消息信息
      const rooms = await this.db.prepare(
        `
        SELECT 
          cr.*,
          (SELECT COUNT(DISTINCT user_id) FROM chat_messages WHERE room_id = cr.id) as member_count,
          (SELECT content FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT username FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_sender,
          (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM chat_rooms cr
        ORDER BY cr.id ASC
        `
      ).all<ChatRoom>()

      return {
        success: true,
        data: rooms.results || [],
      }
    } catch (error) {
      logger.error('Failed to get chat rooms', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  /**
   * 创建聊天室
   */
  async createChatRoom(input: ChatRoomInput): Promise<ChatApiResponse<ChatRoom>> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 验证名称
      if (!input.name || input.name.length > 50) {
        return { success: false, error: 'Invalid room name (max 50 characters)' }
      }

      // 检查用户创建的聊天室数量限制（最多5个）
      const userRoomCount = await this.db.prepare(
        'SELECT COUNT(*) as count FROM chat_rooms WHERE created_by = ?'
      ).bind(input.created_by).first<{ count: number }>()

      if ((userRoomCount?.count || 0) >= 5) {
        return { success: false, error: 'You can create at most 5 chat rooms' }
      }

      const result = await this.db.prepare(
        'INSERT INTO chat_rooms (name, description, created_by, is_public) VALUES (?, ?, ?, ?)'
      ).bind(
        input.name,
        input.description || '',
        input.created_by,
        input.is_public !== undefined ? input.is_public : 1
      ).run()

      if (result.success) {
        const room = await this.db.prepare(
          'SELECT * FROM chat_rooms WHERE id = ?'
        ).bind(result.meta?.last_row_id).first<ChatRoom>()

        return { success: true, data: room ?? undefined }
      } else {
        return { success: false, error: 'Failed to create room' }
      }
    } catch (error) {
      logger.error('Failed to create chat room', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  /**
   * 检查用户发送频率 (1分钟10次)
   */
  async checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining?: number; resetAt?: string }> {
    if (!this.db) {
      return { allowed: true }
    }

    try {
      // 计算1分钟前的时间
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

      // 查询用户最近1分钟内的消息数
      const result = await this.db.prepare(
        'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND created_at > ?'
      ).bind(userId, oneMinuteAgo).first<{ count: number }>()

      const count = result?.count || 0
      const maxMessages = 10

      if (count >= maxMessages) {
        // 获取最早消息的时间来计算重置时间
        const earliest = await this.db.prepare(
          'SELECT created_at FROM chat_messages WHERE user_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT 1'
        ).bind(userId, oneMinuteAgo).first<{ created_at: string }>()

        const resetAt = earliest
          ? new Date(new Date(earliest.created_at).getTime() + 60000).toISOString()
          : new Date(Date.now() + 60000).toISOString()

        return {
          allowed: false,
          remaining: 0,
          resetAt,
        }
      }

      return {
        allowed: true,
        remaining: maxMessages - count,
      }
    } catch (error) {
      logger.error('Failed to check rate limit', error as Error)
      return { allowed: true } // 出错时允许发送
    }
  }

  /**
   * 发送聊天消息（带频率限制和昵称支持）
   */
  async sendChatMessageWithRateLimit(
    userId: string,
    nickname: string | undefined,
    content: string,
    roomId: number = 1
  ): Promise<ChatApiResponse<ChatMessage>> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 检查频率限制
      const rateLimit = await this.checkRateLimit(userId)
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again later.`,

        }
      }

      // 内容长度限制
      if (content.length > 1000) {
        return { success: false, error: 'Message too long (max 1000 characters)' }
      }

      // 获取或设置昵称
      let username = nickname
      if (!username) {
        const storedNickname = await this.getUserNickname(userId)
        username = storedNickname || `User_${userId.slice(0, 8)}`
      }

      // 插入消息到数据库
      const result = await this.db.prepare(
        'INSERT INTO chat_messages (user_id, username, content, room_id) VALUES (?, ?, ?, ?)'
      ).bind(userId, username, content, roomId).run()

      if (result.success) {
        // 更新房间消息计数
        await this.db.prepare(
          'UPDATE chat_rooms SET message_count = message_count + 1 WHERE id = ?'
        ).bind(roomId).run()

        // 获取刚插入的消息
        const message = await this.db.prepare(
          'SELECT * FROM chat_messages WHERE id = ?'
        ).bind(result.meta?.last_row_id).first<ChatMessage>()

        return {
          success: true,
          data: message ?? undefined,
        }
      } else {
        return { success: false, error: 'Failed to send message' }
      }
    } catch (error) {
      logger.error('Failed to send chat message', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  /**
   * 获取用户昵称
   */
  private async getUserNickname(userId: string): Promise<string | null> {
    try {
      if (!this.db) return null
      const result = await this.db.prepare(
        'SELECT value FROM user_settings WHERE key = ?'
      ).bind(`nickname_${userId}`).first<{ value: string }>()

      return result?.value || null
    } catch {
      return null
    }
  }

  /**
   * 设置用户昵称
   */
  async setUserNickname(userId: string, nickname: string): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      if (nickname.length > 30) {
        return { success: false, error: 'Nickname too long (max 30 characters)' }
      }

      await this.db.prepare(
        'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)'
      ).bind(`nickname_${userId}`, nickname, new Date().toISOString()).run()

      return { success: true }
    } catch (error) {
      logger.error('Failed to set nickname', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  /**
   * 获取聊天消息（支持按房间过滤）
   */
  async getChatMessages(limit: number = 50, after?: string, roomId?: number): Promise<ChatApiResponse<ChatMessage[]>> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      let query = 'SELECT * FROM chat_messages WHERE 1=1'
      const params: any[] = []

      if (roomId !== undefined && roomId !== null) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }

      if (after) {
        query += ' AND created_at > ?'
        params.push(after)
      }

      query += ' ORDER BY created_at DESC LIMIT ?'
      params.push(limit)

      const messages = await this.db.prepare(query)
        .bind(...params)
        .all<ChatMessage>()

      return {
        success: true,
        data: (messages.results || []).reverse(),
        count: messages.results?.length || 0,
      }
    } catch (error) {
      logger.error('Failed to get chat messages', error as Error)
      return {
        success: false,
        error: `Database error: ${(error as Error).message}`
      }
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    success: boolean
    stats?: {
      total: number
      byClass: Record<string, number>
      byClearance: Record<number, number>
    }
    error?: string
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 按项目等级统计
      const classResult = await this.db.prepare(
        'SELECT object_class, COUNT(*) as count FROM scp_index GROUP BY object_class'
      ).all()

      const byClass: Record<string, number> = {}

      for (const row of classResult.results as unknown as D1StatRow[]) {
        byClass[row.object_class] = row.count
      }

      // 按权限等级统计
      const clearanceResult = await this.db.prepare(
        'SELECT clearance_level, COUNT(*) as count FROM scp_index GROUP BY clearance_level ORDER BY clearance_level'
      ).all()

      const byClearance: Record<number, number> = {}

      for (const row of clearanceResult.results as unknown as D1ClearanceRow[]) {
        byClearance[row.clearance_level] = row.count
      }

      // 获取总数
      const totalResult = await this.db.prepare(
        'SELECT COUNT(*) as total FROM scp_index'
      ).first<{ total: number }>()

      const total = totalResult?.total || 0

      return {
        success: true,
        stats: { total, byClass, byClearance },
      }
    } catch (error) {
      logger.error('Database stats error', error as Error)
      return {
        success: false,
        error: `Failed to get stats: ${(error as Error).message}`
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsManager = new CORSManager()
    const rateLimiter = env.SCP_DB ? new D1RateLimiter(env.SCP_DB) : new RateLimiter()
    if (request.method === 'OPTIONS') {
      const pc: RequestContext = {
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
        userAgent: request.headers.get('User-Agent') || '',
        timestamp: Date.now(),
      }
      return corsManager.handlePreflight(pc)
    }
    try {
      const url = new URL(request.url)
      const path = url.pathname
      const isChatWs = (path === '/chat/ws' || /^\/chat\/room\/\d+\/ws$/.test(path))
      if (isChatWs && request.headers.get('Upgrade') === 'websocket') {
        const chatRoomId = env.CHAT_ROOM_DO.idFromName('global-v3')
        const chatRoomStub = env.CHAT_ROOM_DO.get(chatRoomId)
        return chatRoomStub.fetch(request)
      }
      const router = new Router()
      const scraper = new SCPScraper(env.SCP_DB)
      const authResult = await requireAuth(request, env, corsManager)
      let authenticatedUserId: string | undefined
      if (!(authResult instanceof Response)) {
        authenticatedUserId = authResult.userId
      }
      registerRoutes(router, {
        scraper,
        env,
        corsManager,
        rateLimiter,
        authenticatedUserId,
      })
      const context: RequestContext = {
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
        userAgent: request.headers.get('User-Agent') || '',
        timestamp: Date.now(),
      }
      if (request.method !== 'OPTIONS') {
        const identifier = authenticatedUserId || context.ip
        const isAllowed = await rateLimiter.checkLimit(identifier)
        if (!isAllowed) {
          return corsManager.createErrorResponse(rateLimitedError('Rate limit exceeded'), 429, context)
        }
      }
      const resolved = router.resolve(request.method, path)
      if (resolved) {
        return resolved.handler(request, env, context, resolved.params, url)
      }
      return corsManager.createErrorResponse('Not found', 404, context)
    } catch (error) {
      logger.error('Worker error', error as Error)
      const ctx: RequestContext = {
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
        userAgent: request.headers.get('User-Agent') || '',
        timestamp: Date.now(),
      }
      return new CORSManager().createErrorResponse('Internal server error', 500, ctx)
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const scraper = new SCPScraper(env.SCP_DB)
    const result = await scraper.broadcastNewMessages()
    logger.info('[Scheduled] Broadcast result:', result)
  },
}


/**
 * SCP Scraper Worker
 * 重构版本 - 使用模块化架构
 */

import { getConfig } from './shared/config'
import type { Env, ScraperResult, SCPWikiData, RequestContext, ChatMessage, ChatApiResponse, ChatRoom, ChatRoomInput } from './shared/types'
import * as feedbackAPI from './api/feedback'

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

  constructor(private kv?: KVNamespace, private db?: D1Database) {}

  /**
   * 爬取指定 SCP 的详细信息
   */
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

  /**
   * 获取 URL 内容（不带HTML验证）
   */
  private async fetchURLWithoutValidation(url: string): Promise<string> {
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

        return await response.text()
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
    // 根据分部选择 URL
    const branchUrl = branch === 'cn' 
      ? 'https://scp-wiki-cn.wikidot.com' 
      : 'https://scp-wiki.wikidot.com'
    
    const url = `${branchUrl}/scp-${scpNumber}`
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
  private async parseHTML(html: string, scpNumber: string, branch: string = 'en'): Promise<SCPWikiData> {
    const parseTimer = performanceMonitor.startTimer('parseHTML')

    try {
      // 先消毒 HTML（防止 XSS）
      const sanitizedHTML = this.htmlSanitizer.sanitize(html)

      // 根据分支使用不同的解析策略
      let data: SCPWikiData
      if (branch === 'en') {
        // 英文站点也需要清理广告和无关内容
        const cleanedHTML = this.htmlCleaner.clean(sanitizedHTML)
        data = await this.parseEnglishPage(cleanedHTML, scpNumber, branch)
      } else {
        // 中文站点使用清理后的文本
        const cleanedHTML = this.htmlCleaner.clean(sanitizedHTML)
        const text = this.htmlParser.extractText(cleanedHTML)
        const sections = this.sectionParser.parseSections(text)
        data = this.buildDataFromSections(sections, scpNumber, branch)
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
   * 解析英文页面（直接使用 HTML 结构）
   */
  private async parseEnglishPage(html: string, scpNumber: string, branch: string): Promise<SCPWikiData> {
    const cheerioModule = await import('cheerio')
    const $ = cheerioModule.load(html)

    // 找到主内容区域
    const $content = $('#page-content')
    if ($content.length === 0) {
      throw new Error('Page content not found')
    }

    // 获取所有段落和块级元素（包括嵌套的）
    const elements: string[] = []
    $content.find('p, div, blockquote, h1, h2, h3, h4, h5, h6').each((_, el) => {
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
    const objectClass = objectClassMatch ? objectClassMatch[1].toUpperCase() : 'UNKNOWN'

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
  private extractAuthorFromPage($content: ReturnType<typeof import('cheerio').load>['$']): string | undefined {
    // 查找作者信息通常在页面底部
    const authorSelectors = [
      'p strong:contains("Author")',
      'p:contains("Author:")',
      '.rate-box-with-credits-button',
    ]

    for (const selector of authorSelectors) {
      const $author = $(selector).first()
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

  /**
   * 发送聊天消息到 D1 数据库
   */
  async sendChatMessage(userId: string, username: string, content: string): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 内容长度限制
      if (content.length > 1000) {
        return { success: false, error: 'Message too long (max 1000 characters)' }
      }

      // 插入消息到数据库
      const result = await this.db.prepare(
        'INSERT INTO chat_messages (user_id, username, content) VALUES (?, ?, ?)'
      ).bind(userId, username, content).run()

      if (result.success) {
        // 获取刚插入的消息
        const message = await this.db.prepare(
          'SELECT * FROM chat_messages WHERE id = ?'
        ).bind(result.meta?.last_row_id).first<ChatMessage>()

        return {
          success: true,
          data: message,
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
   * 获取聊天消息
   */
  async getChatMessages(limit: number = 50, after?: string): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      let query = 'SELECT * FROM chat_messages'
      const params: any[] = []

      if (after) {
        query += ' WHERE created_at > ?'
        params.push(after)
      }

      query += ' ORDER BY created_at DESC LIMIT ?'
      params.push(limit)

      const messages = await this.db.prepare(query)
        .bind(...params)
        .all<ChatMessage>()

      return {
        success: true,
        data: (messages.results || []).reverse(), // 反转为用户时间顺序
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
   * 定时任务：广播新消息
   * 每 10 分钟运行一次，查询未广播的消息并标记
   */
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
  async getChatRooms(): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      const rooms = await this.db.prepare(
        'SELECT * FROM chat_rooms ORDER BY id ASC'
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
  async createChatRoom(input: ChatRoomInput): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 验证名称
      if (!input.name || input.name.length > 50) {
        return { success: false, error: 'Invalid room name (max 50 characters)' }
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

        return { success: true, data: room }
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
  ): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      // 检查频率限制
      const rateLimit = await this.checkRateLimit(userId)
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again after ${new Date(rateLimit.resetAt!).toLocaleTimeString()}`,
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
          data: message,
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
      const result = await this.db!.prepare(
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
  async getChatMessages(limit: number = 50, after?: string, roomId?: number): Promise<ChatApiResponse> {
    if (!this.db) {
      return { success: false, error: 'Database not available' }
    }

    try {
      let query = 'SELECT * FROM chat_messages WHERE 1=1'
      const params: any[] = []

      if (roomId) {
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

      for (const row of classResult.results as any[]) {
        byClass[row.object_class] = row.count
      }

      // 按权限等级统计
      const clearanceResult = await this.db.prepare(
        'SELECT clearance_level, COUNT(*) as count FROM scp_index GROUP BY clearance_level ORDER BY clearance_level'
      ).all()

      const byClearance: Record<number, number> = {}

      for (const row of clearanceResult.results as any[]) {
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

/**
 * Worker 入口点
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsManager = new CORSManager()
    const rateLimiter = new RateLimiter()
    const config = getConfig()

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

      const scraper = new SCPScraper(env.SCP_CACHE, env.SCP_DB)
      const url = new URL(request.url)
      const path = url.pathname

      // 路由处理
      if (path === '/scrape') {
        const scpNumber = url.searchParams.get('number')
        const branch = url.searchParams.get('branch') || 'en' // 默认英文分部
        
        if (!scpNumber) {
          return corsManager.createErrorResponse('Missing number parameter', 400, context)
        }

        logger.info('Scraping SCP', { scpNumber, branch, ip })
        const result = await scraper.scrapeSCP(scpNumber, branch)

        if (result.success) {
          logger.info('Scrape successful', { scpNumber, cached: result.cached })
        } else {
          logger.warn('Scrape failed', { scpNumber, error: result.error })
        }

        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/search') {
        const keyword = url.searchParams.get('keyword')
        const branch = url.searchParams.get('branch') || 'en' // 默认英文分部

        if (!keyword) {
          return corsManager.createErrorResponse('Missing keyword parameter', 400, context)
        }

        const clearanceLevel = url.searchParams.get('clearance_level')
          ? parseInt(url.searchParams.get('clearance_level')!)
          : undefined

        logger.info('Searching SCP', { keyword, branch, clearanceLevel, ip })

        // 如果有 clearance_level，使用数据库搜索
        if (clearanceLevel !== undefined) {
          const result = await scraper.searchInDatabase(keyword, clearanceLevel)
          return corsManager.createResponse(result, result.success ? 200 : 500, context)
        }

        // 否则使用网页搜索
        const result = await scraper.searchSCP(keyword, branch)
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/chat/send') {
        // 发送聊天消息（带频率限制）
        if (request.method !== 'POST') {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }

        try {
          const body = await request.json() as any
          const { user_id, nickname, content, room_id } = body

          if (!user_id || !content) {
            return corsManager.createErrorResponse('Missing user_id or content', 400, context)
          }

          const result = await scraper.sendChatMessageWithRateLimit(
            user_id,
            nickname,
            content,
            room_id || 1
          )
          return corsManager.createResponse(result, result.success ? 200 : 429, context)
        } catch (error) {
          logger.error('Failed to parse chat message', error as Error)
          return corsManager.createErrorResponse('Invalid request body', 400, context)
        }
      } else if (path === '/chat/messages') {
        // 获取聊天消息（支持房间过滤）
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const after = url.searchParams.get('after') || undefined
        const roomId = url.searchParams.get('room_id') ? parseInt(url.searchParams.get('room_id')!) : undefined

        const result = await scraper.getChatMessages(limit, after, roomId)
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/chat/rooms') {
        // 获取所有聊天室
        if (request.method === 'GET') {
          const result = await scraper.getChatRooms()
          return corsManager.createResponse(result, result.success ? 200 : 500, context)
        } else if (request.method === 'POST') {
          // 创建聊天室
          try {
            const body = await request.json() as any
            const { name, description, created_by, is_public } = body

            if (!name || !created_by) {
              return corsManager.createErrorResponse('Missing name or created_by', 400, context)
            }

            const result = await scraper.createChatRoom({ name, description, created_by, is_public })
            return corsManager.createResponse(result, result.success ? 201 : 500, context)
          } catch (error) {
            logger.error('Failed to parse room creation', error as Error)
            return corsManager.createErrorResponse('Invalid request body', 400, context)
          }
        } else {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }
      } else if (path === '/chat/nickname') {
        // 设置用户昵称
        if (request.method !== 'POST') {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }

        try {
          const body = await request.json() as any
          const { user_id, nickname } = body

          if (!user_id || !nickname) {
            return corsManager.createErrorResponse('Missing user_id or nickname', 400, context)
          }

          const result = await scraper.setUserNickname(user_id, nickname)
          return corsManager.createResponse(result, result.success ? 200 : 500, context)
        } catch (error) {
          logger.error('Failed to parse nickname', error as Error)
          return corsManager.createErrorResponse('Invalid request body', 400, context)
        }
      } else if (path === '/feedback/submit') {
        // 提交反馈
        if (request.method !== 'POST') {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }

        try {
          const body = await request.json() as any
          const { user_id, nickname, title, content, category } = body

          if (!user_id || !title || !content) {
            return corsManager.createErrorResponse('Missing required fields', 400, context)
          }

          const result = await feedbackAPI.submitFeedback(scraper['db'] as D1Database, {
            user_id, nickname, title, content, category
          })
          return corsManager.createResponse(result, result.success ? 201 : 500, context)
        } catch (error) {
          logger.error('Failed to submit feedback', error as Error)
          return corsManager.createErrorResponse('Invalid request body', 400, context)
        }
      } else if (path === '/feedback/list') {
        // 获取反馈列表
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const category = url.searchParams.get('category') || undefined

        const result = await feedbackAPI.getFeedbackList(
          scraper['db'] as D1Database, limit, offset, category
        )
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/feedback/like') {
        // 点赞反馈
        if (request.method !== 'POST') {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }

        try {
          const body = await request.json() as any
          const { id } = body

          if (!id) {
            return corsManager.createErrorResponse('Missing feedback id', 400, context)
          }

          const result = await feedbackAPI.likeFeedback(scraper['db'] as D1Database, id)
          return corsManager.createResponse(result, result.success ? 200 : 500, context)
        } catch (error) {
          logger.error('Failed to like feedback', error as Error)
          return corsManager.createErrorResponse('Invalid request body', 400, context)
        }
      } else if (path === '/feedback/categories') {
        // 获取反馈分类统计
        const result = await feedbackAPI.getFeedbackCategories(scraper['db'] as D1Database)
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/chat/broadcast') {
        // 定时任务：广播新消息
        const result = await scraper.broadcastNewMessages()
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/debug') {
        const scpNumber = url.searchParams.get('number') || '173'
        logger.info('Debug mode', { scpNumber, ip })
        const result = await scraper.getRawHTML(scpNumber)
        return corsManager.createResponse(result, 200, context)
      } else if (path === '/list') {
        const limit = parseInt(url.searchParams.get('limit') || '100')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const clearanceLevel = url.searchParams.get('clearance_level')
          ? parseInt(url.searchParams.get('clearance_level')!)
          : undefined

        logger.info('Listing SCPs', { limit, offset, clearanceLevel, ip })
        const result = await scraper.listSCPs(limit, offset, clearanceLevel)
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/stats') {
        logger.info('Getting stats', { ip })
        const result = await scraper.getStats()
        return corsManager.createResponse(result, result.success ? 200 : 500, context)
      } else if (path === '/performance') {
        // 性能监控API端点
        if (request.method === 'POST') {
          // 接收性能指标数据
          try {
            const body = await request.json() as any
            logger.info('Received performance metrics', { ip, metrics: body })
            
            // 存储性能指标到KV
            const metricKey = `perf-${Date.now()}`
            await env.SCP_CACHE?.put(metricKey, JSON.stringify(body), {
              expirationTtl: 3600, // 1小时过期
            })
            
            return corsManager.createResponse({
              success: true,
              message: 'Performance metrics received',
              timestamp: Date.now()
            }, 200, context)
          } catch (error) {
            logger.error('Failed to parse performance metrics', error as Error)
            return corsManager.createErrorResponse('Invalid request body', 400, context)
          }
        } else if (request.method === 'GET') {
          // 获取最近的性能指标
          try {
            const limit = parseInt(url.searchParams.get('limit') || '10')
            const metrics: any[] = []
            
            // 列出所有性能指标键
            const list = await env.SCP_CACHE?.list({ prefix: 'perf-', limit })
            
            if (list && list.keys.length > 0) {
              // 获取所有指标数据
              for (const key of list.keys) {
                const value = await env.SCP_CACHE?.get(key.name, 'text')
                if (value) {
                  metrics.push(JSON.parse(value))
                }
              }
            }
            
            return corsManager.createResponse({
              success: true,
              metrics: metrics.reverse(), // 最新的在前
              count: metrics.length
            }, 200, context)
          } catch (error) {
            logger.error('Failed to retrieve performance metrics', error as Error)
            return corsManager.createErrorResponse('Failed to retrieve metrics', 500, context)
          }
        } else {
          return corsManager.createErrorResponse('Method not allowed', 405, context)
        }
      } else if (path === '/') {
        return corsManager.createResponse(
          {
            name: 'SCP Scraper Worker',
            version: '2.0.0',
            status: 'online',
            endpoints: {
              '/scrape?number={number}': '爬取指定SCP的信息',
              '/search?keyword={keyword}&clearance_level={level}': '搜索SCP（使用数据库，可选按权限等级筛选）',
              '/list?limit={limit}&offset={offset}&clearance_level={level}': '列出SCP编号（默认100条，可选按权限等级筛选）',
              '/stats': '获取数据库统计信息',
              '/debug?number={number}': '调试：返回原始HTML',
              '/performance': '性能监控API (POST: 提交指标, GET: 获取指标)',
              '/chat/send': '发送聊天消息 (POST, 带频率限制)',
              '/chat/messages': '获取聊天消息 (GET, 支持房间过滤)',
              '/chat/rooms': '获取/创建聊天室 (GET/POST)',
              '/chat/nickname': '设置用户昵称 (POST)',
              '/chat/broadcast': '广播新消息 (定时任务)',
            },
            features: {
              modular: true,
              caching: `${config.cacheDuration / 1000 / 60} minutes`,
              retry: `${config.retryAttempts} attempts`,
              rateLimit: `${config.rateLimit.maxRequests} requests / ${config.rateLimit.windowMs / 1000}s`,
              database: 'D1 database enabled with tags and clearance_level filtering',
              performance: 'Performance monitoring with metrics collection',
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

  /**
   * 定时任务入口点
   * 每 10 分钟运行一次，用于广播新消息
   */
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const scraper = new SCPScraper(env.SCP_CACHE, env.SCP_DB)
    const result = await scraper.broadcastNewMessages()
    console.log(`[Scheduled] Broadcast result:`, result)
  },
}
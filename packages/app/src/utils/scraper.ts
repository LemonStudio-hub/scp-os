import { OBJECT_CLASSES } from '../constants/scraperConfig'
import type { SCPWikiData, ScraperResult, ObjectClassInfo, ObjectClass } from '../types/scraper'
import { config } from '../config'
import logger from './logger'

class ApiResponseError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: Record<string, unknown>,
    public readonly statusText: string
  ) {
    super(`HTTP ${status}: ${statusText}`)
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function objectClass(value: unknown): ObjectClass {
  const key = String(value || 'UNKNOWN').toUpperCase()
  return key in OBJECT_CLASSES ? (key as ObjectClass) : 'UNKNOWN'
}

async function apiFetch(
  url: string,
  params: Record<string, string | number>,
  timeout: number
): Promise<{ status: number; data: Record<string, unknown> }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
  const fullUrl = search.size > 0 ? `${url}?${search}` : url
  try {
    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) throw new ApiResponseError(response.status, data, response.statusText)
    return { status: response.status, data }
  } catch (error) {
    clearTimeout(timer)
    throw error
  }
}

// Worker config values mirror the backend to ensure consistent timeout/retry behavior
const WORKER_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
}

/**
 * Estimate terminal width in columns for responsive text layout.
 * Prefers the live terminal instance cols; falls back to screen-width heuristic.
 */
function getTerminalWidth(): number {
  // Prefer the live terminal instance for accurate column count
  if (typeof window !== 'undefined' && window.__terminalInstance) {
    const cols = window.__terminalInstance.cols
    if (cols && cols > 0) {
      return cols
    }
  }

  // Fallback: estimate from screen width
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    const fontSize = screenWidth < 480 ? 10 : screenWidth < 768 ? 12 : screenWidth < 1200 ? 14 : 16

    if (isMobile) {
      // Mobile monospace fonts are ~10-12px with ~6px char width and 16-20px container padding
      const charWidth = 6.5
      const padding = 16
      const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
      return Math.max(25, Math.min(50, estimatedCols))
    }

    // Desktop: estimate from screen width
    const charWidth = fontSize * 0.6
    const padding = 20
    const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
    return Math.max(40, Math.min(120, estimatedCols))
  }

  // Sensible default when no window is available
  return 80
}

/**
 * Calculate display width of a string in terminal columns.
 * CJK ideographs occupy 2 columns each, so a simple .length check is insufficient.
 */
function getDisplayWidth(str: string): number {
  let width = 0
  for (const char of str) {
    const code = char.codePointAt(0) || 0
    // CJK ideographs are double-width in monospace terminals
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0x20000 && code <= 0x2a6df) ||
      (code >= 0x2a700 && code <= 0x2b73f) ||
      (code >= 0x2b740 && code <= 0x2b81f) ||
      (code >= 0x2b820 && code <= 0x2ceaf) ||
      (code >= 0x2f00 && code <= 0x2fdf) ||
      (code >= 0x3000 && code <= 0x303f) ||
      (code >= 0xff00 && code <= 0xffef)
    ) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

/**
 * Strip ANSI escape sequences before measuring display width to avoid counting color codes.
 */
function getVisibleWidth(str: string): number {
  const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '')
  return getDisplayWidth(cleanStr)
}

/**
 * Right-pad a string with spaces to a target display width, accounting for CJK double-width chars.
 */
function padToWidth(str: string, targetWidth: number): string {
  const currentWidth = getVisibleWidth(str)
  const paddingNeeded = Math.max(0, targetWidth - currentWidth)
  return str + ' '.repeat(paddingNeeded)
}

/**
 * Generates box-drawing borders sized to the current terminal width.
 */
class BorderGenerator {
  private width: number

  constructor(width: number) {
    this.width = width
  }

  // Double-line top border: ╔═══════════════════╗
  get topBorder(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `╔${'═'.repeat(innerWidth)}╗`
  }

  // Double-line bottom border: ╚═══════════════════╝
  get bottomBorder(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `╚${'═'.repeat(innerWidth)}╝`
  }

  // Double-line vertical content row
  verticalLine(content: string): string {
    return `║ ${padToWidth(content, this.width - 4)} ║`
  }

  // Single-line top border: ┌───────────────────┐
  get boxTop(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `┌${'─'.repeat(innerWidth)}┐`
  }

  // Single-line bottom border: └───────────────────┘
  get boxBottom(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `└${'─'.repeat(innerWidth)}┘`
  }

  // Single-line separator: ├───────────────────┤
  get boxSeparator(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `├${'─'.repeat(innerWidth)}┤`
  }

  // Single-line content row: │ content              │
  boxContent(content: string): string {
    return `│${padToWidth(content, this.width - 2)}│`
  }
}

class SCPScraper {
  private cache: Map<string, { data: SCPWikiData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = config.cache.duration
  private readonly API_TIMEOUT = WORKER_CONFIG.timeout

  /**
   * Fetch detailed info for a specific SCP entry from the Worker API.
   * @param scpNumber SCP number (e.g. "173")
   * @param branch Wiki branch ("cn" for Chinese, defaults to "en")
   * @returns Scraping result with data or error
   */
  async scrapeSCP(scpNumber: string, branch: string = 'en'): Promise<ScraperResult> {
    const cacheKey = `scp-${branch}-${scpNumber}`

    // Return cached data immediately to avoid unnecessary network calls
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return { success: true, data: cached, cached: true }
    }

    // Retry with exponential backoff to handle transient network failures
    for (let attempt = 1; attempt <= WORKER_CONFIG.retryAttempts; attempt++) {
      try {
        const apiUrl = `${config.api.workerUrl}/scrape`
        logger.info(
          `[尝试 ${attempt}/${WORKER_CONFIG.retryAttempts}] 正在请求 API: ${apiUrl}?number=${scpNumber}&branch=${branch}`
        )

        // Call the Cloudflare Worker API
        const response = await apiFetch(apiUrl, { number: scpNumber, branch }, this.API_TIMEOUT)

        logger.info(`API 响应状态: ${response.status}`)
        logger.info(`API 响应数据:`, response.data)

        if (response.data['success'] && response.data['data']) {
          const data = this.normalizeData(response.data['data'])

          // Persist to in-memory cache for subsequent requests
          this.saveToCache(cacheKey, data)
          return { success: true, data }
        } else {
          return {
            success: false,
            error: (response.data['error'] as string) || '爬取失败',
          }
        }
      } catch (error) {
        // Classify the error to decide whether to retry
        if (error instanceof ApiResponseError) {
          logger.error(`API 错误响应:`, { status: error.status, data: error.data })
          if (error.status >= 400 && error.status < 500) {
            return {
              success: false,
              error: `API 错误 (${error.status}): ${(error.data['error'] as string) || error.statusText}`,
            }
          }
          // 5xx 错误可以重试
        } else if (
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          logger.error(`无响应:`, { message: (error as Error).message, attempt })
          if (attempt === WORKER_CONFIG.retryAttempts) {
            return {
              success: false,
              error: `网络错误: 无法连接到服务器 (NETWORK_ERROR)`,
            }
          }
          await this.sleep(WORKER_CONFIG.retryDelay * attempt)
        } else {

          logger.error(`未知错误:`, error)
          return {
            success: false,
            error: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      }
    }

    // All retry attempts exhausted
    return {
      success: false,
      error: `网络错误: 无法连接到服务器 (已重试 ${WORKER_CONFIG.retryAttempts} 次)`,
    }
  }

  /**
   * Pause execution for retry backoff.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Search for SCP entries matching a keyword.
   * @param keyword Search term
   * @returns Search result with data or error
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      const apiUrl = `${config.api.workerUrl}/search`
      logger.info(`正在搜索: ${apiUrl}?keyword=${keyword}`)

      // Call the Cloudflare Worker search API
      const response = await apiFetch(apiUrl, { keyword }, this.API_TIMEOUT)

      logger.info(`搜索响应状态: ${response.status}`)
      logger.info(`搜索响应数据:`, response.data)

      if (response.data['success'] && response.data['data']) {
        // Array response indicates database search results
        if (Array.isArray(response.data['data'])) {
          if (response.data['data'].length === 0) {
            return { success: false, error: `未找到包含 "${keyword}" 的SCP对象` }
          }

          // Use the first match as the primary result
          const firstResult = response.data['data'][0] as Record<string, unknown>
          const data = this.normalizeData({
            id: `SCP-${firstResult['scp_id']}`,
            number: String(firstResult['scp_id']),
            name: firstResult['name'],
            objectClass: firstResult['object_class'],
            tags: firstResult['tags'],
            clearanceLevel: firstResult['clearance_level'],
          })
          return { success: true, data }
        } else if (typeof response.data['data'] === 'object') {
          // Single object response indicates scraper result
          const data = this.normalizeData(response.data['data'])
          return { success: true, data }
        }
      }

      return { success: false, error: `未找到包含 "${keyword}" 的SCP对象` }
    } catch (error) {
      // Classify the error for a meaningful user-facing message
      if (error instanceof ApiResponseError) {
        logger.error(`搜索错误响应:`, { status: error.status, data: error.data })
        return {
          success: false,
          error: `搜索错误 (${error.status}): ${(error.data['error'] as string) || error.statusText}`,
        }
      } else if (
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        logger.error(`搜索无响应:`, { message: error.message })
        return { success: false, error: `网络错误: 无法连接到服务器 (NETWORK_ERROR)` }
      } else {

        logger.error(`搜索未知错误:`, error)
        return {
          success: false,
          error: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    }
  }

  /**
   * Normalize API response into a consistent SCPWikiData shape.
   */
  private normalizeData(value: unknown): SCPWikiData {
    const data = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
    return {
      id: String(data.id || `SCP-${data.number || ''}`),
      name: String(data.name || '未知'),
      objectClass: objectClass(data.objectClass),
      containment: stringArray(data.containment),
      description: stringArray(data.description),
      appendix: stringArray(data.appendix),
      references: stringArray(data.references),
      author: String(data.author || '未知作者'),
      url: String(data.url || ''),
    }
  }

  /**
   * Format SCP data for terminal display with responsive borders and text wrapping.
   * Adapts layout based on actual terminal width.
   */
  formatForTerminal(data: SCPWikiData): string[] {
    const lines: string[] = []
    const classInfo = OBJECT_CLASSES[data.objectClass] || OBJECT_CLASSES.UNKNOWN
    const terminalWidth = getTerminalWidth()
    const isMobile = terminalWidth <= 50

    if (isMobile) {
      // Mobile: use simplified layout without complex box-drawing
      return this.formatForMobile(data, classInfo, terminalWidth)
    }

    // Desktop: full layout with double-line borders
    const border = new BorderGenerator(terminalWidth)

    // Top border
    lines.push(border.topBorder)

    // Title row
    const title = `${data.id} - ${data.name} — ${classInfo.displayName}`
    lines.push(border.verticalLine(title))
    lines.push(border.bottomBorder)
    lines.push('')

    // Object class section
    lines.push(border.boxTop)
    lines.push(border.boxContent(' 项目等级'))
    lines.push(border.boxSeparator)
    lines.push(border.boxContent(` 等级: [${data.objectClass}] ${classInfo.displayName}`))
    lines.push(border.boxContent(` 说明: ${classInfo.description}`))
    lines.push(border.boxBottom)
    lines.push('')

    // Author (if available)
    if (data.author && data.author !== '未知作者') {
      lines.push(`作者: ${data.author}`)
      lines.push('')
    }

    // Containment procedures section
    if (data.containment.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 收容协议'))
      lines.push(border.boxSeparator)

      data.containment.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach((line) => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    // Description section
    if (data.description.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 描述'))
      lines.push(border.boxSeparator)

      data.description.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach((line) => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    // Appendix section
    if (data.appendix.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 附录'))
      lines.push(border.boxSeparator)

      data.appendix.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach((line) => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    return lines
  }

  /**
   * Simplified formatting for mobile terminals.
   * Uses lightweight separators instead of box-drawing characters.
   */
  private formatForMobile(
    data: SCPWikiData,
    classInfo: ObjectClassInfo,
    terminalWidth: number
  ): string[] {
    const lines: string[] = []
    const padding = ' '.repeat(2)

    // Simplified title
    lines.push('═'.repeat(terminalWidth))
    lines.push(`${padding}${data.id} - ${data.name}`)
    lines.push(`${padding}项目等级: ${data.objectClass} (${classInfo.displayName})`)
    lines.push('═'.repeat(terminalWidth))
    lines.push('')

    // Containment procedures section
    if (data.containment.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}收容协议`)
      lines.push('─'.repeat(terminalWidth))

      data.containment.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach((line) => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    // Description section
    if (data.description.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}描述`)
      lines.push('─'.repeat(terminalWidth))

      data.description.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach((line) => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    // Appendix section
    if (data.appendix.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}附录`)
      lines.push('─'.repeat(terminalWidth))

      data.appendix.forEach((text) => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach((line) => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    return lines
  }

  /**
   * Wrap text to fit within a max display width, accounting for CJK double-width chars.
   * @param text Text to wrap
   * @param maxWidth Maximum display width in columns
   * @returns Array of wrapped lines
   */
  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return ['']

    const lines: string[] = []
    let currentLine = ''
    let currentWidth = 0

    for (const char of text) {
      if (char === '\n') {
        lines.push(currentLine)
        currentLine = ''
        currentWidth = 0
        continue
      }

      const charWidth = getDisplayWidth(char)

      // Break to a new line when adding this char would exceed the max width
      if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
        currentWidth = charWidth
      } else {
        currentLine += char
        currentWidth += charWidth
      }
    }

    // Push any remaining text as the final line
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : ['']
  }

  /**
   * Look up object class metadata by class key.
   */
  getClassInfo(objectClass: string): ObjectClassInfo {
    return OBJECT_CLASSES[objectClass] || OBJECT_CLASSES.UNKNOWN
  }

  /**
   * In-memory cache helpers with TTL expiry.
   */
  private getFromCache(key: string): SCPWikiData | null {
    const cached = this.cache.get(key)
    if (cached) {
      const now = Date.now()
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }
      this.cache.delete(key)
    }
    return null
  }

  private saveToCache(key: string, data: SCPWikiData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Drop all cached entries.
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Test connectivity to the Worker API for diagnostics.
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      logger.info('测试 API 连接...')
      const response = await apiFetch(`${config.api.workerUrl}/`, {}, 10000)
      logger.info('API 连接测试成功:', response.data)
      return { success: true, message: 'API 连接正常', details: response.data }
    } catch (error) {
      logger.error('API 连接测试失败:', error)
      if (error instanceof ApiResponseError) {
        return {
          success: false,
          message: `API 返回错误状态: ${error.status}`,
          details: { status: error.status, data: error.data },
        }
      } else if (
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        return {
          success: false,
          message: `无法连接到服务器: NETWORK_ERROR`,
          details: { message: error.message, url: config.api.workerUrl },
        }
      }
      return {
        success: false,
        message: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Fetch a paginated list of SCP entries.
   * @param limit Number of results per page
   * @param offset Pagination offset
   * @param clearanceLevel Optional clearance level filter
   * @returns Paginated SCP list
   */
  async listSCPs(
    limit: number = 100,
    offset: number = 0,
    clearanceLevel?: number
  ): Promise<{
    success: boolean
    data?: Array<{
      scp_id: number
      name: string
      object_class: string
      tags: string
      clearance_level: number
      updated_at: string
    }>
    total?: number
    error?: string
  }> {
    try {
      const apiUrl = `${config.api.workerUrl}/list`
      const params: Record<string, number | string> = { limit, offset }

      if (clearanceLevel !== undefined) {
        params.clearance_level = clearanceLevel
      }

      logger.info(`正在获取 SCP 列表: ${apiUrl}`, params)

      const response = await apiFetch(apiUrl, params, this.API_TIMEOUT)
      logger.info(`列表响应状态: ${response.status}`)

      if (response.data['success']) {
        return {
          success: true,
          data: response.data['data'] as Array<{
            scp_id: number
            name: string
            object_class: string
            tags: string
            clearance_level: number
            updated_at: string
          }>,
          total: response.data['total'] as number | undefined,
        }
      } else {
        return {
          success: false,
          error: (response.data['error'] as string) || '获取列表失败',
        }
      }
    } catch (error) {
      if (error instanceof ApiResponseError) {
        return {
          success: false,
          error: `API 错误 (${error.status}): ${(error.data['error'] as string) || error.statusText}`,
        }
      } else if (
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        return { success: false, error: `网络错误: 无法连接到服务器 (NETWORK_ERROR)` }
      } else {
        return {
          success: false,
          error: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    }
  }
}

// Export singleton instance
export const scraper = new SCPScraper()

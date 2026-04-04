import axios from 'axios'
import { OBJECT_CLASSES } from '../constants/scraperConfig'
import type { SCPWikiData, ScraperResult, ObjectClassInfo } from '../types/scraper'
import { config } from '../config'

// Worker 统一配置（与 Worker 保持一致）
const WORKER_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
}

/**
 * 获取终端有效宽度（字符数）
 * 优先使用终端实例的 cols，否则根据屏幕宽度估算
 */
function getTerminalWidth(): number {
  // 尝试从全局终端实例获取实际列数
  if (typeof window !== 'undefined' && window.__terminalInstance) {
    const cols = window.__terminalInstance.cols
    if (cols && cols > 0) {
      return cols
    }
  }

  // 回退：根据屏幕宽度估算
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    const fontSize = screenWidth < 480 ? 10 : screenWidth < 768 ? 12 : screenWidth < 1200 ? 14 : 16
    
    if (isMobile) {
      // 移动端：使用更精确的计算
      // 移动端通常使用 10-12px 字体，字符宽度约 6px
      // 终端容器通常有 16-20px 的左右 padding
      const charWidth = 6.5 // 移动端等宽字体字符宽度
      const padding = 16 // 终端容器左右内边距
      const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
      return Math.max(25, Math.min(50, estimatedCols)) // 移动端限制在 25-50 列
    }
    
    // 桌面端：根据屏幕宽度估算
    const charWidth = fontSize * 0.6
    const padding = 20
    const estimatedCols = Math.floor((screenWidth - padding) / charWidth)
    return Math.max(40, Math.min(120, estimatedCols))
  }

  // 默认桌面端宽度
  return 80
}

/**
 * 计算字符串在终端中的实际显示宽度（考虑 CJK 字符占 2 列）
 */
function getDisplayWidth(str: string): number {
  let width = 0
  for (const char of str) {
    const code = char.codePointAt(0) || 0
    // CJK 字符（中日韩统一表意文字）通常占 2 列
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0x20000 && code <= 0x2A6DF) ||
      (code >= 0x2A700 && code <= 0x2B73F) ||
      (code >= 0x2B740 && code <= 0x2B81F) ||
      (code >= 0x2B820 && code <= 0x2CEAF) ||
      (code >= 0x2F00 && code <= 0x2FDF) ||
      (code >= 0x3000 && code <= 0x303F) ||
      (code >= 0xFF00 && code <= 0xFFEF)
    ) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

/**
 * 去除 ANSI 转义序列后计算字符串显示宽度
 */
function getVisibleWidth(str: string): number {
  const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '')
  return getDisplayWidth(cleanStr)
}

/**
 * 用空格填充字符串到指定显示宽度（考虑 CJK 字符宽度差异）
 */
function padToWidth(str: string, targetWidth: number): string {
  const currentWidth = getVisibleWidth(str)
  const paddingNeeded = Math.max(0, targetWidth - currentWidth)
  return str + ' '.repeat(paddingNeeded)
}

/**
 * 响应式边框生成器
 * 根据终端实际宽度动态生成边框字符
 */
class BorderGenerator {
  private width: number

  constructor(width: number) {
    this.width = width
  }

  // 顶部外边框: ╔═══════════════════╗
  get topBorder(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `╔${'═'.repeat(innerWidth)}╗`
  }

  // 底部外边框: ╚═══════════════════╝
  get bottomBorder(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `╚${'═'.repeat(innerWidth)}╝`
  }

  // 外边框垂直线（两侧）
  verticalLine(content: string): string {
    return `║ ${padToWidth(content, this.width - 4)} ║`
  }

  // 内框顶部: ┌───────────────────┐
  get boxTop(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `┌${'─'.repeat(innerWidth)}┐`
  }

  // 内框底部: └───────────────────┘
  get boxBottom(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `└${'─'.repeat(innerWidth)}┘`
  }

  // 内框分隔线: ├───────────────────┤
  get boxSeparator(): string {
    const innerWidth = Math.max(1, this.width - 2)
    return `├${'─'.repeat(innerWidth)}┤`
  }

  // 内框内容行: │ 内容              │
  boxContent(content: string): string {
    return `│${padToWidth(content, this.width - 2)}│`
  }
}

class SCPScraper {
  private cache: Map<string, { data: SCPWikiData, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = config.cache.duration
  private readonly API_TIMEOUT = WORKER_CONFIG.timeout // 使用 Worker 配置

  /**
   * 爬取指定SCP的详细信息
   * @param scpNumber SCP编号（如 "173"）
   * @param branch 分部（如 "cn" 表示中文分部，默认 "en"）
   * @returns 爬取结果
   */
  async scrapeSCP(scpNumber: string, branch: string = 'en'): Promise<ScraperResult> {
    const cacheKey = `scp-${branch}-${scpNumber}`

    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return { success: true, data: cached, cached: true }
    }

    // 重试机制
    for (let attempt = 1; attempt <= WORKER_CONFIG.retryAttempts; attempt++) {
      try {
        const apiUrl = `${config.api.workerUrl}/scrape`
        console.log(`[Scraper] [尝试 ${attempt}/${WORKER_CONFIG.retryAttempts}] 正在请求 API: ${apiUrl}?number=${scpNumber}&branch=${branch}`)

        // 调用Cloudflare Worker API
        const response = await axios.get(apiUrl, {
          params: { number: scpNumber, branch },
          timeout: this.API_TIMEOUT,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })

        console.log(`[Scraper] API 响应状态: ${response.status}`)
        console.log(`[Scraper] API 响应数据:`, response.data)

        if (response.data.success && response.data.data) {
          const data = this.normalizeData(response.data.data)

          // 保存到缓存
          this.saveToCache(cacheKey, data)

          return { success: true, data }
        } else {
          return {
            success: false,
            error: response.data.error || '爬取失败'
          }
        }
      } catch (error) {
        // 详细的错误处理
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // 服务器响应了错误状态码 - 不重试
            console.error(`[Scraper] API 错误响应:`, {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            })

            // 4xx 错误不重试
            if (error.response.status >= 400 && error.response.status < 500) {
              return {
                success: false,
                error: `API 错误 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`
              }
            }
            // 5xx 错误可以重试
          } else if (error.request) {
            // 请求已发出但没有收到响应 - 可以重试
            console.error(`[Scraper] 无响应:`, {
              message: error.message,
              code: error.code,
              attempt,
            })

            // 如果是最后一次尝试，返回错误
            if (attempt === WORKER_CONFIG.retryAttempts) {
              const errorCode = error.code || 'NETWORK_ERROR'
              return {
                success: false,
                error: `网络错误: 无法连接到服务器 (${errorCode})`
              }
            }

            // 等待后重试
            await this.sleep(WORKER_CONFIG.retryDelay * attempt)
          } else {
            // 请求配置错误 - 不重试
            console.error(`[Scraper] 请求配置错误:`, error.message)
            return {
              success: false,
              error: `请求配置错误: ${error.message}`
            }
          }
        } else {
          // 其他错误 - 不重试
          console.error(`[Scraper] 未知错误:`, error)
          return {
            success: false,
            error: `未知错误: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      }
    }

    // 所有重试都失败了
    return {
      success: false,
      error: `网络错误: 无法连接到服务器 (已重试 ${WORKER_CONFIG.retryAttempts} 次)`
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 搜索SCP
   * @param keyword 搜索关键词
   * @returns 搜索结果
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      const apiUrl = `${config.api.workerUrl}/search`
      console.log(`[Scraper] 正在搜索: ${apiUrl}?keyword=${keyword}`)

      // 调用Cloudflare Worker API
      const response = await axios.get(apiUrl, {
        params: { keyword },
        timeout: this.API_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log(`[Scraper] 搜索响应状态: ${response.status}`)
      console.log(`[Scraper] 搜索响应数据:`, response.data)

      if (response.data.success && response.data.data) {
        // 如果返回的是数组（数据库搜索结果）
        if (Array.isArray(response.data.data)) {
          if (response.data.data.length === 0) {
            return {
              success: false,
              error: `未找到包含 "${keyword}" 的SCP对象`
            }
          }

          // 返回第一个匹配结果的详细信息
          const firstResult = response.data.data[0]
          const data = this.normalizeData({
            id: `SCP-${firstResult.scp_id}`,
            number: firstResult.scp_id.toString(),
            name: firstResult.name,
            objectClass: firstResult.object_class,
            tags: firstResult.tags,
            clearanceLevel: firstResult.clearance_level,
          })
          return { success: true, data }
        }
        // 如果返回的是单个对象（爬虫结果）
        else if (typeof response.data.data === 'object') {
          const data = this.normalizeData(response.data.data)
          return { success: true, data }
        }
      }

      return {
        success: false,
        error: `未找到包含 "${keyword}" 的SCP对象`
      }
    } catch (error) {
      // 详细的错误处理
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 服务器响应了错误状态码
          console.error(`[Scraper] 搜索错误响应:`, {
            status: error.response.status,
            data: error.response.data,
          })
          return {
            success: false,
            error: `搜索错误 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`
          }
        } else if (error.request) {
          // 请求已发出但没有收到响应
          console.error(`[Scraper] 搜索无响应:`, {
            message: error.message,
            code: error.code,
          })
          return {
            success: false,
            error: `网络错误: 无法连接到服务器 (${error.code || 'NETWORK_ERROR'})`
          }
        } else {
          // 请求配置错误
          console.error(`[Scraper] 搜索配置错误:`, error.message)
          return {
            success: false,
            error: `请求配置错误: ${error.message}`
          }
        }
      } else {
        // 其他错误
        console.error(`[Scraper] 搜索未知错误:`, error)
        return {
          success: false,
          error: `未知错误: ${error instanceof Error ? error.message : String(error)}`
        }
      }
    }
  }

  /**
   * 标准化API返回的数据格式
   */
  private normalizeData(data: any): SCPWikiData {
    return {
      id: data.id || `SCP-${data.number}`,
      name: data.name || '未知',
      objectClass: data.objectClass || 'UNKNOWN',
      containment: Array.isArray(data.containment) ? data.containment : [],
      description: Array.isArray(data.description) ? data.description : [],
      appendix: Array.isArray(data.appendix) ? data.appendix : [],
      references: Array.isArray(data.references) ? data.references : [],
      author: data.author || '未知作者',
      url: data.url || ''
    }
  }

  /**
   * 格式化SCP数据为终端输出（响应式设计）
   * 根据终端实际宽度动态调整边框和文本布局
   */
  formatForTerminal(data: SCPWikiData): string[] {
    const lines: string[] = []
    const classInfo = OBJECT_CLASSES[data.objectClass] || OBJECT_CLASSES.UNKNOWN
    const terminalWidth = getTerminalWidth()
    const isMobile = terminalWidth <= 50

    if (isMobile) {
      // 移动端：简化格式，去除复杂边框
      return this.formatForMobile(data, classInfo, terminalWidth)
    }

    // 桌面端：完整格式带边框
    const border = new BorderGenerator(terminalWidth)

    // ===== 顶部外边框 =====
    lines.push(border.topBorder)

    // ===== 标题行 =====
    const title = `${data.id} - ${data.name} — ${classInfo.displayName}`
    lines.push(border.verticalLine(title))
    lines.push(border.bottomBorder)
    lines.push('')

    // ===== 项目等级 =====
    lines.push(border.boxTop)
    lines.push(border.boxContent(' 项目等级'))
    lines.push(border.boxSeparator)
    lines.push(border.boxContent(` 等级: [${data.objectClass}] ${classInfo.displayName}`))
    lines.push(border.boxContent(` 说明: ${classInfo.description}`))
    lines.push(border.boxBottom)
    lines.push('')

    // ===== 作者（如果有） =====
    if (data.author && data.author !== '未知作者') {
      lines.push(`作者: ${data.author}`)
      lines.push('')
    }

    // ===== 收容协议 =====
    if (data.containment.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 收容协议'))
      lines.push(border.boxSeparator)

      data.containment.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach(line => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    // ===== 描述 =====
    if (data.description.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 描述'))
      lines.push(border.boxSeparator)

      data.description.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach(line => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    // ===== 附录 =====
    if (data.appendix.length > 0) {
      lines.push(border.boxTop)
      lines.push(border.boxContent(' 附录'))
      lines.push(border.boxSeparator)

      data.appendix.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 4)
        wrapped.forEach(line => {
          lines.push(border.boxContent(` ${line}`))
        })
      })

      lines.push(border.boxBottom)
      lines.push('')
    }

    return lines
  }

  /**
   * 移动端专用格式化方法
   * 使用简化的边框和布局，避免复杂的字符计算
   */
  private formatForMobile(data: SCPWikiData, classInfo: any, terminalWidth: number): string[] {
    const lines: string[] = []
    const padding = ' '.repeat(2)

    // ===== 简化的标题 =====
    lines.push('═'.repeat(terminalWidth))
    lines.push(`${padding}${data.id} - ${data.name}`)
    lines.push(`${padding}项目等级: ${data.objectClass} (${classInfo.displayName})`)
    lines.push('═'.repeat(terminalWidth))
    lines.push('')

    // ===== 收容协议 =====
    if (data.containment.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}收容协议`)
      lines.push('─'.repeat(terminalWidth))

      data.containment.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach(line => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    // ===== 描述 =====
    if (data.description.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}描述`)
      lines.push('─'.repeat(terminalWidth))

      data.description.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach(line => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    // ===== 附录 =====
    if (data.appendix.length > 0) {
      lines.push('─'.repeat(terminalWidth))
      lines.push(`${padding}附录`)
      lines.push('─'.repeat(terminalWidth))

      data.appendix.forEach(text => {
        const wrapped = this.wrapText(text, terminalWidth - 2)
        wrapped.forEach(line => {
          lines.push(`${padding}${line}`)
        })
      })
      lines.push('')
    }

    return lines
  }

  /**
   * 文本自动换行（考虑 CJK 字符宽度）
   * @param text 要换行的文本
   * @param maxWidth 最大显示宽度
   * @returns 换行后的文本数组
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

      // 如果当前行加上这个字符会超出最大宽度，换行
      if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
        currentWidth = charWidth
      } else {
        currentLine += char
        currentWidth += charWidth
      }
    }

    // 添加最后一行
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.length > 0 ? lines : ['']
  }

  /**
   * 获取项目等级信息
   */
  getClassInfo(objectClass: string): ObjectClassInfo {
    return OBJECT_CLASSES[objectClass] || OBJECT_CLASSES.UNKNOWN
  }

  /**
   * 缓存管理
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
      timestamp: Date.now()
    })
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 测试 API 连接
   * 用于诊断网络问题
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('[Scraper] 测试 API 连接...')
      const response = await axios.get(`${config.api.workerUrl}/`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('[Scraper] API 连接测试成功:', response.data)

      return {
        success: true,
        message: 'API 连接正常',
        details: response.data
      }
    } catch (error) {
      console.error('[Scraper] API 连接测试失败:', error)

      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: `API 返回错误状态: ${error.response.status}`,
            details: {
              status: error.response.status,
              data: error.response.data,
            }
          }
        } else if (error.request) {
          return {
            success: false,
            message: `无法连接到服务器: ${error.code || 'NETWORK_ERROR'}`,
            details: {
              code: error.code,
              message: error.message,
              url: config.api.workerUrl,
            }
          }
        } else {
          return {
            success: false,
            message: `请求配置错误: ${error.message}`,
            details: {
              message: error.message,
            }
          }
        }
      }

      return {
        success: false,
        message: `未知错误: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 获取 SCP 列表
   * @param limit 每页数量
   * @param offset 偏移量
   * @param clearanceLevel 权限等级筛选（可选）
   * @returns SCP 列表
   */
  async listSCPs(limit: number = 100, offset: number = 0, clearanceLevel?: number): Promise<{
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
      const params: any = { limit, offset }

      if (clearanceLevel !== undefined) {
        params.clearance_level = clearanceLevel
      }

      console.log(`[Scraper] 正在获取 SCP 列表: ${apiUrl}`, params)

      const response = await axios.get(apiUrl, {
        params,
        timeout: this.API_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log(`[Scraper] 列表响应状态: ${response.status}`)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.total,
        }
      } else {
        return {
          success: false,
          error: response.data.error || '获取列表失败'
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            error: `API 错误 (${error.response.status}): ${error.response.data?.error || error.response.statusText}`
          }
        } else if (error.request) {
          return {
            success: false,
            error: `网络错误: 无法连接到服务器 (${error.code || 'NETWORK_ERROR'})`
          }
        } else {
          return {
            success: false,
            error: `请求配置错误: ${error.message}`
          }
        }
      } else {
        return {
          success: false,
          error: `未知错误: ${error instanceof Error ? error.message : String(error)}`
        }
      }
    }
  }
}

// 导出单例
export const scraper = new SCPScraper()

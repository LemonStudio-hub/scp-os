import axios from 'axios'
import { OBJECT_CLASSES } from '../constants/scraperConfig'
import type { SCPWikiData, ScraperResult, ObjectClassInfo } from '../types/scraper'
import { config } from '../config'
import { isMobileDevice } from './terminal'

// Worker 统一配置（与 Worker 保持一致）
const WORKER_CONFIG = {
  timeout: 30000, // 与 Worker 一致
  retryAttempts: 3, // 与 Worker 一致
  retryDelay: 2000, // 与 Worker 一致
}

// PC端边框样式（全宽度）
const BORDERS_DESKTOP = {
  maxWidth: 76,
  horizontal: '═══════════════════════════════════════════════════════════════',
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  verticalLeft: '║',
  verticalRight: '║',
  boxTopLeft: '┌',
  boxTopRight: '┐',
  boxBottomLeft: '└',
  boxBottomRight: '┘',
  boxHorizontal: '─────────────────────────────────────────────────────────────',
  boxVertical: '│',
  separator: '│',
  middle: '├',
}

// 移动端边框样式（紧凑）
const BORDERS_MOBILE = {
  maxWidth: 40,
  horizontal: '═════════════════════════════════',
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  verticalLeft: '║',
  verticalRight: '║',
  boxTopLeft: '┌',
  boxTopRight: '┐',
  boxBottomLeft: '└',
  boxBottomRight: '┘',
  boxHorizontal: '─────────────────────────────────',
  boxVertical: '│',
  separator: '│',
  middle: '├',
}

class SCPScraper {
  private cache: Map<string, { data: SCPWikiData, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = config.cache.duration
  private readonly API_TIMEOUT = WORKER_CONFIG.timeout // 使用 Worker 配置

  /**
   * 爬取指定SCP的详细信息
   * @param scpNumber SCP编号（如 "173"）
   * @returns 爬取结果
   */
    async scrapeSCP(scpNumber: string): Promise<ScraperResult> {
        const cacheKey = `scp-${scpNumber}`
    
        // 检查缓存
        const cached = this.getFromCache(cacheKey)
        if (cached) {
          return { success: true, data: cached, cached: true }
        }
    
        // 重试机制
        for (let attempt = 1; attempt <= WORKER_CONFIG.retryAttempts; attempt++) {        try {
          const apiUrl = `${config.api.workerUrl}/scrape`
          console.log(`[Scraper] [尝试 ${attempt}/${WORKER_CONFIG.retryAttempts}] 正在请求 API: ${apiUrl}?number=${scpNumber}`)
  
          // 调用Cloudflare Worker API
          const response = await axios.get(apiUrl, {
            params: { number: scpNumber },
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
                      } else {              // 请求配置错误 - 不重试
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
   * 格式化SCP数据为终端输出
   */
  formatForTerminal(data: SCPWikiData): string[] {
    const lines: string[] = []
    const classInfo = OBJECT_CLASSES[data.objectClass] || OBJECT_CLASSES.UNKNOWN
    
    // 根据设备类型选择边框样式
    const borders = isMobileDevice() ? BORDERS_MOBILE : BORDERS_DESKTOP
    const maxWidth = borders.maxWidth

    // 顶部边框
    lines.push(`${borders.topLeft}${borders.horizontal}${borders.topRight}`)
    
    // 标题行 - 根据设备类型调整
    if (isMobileDevice()) {
      // 移动端：紧凑格式
      const title = `${data.id} - ${data.name}`
      lines.push(`${borders.verticalLeft} ${title.padEnd(maxWidth - 2)} ${borders.verticalRight}`)
    } else {
      // PC端：完整格式
      lines.push(`${borders.verticalLeft}  ${data.id} - ${data.name} - ${classInfo.displayName.padEnd(20)} ${borders.verticalRight}`)
    }
    
    lines.push(`${borders.bottomLeft}${borders.horizontal}${borders.bottomRight}`)
    lines.push('')

    // 项目等级
    lines.push(`${borders.boxTopLeft}${borders.boxHorizontal}${borders.boxTopRight}`)
    lines.push(`${borders.separator} 项目等级${' '.repeat(maxWidth - 6)}${borders.separator}`)
    lines.push(`${borders.middle}${borders.boxHorizontal}${borders.middle}`)
    
    if (isMobileDevice()) {
      // 移动端：简化显示
      lines.push(`${borders.separator} [${data.objectClass}]${borders.separator}`)
      const descLines = this.wrapText(classInfo.displayName, maxWidth - 4)
      descLines.forEach(line => {
        lines.push(`${borders.separator} ${line.padEnd(maxWidth - 3)}${borders.separator}`)
      })
    } else {
      // PC端：详细显示
      lines.push(`${borders.separator}  等级: [${data.objectClass.padEnd(10)}] ${classInfo.displayName.padEnd(8)} ${borders.separator}`)
      lines.push(`${borders.separator}  说明: ${this.wrapText(classInfo.description, maxWidth - 9).join('\n' + borders.separator + '        ')} ${borders.separator}`)
    }
    
    lines.push(`${borders.boxBottomLeft}${borders.boxHorizontal}${borders.boxBottomRight}`)
    lines.push('')

    // 作者
    if (data.author && data.author !== '未知作者') {
      lines.push(`作者: ${data.author}`)
      lines.push('')
    }

    // 收容协议
    if (data.containment.length > 0) {
      lines.push(`${borders.boxTopLeft}${borders.boxHorizontal}${borders.boxTopRight}`)
      lines.push(`${borders.separator} 收容协议${' '.repeat(maxWidth - 6)}${borders.separator}`)
      lines.push(`${borders.middle}${borders.boxHorizontal}${borders.middle}`)
      
      const containmentLines: string[] = []
      data.containment.forEach(text => {
        const wrapped = this.wrapText(text, maxWidth - 4)
        containmentLines.push(...wrapped)
      })
      
      containmentLines.forEach(line => {
        lines.push(`${borders.separator} ${line.padEnd(maxWidth - 3)}${borders.separator}`)
      })
      
      lines.push(`${borders.boxBottomLeft}${borders.boxHorizontal}${borders.boxBottomRight}`)
      lines.push('')
    }

    // 描述
    if (data.description.length > 0) {
      lines.push(`${borders.boxTopLeft}${borders.boxHorizontal}${borders.boxTopRight}`)
      lines.push(`${borders.separator} 描述${' '.repeat(maxWidth - 4)}${borders.separator}`)
      lines.push(`${borders.middle}${borders.boxHorizontal}${borders.middle}`)
      
      const descriptionLines: string[] = []
      data.description.forEach(text => {
        const wrapped = this.wrapText(text, maxWidth - 4)
        descriptionLines.push(...wrapped)
      })
      
      descriptionLines.forEach(line => {
        lines.push(`${borders.separator} ${line.padEnd(maxWidth - 3)}${borders.separator}`)
      })
      
      lines.push(`${borders.boxBottomLeft}${borders.boxHorizontal}${borders.boxBottomRight}`)
      lines.push('')
    }

    // 附录
    if (data.appendix.length > 0) {
      lines.push(`${borders.boxTopLeft}${borders.boxHorizontal}${borders.boxTopRight}`)
      lines.push(`${borders.separator} 附录${' '.repeat(maxWidth - 4)}${borders.separator}`)
      lines.push(`${borders.middle}${borders.boxHorizontal}${borders.middle}`)
      
      const appendixLines: string[] = []
      data.appendix.forEach(text => {
        const wrapped = this.wrapText(text, maxWidth - 4)
        appendixLines.push(...wrapped)
      })
      
      appendixLines.forEach(line => {
        lines.push(`${borders.separator} ${line.padEnd(maxWidth - 3)}${borders.separator}`)
      })
      
      lines.push(`${borders.boxBottomLeft}${borders.boxHorizontal}${borders.boxBottomRight}`)
      lines.push('')
    }
    
    lines.push(borders.horizontal)
    lines.push('')
    
    return lines
  }

  /**
   * 文本自动换行
   * @param text 要换行的文本
   * @param maxWidth 最大宽度
   * @returns 换行后的文本数组
   */
  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return ['']
    
    const lines: string[] = []
    const words = text.split('')
    let currentLine = ''
    
    for (const char of words) {
      if (char === '\n') {
        lines.push(currentLine)
        currentLine = ''
        continue
      }
      
      if (currentLine.length + 1 <= maxWidth) {
        currentLine += char
      } else {
        lines.push(currentLine)
        currentLine = char
      }
    }
    
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
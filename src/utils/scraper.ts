import axios from 'axios'
import { OBJECT_CLASSES } from '../constants/scraperConfig'
import type { SCPWikiData, ScraperResult, ObjectClassInfo } from '../types/scraper'

// Cloudflare Worker API 配置
const WORKER_API_URL = 'https://api.woodcat.online'

class SCPScraper {
  private cache: Map<string, { data: SCPWikiData, timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

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

    try {
      // 调用Cloudflare Worker API
      const response = await axios.get(`${WORKER_API_URL}/scrape`, {
        params: { number: scpNumber },
        timeout: 15000,
      })
      
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { 
        success: false, 
        error: `API请求失败: ${errorMessage}` 
      }
    }
  }

  /**
   * 搜索SCP
   * @param keyword 搜索关键词
   * @returns 搜索结果
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      // 调用Cloudflare Worker API
      const response = await axios.get(`${WORKER_API_URL}/search`, {
        params: { keyword },
        timeout: 15000,
      })
      
      if (response.data.success && response.data.data) {
        // 如果返回的是数组，返回第一个结果
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          const firstResult = response.data.data[0]
          const data = this.normalizeData(firstResult)
          return { success: true, data }
        } 
        // 如果返回的是单个对象
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { 
        success: false, 
        error: `搜索失败: ${errorMessage}` 
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
    
    // 顶部边框
    lines.push(`═══════════════════════════════════════════════════════════════`)
    lines.push(`          ${data.id} - ${data.name} - ${classInfo.displayName}`)
    lines.push(`═══════════════════════════════════════════════════════════════`)
    lines.push('')
    
    // 项目等级
    lines.push(`项目等级: [${data.objectClass}] ${classInfo.displayName}`)
    lines.push(`           ${classInfo.description}`)
    lines.push('')
    
    // 作者
    if (data.author && data.author !== '未知作者') {
      lines.push(`作者: ${data.author}`)
      lines.push('')
    }
    
    // 收容协议
    if (data.containment.length > 0) {
      lines.push('收容协议:')
      data.containment.forEach(line => lines.push(`  ${line}`))
      lines.push('')
    }
    
    // 描述
    if (data.description.length > 0) {
      lines.push('描述:')
      data.description.forEach(line => lines.push(`  ${line}`))
      lines.push('')
    }
    
    // 附录
    if (data.appendix.length > 0) {
      lines.push('附录:')
      data.appendix.forEach(line => lines.push(`  ${line}`))
      lines.push('')
    }
    
    // 来源
    if (data.url) {
      lines.push(`数据来源: ${data.url}`)
      lines.push('')
    }
    lines.push(`═══════════════════════════════════════════════════════════════`)
    
    return lines
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
}

// 导出单例
export const scraper = new SCPScraper()
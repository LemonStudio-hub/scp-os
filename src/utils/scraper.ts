import axios from 'axios'
import * as cheerio from 'cheerio'
import { SCRAPER_CONFIG, OBJECT_CLASSES, CSS_SELECTORS, REQUEST_HEADERS } from '../constants/scraperConfig'
import type { SCPWikiData, ScraperResult, ObjectClassInfo } from '../types/scraper'

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
      // 构建URL
      const url = `${SCRAPER_CONFIG.baseUrl}/scp-${scpNumber}`
      
      // 带重试机制的请求
      const html = await this.fetchWithRetry(url)
      
      // 解析HTML
      const data = this.parseHTML(html, scpNumber, url)
      
      // 保存到缓存
      this.saveToCache(cacheKey, data)
      
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { 
        success: false, 
        error: `爬取失败: ${errorMessage}` 
      }
    }
  }

  /**
   * 搜索SCP（简化版，返回搜索结果列表）
   * @param keyword 搜索关键词
   * @returns 搜索结果
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      // 使用维基的搜索功能
      const url = `${SCRAPER_CONFIG.baseUrl}/search:site/q/${encodeURIComponent(keyword)}`
      
      const html = await this.fetchWithRetry(url)
      const $ = cheerio.load(html)
      
      // 提取搜索结果
      const results: string[] = []
      $('.search-result-item a').each((_, element) => {
        const link = $(element).attr('href')
        if (link) {
          const match = link.match(/scp-(\d+)/)
          if (match) {
            results.push(`SCP-${match[1]}`)
          }
        }
      })
      
      if (results.length === 0) {
        return { success: false, error: `未找到包含 "${keyword}" 的SCP对象` }
      }
      
      // 返回第一个结果的数据
      const firstResult = results[0]
      const number = firstResult.replace('SCP-', '')
      return this.scrapeSCP(number)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { 
        success: false, 
        error: `搜索失败: ${errorMessage}` 
      }
    }
  }

  /**
   * 带重试机制的HTTP请求
   */
  private async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= SCRAPER_CONFIG.retryAttempts; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: REQUEST_HEADERS,
          timeout: SCRAPER_CONFIG.timeout,
        })
        
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response.data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < SCRAPER_CONFIG.retryAttempts) {
          // 等待后重试
          await this.delay(SCRAPER_CONFIG.retryDelay * attempt)
        }
      }
    }
    
    throw lastError || new Error('未知错误')
  }

  /**
   * 解析HTML并提取SCP信息
   */
  private parseHTML(html: string, scpNumber: string, url: string): SCPWikiData {
    const $ = cheerio.load(html)
    
    // 提取标题
    const title = this.extractTitle($, scpNumber)
    
    // 提取项目等级
    const objectClass = this.extractObjectClass($)
    
    // 提取内容
    const content = this.extractContent($)
    
    // 提取作者信息
    const author = this.extractAuthor($)
    
    return {
      id: `SCP-${scpNumber}`,
      name: title,
      objectClass,
      containment: content.containment,
      description: content.description,
      appendix: content.appendix,
      references: content.references,
      author,
      url
    }
  }

  /**
   * 提取标题
   */
  private extractTitle($: cheerio.CheerioAPI, scpNumber: string): string {
    const title = $(CSS_SELECTORS.title).text().trim()
    // 移除 "SCP-" 前缀
    let cleanedTitle = title.replace(/^SCP-\d+\s*-\s*/, '')
    
    // 如果标题为空，使用SCP编号作为标题
    if (!cleanedTitle) {
      cleanedTitle = `SCP-${scpNumber}`
    }
    
    return cleanedTitle
  }

  /**
   * 提取项目等级
   */
  private extractObjectClass($: cheerio.CheerioAPI): string {
    // 尝试从信息框中提取
    const infoBox = $(CSS_SELECTORS.infoBox).first()
    const classRow = infoBox.find('tr').filter((_, element) => {
      return $(element).find('td').first().text().includes('项目等级') || 
             $(element).find('td').first().text().includes('Object Class')
    })
    
    const classText = classRow.find('td').last().text().trim().toUpperCase()
    
    // 匹配已知的项目等级
    const knownClasses = Object.keys(OBJECT_CLASSES)
    for (const className of knownClasses) {
      if (classText.includes(className)) {
        return className
      }
    }
    
    return 'UNKNOWN'
  }

  /**
   * 提取内容
   */
  private extractContent($: cheerio.CheerioAPI): {
    containment: string[]
    description: string[]
    appendix: string[]
    references: string[]
  } {
    const containment: string[] = []
    let description: string[] = []
    const appendix: string[] = []
    const references: string[] = []
    
    let currentSection: 'description' | 'containment' | 'appendix' | 'other' = 'description'
    
    $(CSS_SELECTORS.content).find('p, h1, h2, h3, h4, h5, h6, ul, ol').each((_, element) => {
      const $el = $(element)
      const tagName = element.tagName
      const text = $el.text().trim()
      
      if (!text) return
      
      // 检测章节标题
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
        if (text.includes('收容') || text.includes('Containment')) {
          currentSection = 'containment'
        } else if (text.includes('附录') || text.includes('Addendum')) {
          currentSection = 'appendix'
        } else if (text.includes('参考') || text.includes('Reference')) {
          currentSection = 'other'
        }
        return
      }
      
      // 根据当前章节添加内容
      if (tagName === 'UL' || tagName === 'OL') {
        const items: string[] = []
        $el.find('li').each((_, li) => {
          const itemText = $(li).text().trim()
          if (itemText) items.push(`• ${itemText}`)
        })
        
        if (currentSection === 'containment' && items.length > 0) {
          containment.push(...items)
        } else if (currentSection === 'appendix' && items.length > 0) {
          appendix.push(...items)
        } else if (currentSection === 'description' && items.length > 0) {
          description.push(...items)
        }
      } else if (tagName === 'P') {
        const paragraph = text
        
        // 清理空白和特殊字符
        const cleaned = paragraph
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, ' ')
          .trim()
        
        if (!cleaned) return
        
        if (currentSection === 'containment') {
          containment.push(cleaned)
        } else if (currentSection === 'appendix') {
          appendix.push(cleaned)
        } else if (currentSection === 'description') {
          description.push(cleaned)
        }
      }
    })
    
    // 如果没有单独的收容协议章节，尝试从开头提取
    if (containment.length === 0 && description.length > 0) {
      // 假设前几段是收容协议
      const firstParagraphs = description.slice(0, 3)
      containment.push(...firstParagraphs)
      description = description.slice(3)
    }
    
    return {
      containment,
      description,
      appendix,
      references
    }
  }

  /**
   * 提取作者信息
   */
  private extractAuthor($: cheerio.CheerioAPI): string {
    // 尝试从多个位置提取作者信息
    const authorSelectors = [
      '.author-info',
      '.creditModule',
      '.author'
    ]
    
    for (const selector of authorSelectors) {
      const authorElement = $(selector).first()
      if (authorElement.length > 0) {
        return authorElement.text().trim()
      }
    }
    
    return '未知作者'
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
    lines.push(`数据来源: ${data.url}`)
    lines.push('')
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

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const scraper = new SCPScraper()
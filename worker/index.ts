import * as cheerio from 'cheerio'

// 配置常量
const CONFIG = {
  baseUrl: 'https://scp-wiki-cn.wikidot.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  timeout: 30000, // 30秒超时
  retryAttempts: 3,
  retryDelay: 2000, // 2秒重试延迟
  cacheDuration: 30 * 60 * 1000, // 30分钟缓存
}

const OBJECT_CLASSES = {
  SAFE: {
    class: 'SAFE',
    color: '#00ff00',
    displayName: '安全级',
    description: '标准收容程序足够，无需特殊资源'
  },
  EUCLID: {
    class: 'EUCLID',
    color: '#ffa500',
    displayName: '欧几里得级',
    description: '需要持续监控，收容措施复杂'
  },
  KETER: {
    class: 'KETER',
    color: '#ff0000',
    displayName: '刻耳柏洛斯级',
    description: '极难收容，高度危险，需要大量资源'
  },
  THAUMIEL: {
    class: 'THAUMIEL',
    color: '#ff00ff',
    displayName: '塔耳塔洛斯级',
    description: '用于收容其他 SCP，基金会秘密武器'
  },
  NEUTRALIZED: {
    class: 'NEUTRALIZED',
    color: '#888888',
    displayName: '无效化',
    description: '已不再具有异常性质'
  },
  PENDING: {
    class: 'PENDING',
    color: '#ffff00',
    displayName: '待定级',
    description: '分级尚未确定'
  },
  UNKNOWN: {
    class: 'UNKNOWN',
    color: '#ffffff',
    displayName: '未知',
    description: '分级未知'
  }
}

// 类型定义
interface SCPWikiData {
  id: string
  name: string
  objectClass: string
  containment: string[]
  description: string[]
  appendix: string[]
  references: string[]
  author: string
  url: string
}

interface ScraperResult {
  success: boolean
  data?: SCPWikiData
  error?: string
  cached?: boolean
}

interface Env {
  SCP_CACHE: KVNamespace
}

class SCPScraper {
  constructor(private kv?: KVNamespace) {}

  /**
   * 爬取指定SCP的详细信息
   */
  async scrapeSCP(scpNumber: string): Promise<ScraperResult> {
    const cacheKey = `scp-${scpNumber}`
    
    // 检查缓存
    if (this.kv) {
      try {
        const cached = await this.kv.get(cacheKey, 'text')
        if (cached) {
          const data = JSON.parse(cached) as SCPWikiData
          return { success: true, data, cached: true }
        }
      } catch (error) {
        console.error('Cache error:', error)
      }
    }

    try {
      const url = `${CONFIG.baseUrl}/scp-${scpNumber}`
      const html = await this.fetchWithRetry(url)
      const data = this.parseHTML(html, scpNumber, url)
      
      // 保存到缓存
      if (this.kv) {
        try {
          await this.kv.put(cacheKey, JSON.stringify(data), {
            expirationTtl: Math.floor(CONFIG.cacheDuration / 1000)
          })
        } catch (error) {
          console.error('Cache save error:', error)
        }
      }
      
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `爬取失败: ${errorMessage}` }
    }
  }

  /**
   * 搜索SCP
   */
  async searchSCP(keyword: string): Promise<ScraperResult> {
    try {
      const url = `${CONFIG.baseUrl}/search:site/q/${encodeURIComponent(keyword)}`
      const html = await this.fetchWithRetry(url)
      const $ = cheerio.load(html)
      
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
      
      const firstResult = results[0]
      const number = firstResult.replace('SCP-', '')
      return this.scrapeSCP(number)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `搜索失败: ${errorMessage}` }
    }
  }

  /**
   * 获取原始HTML（用于调试）
   */
  async getRawHTML(scpNumber: string): Promise<{success: boolean, html?: string, error?: string}> {
    try {
      const url = `${CONFIG.baseUrl}/scp-${scpNumber}`
      const html = await this.fetchWithRetry(url)
      return { success: true, html: html } // 返回完整HTML
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 带重试机制的HTTP请求
   */
  private async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout)
        
        // 伪造真实的浏览器请求
        const response = await fetch(url, {
          headers: {
            'User-Agent': CONFIG.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Sec-GPC': '1',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Referer': 'https://scp-wiki-cn.wikidot.com/',
          },
          signal: controller.signal,
          redirect: 'follow',
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const html = await response.text()
        console.log(`Fetched HTML length: ${html.length} (attempt ${attempt})`)
        
        // 检查是否被重定向到错误页面或反爬页面
        if (html.length < 1000) {
          console.warn(`HTML too short (${html.length} chars), might be blocked`)
        }
        
        if (!html.includes('page-content') && !html.includes('SCP-')) {
          console.warn('HTML does not contain expected content, might be blocked')
        }
        
        return html
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`Fetch attempt ${attempt} failed:`, lastError.message)
        
        if (attempt < CONFIG.retryAttempts) {
          await this.delay(CONFIG.retryDelay * attempt)
        }
      }
    }
    
    throw lastError || new Error('未知错误')
  }

  /**
   * 解析HTML并提取SCP信息
   */
  private parseHTML(html: string, scpNumber: string, url: string): SCPWikiData {
    console.log(`Starting to parse HTML for SCP-${scpNumber}`)
    console.log(`HTML length: ${html.length}`)
    
    const $ = cheerio.load(html)
    
    // 尝试多个可能的内容容器
    let contentText = ''
    
    // 方法1: 尝试 Wikidot 的标准结构
    const $pageContent = $('#page-content, #main-content, .page-content, main')
    if ($pageContent.length > 0) {
      contentText = $pageContent.html() || ''
      console.log(`Found content using selector: ${$pageContent.length} elements`)
    } else {
      // 方法2: 使用整个 body 的 HTML
      contentText = $('body').html() || html
      console.log(`Using body HTML as fallback`)
    }
    
    console.log(`Content length: ${contentText.length}`)
    console.log(`Content preview (first 1000 chars): ${contentText.substring(0, 1000)}`)
    
    // 如果内容为空，返回基础信息
    if (!contentText.trim()) {
      console.warn('Content is empty!')
      return {
        id: `SCP-${scpNumber}`,
        name: `SCP-${scpNumber}`,
        objectClass: 'UNKNOWN',
        containment: [],
        description: [],
        appendix: [],
        references: [],
        author: '未知作者',
        url
      }
    }
    
    // 使用文本解析方法提取信息
    const result = this.parseContent(contentText, scpNumber, url)
    
    console.log(`Parse result - Object Class: ${result.objectClass}, Containment: ${result.containment.length}, Description: ${result.description.length}`)
    
    return result
  }

  /**
   * 解析内容文本
   */
  private parseContent(html: string, scpNumber: string, url: string): SCPWikiData {
    const result: SCPWikiData = {
      id: `SCP-${scpNumber}`,
      name: `SCP-${scpNumber}`,
      objectClass: 'UNKNOWN',
      containment: [],
      description: [],
      appendix: [],
      references: [],
      author: '未知作者',
      url
    }
    
    // 移除 HTML 标签，但保留文本内容
    let text = html.replace(/<[^>]+>/g, ' ')
    
    // 规范化空白字符
    text = text.replace(/\s+/g, ' ').trim()
    
    console.log(`Normalized text length: ${text.length}`)
    console.log(`Text preview (first 1000 chars): ${text.substring(0, 1000)}`)
    
    // 1. 提取项目编号 - 支持多种格式
    const numberPatterns = [
      /项目编号[:：]\s*SCP-?\d+/i,
      /Item\s*#[:：]\s*SCP-?\d+/i,
      /SCP-\d+/i
    ]
    
    for (const pattern of numberPatterns) {
      const match = text.match(pattern)
      if (match) {
        const numberMatch = match[0].match(/SCP-?\d+/)
        if (numberMatch) {
          result.id = numberMatch[0].toUpperCase().replace('SCP-', 'SCP-')
          result.name = result.id
          console.log(`Found project number: ${result.id}`)
          break
        }
      }
    }
    
    // 2. 提取项目等级 - 支持多种格式和大小写
    const classPatterns = [
      /项目等级[:：]\s*([^\s]+)/i,
      /Object\s*Class[:：]\s*([^\s]+)/i,
      /分级[:：]\s*([^\s]+)/i
    ]
    
    for (const pattern of classPatterns) {
      const match = text.match(pattern)
      if (match) {
        let classText = match[1].trim().toUpperCase()
        console.log(`Raw class text: "${classText}"`)
        
        // 清理可能的 HTML 实体或标记
        classText = classText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim()
        
        // 移除可能的加粗标记残留
        classText = classText.replace(/\*\*/g, '').trim()
        
        console.log(`Cleaned class text: "${classText}"`)
        
        const knownClasses = ['SAFE', 'EUCLID', 'KETER', 'THAUMIEL', 'NEUTRALIZED', 'PENDING']
        for (const className of knownClasses) {
          if (classText.includes(className)) {
            result.objectClass = className
            console.log(`Matched class: ${className}`)
            break
          }
        }
        
        if (result.objectClass !== 'UNKNOWN') break
      }
    }
    
    // 3. 提取特殊收容措施 - 改进的正则表达式
    const containmentPatterns = [
      /\*\*特殊收容措施[:：]\*\*[\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /\*\*收容措施[:：]\*\*[\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /特殊收容措施[:：][\s\S]*?(?=\*\*描述[:：]\*\*|\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is
    ]
    
    for (const pattern of containmentPatterns) {
      const match = text.match(pattern)
      if (match) {
        const containmentText = match[0].replace(/\*\*特殊收容措施[:：]\*\*|\*\*收容措施[:：]\*\*|\*\*描述[:：]\*\*/gi, '').trim()
        console.log(`Found containment section, length: ${containmentText.length}`)
        console.log(`Containment text preview: ${containmentText.substring(0, 200)}`)
        result.containment = this.parseSectionText(containmentText)
        if (result.containment.length > 0) {
          console.log(`Extracted ${result.containment.length} containment paragraphs`)
          break
        }
      }
    }
    
    // 4. 提取描述 - 改进的正则表达式
    const descriptionPatterns = [
      /\*\*描述[:：]\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|\*\*附录|$)/is,
      /\*\*Description[:：]\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is,
      /描述[:：][\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/is
    ]
    
    for (const pattern of descriptionPatterns) {
      const match = text.match(pattern)
      if (match) {
        const descriptionText = match[0].replace(/\*\*描述[:：]\*\*/gi, '').trim()
        console.log(`Found description section, length: ${descriptionText.length}`)
        console.log(`Description text preview: ${descriptionText.substring(0, 200)}`)
        result.description = this.parseSectionText(descriptionText)
        if (result.description.length > 0) {
          console.log(`Extracted ${result.description.length} description paragraphs`)
          break
        }
      }
    }
    
    // 5. 提取附录
    const appendixPattern = /\*\*附录[^：:]*[:：]*\*\*[\s\S]*?(?=\*\*附录|\*\*作者|\*\*创作|\*\*附|$)/gis
    let match
    while ((match = appendixPattern.exec(text)) !== null) {
      const appendixText = match[0].replace(/\*\*附录[^：:]*[:：]*\*\*/gi, '').trim()
      const sections = this.parseSectionText(appendixText)
      result.appendix.push(...sections)
    }
    
    console.log(`Extracted ${result.appendix.length} appendix paragraphs`)
    
    // 6. 提取作者信息
    const authorPatterns = [
      /\*\*作者[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*创作信息[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*创作者信息[:：]\*\*\s*([^\*\n]+)/i,
      /\*\*Author[:：]\*\*\s*([^\*\n]+)/i
    ]
    
    for (const pattern of authorPatterns) {
      const match = text.match(pattern)
      if (match) {
        result.author = match[1].trim().replace(/\*\*/g, '')
        console.log(`Found author: ${result.author}`)
        break
      }
    }
    
    // 如果收容协议为空，尝试从开头提取
    if (result.containment.length === 0 && result.description.length > 0) {
      result.containment = result.description.slice(0, Math.min(3, result.description.length))
      result.description = result.description.slice(result.containment.length)
      console.log(`Moved ${result.containment.length} paragraphs from description to containment`)
    }
    
    return result
  }

  /**
   * 解析章节文本，分割成段落
   */
  private parseSectionText(text: string): string[] {
    // 移除 HTML 标签
    let cleanText = text.replace(/<[^>]+>/g, '')
    
    // 移除 Markdown 语法（保留文本）
    cleanText = cleanText.replace(/\*\*/g, '') // 移除加粗
    cleanText = cleanText.replace(/\*/g, '')  // 移除斜体
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    
    // 移除图片标记
    cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    
    // 移除多余的空行
    cleanText = cleanText.replace(/\n\s*\n/g, '\n')
    
    // 分割成段落
    const paragraphs: string[] = []
    const lines = cleanText.split('\n')
    let currentParagraph = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim())
          currentParagraph = ''
        }
      } else {
        if (currentParagraph) {
          currentParagraph += ' '
        }
        currentParagraph += trimmedLine
      }
    }
    
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim())
    }
    
    // 过滤空段落和太短的段落
    return paragraphs.filter(p => p.length > 10)
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
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Worker 入口点
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const scraper = new SCPScraper(env.SCP_CACHE)
    const url = new URL(request.url)
    const path = url.pathname
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // 路由处理
      if (path === '/scrape') {
        const scpNumber = url.searchParams.get('number')
        if (!scpNumber) {
          return new Response(
            JSON.stringify({ error: '缺少 number 参数' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const result = await scraper.scrapeSCP(scpNumber)
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (path === '/search') {
        const keyword = url.searchParams.get('keyword')
        if (!keyword) {
          return new Response(
            JSON.stringify({ error: '缺少 keyword 参数' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const result = await scraper.searchSCP(keyword)
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (path === '/format') {
        const scpNumber = url.searchParams.get('number')
        if (!scpNumber) {
          return new Response(
            JSON.stringify({ error: '缺少 number 参数' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        const result = await scraper.scrapeSCP(scpNumber)
        if (result.success && result.data) {
          const formatted = scraper.formatForTerminal(result.data)
          return new Response(
            JSON.stringify({ success: true, lines: formatted }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (path === '/debug') {
        // 调试端点 - 返回原始HTML
        const scpNumber = url.searchParams.get('number') || '173'
        const result = await scraper.getRawHTML(scpNumber)
        return new Response(
          JSON.stringify(result),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (path === '/') {
        return new Response(
          JSON.stringify({
            name: 'SCP Scraper Worker',
            version: '1.6.0',
            status: 'online',
            endpoints: {
              '/scrape?number={number}': '爬取指定SCP的信息',
              '/search?keyword={keyword}': '搜索SCP',
              '/format?number={number}': '获取格式化的SCP信息',
              '/debug?number={number}': '调试：返回原始HTML'
            },
            features: {
              'multi-partition': true,
              'text-based-parsing': true,
              'caching': '30 minutes',
              'retry': '3 attempts',
              'debug-mode': true
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        return new Response(
          JSON.stringify({ error: '未找到路由' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

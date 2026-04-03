/**
 * SCP 编号索引爬虫脚本
 * 复用现有的爬虫实现，爬取所有 SCP 编号并插入 D1 数据库
 */

import { getConfig } from '../shared/config'
import { HTMLParser } from '../parsers/htmlParser'
import { logger } from '../utils/logger'

/**
 * SCP 索引爬虫类
 */
class SCPIndexScraper {
  private config = getConfig()
  private htmlParser = new HTMLParser()

  /**
   * 从 SCP Wiki 系列页面爬取所有 SCP 编号
   */
  async scrapeAllSCPNumbers(): Promise<string[]> {
    const allNumbers: string[] = []

    try {
      // SCP Wiki 中文系列列表
      const seriesPages = [
        'scp-series',
        'scp-series-2',
        'scp-series-3',
        'scp-series-4',
        'scp-series-5',
        'scp-series-6',
        'scp-series-7',
        'scp-series-cn',
      ]

      logger.info('开始爬取 SCP 编号索引...')

      for (const series of seriesPages) {
        const url = `${this.config.baseUrl}/${series}`
        logger.info(`正在爬取系列页面: ${series}`)

        try {
          const html = await this.fetchURL(url)
          const numbers = this.extractSCPNumbers(html)

          logger.info(`从 ${series} 提取到 ${numbers.length} 个 SCP 编号`)
          allNumbers.push(...numbers)

          // 避免请求过快
          await this.sleep(1000)
        } catch (error) {
          logger.error(`爬取 ${series} 失败`, error as Error)
          // 继续处理下一个系列
        }
      }

      logger.info(`总共提取到 ${allNumbers.length} 个 SCP 编号`)
      return allNumbers
    } catch (error) {
      logger.error('爬取 SCP 编号索引失败', error as Error)
      throw error
    }
  }

  /**
   * 提取 SCP 编号
   */
  private extractSCPNumbers(html: string): string[] {
    const numbers: string[] = []

    // 使用正则表达式匹配 SCP 链接
    // 模式：/scp-1234 或 scp-1234
    const pattern = /(?:\/)?scp[-\s_]?(\d+)/gi
    let match

    const seen = new Set<string>()

    while ((match = pattern.exec(html)) !== null) {
      const number = match[1]

      // 过滤掉无效的编号
      if (this.isValidSCPNumber(number) && !seen.has(number)) {
        seen.add(number)
        numbers.push(number)
      }
    }

    return numbers.sort((a, b) => parseInt(a) - parseInt(b))
  }

  /**
   * 验证 SCP 编号是否有效
   */
  private isValidSCPNumber(number: string): boolean {
    // 过滤掉明显无效的编号
    const num = parseInt(number)

    // SCP 编号应该 >= 1 且 <= 99999
    if (num < 1 || num > 99999) {
      return false
    }

    // 过滤掉一些特殊编号（如 0）
    if (num === 0) {
      return false
    }

    return true
  }

  /**
   * 获取 URL 内容（复用现有逻辑）
   */
  private async fetchURL(url: string): Promise<string> {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时')
      }

      throw error
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * D1 数据库操作类
 */
class D1DatabaseManager {
  constructor(private db: D1Database) {}

  /**
   * 批量插入 SCP 编号
   */
  async batchInsert(items: Array<{
    scp_id: number
    name: string
    objectClass: string
    tags?: string
    clearanceLevel?: number
  }>): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    logger.info(`开始批量插入 ${items.length} 个 SCP 编号...`)

    // 分批插入，每批 100 个
    const batchSize = 100
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      try {
        await this.insertBatch(batch)
        success += batch.length
        logger.info(`已插入 ${success}/${items.length} 个编号...`)
      } catch (error) {
        logger.error(`批量插入失败`, error as Error)
        failed += batch.length
      }
    }

    logger.info(`批量插入完成: 成功 ${success}, 失败 ${failed}`)
    return { success, failed }
  }

  /**
   * 插入一批编号
   */
  private async insertBatch(items: Array<{
    scp_id: number
    name: string
    objectClass: string
    tags?: string
    clearanceLevel?: number
  }>): Promise<void> {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO scp_index (scp_id, name, object_class, tags, clearance_level) VALUES (?, ?, ?, ?, ?)'
    )

    const statements = items.map(item =>
      stmt.bind(
        item.scp_id,
        item.name,
        item.objectClass,
        item.tags || '',
        item.clearanceLevel || 1
      )
    )

    await this.db.batch(statements)
  }

  /**
   * 更新 SCP 信息
   */
  async updateSCPInfo(
    scpId: number,
    name: string,
    objectClass: string,
    tags?: string,
    clearanceLevel?: number
  ): Promise<void> {
    await this.db.prepare(
      'UPDATE scp_index SET name = ?, object_class = ?, tags = ?, clearance_level = ?, updated_at = CURRENT_TIMESTAMP WHERE scp_id = ?'
    )
      .bind(name, objectClass, tags || '', clearanceLevel || 1, scpId)
      .execute()
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number
    byClass: Record<string, number>
    byClearance: Record<number, number>
  }> {
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

    return { total, byClass, byClearance }
  }
}

/**
 * 主函数
 */
async function main() {
  const indexScraper = new SCPIndexScraper()

  try {
    logger.info('=== SCP 编号索引爬虫启动 ===')

    // 爬取所有编号
    const numbers = await indexScraper.scrapeAllSCPNumbers()

    if (numbers.length === 0) {
      logger.warn('未找到任何 SCP 编号')
      return
    }

    // 输出结果
    logger.info('=== 爬取结果 ===')
    logger.info(`总编号数: ${numbers.length}`)
    logger.info(`编号范围: ${numbers[0]} - ${numbers[numbers.length - 1]}`)
    logger.info('前 20 个编号:', numbers.slice(0, 20))

    // 这里可以添加数据库插入逻辑
    // 由于这是独立脚本，需要在实际执行时通过环境变量或配置传入数据库连接
    logger.info('提示: 使用 wrangler d1 execute 来插入数据到 D1 数据库')
  } catch (error) {
    logger.error('爬虫执行失败', error as Error)
    process.exit(1)
  }
}

// 导出供其他模块使用
export { SCPIndexScraper, D1DatabaseManager }

// 如果直接运行此脚本
if (import.meta.main) {
  main()
}
/**
 * 性能监控
 * 监控操作的性能指标
 */

import { logger } from './logger'

export class PerformanceMonitor {
  private timers: Map<string, number> = new Map()
  private metrics: Map<string, number[]> = new Map()

  /**
   * 开始计时
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now()
    this.timers.set(operation, startTime)

    return () => {
      const duration = Date.now() - startTime
      this.timers.delete(operation)
      this.recordMetric(operation, duration)
      logger.info(`Performance: ${operation}`, { duration })
    }
  }

  /**
   * 记录指标
   */
  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    const values = this.metrics.get(operation)!
    values.push(value)

    // 只保留最近 100 个记录
    if (values.length > 100) {
      values.shift()
    }
  }

  /**
   * 获取操作的平均时间
   */
  getAverageTime(operation: string): number | null {
    const values = this.metrics.get(operation)
    if (!values || values.length === 0) {
      return null
    }

    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }

  /**
   * 获取操作的最小时间
   */
  getMinTime(operation: string): number | null {
    const values = this.metrics.get(operation)
    if (!values || values.length === 0) {
      return null
    }

    return values.reduce((min, val) => val < min ? val : min, values[0])
  }

  getMaxTime(operation: string): number | null {
    const values = this.metrics.get(operation)
    if (!values || values.length === 0) {
      return null
    }

    return values.reduce((max, val) => val > max ? val : max, values[0])
  }

  /**
   * 获取操作的第 95 百分位时间
   */
  getP95Time(operation: string): number | null {
    const values = this.metrics.get(operation)
    if (!values || values.length === 0) {
      return null
    }

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.floor(sorted.length * 0.95)
    return sorted[index]
  }

  /**
   * 获取性能统计
   */
  getStats(operation: string): {
    count: number
    average: number | null
    min: number | null
    max: number | null
    p95: number | null
  } | null {
    const values = this.metrics.get(operation)
    if (!values) {
      return null
    }

    return {
      count: values.length,
      average: this.getAverageTime(operation),
      min: this.getMinTime(operation),
      max: this.getMaxTime(operation),
      p95: this.getP95Time(operation),
    }
  }

  /**
   * 获取所有操作的统计
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, any> = {}

    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation)
    }

    return stats
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics.clear()
    this.timers.clear()
  }

  /**
   * 清除指定操作的指标
   */
  clearOperation(operation: string): void {
    this.metrics.delete(operation)
    this.timers.delete(operation)
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor()
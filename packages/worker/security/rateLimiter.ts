/**
 * 速率限制器
 * 基于 IP 地址的请求速率限制
 */

import { getConfig } from '../shared/config'

export class RateLimiter {
  private config = getConfig()
  private cache: Map<string, number[]> = new Map()

  /**
   * 检查是否超过速率限制
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()
    const requests = this.cache.get(identifier) || []

    // 清理过期请求
    const validRequests = requests.filter(t => now - t < this.config.rateLimit.windowMs)

    // 检查是否超过限制
    if (validRequests.length >= this.config.rateLimit.maxRequests) {
      return false
    }

    // 添加当前请求
    validRequests.push(now)
    this.cache.set(identifier, validRequests)

    return true
  }

  /**
   * 获取剩余请求次数
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const requests = this.cache.get(identifier) || []

    // 清理过期请求
    const validRequests = requests.filter(t => now - t < this.config.rateLimit.windowMs)

    return Math.max(0, this.config.rateLimit.maxRequests - validRequests.length)
  }

  /**
   * 获取重置时间
   */
  getResetTime(identifier: string): number | null {
    const now = Date.now()
    const requests = this.cache.get(identifier)

    if (!requests || requests.length === 0) {
      return null
    }

    const firstRequest = requests[0]
    return firstRequest + this.config.rateLimit.windowMs
  }

  /**
   * 重置指定标识符的限制
   */
  reset(identifier: string): void {
    this.cache.delete(identifier)
  }

  /**
   * 清理所有过期记录
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [identifier, requests] of this.cache.entries()) {
      const validRequests = requests.filter(t => now - t < this.config.rateLimit.windowMs)
      if (validRequests.length === 0) {
        keysToDelete.push(identifier)
      } else {
        this.cache.set(identifier, validRequests)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }
}
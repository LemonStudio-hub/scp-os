/**
 * 速率限制器
 * 基于 IP 地址的请求速率限制
 * 支持内存模式（MemoryRateLimiter）和 KV 存储模式（KVRateLimiter）
 */

import { getConfig } from '../shared/config'

interface RateLimitData {
  timestamps: number[]
}

export class MemoryRateLimiter {
  private config = getConfig()
  private cache: Map<string, number[]> = new Map()
  private lastCleanup = Date.now()
  private static readonly CLEANUP_INTERVAL = 60000

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()

    if (now - this.lastCleanup > MemoryRateLimiter.CLEANUP_INTERVAL) {
      this.cleanup()
      this.lastCleanup = now
    }

    const requests = this.cache.get(identifier) || []

    const validRequests = requests.filter(t => now - t < this.config.rateLimit.windowMs)

    if (validRequests.length >= this.config.rateLimit.maxRequests) {
      return false
    }

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

/**
 * 基于 Cloudflare KV 的速率限制器
 * 注意：KV 是最终一致性的，限流可能有短暂延迟
 */
export class KVRateLimiter {
  private config = getConfig()
  private kv: KVNamespace

  constructor(kv: KVNamespace) {
    this.kv = kv
  }

  private keyFor(identifier: string): string {
    return `ratelimit:${identifier}`
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()
    const key = this.keyFor(identifier)
    const windowMs = this.config.rateLimit.windowMs
    const maxRequests = this.config.rateLimit.maxRequests

    let timestamps: number[] = []

    try {
      const raw = await this.kv.get(key, 'text')
      if (raw) {
        const data = JSON.parse(raw) as RateLimitData
        timestamps = data.timestamps || []
      }
    } catch {
      timestamps = []
    }

    const validTimestamps = timestamps.filter(t => now - t < windowMs)

    if (validTimestamps.length >= maxRequests) {
      return false
    }

    validTimestamps.push(now)

    try {
      await this.kv.put(key, JSON.stringify({ timestamps: validTimestamps }), {
        expirationTtl: Math.ceil(windowMs / 1000),
      })
    } catch {
    }

    return true
  }

  /**
   * 获取剩余请求次数
   */
  async getRemainingRequests(identifier: string): Promise<number> {
    const now = Date.now()
    const key = this.keyFor(identifier)
    const maxRequests = this.config.rateLimit.maxRequests

    try {
      const raw = await this.kv.get(key, 'text')
      if (raw) {
        const data = JSON.parse(raw) as RateLimitData
        const timestamps = data.timestamps || []
        const validTimestamps = timestamps.filter(t => now - t < this.config.rateLimit.windowMs)
        return Math.max(0, maxRequests - validTimestamps.length)
      }
    } catch {
    }

    return maxRequests
  }

  /**
   * 获取重置时间
   */
  async getResetTime(identifier: string): Promise<number | null> {
    const now = Date.now()
    const key = this.keyFor(identifier)

    try {
      const raw = await this.kv.get(key, 'text')
      if (raw) {
        const data = JSON.parse(raw) as RateLimitData
        const timestamps = data.timestamps || []
        if (timestamps.length > 0) {
          return timestamps[0] + this.config.rateLimit.windowMs
        }
      }
    } catch {
    }

    return null
  }

  /**
   * 重置指定标识符的限制
   */
  async reset(identifier: string): Promise<void> {
    const key = this.keyFor(identifier)
    try {
      await this.kv.delete(key)
    } catch {
    }
  }
}

/**
 * 向后兼容的别名：RateLimiter = MemoryRateLimiter
 */
export const RateLimiter = MemoryRateLimiter

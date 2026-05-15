/**
 * 基于 D1 的速率限制器
 * 替代 KVRateLimiter，不消耗 KV 额度
 */

import { getConfig } from '../shared/config'

interface RateLimitData {
  timestamps: number[]
}

export class D1RateLimiter {
  private config = getConfig()
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()
    const windowMs = this.config.rateLimit.windowMs
    const maxRequests = this.config.rateLimit.maxRequests

    let timestamps: number[] = []

    try {
      const row = await this.db.prepare(
        'SELECT timestamps FROM rate_limits WHERE identifier = ?'
      ).bind(identifier).first<{ timestamps: string }>()

      if (row) {
        const data = JSON.parse(row.timestamps) as number[]
        timestamps = data
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
      await this.db.prepare(
        'INSERT OR REPLACE INTO rate_limits (identifier, timestamps) VALUES (?, ?)'
      ).bind(identifier, JSON.stringify(validTimestamps)).run()
    } catch {
      // ignore write errors
    }

    return true
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const now = Date.now()
    const maxRequests = this.config.rateLimit.maxRequests

    try {
      const row = await this.db.prepare(
        'SELECT timestamps FROM rate_limits WHERE identifier = ?'
      ).bind(identifier).first<{ timestamps: string }>()

      if (row) {
        const timestamps = JSON.parse(row.timestamps) as number[]
        const validTimestamps = timestamps.filter(t => now - t < this.config.rateLimit.windowMs)
        return Math.max(0, maxRequests - validTimestamps.length)
      }
    } catch {
      // ignore
    }

    return maxRequests
  }

  async getResetTime(identifier: string): Promise<number | null> {
    const now = Date.now()

    try {
      const row = await this.db.prepare(
        'SELECT timestamps FROM rate_limits WHERE identifier = ?'
      ).bind(identifier).first<{ timestamps: string }>()

      if (row) {
        const timestamps = JSON.parse(row.timestamps) as number[]
        if (timestamps.length > 0) {
          return timestamps[0] + this.config.rateLimit.windowMs
        }
      }
    } catch {
      // ignore
    }

    return null
  }

  async reset(identifier: string): Promise<void> {
    try {
      await this.db.prepare(
        'DELETE FROM rate_limits WHERE identifier = ?'
      ).bind(identifier).run()
    } catch {
      // ignore
    }
  }
}

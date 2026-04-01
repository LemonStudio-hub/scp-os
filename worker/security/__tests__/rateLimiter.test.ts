/**
 * RateLimiter 测试
 * 测试速率限制功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RateLimiter } from '../rateLimiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter()
  })

  describe('checkLimit', () => {
    it('应该允许首次请求', async () => {
      const result = await rateLimiter.checkLimit('127.0.0.1')

      expect(result).toBe(true)
    })

    it('应该在限制内允许多个请求', async () => {
      const ip = '127.0.0.1'

      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(ip)
        expect(result).toBe(true)
      }
    })

    it('应该在超过限制后拒绝请求', async () => {
      const ip = '127.0.0.1'

      // 发送最大允许的请求数
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(ip)
      }

      // 第11个请求应该被拒绝
      const result = await rateLimiter.checkLimit(ip)
      expect(result).toBe(false)
    })

    it('应该为不同的 IP 独立限制', async () => {
      const ip1 = '127.0.0.1'
      const ip2 = '192.168.1.1'

      // IP1 发送 10 个请求
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(ip1)
      }

      // IP1 应该被拒绝
      const result1 = await rateLimiter.checkLimit(ip1)
      expect(result1).toBe(false)

      // IP2 应该仍然被允许
      const result2 = await rateLimiter.checkLimit(ip2)
      expect(result2).toBe(true)
    })
  })

  describe('getRemainingRequests', () => {
    it('应该返回剩余的请求次数', async () => {
      const ip = '127.0.0.1'

      // 发送 3 个请求
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkLimit(ip)
      }

      const remaining = rateLimiter.getRemainingRequests(ip)
      expect(remaining).toBe(7) // 10 - 3
    })

    it('应该返回 0 如果超过限制', async () => {
      const ip = '127.0.0.1'

      // 发送 11 个请求
      for (let i = 0; i < 11; i++) {
        await rateLimiter.checkLimit(ip)
      }

      const remaining = rateLimiter.getRemainingRequests(ip)
      expect(remaining).toBe(0)
    })
  })

  describe('reset', () => {
    it('应该重置指定 IP 的限制', async () => {
      const ip = '127.0.0.1'

      // 发送 10 个请求
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit(ip)
      }

      // 应该被拒绝
      let result = await rateLimiter.checkLimit(ip)
      expect(result).toBe(false)

      // 重置
      rateLimiter.reset(ip)

      // 应该再次被允许
      result = await rateLimiter.checkLimit(ip)
      expect(result).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('应该清理过期的记录', async () => {
      const ip = '127.0.0.1'

      // 发送一些请求
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit(ip)
      }

      // 清理（虽然这里没有过期记录）
      rateLimiter.cleanup()

      // 应该仍然有记录
      const size = rateLimiter.size()
      expect(size).toBeGreaterThan(0)
    })
  })

  describe('size', () => {
    it('应该返回缓存的 IP 数量', async () => {
      const ip1 = '127.0.0.1'
      const ip2 = '192.168.1.1'

      await rateLimiter.checkLimit(ip1)
      await rateLimiter.checkLimit(ip2)

      const size = rateLimiter.size()
      expect(size).toBe(2)
    })
  })
})
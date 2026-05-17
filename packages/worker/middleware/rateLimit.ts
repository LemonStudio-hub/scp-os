/**
 * 速率限制中间件 (Hono)
 */

import { createMiddleware } from 'hono/factory'
import type { HonoEnv } from '../types'
import { RateLimiter } from '../security/rateLimiter'
import { D1RateLimiter } from '../security/d1RateLimiter'

export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const rateLimiter = c.env.SCP_DB
    ? new D1RateLimiter(c.env.SCP_DB)
    : new RateLimiter()

  const userId = c.get('userId')
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const identifier = userId || ip

  const isAllowed = await rateLimiter.checkLimit(identifier)
  if (!isAllowed) {
    return c.json(
      { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      429,
    )
  }

  await next()
})

/**
 * JWT 用户认证中间件 (Hono)
 * 软认证：即使无 token 也放行，仅将 userId 写入上下文
 * 硬认证：requireAuth() 用于需要登录的路由
 */

import { createMiddleware } from 'hono/factory'
import type { HonoEnv } from '../types'
import { verifyToken } from '../security/auth'

/**
 * 软认证：尝试解析 JWT，成功则将 userId 写入 c.var，
 * 失败或无 token 也放行（userId 为 undefined）。
 */
export const softAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const secret = c.env.JWT_SECRET
    if (secret) {
      const result = await verifyToken(token, secret)
      if (result) {
        c.set('userId', result.userId)
      }
    }
  }
  await next()
})

/**
 * 硬认证中间件：要求有效 JWT，否则返回 401。
 */
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json(
      { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
      401,
    )
  }
  await next()
})

/**
 * 管理员认证中间件 (Hono)
 */

import { createMiddleware } from 'hono/factory'
import type { HonoEnv } from '../types'
import { requireAdminAuth as verifyAdmin, requireRole as checkRole } from '../api/admin-auth'
import type { AdminRole } from '../shared/types'

export interface AdminAuthResult {
  adminId: number
  username: string
  role: AdminRole
}

/**
 * 管理员认证中间件：验证 Admin JWT 并将结果写入 c.var.adminAuth。
 */
export const adminAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const secret =
    c.env.ADMIN_JWT_SECRET || c.env.JWT_SECRET || 'admin-secret-key'

  // SCPScraper 在上层已挂载
  const scraper = c.get('scraper')
  const db = scraper.requireDB()

  const result = await verifyAdmin(c.req.raw, secret, db)
  if (result instanceof Response) {
    return result
  }

  c.set('adminAuth', result)
  await next()
})

/**
 * 角色检查工厂：要求管理员具有指定角色之一。
 * 需要在 adminAuthMiddleware 之后使用。
 */
export function requireAdminRole(...roles: AdminRole[]) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const adminAuth = c.get('adminAuth')
    if (!adminAuth) {
      return c.json({ success: false, error: '请先登录管理后台' }, 401)
    }
    const roleCheck = checkRole(adminAuth, ...roles)
    if (roleCheck) return roleCheck
    await next()
  })
}

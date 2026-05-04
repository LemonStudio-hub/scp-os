import type { D1Database } from '@cloudflare/workers-types'
import type { AdminLoginBody, RequestContext } from '../shared/types'
import { verifyPassword, createAdminToken, verifyAdminToken } from '../security/admin-auth'
import { logAdminAction } from './admin-logs'
import { logger } from '../utils/logger'

interface AdminAuthResult {
  adminId: number
  username: string
  role: string
}

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `密码长度至少${PASSWORD_MIN_LENGTH}个字符` }
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `密码长度不能超过${PASSWORD_MAX_LENGTH}个字符` }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '密码必须包含至少一个大写字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '密码必须包含至少一个小写字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '密码必须包含至少一个数字' }
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: '密码必须包含至少一个特殊字符' }
  }
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'login'
  ]
  const lowerPassword = password.toLowerCase()
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      return { valid: false, error: '密码不能包含常见弱密码模式' }
    }
  }
  return { valid: true }
}

export async function handleAdminLogin(
  db: D1Database,
  secret: string,
  body: AdminLoginBody,
  requestContext: RequestContext
): Promise<{ success: boolean; token?: string; admin?: { id: number; username: string; role: string }; error?: string }> {
  try {
    if (!body.username || !body.password) {
      return { success: false, error: '请提供用户名和密码' }
    }

    const username = body.username.trim()
    const password = body.password

    if (username.length < 3 || username.length > 32) {
      return { success: false, error: '用户名长度必须在3-32个字符之间' }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { success: false, error: '用户名只能包含字母、数字、下划线和连字符' }
    }

    const loginFailures = await db.prepare(
      `SELECT id, fail_count, last_fail_at FROM admin_login_attempts
       WHERE username = ? AND last_fail_at > datetime('now', '-30 minutes')`
    ).bind(username).first<{ id: number; fail_count: number; last_fail_at: string }>()

    if (loginFailures && loginFailures.fail_count >= 5) {
      const waitMinutes = Math.ceil((1800 - (Date.now() - new Date(loginFailures.last_fail_at).getTime())) / 60000)
      return {
        success: false,
        error: `登录失败次数过多，请${waitMinutes}分钟后再试`
      }
    }

    const admin = await db.prepare(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = 1'
    ).bind(username).first()

    if (!admin) {
      await recordFailedLoginAttempt(db, username, requestContext.ip)
      return { success: false, error: '用户名或密码错误' }
    }

    const isValid = await verifyPassword(password, admin.password_hash)
    if (!isValid) {
      await recordFailedLoginAttempt(db, username, requestContext.ip)
      await logAdminAction(db, {
        admin_id: admin.id,
        admin_username: admin.username,
        action: 'login_failed',
        ip_address: requestContext.ip,
      })
      return { success: false, error: '用户名或密码错误' }
    }

    await db.prepare('DELETE FROM admin_login_attempts WHERE username = ?').bind(username).run()

    await db.prepare(
      'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(admin.id).run()

    const token = await createAdminToken(
      { id: admin.id, username: admin.username, role: admin.role },
      secret,
      '8h'
    )

    await logAdminAction(db, {
      admin_id: admin.id,
      admin_username: admin.username,
      action: 'login',
      ip_address: requestContext.ip,
    })

    const { password_hash: _, ...adminWithoutPassword } = admin

    return {
      success: true,
      token,
      admin: adminWithoutPassword as { id: number; username: string; role: string },
    }
  } catch (e: unknown) {
    logger.error('[AdminAuth] Login failed:', e instanceof Error ? e : new Error(String(e)))
    return { success: false, error: '登录失败，请稍后重试' }
  }
}

async function recordFailedLoginAttempt(
  db: D1Database,
  username: string,
  ipAddress: string
): Promise<void> {
  try {
    const existing = await db.prepare(
      'SELECT id, fail_count FROM admin_login_attempts WHERE username = ?'
    ).bind(username).first<{ id: number; fail_count: number }>()

    if (existing) {
      await db.prepare(
        'UPDATE admin_login_attempts SET fail_count = fail_count + 1, last_fail_at = CURRENT_TIMESTAMP WHERE username = ?'
      ).bind(username).run()
    } else {
      await db.prepare(
        'INSERT INTO admin_login_attempts (username, fail_count, ip_address) VALUES (?, 1, ?)'
      ).bind(username, ipAddress).run()
    }
  } catch {
  }
}

export async function requireAdminAuth(
  request: Request,
  secret: string | undefined,
  db: D1Database
): Promise<AdminAuthResult | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ success: false, error: '请先登录管理后台' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!secret) {
    return new Response(
      JSON.stringify({ success: false, error: '服务器配置错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.slice(7)
  const payload = await verifyAdminToken(token, secret)

  if (!payload) {
    return new Response(
      JSON.stringify({ success: false, error: '登录已过期，请重新登录' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const admin = await db.prepare(
    'SELECT id, username, role, is_active FROM admin_users WHERE id = ? AND is_active = 1'
  ).bind(payload.adminId).first<{ id: number; username: string; role: string; is_active: number }>()

  if (!admin) {
    return new Response(
      JSON.stringify({ success: false, error: '管理员账户已被禁用' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
  }
}

export function requireRole(
  adminInfo: AdminAuthResult,
  ...roles: string[]
): Response | null {
  if (!roles.includes(adminInfo.role)) {
    return new Response(
      JSON.stringify({ success: false, error: '权限不足，无法执行此操作' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return null
}

import { Hono } from 'hono'
import type { Env } from '../types'
import { json, readJson } from '../http'
import { first, run } from '../db'
import { allowedEmailDomains, isAllowedEmailDomain, normalizeEmail } from '../email-domains'
import { hashPassword, signJwt, verifyPassword } from '../security'

type AppEnv = { Bindings: Env }

const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

function jwtSecret(env: Env): string {
  return env.JWT_SECRET || 'scp-os-default-secret'
}

function cleanNickname(value: string | null | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.slice(0, 20) || fallback
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return null
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return null
  return password
}

async function issueRegisteredToken(env: Env, email: string): Promise<string> {
  return signJwt({ userId: email, email, accountType: 'registered' }, jwtSecret(env), 7 * 24 * 60 * 60)
}

export function registerAuth(app: Hono<AppEnv>): void {
  app.get('/api/auth/email-domains', (c) => {
    return json({ success: true, data: allowedEmailDomains() })
  })

  app.post('/api/auth/guest', async (c) => {
    const body = await readJson<{ userId?: string; nickname?: string }>(c.req.raw)
    const userId = typeof body?.userId === 'string' && body.userId.length <= 128 ? body.userId : crypto.randomUUID()
    const nickname = cleanNickname(body?.nickname, 'Guest')
    await run(
      c.env.SCP_DB,
      'INSERT INTO users (user_id, nickname, account_type, created_at, last_active_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, account_type = excluded.account_type, last_active_at = CURRENT_TIMESTAMP',
      [userId, nickname, 'guest']
    )
    const token = await signJwt({ userId, accountType: 'guest' }, jwtSecret(c.env), 7 * 24 * 60 * 60)
    return json({ success: true, token, user: { userId, nickname, accountType: 'guest' } })
  })

  app.post('/api/auth/register', async (c) => {
    const body = await readJson<{ email?: string; password?: string; nickname?: string }>(c.req.raw)
    const email = normalizeEmail(body?.email)
    const password = validatePassword(body?.password)
    if (!email || !password) {
      return json({ code: 'VALIDATION_ERROR', message: 'Invalid email or password' }, 400)
    }
    if (!isAllowedEmailDomain(email)) {
      return json({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', message: 'Email provider is not allowed' }, 400)
    }
    const existing = await first<{ id: number }>(c.env.SCP_DB, 'SELECT id FROM users WHERE email = ?', [email])
    if (existing) return json({ success: false, error: 'Email already registered' }, 409)

    const nickname = cleanNickname(body?.nickname, email.split('@')[0])
    const passwordHash = await hashPassword(password)
    await run(
      c.env.SCP_DB,
      'INSERT INTO users (user_id, email, password_hash, nickname, account_type, created_at, last_active_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [email, email, passwordHash, nickname, 'registered']
    )
    await run(c.env.SCP_DB, 'INSERT OR IGNORE INTO user_storage (user_id, max_bytes) VALUES (?, ?)', [email, 512 * 1024 * 1024])
    const token = await issueRegisteredToken(c.env, email)
    return json({ success: true, token, user: { userId: email, email, nickname, accountType: 'registered' } })
  })

  app.post('/api/auth/login', async (c) => {
    const body = await readJson<{ email?: string; password?: string }>(c.req.raw)
    const email = normalizeEmail(body?.email)
    const password = validatePassword(body?.password)
    if (!email || !password) {
      return json({ code: 'VALIDATION_ERROR', message: 'Invalid email or password' }, 400)
    }
    if (!isAllowedEmailDomain(email)) {
      return json({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', message: 'Email provider is not allowed' }, 400)
    }
    const user = await first<{ user_id: string; email: string; nickname: string; password_hash: string; is_banned: number }>(
      c.env.SCP_DB,
      'SELECT user_id, email, nickname, password_hash, is_banned FROM users WHERE email = ? AND account_type = ?',
      [email, 'registered']
    )
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return json({ success: false, error: 'Email or password is incorrect' }, 401)
    }
    if (user.is_banned) return json({ success: false, error: 'Account disabled' }, 403)
    await run(c.env.SCP_DB, 'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE email = ?', [email])
    const token = await issueRegisteredToken(c.env, email)
    return json({ success: true, token, user: { userId: user.user_id, email: user.email, nickname: user.nickname, accountType: 'registered' } })
  })

  app.post('/api/auth/token', async (c) => {
    const body = await readJson<{ userId?: string }>(c.req.raw)
    const userId = body?.userId
    if (!userId || typeof userId !== 'string' || userId.length > 128) {
      return json({ code: 'VALIDATION_ERROR', message: 'Missing or invalid userId' }, 400)
    }
    const user = await first<{ account_type: string }>(c.env.SCP_DB, 'SELECT account_type FROM users WHERE user_id = ?', [userId])
    if (user?.account_type !== 'guest') {
      return json({ code: 'FORBIDDEN', message: 'Token refresh is only available for guest sessions' }, 403)
    }
    const token = await signJwt({ userId, accountType: 'guest' }, jwtSecret(c.env), 7 * 24 * 60 * 60)
    return json({ success: true, token })
  })
}

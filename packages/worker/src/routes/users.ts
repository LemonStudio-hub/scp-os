import { Hono } from 'hono'
import type { Env } from '../types'
import { first, run } from '../db'
import { cleanText, json, readJson } from '../http'
import { requiredUser } from '../helpers'

type AppEnv = { Bindings: Env }

const NICKNAME_MIN = 2
const NICKNAME_MAX = 20
const NICKNAME_REGEX = /^[a-zA-Z0-9_一-龥]+$/

function validateNickname(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) return null
  if (!NICKNAME_REGEX.test(trimmed)) return null
  return trimmed
}

export function registerUsers(app: Hono<AppEnv>): void {
  app.post('/api/user/register', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId

    const body = await readJson<{ nickname?: string; account_type?: string }>(c.req.raw)
    const nickname = validateNickname(cleanText(body?.nickname, NICKNAME_MAX))
    if (!nickname) return json({ code: 'VALIDATION_ERROR', message: 'Invalid nickname' }, 400)

    const accountType = body?.account_type === 'registered' ? 'registered' : 'guest'

    // Only registered accounts need unique nicknames; guests may share display names
    if (accountType === 'registered') {
      const taken = await first(c.env.SCP_DB, 'SELECT id FROM users WHERE nickname = ? AND user_id != ? AND account_type = ?', [nickname, userId, 'registered'])
      if (taken) return json({ success: false, error: 'Nickname already taken' }, 409)
    }

    await run(
      c.env.SCP_DB,
      'INSERT INTO users (user_id, nickname, account_type, created_at, last_active_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, account_type = excluded.account_type, last_active_at = CURRENT_TIMESTAMP',
      [userId, nickname, accountType]
    )

    // Keep chat display name in sync
    await run(c.env.SCP_DB, 'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)', [`nickname_${userId}`, nickname, new Date().toISOString()])

    return json({ success: true, data: await first(c.env.SCP_DB, 'SELECT * FROM users WHERE user_id = ?', [userId]) })
  })

  app.get('/api/user/check-nickname', async (c) => {
    const nickname = validateNickname(cleanText(c.req.query('nickname'), NICKNAME_MAX))
    if (!nickname) return json({ success: false, available: false, error: 'Invalid nickname' }, 400)
    // Only registered accounts occupy a nickname slot
    const row = await first(c.env.SCP_DB, 'SELECT id FROM users WHERE nickname = ? AND user_id != ? AND account_type = ?', [nickname, c.req.query('excludeUserId') || '', 'registered'])
    return json({ success: true, available: !row })
  })

  app.get('/api/user/:userId', async (c) => {
    const row = await first(c.env.SCP_DB, 'SELECT * FROM users WHERE user_id = ?', [c.req.param('userId')])
    return row ? json({ success: true, data: row }) : json({ success: false, error: 'User not found' }, 404)
  })
}

import { Hono } from 'hono'
import type { Env } from '../types'
import { first, run } from '../db'
import { cleanText, json, readJson } from '../http'
import { requiredUser } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerUsers(app: Hono<AppEnv>): void {
  app.post('/api/user/register', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ nickname?: string }>(c.req.raw)
    const nickname = cleanText(body?.nickname, 30)
    if (!nickname) return json({ code: 'VALIDATION_ERROR', message: 'Missing nickname' }, 400)
    const taken = await first(c.env.SCP_DB, 'SELECT id FROM users WHERE nickname = ? AND user_id != ?', [nickname, userId])
    if (taken) return json({ success: false, error: 'Nickname already taken' }, 409)
    await run(c.env.SCP_DB, 'INSERT INTO users (user_id, nickname, created_at, last_active_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, last_active_at = CURRENT_TIMESTAMP', [userId, nickname])
    return json({ success: true, data: await first(c.env.SCP_DB, 'SELECT * FROM users WHERE user_id = ?', [userId]) })
  })
  app.get('/api/user/check-nickname', async (c) => {
    const nickname = cleanText(c.req.query('nickname'), 30)
    if (!nickname) return json({ success: false, available: false, error: 'Missing nickname' }, 400)
    const row = await first(c.env.SCP_DB, 'SELECT id FROM users WHERE nickname = ? AND user_id != ?', [nickname, c.req.query('excludeUserId') || ''])
    return json({ success: true, available: !row })
  })
  app.get('/api/user/:userId', async (c) => {
    const row = await first(c.env.SCP_DB, 'SELECT * FROM users WHERE user_id = ?', [c.req.param('userId')])
    return row ? json({ success: true, data: row }) : json({ success: false, error: 'User not found' }, 404)
  })
}

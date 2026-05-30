import { Hono } from 'hono'
import type { Env } from '../types'
import { all, first, run } from '../db'
import { intValue, json, readJson } from '../http'
import { requiredUser, defaultNotificationPreferences } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerNotifications(app: Hono<AppEnv>): void {
  app.get('/notifications', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const unread = c.req.query('unread') === 'true'
    const where = unread ? 'recipient_user_id = ? AND is_read = 0' : 'recipient_user_id = ?'
    const rows = await all(c.env.SCP_DB, `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [userId, intValue(c.req.query('limit'), 50), intValue(c.req.query('offset'), 0)])
    return json({ success: true, data: rows, count: rows.length })
  })
  app.post('/notifications/mark-read', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ id?: number; ids?: number[]; all?: boolean }>(c.req.raw)
    if (body?.all) await run(c.env.SCP_DB, 'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE recipient_user_id = ?', [userId])
    else if (body?.id) await run(c.env.SCP_DB, 'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_user_id = ?', [body.id, userId])
    else if (body?.ids?.length) for (const id of body.ids) await run(c.env.SCP_DB, 'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_user_id = ?', [id, userId])
    return json({ success: true })
  })
  app.delete('/notifications/:id', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    await run(c.env.SCP_DB, 'DELETE FROM notifications WHERE id = ? AND recipient_user_id = ?', [Number(c.req.param('id')), userId])
    return json({ success: true })
  })
  app.get('/notifications/preferences', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const row = await first(c.env.SCP_DB, 'SELECT * FROM notification_preferences WHERE user_id = ?', [userId])
    return json({ success: true, data: row || defaultNotificationPreferences(userId) })
  })
  app.post('/notifications/preferences', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<Record<string, number>>(c.req.raw) || {}
    await run(c.env.SCP_DB, 'INSERT INTO notification_preferences (user_id, feedback_comment, feedback_upvote, feedback_downvote, chat_message, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET feedback_comment = excluded.feedback_comment, feedback_upvote = excluded.feedback_upvote, feedback_downvote = excluded.feedback_downvote, chat_message = excluded.chat_message, updated_at = CURRENT_TIMESTAMP', [userId, body.feedback_comment ?? 1, body.feedback_upvote ?? 1, body.feedback_downvote ?? 1, body.chat_message ?? 1])
    return json({ success: true, data: await first(c.env.SCP_DB, 'SELECT * FROM notification_preferences WHERE user_id = ?', [userId]) })
  })
}

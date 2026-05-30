import { Hono } from 'hono'
import type { Env } from '../types'
import { all, first, run } from '../db'
import { cleanText, intValue, json, readJson } from '../http'
import { requiredUser, chatRateLimit, userSetting, broadcastMessages } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerChat(app: Hono<AppEnv>): void {
  app.post('/chat/send', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ content?: string; room_id?: number }>(c.req.raw)
    const content = cleanText(body?.content, 1000)
    if (!content) return json({ code: 'VALIDATION_ERROR', message: 'Missing content' }, 400)
    const roomId = body?.room_id || 1
    const nickname = await userSetting(c.env.SCP_DB, `nickname_${userId}`) || `User_${userId.slice(0, 8)}`
    const limited = await chatRateLimit(c.env.SCP_DB, userId)
    if (!limited.allowed) return json({ success: false, error: 'Rate limit exceeded. Try again later.' }, 429)
    const inserted = await run(c.env.SCP_DB, 'INSERT INTO chat_messages (user_id, username, content, room_id) VALUES (?, ?, ?, ?)', [userId, nickname, content, roomId])
    await run(c.env.SCP_DB, 'UPDATE chat_rooms SET message_count = message_count + 1 WHERE id = ?', [roomId])
    const message = await first(c.env.SCP_DB, 'SELECT * FROM chat_messages WHERE id = ?', [inserted.meta?.last_row_id])
    return json({ success: true, data: message })
  })

  app.get('/chat/messages', async (c) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const after = c.req.query('after')
    const roomId = c.req.query('room_id')
    const where: string[] = ['1=1']
    const params: unknown[] = []
    if (roomId) { where.push('room_id = ?'); params.push(Number(roomId)) }
    if (after) { where.push('created_at > ?'); params.push(after) }
    const rows = await all(c.env.SCP_DB, `SELECT * FROM chat_messages WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`, [...params, limit])
    return json({ success: true, data: rows.reverse(), count: rows.length })
  })

  app.get('/chat/rooms', async (c) => {
    const rows = await all(c.env.SCP_DB, `SELECT cr.*, (SELECT COUNT(DISTINCT user_id) FROM chat_messages WHERE room_id = cr.id) as member_count, (SELECT content FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message FROM chat_rooms cr ORDER BY cr.id ASC`)
    return json({ success: true, data: rows })
  })

  app.post('/chat/rooms', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ name?: string; description?: string; is_public?: number }>(c.req.raw)
    const name = cleanText(body?.name, 50)
    if (!name) return json({ code: 'VALIDATION_ERROR', message: 'Missing name' }, 400)
    const row = await first<{ count: number }>(c.env.SCP_DB, 'SELECT COUNT(*) as count FROM chat_rooms WHERE created_by = ?', [userId])
    if ((row?.count || 0) >= 5) return json({ success: false, error: 'You can create at most 5 chat rooms' }, 400)
    const inserted = await run(c.env.SCP_DB, 'INSERT INTO chat_rooms (name, description, created_by, is_public) VALUES (?, ?, ?, ?)', [name, cleanText(body?.description, 300), userId, body?.is_public ?? 1])
    const room = await first(c.env.SCP_DB, 'SELECT * FROM chat_rooms WHERE id = ?', [inserted.meta?.last_row_id])
    return json({ success: true, data: room }, 201)
  })

  app.put('/chat/rooms/:id', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const roomId = Number(c.req.param('id'))
    const body = await readJson<{ name?: string; description?: string; is_public?: number }>(c.req.raw)
    const name = cleanText(body?.name, 50)
    if (!name) return json({ code: 'VALIDATION_ERROR', message: 'Missing name' }, 400)
    const room = await first<{ id: number; created_by: string }>(c.env.SCP_DB, 'SELECT id, created_by FROM chat_rooms WHERE id = ?', [roomId])
    if (!room) return json({ success: false, error: 'Room not found' }, 404)
    if (room.created_by !== userId) return json({ success: false, error: 'Permission denied' }, 403)
    await run(c.env.SCP_DB, 'UPDATE chat_rooms SET name = ?, description = ?, is_public = ? WHERE id = ?', [name, cleanText(body?.description, 300), body?.is_public ?? 1, roomId])
    const updated = await first(c.env.SCP_DB, 'SELECT * FROM chat_rooms WHERE id = ?', [roomId])
    return json({ success: true, data: updated })
  })

  app.delete('/chat/rooms/:id', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const roomId = Number(c.req.param('id'))
    const room = await first<{ id: number; created_by: string }>(c.env.SCP_DB, 'SELECT id, created_by FROM chat_rooms WHERE id = ?', [roomId])
    if (!room) return json({ success: false, error: 'Room not found' }, 404)
    if (room.created_by !== userId) return json({ success: false, error: 'Permission denied' }, 403)
    await run(c.env.SCP_DB, 'DELETE FROM chat_rooms WHERE id = ?', [roomId])
    return json({ success: true })
  })

  app.post('/chat/nickname', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ nickname?: string }>(c.req.raw)
    const nickname = cleanText(body?.nickname, 30)
    if (!nickname) return json({ code: 'VALIDATION_ERROR', message: 'Missing nickname' }, 400)
    await run(c.env.SCP_DB, 'INSERT OR REPLACE INTO user_settings (key, value, updatedAt) VALUES (?, ?, ?)', [`nickname_${userId}`, nickname, new Date().toISOString()])
    return json({ success: true })
  })

  app.post('/chat/broadcast', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    return json(await broadcastMessages(c.env.SCP_DB))
  })
}

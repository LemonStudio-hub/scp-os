import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AdminSession, Env, SCPData } from './types'
import { all, count, first, logAdmin, run } from './db'
import { cleanText, cors, intValue, json, readJson, requestInfo } from './http'
import { adminFromRequest, hasRole, signJwt, userFromRequest, verifyPassword } from './security'

type AppEnv = { Bindings: Env }
type Ctx = Context<AppEnv>
type RouteHandler = (c: Ctx) => Response | Promise<Response>

const adminSecret = (env: Env) => env.ADMIN_JWT_SECRET || env.JWT_SECRET || 'admin-secret-key'

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>()
  app.use('*', cors)

  app.use('*', async (c, next) => {
    const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET)
    const ok = await rateLimit(c.env, id || requestInfo(c.req.raw).ip)
    if (!ok) return json({ code: 'RATE_LIMITED', message: 'Rate limit exceeded' }, 429)
    await next()
  })

  app.get('/', (c) => json({
    name: 'SCP Scraper Worker',
    version: '3.0.0',
    status: 'online',
    endpoints: {
      '/scrape?number={number}': 'Get SCP data',
      '/search?keyword={keyword}&clearance_level={level}': 'Search SCP data',
      '/list?limit={limit}&offset={offset}&clearance_level={level}': 'List SCP records',
      '/stats': 'Database statistics',
      '/debug?number={number}': 'Raw HTML debug fetch',
      '/performance': 'Performance metrics',
      '/chat/send': 'Send chat message',
      '/chat/messages': 'List chat messages',
      '/chat/rooms': 'List or create chat rooms',
      '/feedback/list-with-votes': 'Feedback list with vote state',
      '/docs/items': 'Reader item list',
      '/notifications': 'User notification list',
      '/api/admin/login': 'Admin login',
    },
  }))

  app.get('/scrape', async (c) => {
    const number = c.req.query('number')
    if (!number) return json({ code: 'VALIDATION_ERROR', message: 'Missing number parameter', details: { field: 'number' } }, 400)
    return json(await scrape(c.env, number, c.req.query('branch') || 'en'))
  })

  app.get('/search', async (c) => {
    const keyword = c.req.query('keyword')
    if (!keyword) return json({ code: 'VALIDATION_ERROR', message: 'Missing keyword parameter', details: { field: 'keyword' } }, 400)
    const clearance = c.req.query('clearance_level')
    if (clearance) {
      const data = await searchIndex(c.env.SCP_DB, keyword, Number(clearance))
      return json({ success: true, data })
    }
    const data = await searchIndex(c.env.SCP_DB, keyword)
    if (data.length) return json({ success: true, data })
    return json(await scrape(c.env, keyword.replace(/^SCP-/i, ''), c.req.query('branch') || 'en'))
  })

  app.get('/list', async (c) => {
    const limit = intValue(c.req.query('limit'), 100, 500)
    const offset = intValue(c.req.query('offset'), 0)
    const clearance = c.req.query('clearance_level')
    const where = clearance ? 'clearance_level <= ?' : '1=1'
    const params = clearance ? [Number(clearance)] : []
    const data = await all(c.env.SCP_DB, `SELECT scp_id, name, object_class, tags, clearance_level, updated_at FROM scp_index WHERE ${where} ORDER BY scp_id ASC LIMIT ? OFFSET ?`, [...params, limit, offset])
    const total = await count(c.env.SCP_DB, 'scp_index', where, params)
    return json({ success: true, data, total })
  })

  app.get('/stats', async (c) => json({ success: true, stats: await scpStats(c.env.SCP_DB) }))

  app.get('/debug', async (c) => {
    const number = c.req.query('number') || '173'
    const branch = c.req.query('branch') || 'en'
    const url = scpUrl(number, branch)
    try {
      const response = await fetch(url)
      return json({ success: response.ok, html: await response.text(), error: response.ok ? undefined : response.statusText })
    } catch (error) {
      return json({ success: false, error: (error as Error).message }, 502)
    }
  })

  app.get('/image-proxy', async (c) => {
    const value = c.req.query('url')
    if (!value) return json({ code: 'VALIDATION_ERROR', message: 'Missing url parameter', details: { field: 'url' } }, 400)
    try {
      const target = new URL(value)
      const allowed = ['wikidot.com', 'wdfiles.com', 'scpfoundation.ru']
      if (!allowed.some((host) => target.hostname === host || target.hostname.endsWith(`.${host}`))) {
        return json({ code: 'VALIDATION_ERROR', message: 'Image host not allowed', details: { host: target.hostname } }, 403)
      }
      const response = await fetch(target.toString(), { headers: { Referer: target.origin, 'User-Agent': 'Mozilla/5.0 SCP-OS' } })
      if (!response.ok) return json({ code: 'UPSTREAM_ERROR', message: 'Failed to fetch image' }, response.status)
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch {
      return json({ code: 'UPSTREAM_ERROR', message: 'Image proxy failed' }, 502)
    }
  })

  registerChat(app)
  registerFeedback(app)
  registerUsers(app)
  registerPerformance(app)
  registerDocs(app)
  registerNotifications(app)
  registerAdmin(app)
  registerFiles(app)

  app.notFound(() => json({ code: 'INTERNAL_ERROR', message: 'Not found' }, 404))
  app.onError((error) => {
    console.error(error)
    return json({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500)
  })

  return app
}

function registerChat(app: Hono<AppEnv>): void {
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
    if (roomId) {
      where.push('room_id = ?')
      params.push(Number(roomId))
    }
    if (after) {
      where.push('created_at > ?')
      params.push(after)
    }
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

function registerFeedback(app: Hono<AppEnv>): void {
  app.post('/feedback/submit', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ title?: string; content?: string; category?: string; nickname?: string }>(c.req.raw)
    const title = cleanText(body?.title, 100)
    const content = cleanText(body?.content, 2000)
    if (!title || !content) return json({ code: 'VALIDATION_ERROR', message: 'Missing required fields' }, 400)
    const category = ['general', 'bug', 'feature', 'improvement', 'other'].includes(body?.category || '') ? body?.category : 'general'
    const result = await run(c.env.SCP_DB, 'INSERT INTO feedbacks (user_id, nickname, title, content, category) VALUES (?, ?, ?, ?, ?)', [userId, cleanText(body?.nickname || 'Anonymous', 30), title, content, category])
    const row = await first<Record<string, unknown>>(c.env.SCP_DB, 'SELECT * FROM feedbacks WHERE id = ?', [result.meta?.last_row_id])
    return json({ success: true, data: row ? normalizeFeedback(row) : null }, 201)
  })

  const list = async (c: Ctx, withVotes = false) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const offset = intValue(c.req.query('offset'), 0)
    const category = c.req.query('category')
    const where = ['status = ?']
    const params: unknown[] = ['published']
    if (category && category !== 'all') {
      where.push('category = ?')
      params.push(category)
    }
    const rows = await all<Record<string, unknown>>(c.env.SCP_DB, `SELECT * FROM feedbacks WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
    const data = rows.map(normalizeFeedback)
    if (withVotes && c.req.query('user_id') && data.length) {
      const ids = data.map((item) => item.id)
      const votes = await all<{ feedback_id: number; vote: 'up' | 'down' }>(c.env.SCP_DB, `SELECT feedback_id, vote FROM feedback_votes WHERE user_id = ? AND feedback_id IN (${ids.map(() => '?').join(',')})`, [c.req.query('user_id'), ...ids])
      const map = new Map(votes.map((vote) => [vote.feedback_id, vote.vote]))
      for (const item of data) item.userVote = map.get(item.id)
    }
    const total = await count(c.env.SCP_DB, 'feedbacks', where.join(' AND '), params)
    return json({ success: true, data, count: total })
  }
  app.get('/feedback/list', (c) => list(c))
  app.get('/feedback', (c) => list(c))
  app.get('/v1/feedback', (c) => list(c))
  app.get('/feedback/list-with-votes', (c) => list(c, true))

  app.post('/feedback/like', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ id?: number }>(c.req.raw)
    if (!body?.id) return json({ code: 'VALIDATION_ERROR', message: 'Missing feedback id' }, 400)
    await run(c.env.SCP_DB, 'UPDATE feedbacks SET upvotes = upvotes + 1 WHERE id = ?', [body.id])
    const row = await first<{ upvotes: number }>(c.env.SCP_DB, 'SELECT upvotes FROM feedbacks WHERE id = ?', [body.id])
    return json({ success: true, data: { id: body.id, likes: row?.upvotes || 0 } })
  })

  app.get('/feedback/categories', async (c) => {
    const rows = await all(c.env.SCP_DB, `SELECT category, COUNT(*) as count FROM feedbacks WHERE status = 'published' GROUP BY category ORDER BY count DESC`)
    return json({ success: true, data: rows })
  })

  app.post('/feedback/comment', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ feedback_id?: number; content?: string; nickname?: string }>(c.req.raw)
    const content = cleanText(body?.content, 500)
    if (!body?.feedback_id || !content) return json({ code: 'VALIDATION_ERROR', message: 'Missing required fields' }, 400)
    const exists = await first(c.env.SCP_DB, 'SELECT id FROM feedbacks WHERE id = ? AND status = ?', [body.feedback_id, 'published'])
    if (!exists) return json({ success: false, error: 'Feedback not found' }, 404)
    const nickname = cleanText(body.nickname || 'Anonymous', 30)
    const inserted = await run(c.env.SCP_DB, 'INSERT INTO feedback_comments (feedback_id, user_id, nickname, content) VALUES (?, ?, ?, ?)', [body.feedback_id, userId, nickname, content])
    await run(c.env.SCP_DB, 'UPDATE feedbacks SET commentsCount = commentsCount + 1 WHERE id = ?', [body.feedback_id])
    const comment = await first(c.env.SCP_DB, 'SELECT * FROM feedback_comments WHERE id = ?', [inserted.meta?.last_row_id])
    const feedback = await first<{ user_id: string; title: string }>(c.env.SCP_DB, 'SELECT user_id, title FROM feedbacks WHERE id = ?', [body.feedback_id])
    if (feedback) {
      await createNotification(c.env.SCP_DB, feedback.user_id, userId, nickname, 'feedback_comment', `New comment on "${feedback.title}"`, content, String(body.feedback_id), 'feedback')
    }
    return json({ success: true, data: comment }, 201)
  })

  app.get('/feedback/comments', async (c) => {
    const feedbackId = intValue(c.req.query('feedback_id'), 0)
    if (!feedbackId) return json({ code: 'VALIDATION_ERROR', message: 'Missing feedback_id parameter' }, 400)
    const rows = await all(c.env.SCP_DB, 'SELECT * FROM feedback_comments WHERE feedback_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?', [feedbackId, intValue(c.req.query('limit'), 50), intValue(c.req.query('offset'), 0)])
    return json({ success: true, data: rows })
  })

  app.post('/feedback/vote', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const body = await readJson<{ id?: number; vote?: 'up' | 'down' }>(c.req.raw)
    if (!body?.id || (body.vote !== 'up' && body.vote !== 'down')) return json({ code: 'VALIDATION_ERROR', message: 'Missing or invalid required fields' }, 400)
    const existing = await first<{ id: number; vote: 'up' | 'down' }>(c.env.SCP_DB, 'SELECT id, vote FROM feedback_votes WHERE feedback_id = ? AND user_id = ?', [body.id, userId])
    if (existing?.vote === body.vote) {
      await run(c.env.SCP_DB, 'DELETE FROM feedback_votes WHERE id = ?', [existing.id])
      await run(c.env.SCP_DB, `UPDATE feedbacks SET ${body.vote === 'up' ? 'upvotes' : 'downvotes'} = MAX(0, ${body.vote === 'up' ? 'upvotes' : 'downvotes'} - 1) WHERE id = ?`, [body.id])
      return json({ success: true, data: { id: body.id, vote: null, action: 'removed' } })
    }
    if (existing) {
      await run(c.env.SCP_DB, 'UPDATE feedback_votes SET vote = ? WHERE id = ?', [body.vote, existing.id])
      return json({ success: true, data: { id: body.id, vote: body.vote, action: 'changed' } })
    }
    await run(c.env.SCP_DB, 'INSERT INTO feedback_votes (feedback_id, user_id, vote) VALUES (?, ?, ?)', [body.id, userId, body.vote])
    await run(c.env.SCP_DB, `UPDATE feedbacks SET ${body.vote === 'up' ? 'upvotes' : 'downvotes'} = ${body.vote === 'up' ? 'upvotes' : 'downvotes'} + 1 WHERE id = ?`, [body.id])
    const feedback = await first<{ user_id: string; title: string }>(c.env.SCP_DB, 'SELECT user_id, title FROM feedbacks WHERE id = ?', [body.id])
    if (feedback) {
      const voter = await first<{ nickname: string }>(c.env.SCP_DB, 'SELECT nickname FROM users WHERE user_id = ?', [userId])
      const type = body.vote === 'up' ? 'feedback_upvote' : 'feedback_downvote'
      await createNotification(c.env.SCP_DB, feedback.user_id, userId, voter?.nickname || 'Anonymous', type, `New ${body.vote}vote on "${feedback.title}"`, `${voter?.nickname || 'Anonymous'} ${body.vote}voted your feedback`, String(body.id), 'feedback')
    }
    return json({ success: true, data: { id: body.id, vote: body.vote, action: 'added' } })
  })
}

function registerUsers(app: Hono<AppEnv>): void {
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

function registerPerformance(app: Hono<AppEnv>): void {
  app.post('/performance', async (c) => {
    const body = await readJson(c.req.raw)
    if (!body) return json({ code: 'VALIDATION_ERROR', message: 'Invalid request body' }, 400)
    await run(c.env.SCP_DB, 'INSERT INTO performance_metrics (data, created_at) VALUES (?, ?)', [JSON.stringify(body), Date.now()])
    await run(c.env.SCP_DB, 'DELETE FROM performance_metrics WHERE created_at < ?', [Date.now() - 3600000])
    return json({ success: true, message: 'Performance metrics received', timestamp: Date.now() })
  })
  app.get('/performance', async (c) => {
    const rows = await all<{ data: string }>(c.env.SCP_DB, 'SELECT data FROM performance_metrics ORDER BY created_at DESC LIMIT ?', [intValue(c.req.query('limit'), 10, 100)])
    return json({ success: true, metrics: rows.map((row) => safeParse(row.data)), count: rows.length })
  })
}

function registerDocs(app: Hono<AppEnv>): void {
  app.get('/docs/items', async (c) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const offset = intValue(c.req.query('offset'), 0)
    const filters: string[] = ['1=1']
    const params: unknown[] = []
    const mappings: [string, string][] = [['scp_class', 'object_class'], ['clearance_level', 'clearance_level'], ['tag', 'tags'], ['series', 'series']]
    for (const [query, column] of mappings) {
      const value = c.req.query(query)
      if (!value) continue
      filters.push(column === 'tags' ? `${column} LIKE ?` : `${column} = ?`)
      params.push(column === 'tags' ? `%${value}%` : value)
    }
    const q = c.req.query('q')
    if (q) {
      filters.push('(title LIKE ? OR scp_number LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }
    const where = filters.join(' AND ')
    const data = await all(c.env.SCP_READER_DB, `SELECT * FROM scp_items WHERE ${where} ORDER BY CAST(scp_number AS INTEGER) ASC LIMIT ? OFFSET ?`, [...params, limit, offset])
    const total = await count(c.env.SCP_READER_DB, 'scp_items', where, params)
    return json({ success: true, data, pagination: { total, limit, offset, has_more: offset + limit < total } })
  })
  app.get('/docs/item/:scpNumber', async (c) => {
    const value = c.req.param('scpNumber')
    const row = await first(c.env.SCP_READER_DB, 'SELECT * FROM scp_items WHERE scp_number = ? OR CAST(scp_number AS INTEGER) = ?', [value, Number(value)])
    return row ? json({ success: true, data: row }) : json({ success: false, error: 'SCP item not found' }, 404)
  })
  app.get('/docs/content/:scpNumber', async (c) => {
    const value = c.req.param('scpNumber')
    const row = await first<{ content?: string; content_file?: string }>(c.env.SCP_READER_DB, 'SELECT content, content_file FROM scp_items WHERE scp_number = ? OR CAST(scp_number AS INTEGER) = ?', [value, Number(value)])
    if (!row?.content) return json({ success: false, error: 'Content not available' }, 404)
    return json({ success: true, data: { scp_number: value, content: row.content, cached: true, source: 'd1' } })
  })
  listDocTable(app, '/docs/tales', 'scp_tales', 'created_at DESC')
  listDocTable(app, '/docs/hubs', 'scp_hubs', 'title ASC')
}

function registerNotifications(app: Hono<AppEnv>): void {
  app.get('/notifications', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const unread = c.req.query('unread') === 'true'
    const where = unread ? 'recipient_user_id = ? AND is_read = 0' : 'recipient_user_id = ?'
    const params: unknown[] = [userId]
    const rows = await all(c.env.SCP_DB, `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, intValue(c.req.query('limit'), 50), intValue(c.req.query('offset'), 0)])
    const total = await count(c.env.SCP_DB, 'notifications', where, params)
    const unreadCount = await count(c.env.SCP_DB, 'notifications', 'recipient_user_id = ? AND is_read = 0', [userId])
    return json({ success: true, data: rows, count: rows.length, total, unreadCount })
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

function registerAdmin(app: Hono<AppEnv>): void {
  routePost(app, ['/admin/auth/login', '/api/admin/login'], async (c) => {
    const body = await readJson<{ username?: string; password?: string }>(c.req.raw)
    if (!body?.username || !body.password) return json({ success: false, error: 'Please provide username and password' }, 400)
    const admin = await first<{ id: number; username: string; password_hash: string; role: 'super_admin' | 'admin' | 'moderator'; is_active: number }>(c.env.SCP_DB, 'SELECT * FROM admin_users WHERE username = ? AND is_active = 1', [body.username.trim()])
    if (!admin || !(await verifyPassword(body.password, admin.password_hash))) return json({ success: false, error: 'Username or password is incorrect' }, 401)
    await run(c.env.SCP_DB, 'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [admin.id])
    await logAdmin(c.env.SCP_DB, admin.id, admin.username, 'login', '', '', '', requestInfo(c.req.raw).ip)
    const token = await signJwt({ adminId: admin.id, username: admin.username, role: admin.role }, adminSecret(c.env), 8 * 60 * 60)
    return json({ success: true, token, admin: { id: admin.id, username: admin.username, role: admin.role } })
  })

  routeGet(app, ['/admin/auth/verify', '/api/admin/verify'], async (c) => {
    const admin = await requiredAdmin(c)
    if (admin instanceof Response) return admin
    return json({ success: true, admin })
  })

  app.use('/admin/*', adminMiddleware)
  app.use('/api/admin/*', adminMiddleware)

  routeGet(app, ['/admin/users', '/api/admin/users'], async (c) => adminList(c, 'users', ['id', 'user_id', 'nickname', 'created_at', 'last_active_at', 'is_banned', 'ban_reason', 'banned_at'], 'created_at DESC'))
  routeGet(app, ['/admin/users/export', '/api/admin/users/export'], async (c) => adminExport(c, 'users'))
  routeGet(app, ['/admin/users/:id', '/api/admin/users/:id'], async (c) => itemById(c, 'users'))
  routePost(app, ['/admin/users/batch', '/api/admin/users/batch'], async (c) => batchUsers(c))
  routePost(app, ['/admin/users/:id/ban', '/api/admin/users/:id/ban'], async (c) => setUserBan(c, true))
  routePost(app, ['/admin/users/:id/unban', '/api/admin/users/:id/unban'], async (c) => setUserBan(c, false))
  routeDelete(app, ['/admin/users/:id', '/api/admin/users/:id'], async (c) => deleteById(c, 'users'))

  routeGet(app, ['/admin/content/:type/export', '/api/admin/content/:type/export'], async (c) => adminExport(c, contentTable(c.req.param('type') || '')))
  routeGet(app, ['/admin/content/:type', '/api/admin/content/:type'], async (c) => adminList(c, contentTable(c.req.param('type') || ''), undefined, 'id DESC'))
  routePut(app, ['/admin/content/:type/:id', '/api/admin/content/:type/:id'], async (c) => updateById(c, contentTable(c.req.param('type') || '')))
  routeDelete(app, ['/admin/content/:type/:id', '/api/admin/content/:type/:id'], async (c) => deleteById(c, contentTable(c.req.param('type') || '')))
  routePost(app, ['/admin/content/:type/batch', '/api/admin/content/:type/batch'], async (c) => batchContent(c, contentTable(c.req.param('type') || '')))
  routePost(app, ['/admin/content/:type/import', '/api/admin/content/:type/import'], async (c) => importContent(c, contentTable(c.req.param('type') || '')))

  routeGet(app, ['/admin/chat/messages', '/api/admin/chat/messages'], async (c) => adminList(c, 'chat_messages', undefined, 'created_at DESC'))
  routeDelete(app, ['/admin/chat/messages/:id', '/api/admin/chat/messages/:id'], async (c) => deleteById(c, 'chat_messages'))
  routeGet(app, ['/admin/chat/rooms', '/api/admin/chat/rooms'], async (c) => adminList(c, 'chat_rooms', undefined, 'id ASC'))
  routePut(app, ['/admin/chat/rooms/:id', '/api/admin/chat/rooms/:id'], async (c) => updateById(c, 'chat_rooms'))
  routeDelete(app, ['/admin/chat/rooms/:id', '/api/admin/chat/rooms/:id'], async (c) => deleteById(c, 'chat_rooms'))

  routeGet(app, ['/admin/feedback', '/api/admin/feedback'], async (c) => adminList(c, 'feedbacks', undefined, 'created_at DESC'))
  routePut(app, ['/admin/feedback/:id/status', '/api/admin/feedback/:id/status'], async (c) => {
    const body = await readJson<{ status?: string }>(c.req.raw)
    await run(c.env.SCP_DB, 'UPDATE feedbacks SET status = ? WHERE id = ?', [body?.status || 'published', Number(c.req.param('id'))])
    return json({ success: true })
  })
  routeDelete(app, ['/admin/feedback/:id', '/api/admin/feedback/:id'], async (c) => deleteById(c, 'feedbacks'))

  routeGet(app, ['/admin/settings', '/api/admin/settings'], async (c) => json({ success: true, data: await all(c.env.SCP_DB, 'SELECT * FROM system_settings ORDER BY key ASC') }))
  routePut(app, ['/admin/settings', '/api/admin/settings'], async (c) => {
    const admin = await requiredAdmin(c)
    if (admin instanceof Response) return admin
    if (!hasRole(admin, ['super_admin'])) return json({ success: false, error: 'Permission denied' }, 403)
    const body = await readJson<Record<string, string>>(c.req.raw) || {}
    for (const [key, value] of Object.entries(body)) await run(c.env.SCP_DB, 'INSERT INTO system_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by', [key, String(value), admin.username])
    return json({ success: true })
  })
  routeGet(app, ['/admin/stats/dashboard', '/api/admin/stats'], async (c) => json({ success: true, data: await dashboardStats(c.env.SCP_DB) }))
  routeGet(app, ['/admin/stats/trends', '/api/admin/stats/trend'], async (c) => json({ success: true, data: await trendData(c.env.SCP_DB, intValue(c.req.query('days'), 30, 365)) }))
  routeGet(app, ['/admin/logs', '/api/admin/logs'], async (c) => adminList(c, 'admin_logs', undefined, 'created_at DESC'))
}

function routeGet(app: Hono<AppEnv>, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.get(path, handler)
}

function routePost(app: Hono<AppEnv>, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.post(path, handler)
}

function routePut(app: Hono<AppEnv>, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.put(path, handler)
}

function routeDelete(app: Hono<AppEnv>, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.delete(path, handler)
}

function registerFiles(app: Hono<AppEnv>): void {
  app.post('/files/upload', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const path = (formData.get('path') as string) || ''
    if (!file) return json({ code: 'VALIDATION_ERROR', message: 'No file provided' }, 400)
    const safePath = path.replace(/^\/+/, '') || file.name
    const key = `users/${userId}/files/${safePath}`
    const prefix = `users/${userId}/files/`
    const listResult = await c.env.SCP_FILES.list({ prefix, limit: 1000 })
    const usedSize = listResult.objects.reduce((sum, obj) => sum + obj.size, 0)
    const maxSize = 100 * 1024 * 1024
    if (usedSize + file.size > maxSize) {
      return json({ success: false, error: 'Storage quota exceeded (max 100MB)' }, 413)
    }
    await c.env.SCP_FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { userId, path: safePath, originalName: file.name, uploadedAt: new Date().toISOString() },
    })
    return json({ success: true, data: { key: safePath, size: file.size, path: safePath } })
  })

  app.get('/files', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const prefix = `users/${userId}/files/`
    const listResult = await c.env.SCP_FILES.list({ prefix, limit: 1000 })
    const files = listResult.objects.map((obj) => ({
      key: obj.key.replace(prefix, ''),
      size: obj.size,
      uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString(),
      contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
    }))
    return json({ success: true, data: files, count: files.length })
  })

  app.get('/files/quota', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const prefix = `users/${userId}/files/`
    const listResult = await c.env.SCP_FILES.list({ prefix, limit: 1000 })
    const used = listResult.objects.reduce((sum, obj) => sum + obj.size, 0)
    const max = 100 * 1024 * 1024
    return json({ success: true, data: { used, max, percent: Math.round((used / max) * 100), count: listResult.objects.length } })
  })

  app.get('/files/:key', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const key = `users/${userId}/files/${c.req.param('key')}`
    const obj = await c.env.SCP_FILES.get(key)
    if (!obj) return json({ code: 'NOT_FOUND', message: 'File not found' }, 404)
    return new Response(obj.body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': String(obj.size),
      },
    })
  })

  app.put('/files/:key', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const oldKey = `users/${userId}/files/${c.req.param('key')}`
    const body = await readJson<{ path?: string }>(c.req.raw)
    const newPath = body?.path?.replace(/^\/+/, '')
    if (!newPath) return json({ code: 'VALIDATION_ERROR', message: 'Missing path' }, 400)
    const newKey = `users/${userId}/files/${newPath}`
    const obj = await c.env.SCP_FILES.get(oldKey)
    if (!obj) return json({ code: 'NOT_FOUND', message: 'File not found' }, 404)
    await c.env.SCP_FILES.put(newKey, obj.body, { httpMetadata: obj.httpMetadata, customMetadata: obj.customMetadata })
    await c.env.SCP_FILES.delete(oldKey)
    return json({ success: true, data: { key: newPath } })
  })

  app.delete('/files/:key', async (c) => {
    const userId = await requiredUser(c)
    if (userId instanceof Response) return userId
    const key = `users/${userId}/files/${c.req.param('key')}`
    await c.env.SCP_FILES.delete(key)
    return json({ success: true })
  })
}

async function adminMiddleware(c: Ctx, next: () => Promise<void>): Promise<Response | void> {
  const admin = await requiredAdmin(c)
  if (admin instanceof Response) return admin
  await next()
}

async function requiredUser(c: Ctx): Promise<string | Response> {
  const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET)
  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401)
}

async function requiredAdmin(c: Ctx): Promise<AdminSession | Response> {
  const session = await adminFromRequest(c.req.raw, adminSecret(c.env))
  if (!session) return json({ success: false, error: 'Please login to admin panel' }, 401)
  const row = await first<{ id: number }>(c.env.SCP_DB, 'SELECT id FROM admin_users WHERE id = ? AND is_active = 1', [session.adminId])
  return row ? session : json({ success: false, error: 'Admin account disabled' }, 403)
}

async function rateLimit(env: Env, identifier: string): Promise<boolean> {
  if (!env.SCP_DB) return true
  const now = Date.now()
  const windowMs = 60_000
  const max = 120
  try {
    const row = await first<{ timestamps: string }>(env.SCP_DB, 'SELECT timestamps FROM rate_limits WHERE identifier = ?', [identifier])
    const timestamps = (row ? safeParse(row.timestamps) : []) as number[]
    const active = timestamps.filter((time) => now - time < windowMs)
    if (active.length >= max) return false
    active.push(now)
    await run(env.SCP_DB, 'INSERT OR REPLACE INTO rate_limits (identifier, timestamps) VALUES (?, ?)', [identifier, JSON.stringify(active)])
  } catch {
  }
  return true
}

async function chatRateLimit(db: D1Database, userId: string): Promise<{ allowed: boolean }> {
  const row = await first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND created_at > ?', [userId, new Date(Date.now() - 60_000).toISOString()])
  return { allowed: (row?.count || 0) < 10 }
}

async function userSetting(db: D1Database, key: string): Promise<string | null> {
  return (await first<{ value: string }>(db, 'SELECT value FROM user_settings WHERE key = ?', [key]))?.value || null
}

async function broadcastMessages(db: D1Database): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const rows = await all(db, 'SELECT id FROM chat_messages WHERE is_broadcast = 0')
    await run(db, 'UPDATE chat_messages SET is_broadcast = 1, broadcast_count = broadcast_count + 1 WHERE is_broadcast = 0')
    return { success: true, count: rows.length }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

async function scrape(env: Env, number: string, branch: string): Promise<{ success: boolean; data?: SCPData; error?: string; cached?: boolean }> {
  const id = number.replace(/^SCP-/i, '').padStart(3, '0')
  const key = `scp-${branch}-${id}`
  try {
    const cached = await first<{ value: string }>(env.SCP_DB, 'SELECT value FROM cache_entries WHERE key = ? AND expires_at > ?', [key, Date.now()])
    if (cached) return { success: true, data: safeParse(cached.value) as SCPData, cached: true }
  } catch {
  }
  const url = scpUrl(id, branch)
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 SCP-OS', Referer: url } })
    if (!response.ok) return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    const html = await response.text()
    const data = parseScp(html, id, url)
    try {
      await run(env.SCP_DB, 'INSERT OR REPLACE INTO cache_entries (key, value, expires_at) VALUES (?, ?, ?)', [key, JSON.stringify(data), Date.now() + 30 * 60_000])
    } catch {
    }
    return { success: true, data }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

function scpUrl(number: string, branch: string): string {
  const base = branch === 'cn' ? 'https://scp-wiki-cn.wikidot.com' : 'https://scp-wiki.wikidot.com'
  return `${base}/scp-${number}`
}

function parseScp(html: string, number: string, url: string): SCPData {
  const text = stripHtml(html)
  const objectClass = /Object\s+Class[:\s]+([A-Za-z]+)/i.exec(text)?.[1]?.toUpperCase() || 'UNKNOWN'
  const parts = text.split(/Special Containment Procedures:?|Description:?/i).map((part) => part.trim()).filter(Boolean)
  return {
    id: `SCP-${number}`,
    name: /<title>(.*?)<\/title>/i.exec(html)?.[1]?.replace(/\s*-\s*SCP Foundation.*$/i, '') || `SCP-${number}`,
    objectClass,
    containment: parts[1] ? [parts[1].slice(0, 2000)] : [],
    description: parts[2] ? [parts[2].slice(0, 3000)] : [],
    appendix: [],
    url,
  }
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function searchIndex(db: D1Database, keyword: string, clearance?: number): Promise<unknown[]> {
  const where = clearance === undefined ? '(name LIKE ? OR tags LIKE ?)' : '(name LIKE ? OR tags LIKE ?) AND clearance_level <= ?'
  const like = `%${keyword}%`
  const params = clearance === undefined ? [like, like] : [like, like, clearance]
  return all(db, `SELECT scp_id, name, object_class, tags, clearance_level, updated_at FROM scp_index WHERE ${where} ORDER BY scp_id ASC LIMIT 20`, params)
}

async function scpStats(db: D1Database): Promise<unknown> {
  const classes = await all<{ object_class: string; count: number }>(db, 'SELECT object_class, COUNT(*) as count FROM scp_index GROUP BY object_class')
  const clearances = await all<{ clearance_level: number; count: number }>(db, 'SELECT clearance_level, COUNT(*) as count FROM scp_index GROUP BY clearance_level')
  return {
    total: await count(db, 'scp_index'),
    byClass: Object.fromEntries(classes.map((row) => [row.object_class, row.count])),
    byClearance: Object.fromEntries(clearances.map((row) => [row.clearance_level, row.count])),
  }
}

function normalizeFeedback(row: Record<string, unknown>): Record<string, unknown> & { id: number; userVote?: 'up' | 'down' } {
  return {
    ...row,
    id: Number(row.id),
    comments_count: row.commentsCount ?? row.comments_count ?? 0,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
  }
}

function listDocTable(app: Hono<AppEnv>, path: string, table: string, order: string): void {
  app.get(path, async (c) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const offset = intValue(c.req.query('offset'), 0)
    const rows = await all(c.env.SCP_READER_DB, `SELECT * FROM ${table} ORDER BY ${order} LIMIT ? OFFSET ?`, [limit, offset])
    const total = await count(c.env.SCP_READER_DB, table)
    return json({ success: true, data: rows, pagination: { total, limit, offset, has_more: offset + limit < total } })
  })
}

function defaultNotificationPreferences(userId: string): Record<string, unknown> {
  return { user_id: userId, feedback_comment: 1, feedback_upvote: 1, feedback_downvote: 1, chat_message: 1 }
}

async function createNotification(
  db: D1Database,
  recipientUserId: string,
  actorUserId: string,
  actorNickname: string,
  type: 'feedback_comment' | 'feedback_upvote' | 'feedback_downvote' | 'chat_message',
  title: string,
  body: string,
  referenceId: string,
  referenceType: string,
): Promise<void> {
  if (recipientUserId === actorUserId) return
  const prefs = await first<{ [key: string]: number }>(db, 'SELECT * FROM notification_preferences WHERE user_id = ?', [recipientUserId])
  const enabled = prefs?.[type] ?? 1
  if (!enabled) return
  await run(db, 'INSERT INTO notifications (recipient_user_id, actor_user_id, actor_nickname, type, title, body, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [recipientUserId, actorUserId, actorNickname, type, title, body, referenceId, referenceType])
}

async function adminList(c: Ctx, table: string, columns?: string[], order = 'id DESC'): Promise<Response> {
  const limit = intValue(c.req.query('limit'), 20, 200)
  const offset = intValue(c.req.query('offset'), 0)
  const search = c.req.query('search')
  const where: string[] = ['1=1']
  const params: unknown[] = []
  if (search) {
    where.push('(CAST(id AS TEXT) LIKE ? OR name LIKE ? OR title LIKE ? OR nickname LIKE ? OR username LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
  }
  const list = columns?.join(', ') || '*'
  const sql = `SELECT ${list} FROM ${safeTable(table)} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`
  try {
    const data = await all(c.env.SCP_DB, sql, [...params, limit, offset])
    const total = await count(c.env.SCP_DB, safeTable(table), where.join(' AND '), params)
    return json({ success: true, data, total })
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, 500)
  }
}

async function itemById(c: Ctx, table: string): Promise<Response> {
  const row = await first(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))])
  return row ? json({ success: true, data: row }) : json({ success: false, error: 'Not found' }, 404)
}

function convertToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '﻿'
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '')
          if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`
          return val
        })
        .join(','),
    ),
  ]
  return '﻿' + lines.join('\n')
}

async function adminExport(c: Ctx, table: string): Promise<Response> {
  const format = c.req.query('format') || 'json'
  if (format !== 'json' && format !== 'csv') {
    return json({ success: false, error: 'Invalid format. Use json or csv' }, 400)
  }
  const data = await all<Record<string, unknown>>(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} LIMIT 10000`)
  if (format === 'csv') {
    return json({ success: true, data: convertToCsv(data), format: 'csv' })
  }
  return json({ success: true, data, format: 'json' })
}

async function updateById(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<Record<string, unknown>>(c.req.raw) || {}
  const entries = Object.entries(body).filter(([key]) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
  if (!entries.length) return json({ success: true })
  await run(c.env.SCP_DB, `UPDATE ${safeTable(table)} SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE id = ?`, [...entries.map(([, value]) => value), Number(c.req.param('id'))])
  return json({ success: true, data: await first(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))]) })
}

async function deleteById(c: Ctx, table: string): Promise<Response> {
  await run(c.env.SCP_DB, `DELETE FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))])
  return json({ success: true })
}

async function batchUsers(c: Ctx): Promise<Response> {
  const body = await readJson<{ action?: string; ids?: number[] }>(c.req.raw)
  for (const id of body?.ids || []) {
    if (body?.action === 'ban') await run(c.env.SCP_DB, 'UPDATE users SET is_banned = 1 WHERE id = ?', [id])
    if (body?.action === 'unban') await run(c.env.SCP_DB, 'UPDATE users SET is_banned = 0, ban_reason = NULL, banned_at = NULL WHERE id = ?', [id])
    if (body?.action === 'delete') await run(c.env.SCP_DB, 'DELETE FROM users WHERE id = ?', [id])
  }
  return json({ success: true })
}

async function batchContent(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<{ action?: string; ids?: number[]; status?: string; category?: string }>(c.req.raw)
  const action = body?.action
  const ids = body?.ids || []
  const supportedActions = ['delete', 'update_status', 'move_category']

  if (!action || !supportedActions.includes(action)) {
    return json({ success: false, error: `Unsupported action. Supported: ${supportedActions.join(', ')}` }, 400)
  }
  if (!ids.length) {
    return json({ success: false, error: 'No IDs provided' }, 400)
  }

  const safe = safeTable(table)
  try {
    if (action === 'delete') {
      for (const id of ids) await run(c.env.SCP_DB, `DELETE FROM ${safe} WHERE id = ?`, [id])
    } else if (action === 'update_status') {
      const status = body?.status
      if (!status) return json({ success: false, error: 'Missing status parameter' }, 400)
      for (const id of ids) await run(c.env.SCP_DB, `UPDATE ${safe} SET status = ? WHERE id = ?`, [status, id])
    } else if (action === 'move_category') {
      const category = body?.category
      if (!category) return json({ success: false, error: 'Missing category parameter' }, 400)
      for (const id of ids) await run(c.env.SCP_DB, `UPDATE ${safe} SET category = ? WHERE id = ?`, [category, id])
    }
    return json({ success: true })
  } catch (error) {
    const msg = (error as Error).message || ''
    if (msg.includes('no such column')) {
      return json({ success: false, error: `Table ${safe} does not support ${action}` }, 400)
    }
    return json({ success: false, error: msg }, 500)
  }
}

interface ImportSchema {
  required: string[]
  uniqueField?: string
}

const importSchemas: Record<string, ImportSchema> = {
  scp_items: { required: ['scp_number', 'title'], uniqueField: 'scp_number' },
  scp_tales: { required: ['link', 'title'], uniqueField: 'link' },
  scp_goi: { required: ['link', 'title'], uniqueField: 'link' },
  scp_hubs: { required: ['link', 'title'], uniqueField: 'link' },
  feedbacks: { required: ['user_id', 'title', 'content'] },
}

function validateImportRow(row: Record<string, unknown>, schema: ImportSchema): { valid: boolean; error?: string } {
  for (const field of schema.required) {
    const value = row[field]
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }
  const illegalKeys = Object.keys(row).filter((key) => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
  if (illegalKeys.length) {
    return { valid: false, error: `Illegal field names: ${illegalKeys.join(', ')}` }
  }
  return { valid: true }
}

async function importContent(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<{ data?: Record<string, unknown>[] }>(c.req.raw)
  const rows = body?.data || []

  if (!rows.length) {
    return json({ success: false, error: 'No data provided' }, 400)
  }

  const safe = safeTable(table)
  const schema = importSchemas[safe] || { required: [] }
  const results: { success: boolean; error?: string }[] = new Array(rows.length)
  const validRows: { index: number; row: Record<string, unknown> }[] = []

  // Step 1: 逐条字段校验
  for (let i = 0; i < rows.length; i++) {
    const validation = validateImportRow(rows[i], schema)
    if (!validation.valid) {
      results[i] = { success: false, error: validation.error }
    } else {
      validRows.push({ index: i, row: rows[i] })
    }
  }

  // Step 2: 唯一性冲突检测
  if (schema.uniqueField && validRows.length) {
    const values = validRows.map((r) => r.row[schema.uniqueField!]).filter((v) => v !== undefined && v !== null)
    if (values.length) {
      const placeholders = values.map(() => '?').join(', ')
      const existing = await all<Record<string, unknown>>(
        c.env.SCP_DB,
        `SELECT ${schema.uniqueField} FROM ${safe} WHERE ${schema.uniqueField} IN (${placeholders})`,
        values,
      )
      const existingSet = new Set(existing.map((r) => r[schema.uniqueField!]))
      const duplicates = new Set<unknown>()
      for (let i = validRows.length - 1; i >= 0; i--) {
        const value = validRows[i].row[schema.uniqueField!]
        if (existingSet.has(value) || duplicates.has(value)) {
          results[validRows[i].index] = {
            success: false,
            error: `${schema.uniqueField} "${value}" already exists`,
          }
          duplicates.add(value)
          validRows.splice(i, 1)
        } else {
          duplicates.add(value)
        }
      }
    }
  }

  // Step 3: batch 插入
  let inserted = 0
  if (validRows.length) {
    try {
      const statements = validRows.map(({ row }) => {
        const entries = Object.entries(row).filter(([key]) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
        return c.env.SCP_DB
          .prepare(`INSERT INTO ${safe} (${entries.map(([key]) => key).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`)
          .bind(...entries.map(([, value]) => value))
      })
      await c.env.SCP_DB.batch(statements)
      inserted = validRows.length
    } catch (error) {
      const msg = (error as Error).message || 'Batch insert failed'
      for (const { index } of validRows) {
        results[index] = { success: false, error: msg }
      }
      validRows.length = 0
    }
  }

  for (const { index } of validRows) {
    if (!results[index]) results[index] = { success: true }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return json({
    success: failCount === 0,
    imported: successCount,
    failed: failCount,
    total: rows.length,
    details: results.map((r, i) => ({ index: i, ...r })).filter((r) => !r.success),
  })
}

async function setUserBan(c: Ctx, banned: boolean): Promise<Response> {
  const body = await readJson<{ reason?: string }>(c.req.raw)
  await run(c.env.SCP_DB, 'UPDATE users SET is_banned = ?, ban_reason = ?, banned_at = ? WHERE id = ?', [banned ? 1 : 0, banned ? cleanText(body?.reason, 200) : '', banned ? new Date().toISOString() : null, Number(c.req.param('id'))])
  return json({ success: true })
}

function contentTable(type: string): string {
  const map: Record<string, string> = {
    scp: 'scp_items',
    scps: 'scp_items',
    items: 'scp_items',
    tales: 'scp_tales',
    hubs: 'scp_hubs',
    goi: 'scp_goi',
    feedback: 'feedbacks',
    feedbacks: 'feedbacks',
  }
  return map[type] || 'scp_items'
}

function safeTable(table: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) throw new Error('Invalid table')
  return table
}

async function dashboardStats(db: D1Database): Promise<Record<string, number>> {
  return {
    totalUsers: await count(db, 'users'),
    activeUsers: await count(db, 'users', 'COALESCE(is_banned, 0) = 0'),
    bannedUsers: await count(db, 'users', 'COALESCE(is_banned, 0) = 1'),
    totalContent: await count(db, 'scp_items'),
    totalFeedback: await count(db, 'feedbacks'),
    totalChatMessages: await count(db, 'chat_messages'),
    recentUsers: await count(db, 'users', "created_at > datetime('now', '-7 days')"),
    recentFeedback: await count(db, 'feedbacks', "created_at > datetime('now', '-7 days')"),
  }
}

async function trendData(db: D1Database, days: number): Promise<unknown[]> {
  return all(db, `SELECT date(created_at) as date, COUNT(*) as count FROM feedbacks WHERE created_at > datetime('now', ?) GROUP BY date(created_at) ORDER BY date ASC`, [`-${days} days`])
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

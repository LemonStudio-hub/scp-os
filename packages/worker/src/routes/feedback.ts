import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types'
import { all, count, first, run } from '../db'
import { cleanText, intValue, json, readJson } from '../http'
import { requiredUser, normalizeFeedback } from '../helpers'

type AppEnv = { Bindings: Env }
type Ctx = Context<AppEnv>

export function registerFeedback(app: Hono<AppEnv>): void {
  app.post('/feedback/submit', async (c) => {
    try {
      const userId = await requiredUser(c)
      if (userId instanceof Response) return userId
      const body = await readJson<{ title?: string; content?: string; category?: string; nickname?: string }>(c.req.raw)
      const title = cleanText(body?.title, 100)
      const content = cleanText(body?.content, 2000)
      if (!title || !content) return json({ success: false, error: 'Missing required fields' }, 400)
      const category = ['general', 'bug', 'feature', 'improvement', 'other'].includes(body?.category || '') ? body?.category : 'general'
      const result = await run(c.env.SCP_DB, 'INSERT INTO feedbacks (user_id, nickname, title, content, category) VALUES (?, ?, ?, ?, ?)', [userId, cleanText(body?.nickname || 'Anonymous', 30), title, content, category])
      const row = await first<Record<string, unknown>>(c.env.SCP_DB, 'SELECT * FROM feedbacks WHERE id = ?', [result.meta?.last_row_id])
      return json({ success: true, data: row ? normalizeFeedback(row) : null }, 201)
    } catch (error) {
      console.error('[Feedback] Submit error:', error)
      return json({ success: false, error: 'Failed to submit feedback' }, 500)
    }
  })

  const list = async (c: Ctx, withVotes = false) => {
    try {
      const limit = intValue(c.req.query('limit'), 50, 200)
      const offset = intValue(c.req.query('offset'), 0)
      const category = c.req.query('category')
      const where = ['status = ?']
      const params: unknown[] = ['published']
      if (category && category !== 'all') { where.push('category = ?'); params.push(category) }
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
    } catch (error) {
      console.error('[Feedback] List error:', error)
      return json({ success: false, error: 'Failed to load feedbacks', data: [], count: 0 })
    }
  }
  app.get('/feedback/list', (c) => list(c))
  app.get('/feedback', (c) => list(c))
  app.get('/v1/feedback', (c) => list(c))
  app.get('/feedback/list-with-votes', (c) => list(c, true))

  app.post('/feedback/like', async (c) => {
    try {
      const userId = await requiredUser(c)
      if (userId instanceof Response) return userId
      const body = await readJson<{ id?: number }>(c.req.raw)
      if (!body?.id) return json({ success: false, error: 'Missing feedback id' }, 400)
      await run(c.env.SCP_DB, 'UPDATE feedbacks SET upvotes = upvotes + 1 WHERE id = ?', [body.id])
      const row = await first<{ upvotes: number }>(c.env.SCP_DB, 'SELECT upvotes FROM feedbacks WHERE id = ?', [body.id])
      return json({ success: true, data: { id: body.id, likes: row?.upvotes || 0 } })
    } catch (error) {
      console.error('[Feedback] Like error:', error)
      return json({ success: false, error: 'Failed to like feedback' }, 500)
    }
  })

  app.get('/feedback/categories', async (c) => {
    try {
      const rows = await all(c.env.SCP_DB, `SELECT category, COUNT(*) as count FROM feedbacks WHERE status = 'published' GROUP BY category ORDER BY count DESC`)
      return json({ success: true, data: rows })
    } catch (error) {
      console.error('[Feedback] Categories error:', error)
      return json({ success: false, error: 'Failed to load categories', data: [] })
    }
  })

  app.post('/feedback/comment', async (c) => {
    try {
      const userId = await requiredUser(c)
      if (userId instanceof Response) return userId
      const body = await readJson<{ feedback_id?: number; content?: string; nickname?: string }>(c.req.raw)
      const content = cleanText(body?.content, 500)
      if (!body?.feedback_id || !content) return json({ success: false, error: 'Missing required fields' }, 400)
      const exists = await first(c.env.SCP_DB, 'SELECT id FROM feedbacks WHERE id = ? AND status = ?', [body.feedback_id, 'published'])
      if (!exists) return json({ success: false, error: 'Feedback not found' }, 404)
      const inserted = await run(c.env.SCP_DB, 'INSERT INTO feedback_comments (feedback_id, user_id, nickname, content) VALUES (?, ?, ?, ?)', [body.feedback_id, userId, cleanText(body.nickname || 'Anonymous', 30), content])
      await run(c.env.SCP_DB, 'UPDATE feedbacks SET commentsCount = commentsCount + 1 WHERE id = ?', [body.feedback_id])
      const comment = await first(c.env.SCP_DB, 'SELECT * FROM feedback_comments WHERE id = ?', [inserted.meta?.last_row_id])
      return json({ success: true, data: comment }, 201)
    } catch (error) {
      console.error('[Feedback] Comment error:', error)
      return json({ success: false, error: 'Failed to submit comment' }, 500)
    }
  })

  app.get('/feedback/comments', async (c) => {
    try {
      const feedbackId = intValue(c.req.query('feedback_id'), 0)
      if (!feedbackId) return json({ success: false, error: 'Missing feedback_id parameter' }, 400)
      const rows = await all(c.env.SCP_DB, 'SELECT * FROM feedback_comments WHERE feedback_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?', [feedbackId, intValue(c.req.query('limit'), 50), intValue(c.req.query('offset'), 0)])
      return json({ success: true, data: rows })
    } catch (error) {
      console.error('[Feedback] Comments error:', error)
      return json({ success: false, error: 'Failed to load comments', data: [] })
    }
  })

  app.post('/feedback/vote', async (c) => {
    try {
      const userId = await requiredUser(c)
      if (userId instanceof Response) return userId
      const body = await readJson<{ id?: number; vote?: 'up' | 'down' }>(c.req.raw)
      if (!body?.id || (body.vote !== 'up' && body.vote !== 'down')) return json({ success: false, error: 'Missing or invalid required fields' }, 400)
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
      return json({ success: true, data: { id: body.id, vote: body.vote, action: 'added' } })
    } catch (error) {
      console.error('[Feedback] Vote error:', error)
      return json({ success: false, error: 'Failed to vote' }, 500)
    }
  })
}

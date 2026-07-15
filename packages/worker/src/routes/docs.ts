import { Hono } from 'hono'
import type { Env } from '../types'
import { all, count, first } from '../db'
import { intValue, json } from '../http'
import { listDocTable } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerDocs(app: Hono<AppEnv>): void {
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

  app.get('/docs/goi', async (c) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const offset = intValue(c.req.query('offset'), 0)
    const filters: string[] = ['1=1']
    const params: unknown[] = []
    const q = c.req.query('q')
    if (q) {
      filters.push('(title LIKE ? OR tags LIKE ? OR creator LIKE ?)')
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }
    const where = filters.join(' AND ')
    const data = await all(c.env.SCP_READER_DB, `SELECT * FROM scp_goi WHERE ${where} ORDER BY title ASC LIMIT ? OFFSET ?`, [...params, limit, offset])
    const total = await count(c.env.SCP_READER_DB, 'scp_goi', where, params)
    return json({ success: true, data, pagination: { total, limit, offset, has_more: offset + limit < total } })
  })
}

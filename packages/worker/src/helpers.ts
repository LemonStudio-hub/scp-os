import type { Context } from 'hono'
import type { Env, SCPData, UserSession } from './types'
import { all, count, first, run } from './db'
import { cleanText, intValue, json, readJson, requestInfo } from './http'
import { userFromRequest, userSessionFromRequest } from './security'

type AppEnv = { Bindings: Env }
type Ctx = Context<AppEnv>
type RouteHandler = (c: Ctx) => Response | Promise<Response>

export type { AppEnv, Ctx, RouteHandler }

export function requireJwtSecret(env: Env): string {
  const secret = env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

export function adminSecret(env: Env): string {
  const secret = env.ADMIN_JWT_SECRET?.trim() || env.JWT_SECRET?.trim()
  if (!secret) throw new Error('ADMIN_JWT_SECRET/JWT_SECRET is not configured')
  return secret
}

export async function requiredUser(c: Ctx): Promise<string | Response> {
  const id = await userFromRequest(c.req.raw, requireJwtSecret(c.env))
  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401)
}

export async function requiredRegisteredUser(c: Ctx): Promise<UserSession | Response> {
  const session = await userSessionFromRequest(c.req.raw, requireJwtSecret(c.env))
  if (!session) return json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401)
  if (session.accountType !== 'registered' || !session.email) {
    return json({ code: 'FORBIDDEN', message: 'Cloud sync is available to registered users only' }, 403)
  }
  const row = await first<{ user_id: string; email: string; is_banned: number }>(
    c.env.SCP_DB,
    'SELECT user_id, email, is_banned FROM users WHERE email = ? AND account_type = ?',
    [session.email, 'registered']
  )
  if (!row) return json({ code: 'UNAUTHORIZED', message: 'Registered account no longer exists' }, 401)
  if (row.is_banned) return json({ code: 'FORBIDDEN', message: 'Account disabled' }, 403)
  return { userId: row.user_id, email: row.email, accountType: 'registered' }
}

export async function rateLimit(env: Env, identifier: string): Promise<boolean> {
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
  } catch {}
  return true
}

export async function chatRateLimit(db: D1Database, userId: string): Promise<{ allowed: boolean }> {
  const row = await first<{ count: number }>(db, 'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND created_at > ?', [userId, new Date(Date.now() - 60_000).toISOString()])
  return { allowed: (row?.count || 0) < 10 }
}

export async function userSetting(db: D1Database, key: string): Promise<string | null> {
  return (await first<{ value: string }>(db, 'SELECT value FROM user_settings WHERE key = ?', [key]))?.value || null
}

export async function broadcastMessages(db: D1Database): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const rows = await all(db, 'SELECT id FROM chat_messages WHERE is_broadcast = 0')
    await run(db, 'UPDATE chat_messages SET is_broadcast = 1, broadcast_count = broadcast_count + 1 WHERE is_broadcast = 0')
    return { success: true, count: rows.length }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function scrape(env: Env, number: string, branch: string): Promise<{ success: boolean; data?: SCPData; error?: string; cached?: boolean }> {
  const id = number.replace(/^SCP-/i, '').padStart(3, '0')
  const key = `scp-${branch}-${id}`
  try {
    const cached = await first<{ value: string }>(env.SCP_DB, 'SELECT value FROM cache_entries WHERE key = ? AND expires_at > ?', [key, Date.now()])
    if (cached) return { success: true, data: safeParse(cached.value) as SCPData, cached: true }
  } catch {}
  const url = scpUrl(id, branch)
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 SCP-OS', Referer: url } })
    if (!response.ok) return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    const html = await response.text()
    const data = parseScp(html, id, url)
    try {
      await run(env.SCP_DB, 'INSERT OR REPLACE INTO cache_entries (key, value, expires_at) VALUES (?, ?, ?)', [key, JSON.stringify(data), Date.now() + 30 * 60_000])
    } catch {}
    return { success: true, data }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export function scpUrl(number: string, branch: string): string {
  const base = branch === 'cn' ? 'https://scp-wiki-cn.wikidot.com' : 'https://scp-wiki.wikidot.com'
  return `${base}/scp-${number}`
}

function parseScp(html: string, number: string, url: string): SCPData {
  const text = stripHtml(html)
  const objectClassMatch = /Object\s+Class[:\s]+([A-Za-z]+)/i.exec(text) || /项目等级[�?\s]+([^\s,，]+)/i.exec(text)
  const objectClass = objectClassMatch?.[1]?.toUpperCase() || 'UNKNOWN'
  const parts = text.split(/Special\s+Containment\s+Procedures:?|Description:?|特殊收容措施[�?]?|描述[�?]?/i).map((part) => part.trim()).filter(Boolean)
  return {
    id: `SCP-${number}`,
    name: /<title>(.*?)<\/title>/i.exec(html)?.[1]?.replace(/\s*-\s*SCP Foundation.*$/i, '').replace(/\s*-\s*SCP基金�?*$/i, '') || `SCP-${number}`,
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

export async function searchIndex(db: D1Database, keyword: string, clearance?: number): Promise<unknown[]> {
  const where = clearance === undefined ? '(name LIKE ? OR tags LIKE ?)' : '(name LIKE ? OR tags LIKE ?) AND clearance_level <= ?'
  const like = `%${keyword}%`
  const params = clearance === undefined ? [like, like] : [like, like, clearance]
  return all(db, `SELECT scp_id, name, object_class, tags, clearance_level, updated_at FROM scp_index WHERE ${where} ORDER BY scp_id ASC LIMIT 20`, params)
}

export async function scpStats(db: D1Database): Promise<unknown> {
  const classes = await all<{ object_class: string; count: number }>(db, 'SELECT object_class, COUNT(*) as count FROM scp_index GROUP BY object_class')
  const clearances = await all<{ clearance_level: number; count: number }>(db, 'SELECT clearance_level, COUNT(*) as count FROM scp_index GROUP BY clearance_level')
  return {
    total: await count(db, 'scp_index'),
    byClass: Object.fromEntries(classes.map((row) => [row.object_class, row.count])),
    byClearance: Object.fromEntries(clearances.map((row) => [row.clearance_level, row.count])),
  }
}

export function normalizeFeedback(row: Record<string, unknown>): Record<string, unknown> & { id: number; userVote?: 'up' | 'down' } {
  return {
    ...row,
    id: Number(row.id),
    comments_count: row.commentsCount ?? row.comments_count ?? 0,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
  }
}

export function listDocTable(app: { get: (path: string, handler: RouteHandler) => void }, path: string, table: string, order: string): void {
  app.get(path, async (c) => {
    const limit = intValue(c.req.query('limit'), 50, 200)
    const offset = intValue(c.req.query('offset'), 0)
    const rows = await all(c.env.SCP_READER_DB, `SELECT * FROM ${table} ORDER BY ${order} LIMIT ? OFFSET ?`, [limit, offset])
    const total = await count(c.env.SCP_READER_DB, table)
    return json({ success: true, data: rows, pagination: { total, limit, offset, has_more: offset + limit < total } })
  })
}

export function defaultNotificationPreferences(userId: string): Record<string, unknown> {
  return { user_id: userId, feedback_comment: 1, feedback_upvote: 1, feedback_downvote: 1, chat_message: 1 }
}

export async function adminList(c: Ctx, table: string, columns?: string[], order = 'id DESC'): Promise<Response> {
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

export async function itemById(c: Ctx, table: string): Promise<Response> {
  const row = await first(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))])
  return row ? json({ success: true, data: row }) : json({ success: false, error: 'Not found' }, 404)
}

const CSV_BOM = '\uFEFF'
const D1_BATCH_LIMIT = 100
const IMPORT_MAX_ROWS = 1000

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text: string
  if (typeof value === 'object') {
    try {
      text = JSON.stringify(value)
    } catch {
      text = ''
    }
  } else {
    text = String(value)
  }
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

/** Union headers across all rows; nested objects serialize as JSON. */
export function convertToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return CSV_BOM
  const headerSet = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) headerSet.add(key)
  }
  const headers = Array.from(headerSet)
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(',')),
  ]
  return CSV_BOM + lines.join('\n')
}

export async function adminExport(c: Ctx, table: string): Promise<Response> {
  const format = c.req.query('format') || 'json'
  if (format !== 'json' && format !== 'csv') {
    return json({ success: false, error: 'Invalid format. Use json or csv' }, 400)
  }
  const limit = intValue(c.req.query('limit'), 500, 500)
  const offset = intValue(c.req.query('offset'), 0)
  const data = await all(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} LIMIT ? OFFSET ?`, [limit, offset])
  const total = await count(c.env.SCP_DB, safeTable(table))
  if (format === 'csv') {
    const csv = convertToCsv(data as Record<string, unknown>[])
    const filename = `${safeTable(table)}-export.csv`
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  }
  return json({ success: true, data, total, pagination: { limit, offset, has_more: offset + limit < total }, format: 'json' })
}

export async function updateById(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<Record<string, unknown>>(c.req.raw) || {}
  const entries = Object.entries(body).filter(([key]) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
  if (!entries.length) return json({ success: true })
  await run(c.env.SCP_DB, `UPDATE ${safeTable(table)} SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE id = ?`, [...entries.map(([, value]) => value), Number(c.req.param('id'))])
  return json({ success: true, data: await first(c.env.SCP_DB, `SELECT * FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))]) })
}

export async function deleteById(c: Ctx, table: string): Promise<Response> {
  await run(c.env.SCP_DB, `DELETE FROM ${safeTable(table)} WHERE id = ?`, [Number(c.req.param('id'))])
  return json({ success: true })
}

export async function batchUsers(c: Ctx): Promise<Response> {
  const body = await readJson<{ action?: string; ids?: number[] }>(c.req.raw)
  for (const id of body?.ids || []) {
    if (body?.action === 'ban') await run(c.env.SCP_DB, 'UPDATE users SET is_banned = 1 WHERE id = ?', [id])
    if (body?.action === 'unban') await run(c.env.SCP_DB, 'UPDATE users SET is_banned = 0, ban_reason = NULL, banned_at = NULL WHERE id = ?', [id])
    if (body?.action === 'delete') await run(c.env.SCP_DB, 'DELETE FROM users WHERE id = ?', [id])
  }
  return json({ success: true })
}

export async function batchContent(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<{ action?: string; ids?: number[]; status?: string; category?: string }>(c.req.raw)
  const action = body?.action
  const ids = (body?.ids || []).map(Number).filter((id) => Number.isFinite(id))
  const supportedActions = ['delete', 'update_status', 'move_category']

  if (!action || !supportedActions.includes(action)) {
    return json({ success: false, error: `Unsupported action. Supported: ${supportedActions.join(', ')}` }, 400)
  }
  if (!ids.length) {
    return json({ success: false, error: 'No IDs provided' }, 400)
  }

  const safe = safeTable(table)
  try {
    // Chunk to stay under D1 batch statement limits (~100).
    for (let i = 0; i < ids.length; i += D1_BATCH_LIMIT) {
      const chunk = ids.slice(i, i + D1_BATCH_LIMIT)
      const placeholders = chunk.map(() => '?').join(', ')
      if (action === 'delete') {
        await run(c.env.SCP_DB, `DELETE FROM ${safe} WHERE id IN (${placeholders})`, chunk)
      } else if (action === 'update_status') {
        const status = body?.status
        if (!status) return json({ success: false, error: 'Missing status parameter' }, 400)
        await run(c.env.SCP_DB, `UPDATE ${safe} SET status = ? WHERE id IN (${placeholders})`, [status, ...chunk])
      } else if (action === 'move_category') {
        const category = body?.category
        if (!category) return json({ success: false, error: 'Missing category parameter' }, 400)
        await run(c.env.SCP_DB, `UPDATE ${safe} SET category = ? WHERE id IN (${placeholders})`, [category, ...chunk])
      }
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

export async function importContent(c: Ctx, table: string): Promise<Response> {
  const body = await readJson<{ data?: Record<string, unknown>[] }>(c.req.raw)
  const rows = body?.data || []

  if (!rows.length) {
    return json({ success: false, error: 'No data provided' }, 400)
  }
  if (rows.length > IMPORT_MAX_ROWS) {
    return json(
      {
        success: false,
        error: `Import payload too large (max ${IMPORT_MAX_ROWS} rows, got ${rows.length})`,
      },
      400,
    )
  }

  const safe = safeTable(table)
  const schema = importSchemas[safe] || { required: [] }
  const results: { success: boolean; error?: string }[] = new Array(rows.length)
  const validRows: { index: number; row: Record<string, unknown> }[] = []

  for (let i = 0; i < rows.length; i++) {
    const validation = validateImportRow(rows[i], schema)
    if (!validation.valid) {
      results[i] = { success: false, error: validation.error }
    } else {
      validRows.push({ index: i, row: rows[i] })
    }
  }

  if (schema.uniqueField && validRows.length) {
    const values = validRows.map((r) => r.row[schema.uniqueField!]).filter((v) => v !== undefined && v !== null)
    if (values.length) {
      // Chunk unique-field lookups under D1 bind/IN limits.
      const existingSet = new Set<unknown>()
      for (let i = 0; i < values.length; i += D1_BATCH_LIMIT) {
        const chunk = values.slice(i, i + D1_BATCH_LIMIT)
        const placeholders = chunk.map(() => '?').join(', ')
        const existing = await all<Record<string, unknown>>(
          c.env.SCP_DB,
          `SELECT ${schema.uniqueField} FROM ${safe} WHERE ${schema.uniqueField} IN (${placeholders})`,
          chunk,
        )
        for (const r of existing) existingSet.add(r[schema.uniqueField!])
      }
      const duplicates = new Set<unknown>()
      for (let i = validRows.length - 1; i >= 0; i--) {
        const value = validRows[i].row[schema.uniqueField!]
        if (existingSet.has(value) || duplicates.has(value)) {
          results[validRows[i].index] = { success: false, error: `${schema.uniqueField} "${value}" already exists` }
          duplicates.add(value)
          validRows.splice(i, 1)
        } else {
          duplicates.add(value)
        }
      }
    }
  }

  let inserted = 0
  if (validRows.length) {
    try {
      // D1 batch() hard-limits ~100 statements �?chunk inserts.
      for (let i = 0; i < validRows.length; i += D1_BATCH_LIMIT) {
        const chunk = validRows.slice(i, i + D1_BATCH_LIMIT)
        const statements = chunk.map(({ row }) => {
          const entries = Object.entries(row).filter(([key]) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
          return c.env.SCP_DB
            .prepare(
              `INSERT INTO ${safe} (${entries.map(([key]) => key).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`,
            )
            .bind(...entries.map(([, value]) => value))
        })
        await c.env.SCP_DB.batch(statements)
        inserted += chunk.length
      }
    } catch (error) {
      const msg = (error as Error).message || 'Batch insert failed'
      for (const { index } of validRows) {
        results[index] = { success: false, error: msg }
      }
      validRows.length = 0
      inserted = 0
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

export async function setUserBan(c: Ctx, banned: boolean): Promise<Response> {
  const body = await readJson<{ reason?: string }>(c.req.raw)
  await run(c.env.SCP_DB, 'UPDATE users SET is_banned = ?, ban_reason = ?, banned_at = ? WHERE id = ?', [banned ? 1 : 0, banned ? cleanText(body?.reason, 200) : '', banned ? new Date().toISOString() : null, Number(c.req.param('id'))])
  return json({ success: true })
}

export function contentTable(type: string): string {
  const map: Record<string, string> = {
    scp: 'scp_items', scps: 'scp_items', items: 'scp_items',
    tales: 'scp_tales', hubs: 'scp_hubs', goi: 'scp_goi',
    feedback: 'feedbacks', feedbacks: 'feedbacks',
  }
  return map[type] || 'scp_items'
}

export function safeTable(table: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) throw new Error('Invalid table')
  return table
}

export async function dashboardStats(db: D1Database): Promise<Record<string, number>> {
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

export async function trendData(db: D1Database, days: number): Promise<unknown[]> {
  return all(db, `SELECT date(created_at) as date, COUNT(*) as count FROM feedbacks WHERE created_at > datetime('now', ?) GROUP BY date(created_at) ORDER BY date ASC`, [`-${days} days`])
}

export function safeParse(value: string): unknown {
  try { return JSON.parse(value) } catch { return value }
}

export function routeGet(app: { get: (path: string, handler: RouteHandler) => void }, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.get(path, handler)
}

export function routePost(app: { post: (path: string, handler: RouteHandler) => void }, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.post(path, handler)
}

export function routePut(app: { put: (path: string, handler: RouteHandler) => void }, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.put(path, handler)
}

export function routeDelete(app: { delete: (path: string, handler: RouteHandler) => void }, paths: string[], handler: RouteHandler): void {
  for (const path of paths) app.delete(path, handler)
}

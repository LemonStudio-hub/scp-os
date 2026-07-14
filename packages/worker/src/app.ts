import { Hono } from 'hono'
import type { Env } from './types'
import { all, count, first } from './db'
import { cors, intValue, json, requestInfo } from './http'
import { userFromRequest } from './security'
import { rateLimit, scrape, searchIndex, scpStats, scpUrl } from './helpers'
import { registerAuth } from './routes/auth'
import { registerChat } from './routes/chat'
import { registerFeedback } from './routes/feedback'
import { registerUsers } from './routes/users'
import { registerPerformance } from './routes/performance'
import { registerDocs } from './routes/docs'
import { registerNotifications } from './routes/notifications'
import { registerAdmin } from './routes/admin'
import { registerFiles } from './routes/files'

type AppEnv = { Bindings: Env }

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>()
  app.use('*', cors)

  app.use('*', async (c, next) => {
    const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET || 'scp-os-default-secret')
    const ok = await rateLimit(c.env, id || requestInfo(c.req.raw).ip)
    if (!ok) return json({ code: 'RATE_LIMITED', message: 'Rate limit exceeded' }, 429)
    await next()
  })

  app.get('/', (c) => json({
    name: 'SCP Scraper Worker',
    version: '3.0.0',
    status: 'online',
    endpoints: {
      '/api/auth/token': 'Refresh guest JWT token',
      '/api/auth/guest': 'Guest login',
      '/api/auth/register': 'Email registration with verification code',
      '/api/auth/login': 'Email/password login',
      '/api/auth/send-code': 'Send email verification code',
      '/api/auth/email-domains': 'List allowed email domains',
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
    // Only numeric keywords trigger live scraping, since text searches can't be resolved to a single SCP page
    const numberMatch = keyword.replace(/^SCP-/i, '').match(/^\d+$/)
    if (numberMatch) {
      return json(await scrape(c.env, keyword.replace(/^SCP-/i, ''), c.req.query('branch') || 'en'))
    }
    return json({ success: false, error: `未找到包含 "${keyword}" 的SCP对象` })
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

  registerAuth(app)
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

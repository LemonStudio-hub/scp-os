import { Hono } from 'hono'
import type { Env } from '../types'
import { json } from '../http'
import { requiredRegisteredUser } from '../helpers'
import { CLOUD_QUOTA_BYTES, cloudUsage } from '../r2-usage'

type AppEnv = { Bindings: Env }

const SYNC_KEY = 'sync/all-data.json'

export function registerSync(app: Hono<AppEnv>): void {
  app.get('/api/sync/quota', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const usage = await cloudUsage(c.env.SCP_FILES, session.userId)
    return json({
      success: true,
      data: {
        used: usage.used,
        max: CLOUD_QUOTA_BYTES,
        percent: Math.round((usage.used / CLOUD_QUOTA_BYTES) * 100),
        count: usage.count,
      },
    })
  })

  app.get('/api/sync/data', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const key = `users/${session.userId}/${SYNC_KEY}`
    const obj = await c.env.SCP_FILES.get(key)
    if (!obj) return json({ success: true, data: null })
    // Do not set Access-Control-Allow-Origin here — global CORS middleware handles it.
    return new Response(obj.body, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(obj.size),
        'X-Sync-Updated-At': obj.customMetadata?.updatedAt || '',
      },
    })
  })

  app.put('/api/sync/data', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const body = await c.req.text()
    const size = new TextEncoder().encode(body).length
    if (size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Sync payload exceeds 512MB' }, 413)
    }
    const key = `users/${session.userId}/${SYNC_KEY}`
    const existing = await c.env.SCP_FILES.get(key)
    const usage = await cloudUsage(c.env.SCP_FILES, session.userId)
    const currentSyncSize = existing?.size || 0
    if (usage.used - currentSyncSize + size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
    }
    const updatedAt = new Date().toISOString()
    await c.env.SCP_FILES.put(key, body, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { userId: session.userId, updatedAt, strategy: 'latest-wins' },
    })
    return json({ success: true, data: { key: SYNC_KEY, size, updatedAt } })
  })
}

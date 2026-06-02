import { Hono } from 'hono'
import type { Env } from '../types'
import { json, readJson } from '../http'
import { requiredRegisteredUser } from '../helpers'

type AppEnv = { Bindings: Env }
const CLOUD_QUOTA_BYTES = 512 * 1024 * 1024

async function cloudUsage(bucket: R2Bucket, userId: string): Promise<{ used: number; count: number }> {
  const prefix = `users/${userId}/`
  const listResult = await bucket.list({ prefix, limit: 1000 })
  return {
    used: listResult.objects.reduce((sum: number, obj: R2Object) => sum + obj.size, 0),
    count: listResult.objects.length,
  }
}

export function registerFiles(app: Hono<AppEnv>): void {
  app.post('/files/upload', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const path = (formData.get('path') as string) || ''
    if (!file) return json({ code: 'VALIDATION_ERROR', message: 'No file provided' }, 400)
    const safePath = path.replace(/^\/+/, '') || file.name
    const key = `users/${userId}/files/${safePath}`
    const usage = await cloudUsage(c.env.SCP_FILES, userId)
    if (usage.used + file.size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
    }
    await c.env.SCP_FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { userId, path: safePath, originalName: file.name, uploadedAt: new Date().toISOString() },
    })
    return json({ success: true, data: { key: safePath, size: file.size, path: safePath } })
  })

  app.get('/files', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
    const prefix = `users/${userId}/files/`
    const listResult = await c.env.SCP_FILES.list({ prefix, limit: 1000 })
    const files = listResult.objects.map((obj: R2Object) => ({
      key: obj.key.replace(prefix, ''),
      size: obj.size,
      uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString(),
      contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
    }))
    return json({ success: true, data: files, count: files.length })
  })

  app.get('/files/quota', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const usage = await cloudUsage(c.env.SCP_FILES, session.userId)
    return json({ success: true, data: { used: usage.used, max: CLOUD_QUOTA_BYTES, percent: Math.round((usage.used / CLOUD_QUOTA_BYTES) * 100), count: usage.count } })
  })

  app.get('/files/:key', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
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
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
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
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
    const key = `users/${userId}/files/${c.req.param('key')}`
    await c.env.SCP_FILES.delete(key)
    return json({ success: true })
  })
}

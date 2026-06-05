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

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
}

function fileUrl(requestUrl: string, key: string): string {
  const url = new URL(requestUrl)
  return `${url.origin}/files/${encodeURIComponent(key)}`
}

function filePayload(requestUrl: string, key: string, size: number, contentType: string, uploadedAt?: string) {
  const name = key.split('/').pop() || key
  return {
    key,
    name,
    size,
    type: contentType,
    contentType,
    uploadedAt,
    url: fileUrl(requestUrl, key),
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
    const folder = (formData.get('folder') as string) || ''
    if (!file) return json({ code: 'VALIDATION_ERROR', message: 'No file provided' }, 400)
    const safePath = normalizePath(path || `${folder}/${file.name}`) || file.name
    const key = `users/${userId}/files/${safePath}`
    const existing = await c.env.SCP_FILES.get(key)
    const usage = await cloudUsage(c.env.SCP_FILES, userId)
    if (usage.used - (existing?.size || 0) + file.size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
    }
    const uploadedAt = new Date().toISOString()
    const contentType = file.type || 'application/octet-stream'
    await c.env.SCP_FILES.put(key, file.stream(), {
      httpMetadata: { contentType },
      customMetadata: { userId, path: safePath, originalName: file.name, uploadedAt },
    })
    return json({ success: true, data: filePayload(c.req.url, safePath, file.size, contentType, uploadedAt) })
  })

  app.get('/files', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
    const queryPrefix = normalizePath(c.req.query('prefix') || '')
    const basePrefix = `users/${userId}/files/`
    const listPrefix = queryPrefix ? `${basePrefix}${queryPrefix}/` : basePrefix
    const listResult = await c.env.SCP_FILES.list({ prefix: listPrefix, limit: 1000 })
    const files = listResult.objects.map((obj: R2Object) => {
      const key = obj.key.replace(basePrefix, '')
      return filePayload(
        c.req.url,
        key,
        obj.size,
        obj.httpMetadata?.contentType || 'application/octet-stream',
        obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString()
      )
    })
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
    const safePath = normalizePath(c.req.param('key'))
    const key = `users/${userId}/files/${safePath}`
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
    const safePath = normalizePath(c.req.param('key'))
    const oldKey = `users/${userId}/files/${safePath}`
    const obj = await c.env.SCP_FILES.get(oldKey)
    if (!obj) return json({ code: 'NOT_FOUND', message: 'File not found' }, 404)

    if ((c.req.header('Content-Type') || '').includes('application/json')) {
      const body = await readJson<{ path?: string }>(c.req.raw)
      const newPath = normalizePath(body?.path || '')
      if (!newPath) return json({ code: 'VALIDATION_ERROR', message: 'Missing path' }, 400)
      const newKey = `users/${userId}/files/${newPath}`
      await c.env.SCP_FILES.put(newKey, obj.body, {
        httpMetadata: obj.httpMetadata,
        customMetadata: { ...(obj.customMetadata || {}), path: newPath },
      })
      await c.env.SCP_FILES.delete(oldKey)
      return json({
        success: true,
        data: filePayload(
          c.req.url,
          newPath,
          obj.size,
          obj.httpMetadata?.contentType || 'application/octet-stream',
          obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString()
        ),
      })
    }

    const content = await c.req.text()
    const size = new TextEncoder().encode(content).length
    const usage = await cloudUsage(c.env.SCP_FILES, userId)
    if (usage.used - obj.size + size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
    }
    const contentType = c.req.header('Content-Type') || obj.httpMetadata?.contentType || 'text/plain'
    const uploadedAt = obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString()
    await c.env.SCP_FILES.put(oldKey, content, {
      httpMetadata: { contentType },
      customMetadata: {
        ...(obj.customMetadata || {}),
        userId,
        path: safePath,
        updatedAt: new Date().toISOString(),
      },
    })
    return json({ success: true, data: filePayload(c.req.url, safePath, size, contentType, uploadedAt) })
  })

  app.delete('/files/:key', async (c) => {
    const session = await requiredRegisteredUser(c)
    if (session instanceof Response) return session
    const userId = session.userId
    const key = `users/${userId}/files/${normalizePath(c.req.param('key'))}`
    await c.env.SCP_FILES.delete(key)
    return json({ success: true })
  })
}

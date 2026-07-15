import { Hono } from 'hono'
import type { Env } from '../types'
import { json, readJson } from '../http'
import { requiredRegisteredUser } from '../helpers'
import { CLOUD_QUOTA_BYTES, cloudUsage, listAllObjects } from '../r2-usage'

type AppEnv = { Bindings: Env }

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
    const objects = await listAllObjects(c.env.SCP_FILES, listPrefix)
    const files = objects.map((obj: R2Object) => {
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

    // Rename (JSON body with { path })
    if ((c.req.header('Content-Type') || '').includes('application/json')) {
      const body = await readJson<{ path?: string }>(c.req.raw)
      const newPath = normalizePath(body?.path || '')
      if (!newPath) return json({ code: 'VALIDATION_ERROR', message: 'Missing path' }, 400)
      const newKey = `users/${userId}/files/${newPath}`
      if (newKey === oldKey) {
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
      // Prevent silent overwrite of an existing destination.
      const dest = await c.env.SCP_FILES.get(newKey)
      if (dest) {
        return json({ success: false, error: 'Destination path already exists' }, 409)
      }
      // Rename keeps same size — quota unchanged, but still verify usage for consistency.
      const usage = await cloudUsage(c.env.SCP_FILES, userId)
      if (usage.used > CLOUD_QUOTA_BYTES) {
        return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
      }
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

    // Content update — stream when possible; fall back to text for small edits.
    const contentType = c.req.header('Content-Type') || obj.httpMetadata?.contentType || 'text/plain'
    const contentLengthHeader = c.req.header('Content-Length')
    let size = contentLengthHeader ? Number(contentLengthHeader) : NaN
    let body: ReadableStream | string
    if (c.req.raw.body && Number.isFinite(size) && size >= 0) {
      body = c.req.raw.body
    } else {
      const text = await c.req.text()
      size = new TextEncoder().encode(text).length
      body = text
    }
    const usage = await cloudUsage(c.env.SCP_FILES, userId)
    if (usage.used - obj.size + size > CLOUD_QUOTA_BYTES) {
      return json({ success: false, error: 'Storage quota exceeded (max 512MB)' }, 413)
    }
    const uploadedAt = obj.customMetadata?.uploadedAt || obj.uploaded?.toISOString()
    await c.env.SCP_FILES.put(oldKey, body, {
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

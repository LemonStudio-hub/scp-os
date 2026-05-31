import { Hono } from 'hono'
import type { Env } from '../types'
import { json, readJson } from '../http'
import { requiredUser } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerFiles(app: Hono<AppEnv>): void {
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
    const usedSize = listResult.objects.reduce((sum: number, obj: R2Object) => sum + obj.size, 0)
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
    const files = listResult.objects.map((obj: R2Object) => ({
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
    const used = listResult.objects.reduce((sum: number, obj: R2Object) => sum + obj.size, 0)
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

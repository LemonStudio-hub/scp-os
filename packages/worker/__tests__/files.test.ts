import { describe, expect, it } from 'vitest'
import worker from '../index'
import { signJwt } from '../src/security'
import type { Env } from '../src/types'

const SECRET = 'test-secret'

interface StoredObject {
  body: string
  size: number
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
  uploaded: Date
}

function db(): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: () => ({
        first: async () => {
          if (sql.includes('FROM users')) {
            return { user_id: 'user-1', email: 'user@example.com', is_banned: 0 }
          }
          return null
        },
        all: async () => ({ results: [] }),
        run: async () => ({ success: true, meta: {} }),
      }),
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({ success: true, meta: {} }),
    }),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

async function bodyText(value: unknown): Promise<string> {
  if (typeof value === 'string') return value
  return new Response(value as BodyInit).text()
}

function r2(): R2Bucket {
  const objects = new Map<string, StoredObject>()

  return {
    list: async ({ prefix = '' } = {}) => ({
      objects: Array.from(objects.entries())
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, obj]) => ({
          key,
          size: obj.size,
          uploaded: obj.uploaded,
          httpMetadata: obj.httpMetadata,
          customMetadata: obj.customMetadata,
        })),
      delimitedPrefixes: [],
      truncated: false,
    }),
    get: async (key: string) => {
      const obj = objects.get(key)
      if (!obj) return null
      return {
        body: new Blob([obj.body], { type: obj.httpMetadata?.contentType }).stream(),
        size: obj.size,
        uploaded: obj.uploaded,
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata,
      } as unknown as R2ObjectBody
    },
    put: async (key: string, value: unknown, options?: R2PutOptions) => {
      const body = await bodyText(value)
      objects.set(key, {
        body,
        size: new TextEncoder().encode(body).length,
        uploaded: new Date('2026-06-05T00:00:00.000Z'),
        httpMetadata: options?.httpMetadata as R2HTTPMetadata | undefined,
        customMetadata: options?.customMetadata,
      })
      return null
    },
    delete: async (key: string) => {
      objects.delete(key)
    },
  } as unknown as R2Bucket
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await signJwt(
    { userId: 'user@example.com', email: 'user@example.com', accountType: 'registered' },
    SECRET,
    3600
  )
  return { Authorization: `Bearer ${token}` }
}

function env(bucket = r2()): Env {
  return {
    SCP_DB: db(),
    SCP_READER_DB: db(),
    SCP_FILES: bucket,
    CHAT_ROOM_DO: {} as DurableObjectNamespace,
    JWT_SECRET: SECRET,
  }
}

describe('files routes', () => {
  it('uses path keys and returns frontend-compatible file metadata', async () => {
    const bucket = r2()
    const formData = new FormData()
    formData.set('file', new File(['hello'], 'note.txt', { type: 'text/plain' }))
    formData.set('path', '/documents/note.txt')

    const upload = await worker.fetch(
      new Request('https://api.example/files/upload', {
        method: 'POST',
        headers: await authHeaders(),
        body: formData,
      }),
      env(bucket),
      {} as ExecutionContext
    )

    expect(upload.status).toBe(200)
    await expect(upload.json()).resolves.toMatchObject({
      success: true,
      data: {
        key: 'documents/note.txt',
        name: 'note.txt',
        size: 5,
        type: 'text/plain',
        contentType: 'text/plain',
        url: 'https://api.example/files/documents%2Fnote.txt',
      },
    })

    const list = await worker.fetch(
      new Request('https://api.example/files', { headers: await authHeaders() }),
      env(bucket),
      {} as ExecutionContext
    )
    await expect(list.json()).resolves.toMatchObject({
      success: true,
      data: [{ key: 'documents/note.txt', url: 'https://api.example/files/documents%2Fnote.txt' }],
    })
  })

  it('updates text content through PUT without renaming the file', async () => {
    const bucket = r2()
    const headers = await authHeaders()
    const formData = new FormData()
    formData.set('file', new File(['old'], 'note.txt', { type: 'text/plain' }))
    formData.set('path', 'documents/note.txt')

    await worker.fetch(
      new Request('https://api.example/files/upload', { method: 'POST', headers, body: formData }),
      env(bucket),
      {} as ExecutionContext
    )

    const update = await worker.fetch(
      new Request('https://api.example/files/documents%2Fnote.txt', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'text/plain' },
        body: 'new content',
      }),
      env(bucket),
      {} as ExecutionContext
    )
    await expect(update.json()).resolves.toMatchObject({
      success: true,
      data: { key: 'documents/note.txt', size: 11 },
    })

    const download = await worker.fetch(
      new Request('https://api.example/files/documents%2Fnote.txt', { headers }),
      env(bucket),
      {} as ExecutionContext
    )

    expect(download.status).toBe(200)
    await expect(download.text()).resolves.toBe('new content')
  })
})

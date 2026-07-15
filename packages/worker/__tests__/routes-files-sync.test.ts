import { beforeEach, describe, expect, it, vi } from 'vitest'

const { session } = vi.hoisted(() => ({
  session: {
    userId: 'user@example.com',
    email: 'user@example.com',
    accountType: 'registered' as const,
  },
}))

vi.mock('../src/security', () => ({
  signJwt: vi.fn(),
  verifyJwt: vi.fn(),
  userFromRequest: vi.fn().mockResolvedValue(null),
  userSessionFromRequest: vi.fn().mockResolvedValue({
    userId: 'user@example.com',
    email: 'user@example.com',
    accountType: 'registered',
  }),
  adminFromRequest: vi.fn().mockResolvedValue(null),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('../src/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/helpers')>()
  return {
    ...actual,
    rateLimit: vi.fn().mockResolvedValue(true),
    requiredRegisteredUser: vi.fn().mockResolvedValue(session),
    requiredUser: vi.fn().mockResolvedValue(session.userId),
  }
})

import { createApp } from '../src/app'
import type { Env } from '../src/types'
import { CLOUD_QUOTA_BYTES } from '../src/r2-usage'

type StoreEntry = {
  body: string
  size: number
  httpMetadata?: { contentType?: string }
  customMetadata?: Record<string, string>
}

function makeR2(initial: Record<string, StoreEntry> = {}) {
  const store = new Map<string, StoreEntry>(Object.entries(initial))
  return {
    store,
    async get(key: string) {
      const entry = store.get(key)
      if (!entry) return null
      return {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(entry.body))
            controller.close()
          },
        }),
        size: entry.size,
        httpMetadata: entry.httpMetadata,
        customMetadata: entry.customMetadata,
        uploaded: new Date(),
      }
    },
    async put(key: string, value: string | ReadableStream | ArrayBuffer, opts?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }) {
      let body = ''
      if (typeof value === 'string') body = value
      else if (value instanceof ArrayBuffer) body = new TextDecoder().decode(value)
      else if (value && typeof (value as ReadableStream).getReader === 'function') {
        const reader = (value as ReadableStream).getReader()
        const chunks: Uint8Array[] = []
        for (;;) {
          const { done, value: chunk } = await reader.read()
          if (done) break
          chunks.push(chunk as Uint8Array)
        }
        const total = chunks.reduce((n, c) => n + c.length, 0)
        const merged = new Uint8Array(total)
        let offset = 0
        for (const c of chunks) {
          merged.set(c, offset)
          offset += c.length
        }
        body = new TextDecoder().decode(merged)
      }
      store.set(key, {
        body,
        size: new TextEncoder().encode(body).length,
        httpMetadata: opts?.httpMetadata,
        customMetadata: opts?.customMetadata,
      })
    },
    async delete(key: string) {
      store.delete(key)
    },
    async list(opts: { prefix?: string; limit?: number; cursor?: string }) {
      const prefix = opts.prefix || ''
      const all = Array.from(store.entries())
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, entry]) => ({
          key,
          size: entry.size,
          httpMetadata: entry.httpMetadata,
          customMetadata: entry.customMetadata,
          uploaded: new Date(),
        }))
      // Simulate pagination if limit is small — tests use full list under 1000.
      return { objects: all, truncated: false, cursor: undefined }
    },
  }
}

function db() {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => ({
          user_id: session.userId,
          email: session.email,
          is_banned: 0,
        }),
        all: async () => ({ results: [] }),
        run: async () => ({ success: true, meta: {} }),
      }),
      first: async () => ({
        user_id: session.userId,
        email: session.email,
        is_banned: 0,
      }),
      all: async () => ({ results: [] }),
      run: async () => ({ success: true, meta: {} }),
    }),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

function makeEnv(r2 = makeR2()): Env & { r2: ReturnType<typeof makeR2> } {
  return {
    SCP_DB: db(),
    SCP_READER_DB: db(),
    SCP_FILES: r2 as unknown as R2Bucket,
    CHAT_ROOM_DO: {} as DurableObjectNamespace,
    JWT_SECRET: 'test-secret',
    ADMIN_JWT_SECRET: 'admin-secret',
    r2,
  }
}

describe('files + sync routes', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    app = createApp()
  })

  it('GET /files/quota returns usage for registered user', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/a.txt': { body: 'hello', size: 5 },
    })
    const env = makeEnv(r2)
    const res = await app.request('/files/quota', {}, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: { used: number; max: number; count: number } }>()
    expect(body.success).toBe(true)
    expect(body.data.used).toBe(5)
    expect(body.data.max).toBe(CLOUD_QUOTA_BYTES)
    expect(body.data.count).toBe(1)
  })

  it('GET /files lists user files', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/notes/a.txt': {
        body: 'x',
        size: 1,
        httpMetadata: { contentType: 'text/plain' },
        customMetadata: { uploadedAt: '2026-01-01T00:00:00.000Z' },
      },
    })
    const env = makeEnv(r2)
    const res = await app.request('/files', {}, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: Array<{ key: string }>; count: number }>()
    expect(body.success).toBe(true)
    expect(body.count).toBe(1)
    expect(body.data[0].key).toBe('notes/a.txt')
  })

  it('PUT rename rejects existing destination', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/old.txt': { body: 'a', size: 1 },
      'users/user@example.com/files/new.txt': { body: 'b', size: 1 },
    })
    const env = makeEnv(r2)
    const res = await app.request('/files/old.txt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'new.txt' }),
    }, env)
    expect(res.status).toBe(409)
    const body = await res.json<{ success: boolean; error: string }>()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/already exists/i)
  })

  it('PUT rename moves object when destination is free', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/old.txt': { body: 'hello', size: 5 },
    })
    const env = makeEnv(r2)
    const res = await app.request('/files/old.txt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'renamed.txt' }),
    }, env)
    expect(res.status).toBe(200)
    expect(r2.store.has('users/user@example.com/files/old.txt')).toBe(false)
    expect(r2.store.has('users/user@example.com/files/renamed.txt')).toBe(true)
  })

  it('DELETE removes a file', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/gone.txt': { body: 'x', size: 1 },
    })
    const env = makeEnv(r2)
    const res = await app.request('/files/gone.txt', { method: 'DELETE' }, env)
    expect(res.status).toBe(200)
    expect(r2.store.has('users/user@example.com/files/gone.txt')).toBe(false)
  })

  it('GET /api/sync/data returns null when empty', async () => {
    const env = makeEnv()
    const res = await app.request('/api/sync/data', {}, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: null }>()
    expect(body.data).toBeNull()
  })

  it('PUT /api/sync/data stores snapshot and GET returns body', async () => {
    const r2 = makeR2()
    const env = makeEnv(r2)
    const snapshot = JSON.stringify({ version: 1, stores: {} })
    const putRes = await app.request('/api/sync/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: snapshot,
    }, env)
    expect(putRes.status).toBe(200)
    const putBody = await putRes.json<{ success: boolean }>()
    expect(putBody.success).toBe(true)

    const getRes = await app.request('/api/sync/data', {}, env)
    expect(getRes.status).toBe(200)
    expect(getRes.headers.get('Content-Type')).toMatch(/json/)
    const text = await getRes.text()
    expect(text).toBe(snapshot)
  })

  it('PUT /api/sync/data rejects over-quota payload', async () => {
    const r2 = makeR2({
      'users/user@example.com/files/big.bin': {
        body: 'x'.repeat(100),
        size: CLOUD_QUOTA_BYTES,
      },
    })
    // Force usage high by overriding list sizes via store entry size field
    r2.store.set('users/user@example.com/files/big.bin', {
      body: 'x',
      size: CLOUD_QUOTA_BYTES,
    })
    const env = makeEnv(r2)
    const res = await app.request('/api/sync/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: 1, stores: { a: [1] } }),
    }, env)
    expect(res.status).toBe(413)
  })
})

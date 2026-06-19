import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/security', () => ({
  signJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
  verifyJwt: vi.fn(),
  userFromRequest: vi.fn().mockResolvedValue(null),
  adminFromRequest: vi.fn().mockResolvedValue(null),
}))

vi.mock('../src/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/helpers')>()
  return {
    ...actual,
    rateLimit: vi.fn().mockResolvedValue(true),
  }
})

import { createApp } from '../src/app'
import type { Env } from '../src/types'

function db() {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
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

const env: Env = {
  SCP_DB: db(),
  SCP_READER_DB: db(),
  CHAT_ROOM_DO: {} as DurableObjectNamespace,
  JWT_SECRET: 'test-secret',
  ADMIN_JWT_SECRET: 'admin-secret',
}

describe('POST /api/auth/token', () => {
  it('returns token for valid userId', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; token: string }>()
    expect(body.success).toBe(true)
    expect(body.token).toBe('mock-jwt-token')
  })

  it('returns 400 for empty userId', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ userId: '' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for missing userId', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(400)
  })

  it('returns 400 for userId exceeding 128 chars', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ userId: 'a'.repeat(129) }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('accepts userId at exactly 128 chars', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ userId: 'a'.repeat(128) }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid JSON body', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/token', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(400)
  })
})

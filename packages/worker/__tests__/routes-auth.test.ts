import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/security', () => ({
  signJwt: vi.fn().mockResolvedValue('mock-jwt-token'),
  verifyJwt: vi.fn(),
  userFromRequest: vi.fn().mockResolvedValue(null),
  userSessionFromRequest: vi.fn().mockResolvedValue(null),
  adminFromRequest: vi.fn().mockResolvedValue(null),
  hashPassword: vi.fn().mockResolvedValue('PBKDF2$100000$salt$hash'),
  verifyPassword: vi.fn().mockResolvedValue(true),
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

function db(firstResult: unknown = { account_type: 'guest' }) {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => firstResult,
        all: async () => ({ results: [] }),
        run: async () => ({ success: true, meta: {} }),
      }),
      first: async () => firstResult,
      all: async () => ({ results: [] }),
      run: async () => ({ success: true, meta: {} }),
    }),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

function makeEnv(firstResult: unknown = { account_type: 'guest' }): Env {
  return {
    SCP_DB: db(firstResult),
    SCP_READER_DB: db(null),
    SCP_FILES: {} as R2Bucket,
    CHAT_ROOM_DO: {} as DurableObjectNamespace,
    JWT_SECRET: 'test-secret',
    ADMIN_JWT_SECRET: 'admin-secret',
  }
}

describe('POST /api/auth/token', () => {
  it('returns token for guest userId', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv({ account_type: 'guest' })
    )
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; token: string }>()
    expect(body.success).toBe(true)
    expect(body.token).toBe('mock-jwt-token')
  })

  it('returns 403 for registered userId token refresh', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({ userId: 'user@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv({ account_type: 'registered' })
    )
    expect(res.status).toBe(403)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('FORBIDDEN')
  })

  it('returns 400 for empty userId', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({ userId: '' }),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv()
    )
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for missing userId', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv()
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for userId exceeding 128 chars', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({ userId: 'a'.repeat(129) }),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv()
    )
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('accepts guest userId at exactly 128 chars', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: JSON.stringify({ userId: 'a'.repeat(128) }),
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv({ account_type: 'guest' })
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid JSON body', async () => {
    const app = createApp()
    const res = await app.request(
      '/api/auth/token',
      {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      },
      makeEnv()
    )
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/email-domains', () => {
  it('returns allowed email domains', async () => {
    const app = createApp()
    const res = await app.request('/api/auth/email-domains', {}, makeEnv())
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: string[] }>()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })
})

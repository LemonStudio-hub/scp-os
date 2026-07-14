import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockUserId: string | null = null

vi.mock('../src/security', () => ({
  signJwt: vi.fn(),
  verifyJwt: vi.fn(),
  userFromRequest: vi.fn().mockImplementation(() => Promise.resolve(mockUserId)),
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

function makeDb(mockRows: Record<string, unknown>[] = [], mockRow: Record<string, unknown> | null = null) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(mockRow),
    all: vi.fn().mockResolvedValue({ results: mockRows }),
    run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
  }
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
    _stmt: stmt,
  } as unknown as D1Database & { _stmt: typeof stmt }
}

const baseEnv: Env = {
  SCP_DB: makeDb(),
  SCP_READER_DB: makeDb(),
  CHAT_ROOM_DO: {} as DurableObjectNamespace,
  JWT_SECRET: 'test-secret',
  ADMIN_JWT_SECRET: 'admin-secret',
}

describe('POST /api/user/register', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('returns 401 without auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ nickname: 'TestUser' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing nickname', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
  })

  it('registers user with valid nickname', async () => {
    mockUserId = 'user-123'
    // first() is called: 1) check if nickname taken (should be null), 2) fetch inserted user
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn()
        .mockResolvedValueOnce(null)  // nickname not taken
        .mockResolvedValueOnce({ id: 1, user_id: 'user-123', nickname: 'TestUser' }), // fetch user after insert
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
    }
    const mockDb = {
      prepare: vi.fn().mockReturnValue(stmt),
      dump: async () => new ArrayBuffer(0),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ nickname: 'TestUser' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })

  it('allows shared guest nicknames (no 409 for display-name collisions)', async () => {
    mockUserId = 'user-123'
    // first() returns existing guest row; guests may share nicknames
    const mockDb = makeDb([], { account_type: 'guest' })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ nickname: 'SharedGuest' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })
})

describe('GET /api/user/check-nickname', () => {
  it('returns available true when nickname is free', async () => {
    const mockDb = makeDb([], null)
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/check-nickname?nickname=FreeName', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; available: boolean }>()
    expect(body.success).toBe(true)
    expect(body.available).toBe(true)
  })

  it('returns available true for guests even if nickname already used as display name', async () => {
    // Registered uniqueness is enforced at /api/auth/register; guest display names may collide
    const mockDb = makeDb([], { id: 1 })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/check-nickname?nickname=TakenName', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; available: boolean }>()
    expect(body.available).toBe(true)
  })

  it('returns 400 for missing nickname', async () => {
    const app = createApp()
    const res = await app.request('/api/user/check-nickname', {} , baseEnv)
    expect(res.status).toBe(400)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(false)
  })
})

describe('GET /api/user/:userId', () => {
  it('returns user when found', async () => {
    const mockDb = makeDb([], { id: 1, user_id: 'user-123', nickname: 'TestUser' })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/user-123', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: { user_id: string } }>()
    expect(body.success).toBe(true)
    expect(body.data.user_id).toBe('user-123')
  })

  it('returns 404 when user not found', async () => {
    const mockDb = makeDb([], null)
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/api/user/nonexistent', {} , env)
    expect(res.status).toBe(404)
    const body = await res.json<{ success: boolean; error: string }>()
    expect(body.success).toBe(false)
    expect(body.error).toBe('User not found')
  })
})

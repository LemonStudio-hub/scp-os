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
    chatRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    userSetting: vi.fn().mockResolvedValue(null),
    broadcastMessages: vi.fn().mockResolvedValue({ success: true, count: 5 }),
  }
})

import { createApp } from '../src/app'
import type { Env } from '../src/types'

function makeDb(opts: {
  rows?: Record<string, unknown>[]
  row?: Record<string, unknown> | null
  runResult?: { success: boolean; meta: { last_row_id?: number } }
} = {}) {
  const { rows = [], row = null, runResult = { success: true, meta: { last_row_id: 1 } } } = opts
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(row),
    all: vi.fn().mockResolvedValue({ results: rows }),
    run: vi.fn().mockResolvedValue(runResult),
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

describe('POST /chat/send', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing content', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('sends message successfully', async () => {
    mockUserId = 'user-123'
    const message = { id: 1, user_id: 'user-123', content: 'hello', room_id: 1 }
    const mockDb = makeDb({ row: message })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: { id: number } }>()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(1)
  })

  it('returns 429 when rate limited', async () => {
    mockUserId = 'user-123'
    const { chatRateLimit } = await import('../src/helpers')
    vi.mocked(chatRateLimit).mockResolvedValueOnce({ allowed: false })
    const app = createApp()
    const res = await app.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(429)
  })
})

describe('GET /chat/messages', () => {
  it('returns messages list', async () => {
    const messages = [
      { id: 1, content: 'hello', room_id: 1, created_at: '2024-01-01' },
      { id: 2, content: 'world', room_id: 1, created_at: '2024-01-02' },
    ]
    const mockDb = makeDb({ rows: messages })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/messages', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[]; count: number }>()
    expect(body.success).toBe(true)
    expect(body.count).toBe(2)
  })

  it('filters by room_id', async () => {
    const mockDb = makeDb({ rows: [{ id: 1, room_id: 2 }] })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/messages?room_id=2', {} , env)
    expect(res.status).toBe(200)
  })

  it('filters by after timestamp', async () => {
    const mockDb = makeDb({ rows: [] })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/messages?after=2024-01-01', {} , env)
    expect(res.status).toBe(200)
  })
})

describe('GET /chat/rooms', () => {
  it('returns rooms list', async () => {
    const rooms = [
      { id: 1, name: 'General', member_count: 10, last_message: 'hello' },
      { id: 2, name: 'Tech', member_count: 5, last_message: null },
    ]
    const mockDb = makeDb({ rows: rooms })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/rooms', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[] }>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
  })
})

describe('POST /chat/rooms', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Room' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing name', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
    const body = await res.json<{ code: string }>()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('creates room successfully', async () => {
    mockUserId = 'user-123'
    const room = { id: 1, name: 'Test Room', created_by: 'user-123' }
    // first() is called twice: once for count check, once for inserted room
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn()
        .mockResolvedValueOnce({ count: 0 }) // room count check
        .mockResolvedValueOnce(room),        // fetch inserted room
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
    const res = await app.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Room' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(201)
    const body = await res.json<{ success: boolean; data: { name: string } }>()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe('Test Room')
  })

  it('returns 400 when user has 5 rooms already', async () => {
    mockUserId = 'user-123'
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValueOnce({ count: 5 }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
    }
    const mockDb = {
      prepare: vi.fn().mockReturnValue(stmt),
      dump: async () => new ArrayBuffer(0),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as D1Database
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ name: 'Another Room' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(400)
    const body = await res.json<{ success: boolean; error: string }>()
    expect(body.error).toContain('at most 5')
  })
})

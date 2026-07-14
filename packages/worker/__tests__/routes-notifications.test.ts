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

function makeDb(opts: { rows?: Record<string, unknown>[]; row?: Record<string, unknown> | null } = {}) {
  const { rows = [], row = null } = opts
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(row),
    all: vi.fn().mockResolvedValue({ results: rows }),
    run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
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
  SCP_FILES: {} as R2Bucket,
  CHAT_ROOM_DO: {} as DurableObjectNamespace,
  JWT_SECRET: 'test-secret',
  ADMIN_JWT_SECRET: 'admin-secret',
}

describe('GET /notifications', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/notifications', {} , baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns notifications for authenticated user', async () => {
    mockUserId = 'user-123'
    const notifications = [
      { id: 1, recipient_user_id: 'user-123', message: 'Test notification', is_read: 0 },
    ]
    const mockDb = makeDb({ rows: notifications })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[]; count: number }>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.count).toBe(1)
  })

  it('filters unread notifications', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb({ rows: [{ id: 1, is_read: 0 }] })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications?unread=true', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })
})

describe('POST /notifications/mark-read', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ all: true }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('marks all as read', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb()
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ all: true }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })

  it('marks single notification as read', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb()
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id: 42 }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
  })

  it('marks multiple notifications as read by ids', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb()
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids: [1, 2, 3] }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
  })
})

describe('DELETE /notifications/:id', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/notifications/1', {
      method: 'DELETE',
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('deletes notification for authenticated user', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb()
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/42', {
      method: 'DELETE',
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })
})

describe('GET /notifications/preferences', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/notifications/preferences', {} , baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns stored preferences when found', async () => {
    mockUserId = 'user-123'
    const prefs = { user_id: 'user-123', feedback_comment: 1, feedback_upvote: 0, feedback_downvote: 1, chat_message: 1 }
    const mockDb = makeDb({ row: prefs })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/preferences', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: Record<string, unknown> }>()
    expect(body.success).toBe(true)
    expect(body.data.user_id).toBe('user-123')
  })

  it('returns default preferences when none stored', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb({ row: null })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/notifications/preferences', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: Record<string, unknown> }>()
    expect(body.success).toBe(true)
    expect(body.data.feedback_comment).toBe(1)
    expect(body.data.chat_message).toBe(1)
  })
})

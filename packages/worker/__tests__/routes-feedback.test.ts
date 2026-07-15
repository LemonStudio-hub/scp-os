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

function makeDb(opts: {
  rows?: Record<string, unknown>[]
  row?: Record<string, unknown> | null
  countRow?: { total: number }
  runResult?: { success: boolean; meta: { last_row_id?: number } }
} = {}) {
  const { rows = [], row = null, countRow = { total: 0 }, runResult = { success: true, meta: { last_row_id: 1 } } } = opts
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(row),
    all: vi.fn().mockResolvedValue({ results: rows }),
    run: vi.fn().mockResolvedValue(runResult),
  }
  // The count helper calls first(), so we set up a sequence if needed
  stmt.first
    .mockResolvedValueOnce(row)       // first regular call
    .mockResolvedValue(countRow)      // subsequent calls (count uses first)
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

describe('POST /feedback/submit', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Content' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing title', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ content: 'Content only' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing content', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ title: 'Title only' }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
  })

  it('submits feedback with valid data', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb({
      row: { id: 1, title: 'Test', content: 'Content', category: 'general', user_id: 'user-123' },
      rows: [],
    })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Content' }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(201)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })
})

describe('GET /feedback/list', () => {
  it('returns feedback list with pagination', async () => {
    // The list handler: 1) all() for feedbacks, 2) first() via count() for total
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ total: 1 }),  // count() uses first()
      all: vi.fn().mockResolvedValue({
        results: [
          { id: 1, title: 'Feedback 1', content: 'Content', status: 'published', commentsCount: 0, upvotes: 0, downvotes: 0 },
        ],
      }),
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
    const res = await app.request('/feedback/list', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[]; count: number }>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.count).toBe(1)
  })

  it('filters by category', async () => {
    const mockDb = makeDb({ rows: [], countRow: { total: 0 } })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/feedback/list?category=bug', {} , env)
    expect(res.status).toBe(200)
  })
})

describe('POST /feedback/like', () => {
  beforeEach(() => {
    mockUserId = null
  })

  it('requires auth', async () => {
    mockUserId = null
    const app = createApp()
    const res = await app.request('/feedback/like', {
      method: 'POST',
      body: JSON.stringify({ id: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing id', async () => {
    mockUserId = 'user-123'
    const app = createApp()
    const res = await app.request('/feedback/like', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }, baseEnv)
    expect(res.status).toBe(400)
  })

  it('likes feedback successfully', async () => {
    mockUserId = 'user-123'
    const mockDb = makeDb({
      row: { upvotes: 5 },
      runResult: { success: true, meta: { last_row_id: 1 } },
    })
    // Need second first() call to return upvotes
    mockDb._stmt.first
      .mockResolvedValueOnce(null)  // first call in the route
      .mockResolvedValue({ upvotes: 5 })  // subsequent calls
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/feedback/like', {
      method: 'POST',
      body: JSON.stringify({ id: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean }>()
    expect(body.success).toBe(true)
  })
})

describe('GET /feedback/categories', () => {
  it('returns category counts', async () => {
    const mockDb = makeDb({
      rows: [
        { category: 'general', count: 10 },
        { category: 'bug', count: 5 },
      ],
    })
    const env = { ...baseEnv, SCP_DB: mockDb }
    const app = createApp()
    const res = await app.request('/feedback/categories', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[] }>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
  })
})

import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/security', () => ({
  signJwt: vi.fn(),
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

function makeReaderDb(opts: {
  rows?: Record<string, unknown>[]
  row?: Record<string, unknown> | null
  countRow?: { total: number }
} = {}) {
  const { rows = [], row = null, countRow = { total: 0 } } = opts
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(countRow),
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

function makeDb() {
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

const baseEnv: Env = {
  SCP_DB: makeDb(),
  SCP_READER_DB: makeDb(),
  SCP_FILES: {} as R2Bucket,
  CHAT_ROOM_DO: {} as DurableObjectNamespace,
  JWT_SECRET: 'test-secret',
  ADMIN_JWT_SECRET: 'admin-secret',
}

describe('GET /docs/items', () => {
  it('returns items with pagination', async () => {
    const items = [
      { scp_number: '001', title: 'SCP-001', object_class: 'Keter' },
      { scp_number: '002', title: 'SCP-002', object_class: 'Euclid' },
    ]
    const mockReaderDb = makeReaderDb({ rows: items, countRow: { total: 2 } })
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/items', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: unknown[]; pagination: { total: number; has_more: boolean } }>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.pagination.total).toBe(2)
    expect(body.pagination.has_more).toBe(false)
  })

  it('filters by scp_class', async () => {
    const mockReaderDb = makeReaderDb({ rows: [], countRow: { total: 0 } })
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/items?scp_class=Keter', {} , env)
    expect(res.status).toBe(200)
  })

  it('filters by search query q', async () => {
    const mockReaderDb = makeReaderDb({ rows: [], countRow: { total: 0 } })
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/items?q=173', {} , env)
    expect(res.status).toBe(200)
  })

  it('respects limit and offset', async () => {
    const mockReaderDb = makeReaderDb({ rows: [], countRow: { total: 100 } })
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/items?limit=10&offset=20', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ pagination: { has_more: boolean } }>()
    expect(body.pagination.has_more).toBe(true)
  })
})

function makeItemDb(row: Record<string, unknown> | null) {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(row),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
  }
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

describe('GET /docs/item/:scpNumber', () => {
  it('returns item when found', async () => {
    const item = { scp_number: '173', title: 'SCP-173', object_class: 'Euclid' }
    const mockReaderDb = makeItemDb(item)
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/item/173', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: { scp_number: string } }>()
    expect(body.success).toBe(true)
    expect(body.data.scp_number).toBe('173')
  })

  it('returns 404 when not found', async () => {
    const mockReaderDb = makeItemDb(null)
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/item/99999', {} , env)
    expect(res.status).toBe(404)
    const body = await res.json<{ success: boolean; error: string }>()
    expect(body.success).toBe(false)
    expect(body.error).toBe('SCP item not found')
  })
})

describe('GET /docs/content/:scpNumber', () => {
  it('returns content when available', async () => {
    const row = { content: 'SCP-173 description text', content_file: null }
    const mockReaderDb = makeItemDb(row)
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/content/173', {} , env)
    expect(res.status).toBe(200)
    const body = await res.json<{ success: boolean; data: { scp_number: string; content: string; cached: boolean } }>()
    expect(body.success).toBe(true)
    expect(body.data.content).toBe('SCP-173 description text')
    expect(body.data.scp_number).toBe('173')
    expect(body.data.cached).toBe(true)
  })

  it('returns 404 when content is not available', async () => {
    const mockReaderDb = makeItemDb({ content: null })
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/content/001', {} , env)
    expect(res.status).toBe(404)
    const body = await res.json<{ success: boolean; error: string }>()
    expect(body.error).toBe('Content not available')
  })

  it('returns 404 when item not found', async () => {
    const mockReaderDb = makeItemDb(null)
    const env = { ...baseEnv, SCP_READER_DB: mockReaderDb }
    const app = createApp()
    const res = await app.request('/docs/content/99999', {} , env)
    expect(res.status).toBe(404)
  })
})

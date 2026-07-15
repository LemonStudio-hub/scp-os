import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  adminSecret,
  defaultNotificationPreferences,
  userSetting,
  rateLimit,
  chatRateLimit,
  broadcastMessages,
  searchIndex,
  scpStats,
} from '../src/helpers'

function mockDb(opts: { firstResult?: unknown; allResult?: unknown[]; runResult?: { success: boolean; meta: Record<string, unknown> } } = {}) {
  const { firstResult = null, allResult = [], runResult = { success: true, meta: {} } } = opts
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(firstResult),
    all: vi.fn().mockResolvedValue({ results: allResult }),
    run: vi.fn().mockResolvedValue(runResult),
  }
  return {
    db: { prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database,
    stmt,
  }
}

describe('adminSecret', () => {
  it('returns ADMIN_JWT_SECRET when set', () => {
    const env = { ADMIN_JWT_SECRET: 'admin-key', JWT_SECRET: 'user-key' } as never
    expect(adminSecret(env)).toBe('admin-key')
  })

  it('falls back to JWT_SECRET when ADMIN_JWT_SECRET is empty', () => {
    const env = { ADMIN_JWT_SECRET: '', JWT_SECRET: 'user-key' } as never
    expect(adminSecret(env)).toBe('user-key')
  })

  it('falls back to default when both are empty', () => {
    const env = { ADMIN_JWT_SECRET: '', JWT_SECRET: '' } as never
    expect(() => adminSecret(env)).toThrow(/not configured/)
  })

  it('falls back to default when both are undefined', () => {
    const env = {} as never
    expect(() => adminSecret(env)).toThrow(/not configured/)
  })
})

describe('defaultNotificationPreferences', () => {
  it('returns default preferences for a user', () => {
    const result = defaultNotificationPreferences('user-123')
    expect(result).toEqual({
      user_id: 'user-123',
      feedback_comment: 1,
      feedback_upvote: 1,
      feedback_downvote: 1,
      chat_message: 1,
    })
  })

  it('uses the provided userId', () => {
    const result = defaultNotificationPreferences('abc-def')
    expect(result.user_id).toBe('abc-def')
  })
})

describe('userSetting', () => {
  it('returns value when setting exists', async () => {
    const { db, stmt } = mockDb({ firstResult: { value: 'my-nickname' } })
    const result = await userSetting(db, 'nickname_user-123')
    expect(result).toBe('my-nickname')
    expect(db.prepare).toHaveBeenCalledWith('SELECT value FROM user_settings WHERE key = ?')
    expect(stmt.bind).toHaveBeenCalledWith('nickname_user-123')
  })

  it('returns null when setting does not exist', async () => {
    const { db } = mockDb({ firstResult: null })
    const result = await userSetting(db, 'nonexistent_key')
    expect(result).toBeNull()
  })

  it('returns null when value is empty string', async () => {
    const { db } = mockDb({ firstResult: { value: '' } })
    const result = await userSetting(db, 'some_key')
    expect(result).toBeNull()
  })
})

describe('rateLimit', () => {
  it('returns true when under the limit', async () => {
    const { db, stmt } = mockDb({ firstResult: { timestamps: JSON.stringify([Date.now()]) } })
    const env = { SCP_DB: db } as never
    const result = await rateLimit(env, 'user-123')
    expect(result).toBe(true)
  })

  it('returns true when no previous timestamps', async () => {
    const { db } = mockDb({ firstResult: null })
    const env = { SCP_DB: db } as never
    const result = await rateLimit(env, 'user-123')
    expect(result).toBe(true)
  })

  it('returns false when over the limit (120 requests in window)', async () => {
    const now = Date.now()
    const timestamps = Array.from({ length: 120 }, () => now - 1000) // all within window
    const { db } = mockDb({ firstResult: { timestamps: JSON.stringify(timestamps) } })
    const env = { SCP_DB: db } as never
    const result = await rateLimit(env, 'user-123')
    expect(result).toBe(false)
  })

  it('returns true when SCP_DB is not available', async () => {
    const env = {} as never
    const result = await rateLimit(env, 'user-123')
    expect(result).toBe(true)
  })

  it('swallows DB errors and returns true', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockRejectedValue(new Error('DB error')),
      all: vi.fn(),
      run: vi.fn(),
    }
    const db = { prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database
    const env = { SCP_DB: db } as never
    const result = await rateLimit(env, 'user-123')
    expect(result).toBe(true)
  })
})

describe('chatRateLimit', () => {
  it('returns allowed true when under limit', async () => {
    const { db, stmt } = mockDb({ firstResult: { count: 5 } })
    const result = await chatRateLimit(db, 'user-123')
    expect(result).toEqual({ allowed: true })
  })

  it('returns allowed false when at limit (10 messages per minute)', async () => {
    const { db } = mockDb({ firstResult: { count: 10 } })
    const result = await chatRateLimit(db, 'user-123')
    expect(result).toEqual({ allowed: false })
  })

  it('returns allowed true when no messages', async () => {
    const { db } = mockDb({ firstResult: null })
    const result = await chatRateLimit(db, 'user-123')
    expect(result).toEqual({ allowed: true })
  })
})

describe('broadcastMessages', () => {
  it('returns success with count of broadcast messages', async () => {
    const { db, stmt } = mockDb({
      allResult: [{ id: 1 }, { id: 2 }, { id: 3 }],
      runResult: { success: true, meta: {} },
    })
    const result = await broadcastMessages(db)
    expect(result.success).toBe(true)
    expect(result.count).toBe(3)
  })

  it('returns error on failure', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn().mockRejectedValue(new Error('DB failure')),
      run: vi.fn(),
    }
    const db = { prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database
    const result = await broadcastMessages(db)
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB failure')
  })
})

describe('searchIndex', () => {
  it('searches without clearance filter', async () => {
    const { db, stmt } = mockDb({
      allResult: [{ scp_id: 'SCP-173', name: 'The Sculpture' }],
    })
    const result = await searchIndex(db, '173')
    expect(result).toHaveLength(1)
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining('clearance_level')
    )
    expect(db.prepare).toHaveBeenCalledWith(
      expect.not.stringContaining('clearance_level <=')
    )
  })

  it('searches with clearance filter', async () => {
    const { db, stmt } = mockDb({
      allResult: [{ scp_id: 'SCP-173', name: 'The Sculpture' }],
    })
    const result = await searchIndex(db, '173', 3)
    expect(result).toHaveLength(1)
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining('clearance_level <=')
    )
    expect(stmt.bind).toHaveBeenCalledWith('%173%', '%173%', 3)
  })
})

describe('scpStats', () => {
  it('returns aggregated stats', async () => {
    const classes = [
      { object_class: 'Keter', count: 50 },
      { object_class: 'Euclid', count: 100 },
    ]
    const clearances = [
      { clearance_level: 1, count: 30 },
      { clearance_level: 2, count: 120 },
    ]
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ total: 150 }),
      all: vi.fn()
        .mockResolvedValueOnce({ results: classes })
        .mockResolvedValueOnce({ results: clearances }),
      run: vi.fn(),
    }
    const db = { prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database
    const result = await scpStats(db) as {
      total: number
      byClass: Record<string, number>
      byClearance: Record<string, number>
    }
    expect(result.total).toBe(150)
    expect(result.byClass).toEqual({ Keter: 50, Euclid: 100 })
    expect(result.byClearance).toEqual({ 1: 30, 2: 120 })
  })
})

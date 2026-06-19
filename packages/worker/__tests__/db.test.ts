import { describe, it, expect, vi, beforeEach } from 'vitest'
import { first, all, run, count, logAdmin } from '../src/db'

function mockDb() {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  }
  return {
    db: { prepare: vi.fn().mockReturnValue(stmt) } as unknown as D1Database,
    stmt,
  }
}

describe('first', () => {
  it('returns the first row when found', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce({ id: 1, name: 'test' })
    const result = await first<{ id: number; name: string }>(db, 'SELECT * FROM users WHERE id = ?', [1])
    expect(result).toEqual({ id: 1, name: 'test' })
    expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?')
    expect(stmt.bind).toHaveBeenCalledWith(1)
  })

  it('returns null when no row found', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce(null)
    const result = await first(db, 'SELECT * FROM users WHERE id = ?', [999])
    expect(result).toBeNull()
  })

  it('returns null when first returns undefined', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce(undefined)
    const result = await first(db, 'SELECT * FROM users WHERE id = ?', [999])
    expect(result).toBeNull()
  })
})

describe('all', () => {
  it('returns results array', async () => {
    const { db, stmt } = mockDb()
    stmt.all.mockResolvedValueOnce({ results: [{ id: 1 }, { id: 2 }] })
    const result = await all<{ id: number }>(db, 'SELECT * FROM users')
    expect(result).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('returns empty array when no results', async () => {
    const { db, stmt } = mockDb()
    stmt.all.mockResolvedValueOnce({ results: [] })
    const result = await all(db, 'SELECT * FROM users')
    expect(result).toEqual([])
  })

  it('returns empty array when results is undefined', async () => {
    const { db, stmt } = mockDb()
    stmt.all.mockResolvedValueOnce({})
    const result = await all(db, 'SELECT * FROM users')
    expect(result).toEqual([])
  })

  it('passes params to bind', async () => {
    const { db, stmt } = mockDb()
    stmt.all.mockResolvedValueOnce({ results: [] })
    await all(db, 'SELECT * FROM users WHERE id = ? AND name = ?', [1, 'test'])
    expect(stmt.bind).toHaveBeenCalledWith(1, 'test')
  })
})

describe('run', () => {
  it('returns D1Result', async () => {
    const { db, stmt } = mockDb()
    const d1Result = { success: true, meta: { last_row_id: 5, changes: 1 } }
    stmt.run.mockResolvedValueOnce(d1Result)
    const result = await run(db, 'INSERT INTO users (name) VALUES (?)', ['test'])
    expect(result).toBe(d1Result)
    expect(db.prepare).toHaveBeenCalledWith('INSERT INTO users (name) VALUES (?)')
    expect(stmt.bind).toHaveBeenCalledWith('test')
  })
})

describe('count', () => {
  it('returns count from COUNT(*) query', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce({ total: 42 })
    const result = await count(db, 'users')
    expect(result).toBe(42)
  })

  it('returns 0 when no row', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce(null)
    const result = await count(db, 'users')
    expect(result).toBe(0)
  })

  it('uses custom where clause', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce({ total: 5 })
    const result = await count(db, 'users', 'is_banned = ?', [1])
    expect(result).toBe(5)
    expect(db.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as total FROM users WHERE is_banned = ?')
    expect(stmt.bind).toHaveBeenCalledWith(1)
  })

  it('uses default where 1=1', async () => {
    const { db, stmt } = mockDb()
    stmt.first.mockResolvedValueOnce({ total: 10 })
    await count(db, 'feedbacks')
    expect(db.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as total FROM feedbacks WHERE 1=1')
  })
})

describe('logAdmin', () => {
  it('inserts admin log entry', async () => {
    const { db, stmt } = mockDb()
    stmt.run.mockResolvedValueOnce({ success: true, meta: {} })
    await logAdmin(db, 1, 'admin', 'delete_user', 'user', '123', 'deleted', '1.2.3.4')
    expect(db.prepare).toHaveBeenCalledWith(
      'INSERT INTO admin_logs (admin_id, admin_username, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    expect(stmt.bind).toHaveBeenCalledWith(1, 'admin', 'delete_user', 'user', '123', 'deleted', '1.2.3.4')
  })

  it('swallows errors silently', async () => {
    const { db, stmt } = mockDb()
    stmt.run.mockRejectedValueOnce(new Error('DB error'))
    await expect(logAdmin(db, 1, 'admin', 'test')).resolves.toBeUndefined()
  })

  it('uses default empty strings for optional params', async () => {
    const { db, stmt } = mockDb()
    stmt.run.mockResolvedValueOnce({ success: true, meta: {} })
    await logAdmin(db, 1, 'admin', 'test')
    expect(stmt.bind).toHaveBeenCalledWith(1, 'admin', 'test', '', '', '', '')
  })
})

import { describe, it, expect } from 'vitest'
import { safeTable, safeParse, contentTable, normalizeFeedback, scpUrl } from '../src/helpers'

describe('safeTable', () => {
  it('accepts valid table names', () => {
    expect(safeTable('users')).toBe('users')
    expect(safeTable('scp_items')).toBe('scp_items')
    expect(safeTable('_internal')).toBe('_internal')
  })

  it('rejects table names with special characters', () => {
    expect(() => safeTable('users; DROP TABLE')).toThrow('Invalid table')
    expect(() => safeTable('users--')).toThrow('Invalid table')
    expect(() => safeTable('')).toThrow('Invalid table')
    expect(() => safeTable('users OR 1=1')).toThrow('Invalid table')
  })
})

describe('safeParse', () => {
  it('parses valid JSON', () => {
    expect(safeParse('{"key":"value"}')).toEqual({ key: 'value' })
    expect(safeParse('[1,2,3]')).toEqual([1, 2, 3])
    expect(safeParse('"hello"')).toBe('hello')
  })

  it('returns original string for invalid JSON', () => {
    expect(safeParse('not json')).toBe('not json')
    expect(safeParse('')).toBe('')
  })
})

describe('contentTable', () => {
  it('maps known types to tables', () => {
    expect(contentTable('scp')).toBe('scp_items')
    expect(contentTable('scps')).toBe('scp_items')
    expect(contentTable('items')).toBe('scp_items')
    expect(contentTable('tales')).toBe('scp_tales')
    expect(contentTable('hubs')).toBe('scp_hubs')
    expect(contentTable('goi')).toBe('scp_goi')
    expect(contentTable('feedback')).toBe('feedbacks')
    expect(contentTable('feedbacks')).toBe('feedbacks')
  })

  it('defaults to scp_items for unknown types', () => {
    expect(contentTable('unknown')).toBe('scp_items')
    expect(contentTable('')).toBe('scp_items')
  })
})

describe('normalizeFeedback', () => {
  it('normalizes feedback row', () => {
    const row = { id: '1', commentsCount: 5, upvotes: 10, downvotes: 2, title: 'Test' }
    const result = normalizeFeedback(row)
    expect(result.id).toBe(1)
    expect(result.comments_count).toBe(5)
    expect(result.upvotes).toBe(10)
    expect(result.downvotes).toBe(2)
    expect(result.title).toBe('Test')
  })

  it('handles missing fields with defaults', () => {
    const row = { id: '42' }
    const result = normalizeFeedback(row)
    expect(result.id).toBe(42)
    expect(result.comments_count).toBe(0)
    expect(result.upvotes).toBe(0)
    expect(result.downvotes).toBe(0)
  })

  it('prefers commentsCount over comments_count', () => {
    const row = { id: '1', commentsCount: 5, comments_count: 3 }
    const result = normalizeFeedback(row)
    expect(result.comments_count).toBe(5)
  })
})

describe('scpUrl', () => {
  it('generates English URL by default', () => {
    expect(scpUrl('173', 'en')).toBe('https://scp-wiki.wikidot.com/scp-173')
  })

  it('generates Chinese URL for cn branch', () => {
    expect(scpUrl('173', 'cn')).toBe('https://scp-wiki-cn.wikidot.com/scp-173')
  })
})

import { describe, it, expect } from 'vitest'
import { json, requestInfo, intValue, cleanText, readJson, isChatSocket } from '../src/http'

describe('json', () => {
  it('returns Response with status 200 by default', async () => {
    const res = json({ ok: true })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('returns Response with custom status', async () => {
    const res = json({ error: 'bad' }, 400)
    expect(res.status).toBe(400)
  })

  it('sets cache-control headers', () => {
    const res = json({})
    expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(res.headers.get('Expires')).toBe('0')
  })
})

describe('requestInfo', () => {
  it('extracts ip from CF-Connecting-IP header', () => {
    const req = new Request('https://example.com', {
      headers: { 'CF-Connecting-IP': '1.2.3.4', Origin: 'https://app.example', 'User-Agent': 'TestBot/1.0' },
    })
    const info = requestInfo(req)
    expect(info.ip).toBe('1.2.3.4')
    expect(info.origin).toBe('https://app.example')
    expect(info.userAgent).toBe('TestBot/1.0')
  })

  it('falls back to unknown ip when CF-Connecting-IP is missing', () => {
    const req = new Request('https://example.com')
    const info = requestInfo(req)
    expect(info.ip).toBe('unknown')
    expect(info.origin).toBe('')
    expect(info.userAgent).toBe('')
  })

  it('uses Referer when Origin is absent', () => {
    const req = new Request('https://example.com', { headers: { Referer: 'https://ref.example' } })
    expect(requestInfo(req).origin).toBe('https://ref.example')
  })
})

describe('intValue', () => {
  it('parses integer from string', () => {
    expect(intValue('42', 0)).toBe(42)
  })

  it('returns fallback for null', () => {
    expect(intValue(null, 10)).toBe(10)
  })

  it('returns fallback for undefined', () => {
    expect(intValue(undefined, 5)).toBe(5)
  })

  it('returns fallback for non-numeric string', () => {
    expect(intValue('abc', 7)).toBe(7)
  })

  it('caps value at max when provided', () => {
    expect(intValue('500', 0, 200)).toBe(200)
  })

  it('does not cap when value is below max', () => {
    expect(intValue('50', 0, 200)).toBe(50)
  })

  it('does not cap when max is not provided', () => {
    expect(intValue('9999', 0)).toBe(9999)
  })
})

describe('cleanText', () => {
  it('encodes HTML special characters', () => {
    expect(cleanText('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('encodes ampersand and single quote', () => {
    expect(cleanText("a & b 'c'")).toBe('a &amp; b &#39;c&#39;')
  })

  it('trims whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello')
  })

  it('truncates to max length', () => {
    const long = 'a'.repeat(3000)
    expect(cleanText(long, 100)).toHaveLength(100)
  })

  it('defaults max to 2000', () => {
    const long = 'a'.repeat(2500)
    expect(cleanText(long)).toHaveLength(2000)
  })

  it('returns empty string for null/undefined', () => {
    expect(cleanText(null)).toBe('')
    expect(cleanText(undefined)).toBe('')
  })
})

describe('readJson', () => {
  it('parses valid JSON body', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await readJson<{ key: string }>(req)
    expect(result).toEqual({ key: 'value' })
  })

  it('returns null for invalid JSON', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      body: 'not json {{{',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await readJson(req)
    expect(result).toBeNull()
  })
})

describe('isChatSocket', () => {
  it('detects WebSocket upgrade on /chat/ws', () => {
    const req = new Request('https://example.com/chat/ws', {
      headers: { Upgrade: 'websocket' },
    })
    expect(isChatSocket(req)).toBe(true)
  })

  it('detects WebSocket upgrade on /chat/room/123/ws', () => {
    const req = new Request('https://example.com/chat/room/123/ws', {
      headers: { Upgrade: 'websocket' },
    })
    expect(isChatSocket(req)).toBe(true)
  })

  it('returns false without Upgrade header', () => {
    const req = new Request('https://example.com/chat/ws')
    expect(isChatSocket(req)).toBe(false)
  })

  it('returns false for non-matching path', () => {
    const req = new Request('https://example.com/chat/messages', {
      headers: { Upgrade: 'websocket' },
    })
    expect(isChatSocket(req)).toBe(false)
  })

  it('returns false for /chat/room/abc/ws (non-numeric id)', () => {
    const req = new Request('https://example.com/chat/room/abc/ws', {
      headers: { Upgrade: 'websocket' },
    })
    expect(isChatSocket(req)).toBe(false)
  })
})

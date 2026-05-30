import { describe, it, expect } from 'vitest'
import { signJwt, verifyJwt, hasRole } from '../src/security'

describe('JWT', () => {
  const secret = 'test-secret-key-for-testing'

  describe('signJwt and verifyJwt', () => {
    it('signs and verifies a token', async () => {
      const payload = { userId: 'user-123' }
      const token = await signJwt(payload, secret, 3600)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)

      const decoded = await verifyJwt<{ userId: string }>(token, secret)
      expect(decoded).not.toBeNull()
      expect(decoded!.userId).toBe('user-123')
    })

    it('rejects token with wrong secret', async () => {
      const token = await signJwt({ userId: 'user-123' }, secret, 3600)
      const decoded = await verifyJwt(token, 'wrong-secret')
      expect(decoded).toBeNull()
    })

    it('rejects expired token', async () => {
      const token = await signJwt({ userId: 'user-123' }, secret, -10)
      const decoded = await verifyJwt(token, secret)
      expect(decoded).toBeNull()
    })

    it('rejects malformed token', async () => {
      const decoded = await verifyJwt('not.a.valid.token', secret)
      expect(decoded).toBeNull()
    })

    it('rejects token with only two parts', async () => {
      const decoded = await verifyJwt('header.payload', secret)
      expect(decoded).toBeNull()
    })
  })
})

describe('hasRole', () => {
  it('returns true when admin has matching role', () => {
    expect(hasRole({ adminId: 1, username: 'admin', role: 'super_admin' }, ['super_admin'])).toBe(true)
  })

  it('returns true when admin has one of multiple roles', () => {
    expect(hasRole({ adminId: 1, username: 'admin', role: 'moderator' }, ['super_admin', 'admin', 'moderator'])).toBe(true)
  })

  it('returns false when admin does not have matching role', () => {
    expect(hasRole({ adminId: 1, username: 'admin', role: 'moderator' }, ['super_admin'])).toBe(false)
  })
})

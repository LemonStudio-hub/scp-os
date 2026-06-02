import { describe, it, expect } from 'vitest'
import { hashPassword, signJwt, verifyJwt, verifyPassword } from '../src/security'

describe('JWT', () => {
  const secret = 'test-secret-key-for-testing'

  describe('signJwt and verifyJwt', () => {
    it('signs and verifies a token', async () => {
      const payload = { userId: 'user-123', accountType: 'guest' as const }
      const token = await signJwt(payload, secret, 3600)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)

      const decoded = await verifyJwt(token, secret)
      expect(decoded).not.toBeNull()
      expect(decoded!.userId).toBe('user-123')
    })

    it('rejects token with wrong secret', async () => {
      const token = await signJwt({ userId: 'user-123', accountType: 'guest' }, secret, 3600)
      const decoded = await verifyJwt(token, 'wrong-secret')
      expect(decoded).toBeNull()
    })

    it('rejects expired token', async () => {
      const token = await signJwt({ userId: 'user-123', accountType: 'guest' }, secret, -10)
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
  it('hashes and verifies passwords', async () => {
    const stored = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('correct horse battery staple', stored)).resolves.toBe(true)
    await expect(verifyPassword('wrong password', stored)).resolves.toBe(false)
  })
})

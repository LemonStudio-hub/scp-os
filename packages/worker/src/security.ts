import type { JwtUserPayload, UserSession } from './types'

function encodeBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let raw = ''
  for (const byte of view) raw += String.fromCharCode(byte)
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array {
  let input = value.replace(/-/g, '+').replace(/_/g, '/')
  while (input.length % 4) input += '='
  const raw = atob(input)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function signJwt(payload: Record<string, unknown>, secret: string, ttlSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds }
  const header = encodeBase64Url(bytes(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = encodeBase64Url(bytes(JSON.stringify(fullPayload)))
  const data = `${header}.${body}`
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), bytes(data))
  return `${data}.${encodeBase64Url(signature)}`
}

export async function verifyJwt<T extends JwtUserPayload>(token: string, secret: string): Promise<T | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, signature] = parts
    const data = `${header}.${body}`
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), decodeBase64Url(signature), bytes(data))
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(body))) as T
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function userSessionFromRequest(request: Request, secret?: string): Promise<UserSession | null> {
  const token = bearer(request)
  if (!token || !secret) return null
  const payload = await verifyJwt<JwtUserPayload>(token, secret)
  if (!payload?.userId || !payload.accountType) return null
  if (payload.accountType !== 'guest' && payload.accountType !== 'registered') return null
  return { userId: payload.userId, accountType: payload.accountType, email: payload.email }
}

export async function userFromRequest(request: Request, secret?: string): Promise<string | null> {
  return (await userSessionFromRequest(request, secret))?.userId || null
}

function bearer(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, roundsText, saltText, hashText] = stored.split('$')
  if (scheme !== 'PBKDF2') return false
  const rounds = Number.parseInt(roundsText, 10)
  if (!Number.isFinite(rounds)) return false
  const key = await crypto.subtle.importKey('raw', bytes(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: decodePlainBase64(saltText), iterations: rounds },
    key,
    decodePlainBase64(hashText).byteLength * 8
  )
  return equalBytes(new Uint8Array(derived), decodePlainBase64(hashText))
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = 100_000
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const key = await crypto.subtle.importKey('raw', bytes(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds },
    key,
    32 * 8
  )
  return `PBKDF2$${rounds}$${plainBase64(salt)}$${plainBase64(new Uint8Array(derived))}`
}

function decodePlainBase64(value: string): Uint8Array {
  const raw = atob(value)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function plainBase64(value: Uint8Array): string {
  let raw = ''
  for (const byte of value) raw += String.fromCharCode(byte)
  return btoa(raw)
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

import { getConfig } from '../shared/config'
import type { RequestContext } from '../shared/types'

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function textEncode(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function textDecode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

async function importKey(secret: string): Promise<CryptoKey> {
  const keyData = textEncode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 7 * 24 * 60 * 60

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 3600
    case 'd': return value * 86400
    default: return 7 * 24 * 60 * 60
  }
}

interface JWTPayload {
  userId: string
  iat: number
  exp: number
}

export async function createToken(
  userId: string,
  secret: string,
  expiresIn?: string
): Promise<string> {
  const key = await importKey(secret)

  const now = Math.floor(Date.now() / 1000)
  const expiresInSeconds = parseExpiresIn(expiresIn || '7d')

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JWTPayload = {
    userId,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const headerEncoded = base64UrlEncode(textEncode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(textEncode(JSON.stringify(payload)))

  const data = `${headerEncoded}.${payloadEncoded}`
  const signature = await crypto.subtle.sign('HMAC', key, textEncode(data))
  const signatureEncoded = base64UrlEncode(signature)

  return `${data}.${signatureEncoded}`
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts

    const key = await importKey(secret)
    const signature = base64UrlDecode(signatureEncoded)

    const data = `${headerEncoded}.${payloadEncoded}`
    const valid = await crypto.subtle.verify('HMAC', key, signature, textEncode(data))

    if (!valid) return null

    const payloadBytes = base64UrlDecode(payloadEncoded)
    const payload = JSON.parse(textDecode(payloadBytes)) as JWTPayload

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}

function buildRequestContext(request: Request): RequestContext {
  return {
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    origin: request.headers.get('Origin') || '',
    userAgent: request.headers.get('User-Agent') || '',
    timestamp: Date.now(),
  }
}

export async function requireAuth(
  request: Request,
  env: { JWT_SECRET?: string },
  corsManager: { createErrorResponse: (message: string, status: number, request: RequestContext) => Response }
): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return corsManager.createErrorResponse(
      'Missing or invalid Authorization header',
      401,
      buildRequestContext(request)
    )
  }

  const token = authHeader.slice(7)
  const config = getConfig()
  const secret = env.JWT_SECRET || config.jwt.secret

  const result = await verifyToken(token, secret)
  if (!result) {
    return corsManager.createErrorResponse(
      'Invalid or expired token',
      401,
      buildRequestContext(request)
    )
  }

  return result
}

const JWT_SECRET = 'scp-os-default-secret-change-in-production'

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createHmacSignature(data: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(signature)
}

export async function generateToken(userId: string): Promise<string> {
  const encoder = new TextEncoder()
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 7 * 24 * 60 * 60

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { userId, iat: now, exp: now + expiresIn }

  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))

  const data = `${headerEncoded}.${payloadEncoded}`
  const sig = await createHmacSignature(data, JWT_SECRET)
  const sigEncoded = base64UrlEncode(sig)

  return `${data}.${sigEncoded}`
}

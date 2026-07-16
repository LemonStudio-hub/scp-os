import { config } from '../config'

let cachedToken: string | null = null
let tokenUserId: string | null = null
/** Guest sessions may re-mint via /api/auth/token; registered must re-login. */
let tokenIsGuest = false

export function setAuthToken(token: string, userId?: string, options?: { guest?: boolean }): void {
  cachedToken = token
  if (userId) tokenUserId = userId
  if (options?.guest !== undefined) tokenIsGuest = options.guest
}

export function getAuthToken(): string | null {
  return cachedToken
}

export function clearAuthToken(): void {
  cachedToken = null
  tokenUserId = null
  tokenIsGuest = false
}

async function requestGuestToken(userId: string): Promise<string> {
  const response = await fetch(`${config.api.workerUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) throw new Error(`Token request failed: ${response.status}`)
  const data = await response.json()
  if (!data.success || !data.token) throw new Error('Token request returned invalid response')
  return data.token as string
}

export async function getAuthHeaders(userId: string): Promise<{ Authorization: string }> {
  if (cachedToken && tokenUserId === userId) {
    return { Authorization: `Bearer ${cachedToken}` }
  }

  // Registered accounts cannot mint tokens from userId alone (would be account takeover).
  if (!tokenIsGuest) {
    throw new Error('Registered session expired — please sign in again')
  }

  const token = await requestGuestToken(userId)
  cachedToken = token
  tokenUserId = userId
  tokenIsGuest = true
  return { Authorization: `Bearer ${token}` }
}

/**
 * Fetch with Bearer auth.
 * Guest: one 401 → re-mint via /api/auth/token (no loop).
 * Registered: 401 returned as-is after clearing cache (re-login required).
 */
export async function authenticatedFetch(
  url: string,
  userId: string,
  options: RequestInit = {}
): Promise<Response> {
  let authHeader: { Authorization: string }
  try {
    authHeader = await getAuthHeaders(userId)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...authHeader },
  })

  if (response.status !== 401) {
    return response
  }

  if (!tokenIsGuest) {
    clearAuthToken()
    return response
  }

  // Guest single retry.
  clearAuthToken()
  tokenIsGuest = true
  try {
    const freshToken = await requestGuestToken(userId)
    setAuthToken(freshToken, userId, { guest: true })
    return await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${freshToken}` },
    })
  } catch {
    return response
  }
}

export { config }

import { config } from '../config'

let cachedToken: string | null = null
let tokenUserId: string | null = null

export function setAuthToken(token: string, userId?: string): void {
  cachedToken = token
  if (userId) tokenUserId = userId
}

export function getAuthToken(): string | null {
  return cachedToken
}

export function clearAuthToken(): void {
  cachedToken = null
  tokenUserId = null
}

async function requestToken(userId: string): Promise<string> {
  const response = await fetch(`${config.api.workerUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) throw new Error(`Token request failed: ${response.status}`)
  const data = await response.json()
  if (!data.success || !data.token) throw new Error('Token request returned invalid response')
  return data.token
}

export async function getAuthHeaders(userId: string): Promise<{ Authorization: string }> {
  if (!cachedToken || tokenUserId !== userId) {
    cachedToken = await requestToken(userId)
    tokenUserId = userId
  }
  return { Authorization: `Bearer ${cachedToken}` }
}

export async function authenticatedFetch(
  url: string,
  userId: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeader = await getAuthHeaders(userId)
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...authHeader },
  })

  if (response.status === 401) {
    // Token expired — clear cache and retry once with a fresh token
    clearAuthToken()
    const freshHeader = await getAuthHeaders(userId)
    return fetch(url, {
      ...options,
      headers: { ...options.headers, ...freshHeader },
    })
  }

  return response
}

export { config }

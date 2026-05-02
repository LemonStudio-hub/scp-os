import { config } from '../config'

let cachedToken: string | null = null
let tokenUserId: string | null = null

export function setAuthToken(token: string): void {
  cachedToken = token
}

export function getAuthToken(): string | null {
  return cachedToken
}

export async function getAuthHeaders(userId: string): Promise<{ Authorization: string }> {
  if (!cachedToken || tokenUserId !== userId) {
    const { generateToken } = await import('./jwt')
    cachedToken = await generateToken(userId)
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
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeader,
    },
  })
}

export { config }

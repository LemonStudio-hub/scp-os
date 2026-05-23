import type { Context, Next } from 'hono'
import type { Env, RequestInfo } from './types'

const allowedMethods = 'GET, POST, PUT, DELETE, OPTIONS'
const allowedHeaders = 'Content-Type, Authorization, X-Requested-With'

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}

export function requestInfo(request: Request): RequestInfo {
  return {
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
    userAgent: request.headers.get('User-Agent') || '',
  }
}

export async function cors(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(c.req.raw) })
  }
  await next()
  const headers = corsHeaders(c.req.raw)
  headers.forEach((value, key) => c.res.headers.set(key, value))
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })
  const origin = request.headers.get('Origin')
  if (origin) headers.set('Access-Control-Allow-Origin', origin)
  return headers
}

export function intValue(value: string | null | undefined, fallback: number, max?: number): number {
  const parsed = Number.parseInt(value || '', 10)
  const next = Number.isFinite(parsed) ? parsed : fallback
  return max === undefined ? next : Math.min(next, max)
}

export function cleanText(value: unknown, max = 2000): string {
  return String(value ?? '')
    .replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[ch] || ch)
    .slice(0, max)
    .trim()
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function isChatSocket(request: Request): boolean {
  const path = new URL(request.url).pathname
  return request.headers.get('Upgrade') === 'websocket' && (path === '/chat/ws' || /^\/chat\/room\/\d+\/ws$/.test(path))
}

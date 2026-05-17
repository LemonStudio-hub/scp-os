/**
 * CORS 中间件 (Hono)
 * 复用现有 CORSManager 的源匹配逻辑
 */

import { createMiddleware } from 'hono/factory'
import type { HonoEnv } from '../types'
import { getConfig } from '../shared/config'

const config = getConfig()

/** 预编译通配符正则 */
const originRegexCache = new Map<string, RegExp>()
for (const allowed of config.cors.allowedOrigins) {
  if (allowed.includes('*')) {
    const escaped = allowed.replace(/[+?^${}()|[\]\\]/g, '\\$&')
    const pattern = escaped.replace(/\*/g, '.*')
    originRegexCache.set(allowed, new RegExp(`^${pattern}$`))
  }
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false

  for (const allowed of config.cors.allowedOrigins) {
    if (allowed === origin) return true

    // 通配符端口 (http://localhost:*)
    if (allowed.includes(':*')) {
      const base = allowed.replace(':*', '')
      if (
        origin.startsWith(base) &&
        (origin.length === base.length || origin.charAt(base.length) === ':')
      ) {
        return true
      }
    }

    // 通配符子域名 (https://*.scpos.pages.dev)
    if (allowed.includes('*')) {
      let regex = originRegexCache.get(allowed)
      if (!regex) {
        const escaped = allowed.replace(/[+?^${}()|[\]\\]/g, '\\$&')
        const pattern = escaped.replace(/\*/g, '.*')
        regex = new RegExp(`^${pattern}$`)
        originRegexCache.set(allowed, regex)
      }
      const wildcardIndex = allowed.indexOf('*')
      if (wildcardIndex >= 0 && allowed[wildcardIndex + 1] === '.') {
        const domain = allowed.slice(wildcardIndex + 2)
        if (!origin.endsWith('.' + domain) && origin !== domain) {
          continue
        }
      }
      if (regex.test(origin)) return true
    }
  }
  return false
}

function buildCorsHeaders(origin: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': config.cors.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.cors.allowedHeaders.join(', '),
    'Access-Control-Max-Age': config.cors.maxAge.toString(),
    Vary: 'Origin',
  }
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

/**
 * CORS 中间件：为每个响应附加 CORS 头，并处理 OPTIONS 预检。
 */
export const corsMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const origin =
    c.req.header('Origin') || c.req.header('Referer') || ''
  const corsHeaders = buildCorsHeaders(origin)

  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  await next()

  // 为所有响应注入 CORS 头
  for (const [k, v] of Object.entries(corsHeaders)) {
    c.res.headers.set(k, v)
  }
})

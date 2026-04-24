/**
 * CORS 配置和管理
 * 严格的跨域资源共享控制
 */

import type { RequestContext } from '../shared/types'
import { getConfig } from '../shared/config'

export class CORSManager {
  private config = getConfig()

  /**
   * 获取 CORS 头
   */
  getHeaders(request: RequestContext): Headers {
    const origin = request.origin
    const allowedOrigin = this.isOriginAllowed(origin) ? origin : this.config.cors.allowedOrigins[0]

    const headers = new Headers({
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': this.config.cors.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': this.config.cors.allowedHeaders.join(', '),
      'Access-Control-Max-Age': this.config.cors.maxAge.toString(),
      'Vary': 'Origin',
    })

    return headers
  }

  /**
   * 检查来源是否允许
   */
  private isOriginAllowed(origin: string): boolean {
    if (!origin) return false

    for (const allowed of this.config.cors.allowedOrigins) {
      if (allowed.includes('*')) {
        const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        const pattern = escaped.replace(/\*/g, '.*')
        const regex = new RegExp(`^${pattern}$`)
        if (regex.test(origin)) {
          return true
        }
      }
      else if (origin === allowed) {
        return true
      }
    }

    return false
  }

  /**
   * 处理预检请求
   */
  handlePreflight(request: RequestContext): Response {
    return new Response(null, {
      status: 204,
      headers: this.getHeaders(request),
    })
  }

  /**
   * 创建带有 CORS 头的响应
   */
  createResponse(data: any, status: number, request: RequestContext): Response {
    const corsHeaders = this.getHeaders(request)
    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', 'application/json')
    
    return new Response(JSON.stringify(data), {
      status,
      headers,
    })
  }

  /**
   * 创建错误响应
   */
  createErrorResponse(message: string, status: number, request: RequestContext): Response {
    const corsHeaders = this.getHeaders(request)
    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', 'application/json')
    
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers,
    })
  }
}
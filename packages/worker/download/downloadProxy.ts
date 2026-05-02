import { DOWNLOAD_CONFIG } from './types'
import type {
  DownloadRequest,
  DownloadProgress,
  DownloadHistoryItem,
  DownloadInitResponse,
} from './types'
import { logger } from '../utils/logger'
import { validationError, internalError, notFoundError, rateLimitedError } from '../shared/errors'

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${Date.now().toString(36)}-${result}`
}

function sanitizeFilename(url: string, contentDisposition?: string | null): string {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
    if (match?.[1]) {
      return decodeURIComponent(match[1])
    }
  }

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment.length < 200 && /[^/?#]/.test(lastSegment)) {
        return decodeURIComponent(lastSegment)
      }
    }
  } catch {}

  return `download-${Date.now()}`
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: '下载链接不能为空' }
  }

  if (url.length > DOWNLOAD_CONFIG.maxUrlLength) {
    return { valid: false, error: `链接长度不能超过 ${DOWNLOAD_CONFIG.maxUrlLength} 个字符` }
  }

  try {
    const urlObj = new URL(url)

    if (!DOWNLOAD_CONFIG.allowedProtocols.includes(urlObj.protocol)) {
      return { valid: false, error: `不支持的协议: ${urlObj.protocol}，仅支持 HTTP/HTTPS` }
    }

    const hostname = urlObj.hostname.toLowerCase()
    for (const blocked of DOWNLOAD_CONFIG.blockedHosts) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        return { valid: false, error: '不允许访问内部/私有网络地址' }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: '无效的 URL 格式' }
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, X-Download-ID, X-Download-Speed, X-Progress',
    'Vary': 'Origin',
  }
}

async function storeProgress(
  kv: KVNamespace,
  downloadId: string,
  progress: DownloadProgress,
): Promise<void> {
  try {
    await kv.put(
      `dl-progress:${downloadId}`,
      JSON.stringify(progress),
      { expirationTtl: 3600 },
    )
  } catch (e) {
    logger.error('Failed to store progress', e as Error, { downloadId })
  }
}

async function getProgress(
  kv: KVNamespace,
  downloadId: string,
): Promise<DownloadProgress | null> {
  try {
    const data = await kv.get(`dl-progress:${downloadId}`, 'text')
    return data ? JSON.parse(data) as DownloadProgress : null
  } catch {
    return null
  }
}

async function addHistory(
  kv: KVNamespace,
  item: DownloadHistoryItem,
): Promise<void> {
  try {
    const key = `dl-history:${item.id}`
    await kv.put(key, JSON.stringify(item), { expirationTtl: 86400 * 30 })

    const indexKey = `dl-history-index`
    const indexStr = await kv.get(indexKey, 'text')
    const index: string[] = indexStr ? JSON.parse(indexStr) : []
    index.unshift(item.id)
    if (index.length > 200) {
      index.length = 200
    }
    await kv.put(indexKey, JSON.stringify(index), { expirationTtl: 86400 * 30 })
  } catch (e) {
    logger.error('Failed to add history', e as Error, { downloadId: item.id })
  }
}

export class DownloadProxy {
  constructor(private kv: KVNamespace) {}

  async handlePreflight(origin: string): Promise<Response> {
    return new Response(null, {
      status: 204,
      headers: new Headers(corsHeaders(origin)),
    })
  }

  async handleInit(
    body: DownloadRequest,
    origin: string,
  ): Promise<Response> {
    const headers = new Headers(corsHeaders(origin))
    headers.set('Content-Type', 'application/json')

    const validation = validateUrl(body.url)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validationError(validation.error!) }),
        { status: 400, headers },
      )
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const headResponse = await fetch(body.url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'SCP-Download-Proxy/1.0',
          'Accept': '*/*',
        },
      })

      clearTimeout(timeout)

      const contentLength = headResponse.headers.get('Content-Length')
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0
      const contentType = headResponse.headers.get('Content-Type') || 'application/octet-stream'
      const contentDisposition = headResponse.headers.get('Content-Disposition')
      const filename = body.filename || sanitizeFilename(body.url, contentDisposition)

      if (totalBytes > DOWNLOAD_CONFIG.maxFileSize) {
        return new Response(
          JSON.stringify({
            success: false,
            error: validationError(
              `文件大小 (${(totalBytes / 1024 / 1024).toFixed(1)} MB) 超出限制 (${DOWNLOAD_CONFIG.maxFileSize / 1024 / 1024} MB)`,
            ),
          }),
          { status: 400, headers },
        )
      }

      const downloadId = generateId()
      const progress: DownloadProgress = {
        downloadId,
        status: 'pending',
        url: body.url,
        filename,
        totalBytes,
        downloadedBytes: 0,
        progress: 0,
        speed: 0,
        startTime: Date.now(),
        contentType,
      }

      await storeProgress(this.kv, downloadId, progress)

      const response: DownloadInitResponse = {
        success: true,
        downloadId,
        filename,
        totalBytes,
        contentType,
        streamingUrl: `/download/stream?id=${downloadId}&url=${encodeURIComponent(body.url)}${body.rateLimit ? `&rateLimit=${body.rateLimit}` : ''}`,
      }

      logger.info('Download initialized', {
        downloadId,
        url: body.url,
        filename,
        totalBytes,
      })

      return new Response(JSON.stringify(response), { status: 200, headers })
    } catch (e) {
      const err = e as Error
      logger.error('Download init failed', err, { url: body.url })

      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: validationError('连接目标服务器超时') }),
          { status: 504, headers },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: internalError(`无法连接到目标服务器: ${err.message}`),
        }),
        { status: 502, headers },
      )
    }
  }

  async handleStream(
    downloadId: string,
    url: string,
    rateLimit: number,
    origin: string,
  ): Promise<Response> {
    const headers = new Headers(corsHeaders(origin))

    const rateLimitBps = Math.max(
      DOWNLOAD_CONFIG.rateLimit.min,
      Math.min(rateLimit || DOWNLOAD_CONFIG.rateLimit.default, DOWNLOAD_CONFIG.rateLimit.max),
    )

    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'SCP-Download-Proxy/1.0',
          'Accept': '*/*',
        },
      })

      if (!response.ok) {
        headers.set('Content-Type', 'application/json')

        const progress: DownloadProgress = {
          downloadId,
          status: 'failed',
          url,
          filename: '',
          totalBytes: 0,
          downloadedBytes: 0,
          progress: 0,
          speed: 0,
          startTime: Date.now(),
          endTime: Date.now(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
        await storeProgress(this.kv, downloadId, progress)

        return new Response(
          JSON.stringify({ success: false, error: notFoundError(`目标服务器返回错误: HTTP ${response.status}`) }),
          { status: response.status, headers },
        )
      }

      const contentLength = response.headers.get('Content-Length')
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = sanitizeFilename(url, contentDisposition)

      if (!response.body) {
        headers.set('Content-Type', 'application/json')
        return new Response(
          JSON.stringify({ success: false, error: internalError('目标服务器不支持流式传输') }),
          { status: 500, headers },
        )
      }

      headers.set('Content-Type', contentType)
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      headers.set('X-Download-ID', downloadId)
      if (totalBytes > 0) {
        headers.set('Content-Length', totalBytes.toString())
      }

      let downloadedBytes = 0
      let lastProgressUpdate = Date.now()
      let lastBytesCount = 0
      let speedHistory: number[] = []

      const reader = response.body.getReader()

      const stream = new ReadableStream({
        start: async (controller) => {
          const startTime = Date.now()

          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                const endTime = Date.now()
                const progress: DownloadProgress = {
                  downloadId,
                  status: 'completed',
                  url,
                  filename,
                  totalBytes: totalBytes || downloadedBytes,
                  downloadedBytes,
                  progress: 100,
                  speed: 0,
                  startTime,
                  endTime,
                  contentType,
                }
                await storeProgress(this.kv, downloadId, progress)

                await addHistory(this.kv, {
                  id: downloadId,
                  url,
                  filename,
                  totalBytes: totalBytes || downloadedBytes,
                  downloadedBytes,
                  status: 'completed',
                  createdAt: new Date(startTime).toISOString(),
                  completedAt: new Date(endTime).toISOString(),
                  contentType,
                })

                logger.info('Download completed', {
                  downloadId,
                  filename,
                  totalBytes: totalBytes || downloadedBytes,
                  duration: endTime - startTime,
                })

                controller.close()
                return
              }

              downloadedBytes += value.length

              if (rateLimitBps > 0) {
                const now = Date.now()
                speedHistory.push(value.length)
                speedHistory = speedHistory.filter(
                  (_, i) => now - startTime - (i * 1000) < 2000,
                )

                const recentSpeed = speedHistory.length > 0
                  ? speedHistory.reduce((a, b) => a + b, 0) / (speedHistory.length * 1000) * 1000
                  : 0

                if (recentSpeed > rateLimitBps) {
                  const waitMs = Math.ceil((value.length / rateLimitBps) * 1000)
                  if (waitMs > 0 && waitMs < 5000) {
                    await new Promise(resolve => setTimeout(resolve, waitMs))
                  }
                }
              }

              controller.enqueue(value)

              const now = Date.now()
              if (now - lastProgressUpdate >= DOWNLOAD_CONFIG.progressUpdateInterval) {
                const elapsed = now - lastProgressUpdate
                const chunkBytes = downloadedBytes - lastBytesCount
                const currentSpeed = elapsed > 0 ? (chunkBytes / elapsed) * 1000 : 0

                const progress: DownloadProgress = {
                  downloadId,
                  status: 'downloading',
                  url,
                  filename,
                  totalBytes,
                  downloadedBytes,
                  progress: totalBytes > 0 ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : Math.min(99, Math.round(downloadedBytes / 1024)),
                  speed: Math.round(currentSpeed),
                  startTime,
                  contentType,
                }
                await storeProgress(this.kv, downloadId, progress)

                lastProgressUpdate = now
                lastBytesCount = downloadedBytes
              }
            }
          } catch (e) {
            const err = e as Error
            if (err.name !== 'AbortError') {
              const progress: DownloadProgress = {
                downloadId,
                status: 'failed',
                url,
                filename,
                totalBytes,
                downloadedBytes,
                progress: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
                speed: 0,
                startTime,
                endTime: Date.now(),
                error: err.message,
                contentType,
              }
              await storeProgress(this.kv, downloadId, progress)

              await addHistory(this.kv, {
                id: downloadId,
                url,
                filename,
                totalBytes,
                downloadedBytes,
                status: 'failed',
                createdAt: new Date(startTime).toISOString(),
                completedAt: new Date().toISOString(),
                error: err.message,
                contentType,
              })

              logger.error('Download failed during streaming', err, { downloadId, url })
            }

            controller.error(err)
          }
        },

        cancel: async () => {
          reader.cancel()

          const progress: DownloadProgress = {
            downloadId,
            status: 'cancelled',
            url,
            filename,
            totalBytes,
            downloadedBytes,
            progress: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
            speed: 0,
            startTime: Date.now(),
            endTime: Date.now(),
            contentType,
          }
          await storeProgress(this.kv, downloadId, progress)

          await addHistory(this.kv, {
            id: downloadId,
            url,
            filename,
            totalBytes,
            downloadedBytes,
            status: 'cancelled',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            contentType,
          })

          logger.info('Download cancelled', { downloadId, url })
        },
      })

      return new Response(stream, {
        status: 200,
        headers,
      })
    } catch (e) {
      const err = e as Error
      logger.error('Stream setup failed', err, { downloadId, url })

      headers.set('Content-Type', 'application/json')
      return new Response(
        JSON.stringify({ success: false, error: internalError('流式传输建立失败: ' + err.message) }),
        { status: 500, headers },
      )
    }
  }

  async handleProgress(
    downloadId: string,
    origin: string,
  ): Promise<Response> {
    const headers = new Headers(corsHeaders(origin))
    headers.set('Content-Type', 'application/json')

    try {
      const progress = await getProgress(this.kv, downloadId)

      if (!progress) {
        return new Response(
          JSON.stringify({ success: false, error: notFoundError('未找到该下载记录') }),
          { status: 404, headers },
        )
      }

      return new Response(JSON.stringify({ success: true, data: progress }), {
        status: 200,
        headers,
      })
    } catch (e) {
      const err = e as Error
      logger.error('Failed to get progress', err, { downloadId })
      return new Response(
        JSON.stringify({ success: false, error: internalError('获取进度失败') }),
        { status: 500, headers },
      )
    }
  }

  async handleHistory(
    limitStr: string | null,
    offsetStr: string | null,
    origin: string,
  ): Promise<Response> {
    const headers = new Headers(corsHeaders(origin))
    headers.set('Content-Type', 'application/json')

    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 100)
    const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0)

    try {
      const indexKey = 'dl-history-index'
      const indexStr = await this.kv.get(indexKey, 'text')
      const allIds: string[] = indexStr ? JSON.parse(indexStr) : []
      const pageIds = allIds.slice(offset, offset + limit)

      const items: DownloadHistoryItem[] = []
      for (const id of pageIds) {
        const data = await this.kv.get(`dl-history:${id}`, 'text')
        if (data) {
          items.push(JSON.parse(data) as DownloadHistoryItem)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: items,
          total: allIds.length,
        }),
        { status: 200, headers },
      )
    } catch (e) {
      const err = e as Error
      logger.error('Failed to get history', err)
      return new Response(
        JSON.stringify({ success: false, error: internalError('获取历史记录失败') }),
        { status: 500, headers },
      )
    }
  }

  async handleDeleteHistory(
    downloadId: string,
    origin: string,
  ): Promise<Response> {
    const headers = new Headers(corsHeaders(origin))
    headers.set('Content-Type', 'application/json')

    try {
      await this.kv.delete(`dl-history:${downloadId}`)
      await this.kv.delete(`dl-progress:${downloadId}`)

      const indexKey = 'dl-history-index'
      const indexStr = await this.kv.get(indexKey, 'text')
      if (indexStr) {
        const index: string[] = JSON.parse(indexStr)
        const filtered = index.filter(id => id !== downloadId)
        await this.kv.put(indexKey, JSON.stringify(filtered), { expirationTtl: 86400 * 30 })
      }

      return new Response(
        JSON.stringify({ success: true, message: '已删除' }),
        { status: 200, headers },
      )
    } catch (e) {
      const err = e as Error
      logger.error('Failed to delete history', err, { downloadId })
      return new Response(
        JSON.stringify({ success: false, error: internalError('删除失败') }),
        { status: 500, headers },
      )
    }
  }
}

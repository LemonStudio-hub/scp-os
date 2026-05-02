import type { Router } from './router'
import type { Env, RequestContext, ChatSendMessageBody, CreateChatRoomBody, SetNicknameBody, SubmitFeedbackBody, LikeFeedbackBody, SubmitCommentBody, VoteFeedbackBody, RegisterUserBody, PerformanceMetricsBody } from './shared/types'
import { SCPScraper } from './index'
import type { CORSManager } from './security/cors'
import * as feedbackAPI from './api/feedback'
import * as userAPI from './api/user'
import * as docsAPI from './api/docs'
import { DownloadProxy } from './download/downloadProxy'
import type { DownloadRequest } from './download/types'
import { logger } from './utils/logger'
import { requireAuth } from './security/auth'
import { validationError, unauthorizedError } from './shared/errors'
import { getConfig } from './shared/config'

function safeParseInt(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

interface RouteDeps {
  scraper: SCPScraper
  env: Env
  corsManager: CORSManager
  rateLimiter: { checkLimit: (identifier: string) => Promise<boolean> }
  authenticatedUserId: string | undefined
}

export function registerRoutes(router: Router, deps: RouteDeps): void {
  const { scraper, env, corsManager, rateLimiter } = deps

  function authFail(): boolean {
    return deps.authenticatedUserId === undefined
  }

  function authUserId(): string {
    return deps.authenticatedUserId!
  }

  function ctx(request: Request): RequestContext {
    return {
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      origin: request.headers.get('Origin') || request.headers.get('Referer') || '',
      userAgent: request.headers.get('User-Agent') || '',
      timestamp: Date.now(),
    }
  }

  router.get('/', async (_req, _env, _ctx, _params, _url) => {
    const config = getConfig()
    return corsManager.createResponse({
      name: 'SCP Scraper Worker',
      version: '2.0.0',
      status: 'online',
      endpoints: {
        '/scrape?number={number}': '\u722c\u53d6\u6307\u5b9aSCP\u7684\u4fe1\u606f',
        '/search?keyword={keyword}&clearance_level={level}': '\u641c\u7d22SCP',
        '/list?limit={limit}&offset={offset}&clearance_level={level}': '\u5217\u51faSCP\u7f16\u53f7',
        '/stats': '\u83b7\u53d6\u6570\u636e\u5e93\u7edf\u8ba1\u4fe1\u606f',
        '/debug?number={number}': '\u8c03\u8bd5\uff1a\u8fd4\u56de\u539f\u59cbHTML',
        '/performance': '\u6027\u80fd\u76d1\u63a7API (POST/GET)',
        '/chat/send': '\u53d1\u9001\u804a\u5929\u6d88\u606f (POST)',
        '/chat/messages': '\u83b7\u53d6\u804a\u5929\u6d88\u606f (GET)',
        '/chat/rooms': '\u83b7\u53d6/\u521b\u5efa\u804a\u5929\u5ba4 (GET/POST)',
        '/chat/nickname': '\u8bbe\u7f6e\u7528\u6237\u6635\u79f0 (POST)',
        '/chat/broadcast': '\u5e7f\u64ad\u65b0\u6d88\u606f (POST)',
        '/docs/items': '\u67e5\u8be2 SCP \u6761\u76ee\u5217\u8868',
        '/docs/item/{scpNumber}': '\u83b7\u53d6\u5355\u4e2a\u6761\u76ee\u5143\u6570\u636e',
        '/docs/content/{scpNumber}': '\u83b7\u53d6\u6761\u76ee\u5b8c\u6574\u5185\u5bb9',
        '/docs/tales': '\u67e5\u8be2\u6545\u4e8b\u5217\u8868',
        '/docs/hubs': '\u83b7\u53d6 Hub \u5217\u8868',
        '/download/init': '\u521d\u59cb\u5316\u4e0b\u8f7d (POST)',
        '/download/stream': '\u6d41\u5f0f\u4e0b\u8f7d (GET)',
        '/download/progress': '\u67e5\u8be2\u4e0b\u8f7d\u8fdb\u5ea6 (GET)',
        '/download/history': '\u4e0b\u8f7d\u5386\u53f2\u8bb0\u5f55 (GET/DELETE)',
      },
      features: {
        modular: true,
        caching: `${config.cacheDuration / 1000 / 60} minutes`,
        retry: `${config.retryAttempts} attempts`,
        rateLimit: `${config.rateLimit.maxRequests} requests / ${config.rateLimit.windowMs / 1000}s`,
        database: 'D1 database enabled',
        performance: 'Performance monitoring',
        downloadProxy: 'Streaming download proxy',
      },
    }, 200, ctx(_req))
  })

  router.get('/scrape', async (req, _env, _ctx_, _params, url) => {
    const scpNumber = url.searchParams.get('number')
    const branch = url.searchParams.get('branch') || 'en'
    if (!scpNumber) {
      return corsManager.createErrorResponse(validationError('Missing number parameter', { field: 'number' }), 400, ctx(req))
    }
    logger.info('Scraping SCP', { scpNumber, branch })
    const result = await scraper.scrapeSCP(scpNumber, branch)
    if (result.success) logger.info('Scrape successful', { scpNumber, cached: result.cached })
    else logger.warn('Scrape failed', { scpNumber, error: result.error })
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/search', async (req, _env, _ctx_, _params, url) => {
    const keyword = url.searchParams.get('keyword')
    const branch = url.searchParams.get('branch') || 'en'
    if (!keyword) {
      return corsManager.createErrorResponse(validationError('Missing keyword parameter', { field: 'keyword' }), 400, ctx(req))
    }
    const clearanceLevelParam = url.searchParams.get('clearance_level')
    const clearanceLevel = clearanceLevelParam ? safeParseInt(clearanceLevelParam, 0) : undefined
    logger.info('Searching SCP', { keyword, branch, clearanceLevel })
    if (clearanceLevel !== undefined) {
      const result = await scraper.searchInDatabase(keyword, clearanceLevel)
      return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
    }
    const result = await scraper.searchSCP(keyword, branch)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/list', async (req, _env, _ctx_, _params, url) => {
    const limit = safeParseInt(url.searchParams.get('limit'), 100)
    const offset = safeParseInt(url.searchParams.get('offset'), 0)
    const clearanceLevelParam = url.searchParams.get('clearance_level')
    const clearanceLevel = clearanceLevelParam ? safeParseInt(clearanceLevelParam, 0) : undefined
    logger.info('Listing SCPs', { limit, offset, clearanceLevel })
    const result = await scraper.listSCPs(limit, offset, clearanceLevel)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/stats', async (req, _env, _ctx_, _params, _url) => {
    const result = await scraper.getStats()
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/debug', async (req, _env, _ctx_, _params, url) => {
    const scpNumber = url.searchParams.get('number') || '173'
    const result = await scraper.getRawHTML(scpNumber)
    return corsManager.createResponse(result, 200, ctx(req))
  })

  router.get('/image-proxy', async (req, _env, _ctx_, _params, url) => {
    const imageUrl = url.searchParams.get('url')
    if (!imageUrl) {
      return corsManager.createErrorResponse(validationError('Missing url parameter', { field: 'url' }), 400, ctx(req))
    }
    try {
      const allowedHosts = [
        'scp-wiki.wdfiles.com', 'scp-wiki-cn.wdfiles.com',
        'wikidot.com', 'scpfoundation.ru',
        'scp-wiki.wikidot.com', 'scp-wiki-cn.wikidot.com',
      ]
      const parsedUrl = new URL(imageUrl)
      if (!allowedHosts.some(host => parsedUrl.hostname.endsWith(host))) {
        return corsManager.createErrorResponse(validationError('Image host not allowed', { host: parsedUrl.hostname }), 403, ctx(req))
      }
      const imageResponse = await fetch(imageUrl, {
        headers: { 'User-Agent': 'SCP-OS/1.0', 'Referer': parsedUrl.origin + '/' },
      })
      if (!imageResponse.ok) {
        return corsManager.createErrorResponse('Failed to fetch image', imageResponse.status, ctx(req))
      }
      const contentType = imageResponse.headers.get('Content-Type') || 'image/png'
      const body = await imageResponse.arrayBuffer()
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch {
      return corsManager.createErrorResponse('Image proxy failed', 502, ctx(req))
    }
  })

  router.post('/chat/send', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as ChatSendMessageBody
      if (!body.content) return corsManager.createErrorResponse(validationError('Missing content'), 400, ctx(req))
      const result = await scraper.sendChatMessageWithRateLimit(authUserId(), undefined, body.content, body.room_id || 1)
      return corsManager.createResponse(result, result.success ? 200 : 429, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/chat/messages', async (req, _env, _ctx_, _params, url) => {
    const limit = safeParseInt(url.searchParams.get('limit'), 50)
    const after = url.searchParams.get('after') || undefined
    const roomIdParam = url.searchParams.get('room_id')
    const roomId = roomIdParam ? safeParseInt(roomIdParam, 0) : undefined
    if (roomId !== undefined && roomId <= 0) {
      return corsManager.createResponse({ success: true, data: [], count: 0 }, 200, ctx(req))
    }
    const result = await scraper.getChatMessages(limit, after, roomId)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/chat/rooms', async (req, _env, _ctx_, _params, _url) => {
    const result = await scraper.getChatRooms()
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/chat/rooms', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as CreateChatRoomBody
      if (!body.name) return corsManager.createErrorResponse(validationError('Missing name'), 400, ctx(req))
      const result = await scraper.createChatRoom({ name: body.name, description: body.description, created_by: authUserId(), is_public: body.is_public })
      return corsManager.createResponse(result, result.success ? 201 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.post('/chat/nickname', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as SetNicknameBody
      if (!body.nickname) return corsManager.createErrorResponse(validationError('Missing nickname'), 400, ctx(req))
      const result = await scraper.setUserNickname(authUserId(), body.nickname)
      return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.post('/chat/broadcast', async (req, _env, _ctx_, _params, _url) => {
    const result = await scraper.broadcastNewMessages()
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/feedback/submit', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as SubmitFeedbackBody
      if (!body.title || !body.content) return corsManager.createErrorResponse(validationError('Missing required fields'), 400, ctx(req))
      const result = await feedbackAPI.submitFeedback(scraper.requireDB(), { user_id: authUserId(), title: body.title, content: body.content, category: body.category })
      return corsManager.createResponse(result, result.success ? 201 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/feedback/list', async (req, _env, _ctx_, _params, url) => {
    const limit = safeParseInt(url.searchParams.get('limit'), 50)
    const offset = safeParseInt(url.searchParams.get('offset'), 0)
    const category = url.searchParams.get('category') || undefined
    const result = await feedbackAPI.getFeedbackList(scraper.requireDB(), limit, offset, category)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/feedback/like', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as LikeFeedbackBody
      if (!body.id) return corsManager.createErrorResponse(validationError('Missing feedback id'), 400, ctx(req))
      const result = await feedbackAPI.likeFeedback(scraper.requireDB(), body.id)
      return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/feedback/categories', async (req, _env, _ctx_, _params, _url) => {
    const result = await feedbackAPI.getFeedbackCategories(scraper.requireDB())
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/feedback/comment', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as SubmitCommentBody
      if (!body.feedback_id || !body.content) return corsManager.createErrorResponse(validationError('Missing required fields'), 400, ctx(req))
      const result = await feedbackAPI.submitComment(scraper.requireDB(), { feedback_id: body.feedback_id, user_id: authUserId(), content: body.content })
      return corsManager.createResponse(result, result.success ? 201 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/feedback/comments', async (req, _env, _ctx_, _params, url) => {
    const feedbackId = safeParseInt(url.searchParams.get('feedback_id'), 0)
    if (!feedbackId) return corsManager.createErrorResponse(validationError('Missing feedback_id parameter'), 400, ctx(req))
    const result = await feedbackAPI.getComments(scraper.requireDB(), feedbackId, safeParseInt(url.searchParams.get('limit'), 50), safeParseInt(url.searchParams.get('offset'), 0))
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/feedback/vote', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as VoteFeedbackBody
      if (!body.id || !body.vote || (body.vote !== 'up' && body.vote !== 'down')) {
        return corsManager.createErrorResponse(validationError('Missing or invalid required fields'), 400, ctx(req))
      }
      const result = await feedbackAPI.voteFeedback(scraper.requireDB(), { id: body.id, user_id: authUserId(), vote: body.vote })
      return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/feedback/list-with-votes', async (req, _env, _ctx_, _params, url) => {
    const limit = safeParseInt(url.searchParams.get('limit'), 50)
    const offset = safeParseInt(url.searchParams.get('offset'), 0)
    const category = url.searchParams.get('category') || undefined
    const userId = url.searchParams.get('user_id') || undefined
    const result = await feedbackAPI.getFeedbackListWithVotes(scraper.requireDB(), limit, offset, category, userId)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.post('/api/user/register', async (req, _env, _ctx_, _params, _url) => {
    if (authFail()) return corsManager.createErrorResponse(unauthorizedError(), 401, ctx(req))
    try {
      const body = await req.json() as RegisterUserBody
      if (!body.nickname) return corsManager.createErrorResponse(validationError('Missing nickname'), 400, ctx(req))
      const result = await userAPI.registerUser(scraper.requireDB(), { userId: authUserId(), nickname: body.nickname })
      return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
    } catch {
      return corsManager.createErrorResponse('Invalid request body', 400, ctx(req))
    }
  })

  router.get('/api/user/check-nickname', async (req, _env, _ctx_, _params, url) => {
    const nicknameParam = url.searchParams.get('nickname')
    const excludeUserId = url.searchParams.get('excludeUserId') || undefined
    if (!nicknameParam) return corsManager.createErrorResponse('Missing nickname parameter', 400, ctx(req))
    const result = await userAPI.checkNicknameAvailability(scraper.requireDB(), nicknameParam, excludeUserId)
    return corsManager.createResponse(result, result.success ? 200 : 500, ctx(req))
  })

  router.get('/api/user/:userId', async (req, _env, _ctx_, params, _url) => {
    const userId = params.userId
    if (!userId) return corsManager.createErrorResponse('Missing userId', 400, ctx(req))
    const result = await userAPI.getUserByUserId(scraper.requireDB(), userId)
    return corsManager.createResponse(result, result.success ? 200 : 404, ctx(req))
  })

  router.post('/performance', async (req, _env, _ctx_, _params, _url) => {
    try {
      const body = await req.json() as PerformanceMetricsBody
      logger.info('Received performance metrics', { metrics: body })
      const metricKey = `perf-${Date.now()}`
      await env.SCP_CACHE?.put(metricKey, JSON.stringify(body), { expirationTtl: 3600 })
      return corsManager.createResponse({ success: true, message: 'Performance metrics received', timestamp: Date.now() }, 200, ctx(req))
    } catch {
      return corsManager.createErrorResponse('Invalid request body', 400, ctx(req))
    }
  })

  router.get('/performance', async (req, _env, _ctx_, _params, url) => {
    try {
      const limit = safeParseInt(url.searchParams.get('limit'), 10)
      const metrics: any[] = []
      const list = await env.SCP_CACHE?.list({ prefix: 'perf-', limit })
      if (list && list.keys.length > 0) {
        for (const key of list.keys) {
          const value = await env.SCP_CACHE?.get(key.name, 'text')
          if (value) metrics.push(JSON.parse(value))
        }
      }
      return corsManager.createResponse({ success: true, metrics: metrics.reverse(), count: metrics.length }, 200, ctx(req))
    } catch {
      return corsManager.createErrorResponse('Failed to retrieve metrics', 500, ctx(req))
    }
  })

  router.get('/docs/items', async (req, _env, _ctx_, _params, _url) => {
    const result = await docsAPI.handleDocsItems(req, env)
    return corsManager.createResponse(await result.json(), result.status, ctx(req))
  })

  router.get('/docs/item/:scpNumber', async (req, _env, _ctx_, params, _url) => {
    const result = await docsAPI.handleDocsItem(req, env, params.scpNumber)
    return corsManager.createResponse(await result.json(), result.status, ctx(req))
  })

  router.get('/docs/content/:scpNumber', async (req, _env, _ctx_, params, _url) => {
    const result = await docsAPI.handleDocsContent(req, env, params.scpNumber)
    return corsManager.createResponse(await result.json(), result.status, ctx(req))
  })

  router.get('/docs/tales', async (req, _env, _ctx_, _params, _url) => {
    const result = await docsAPI.handleDocsTales(req, env)
    return corsManager.createResponse(await result.json(), result.status, ctx(req))
  })

  router.get('/docs/hubs', async (req, _env, _ctx_, _params, _url) => {
    const result = await docsAPI.handleDocsHubs(req, env)
    return corsManager.createResponse(await result.json(), result.status, ctx(req))
  })

  router.post('/download/init', async (req, _env, _ctx_, _params, _url) => {
    try {
      const body = await req.json() as DownloadRequest
      const downloadProxy = new DownloadProxy(env.SCP_CACHE)
      return downloadProxy.handleInit(body, ctx(req).origin)
    } catch {
      return corsManager.createErrorResponse(validationError('Invalid request body'), 400, ctx(req))
    }
  })

  router.get('/download/stream', async (req, _env, _ctx_, _params, url) => {
    const downloadId = url.searchParams.get('id')
    const downloadUrl = url.searchParams.get('url')
    const rateLimitStr = url.searchParams.get('rateLimit')
    if (!downloadId || !downloadUrl) {
      return corsManager.createErrorResponse(validationError('Missing id or url parameter'), 400, ctx(req))
    }
    const downloadProxy = new DownloadProxy(env.SCP_CACHE)
    return downloadProxy.handleStream(downloadId, decodeURIComponent(downloadUrl), parseInt(rateLimitStr || '0', 10) || 0, ctx(req).origin)
  })

  router.get('/download/progress', async (req, _env, _ctx_, _params, url) => {
    const downloadId = url.searchParams.get('id')
    if (!downloadId) return corsManager.createErrorResponse(validationError('Missing id parameter'), 400, ctx(req))
    const downloadProxy = new DownloadProxy(env.SCP_CACHE)
    return downloadProxy.handleProgress(downloadId, ctx(req).origin)
  })

  router.get('/download/history', async (req, _env, _ctx_, _params, url) => {
    const downloadProxy = new DownloadProxy(env.SCP_CACHE)
    return downloadProxy.handleHistory(url.searchParams.get('limit'), url.searchParams.get('offset'), ctx(req).origin)
  })

  router.delete('/download/history', async (req, _env, _ctx_, _params, url) => {
    const downloadId = url.searchParams.get('id')
    if (!downloadId) return corsManager.createErrorResponse(validationError('Missing id parameter'), 400, ctx(req))
    const downloadProxy = new DownloadProxy(env.SCP_CACHE)
    return downloadProxy.handleDeleteHistory(downloadId, ctx(req).origin)
  })
}

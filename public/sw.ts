/**
 * Service Worker for SCP-OS
 * 实现完整的 PWA 功能：离线缓存、性能优化、后台同步
 */

const CACHE_NAME = 'scp-os-v1'
const CACHE_VERSION = 1

// 需要缓存的资源
const CACHE_URLS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-512x512.png',
]

// API 请求缓存配置
const API_CACHE_CONFIG = {
  // API 请求缓存时间（秒）
  cacheTime: 1800, // 30分钟
  // 最大缓存数量
  maxCacheSize: 100,
}

// 动态缓存
const DYNAMIC_CACHE = new Map()

/**
 * 安装事件
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION + '...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell')
      return cache.addAll(CACHE_URLS)
    }).then(() => {
      // 跳过等待，立即激活
      return self.skipWaiting()
    })
  )
})

/**
 * 激活事件
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION + '...')
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removing old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  )
})

/**
 * 拦截请求
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 处理 API 请求
  if (url.pathname.startsWith('/scrape') || 
      url.pathname.startsWith('/search') || 
      url.pathname.startsWith('/list') ||
      url.pathname.startsWith('/stats')) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  // 处理静态资源
  event.respondWith(handleStaticRequest(request))
})

/**
 * 处理 API 请求
 */
async function handleAPIRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const cacheKey = `api:${url.pathname}${url.search}`

  // 尝试从缓存获取
  const cachedResponse = await caches.match(cacheKey)
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    console.log('[SW] Cache hit:', cacheKey)
    
    // 显示缓存指示器
    const responseWithCacheFlag = new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: {
        ...cachedResponse.headers,
        'X-Cache': 'HIT',
      },
    })
    
    // 后台更新缓存
    updateCache(request, cacheKey)
    
    return responseWithCacheFlag
  }

  // 缓存未命中，发起网络请求
  try {
    console.log('[SW] Cache miss, fetching:', cacheKey)
    const response = await fetch(request)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 克隆响应并缓存
    const clonedResponse = response.clone()
    const cache = await caches.open(CACHE_NAME)
    
    // 添加缓存过期时间头
    const responseToCache = new Response(clonedResponse.body, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers: {
        ...clonedResponse.headers,
        'X-Cache-Date': Date.now().toString(),
        'X-Cache': 'MISS',
      },
    })
    
    await cache.put(cacheKey, responseToCache)
    
    // 检查动态缓存大小
    await checkCacheSize()
    
    return response
  } catch (error) {
    console.error('[SW] Fetch error:', error)
    
    // 网络错误，尝试返回过期的缓存
    const expiredCache = await caches.match(cacheKey)
    if (expiredCache) {
      console.log('[SW] Returning expired cache:', cacheKey)
      const responseWithExpiredFlag = new Response(expiredCache.body, {
        status: expiredCache.status,
        statusText: expiredCache.statusText,
        headers: {
          ...expiredCache.headers,
          'X-Cache': 'STALE',
          'X-Cache-Status': 'expired',
        },
      })
      return responseWithExpiredFlag
    }
    
    // 返回离线响应
    return caches.match('/offline.html').then(offlinePage => {
      if (offlinePage) {
        return offlinePage
      }
      return new Response('Offline', { status: 503 })
    })
  }
}

/**
 * 处理静态资源请求
 */
async function handleStaticRequest(request: Request): Promise<Response> {
  try {
    // 先尝试缓存
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // 缓存未命中，从网络获取
    const response = await fetch(request)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 缓存响应
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
    
    return response
  } catch (error) {
    console.error('[SW] Static fetch error:', error)
    
    // 返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

/**
 * 后台更新缓存
 */
async function updateCache(request: Request, cacheKey: string) {
  try {
    const response = await fetch(request)
    if (!response.ok) return

    const cache = await caches.open(CACHE_NAME)
    const responseToCache = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'X-Cache-Date': Date.now().toString(),
      },
    })
    
    await cache.put(cacheKey, responseToCache)
  } catch (error) {
    console.error('[SW] Background update failed:', error)
  }
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(response: Response): boolean {
  const cacheDate = response.headers.get('X-Cache-Date')
  if (!cacheDate) return true
  
  const age = (Date.now() - parseInt(cacheDate)) / 1000
  return age > API_CACHE_CONFIG.cacheTime
}

/**
 * 检查并清理缓存
 */
async function checkCacheSize() {
  const cache = await caches.open(CACHE_NAME)
  const keys = await cache.keys()
  
  if (keys.length > API_CACHE_CONFIG.maxCacheSize) {
    // 删除最旧的缓存项
    const keysToDelete = keys.slice(0, keys.length - API_CACHE_CONFIG.maxCacheSize)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
    console.log('[SW] Cleaned old cache entries')
  }
}

/**
 * 消息处理
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map(name => caches.delete(name)))
      }).then(() => {
        event.ports[0].postMessage({ success: true, message: 'Cache cleared' })
      })
    )
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          const cacheInfo = {
            name: CACHE_NAME,
            size: keys.length,
            urls: keys.map(key => key.url)
          }
          event.ports[0].postMessage({ success: true, cacheInfo })
        })
      })
    )
  }
})

export {}
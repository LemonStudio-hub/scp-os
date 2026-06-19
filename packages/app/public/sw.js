/**
 * Service Worker for SCP-OS
 * Handles offline caching, stale-while-revalidate for API data,
 * and cache eviction to keep storage bounded
 */

const CACHE_NAME = 'scp-os-v3'
const CACHE_VERSION = 3

const CACHE_URLS = ['/', '/index.html', '/favicon.ico', '/favicon.svg', '/icon-512x512.png']

const API_CACHE_CONFIG = {
  cacheTime: 1800,
  maxCacheSize: 100,
}

const DYNAMIC_CACHE = new Map()

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION + '...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell')
        return cache.addAll(CACHE_URLS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION + '...')

  event.waitUntil(
    Promise.all([
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
      self.clients.claim(),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (
    url.pathname.startsWith('/scrape') ||
    url.pathname.startsWith('/search') ||
    url.pathname.startsWith('/list') ||
    url.pathname.startsWith('/stats')
  ) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  event.respondWith(handleStaticRequest(request))
})

async function handleAPIRequest(request) {
  const url = new URL(request.url)
  const cacheKey = `api:${url.pathname}${url.search}`

  const cachedResponse = await caches.match(cacheKey)
  if (cachedResponse && !isCacheExpired(cachedResponse)) {
    console.log('[SW] Cache hit:', cacheKey)

    const responseWithCacheFlag = new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers: {
        ...cachedResponse.headers,
        'X-Cache': 'HIT',
      },
    })

    updateCache(request, cacheKey)

    return responseWithCacheFlag
  }

  try {
    console.log('[SW] Cache miss, fetching:', cacheKey)
    const response = await fetch(request)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const clonedResponse = response.clone()
    const cache = await caches.open(CACHE_NAME)

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

    await checkCacheSize()

    return response
  } catch (error) {
    console.error('[SW] Fetch error:', error)

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

    return caches.match('/offline.html').then((offlinePage) => {
      if (offlinePage) {
        return offlinePage
      }
      return new Response('Offline', { status: 503 })
    })
  }
}

async function handleStaticRequest(request) {
  const url = new URL(request.url)
  const isNavigation = request.mode === 'navigate' || url.pathname.endsWith('.html')

  if (isNavigation) {
    try {
      // Always bypass browser cache for HTML to ensure latest version
      const noCacheRequest = new Request(request, { cache: 'no-store' })
      const response = await fetch(noCacheRequest)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
        return response
      }
    } catch (error) {
      console.warn('[SW] Network failed for HTML, trying cache:', error)
    }
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match('/') || new Response('Offline', { status: 503 })
  }

  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const response = await fetch(request)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())

    return response
  } catch (error) {
    console.error('[SW] Static fetch error:', error)
    return new Response('Offline', { status: 503 })
  }
}

async function updateCache(request, cacheKey) {
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

function isCacheExpired(response) {
  const cacheDate = response.headers.get('X-Cache-Date')
  if (!cacheDate) return true

  const age = (Date.now() - parseInt(cacheDate)) / 1000
  return age > API_CACHE_CONFIG.cacheTime
}

async function checkCacheSize() {
  const cache = await caches.open(CACHE_NAME)
  const keys = await cache.keys()

  if (keys.length > API_CACHE_CONFIG.maxCacheSize) {
    const keysToDelete = keys.slice(0, keys.length - API_CACHE_CONFIG.maxCacheSize)
    await Promise.all(keysToDelete.map((key) => cache.delete(key)))
    console.log('[SW] Cleaned old cache entries')
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.map((name) => caches.delete(name)))
        })
        .then(() => {
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
            urls: keys.map((key) => key.url),
          }
          event.ports[0].postMessage({ success: true, cacheInfo })
        })
      })
    )
  }
})

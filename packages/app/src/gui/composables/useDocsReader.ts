/**
 * useDocsReader Composable
 * SCP 文档阅读器核心逻辑，提供文章列表加载、详情获取、
 * 搜索筛选、收藏管理、阅读进度保存、HTML 清洗等功能。
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { config } from '../../config'
import indexedDBService from '../../utils/indexedDB'
import logger from '../../utils/logger'
import type { FavoriteRecord } from '../../utils/indexedDB'

// ── Types ────────────────────────────────────────────────────────────

export type SCPObjectClass = 'Safe' | 'Euclid' | 'Keter' | 'Thaumiel' | 'Neutralized' | 'Unknown'

export interface SCPArticle {
  scpNumber: string
  title: string
  objectClass: SCPObjectClass
  series: number
  rating: number
  url: string
}

export interface SCPArticleDetail extends SCPArticle {
  content: string
  rawHtml: string
  wordCount: number
  toc: TOCItem[]
}

export interface TOCItem {
  id: string
  text: string
  level: number
}

export type ReaderTheme = 'dark' | 'light'

// ── Constants ────────────────────────────────────────────────────────

const API_BASE = config.api.workerUrl
const PAGE_SIZE = 30
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const TIMEOUT_MS = 20000

const OBJECT_CLASS_COLORS: Record<SCPObjectClass, string> = {
  Safe: '#34C759',
  Euclid: '#FFCC00',
  Keter: '#FF3B30',
  Thaumiel: '#AF52DE',
  Neutralized: '#8E8E93',
  Unknown: '#FFFFFF',
}

const SERIES_OPTIONS = [
  { label: 'Series I', value: 1, range: '001-999' },
  { label: 'Series II', value: 2, range: '1000-1999' },
  { label: 'Series III', value: 3, range: '2000-2999' },
  { label: 'Series IV', value: 4, range: '3000-3999' },
  { label: 'Series V', value: 5, range: '4000-4999' },
  { label: 'Series VI', value: 6, range: '5000-5999' },
  { label: 'Series VII', value: 7, range: '6000-6999' },
  { label: 'Series VIII', value: 8, range: '7000-7999' },
  { label: 'Series IX', value: 9, range: '8000-8999' },
  { label: 'Series X', value: 10, range: '9000-9999' },
  { label: 'Series X.5', value: 10.5, range: '9000-9999 (Joke)' },
]

const CLASS_OPTIONS: { label: string; value: SCPObjectClass }[] = [
  { label: 'Safe', value: 'Safe' },
  { label: 'Euclid', value: 'Euclid' },
  { label: 'Keter', value: 'Keter' },
  { label: 'Thaumiel', value: 'Thaumiel' },
  { label: 'Neutralized', value: 'Neutralized' },
  { label: 'Unknown', value: 'Unknown' },
]

// ── HTTP Helper ──────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── HTML Sanitization ────────────────────────────────────────────────

let domPurifyModule: any = null
let domPurifyLoaded = false

async function loadDOMPurify(): Promise<any> {
  if (domPurifyLoaded) return domPurifyModule
  try {
    const mod = await import('dompurify')
    domPurifyModule = mod.default || mod
    domPurifyLoaded = true
    return domPurifyModule
  } catch {
    logger.warn('[DocsReader] DOMPurify not available, using fallback sanitizer')
    domPurifyLoaded = true
    return null
  }
}

/**
 * Basic HTML sanitizer fallback when DOMPurify is not available.
 * Removes script tags, event handlers, and dangerous attributes.
 */
function basicSanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
}

async function sanitizeHtml(html: string): Promise<string> {
  const purify = await loadDOMPurify()
  if (purify) {
    return purify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr', 'blockquote', 'pre', 'code',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
        'sub', 'sup', 'abbr', 'mark', 'span', 'div',
        'img', 'figure', 'figcaption', 'details', 'summary',
        'sup', 'sub', 'ruby', 'rt', 'rp',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'colspan', 'rowspan', 'width', 'height',
        'style', 'target', 'rel', 'loading',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    })
  }
  return basicSanitize(html)
}

// ── TOC Extraction ───────────────────────────────────────────────────

function extractTOC(html: string): TOCItem[] {
  const toc: TOCItem[] = []
  const headingRegex = /<h([1-6])[^>]*?(?:id=["']([^"']*)["'])?[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const id = match[2] || `toc-${toc.length}`
    const text = match[3].replace(/<[^>]*>/g, '').trim()
    if (text) {
      toc.push({ id, text, level })
    }
  }

  return toc
}

// ── Composable ───────────────────────────────────────────────────────

export function useDocsReader() {
  // ── Reactive State ──────────────────────────────────────────────
  const articles = ref<SCPArticle[]>([])
  const currentArticle = ref<SCPArticleDetail | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const loadingDetail = ref(false)
  const searchQuery = ref('')
  const selectedSeries = ref<number | null>(null)
  const selectedClass = ref<SCPObjectClass | null>(null)
  const fontSize = ref(16)
  const readerTheme = ref<ReaderTheme>('dark')
  const favorites = ref<Set<string>>(new Set())
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const cacheStatus = ref<'idle' | 'loading' | 'cached'>('idle')
  const error = ref<string | null>(null)

  // ── Computed ────────────────────────────────────────────────────

  const filteredArticles = computed(() => {
    let result = articles.value

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      result = result.filter(
        a =>
          a.scpNumber.toLowerCase().includes(query) ||
          a.title.toLowerCase().includes(query)
      )
    }

    if (selectedSeries.value !== null) {
      result = result.filter(a => a.series === selectedSeries.value)
    }

    if (selectedClass.value !== null) {
      result = result.filter(a => a.objectClass === selectedClass.value)
    }

    return result
  })

  const isFavorited = computed(() => {
    if (!currentArticle.value) return false
    return favorites.value.has(currentArticle.value.scpNumber)
  })

  const cacheCount = computed(() => {
    // Estimate from articles that have been loaded
    return articles.value.length
  })

  // ── Online Status ───────────────────────────────────────────────

  function handleOnline(): void {
    isOnline.value = true
  }

  function handleOffline(): void {
    isOnline.value = false
  }

  // ── API Methods ─────────────────────────────────────────────────

  async function fetchArticles(page: number = 1, append: boolean = false): Promise<void> {
    if (!isOnline.value && page === 1 && !append) {
      error.value = 'You are offline. Connect to the internet to load articles.'
      loading.value = false
      return
    }

    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      const offset = (page - 1) * PAGE_SIZE
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })

      if (selectedSeries.value !== null) {
        params.set('series', String(selectedSeries.value))
      }
      if (selectedClass.value !== null) {
        params.set('class', selectedClass.value)
      }
      if (searchQuery.value.trim()) {
        params.set('search', searchQuery.value.trim())
      }

      const response = await fetchWithTimeout(`${API_BASE}/docs/items?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        const newArticles: SCPArticle[] = data.data.map((item: any) => ({
          scpNumber: item.scp_number || item.scpNumber || '',
          title: item.title || '',
          objectClass: (item.object_class || item.objectClass || 'Unknown') as SCPObjectClass,
          series: item.series || 1,
          rating: item.rating || 0,
          url: item.url || '',
        }))

        if (append) {
          articles.value = [...articles.value, ...newArticles]
        } else {
          articles.value = newArticles
        }

        currentPage.value = page
        hasMore.value = (data.total && data.offset + newArticles.length < data.total) || newArticles.length >= PAGE_SIZE
      } else {
        if (!append) {
          articles.value = []
        }
        hasMore.value = false
      }
    } catch (err) {
      logger.error('[DocsReader] Failed to fetch articles:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load articles'
      if (!append) {
        hasMore.value = false
      }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function fetchArticleDetail(scpNumber: string): Promise<void> {
    loadingDetail.value = true
    error.value = null
    cacheStatus.value = 'loading'

    try {
      const cached = await indexedDBService.getSCPContent(scpNumber)
      if (cached && (Date.now() - cached.cachedAt < CACHE_TTL)) {
        const sanitizedContent = await sanitizeHtml(cached.rawHtml)
        const toc = extractTOC(sanitizedContent)

        const listMeta = articles.value.find(a => a.scpNumber === scpNumber)

        currentArticle.value = {
          scpNumber: cached.scpNumber,
          title: listMeta?.title || '',
          objectClass: listMeta?.objectClass || 'Unknown',
          series: listMeta?.series || 1,
          rating: listMeta?.rating || 0,
          url: listMeta?.url || '',
          content: sanitizedContent,
          rawHtml: cached.rawHtml,
          wordCount: cached.wordCount,
          toc,
        }
        cacheStatus.value = 'cached'

        if (isOnline.value) {
          fetchArticleFromNetwork(scpNumber, true).catch(() => {})
        }
        return
      }

      await fetchArticleFromNetwork(scpNumber, false)
    } catch (err) {
      logger.error('[DocsReader] Failed to fetch article detail:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load article'
    } finally {
      loadingDetail.value = false
    }
  }

  async function fetchArticleFromNetwork(scpNumber: string, background: boolean): Promise<void> {
    if (!isOnline.value) return

    try {
      const [contentResponse, metaResponse] = await Promise.allSettled([
        fetchWithTimeout(`${API_BASE}/docs/content/${encodeURIComponent(scpNumber)}`),
        fetchWithTimeout(`${API_BASE}/docs/item/${encodeURIComponent(scpNumber)}`),
      ])

      let contentData: any = null
      if (contentResponse.status === 'fulfilled' && contentResponse.value.ok) {
        contentData = await contentResponse.value.json()
      }

      let metaData: any = null
      if (metaResponse.status === 'fulfilled' && metaResponse.value.ok) {
        metaData = await metaResponse.value.json()
      }

      if (!contentData || !contentData.success || !contentData.data) {
        throw new Error('Content API returned no data')
      }

      const contentItem = contentData.data
      const rawHtml: string = contentItem.content || ''
      if (!rawHtml || rawHtml.length < 100) {
        throw new Error('Retrieved content is empty or too short')
      }

      const sanitizedContent = await sanitizeHtml(rawHtml)
      const toc = extractTOC(sanitizedContent)
      const wordCount = rawHtml.replace(/<[^>]*>/g, '').length

      const savedEntry = {
        scpNumber,
        content: sanitizedContent,
        rawHtml,
        wordCount,
      }
      await indexedDBService.saveSCPContent(savedEntry)

      const metaItem = metaData?.success ? metaData.data : null
      const detail: SCPArticleDetail = {
        scpNumber,
        title: metaItem?.title || '',
        objectClass: (metaItem?.object_class || metaItem?.objectClass || 'Unknown') as SCPObjectClass,
        series: metaItem?.series || 1,
        rating: metaItem?.rating || 0,
        url: metaItem?.url || '',
        content: sanitizedContent,
        rawHtml,
        wordCount,
        toc,
      }

      if (!background) {
        currentArticle.value = detail
      } else if (currentArticle.value?.scpNumber === scpNumber) {
        currentArticle.value = detail
      }

      cacheStatus.value = 'cached'
    } catch (err) {
      if (!background) {
        throw err
      }
      logger.warn('[DocsReader] Background fetch failed:', err)
    }
  }

  // ── Search & Filter ─────────────────────────────────────────────

  function search(): void {
    currentPage.value = 1
    hasMore.value = true
    fetchArticles(1, false)
  }

  function setSeries(series: number | null): void {
    selectedSeries.value = series
    currentPage.value = 1
    hasMore.value = true
    fetchArticles(1, false)
  }

  function setObjectClass(cls: SCPObjectClass | null): void {
    selectedClass.value = cls
    currentPage.value = 1
    hasMore.value = true
    fetchArticles(1, false)
  }

  function loadMore(): void {
    if (loadingMore.value || !hasMore.value) return
    fetchArticles(currentPage.value + 1, true)
  }

  // ── Article Selection ───────────────────────────────────────────

  async function selectArticle(scpNumber: string): Promise<void> {
    await fetchArticleDetail(scpNumber)

    // Restore reading progress
    try {
      const progress = await indexedDBService.getReadingProgress(scpNumber)
      if (progress) {
        // The component will handle scroll restoration
        currentArticle.value = currentArticle.value
          ? { ...currentArticle.value, _scrollPosition: progress.scrollPosition } as any
          : null
      }
    } catch {
      // Ignore progress restoration errors
    }
  }

  function clearArticle(): void {
    saveCurrentProgress()
    currentArticle.value = null
  }

  // ── Font Size ───────────────────────────────────────────────────

  const MIN_FONT_SIZE = 12
  const MAX_FONT_SIZE = 28

  function increaseFontSize(): void {
    if (fontSize.value < MAX_FONT_SIZE) {
      fontSize.value = Math.min(fontSize.value + 2, MAX_FONT_SIZE)
      saveReaderSettings()
    }
  }

  function decreaseFontSize(): void {
    if (fontSize.value > MIN_FONT_SIZE) {
      fontSize.value = Math.max(fontSize.value - 2, MIN_FONT_SIZE)
      saveReaderSettings()
    }
  }

  // ── Theme ───────────────────────────────────────────────────────

  function toggleTheme(): void {
    readerTheme.value = readerTheme.value === 'dark' ? 'light' : 'dark'
    saveReaderSettings()
  }

  // ── Favorites ───────────────────────────────────────────────────

  async function toggleFavorite(): Promise<void> {
    if (!currentArticle.value) return

    const scpNumber = currentArticle.value.scpNumber
    if (favorites.value.has(scpNumber)) {
      favorites.value.delete(scpNumber)
      try {
        await indexedDBService.removeFavorite(scpNumber)
      } catch {
        // Ignore
      }
    } else {
      favorites.value.add(scpNumber)
      try {
        await indexedDBService.saveFavorite({
          scpNumber,
          title: currentArticle.value.title,
        })
      } catch {
        // Ignore
      }
    }
  }

  async function loadFavorites(): Promise<void> {
    try {
      const favs = await indexedDBService.getFavorites()
      favorites.value = new Set(favs.map((f: FavoriteRecord) => f.scpNumber))
    } catch {
      // Ignore
    }
  }

  // ── Reading Progress ────────────────────────────────────────────

  let progressSaveTimer: number | null = null

  function saveCurrentProgress(): void {
    if (!currentArticle.value) return
    // The component should call saveProgress with the actual scroll position
  }

  async function saveProgress(scrollPosition: number): Promise<void> {
    if (!currentArticle.value) return
    try {
      await indexedDBService.saveReadingProgress({
        scpNumber: currentArticle.value.scpNumber,
        scrollPosition,
        readingTime: 0,
      })
    } catch {
      // Ignore
    }
  }

  function startProgressAutoSave(getScrollPosition: () => number): void {
    if (progressSaveTimer) clearInterval(progressSaveTimer)
    progressSaveTimer = window.setInterval(() => {
      if (currentArticle.value) {
        saveProgress(getScrollPosition())
      }
    }, 5000)
  }

  function stopProgressAutoSave(): void {
    if (progressSaveTimer) {
      clearInterval(progressSaveTimer)
      progressSaveTimer = null
    }
  }

  // ── Settings Persistence ────────────────────────────────────────

  async function loadReaderSettings(): Promise<void> {
    try {
      const settings = await indexedDBService.loadSetting('docs_reader_settings')
      if (settings) {
        fontSize.value = settings.fontSize ?? 16
        readerTheme.value = settings.readerTheme ?? 'dark'
      }
    } catch {
      // Ignore
    }
  }

  async function saveReaderSettings(): Promise<void> {
    try {
      await indexedDBService.saveSetting('docs_reader_settings', {
        fontSize: fontSize.value,
        readerTheme: readerTheme.value,
      })
    } catch {
      // Ignore
    }
  }

  // ── Scroll to TOC Item ──────────────────────────────────────────

  function scrollToTOCItem(tocItem: TOCItem): void {
    const el = document.getElementById(tocItem.id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  onMounted(async () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    await loadReaderSettings()
    await loadFavorites()
    await fetchArticles(1)

    // Pre-load DOMPurify
    loadDOMPurify().catch(() => {})
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    stopProgressAutoSave()
    saveCurrentProgress()
  })

  return {
    // State
    articles,
    currentArticle,
    loading,
    loadingMore,
    loadingDetail,
    searchQuery,
    selectedSeries,
    selectedClass,
    fontSize,
    readerTheme,
    favorites,
    currentPage,
    hasMore,
    isOnline,
    cacheStatus,
    error,

    // Computed
    filteredArticles,
    isFavorited,
    cacheCount,

    // Methods
    fetchArticles,
    fetchArticleDetail,
    selectArticle,
    clearArticle,
    search,
    setSeries,
    setObjectClass,
    loadMore,
    increaseFontSize,
    decreaseFontSize,
    toggleTheme,
    toggleFavorite,
    loadFavorites,
    saveProgress,
    startProgressAutoSave,
    stopProgressAutoSave,
    scrollToTOCItem,
    sanitizeHtml,

    // Constants
    OBJECT_CLASS_COLORS,
    SERIES_OPTIONS,
    CLASS_OPTIONS,
  }
}

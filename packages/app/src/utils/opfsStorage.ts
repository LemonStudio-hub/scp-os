import logger from './logger'
import opfsWorkerUrl from './opfsWorker.ts?worker&url'

const DEBOUNCE_MS = 300
const META_DEBOUNCE_MS = 500
const MAX_CACHE_ENTRIES = 50
const MAX_CACHE_BYTES = 10 * 1024 * 1024
const QUOTA_WARN_THRESHOLD = 0.9
const WORKER_TIMEOUT_MS = 10000

interface PerformanceMetrics {
  readCount: number
  writeCount: number
  deleteCount: number
  totalReadBytes: number
  totalWriteBytes: number
  cacheHits: number
  cacheMisses: number
  lastResetTime: number
}

interface StorageEstimate {
  usage: number
  quota: number
  usagePercent: number
}

interface PendingRequest {
  resolve: (data: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

class LRUCache {
  private cache = new Map<string, { data: string; lastAccess: number; bytes: number }>()
  private maxEntries: number
  private maxBytes: number
  private currentEntries = 0
  private currentBytes = 0

  constructor(maxEntries: number = MAX_CACHE_ENTRIES, maxBytes: number = MAX_CACHE_BYTES) {
    this.maxEntries = maxEntries
    this.maxBytes = maxBytes
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key)
    if (entry) {
      entry.lastAccess = Date.now()
      this.cache.delete(key)
      this.cache.set(key, entry)
      return entry.data
    }
    return undefined
  }

  set(key: string, data: string): void {
    const bytes = data.length * 2

    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)
      if (oldEntry) {
        this.currentBytes -= oldEntry.bytes
      }
      this.cache.delete(key)
      this.currentEntries--
    }

    while (
      this.currentEntries >= this.maxEntries ||
      (this.currentBytes + bytes > this.maxBytes && this.currentEntries > 0)
    ) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        const removed = this.cache.get(firstKey)
        if (removed) {
          this.currentBytes -= removed.bytes
        }
        this.cache.delete(firstKey)
        this.currentEntries--
      }
    }

    this.cache.set(key, { data, lastAccess: Date.now(), bytes })
    this.currentEntries++
    this.currentBytes += bytes
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.currentBytes -= entry.bytes
      this.currentEntries--
      return this.cache.delete(key)
    }
    return false
  }

  clear(): void {
    this.cache.clear()
    this.currentEntries = 0
    this.currentBytes = 0
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  get size(): number {
    return this.currentEntries
  }

  get bytes(): number {
    return this.currentBytes
  }
}

class OPFSStorage {
  private worker: Worker | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private requestId = 0
  private pendingRequests = new Map<string, PendingRequest>()
  private beforeUnloadHandler: (() => void) | null = null

  private cache = new LRUCache(MAX_CACHE_ENTRIES, MAX_CACHE_BYTES)
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private pendingWriteResolvers = new Map<string, { resolve: () => void; reject: (err: Error) => void }[]>()
  private metaSaveTimer: ReturnType<typeof setTimeout> | null = null
  private pendingMeta: { root: unknown; currentPath: string[] } | null = null
  private metaSaveResolvers: { resolve: () => void; reject: (err: Error) => void }[] = []

  private metrics: PerformanceMetrics = {
    readCount: 0,
    writeCount: 0,
    deleteCount: 0,
    totalReadBytes: 0,
    totalWriteBytes: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastResetTime: Date.now(),
  }

  async init(): Promise<void> {
    if (this.isInitialized) return
    if (this.initPromise) return this.initPromise
    this.initPromise = this.doInit()
    return this.initPromise
  }

  private async doInit(): Promise<void> {
    try {
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported')
      }

      this.worker = new Worker(opfsWorkerUrl, { type: 'module' })
      this.worker.onmessage = this.handleWorkerMessage.bind(this)
      this.worker.onerror = (event) => {
        logger.error('[OPFS] Worker error:', event.error || event.message)
      }

      await this.sendRequest('init', undefined)

      this.isInitialized = true
      this.registerBeforeUnload()

      const estimate = await this.getStorageEstimate()
      if (estimate && estimate.usagePercent > QUOTA_WARN_THRESHOLD * 100) {
        logger.warn(`[OPFS] Storage usage is at ${estimate.usagePercent.toFixed(1)}% of quota`)
      }

      logger.info('[OPFS] Worker-based storage initialized successfully')
    } catch (error) {
      this.initPromise = null
      if (this.worker) {
        this.worker.terminate()
        this.worker = null
      }
      logger.error('[OPFS] Failed to initialize worker storage:', error)
      throw error
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, success, data, error } = event.data
    const pending = this.pendingRequests.get(id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pendingRequests.delete(id)

    if (success) {
      pending.resolve(data)
    } else {
      pending.reject(new Error(error || '[OPFS] Worker operation failed'))
    }
  }

  private sendRequest<T>(type: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('[OPFS] Worker not initialized'))
        return
      }

      const id = `req_${++this.requestId}`
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`[OPFS] Worker request '${type}' timed out after ${WORKER_TIMEOUT_MS}ms`))
      }, WORKER_TIMEOUT_MS)

      this.pendingRequests.set(id, {
        resolve: resolve as (data: unknown) => void,
        reject,
        timer,
      })

      this.worker.postMessage({ id, type, payload })
    })
  }

  private registerBeforeUnload(): void {
    if (typeof window !== 'undefined' && !this.beforeUnloadHandler) {
      this.beforeUnloadHandler = () => {
        this.forceFlushSync()
      }
      window.addEventListener('beforeunload', this.beforeUnloadHandler)
    }
  }

  private forceFlushSync(): void {
    for (const [, timer] of this.pendingTimers) {
      clearTimeout(timer)
    }
    this.pendingTimers.clear()
    this.pendingWriteResolvers.clear()

    if (this.metaSaveTimer) {
      clearTimeout(this.metaSaveTimer)
      this.metaSaveTimer = null
    }

    if (this.worker) {
      try {
        this.worker.postMessage({ id: 'sync_flush', type: 'flush' })
      } catch {
        // Best-effort sync flush
      }
    }
  }

  private getContentPath(virtualPath: string): string {
    const normalized = virtualPath.replace(/^\/+/, '').replace(/\/+$/, '')
    return normalized.replace(/\//g, '__')
  }

  async getStorageEstimate(): Promise<StorageEstimate | null> {
    try {
      return await this.sendRequest<StorageEstimate | null>('estimate', undefined)
    } catch {
      return null
    }
  }

  async saveMeta(data: { root: unknown; currentPath: string[] }): Promise<void> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')
    this.pendingMeta = data

    return new Promise<void>((resolve, reject) => {
      this.metaSaveResolvers.push({ resolve, reject })

      if (this.metaSaveTimer) {
        clearTimeout(this.metaSaveTimer)
      }

      this.metaSaveTimer = setTimeout(async () => {
        this.metaSaveTimer = null
        const meta = this.pendingMeta
        const resolvers = this.metaSaveResolvers
        this.pendingMeta = null
        this.metaSaveResolvers = []

        if (!meta) return

        try {
          await this.sendRequest('saveMeta', meta)
          this.metrics.writeCount++
          const json = JSON.stringify(meta)
          this.metrics.totalWriteBytes += json.length
          for (const r of resolvers) r.resolve()
        } catch (err) {
          for (const r of resolvers) r.reject(err as Error)
        }
      }, META_DEBOUNCE_MS)
    })
  }

  async saveMetaImmediate(data: { root: unknown; currentPath: string[] }): Promise<void> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')

    if (this.metaSaveTimer) {
      clearTimeout(this.metaSaveTimer)
      this.metaSaveTimer = null
    }
    this.pendingMeta = null
    const resolvers = this.metaSaveResolvers
    this.metaSaveResolvers = []

    try {
      await this.sendRequest('saveMeta', data)
      this.metrics.writeCount++
      const json = JSON.stringify(data)
      this.metrics.totalWriteBytes += json.length
      for (const r of resolvers) r.resolve()
    } catch (err) {
      for (const r of resolvers) r.reject(err as Error)
      throw err
    }
  }

  async loadMeta(): Promise<{ root: unknown; currentPath: string[] } | null> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')
    this.metrics.readCount++

    try {
      const result = await this.sendRequest<{ root: unknown; currentPath: string[] } | null>('loadMeta', undefined)
      if (result) {
        const json = JSON.stringify(result)
        this.metrics.totalReadBytes += json.length
      }
      return result
    } catch (error) {
      logger.error('[OPFS] Failed to load meta:', error)
      throw error
    }
  }

  async saveFileContent(virtualPath: string, content: string): Promise<void> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')
    const cacheKey = this.getContentPath(virtualPath)
    this.cache.set(cacheKey, content)

    return this.debouncedWrite(virtualPath, content)
  }

  private debouncedWrite(virtualPath: string, content: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const key = this.getContentPath(virtualPath)

      if (!this.pendingWriteResolvers.has(key)) {
        this.pendingWriteResolvers.set(key, [])
      }
      const resolversList = this.pendingWriteResolvers.get(key)
      if (resolversList) {
        resolversList.push({ resolve, reject })
      }

      const existingTimer = this.pendingTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      this.pendingTimers.set(
        key,
        setTimeout(async () => {
          this.pendingTimers.delete(key)
          const resolvers = this.pendingWriteResolvers.get(key) || []
          this.pendingWriteResolvers.delete(key)

          try {
            await this.sendRequest('saveFile', { path: virtualPath, content })
            this.metrics.writeCount++
            this.metrics.totalWriteBytes += content.length
            for (const r of resolvers) r.resolve()
          } catch (err) {
            for (const r of resolvers) r.reject(err as Error)
          }
        }, DEBOUNCE_MS)
      )
    })
  }

  async forceFlush(): Promise<void> {
    const metaTimer = this.metaSaveTimer
    if (metaTimer && this.pendingMeta) {
      clearTimeout(metaTimer)
      this.metaSaveTimer = null
      const meta = this.pendingMeta
      const metaResolvers = this.metaSaveResolvers
      this.pendingMeta = null
      this.metaSaveResolvers = []
      try {
        await this.sendRequest('saveMeta', meta)
        for (const r of metaResolvers) r.resolve()
      } catch (err) {
        for (const r of metaResolvers) r.reject(err as Error)
      }
    }

    const keys = Array.from(this.pendingTimers.keys())
    const flushPromises: Promise<void>[] = []

    for (const key of keys) {
      const timer = this.pendingTimers.get(key)
      if (timer) {
        clearTimeout(timer)
        this.pendingTimers.delete(key)
      }

      const resolvers = this.pendingWriteResolvers.get(key)
      if (resolvers && resolvers.length > 0) {
        const content = this.cache.get(key) || ''
        const virtualPath = key.replace(/__/g, '/')
        flushPromises.push(
          this.sendRequest('saveFile', { path: virtualPath, content }).then(() => {
            this.metrics.writeCount++
            this.metrics.totalWriteBytes += content.length
            for (const r of resolvers) r.resolve()
          }).catch((err) => {
            for (const r of resolvers) r.reject(err)
          })
        )
        this.pendingWriteResolvers.delete(key)
      }
    }

    await Promise.all(flushPromises)

    try {
      await this.sendRequest('flush', undefined)
    } catch {
      // Flush command is best-effort
    }
  }

  async loadFileContent(virtualPath: string): Promise<string | null> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')
    const cacheKey = this.getContentPath(virtualPath)

    const cached = this.cache.get(cacheKey)
    if (cached !== undefined) {
      this.metrics.cacheHits++
      return cached
    }
    this.metrics.cacheMisses++

    try {
      const content = await this.sendRequest<string | null>('loadFile', { path: virtualPath })
      this.metrics.readCount++
      if (content !== null) {
        this.metrics.totalReadBytes += content.length
        this.cache.set(cacheKey, content)
      }
      return content
    } catch (error) {
      logger.error(`[OPFS] Failed to read file '${virtualPath}':`, error)
      throw error
    }
  }

  async deleteFileContent(virtualPath: string): Promise<void> {
    if (!this.isInitialized) throw new Error('[OPFS] Storage not initialized')
    const cacheKey = this.getContentPath(virtualPath)
    this.cache.delete(cacheKey)
    this.metrics.deleteCount++

    try {
      await this.sendRequest('deleteFile', { path: virtualPath })
      logger.debug(`[OPFS] File deleted: ${virtualPath}`)
    } catch (error) {
      logger.error(`[OPFS] Failed to delete file '${virtualPath}':`, error)
      throw error
    }
  }

  async hasFileContent(virtualPath: string): Promise<boolean> {
    const cacheKey = this.getContentPath(virtualPath)
    if (this.cache.has(cacheKey)) return true

    try {
      return await this.sendRequest<boolean>('hasFile', { path: virtualPath })
    } catch {
      return false
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
    for (const timer of this.pendingTimers.values()) {
      clearTimeout(timer)
    }
    this.pendingTimers.clear()
    this.pendingWriteResolvers.clear()

    if (this.metaSaveTimer) {
      clearTimeout(this.metaSaveTimer)
      this.metaSaveTimer = null
    }
    this.metaSaveResolvers = []
  }

  async reset(): Promise<void> {
    await this.forceFlush()
    await this.clearCache()

    try {
      await this.sendRequest('reset', undefined)
    } catch (error) {
      logger.error('[OPFS] Failed to reset storage:', error)
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      readCount: 0,
      writeCount: 0,
      deleteCount: 0,
      totalReadBytes: 0,
      totalWriteBytes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastResetTime: Date.now(),
    }
  }

  getCacheStats(): { size: number; bytes: number; hitRate: string } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    return {
      size: this.cache.size,
      bytes: this.cache.bytes,
      hitRate: total > 0 ? `${((this.metrics.cacheHits / total) * 100).toFixed(1)}%` : 'N/A',
    }
  }

  isSupported(): boolean {
    return typeof Worker !== 'undefined' && Boolean(navigator.storage && navigator.storage.getDirectory)
  }

  async destroy(): Promise<void> {
    await this.forceFlush()
    await this.clearCache()

    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }

    if (this.worker) {
      try {
        await this.sendRequest('destroy', undefined)
      } catch {
        // Best-effort
      }

      for (const pending of this.pendingRequests.values()) {
        clearTimeout(pending.timer)
        pending.reject(new Error('[OPFS] Storage destroyed'))
      }
      this.pendingRequests.clear()

      this.worker.terminate()
      this.worker = null
    }

    this.isInitialized = false
    this.initPromise = null
  }
}

export const opfsStorage = new OPFSStorage()
export default opfsStorage

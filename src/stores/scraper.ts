/**
 * Scraper Store
 * 管理 API 缓存和请求状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SCPWikiData } from '../types/scraper'

export interface CacheEntry {
  data: SCPWikiData
  timestamp: number
  ttl: number
}

export const useScraperStore = defineStore('scraper', () => {
  // State
  const cache = ref<Map<string, CacheEntry>>(new Map())
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  const cacheDuration = 30 * 60 * 1000 // 30 minutes

  // Getters
  const cacheSize = computed(() => cache.value.size)
  const isCacheEmpty = computed(() => cache.value.size === 0)
  const hasError = computed(() => lastError.value !== null)

  // Actions
  function getFromCache(key: string): SCPWikiData | null {
    const entry = cache.value.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      cache.value.delete(key)
      return null
    }

    return entry.data
  }

  function saveToCache(key: string, data: SCPWikiData, ttl?: number) {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || cacheDuration,
    })
  }

  function removeFromCache(key: string) {
    cache.value.delete(key)
  }

  function clearCache() {
    cache.value.clear()
  }

  function cleanExpiredCache() {
    const now = Date.now()
    const expiredKeys: string[] = []

    cache.value.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => cache.value.delete(key))
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(error: string | null) {
    lastError.value = error
  }

  function getCacheKeys(): string[] {
    return Array.from(cache.value.keys())
  }

  function getCacheEntry(key: string): CacheEntry | null {
    return cache.value.get(key) || null
  }

  function updateCacheTTL(key: string, ttl: number) {
    const entry = cache.value.get(key)
    if (entry) {
      entry.ttl = ttl
      cache.value.set(key, entry)
    }
  }

  function getCacheStats() {
    const entries = Array.from(cache.value.values())
    const now = Date.now()
    const validCount = entries.filter(e => now - e.timestamp <= e.ttl).length
    const expiredCount = entries.length - validCount

    return {
      total: entries.length,
      valid: validCount,
      expired: expiredCount,
      size: new Blob([JSON.stringify(entries)]).size,
    }
  }

  return {
    // State
    cache,
    isLoading,
    lastError,
    cacheDuration,
    // Getters
    cacheSize,
    isCacheEmpty,
    hasError,
    // Actions
    getFromCache,
    saveToCache,
    removeFromCache,
    clearCache,
    cleanExpiredCache,
    setLoading,
    setError,
    getCacheKeys,
    getCacheEntry,
    updateCacheTTL,
    getCacheStats,
  }
})
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SCPWikiData } from '../types/scraper'
import { config } from '../config'

/**
 * API cache and request state management
 */
export const useScraperStore = defineStore('scraper', () => {
  const cache = ref<Map<string, { data: SCPWikiData, timestamp: number }>>(new Map())
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  /**
   * Get from cache
   */
  function getFromCache(key: string): SCPWikiData | null {
    const cached = cache.value.get(key)
    if (cached) {
      const now = Date.now()
      if (now - cached.timestamp < config.cache.duration) {
        return cached.data
      }
      cache.value.delete(key)
    }
    return null
  }

  /**
   * Save to cache
   */
  function saveToCache(key: string, data: SCPWikiData): void {
    cache.value.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear cache
   */
  function clearCache(): void {
    cache.value.clear()
  }

  /**
   * Clear expired cache entries
   */
  function clearExpiredCache(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    cache.value.forEach((value, key) => {
      if (now - value.timestamp > config.cache.duration) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => cache.value.delete(key))
  }

  /**
   * Get cache statistics
   */
  function getCacheStats() {
    const now = Date.now()
    let expired = 0
    let totalSize = 0

    cache.value.forEach((value) => {
      totalSize += JSON.stringify(value.data).length
      if (now - value.timestamp > config.cache.duration) {
        expired++
      }
    })

    return {
      totalEntries: cache.value.size,
      expiredEntries: expired,
      totalSize: totalSize,
      averageSize: cache.value.size > 0 ? totalSize / cache.value.size : 0,
    }
  }

  /**
   * Set loading state
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /**
   * Set error
   */
  function setError(error: string | null): void {
    lastError.value = error
  }

  /**
   * Clear error
   */
  function clearError(): void {
    lastError.value = null
  }

  return {
    cache,
    isLoading,
    lastError,
    getFromCache,
    saveToCache,
    clearCache,
    clearExpiredCache,
    getCacheStats,
    setLoading,
    setError,
    clearError,
  }
})
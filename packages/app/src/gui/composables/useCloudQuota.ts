import { ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { config } from '../../config'

export interface CloudQuota {
  used: number
  max: number
  percent: number
  count: number
}

const CACHE_DURATION = 30_000
let cachedQuota: CloudQuota | null = null
let cachedAt = 0

export async function fetchCloudQuota(): Promise<CloudQuota | null> {
  const now = Date.now()
  if (cachedQuota && now - cachedAt < CACHE_DURATION) {
    return cachedQuota
  }

  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) {
    cachedQuota = null
    cachedAt = now
    return null
  }

  try {
    const response = await authStore.authFetch(`${config.api.workerUrl}/files/quota`)
    if (!response.ok) {
      cachedQuota = null
      cachedAt = now
      return null
    }
    const result = (await response.json()) as {
      success: boolean
      data?: { used: number; max: number; percent: number; count: number }
    }
    if (result.success && result.data) {
      cachedQuota = {
        used: result.data.used,
        max: result.data.max,
        percent: result.data.percent,
        count: result.data.count || 0,
      }
      cachedAt = now
      return cachedQuota
    }
  } catch {
    // ignore
  }

  cachedQuota = null
  cachedAt = now
  return null
}

export function useCloudQuota() {
  const quota = ref<CloudQuota | null>(null)
  const isLoading = ref(false)

  async function refresh() {
    isLoading.value = true
    try {
      quota.value = await fetchCloudQuota()
    } finally {
      isLoading.value = false
    }
  }

  return { quota, isLoading, refresh }
}

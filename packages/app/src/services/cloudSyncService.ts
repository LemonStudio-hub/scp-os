import { config } from '../config'
import { useAuthStore } from '../stores/authStore'
import indexedDBService from '../utils/indexedDB'

const API_BASE = config.api.workerUrl

export interface CloudSyncSnapshot {
  version: 1
  exportedAt: string
  stores: Record<string, unknown[]>
}

export async function uploadAllLocalData(): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) {
    return { success: false, error: '游客不能使用云同步' }
  }

  const snapshot: CloudSyncSnapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: await indexedDBService.exportAllData(),
  }

  const response = await authStore.authFetch(`${API_BASE}/api/sync/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    return { success: false, error: data.error || data.message || `HTTP ${response.status}` }
  }
  return { success: true }
}

export async function downloadCloudData(): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) {
    return { success: false, error: '游客不能使用云同步' }
  }

  const response = await authStore.authFetch(`${API_BASE}/api/sync/data`)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    return { success: false, error: data.error || data.message || `HTTP ${response.status}` }
  }

  const snapshot = (await response.json()) as CloudSyncSnapshot | { success: boolean; data: null }
  if ('success' in snapshot && snapshot.data === null) {
    return { success: false, error: '云端暂无同步数据' }
  }
  if (!('stores' in snapshot) || snapshot.version !== 1) {
    return { success: false, error: '云端同步数据格式无效' }
  }
  await indexedDBService.importAllData(snapshot.stores)
  return { success: true }
}

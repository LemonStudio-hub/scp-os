import { config } from '../config'
import { filesystem } from '../utils/filesystem'
import { useAuthStore } from '../stores/authStore'

const API_BASE = config.api.workerUrl
const GUEST_CLOUD_ERROR = 'Cloud sync is unavailable for guests'

export interface R2File {
  key: string
  name: string
  size: number
  type: string
  contentType?: string
  uploadedAt: string
  url: string
}

export interface FileListResponse {
  success: boolean
  data: R2File[]
  count?: number
  error?: string
}

export interface UploadResponse {
  success: boolean
  data?: {
    key: string
    name: string
    size: number
    type: string
    contentType?: string
    url: string
  }
  error?: string
}

function normalizeCloudPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
}

export async function uploadFile(file: File, folder = 'uploads'): Promise<UploadResponse> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: GUEST_CLOUD_ERROR }

  const formData = new FormData()
  const path = normalizeCloudPath(`${folder}/${file.name}`) || file.name
  formData.append('file', file)
  formData.append('path', path)

  const response = await authStore.authFetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

export async function listFiles(prefix = '', limit = 100): Promise<FileListResponse> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, data: [], error: GUEST_CLOUD_ERROR }

  const url = new URL(`${API_BASE}/files`)
  if (prefix) url.searchParams.set('prefix', normalizeCloudPath(prefix))
  if (limit) url.searchParams.set('limit', String(limit))

  const response = await authStore.authFetch(url.toString())
  return response.json()
}

export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: GUEST_CLOUD_ERROR }

  const response = await authStore.authFetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function updateFileContent(
  key: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: GUEST_CLOUD_ERROR }

  const response = await authStore.authFetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content,
  })
  return response.json()
}

export async function readFileContent(path: string): Promise<string | null> {
  const data = filesystem.readFile(path)
  if (data === null) return null
  if (typeof data !== 'string') return null

  if (data.startsWith('http')) {
    try {
      const response = await fetch(data, { cache: 'no-cache' })
      if (response.ok) return await response.text()
      return null
    } catch {
      return null
    }
  }

  return data
}

export async function saveTextFile(path: string, content: string): Promise<boolean> {
  try {
    const existing = filesystem.readFile(path)
    let key: string | null = null

    if (typeof existing === 'string' && existing.startsWith(`${API_BASE}/files/`)) {
      key = decodeURIComponent(existing.replace(`${API_BASE}/files/`, ''))
    }

    if (key) {
      const result = await updateFileContent(key, content)
      return result.success
    }

    const fileName = path.split('/').pop() || 'untitled.txt'
    const blob = new Blob([content], { type: 'text/plain' })
    const file = new File([blob], fileName, { type: 'text/plain' })
    const result = await uploadFile(file, 'documents')
    if (result.success && result.data) {
      filesystem.createFile(path, result.data.url || getFileUrl(result.data.key))
      return true
    }
    return false
  } catch (error) {
    console.error('[FileService] Failed to save text file:', error)
    return false
  }
}

export function getFileUrl(key: string): string {
  return `${API_BASE}/files/${encodeURIComponent(key)}`
}

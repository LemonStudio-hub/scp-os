import { config } from '../config'
import { filesystem } from '../utils/filesystem'
import { useAuthStore } from '../stores/authStore'

const API_BASE = config.api.workerUrl

export interface R2File {
  key: string
  name: string
  size: number
  type: string
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
    url: string
  }
  error?: string
}

/**
 * 上传文件到 R2
 */
export async function uploadFile(file: File, folder = 'uploads'): Promise<UploadResponse> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: '游客不能使用云同步' }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await authStore.authFetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

/**
 * 获取文件列表
 */
export async function listFiles(prefix = '', limit = 100): Promise<FileListResponse> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, data: [], error: '游客不能使用云同步' }
  const url = new URL(`${API_BASE}/files`)
  if (prefix) url.searchParams.set('prefix', prefix)
  if (limit) url.searchParams.set('limit', String(limit))

  const response = await authStore.authFetch(url.toString())
  return response.json()
}

/**
 * 删除文件
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: '游客不能使用云同步' }
  const response = await authStore.authFetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  return response.json()
}

/**
 * 更新文件内容（文本文件）
 */
export async function updateFileContent(
  key: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const authStore = useAuthStore()
  if (!authStore.canUseCloudSync) return { success: false, error: '游客不能使用云同步' }
  const response = await authStore.authFetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content,
  })
  return response.json()
}

/**
 * 读取文件内容（自动处理 R2 URL）
 * 如果虚拟文件系统中存的是 R2 URL，会自动 fetch 实际内容
 */
export async function readFileContent(path: string): Promise<string | null> {
  const data = filesystem.readFile(path)
  if (data === null) return null
  if (typeof data !== 'string') return null

  // 如果内容是 R2 URL，fetch 获取实际内容
  if (data.startsWith('http')) {
    try {
      const response = await fetch(data, { cache: 'no-cache' })
      if (response.ok) {
        return await response.text()
      }
      return null
    } catch {
      return null
    }
  }

  return data
}

/**
 * 保存文本文件到 R2
 * 更新虚拟文件系统中的 URL
 */
export async function saveTextFile(path: string, content: string): Promise<boolean> {
  try {
    // 检查是否已有 R2 key
    const existing = filesystem.readFile(path)
    let key: string | null = null

    if (typeof existing === 'string' && existing.startsWith(`${API_BASE}/files/`)) {
      // 提取 key
      key = decodeURIComponent(existing.replace(`${API_BASE}/files/`, ''))
    }

    if (key) {
      // 更新已有文件
      const result = await updateFileContent(key, content)
      return result.success
    } else {
      // 创建新文件：先上传到 R2
      const fileName = path.split('/').pop() || 'untitled.txt'
      const blob = new Blob([content], { type: 'text/plain' })
      const file = new File([blob], fileName, { type: 'text/plain' })
      const result = await uploadFile(file, 'documents')
      if (result.success && result.data) {
        filesystem.createFile(path, result.data.url)
        return true
      }
      return false
    }
  } catch (error) {
    console.error('[FileService] Failed to save text file:', error)
    return false
  }
}

/**
 * 获取文件下载/预览 URL
 */
export function getFileUrl(key: string): string {
  return `${API_BASE}/files/${encodeURIComponent(key)}`
}

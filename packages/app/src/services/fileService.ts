import { config } from '../config'
import { filesystem } from '../utils/filesystem'

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
 * Upload a file to R2 via the worker API.
 */
export async function uploadFile(file: File, folder = 'uploads'): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

/**
 * List files stored in R2, optionally filtered by prefix.
 */
export async function listFiles(prefix = '', limit = 100): Promise<FileListResponse> {
  const url = new URL(`${API_BASE}/files`)
  if (prefix) url.searchParams.set('prefix', prefix)
  if (limit) url.searchParams.set('limit', String(limit))

  const response = await fetch(url.toString())
  return response.json()
}

/**
 * Delete a file from R2 by its key.
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  return response.json()
}

/**
 * Update the content of a text file already stored in R2.
 */
export async function updateFileContent(
  key: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content,
  })
  return response.json()
}

/**
 * Read file content, transparently resolving R2 URLs.
 * The virtual filesystem stores either inline content or an R2 URL;
 * this function fetches the actual content when a URL is stored.
 */
export async function readFileContent(path: string): Promise<string | null> {
  const data = filesystem.readFile(path)
  if (data === null) return null
  if (typeof data !== 'string') return null

  // If the stored value is an R2 URL, fetch the actual content from it
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
 * Save a text file to R2 and update the virtual filesystem with the resulting URL.
 */
export async function saveTextFile(path: string, content: string): Promise<boolean> {
  try {
    // Check if this path already has an R2 object so we can update instead of re-upload
    const existing = filesystem.readFile(path)
    let key: string | null = null

    if (typeof existing === 'string' && existing.startsWith(`${API_BASE}/files/`)) {
      // Extract the R2 object key from the stored URL
      key = decodeURIComponent(existing.replace(`${API_BASE}/files/`, ''))
    }

    if (key) {
      // Update the existing R2 object in-place
      const result = await updateFileContent(key, content)
      return result.success
    } else {
      // New file: upload to R2 first, then register the URL in the virtual filesystem
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
 * Build the direct download/preview URL for an R2 object key.
 */
export function getFileUrl(key: string): string {
  return `${API_BASE}/files/${encodeURIComponent(key)}`
}

import type { Env, RequestContext } from '../shared/types'
import { validationError, unauthorizedError } from '../shared/errors'

const MAX_STORAGE_PER_USER = 500 * 1024 * 1024 // 500MB

export interface FileApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  count?: number
  truncated?: boolean
  cursor?: string
}

function createResponse(data: FileApiResponse, status: number, corsHeaders: Headers): Response {
  const headers = new Headers(corsHeaders)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { status, headers })
}

/**
 * 获取用户已用存储空间
 */
async function getUserStorage(db: D1Database, userId: string): Promise<{ used: number; max: number; count: number }> {
  try {
    const result = await db.prepare(
      'SELECT used_bytes, max_bytes, file_count FROM user_storage WHERE user_id = ?'
    ).bind(userId).first<{ used_bytes: number; max_bytes: number; file_count: number }>()

    if (result) {
      return { used: result.used_bytes, max: result.max_bytes, count: result.file_count }
    }
  } catch {
    // ignore
  }
  return { used: 0, max: MAX_STORAGE_PER_USER, count: 0 }
}

/**
 * 更新用户存储空间
 */
async function updateUserStorage(db: D1Database, userId: string, deltaBytes: number, deltaCount: number): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO user_storage (user_id, used_bytes, file_count) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
       used_bytes = MAX(0, used_bytes + ?),
       file_count = MAX(0, file_count + ?),
       updated_at = CURRENT_TIMESTAMP`
    ).bind(userId, Math.max(0, deltaBytes), Math.max(0, deltaCount), deltaBytes, deltaCount).run()
  } catch (error) {
    console.error('[Files] Failed to update user storage:', error)
  }
}

/**
 * 重新计算用户存储（用于配额同步）
 */
async function recalcUserStorage(env: Env, userId: string): Promise<void> {
  try {
    const prefix = `users/${userId}/`
    const listed = await env.SCP_FILES.list({ prefix })
    const totalSize = listed.objects.reduce((sum, obj) => sum + obj.size, 0)
    const count = listed.objects.length

    await env.SCP_DB.prepare(
      `INSERT INTO user_storage (user_id, used_bytes, file_count) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
       used_bytes = ?,
       file_count = ?,
       updated_at = CURRENT_TIMESTAMP`
    ).bind(userId, totalSize, count, totalSize, count).run()
  } catch (error) {
    console.error('[Files] Failed to recalc user storage:', error)
  }
}

/**
 * 上传文件到 R2
 */
export async function uploadFile(
  request: Request,
  env: Env,
  userId: string,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file || !(file instanceof File)) {
      return createResponse({ success: false, error: 'No file provided' }, 400, corsHeaders)
    }

    // 限制 50MB 单文件
    if (file.size > 50 * 1024 * 1024) {
      return createResponse({ success: false, error: 'File too large (max 50MB)' }, 413, corsHeaders)
    }

    // 检查配额
    const storage = await getUserStorage(env.SCP_DB, userId)
    if (storage.used + file.size > storage.max) {
      return createResponse(
        { success: false, error: `Storage quota exceeded. Used: ${formatBytes(storage.used)} / ${formatBytes(storage.max)}` },
        413,
        corsHeaders,
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const key = `users/${userId}/${folder}/${timestamp}-${safeName}`

    await env.SCP_FILES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        size: String(file.size),
      },
    })

    // 更新配额
    await updateUserStorage(env.SCP_DB, userId, file.size, 1)

    return createResponse(
      {
        success: true,
        data: {
          key,
          name: file.name,
          size: file.size,
          type: file.type,
          url: `/files/${encodeURIComponent(key)}`,
        },
      },
      201,
      corsHeaders,
    )
  } catch (error) {
    console.error('[Files] Upload error:', error)
    return createResponse({ success: false, error: 'Upload failed' }, 500, corsHeaders)
  }
}

/**
 * 获取文件（下载或预览）
 */
export async function getFile(
  request: Request,
  env: Env,
  key: string,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const object = await env.SCP_FILES.get(key)

    if (!object) {
      return createResponse({ success: false, error: 'File not found' }, 404, corsHeaders)
    }

    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
    headers.set('Content-Length', String(object.size))

    const disposition = request.headers.get('Accept')?.includes('text/html')
      ? 'inline'
      : 'attachment'
    const originalName = object.customMetadata?.originalName || key.split('/').pop() || 'file'
    headers.set('Content-Disposition', `${disposition}; filename="${originalName}"`)

    // Cache for 1 hour
    headers.set('Cache-Control', 'public, max-age=3600')

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('[Files] Get error:', error)
    return createResponse({ success: false, error: 'Failed to get file' }, 500, corsHeaders)
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  env: Env,
  key: string,
  userId: string,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const object = await env.SCP_FILES.get(key)
    if (!object) {
      return createResponse({ success: false, error: 'File not found' }, 404, corsHeaders)
    }

    // 只能删除自己的文件
    if (object.customMetadata?.uploadedBy !== userId) {
      return createResponse({ success: false, error: 'Permission denied' }, 403, corsHeaders)
    }

    const fileSize = object.size

    await env.SCP_FILES.delete(key)

    // 释放配额
    await updateUserStorage(env.SCP_DB, userId, -fileSize, -1)

    return createResponse({ success: true, data: { key } }, 200, corsHeaders)
  } catch (error) {
    console.error('[Files] Delete error:', error)
    return createResponse({ success: false, error: 'Delete failed' }, 500, corsHeaders)
  }
}

/**
 * 列出用户的文件
 */
export async function listFiles(
  env: Env,
  userId: string,
  prefix: string,
  limit: number,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const fullPrefix = prefix ? `users/${userId}/${prefix}` : `users/${userId}/`
    const listed = await env.SCP_FILES.list({ prefix: fullPrefix, limit })

    const files = listed.objects.map((obj) => ({
      key: obj.key,
      name: obj.customMetadata?.originalName || obj.key.split('/').pop() || obj.key,
      size: obj.size,
      type: obj.httpMetadata?.contentType || 'application/octet-stream',
      uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded.toISOString(),
      url: `/files/${encodeURIComponent(obj.key)}`,
    }))

    return createResponse(
      {
        success: true,
        data: files,
        count: files.length,
        truncated: listed.truncated,
        cursor: listed.truncated ? listed.cursor : undefined,
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    console.error('[Files] List error:', error)
    return createResponse({ success: false, error: 'List failed' }, 500, corsHeaders)
  }
}

/**
 * 获取用户存储配额信息
 */
export async function getStorageQuota(
  env: Env,
  userId: string,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const storage = await getUserStorage(env.SCP_DB, userId)
    return createResponse(
      {
        success: true,
        data: {
          used: storage.used,
          max: storage.max,
          remaining: Math.max(0, storage.max - storage.used),
          usedFormatted: formatBytes(storage.used),
          maxFormatted: formatBytes(storage.max),
          remainingFormatted: formatBytes(Math.max(0, storage.max - storage.used)),
          fileCount: storage.count,
        },
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    console.error('[Files] Quota error:', error)
    return createResponse({ success: false, error: 'Failed to get quota' }, 500, corsHeaders)
  }
}

/**
 * 更新文件内容（文本文件编辑）
 */
export async function updateFile(
  request: Request,
  env: Env,
  key: string,
  userId: string,
  corsHeaders: Headers,
): Promise<Response> {
  try {
    const existing = await env.SCP_FILES.get(key)
    if (!existing) {
      return createResponse({ success: false, error: 'File not found' }, 404, corsHeaders)
    }

    if (existing.customMetadata?.uploadedBy !== userId) {
      return createResponse({ success: false, error: 'Permission denied' }, 403, corsHeaders)
    }

    const content = await request.text()
    const originalName = existing.customMetadata?.originalName || key.split('/').pop() || 'file'
    const oldSize = existing.size
    const newSize = new TextEncoder().encode(content).length

    // 检查配额（只检查增加的部分）
    if (newSize > oldSize) {
      const storage = await getUserStorage(env.SCP_DB, userId)
      if (storage.used + (newSize - oldSize) > storage.max) {
        return createResponse(
          { success: false, error: `Storage quota exceeded` },
          413,
          corsHeaders,
        )
      }
    }

    await env.SCP_FILES.put(key, content, {
      httpMetadata: {
        contentType: existing.httpMetadata?.contentType || 'text/plain',
      },
      customMetadata: {
        ...existing.customMetadata,
        updatedAt: new Date().toISOString(),
      },
    })

    // 更新配额（差值）
    await updateUserStorage(env.SCP_DB, userId, newSize - oldSize, 0)

    return createResponse(
      {
        success: true,
        data: { key, size: newSize },
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    console.error('[Files] Update error:', error)
    return createResponse({ success: false, error: 'Update failed' }, 500, corsHeaders)
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

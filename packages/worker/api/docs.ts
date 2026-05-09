import type { Env, DocsItem, DocsContentResponse, DocsTale, DocsHub, DocTag } from '../shared/types'
import { logger } from '../utils/logger'
import { getFetchHeaders } from '../utils/browserHeaders'

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  let lastError: Error | null = null
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getFetchHeaders('https://github.com/scp-data/scp-api'),
          ...options.headers
        }
      })
      
      if (response.ok || i === retries) return response
      
      if (response.status === 404) return response
      if (response.status === 403) return response

      logger.warn(`Retry ${i + 1}/${retries} for ${url} due to status ${response.status}`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    } catch (error) {
      lastError = error as Error
      logger.warn(`Retry ${i + 1}/${retries} for ${url} due to error: ${lastError.message}`)
      if (i === retries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  throw lastError || new Error('Fetch failed after retries')
}

interface DocsListResponse {
  success: boolean
  data?: DocsItem[]
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  error?: string
}

interface DocsTalesListResponse {
  success: boolean
  data?: DocsTale[]
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  error?: string
}

interface DocsHubsListResponse {
  success: boolean
  data?: DocsHub[]
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  error?: string
}

interface DocTagsListResponse {
  success: boolean
  data?: DocTag[]
  error?: string
}

function parseListParams(url: URL) {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0)
  return { limit, offset }
}

export async function handleDocsItems(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const { limit, offset } = parseListParams(url)
  const scpClass = url.searchParams.get('scp_class')
  const clearanceLevel = url.searchParams.get('clearance_level')
  const tag = url.searchParams.get('tag')
  const series = url.searchParams.get('series')
  const q = url.searchParams.get('q')

  try {
    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    let query = 'SELECT * FROM scp_items WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM scp_items WHERE 1=1'
    const params: (string | number)[] = []
    const countParams: (string | number)[] = []

    if (scpClass) {
      query += ' AND object_class = ?'
      countQuery += ' AND object_class = ?'
      params.push(scpClass)
      countParams.push(scpClass)
    }

    if (clearanceLevel) {
      query += ' AND clearance_level = ?'
      countQuery += ' AND clearance_level = ?'
      params.push(parseInt(clearanceLevel, 10))
      countParams.push(parseInt(clearanceLevel, 10))
    }

    if (tag) {
      query += ' AND tags LIKE ?'
      countQuery += ' AND tags LIKE ?'
      params.push(`%${tag}%`)
      countParams.push(`%${tag}%`)
    }

    if (series) {
      query += ' AND series = ?'
      countQuery += ' AND series = ?'
      params.push(series)
      countParams.push(series)
    }

    if (q) {
      query += ' AND (title LIKE ? OR scp_number LIKE ?)'
      countQuery += ' AND (title LIKE ? OR scp_number LIKE ?)'
      const likeQ = `%${q}%`
      params.push(likeQ, likeQ)
      countParams.push(likeQ, likeQ)
    }

    query += ' ORDER BY CAST(scp_number AS INTEGER) ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all<DocsItem>(),
      db.prepare(countQuery).bind(...countParams).first<{ total: number }>()
    ])

    const total = countResult?.total || 0

    const response: DocsListResponse = {
      success: true,
      data: itemsResult.results || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      }
    }

    return Response.json(response)
  } catch (error) {
    logger.error('Failed to fetch docs items:', error as Error)
    return Response.json({
      success: false,
      error: `Failed to fetch docs: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocsItem(
  request: Request,
  env: Env,
  scpNumber: string
): Promise<Response> {
  try {
    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    const item = await db.prepare(
      'SELECT * FROM scp_items WHERE scp_number = ? OR CAST(scp_number AS INTEGER) = ?'
    ).bind(scpNumber, parseInt(scpNumber, 10)).first<DocsItem>()

    if (!item) {
      return Response.json({
        success: false,
        error: 'SCP item not found',
      }, { status: 404 })
    }

    return Response.json({ success: true, data: item })
  } catch (error) {
    logger.error(`Failed to fetch doc item ${scpNumber}:`, error as Error)
    return Response.json({
      success: false,
      error: `Failed to fetch item: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocsContent(
  request: Request,
  env: Env,
  scpNumber: string
): Promise<Response> {
  const kvKey = `docs-content:${scpNumber}`

  try {
    const cached = await env.SCP_CACHE.get(kvKey, 'text')
    if (cached) {
      const response: DocsContentResponse = {
        scp_number: scpNumber,
        content: cached,
        cached: true,
        source: 'kv',
      }
      return Response.json({ success: true, data: response })
    }

    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    const item = await db.prepare(
      'SELECT content_file FROM scp_items WHERE scp_number = ?'
    ).bind(scpNumber).first<{ content_file: string | null }>()

    if (!item || !item.content_file) {
      return Response.json({
        success: false,
        error: 'Content not available',
      }, { status: 404 })
    }

    const rawUrl = `https://raw.githubusercontent.com/scp-data/scp-api/main/docs/data/scp/items/${item.content_file}`
    const rawResponse = await fetchWithRetry(rawUrl)

    if (rawResponse.status === 404) {
      return Response.json({
        success: false,
        error: 'Source content file not found on GitHub',
      }, { status: 404 })
    }

    if (!rawResponse.ok) {
      logger.error(`GitHub fetch failed for ${scpNumber}: ${rawResponse.status} ${rawResponse.statusText}`)
      return Response.json({
        success: false,
        error: 'Failed to fetch content from upstream service',
        details: `Upstream returned status ${rawResponse.status}`
      }, { status: 503 })
    }

    let rawData: Record<string, any>
    try {
      rawData = await rawResponse.json()
    } catch (parseError) {
      logger.error(`Failed to parse JSON for ${scpNumber}:`, parseError as Error)
      return Response.json({
        success: false,
        error: 'Invalid response from upstream service',
      }, { status: 502 })
    }

    const paddedNumber = scpNumber.padStart(3, '0')
    const possibleKeys = [`SCP-${scpNumber}`, `SCP-${paddedNumber}`, scpNumber]
    let entry: any = null
    for (const key of possibleKeys) {
      if (rawData[key]) {
        entry = rawData[key]
        break
      }
    }

    if (!entry || !entry.raw_content) {
      return Response.json({
        success: false,
        error: 'Content not found in source file',
      }, { status: 404 })
    }

    const rawContent: string = entry.raw_content

    await env.SCP_CACHE.put(kvKey, rawContent)

    const response: DocsContentResponse = {
      scp_number: scpNumber,
      content: rawContent,
      cached: false,
      source: 'github-raw',
    }
    return Response.json({ success: true, data: response })
  } catch (error) {
    logger.error(`Exception in handleDocsContent for ${scpNumber}:`, error as Error)
    return Response.json({
      success: false,
      error: `Failed to get content: ${(error as Error).message}`,
    }, { status: 503 })
  }
}

export async function handleDocsTales(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const { limit, offset } = parseListParams(url)
  const tag = url.searchParams.get('tag')

  try {
    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    let query = 'SELECT * FROM tales WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM tales WHERE 1=1'
    const params: (string | number)[] = []
    const countParams: (string | number)[] = []

    if (tag) {
      query += ' AND tags LIKE ?'
      countQuery += ' AND tags LIKE ?'
      params.push(`%${tag}%`)
      countParams.push(`%${tag}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all<DocsTale>(),
      db.prepare(countQuery).bind(...countParams).first<{ total: number }>()
    ])

    const total = countResult?.total || 0

    const response: DocsTalesListResponse = {
      success: true,
      data: itemsResult.results || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      }
    }

    return Response.json(response)
  } catch (error) {
    logger.error('Failed to fetch tales:', error as Error)
    return Response.json({
      success: false,
      error: `Failed to fetch tales: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocsHubs(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const { limit, offset } = parseListParams(url)

  try {
    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM hubs'
    ).first<{ total: number }>()
    const total = countResult?.total || 0

    const itemsResult = await db.prepare(
      'SELECT * FROM hubs ORDER BY title ASC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all<DocsHub>()

    const response: DocsHubsListResponse = {
      success: true,
      data: itemsResult.results || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      }
    }

    return Response.json(response)
  } catch (error) {
    logger.error('Failed to fetch hubs:', error as Error)
    return Response.json({
      success: false,
      error: `Failed to fetch hubs: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocTags(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const db = env.SCP_READER_DB
    if (!db) {
      return Response.json({
        success: false,
        error: 'Database binding SCP_READER_DB not found',
      }, { status: 500 })
    }

    const result = await db.prepare(
      'SELECT id, name, category, color FROM doc_tags ORDER BY category, name'
    ).all<DocTag>()

    const response: DocTagsListResponse = {
      success: true,
      data: result.results || [],
    }

    return Response.json(response)
  } catch (error) {
    logger.error('Failed to fetch doc tags:', error as Error)
    return Response.json({
      success: false,
      error: `Failed to fetch tags: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

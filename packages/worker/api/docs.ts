import type { Env, SCPItem, SCPTale, SCPGOI, SCPHub, DocsContentResponse } from '../shared/types'

export async function handleDocsItems(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const series = url.searchParams.get('series')
  const objectClass = url.searchParams.get('class')
  const search = url.searchParams.get('search')
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

  try {
    let whereParts: string[] = []
    let params: any[] = []

    if (series) {
      whereParts.push('series = ?')
      params.push(series)
    }

    if (objectClass) {
      whereParts.push('object_class = ?')
      params.push(objectClass)
    }

    if (search) {
      whereParts.push('(scp_search MATCH ?)')
      params.push(search)
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    const countQuery = search
      ? `SELECT COUNT(*) as total FROM scp_items INNER JOIN scp_search ON scp_search.rowid = scp_items.id ${whereClause}`
      : `SELECT COUNT(*) as total FROM scp_items ${whereClause}`
    const countResult = await env.SCP_READER_DB.prepare(countQuery).bind(...params).first<{ total: number }>()
    const total = countResult?.total || 0

    const dataQuery = search
      ? `SELECT scp_items.* FROM scp_items INNER JOIN scp_search ON scp_search.rowid = scp_items.id ${whereClause} ORDER BY scp_items.scp_number ASC LIMIT ? OFFSET ?`
      : `SELECT * FROM scp_items ${whereClause} ORDER BY scp_number ASC LIMIT ? OFFSET ?`
    const result = await env.SCP_READER_DB.prepare(dataQuery).bind(...params, limit, offset).all<SCPItem>()

    return Response.json({
      success: true,
      data: result.results || [],
      total,
      limit,
      offset,
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: `Database error: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocsItem(
  request: Request,
  env: Env,
  scpNumber: string
): Promise<Response> {
  try {
    const item = await env.SCP_READER_DB.prepare(
      'SELECT * FROM scp_items WHERE scp_number = ?'
    ).bind(scpNumber).first<SCPItem>()

    if (!item) {
      return Response.json({
        success: false,
        error: 'Item not found',
      }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: item,
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: `Database error: ${(error as Error).message}`,
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

    const item = await env.SCP_READER_DB.prepare(
      'SELECT content_file FROM scp_items WHERE scp_number = ?'
    ).bind(scpNumber).first<{ content_file: string | null }>()

    if (!item || !item.content_file) {
      return Response.json({
        success: false,
        error: 'Content not available',
      }, { status: 404 })
    }

    const rawUrl = `https://raw.githubusercontent.com/scp-data/scp-api/main/docs/data/scp/items/${item.content_file}`
    const rawResponse = await fetch(rawUrl)

    if (!rawResponse.ok) {
      return Response.json({
        success: false,
        error: 'Failed to fetch content from GitHub',
      }, { status: 503 })
    }

    const rawData: Record<string, any> = await rawResponse.json()
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
  const year = url.searchParams.get('year')
  const search = url.searchParams.get('search')
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

  try {
    let whereParts: string[] = []
    let params: any[] = []

    if (year) {
      whereParts.push('year = ?')
      params.push(parseInt(year, 10))
    }

    if (search) {
      whereParts.push('(title LIKE ? OR tags LIKE ?)')
      const likeSearch = `%${search}%`
      params.push(likeSearch, likeSearch)
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    const countResult = await env.SCP_READER_DB.prepare(
      `SELECT COUNT(*) as total FROM scp_tales ${whereClause}`
    ).bind(...params).first<{ total: number }>()
    const total = countResult?.total || 0

    const result = await env.SCP_READER_DB.prepare(
      `SELECT * FROM scp_tales ${whereClause} ORDER BY rating DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<SCPTale>()

    return Response.json({
      success: true,
      data: result.results || [],
      total,
      limit,
      offset,
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: `Database error: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

export async function handleDocsHubs(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const result = await env.SCP_READER_DB.prepare(
      'SELECT * FROM scp_hubs ORDER BY title ASC'
    ).all<SCPHub>()

    return Response.json({
      success: true,
      data: result.results || [],
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: `Database error: ${(error as Error).message}`,
    }, { status: 500 })
  }
}

import { config } from '../../../../config'

const API_BASE = config.api.workerUrl

async function adminFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

export async function adminLogin(username: string, password: string) {
  const response = await adminFetch('/api/admin/login', '', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
  })
  return response.json()
}

export async function verifyAdminToken(token: string) {
  const response = await adminFetch('/api/admin/verify', token)
  return response.json()
}

export async function getAdminUsers(
  token: string,
  params: {
    limit?: number
    offset?: number
    search?: string
    sort?: string
    order?: string
    is_banned?: number
  } = {}
) {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  if (params.search) query.set('search', params.search)
  if (params.sort) query.set('sort', params.sort)
  if (params.order) query.set('order', params.order)
  if (params.is_banned !== undefined) query.set('is_banned', String(params.is_banned))
  const qs = query.toString()
  const response = await adminFetch(`/api/admin/users${qs ? `?${qs}` : ''}`, token)
  return response.json()
}

export async function getAdminUserById(token: string, id: number) {
  const response = await adminFetch(`/api/admin/users/${id}`, token)
  return response.json()
}

export async function banUser(token: string, id: number, reason?: string) {
  const response = await adminFetch(`/api/admin/users/${id}/ban`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return response.json()
}

export async function unbanUser(token: string, id: number) {
  const response = await adminFetch(`/api/admin/users/${id}/unban`, token, {
    method: 'POST',
  })
  return response.json()
}

export async function deleteAdminUser(token: string, id: number) {
  const response = await adminFetch(`/api/admin/users/${id}`, token, {
    method: 'DELETE',
  })
  return response.json()
}

export async function batchUserOperation(token: string, action: string, ids: number[]) {
  const response = await adminFetch('/api/admin/users/batch', token, {
    method: 'POST',
    body: JSON.stringify({ action, ids }),
  })
  return response.json()
}

export async function exportUsers(token: string, format: 'csv' | 'json') {
  const response = await adminFetch(`/api/admin/users/export?format=${format}`, token)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export async function getAdminContent(
  token: string,
  type: string,
  params: { limit?: number; offset?: number; search?: string } = {}
) {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  const response = await adminFetch(`/api/admin/content/${type}${qs ? `?${qs}` : ''}`, token)
  return response.json()
}

export async function updateAdminContent(
  token: string,
  type: string,
  id: number,
  data: Record<string, unknown>
) {
  const response = await adminFetch(`/api/admin/content/${type}/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteAdminContent(token: string, type: string, id: number) {
  const response = await adminFetch(`/api/admin/content/${type}/${id}`, token, {
    method: 'DELETE',
  })
  return response.json()
}

export async function batchContentOperation(
  token: string,
  type: string,
  action: string,
  ids: number[],
  extra: Record<string, string> = {}
) {
  const response = await adminFetch(`/api/admin/content/${type}/batch`, token, {
    method: 'POST',
    body: JSON.stringify({ action, ids, ...extra }),
  })
  return response.json()
}

export async function exportContent(token: string, type: string, format: 'csv' | 'json') {
  const response = await adminFetch(`/api/admin/content/${type}/export?format=${format}`, token)
  return response.json()
}

export async function importContent(token: string, type: string, data: unknown[]) {
  const response = await adminFetch(`/api/admin/content/${type}/import`, token, {
    method: 'POST',
    body: JSON.stringify({ data }),
  })
  return response.json()
}

export async function getAdminChatMessages(
  token: string,
  params: {
    limit?: number
    offset?: number
    room_id?: number
    start_date?: string
    end_date?: string
  } = {}
) {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  if (params.room_id !== undefined) query.set('room_id', String(params.room_id))
  if (params.start_date) query.set('start_date', params.start_date)
  if (params.end_date) query.set('end_date', params.end_date)
  const qs = query.toString()
  const response = await adminFetch(`/api/admin/chat/messages${qs ? `?${qs}` : ''}`, token)
  return response.json()
}

export async function deleteAdminChatMessage(token: string, id: number) {
  const response = await adminFetch(`/api/admin/chat/messages/${id}`, token, {
    method: 'DELETE',
  })
  return response.json()
}

export async function getAdminChatRooms(token: string) {
  const response = await adminFetch('/api/admin/chat/rooms', token)
  return response.json()
}

export async function updateAdminChatRoom(
  token: string,
  id: number,
  data: { name?: string; description?: string; is_public?: number }
) {
  const response = await adminFetch(`/api/admin/chat/rooms/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteAdminChatRoom(token: string, id: number) {
  const response = await adminFetch(`/api/admin/chat/rooms/${id}`, token, {
    method: 'DELETE',
  })
  return response.json()
}

export async function getAdminFeedback(
  token: string,
  params: { limit?: number; offset?: number; status?: string; category?: string } = {}
) {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  if (params.status) query.set('status', params.status)
  if (params.category) query.set('category', params.category)
  const qs = query.toString()
  const response = await adminFetch(`/api/admin/feedback${qs ? `?${qs}` : ''}`, token)
  return response.json()
}

export async function updateFeedbackStatus(token: string, id: number, status: string) {
  const response = await adminFetch(`/api/admin/feedback/${id}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
  return response.json()
}

export async function deleteAdminFeedback(token: string, id: number) {
  const response = await adminFetch(`/api/admin/feedback/${id}`, token, {
    method: 'DELETE',
  })
  return response.json()
}

export async function getSystemSettings(token: string) {
  const response = await adminFetch('/api/admin/settings', token)
  return response.json()
}

export async function updateSystemSettings(token: string, settings: Record<string, string>) {
  const response = await adminFetch('/api/admin/settings', token, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  return response.json()
}

export async function getDashboardStats(token: string) {
  const response = await adminFetch('/api/admin/stats', token)
  return response.json()
}

export async function getTrendData(token: string, days?: number) {
  const query = days ? `?days=${days}` : ''
  const response = await adminFetch(`/api/admin/stats/trend${query}`, token)
  return response.json()
}

export async function getAdminLogs(
  token: string,
  params: {
    limit?: number
    offset?: number
    admin_id?: number
    action?: string
    start_date?: string
    end_date?: string
  } = {}
) {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  if (params.admin_id !== undefined) query.set('admin_id', String(params.admin_id))
  if (params.action) query.set('action', params.action)
  if (params.start_date) query.set('start_date', params.start_date)
  if (params.end_date) query.set('end_date', params.end_date)
  const qs = query.toString()
  const response = await adminFetch(`/api/admin/logs${qs ? `?${qs}` : ''}`, token)
  return response.json()
}

import { Hono } from 'hono'
import type { Env } from '../types'
import { all, first, logAdmin, run } from '../db'
import { cleanText, intValue, json, readJson, requestInfo } from '../http'
import { hasRole, signJwt, verifyPassword } from '../security'
import { adminSecret, requiredAdmin, adminMiddleware, adminList, itemById, adminExport, updateById, deleteById, batchUsers, batchContent, importContent, setUserBan, contentTable, dashboardStats, trendData, routeGet, routePost, routePut, routeDelete } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerAdmin(app: Hono<AppEnv>): void {
  routePost(app, ['/admin/auth/login', '/api/admin/login'], async (c) => {
    const body = await readJson<{ username?: string; password?: string }>(c.req.raw)
    if (!body?.username || !body.password) return json({ success: false, error: 'Please provide username and password' }, 400)
    const admin = await first<{ id: number; username: string; password_hash: string; role: 'super_admin' | 'admin' | 'moderator'; is_active: number }>(c.env.SCP_DB, 'SELECT * FROM admin_users WHERE username = ? AND is_active = 1', [body.username.trim()])
    if (!admin || !(await verifyPassword(body.password, admin.password_hash))) return json({ success: false, error: 'Username or password is incorrect' }, 401)
    await run(c.env.SCP_DB, 'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [admin.id])
    await logAdmin(c.env.SCP_DB, admin.id, admin.username, 'login', '', '', '', requestInfo(c.req.raw).ip)
    const token = await signJwt({ adminId: admin.id, username: admin.username, role: admin.role }, adminSecret(c.env), 8 * 60 * 60)
    return json({ success: true, token, admin: { id: admin.id, username: admin.username, role: admin.role } })
  })

  routeGet(app, ['/admin/auth/verify', '/api/admin/verify'], async (c) => {
    const admin = await requiredAdmin(c)
    if (admin instanceof Response) return admin
    return json({ success: true, admin })
  })

  app.use('/admin/*', adminMiddleware)
  app.use('/api/admin/*', adminMiddleware)

  routeGet(app, ['/admin/users', '/api/admin/users'], async (c) => adminList(c, 'users', ['id', 'user_id', 'nickname', 'created_at', 'last_active_at', 'is_banned', 'ban_reason', 'banned_at'], 'created_at DESC'))
  routeGet(app, ['/admin/users/export', '/api/admin/users/export'], async (c) => adminExport(c, 'users'))
  routeGet(app, ['/admin/users/:id', '/api/admin/users/:id'], async (c) => itemById(c, 'users'))
  routePost(app, ['/admin/users/batch', '/api/admin/users/batch'], async (c) => batchUsers(c))
  routePost(app, ['/admin/users/:id/ban', '/api/admin/users/:id/ban'], async (c) => setUserBan(c, true))
  routePost(app, ['/admin/users/:id/unban', '/api/admin/users/:id/unban'], async (c) => setUserBan(c, false))
  routeDelete(app, ['/admin/users/:id', '/api/admin/users/:id'], async (c) => deleteById(c, 'users'))

  routeGet(app, ['/admin/content/:type/export', '/api/admin/content/:type/export'], async (c) => adminExport(c, contentTable(c.req.param('type') || '')))
  routeGet(app, ['/admin/content/:type', '/api/admin/content/:type'], async (c) => adminList(c, contentTable(c.req.param('type') || ''), undefined, 'id DESC'))
  routePut(app, ['/admin/content/:type/:id', '/api/admin/content/:type/:id'], async (c) => updateById(c, contentTable(c.req.param('type') || '')))
  routeDelete(app, ['/admin/content/:type/:id', '/api/admin/content/:type/:id'], async (c) => deleteById(c, contentTable(c.req.param('type') || '')))
  routePost(app, ['/admin/content/:type/batch', '/api/admin/content/:type/batch'], async (c) => batchContent(c, contentTable(c.req.param('type') || '')))
  routePost(app, ['/admin/content/:type/import', '/api/admin/content/:type/import'], async (c) => importContent(c, contentTable(c.req.param('type') || '')))

  routeGet(app, ['/admin/chat/messages', '/api/admin/chat/messages'], async (c) => adminList(c, 'chat_messages', undefined, 'created_at DESC'))
  routeDelete(app, ['/admin/chat/messages/:id', '/api/admin/chat/messages/:id'], async (c) => deleteById(c, 'chat_messages'))
  routeGet(app, ['/admin/chat/rooms', '/api/admin/chat/rooms'], async (c) => adminList(c, 'chat_rooms', undefined, 'id ASC'))
  routePut(app, ['/admin/chat/rooms/:id', '/api/admin/chat/rooms/:id'], async (c) => updateById(c, 'chat_rooms'))
  routeDelete(app, ['/admin/chat/rooms/:id', '/api/admin/chat/rooms/:id'], async (c) => deleteById(c, 'chat_rooms'))

  routeGet(app, ['/admin/feedback', '/api/admin/feedback'], async (c) => adminList(c, 'feedbacks', undefined, 'created_at DESC'))
  routePut(app, ['/admin/feedback/:id/status', '/api/admin/feedback/:id/status'], async (c) => {
    const body = await readJson<{ status?: string }>(c.req.raw)
    await run(c.env.SCP_DB, 'UPDATE feedbacks SET status = ? WHERE id = ?', [body?.status || 'published', Number(c.req.param('id'))])
    return json({ success: true })
  })
  routeDelete(app, ['/admin/feedback/:id', '/api/admin/feedback/:id'], async (c) => deleteById(c, 'feedbacks'))

  routeGet(app, ['/admin/settings', '/api/admin/settings'], async (c) => json({ success: true, data: await all(c.env.SCP_DB, 'SELECT * FROM system_settings ORDER BY key ASC') }))
  routePut(app, ['/admin/settings', '/api/admin/settings'], async (c) => {
    const admin = await requiredAdmin(c)
    if (admin instanceof Response) return admin
    if (!hasRole(admin, ['super_admin'])) return json({ success: false, error: 'Permission denied' }, 403)
    const body = await readJson<Record<string, string>>(c.req.raw) || {}
    for (const [key, value] of Object.entries(body)) await run(c.env.SCP_DB, 'INSERT INTO system_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by', [key, String(value), admin.username])
    return json({ success: true })
  })
  routeGet(app, ['/admin/stats/dashboard', '/api/admin/stats'], async (c) => json({ success: true, data: await dashboardStats(c.env.SCP_DB) }))
  routeGet(app, ['/admin/stats/trends', '/api/admin/stats/trend'], async (c) => json({ success: true, data: await trendData(c.env.SCP_DB, intValue(c.req.query('days'), 30, 365)) }))
  routeGet(app, ['/admin/logs', '/api/admin/logs'], async (c) => adminList(c, 'admin_logs', undefined, 'created_at DESC'))
}

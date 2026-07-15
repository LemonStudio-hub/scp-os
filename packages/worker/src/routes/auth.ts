import { Hono } from 'hono'
import type { Env } from '../types'
import { json, readJson } from '../http'
import { signJwt } from '../security'

type AppEnv = { Bindings: Env }

export function registerAuth(app: Hono<AppEnv>): void {
  app.post('/api/auth/token', async (c) => {
    const body = await readJson<{ userId?: string }>(c.req.raw)
    const userId = body?.userId
    if (!userId || typeof userId !== 'string' || userId.length > 128) {
      return json({ code: 'VALIDATION_ERROR', message: 'Missing or invalid userId' }, 400)
    }
    const token = await signJwt({ userId }, c.(env.JWT_SECRET?.trim() || (() => { throw new Error('JWT_SECRET is not configured') })()), 7 * 24 * 60 * 60)
    return json({ success: true, token })
  })
}

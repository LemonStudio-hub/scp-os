import { Hono } from 'hono'
import type { Env } from '../types'
import { all, run } from '../db'
import { intValue, json, readJson } from '../http'
import { safeParse } from '../helpers'

type AppEnv = { Bindings: Env }

export function registerPerformance(app: Hono<AppEnv>): void {
  app.post('/performance', async (c) => {
    const body = await readJson(c.req.raw)
    if (!body) return json({ code: 'VALIDATION_ERROR', message: 'Invalid request body' }, 400)
    await run(c.env.SCP_DB, 'INSERT INTO performance_metrics (data, created_at) VALUES (?, ?)', [JSON.stringify(body), Date.now()])
    await run(c.env.SCP_DB, 'DELETE FROM performance_metrics WHERE created_at < ?', [Date.now() - 3600000])
    return json({ success: true, message: 'Performance metrics received', timestamp: Date.now() })
  })
  app.get('/performance', async (c) => {
    const rows = await all<{ data: string }>(c.env.SCP_DB, 'SELECT data FROM performance_metrics ORDER BY created_at DESC LIMIT ?', [intValue(c.req.query('limit'), 10, 100)])
    return json({ success: true, metrics: rows.map((row) => safeParse(row.data)), count: rows.length })
  })
}

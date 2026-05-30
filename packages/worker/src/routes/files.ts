import { Hono } from 'hono'
import type { Env } from '../types'
import { json } from '../http'

type AppEnv = { Bindings: Env }

export function registerFiles(app: Hono<AppEnv>): void {
  const gone = () => json({ code: 'GONE', message: 'Cloud file storage is disabled. Files are stored locally.' }, 410)
  app.post('/files/upload', gone)
  app.get('/files', gone)
  app.get('/files/quota', gone)
  app.get('/files/:key', gone)
  app.put('/files/:key', gone)
  app.delete('/files/:key', gone)
}

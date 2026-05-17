/**
 * Hono 应用类型定义
 */

import type { Env, RequestContext } from './shared/types'
import type { SCPScraper } from './services/scraper'
import type { AdminAuthResult } from './middleware/adminAuth'

export type HonoEnv = {
  Bindings: Env
  Variables: {
    scraper: SCPScraper
    userId?: string
    adminAuth?: AdminAuthResult
    requestContext: RequestContext
  }
}

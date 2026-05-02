import type { Env, RequestContext } from './shared/types'

export type RouteHandler = (
  request: Request,
  env: Env,
  context: RequestContext,
  params: Record<string, string>,
  url: URL
) => Promise<Response>

export class Router {
  routes: Map<string, RouteHandler> = new Map()

  get(path: string, handler: RouteHandler): void {
    this.routes.set(`GET:${path}`, handler)
  }

  post(path: string, handler: RouteHandler): void {
    this.routes.set(`POST:${path}`, handler)
  }

  resolve(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null {
    const exactKey = `${method}:${pathname}`
    const exactHandler = this.routes.get(exactKey)
    if (exactHandler) {
      return { handler: exactHandler, params: {} }
    }

    for (const [key, handler] of this.routes) {
      const colonIdx = key.indexOf(':')
      const routeMethod = key.slice(0, colonIdx)
      if (routeMethod !== method) continue

      const routePath = key.slice(colonIdx + 1)
      if (!routePath.includes(':')) continue

      const paramNames: string[] = []
      const regexStr = '^' + routePath.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      }) + '$'

      const regex = new RegExp(regexStr)
      const match = pathname.match(regex)

      if (match) {
        const params: Record<string, string> = {}
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })
        return { handler, params }
      }
    }

    return null
  }
}

export function createRouter(): Router {
  return new Router()
}

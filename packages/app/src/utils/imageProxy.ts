import DOMPurify from 'dompurify'
import { config } from '../config'

const PROXY_BASE = `${config.api.workerUrl}/image-proxy`

const ALLOWED_HOSTS = [
  'scp-wiki.wdfiles.com',
  'scp-wiki-cn.wdfiles.com',
  'wikidot.com',
  'scpfoundation.ru',
  'scp-wiki.wikidot.com',
  'scp-wiki-cn.wikidot.com',
]

export function proxyImageUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (
      !ALLOWED_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
      )
    ) {
      return url
    }
    return `${PROXY_BASE}?url=${encodeURIComponent(url)}`
  } catch {
    return url
  }
}

export function applyImageProxyHook(): void {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src')
      if (src) {
        node.setAttribute('src', proxyImageUrl(src))
      }
    }
  })
}

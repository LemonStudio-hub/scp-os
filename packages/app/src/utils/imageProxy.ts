import DOMPurify from 'dompurify'
import { config } from '../config'

const ALLOWED_IMAGE_HOSTS = [
  'scp-wiki.wdfiles.com',
  'scp-wiki-cn.wdfiles.com',
  'wikidot.com',
  'scpfoundation.ru',
  'scp-wiki.wikidot.com',
  'scp-wiki-cn.wikidot.com',
]

const WIKIDOT_ORIGINS: Record<string, string> = {
  'scp-wiki.wikidot.com': 'https://scp-wiki.wikidot.com',
  'scp-wiki-cn.wikidot.com': 'https://scp-wiki-cn.wikidot.com',
  'scp-wiki.wdfiles.com': 'https://scp-wiki.wdfiles.com',
  'scp-wiki-cn.wdfiles.com': 'https://scp-wiki-cn.wdfiles.com',
}

export function proxyImageUrl(src: string): string {
  if (!src) return src
  try {
    const isAbsolute = src.startsWith('http://') || src.startsWith('https://')
    if (!isAbsolute) {
      for (const origin of Object.values(WIKIDOT_ORIGINS)) {
        const resolved = new URL(src, origin)
        if (ALLOWED_IMAGE_HOSTS.some((host) => resolved.hostname.endsWith(host))) {
          return `${config.api.workerUrl}/image-proxy?url=${encodeURIComponent(resolved.href)}`
        }
      }
      return src
    }
    const url = new URL(src)
    if (ALLOWED_IMAGE_HOSTS.some((host) => url.hostname.endsWith(host))) {
      return `${config.api.workerUrl}/image-proxy?url=${encodeURIComponent(src)}`
    }
  } catch {
    // invalid URL, return as-is
  }
  return src
}

export function applyImageProxyHook(): void {
  DOMPurify.addHook(
    'uponSanitizeAttribute',
    (node: Element, data: { attrName: string; attrValue: string | null }) => {
      if (data.attrName === 'src' && data.attrValue && node.nodeName === 'IMG') {
        data.attrValue = proxyImageUrl(data.attrValue)
      }
    }
  )
}

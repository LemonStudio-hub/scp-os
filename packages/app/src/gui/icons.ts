/**
 * Flat SVG Icons — No emoji, pure vector, SCP Foundation theme
 * All icons are 24x24 viewBox, stroke-based, 1.5px stroke width.
 */

export interface IconProps {
  size?: number
  color?: string
  class?: string
}

const baseAttrs = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.5',
  'stroke-linecap': 'round' as const,
  'stroke-linejoin': 'round' as const,
}

// ── App Icons ─────────────────────────────────────────────────────────

export function iconTerminal(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`
}

export function iconFolder(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`
}

export function iconFile(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/></svg>`
}

export function iconEdit(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/></svg>`
}

// ── Action Icons ──────────────────────────────────────────────────────

export function iconTrash(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`
}

export function iconRefresh(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`
}

export function iconPlus(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
}

export function iconGrid(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
}

export function iconList(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`
}

export function iconSearch(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
}

export function iconSave(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
}

export function iconChevronRight(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><polyline points="9 18 15 12 9 6"/></svg>`
}

export function iconChevronLeft(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><polyline points="15 18 9 12 15 6"/></svg>`
}

export function iconX(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
}

export function iconMinus(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="5" y1="12" x2="19" y2="12"/></svg>`
}

export function iconMaximize(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><rect x="5" y="5" width="14" height="14" rx="2" ry="2"/></svg>`
}

export function iconMinimize(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><rect x="5" y="11" width="14" height="8" rx="2" ry="2"/><line x1="5" y1="7" x2="19" y2="7"/></svg>`
}

export function iconFolderOpen(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"/><path d="M3 19h18l-2-6H5l-2 6Z"/></svg>`
}

export function iconArrowUp(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`
}

export function iconArrowDown(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`
}

export function iconArrowLeft(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`
}

export function iconArrowRight(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
}

export function iconHome(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
}

export function iconSettings(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
}

export function iconEmptyFolder(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`
}

export function iconEmptyDoc(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
}

export function iconChat(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
}

export function iconDash(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`
}

export function iconFeedback(p: IconProps = {}) {
  return `<svg ${attrSize(p)} ${attrBase()}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg>`
}

// ── Helpers ───────────────────────────────────────────────────────────

function attrSize(p: IconProps): string {
  const s = p.size ?? 20
  return `width="${s}" height="${s}"`
}

function attrBase(): string {
  return Object.entries(baseAttrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')
}

// ── Icon Map for file types ───────────────────────────────────────────

const typeIconMap: Record<string, string> = {
  ts: iconFile(), js: iconFile(), json: iconFile(), html: iconFile(),
  css: iconFile(), vue: iconFile(), md: iconEdit(), txt: iconFile(),
  log: iconFile(), csv: iconList(), py: iconFile(), rs: iconFile(),
  go: iconFile(), sh: iconFile(), png: iconFile(), jpg: iconFile(),
  jpeg: iconFile(), gif: iconFile(), svg: iconFile(), webp: iconFile(),
  zip: iconFile(), tar: iconFile(), gz: iconFile(),
}

export function iconForFile(name: string, isDir: boolean, size: number = 20): string {
  if (isDir) return iconFolder({ size })
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return typeIconMap[ext] || iconFile({ size })
}

// ── Icon component helper (for Vue templates using v-html) ────────────
// Usage: <span v-html="icon('terminal', 20)" class="icon"></span>
export const iconNames = [
  'terminal', 'folder', 'file', 'edit', 'trash', 'refresh', 'plus',
  'grid', 'list', 'search', 'save', 'chevron-right', 'chevron-left',
  'x', 'minus', 'maximize', 'minimize', 'folder-open', 'arrow-up',
  'arrow-down', 'arrow-left', 'arrow-right', 'home', 'settings',
  'empty-folder', 'empty-doc', 'chat', 'dash', 'feedback',
] as const

export type IconName = typeof iconNames[number]

const iconFnMap: Record<string, (p?: IconProps) => string> = {
  'terminal': iconTerminal, 'folder': iconFolder, 'file': iconFile,
  'edit': iconEdit, 'trash': iconTrash, 'refresh': iconRefresh,
  'plus': iconPlus, 'grid': iconGrid, 'list': iconList, 'search': iconSearch,
  'save': iconSave, 'chevron-right': iconChevronRight, 'chevron-left': iconChevronLeft,
  'x': iconX, 'minus': iconMinus, 'maximize': iconMaximize, 'minimize': iconMinimize,
  'folder-open': iconFolderOpen, 'arrow-up': iconArrowUp, 'arrow-down': iconArrowDown,
  'arrow-left': iconArrowLeft, 'arrow-right': iconArrowRight,
  'home': iconHome, 'settings': iconSettings,
  'empty-folder': iconEmptyFolder, 'empty-doc': iconEmptyDoc, 'chat': iconChat, 'dash': iconDash, 'feedback': iconFeedback,
}

export function icon(name: IconName, size: number = 20): string {
  return iconFnMap[name]?.({ size }) ?? ''
}

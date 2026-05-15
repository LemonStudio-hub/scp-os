/**
 * .desktop shortcut file parser/serializer
 * Format inspired by Linux .desktop files
 */

export interface DesktopShortcut {
  name: string
  type: string
  tool: string
  icon: string
  x: number
  y: number
}

const HEADER = '[Desktop Entry]'

export function parseDesktopFile(content: string): DesktopShortcut | null {
  const lines = content.split('\n')
  const map = new Map<string, string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === HEADER) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    map.set(trimmed.slice(0, eqIdx), trimmed.slice(eqIdx + 1))
  }

  const name = map.get('Name')
  const tool = map.get('Tool')
  if (!name || !tool) return null

  return {
    name,
    type: map.get('Type') || 'Application',
    tool,
    icon: map.get('Icon') || 'file',
    x: parseInt(map.get('X') || '0', 10),
    y: parseInt(map.get('Y') || '0', 10),
  }
}

export function serializeDesktopFile(s: DesktopShortcut): string {
  return [
    HEADER,
    `Name=${s.name}`,
    `Type=${s.type}`,
    `Tool=${s.tool}`,
    `Icon=${s.icon}`,
    `X=${s.x}`,
    `Y=${s.y}`,
  ].join('\n')
}

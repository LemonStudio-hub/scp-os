/** Pure helpers for custom accent color picker (testable). */

export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const expanded = /^#?[0-9a-fA-F]{3}$/.test(trimmed)
    ? trimmed
        .replace('#', '')
        .split('')
        .map((c) => c + c)
        .join('')
    : trimmed.replace('#', '')
  return /^[0-9a-fA-F]{6}$/.test(expanded) ? `#${expanded.toLowerCase()}` : null
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

export function hexToRgbA(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Adjust brightness. Uses HSL-like mix toward white/black to avoid channel clipping washout.
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex.length === 4 ? expandShortHex(hex) : hex)
  const t = percent / 100
  let nr: number
  let ng: number
  let nb: number
  if (t >= 0) {
    nr = r + (255 - r) * t
    ng = g + (255 - g) * t
    nb = b + (255 - b) * t
  } else {
    nr = r * (1 + t)
    ng = g * (1 + t)
    nb = b * (1 + t)
  }
  return rgbToHex({ r: nr, g: ng, b: nb })
}

function expandShortHex(hex: string): string {
  const c = hex.replace('#', '')
  return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`
}

export function rgbToHex(color: { r: number; g: number; b: number }): string {
  return `#${[color.r, color.g, color.b]
    .map((v) =>
      Math.min(255, Math.max(0, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

export function loadCustomAccent(storageKey = 'scp-os-custom-accent'): string | null {
  try {
    const raw = localStorage.getItem(storageKey)
    return normalizeHex(raw)
  } catch {
    return null
  }
}

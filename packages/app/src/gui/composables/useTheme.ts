/**
 * Theme Management Composable
 * Applies accent colors, terminal themes, and CSS custom properties dynamically.
 */

import { ref } from 'vue'
import type { Terminal } from 'xterm'

const STORAGE_KEY = 'scp-os-app-settings'

export interface AccentTheme {
  accent: string
  accentHover: string
  accentSoft: string
  accentGlow: string
}

const accentThemes: Record<string, AccentTheme> = {
  '#e94560': { accent: '#e94560', accentHover: '#ff5a73', accentSoft: 'rgba(233, 69, 96, 0.08)', accentGlow: 'rgba(233, 69, 96, 0.25)' },
  '#60a5fa': { accent: '#60a5fa', accentHover: '#93c5fd', accentSoft: 'rgba(96, 165, 250, 0.08)', accentGlow: 'rgba(96, 165, 250, 0.25)' },
  '#34d399': { accent: '#34d399', accentHover: '#6ee7b7', accentSoft: 'rgba(52, 211, 153, 0.08)', accentGlow: 'rgba(52, 211, 153, 0.25)' },
  '#fbbf24': { accent: '#fbbf24', accentHover: '#fcd34d', accentSoft: 'rgba(251, 191, 36, 0.08)', accentGlow: 'rgba(251, 191, 36, 0.25)' },
  '#c084fc': { accent: '#c084fc', accentHover: '#d8b4fe', accentSoft: 'rgba(192, 132, 252, 0.08)', accentGlow: 'rgba(192, 132, 252, 0.25)' },
  '#f87171': { accent: '#f87171', accentHover: '#fca5a5', accentSoft: 'rgba(248, 113, 113, 0.08)', accentGlow: 'rgba(248, 113, 113, 0.25)' },
  '#22d3ee': { accent: '#22d3ee', accentHover: '#67e8f9', accentSoft: 'rgba(34, 211, 238, 0.08)', accentGlow: 'rgba(34, 211, 238, 0.25)' },
  '#a0a0a0': { accent: '#a0a0a0', accentHover: '#d0d0d0', accentSoft: 'rgba(160, 160, 160, 0.08)', accentGlow: 'rgba(160, 160, 160, 0.25)' },
}

export function useTheme() {
  const currentAccent = ref<string>('#e94560')

  function loadSettings(): string {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed.accent || '#e94560'
      }
    } catch { /* ignore */ }
    return '#e94560'
  }

  function applyTheme(color: string, terminal?: Terminal | null): void {
    currentAccent.value = color
    const theme = accentThemes[color] || accentThemes['#e94560']

    if (typeof document !== 'undefined') {
      const root = document.documentElement

      // Update CSS custom properties for accent colors
      root.style.setProperty('--gui-accent', theme.accent)
      root.style.setProperty('--gui-accent-hover', theme.accentHover)
      root.style.setProperty('--gui-accent-soft', theme.accentSoft)
      root.style.setProperty('--gui-accent-glow', theme.accentGlow)

      // Update scrollbar color to match accent
      const styleEl = document.getElementById('dynamic-theme-style') || document.createElement('style')
      styleEl.id = 'dynamic-theme-style'
      styleEl.textContent = `
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: ${theme.accent} !important;
        }
        ::selection {
          background: ${theme.accentSoft} !important;
          color: #f0f0f0;
        }
        :focus-visible {
          outline-color: ${theme.accent} !important;
        }
        .terminal-header__status-dot--online {
          background: var(--gui-success, #34d399);
          box-shadow: 0 0 6px var(--gui-success, #34d399);
        }
      `
      if (!document.getElementById('dynamic-theme-style')) {
        document.head.appendChild(styleEl)
      }
    }

    // Update terminal theme if provided
    if (terminal) {
      terminal.options.theme = {
        background: '#0a0a0a',
        foreground: '#f0f0f0',
        cursor: theme.accent,
        cursorAccent: '#0a0a0a',
        selectionBackground: `${theme.accent}40`,
        black: '#1a1a1a',
        red: theme.accent,
        green: '#34d399',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#f0f0f0',
        brightBlack: '#555555',
        brightRed: theme.accentHover,
        brightGreen: '#6ee7b7',
        brightYellow: '#fcd34d',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#67e8f9',
        brightWhite: '#ffffff',
      }
    }
  }

  // Initialize on load
  const initialColor = loadSettings()
  applyTheme(initialColor)

  return {
    currentAccent,
    applyTheme,
    accentThemes: Object.entries(accentThemes).map(([value, theme]) => ({ value, ...theme })),
  }
}

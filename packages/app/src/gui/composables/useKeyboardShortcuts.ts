/**
 * Keyboard Shortcuts Composable
 * Manages global keyboard shortcuts for the application.
 * Supports key combinations with modifiers (Ctrl/Cmd, Shift, Alt).
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string
  /** Key combination (e.g., 'Ctrl+T', 'Cmd+Shift+M') */
  keys: string
  /** Description of what the shortcut does */
  description: string
  /** Category for grouping in settings UI */
  category: string
  /** Callback function when shortcut is triggered */
  handler: (event: KeyboardEvent) => void
  /** Whether the shortcut is enabled */
  enabled?: boolean
  /** Override the default behavior (calls event.preventDefault()) */
  preventDefault?: boolean
  /** Only trigger in specific contexts (e.g., 'global', 'editor', 'terminal') */
  context?: string
}

export interface ShortcutBinding {
  /** Whether Ctrl/Cmd is pressed */
  ctrlOrMeta: boolean
  /** Whether Shift is pressed */
  shift: boolean
  /** Whether Alt is pressed */
  alt: boolean
  /** The main key */
  key: string
}

// Global registry of shortcuts
const shortcuts: Ref<KeyboardShortcut[]> = ref([])

// Current context (can be set by components)
const currentContext: Ref<string> = ref('global')

// Whether the shortcut manager is enabled
const enabled = ref(true)

// Track registered handler
let handlerRef: ((event: KeyboardEvent) => void) | null = null

/**
 * Parse a key combination string into a binding
 */
export function parseShortcut(shortcut: string): ShortcutBinding {
  const parts = shortcut.split('+').map(p => p.trim())
  let ctrlOrMeta = false
  let shift = false
  let alt = false
  let key = ''

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'ctrl') ctrlOrMeta = true
    else if (lower === 'cmd' || lower === 'meta') ctrlOrMeta = true
    else if (lower === 'command') ctrlOrMeta = true
    else if (lower === 'shift') shift = true
    else if (lower === 'alt' || lower === 'option') alt = true
    else key = part
  }

  return { ctrlOrMeta, shift, alt, key }
}

/**
 * Check if a keyboard event matches a shortcut binding
 */
export function matchesShortcut(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  // Check modifier keys
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey
  if (binding.ctrlOrMeta !== ctrlOrMeta) return false
  if (binding.shift !== event.shiftKey) return false
  if (binding.alt !== event.altKey) return false

  // Check main key (case-insensitive for letters)
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const bindingKey = binding.key.length === 1 ? binding.key.toLowerCase() : binding.key
  if (eventKey !== bindingKey) return false

  return true
}

/**
 * Format a shortcut for display (e.g., "⌘T" on Mac, "Ctrl+T" on Windows)
 */
export function formatShortcut(shortcut: string): string {
  const parts = shortcut.split('+').map(p => p.trim())
  const isMac = navigator.platform.toUpperCase().includes('MAC')

  return parts.map(part => {
    const lower = part.toLowerCase()
    if (lower === 'ctrl') return isMac ? '⌃' : 'Ctrl'
    if (lower === 'cmd' || lower === 'meta') return isMac ? '⌘' : 'Ctrl'
    if (lower === 'command') return isMac ? '⌘' : 'Ctrl'
    if (lower === 'shift') return isMac ? '⇧' : 'Shift'
    if (lower === 'alt' || lower === 'option') return isMac ? '⌥' : 'Alt'
    return part
  }).join(isMac ? '' : '+')
}

/**
 * Register a keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): void {
  const existingIndex = shortcuts.value.findIndex(s => s.id === shortcut.id)
  if (existingIndex !== -1) {
    // Update existing shortcut
    shortcuts.value[existingIndex] = {
      ...shortcuts.value[existingIndex],
      ...shortcut,
    }
  } else {
    shortcuts.value.push({
      enabled: true,
      preventDefault: true,
      context: 'global',
      ...shortcut,
    })
  }
}

/**
 * Unregister a keyboard shortcut by ID
 */
export function unregisterShortcut(id: string): void {
  const index = shortcuts.value.findIndex(s => s.id === id)
  if (index !== -1) {
    shortcuts.value.splice(index, 1)
  }
}

/**
 * Update a shortcut's properties
 */
export function updateShortcut(id: string, updates: Partial<KeyboardShortcut>): void {
  const index = shortcuts.value.findIndex(s => s.id === id)
  if (index !== -1) {
    shortcuts.value[index] = { ...shortcuts.value[index], ...updates }
  }
}

/**
 * Get all shortcuts, optionally filtered by category
 */
export function getShortcuts(category?: string): KeyboardShortcut[] {
  if (category) {
    return shortcuts.value.filter(s => s.category === category)
  }
  return shortcuts.value
}

/**
 * Set the current context for shortcut filtering
 */
export function setContext(context: string): void {
  currentContext.value = context
}

/**
 * Get the current context
 */
export function getContext(): string {
  return currentContext.value
}

/**
 * Main composable - sets up global keyboard listener
 */
export function useKeyboardShortcuts() {
  function handleKeydown(event: KeyboardEvent): void {
    if (!enabled.value) return

    // Find matching shortcut
    for (const shortcut of shortcuts.value) {
      if (shortcut.enabled === false) continue

      // Filter by context
      if (shortcut.context && shortcut.context !== 'global' && shortcut.context !== currentContext.value) continue

      const binding = parseShortcut(shortcut.keys)
      if (matchesShortcut(event, binding)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.handler(event)
        return
      }
    }
  }

  function enable(): void {
    enabled.value = true
  }

  function disable(): void {
    enabled.value = false
  }

  function toggle(): void {
    enabled.value = !enabled.value
  }

  // Set up listener on mount
  function setup(): void {
    if (handlerRef) return
    handlerRef = handleKeydown
    window.addEventListener('keydown', handleKeydown)
  }

  // Remove listener on unmount
  function cleanup(): void {
    if (handlerRef) {
      window.removeEventListener('keydown', handlerRef)
      handlerRef = null
    }
  }

  return {
    shortcuts,
    enabled,
    currentContext,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    getShortcuts,
    formatShortcut,
    setContext,
    getContext,
    enable,
    disable,
    toggle,
    setup,
    cleanup,
  }
}

// Auto-setup for global use
export const globalShortcuts = useKeyboardShortcuts()

// Reactive hook for component lifecycle
export function useKeyboardShortcutManager() {
  const shortcutsApi = useKeyboardShortcuts()

  onMounted(() => {
    shortcutsApi.setup()
  })

  onUnmounted(() => {
    shortcutsApi.cleanup()
  })

  return shortcutsApi
}

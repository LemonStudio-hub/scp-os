/**
 * Z-Index Management Composable
 * Manages window stacking order with automatic z-index assignment.
 */

import { ref } from 'vue'
import { zIndex } from '../design-tokens'

const nextZIndex = ref(zIndex.window)
const focusedWindowId = ref<string | null>(null)

export function useZIndex() {
  /**
   * Get the next available z-index for a new window.
   */
  function getNextZIndex(): number {
    return nextZIndex.value++
  }

  /**
   * Bring a window to the front (assign new z-index).
   */
  function bringToFront(_windowId: string): number {
    focusedWindowId.value = _windowId
    return nextZIndex.value++
  }

  /**
   * Get the currently focused window ID.
   */
  function getFocusedWindowId(): string | null {
    return focusedWindowId.value
  }

  /**
   * Set the focused window.
   */
  function setFocusedWindow(windowId: string | null): void {
    focusedWindowId.value = windowId
  }

  /**
   * Reset z-index counter (for testing).
   */
  function reset(): void {
    nextZIndex.value = zIndex.window
    focusedWindowId.value = null
  }

  return {
    getNextZIndex,
    bringToFront,
    getFocusedWindowId,
    setFocusedWindow,
    reset,
  }
}

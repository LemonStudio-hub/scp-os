/**
 * Resizable Composable
 * Makes any element resizable from 8 directions (n, s, e, w, ne, nw, se, sw).
 * Handles resize start, move, end with minimum/maximum size constraints.
 * Does NOT directly manipulate DOM - instead calls callbacks for the parent to update state.
 */

import { ref, type Ref } from 'vue'
import type { ResizeDirection } from '../types'

export interface ResizeState {
  isResizing: boolean
  direction: ResizeDirection | null
  startX: number
  startY: number
  initialWidth: number
  initialHeight: number
  initialX: number
  initialY: number
  currentWidth: number
  currentHeight: number
  currentX: number
  currentY: number
}

export interface UseResizableOptions {
  disabled?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  onResize?: (width: number, height: number, x: number, y: number) => void
  onStart?: () => void
  onEnd?: (width: number, height: number) => void
}

export function useResizable(
  _elementRef: Ref<HTMLElement | undefined>,
  options: UseResizableOptions = {}
) {
  const {
    disabled = false,
    minWidth = 200,
    minHeight = 150,
    maxWidth = Number.MAX_SAFE_INTEGER,
    maxHeight = Number.MAX_SAFE_INTEGER,
    onResize,
    onStart,
    onEnd,
  } = options

  const resizeState = ref<ResizeState>({
    isResizing: false,
    direction: null,
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0,
    currentWidth: 0,
    currentHeight: 0,
    currentX: 0,
    currentY: 0,
  })

  function handleMouseDown(direction: ResizeDirection, e: MouseEvent): void {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()

    const { currentWidth, currentHeight, currentX, currentY } = resizeState.value

    resizeState.value = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: currentWidth || minWidth,
      initialHeight: currentHeight || minHeight,
      initialX: currentX || 0,
      initialY: currentY || 0,
      currentWidth: currentWidth || minWidth,
      currentHeight: currentHeight || minHeight,
      currentX: currentX || 0,
      currentY: currentY || 0,
    }

    onStart?.()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!resizeState.value.isResizing || !resizeState.value.direction) return

    e.preventDefault()

    const { direction, startX, startY, initialWidth, initialHeight, initialX, initialY } =
      resizeState.value

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    let newWidth = initialWidth
    let newHeight = initialHeight
    let newX = initialX
    let newY = initialY

    // Calculate new dimensions based on resize direction
    if (direction.includes('e')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, initialWidth + deltaX))
    }
    if (direction.includes('w')) {
      const proposedWidth = Math.max(minWidth, Math.min(maxWidth, initialWidth - deltaX))
      const widthDiff = initialWidth - proposedWidth
      newX = initialX + widthDiff
      newWidth = proposedWidth
    }
    if (direction.includes('s')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, initialHeight + deltaY))
    }
    if (direction.includes('n')) {
      const proposedHeight = Math.max(minHeight, Math.min(maxHeight, initialHeight - deltaY))
      const heightDiff = initialHeight - proposedHeight
      newY = initialY + heightDiff
      newHeight = proposedHeight
    }

    resizeState.value.currentWidth = newWidth
    resizeState.value.currentHeight = newHeight
    resizeState.value.currentX = newX
    resizeState.value.currentY = newY

    onResize?.(newWidth, newHeight, newX, newY)
  }

  function handleMouseUp(): void {
    if (!resizeState.value.isResizing) return

    const { currentWidth, currentHeight } = resizeState.value
    resizeState.value.isResizing = false
    resizeState.value.direction = null

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    onEnd?.(currentWidth, currentHeight)
  }

  function stop(): void {
    resizeState.value.isResizing = false
    resizeState.value.direction = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  function setInitialSize(width: number, height: number, x: number, y: number): void {
    resizeState.value.currentWidth = width
    resizeState.value.currentHeight = height
    resizeState.value.currentX = x
    resizeState.value.currentY = y
  }

  return {
    resizeState,
    handleMouseDown,
    stop,
    setInitialSize,
  }
}

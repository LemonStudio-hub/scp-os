/**
 * Resizable Composable
 * Makes any element resizable from 8 directions (n, s, e, w, ne, nw, se, sw).
 * Handles resize start, move, end with minimum size constraints.
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
  elementRef: Ref<HTMLElement | undefined>,
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
    if (disabled || !elementRef.value) return

    e.preventDefault()
    e.stopPropagation()

    const rect = elementRef.value.getBoundingClientRect()

    resizeState.value = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: rect.width,
      initialHeight: rect.height,
      initialX: rect.left,
      initialY: rect.top,
      currentWidth: rect.width,
      currentHeight: rect.height,
      currentX: rect.left,
      currentY: rect.top,
    }

    onStart?.()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!resizeState.value.isResizing || !resizeState.value.direction || !elementRef.value) return

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

    elementRef.value.style.width = `${newWidth}px`
    elementRef.value.style.height = `${newHeight}px`
    elementRef.value.style.left = `${newX}px`
    elementRef.value.style.top = `${newY}px`

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

  function setSize(width: number, height: number): void {
    if (!elementRef.value) return

    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, width))
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, height))

    elementRef.value.style.width = `${constrainedWidth}px`
    elementRef.value.style.height = `${constrainedHeight}px`

    resizeState.value.currentWidth = constrainedWidth
    resizeState.value.currentHeight = constrainedHeight
  }

  function stop(): void {
    resizeState.value.isResizing = false
    resizeState.value.direction = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return {
    resizeState,
    handleMouseDown,
    setSize,
    stop,
  }
}

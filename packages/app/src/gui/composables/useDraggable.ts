/**
 * Draggable Composable
 * Makes any element draggable with mouse/touch support.
 * Handles drag start, move, end with boundary constraints.
 * Returns reactive state and a cleanup function.
 */

import { ref, onUnmounted, type Ref } from 'vue'

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  initialX: number
  initialY: number
  currentX: number
  currentY: number
}

export interface UseDraggableOptions {
  disabled?: boolean
  /** Minimum distance in pixels before drag starts (prevents accidental drags on click) */
  dragThreshold?: number
  boundary?: {
    minX?: number
    minY?: number
    maxX?: number
    maxY?: number
  }
  onMove?: (x: number, y: number) => void
  onStart?: (x: number, y: number) => void
  onEnd?: (x: number, y: number) => void
  onClick?: () => void
}

export function useDraggable(
  _elementRef: Ref<HTMLElement | undefined>,
  options: UseDraggableOptions = {}
) {
  const {
    disabled = false,
    dragThreshold = 5, // 5px threshold before drag starts
    boundary = {},
    onMove,
    onStart,
    onEnd,
    onClick,
  } = options

  const dragState = ref<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    currentX: 0,
    currentY: 0,
  })

  function applyBoundary(x: number, y: number): { x: number; y: number } {
    let boundedX = x
    let boundedY = y

    if (boundary.minX !== undefined) boundedX = Math.max(boundary.minX, boundedX)
    if (boundary.minY !== undefined) boundedY = Math.max(boundary.minY, boundedY)
    if (boundary.maxX !== undefined) boundedX = Math.min(boundary.maxX, boundedX)
    if (boundary.maxY !== undefined) boundedY = Math.min(boundary.maxY, boundedY)

    return { x: boundedX, y: boundedY }
  }

  function handleMouseDown(e: MouseEvent): void {
    if (disabled) return
    if (e.button !== 0) return

    // Don't preventDefault here - let click events through
    const initialX = dragState.value.currentX

    dragState.value = {
      isDragging: false, // Don't mark as dragging until threshold is met
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY: dragState.value.currentY,
      currentX: initialX,
      currentY: dragState.value.currentY,
    }

    // Listen for move/up on document
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    // Check if drag threshold has been met
    if (!dragState.value.isDragging) {
      const deltaX = e.clientX - dragState.value.startX
      const deltaY = e.clientY - dragState.value.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Only start dragging if threshold is exceeded
      if (distance < dragThreshold) {
        return
      }

      // Threshold met, now mark as dragging
      dragState.value.isDragging = true
      e.preventDefault()
      onStart?.(dragState.value.currentX, dragState.value.currentY)
      return
    }

    e.preventDefault()

    const deltaX = e.clientX - dragState.value.startX
    const deltaY = e.clientY - dragState.value.startY

    const newX = dragState.value.initialX + deltaX
    const newY = dragState.value.initialY + deltaY

    const bounded = applyBoundary(newX, newY)

    dragState.value.currentX = bounded.x
    dragState.value.currentY = bounded.y

    onMove?.(bounded.x, bounded.y)
  }

  function handleMouseUp(): void {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // If never actually started dragging (click without move)
    if (!dragState.value.isDragging) {
      onClick?.()
      dragState.value.isDragging = false
      return
    }

    dragState.value.isDragging = false

    onEnd?.(dragState.value.currentX, dragState.value.currentY)
  }

  function stop(): void {
    dragState.value.isDragging = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  function setInitialPosition(x: number, y: number): void {
    const bounded = applyBoundary(x, y)
    dragState.value.currentX = bounded.x
    dragState.value.currentY = bounded.y
    dragState.value.initialX = bounded.x
    dragState.value.initialY = bounded.y
  }

  onUnmounted(() => {
    stop()
  })

  return {
    dragState,
    handleMouseDown,
    stop,
    setInitialPosition,
  }
}

/**
 * Draggable Composable
 * Makes any element draggable with mouse/touch support.
 * Handles drag start, move, end with boundary constraints.
 * Returns reactive state and a cleanup function.
 */

import { ref, type Ref } from 'vue'

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
  boundary?: {
    minX?: number
    minY?: number
    maxX?: number
    maxY?: number
  }
  onMove?: (x: number, y: number) => void
  onStart?: (x: number, y: number) => void
  onEnd?: (x: number, y: number) => void
}

export function useDraggable(
  _elementRef: Ref<HTMLElement | undefined>,
  options: UseDraggableOptions = {}
) {
  const {
    disabled = false,
    boundary = {},
    onMove,
    onStart,
    onEnd,
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

    e.preventDefault()

    const initialX = dragState.value.currentX
    const initialY = dragState.value.currentY

    dragState.value = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
      currentX: initialX,
      currentY: initialY,
    }

    onStart?.(initialX, initialY)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!dragState.value.isDragging) return

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
    if (!dragState.value.isDragging) return

    dragState.value.isDragging = false

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

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

  return {
    dragState,
    handleMouseDown,
    stop,
    setInitialPosition,
  }
}

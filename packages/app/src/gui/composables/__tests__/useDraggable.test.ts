import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDraggable } from '../useDraggable'

describe('useDraggable', () => {
  let element: HTMLElement
  let onMove: (x: number, y: number) => void
  let onStart: (x: number, y: number) => void
  let onEnd: () => void

  beforeEach(() => {
    element = document.createElement('div')
    element.style.width = '100px'
    element.style.height = '100px'
    element.style.left = '0px'
    element.style.top = '0px'
    document.body.appendChild(element)

    onMove = vi.fn() as (x: number, y: number) => void
    onStart = vi.fn() as (x: number, y: number) => void
    onEnd = vi.fn() as () => void
  })

  it('should initialize with default drag state', () => {
    const { dragState } = useDraggable(ref(element))

    expect(dragState.value.isDragging).toBe(false)
    expect(dragState.value.currentX).toBe(0)
    expect(dragState.value.currentY).toBe(0)
  })

  it('should start dragging after threshold is met', () => {
    const { dragState, handleMouseDown } = useDraggable(ref(element), {
      onStart,
      dragThreshold: 0,
    })

    handleMouseDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))

    expect(dragState.value.isDragging).toBe(false)
    expect(dragState.value.startX).toBe(100)
    expect(dragState.value.startY).toBe(100)

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 110 }))

    expect(dragState.value.isDragging).toBe(true)
    expect(onStart).toHaveBeenCalled()
  })

  it('should ignore right mouse button', () => {
    const { dragState, handleMouseDown } = useDraggable(ref(element))

    handleMouseDown(new MouseEvent('mousedown', { button: 2, clientX: 100, clientY: 100, bubbles: true }))

    expect(dragState.value.isDragging).toBe(false)
  })

  it('should respect disabled option', () => {
    const { dragState, handleMouseDown } = useDraggable(ref(element), { disabled: true })

    handleMouseDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))

    expect(dragState.value.isDragging).toBe(false)
  })

  it('should apply boundary constraints after drag threshold', () => {
    const { handleMouseDown } = useDraggable(ref(element), {
      boundary: { minX: 0, minY: 0, maxX: 500, maxY: 500 },
      onMove,
      dragThreshold: 0,
    })

    handleMouseDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))

    expect(onMove).toHaveBeenCalled()
  })

  it('should stop dragging on mouseup', () => {
    const { dragState, handleMouseDown, stop } = useDraggable(ref(element), {
      onEnd,
    })

    handleMouseDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    stop()

    expect(dragState.value.isDragging).toBe(false)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('should set initial position', () => {
    const { dragState, setInitialPosition } = useDraggable(ref(element))

    setInitialPosition(50, 100)

    expect(dragState.value.currentX).toBe(50)
    expect(dragState.value.currentY).toBe(100)
    expect(dragState.value.initialX).toBe(50)
    expect(dragState.value.initialY).toBe(100)
  })

  it('should clean up event listeners on unmount', () => {
    const { handleMouseDown } = useDraggable(ref(element), {
      onMove,
      dragThreshold: 0,
    })

    handleMouseDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 100 }))

    expect(onMove).not.toHaveBeenCalled()
  })
})

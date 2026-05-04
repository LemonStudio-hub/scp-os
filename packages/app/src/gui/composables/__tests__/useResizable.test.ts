import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResizable } from '../useResizable'
import { ref } from 'vue'

describe('useResizable', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    element.style.width = '400px'
    element.style.height = '300px'
    document.body.appendChild(element)
  })

  it('should initialize with default resize state', () => {
    const { resizeState } = useResizable(ref(element))
    expect(resizeState.value.isResizing).toBe(false)
    expect(resizeState.value.direction).toBeNull()
  })

  it('should start resizing on handleMouseDown', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element))

    handleMouseDown(
      'se',
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true })
    )

    expect(resizeState.value.isResizing).toBe(true)
    expect(resizeState.value.direction).toBe('se')
    expect(resizeState.value.startX).toBe(100)
    expect(resizeState.value.startY).toBe(100)
  })

  it('should not start resizing when disabled', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element), { disabled: true })

    handleMouseDown(
      'se',
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true })
    )

    expect(resizeState.value.isResizing).toBe(false)
  })

  it('should resize east direction correctly', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element), {
      minWidth: 100,
      maxWidth: 800,
    })

    handleMouseDown('e', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))

    expect(resizeState.value.currentWidth).toBeGreaterThan(0)
  })

  it('should resize south direction correctly', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element), {
      minHeight: 100,
      maxHeight: 600,
    })

    handleMouseDown('s', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))

    expect(resizeState.value.currentHeight).toBeGreaterThan(0)
  })

  it('should respect minWidth constraint', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element), {
      minWidth: 200,
    })

    handleMouseDown('e', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 100 }))

    expect(resizeState.value.currentWidth).toBeGreaterThanOrEqual(200)
  })

  it('should respect maxWidth constraint', () => {
    const { resizeState, handleMouseDown } = useResizable(ref(element), {
      maxWidth: 500,
    })

    handleMouseDown('e', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 1000, clientY: 100 }))

    expect(resizeState.value.currentWidth).toBeLessThanOrEqual(500)
  })

  it('should call onResize callback during resize', () => {
    const onResize = vi.fn()
    const { handleMouseDown } = useResizable(ref(element), { onResize })

    handleMouseDown(
      'se',
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true })
    )
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))

    expect(onResize).toHaveBeenCalled()
  })

  it('should call onStart callback when resize starts', () => {
    const onStart = vi.fn()
    const { handleMouseDown } = useResizable(ref(element), { onStart })

    handleMouseDown(
      'se',
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true })
    )

    expect(onStart).toHaveBeenCalled()
  })

  it('should stop resizing on stop call', () => {
    const { resizeState, handleMouseDown, stop } = useResizable(ref(element))

    handleMouseDown(
      'se',
      new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true })
    )
    expect(resizeState.value.isResizing).toBe(true)

    stop()
    expect(resizeState.value.isResizing).toBe(false)
    expect(resizeState.value.direction).toBeNull()
  })

  it('should set initial size correctly', () => {
    const { resizeState, setInitialSize } = useResizable(ref(element))

    setInitialSize(500, 400, 10, 20)

    expect(resizeState.value.currentWidth).toBe(500)
    expect(resizeState.value.currentHeight).toBe(400)
    expect(resizeState.value.currentX).toBe(10)
    expect(resizeState.value.currentY).toBe(20)
  })

  it('should resize west direction and adjust x position', () => {
    const { resizeState, handleMouseDown, setInitialSize } = useResizable(ref(element))

    setInitialSize(400, 300, 100, 100)
    handleMouseDown('w', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }))

    expect(resizeState.value.currentWidth).toBeLessThan(400)
    expect(resizeState.value.currentX).toBeGreaterThan(100)
  })

  it('should resize north direction and adjust y position', () => {
    const { resizeState, handleMouseDown, setInitialSize } = useResizable(ref(element))

    setInitialSize(400, 300, 100, 100)
    handleMouseDown('n', new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }))

    expect(resizeState.value.currentHeight).toBeLessThan(300)
    expect(resizeState.value.currentY).toBeGreaterThan(100)
  })
})

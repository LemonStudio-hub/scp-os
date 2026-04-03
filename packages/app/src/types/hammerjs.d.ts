declare module 'hammerjs' {
  interface HammerEvent {
    deltaX: number
    deltaY: number
    velocityX: number
    velocityY: number
    direction: number
    type: string
    target: HTMLElement
    pointerType: string
    center: { x: number; y: number }
    preventedDefault: boolean
    preventDefault(): void
  }

  interface HammerInput extends HammerEvent {
    srcEvent: TouchEvent | MouseEvent | PointerEvent
  }

  interface HammerManager {
    add(recognizer: unknown): HammerManager
    get(name: string): unknown | undefined
    remove(recognizer: unknown): HammerManager
    set(options: object): HammerManager
    on(events: string, handler: (ev: HammerEvent) => void): void
    off(events: string, handler?: (ev: HammerEvent) => void): void
    emit(event: string, data: object): void
    destroy(): void
    stopRecognize(): void
  }

  interface HammerStatic {
    new (element: HTMLElement | SVGElement, options?: object): HammerManager
    Manager: new (element: HTMLElement | SVGElement, options?: object) => HammerManager
    Swipe: new (options?: object) => unknown
    Pan: new (options?: object) => unknown
    Pinch: new (options?: object) => unknown
    Tap: new (options?: object) => unknown
    Press: new (options?: object) => unknown
    Rotate: new (options?: object) => unknown
    DIRECTION_NONE: 1
    DIRECTION_LEFT: 2
    DIRECTION_RIGHT: 4
    DIRECTION_UP: 8
    DIRECTION_DOWN: 16
    DIRECTION_HORIZONTAL: 6
    DIRECTION_VERTICAL: 24
    DIRECTION_ALL: 30
  }

  const Hammer: HammerStatic
  export default Hammer
  export type { HammerManager, HammerEvent, HammerInput }
}

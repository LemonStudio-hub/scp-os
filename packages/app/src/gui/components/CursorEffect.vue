<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

type CursorState =
  | 'default'
  | 'pointer'
  | 'text'
  | 'not-allowed'
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'crosshair'
  | 'resize-ns'
  | 'resize-ew'
  | 'resize-nesw'
  | 'resize-nwse'

const STORAGE_KEY = 'scp-os-custom-cursor'

const x = ref(-200)
const y = ref(-200)
const state = ref<CursorState>('default')
const enabled = ref(loadEnabled())
const finePointer = ref(true)

const wrapStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px)`,
}))

function loadEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw !== 'false'
  } catch {
    return true
  }
}

function persistEnabled(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

function applyRootClass(on: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('custom-cursor-enabled', on)
}

function resolveState(el: Element): CursorState {
  let cur: Element | null = el
  while (cur && cur !== document.documentElement) {
    const cl = cur.classList
    const h = cur as HTMLElement

    if (
      cl.contains('pc-window__resize--n') ||
      cl.contains('scp-window__resize--n') ||
      cl.contains('pc-window__resize--s') ||
      cl.contains('scp-window__resize--s')
    )
      return 'resize-ns'
    if (
      cl.contains('pc-window__resize--e') ||
      cl.contains('scp-window__resize--e') ||
      cl.contains('pc-window__resize--w') ||
      cl.contains('scp-window__resize--w')
    )
      return 'resize-ew'
    if (
      cl.contains('pc-window__resize--ne') ||
      cl.contains('scp-window__resize--ne') ||
      cl.contains('pc-window__resize--sw') ||
      cl.contains('scp-window__resize--sw')
    )
      return 'resize-nesw'
    if (
      cl.contains('pc-window__resize--nw') ||
      cl.contains('scp-window__resize--nw') ||
      cl.contains('pc-window__resize--se') ||
      cl.contains('scp-window__resize--se')
    )
      return 'resize-nwse'

    if (cl.contains('pc-window__header--dragging') || cl.contains('scp-window__header--dragging'))
      return 'grabbing'
    if (cl.contains('pc-window__header') || cl.contains('scp-window__header')) return 'grab'

    if (cl.contains('desktop-screen__icon')) {
      return cl.contains('is-dragging') ? 'grabbing' : 'grab'
    }

    const ic = h.style?.cursor
    if (ic === 'grabbing') return 'grabbing'
    if (ic === 'grab') return 'grab'
    if (ic === 'move') return 'move'
    if (ic === 'crosshair') return 'crosshair'

    if (h.matches?.(':disabled') || h.getAttribute?.('aria-disabled') === 'true')
      return 'not-allowed'

    if (
      h.matches?.(
        'input[type="text"],input[type="search"],input[type="email"],input[type="password"],input[type="url"],input[type="number"],textarea,[contenteditable="true"]'
      )
    )
      return 'text'

    if (
      h.matches?.(
        'a[href],button:not(:disabled),[role="button"],[role="link"],label,summary,select,[tabindex]:not([tabindex="-1"])'
      )
    )
      return 'pointer'

    cur = cur.parentElement
  }
  return 'default'
}

// Lock cursor state while buttons are held (resize handles stop mousedown bubbling).
let lockedState: CursorState | null = null
let rafId = 0
let pendingEvent: MouseEvent | null = null

function processMove(e: MouseEvent): void {
  x.value = e.clientX
  y.value = e.clientY

  if (e.buttons !== 0) {
    if (lockedState === null) lockedState = state.value
    state.value = lockedState
  } else {
    lockedState = null
    if (e.target instanceof Element) state.value = resolveState(e.target)
  }
}

function onMouseMove(e: MouseEvent): void {
  pendingEvent = e
  if (rafId) return
  rafId = window.requestAnimationFrame(() => {
    rafId = 0
    if (pendingEvent) processMove(pendingEvent)
    pendingEvent = null
  })
}

function onLeave(): void {
  x.value = -200
  y.value = -200
}

const reduceMotion = ref(false)

function updateFinePointer(): void {
  if (typeof window === 'undefined') {
    finePointer.value = true
    reduceMotion.value = false
    return
  }
  finePointer.value = window.matchMedia('(pointer: fine)').matches
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function bindListeners(): void {
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.documentElement.addEventListener('mouseleave', onLeave)
}

function unbindListeners(): void {
  document.removeEventListener('mousemove', onMouseMove)
  document.documentElement.removeEventListener('mouseleave', onLeave)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

let mq: MediaQueryList | null = null
function onMqChange(): void {
  updateFinePointer()
}

function isActive(): boolean {
  return enabled.value && finePointer.value && !reduceMotion.value
}

watch(
  [enabled, finePointer, reduceMotion],
  () => {
    const active = isActive()
    applyRootClass(active)
    unbindListeners()
    if (active) bindListeners()
  },
  { immediate: false }
)

let mqMotion: MediaQueryList | null = null

onMounted(() => {
  updateFinePointer()
  applyRootClass(isActive())
  if (isActive()) bindListeners()

  mq = window.matchMedia('(pointer: fine)')
  mq.addEventListener('change', onMqChange)
  mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  mqMotion.addEventListener('change', onMqChange)
})

onUnmounted(() => {
  unbindListeners()
  applyRootClass(false)
  mq?.removeEventListener('change', onMqChange)
  mqMotion?.removeEventListener('change', onMqChange)
})

// Expose for settings toggle without a Pinia store.
function setCustomCursorEnabled(value: boolean): void {
  enabled.value = value
  persistEnabled(value)
  applyRootClass(isActive())
  unbindListeners()
  if (isActive()) bindListeners()
}

defineExpose({ setCustomCursorEnabled, enabled })

// Also listen for global settings events.
function onToggleEvent(e: Event): void {
  const detail = (e as CustomEvent).detail as { enabled?: boolean } | undefined
  if (typeof detail?.enabled === 'boolean') setCustomCursorEnabled(detail.enabled)
}
onMounted(() => window.addEventListener('scp-custom-cursor-toggle', onToggleEvent as EventListener))
onUnmounted(() =>
  window.removeEventListener('scp-custom-cursor-toggle', onToggleEvent as EventListener)
)
</script>

<template>
  <div v-if="isActive()" class="cur-wrap" :style="wrapStyle" aria-hidden="true">
    <span class="cur-dot" :class="'cur-dot--' + state" />
  </div>
</template>

<style scoped>
.cur-wrap {
  position: fixed;
  top: 0;
  left: 0;
  margin: -3.5px 0 0 -3.5px;
  pointer-events: none;
  z-index: var(--gui-z-cursor, 99999);
  will-change: transform;
}

.cur-dot {
  position: relative;
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gui-accent, #e94560);
  transform-origin: center;
  transform: scale(1);
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-radius 0.18s ease,
    background 0.3s ease;
}

.cur-dot::before,
.cur-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: var(--gui-accent, #e94560);
  border-radius: 1px;
  opacity: 0;
  transition:
    opacity 0.12s ease,
    background 0.3s ease;
}

.cur-dot--pointer {
  transform: scale(1.43);
}
.cur-dot--text {
  transform: scaleX(0.29) scaleY(2.29);
  border-radius: 2px;
}
.cur-dot--not-allowed::after {
  opacity: 1;
  width: 1.5px;
  height: 10px;
  transform: translate(-50%, -50%) rotate(45deg);
}
.cur-dot--grab {
  transform: scale(1.6);
  opacity: 0.7;
}
.cur-dot--grabbing {
  transform: scale(0.8);
}
.cur-dot--move::before {
  opacity: 1;
  width: 14px;
  height: 2px;
  transform: translate(-50%, -50%);
}
.cur-dot--move::after {
  opacity: 1;
  width: 2px;
  height: 14px;
  transform: translate(-50%, -50%);
}
.cur-dot--crosshair::before {
  opacity: 1;
  width: 12px;
  height: 1.5px;
  transform: translate(-50%, -50%);
}
.cur-dot--crosshair::after {
  opacity: 1;
  width: 1.5px;
  height: 12px;
  transform: translate(-50%, -50%);
}
.cur-dot--resize-ns {
  transform: scaleX(0.35) scaleY(3);
  border-radius: 2px;
}
.cur-dot--resize-ew {
  transform: scaleX(3) scaleY(0.35);
  border-radius: 2px;
}
.cur-dot--resize-nesw {
  transform: rotate(-45deg) scaleX(3) scaleY(0.35);
  border-radius: 2px;
}
.cur-dot--resize-nwse {
  transform: rotate(45deg) scaleX(3) scaleY(0.35);
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .cur-dot,
  .cur-dot::before,
  .cur-dot::after {
    transition: none !important;
  }
}
</style>

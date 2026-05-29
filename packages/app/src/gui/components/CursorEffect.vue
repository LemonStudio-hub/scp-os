<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type CursorState =
  | 'default' | 'pointer' | 'text' | 'not-allowed'
  | 'grab' | 'grabbing' | 'move' | 'crosshair'
  | 'resize-ns' | 'resize-ew' | 'resize-nesw' | 'resize-nwse'

const x = ref(-200)
const y = ref(-200)
const state = ref<CursorState>('default')

const wrapStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px)`,
}))

function resolveState(el: Element): CursorState {
  let cur: Element | null = el
  while (cur && cur !== document.documentElement) {
    const cl = cur.classList
    const h = cur as HTMLElement

    // Resize handles
    if (cl.contains('pc-window__resize--n') || cl.contains('scp-window__resize--n') ||
        cl.contains('pc-window__resize--s') || cl.contains('scp-window__resize--s'))
      return 'resize-ns'
    if (cl.contains('pc-window__resize--e') || cl.contains('scp-window__resize--e') ||
        cl.contains('pc-window__resize--w') || cl.contains('scp-window__resize--w'))
      return 'resize-ew'
    if (cl.contains('pc-window__resize--ne') || cl.contains('scp-window__resize--ne') ||
        cl.contains('pc-window__resize--sw') || cl.contains('scp-window__resize--sw'))
      return 'resize-nesw'
    if (cl.contains('pc-window__resize--nw') || cl.contains('scp-window__resize--nw') ||
        cl.contains('pc-window__resize--se') || cl.contains('scp-window__resize--se'))
      return 'resize-nwse'

    // Dragging state
    if (cl.contains('pc-window__header--dragging') || cl.contains('scp-window__header--dragging'))
      return 'grabbing'

    // Title bar (grab)
    if (cl.contains('pc-window__header') || cl.contains('scp-window__header'))
      return 'grab'

    // Inline cursor hints (desktop drag, color picker, etc.)
    const ic = h.style?.cursor
    if (ic === 'grabbing') return 'grabbing'
    if (ic === 'grab')     return 'grab'
    if (ic === 'move')     return 'move'
    if (ic === 'crosshair') return 'crosshair'

    // Disabled
    if (h.matches?.(':disabled') || h.getAttribute?.('aria-disabled') === 'true')
      return 'not-allowed'

    // Text
    if (h.matches?.('input[type="text"],input[type="search"],input[type="email"],input[type="password"],input[type="url"],input[type="number"],textarea,[contenteditable="true"]'))
      return 'text'

    // Pointer
    if (h.matches?.('a[href],button:not(:disabled),[role="button"],[role="link"],label,summary,select,[tabindex]:not([tabindex="-1"])'))
      return 'pointer'

    cur = cur.parentElement
  }
  return 'default'
}

function onMouseMove(e: MouseEvent) {
  x.value = e.clientX
  y.value = e.clientY
  if (e.target instanceof Element) state.value = resolveState(e.target)
}

function onLeave() {
  x.value = -200
  y.value = -200
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.documentElement.addEventListener('mouseleave', onLeave)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.documentElement.removeEventListener('mouseleave', onLeave)
})
</script>

<template>
  <div class="cur-wrap" :style="wrapStyle" aria-hidden="true">
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
  z-index: 99999;
  will-change: transform;
}

.cur-dot {
  position: relative;
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  mix-blend-mode: difference;
  transform-origin: center;
  transform: scale(1);
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-radius 0.18s ease;
}

/* 伪元素公共：以父中心为原点居中 */
.cur-dot::before,
.cur-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #fff;
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.12s ease;
}

/* ── pointer ──────────────────────────────────────────── */
.cur-dot--pointer {
  transform: scale(1.43);
}

/* ── text (I-beam) ────────────────────────────────────── */
.cur-dot--text {
  transform: scaleX(0.29) scaleY(2.29);
  border-radius: 2px;
}

/* ── not-allowed：圆 + 斜线 ───────────────────────────── */
.cur-dot--not-allowed::after {
  opacity: 1;
  width: 1.5px;
  height: 10px;
  transform: translate(-50%, -50%) rotate(45deg);
}

/* ── grab：横向扁椭圆（实心，无空心环） ────────────────── */
.cur-dot--grab {
  transform: scaleX(2.1) scaleY(0.55);
}

/* ── grabbing：小圆 ────────────────────────────────────── */
.cur-dot--grabbing {
  transform: scale(0.65);
}

/* ── move：圆 + 粗十字 ─────────────────────────────────── */
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

/* ── crosshair：圆 + 细十字 ────────────────────────────── */
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

/* ── resize-ns（竖向胶囊） ─────────────────────────────── */
.cur-dot--resize-ns {
  transform: scaleX(0.35) scaleY(3);
  border-radius: 2px;
}

/* ── resize-ew（横向胶囊） ─────────────────────────────── */
.cur-dot--resize-ew {
  transform: scaleX(3) scaleY(0.35);
  border-radius: 2px;
}

/* ── resize-nesw（斜 ╱） ───────────────────────────────── */
.cur-dot--resize-nesw {
  transform: rotate(-45deg) scaleX(3) scaleY(0.35);
  border-radius: 2px;
}

/* ── resize-nwse（斜 ╲） ───────────────────────────────── */
.cur-dot--resize-nwse {
  transform: rotate(45deg) scaleX(3) scaleY(0.35);
  border-radius: 2px;
}
</style>

<template>
  <!-- Mobile Layout -->
  <div
    v-if="mobile.isMobile.value"
    ref="mobileAppRef"
    class="mobile-app"
    role="application"
    aria-label="SCP-OS 移动端"
  >
    <!-- Home Screen (always mounted, hidden when a tool is active) -->
    <HomeScreen v-show="!activeTool" @launch="onHomeLaunch" />

    <!-- Active Tool Overlay (full-screen) — rendered via ToolRegistry -->
    <Transition name="tool-slide">
      <component
        v-if="activeTool && activeToolModule"
        :is="activeToolModule.mobileComponent"
        :visible="true"
        :data="activeToolData"
        @close="closeActiveTool"
      />
    </Transition>
  </div>

  <!-- Desktop Layout -->
  <div v-else class="desktop-app" role="application" aria-label="SCP-OS 桌面端">
    <!-- Desktop Screen (always rendered as background) -->
    <DesktopScreen @launch="onHomeLaunch" />

    <!-- Desktop Windows (rendered on top of DesktopScreen) -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import HomeScreen from './HomeScreen.vue'
import DesktopScreen from '../desktop/DesktopScreen.vue'
import { useMobile } from '../composables/useMobile'
import { useWindowManagerStore } from '../stores/windowManager'
import { useAuthStore } from '../../stores/authStore'
import { ToolRegistry, openTool } from '../registry/ToolRegistry'
import type { HomeApp } from './HomeScreen.vue'
import type { DesktopApp } from '../desktop/DesktopScreen.vue'
import type { ToolType } from '../types'

const mobile = useMobile()
const wmStore = useWindowManagerStore()
const authStore = useAuthStore()
const mobileAppRef = ref<HTMLDivElement | null>(null)

// Left-edge swipe-right to go back
const EDGE_THRESHOLD = 30  // px from left edge to start gesture
const SWIPE_MIN_X = 60     // minimum horizontal distance
const SWIPE_MAX_RATIO = 1.5 // horizontal must dominate vertical

let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent): void {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
}

function onTouchEnd(e: TouchEvent): void {
  if (!activeTool.value) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = Math.abs(t.clientY - touchStartY)
  if (touchStartX < EDGE_THRESHOLD && dx > SWIPE_MIN_X && dx > dy * SWIPE_MAX_RATIO) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10)
    closeActiveTool()
  }
}

onMounted(() => {
  const el = mobileAppRef.value
  if (!el) return
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
})

onBeforeUnmount(() => {
  const el = mobileAppRef.value
  if (!el) return
  el.removeEventListener('touchstart', onTouchStart)
  el.removeEventListener('touchend', onTouchEnd)
})

// On mobile, we track the "active tool" instead of floating windows
const activeTool = computed<ToolType | null>(() => {
  if (!mobile.isMobile.value) return null
  const topWindow = wmStore.openWindows[wmStore.openWindows.length - 1]
  return topWindow?.config.tool ?? null
})

const activeToolModule = computed(() => {
  if (!activeTool.value) return null
  return ToolRegistry.get(activeTool.value) || null
})

const activeToolData = computed(() => {
  if (!activeTool.value) return undefined
  const topWindow = wmStore.openWindows[wmStore.openWindows.length - 1]
  return topWindow?.config.data
})

function onHomeLaunch(app: HomeApp | DesktopApp): void {
  // Security check: prevent launching apps if not logged in
  if (!authStore.isLoggedIn) {
    console.warn('[MobileApp] Attempted to launch app while not logged in')
    return
  }

  // Mobile: prevent re-opening same active tool
  if (mobile.isMobile.value && activeTool.value === app.tool) {
    return
  }

  const tool = app.tool as ToolType
  const toolModule = ToolRegistry.get(tool)
  const existingSingleton = toolModule?.singleton
    ? wmStore.openWindows.find((win) => win.config.tool === tool)
    : undefined

  if (existingSingleton) {
    if (existingSingleton.minimized) {
      wmStore.restoreWindow(existingSingleton.config.id)
    } else {
      wmStore.focusWindow(existingSingleton.config.id)
    }
    return
  }

  openTool(
    tool,
    (config) => {
      wmStore.openWindow({
        id: config.id,
        tool: config.tool,
        title: config.title,
        iconName: config.iconName,
        width: config.width,
        height: config.height,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        resizable: config.resizable,
        draggable: config.draggable,
        closable: config.closable,
        minimizable: config.minimizable,
        maximizable: config.maximizable,
        isFullscreen: config.isFullscreen,
        data: config.data,
      })
    },
    (app as DesktopApp).data,
    wmStore.openWindows.map((win) => win.config.id)
  )
}

function closeActiveTool(): void {
  // Security check: prevent closing tools if not logged in
  if (!authStore.isLoggedIn) {
    console.warn('[MobileApp] Attempted to close tool while not logged in')
    return
  }

  const topWindow = wmStore.openWindows[wmStore.openWindows.length - 1]
  if (topWindow) {
    wmStore.closeWindow(topWindow.config.id)
  }
}
</script>

<style scoped>
.mobile-app {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}

.desktop-app {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}

/* Tool open: slide up from bottom */
.tool-slide-enter-active {
  animation: tool-slide-in 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
}

/* Tool close: shrink back to icon */
.tool-slide-leave-active {
  animation: tool-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
  transform-origin: center bottom;
}

@keyframes tool-slide-in {
  from {
    transform: translateY(100%);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes tool-slide-out {
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
    border-radius: 0px;
  }
  to {
    transform: scale(0.05) translateY(60%);
    opacity: 0;
    border-radius: 32px;
  }
}
</style>

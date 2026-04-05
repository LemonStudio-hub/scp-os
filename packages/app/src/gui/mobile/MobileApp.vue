<template>
  <!-- Mobile Layout -->
  <div v-if="mobile.isMobile.value" class="mobile-app">
    <!-- Home Screen (default view) -->
    <HomeScreen
      v-if="!activeTool"
      @launch="onHomeLaunch"
    />

    <!-- Active Tool Overlay (full-screen) — rendered via ToolRegistry -->
    <template v-if="activeTool && activeToolModule">
      <component
        :is="activeToolModule.mobileComponent"
        :visible="true"
        @close="closeActiveTool"
      />
    </template>
  </div>

  <!-- Desktop Layout -->
  <div v-else class="desktop-app">
    <!-- Desktop Screen (always rendered as background) -->
    <DesktopScreen
      @launch="onHomeLaunch"
    />

    <!-- Desktop Windows (rendered on top of DesktopScreen) -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HomeScreen from './HomeScreen.vue'
import DesktopScreen from '../desktop/DesktopScreen.vue'
import { useMobile } from '../composables/useMobile'
import { useWindowManagerStore } from '../stores/windowManager'
import { ToolRegistry, openTool } from '../registry/ToolRegistry'
import type { HomeApp } from './HomeScreen.vue'
import type { DesktopApp } from '../desktop/DesktopScreen.vue'
import type { ToolType } from '../types'

const mobile = useMobile()
const wmStore = useWindowManagerStore()

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

function onHomeLaunch(app: HomeApp | DesktopApp): void {
  if (mobile.isMobile.value && activeTool.value === app.tool) {
    return
  }

  openTool(app.tool as ToolType, (config) => {
    wmStore.openWindow({
      id: config.id,
      tool: config.tool,
      title: config.title,
      iconName: config.iconName,
      width: config.width,
      height: config.height,
    })
  })
}

function closeActiveTool(): void {
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
</style>

<template>
  <!-- Mobile Layout -->
  <div v-if="mobile.isMobile.value" class="mobile-app">
    <!-- Home Screen (default view) -->
    <HomeScreen
      v-if="!activeTool"
      @launch="onHomeLaunch"
    />

    <!-- Active Tool Overlay (full-screen) -->
    <template v-if="activeTool">
      <MobileFileManager
        v-if="activeTool === 'filemanager'"
        :visible="true"
        @close="closeActiveTool"
      />
      <MobileTerminal
        v-else-if="activeTool === 'terminal'"
        :visible="true"
        @close="closeActiveTool"
      />
      <MobileSettings
        v-else-if="activeTool === 'settings'"
        :visible="true"
        @close="closeActiveTool"
      />
    </template>
  </div>

  <!-- Desktop Layout (unchanged) -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HomeScreen from './HomeScreen.vue'
import MobileFileManager from '../tools/filemanager/MobileFileManager.vue'
import MobileTerminal from '../tools/terminal/MobileTerminal.vue'
import MobileSettings from '../tools/settings/MobileSettings.vue'
import { useMobile } from '../composables/useMobile'
import { useWindowManagerStore } from '../stores/windowManager'
import type { HomeApp } from './HomeScreen.vue'
import type { ToolType } from '../types'

const mobile = useMobile()
const wmStore = useWindowManagerStore()

// On mobile, we track the "active tool" instead of floating windows
const activeTool = computed<ToolType | null>(() => {
  if (!mobile.isMobile.value) return null
  const topWindow = wmStore.openWindows[wmStore.openWindows.length - 1]
  return topWindow?.config.tool ?? null
})

function onHomeLaunch(app: HomeApp): void {
  if (activeTool.value === app.tool) {
    return
  }

  wmStore.openWindow({
    id: `${app.tool}-${Date.now()}`,
    tool: app.tool as ToolType,
    title: app.label,
    width: window.innerWidth,
    height: window.innerHeight,
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
</style>

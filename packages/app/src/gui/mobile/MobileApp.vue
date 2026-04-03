<template>
  <!-- Mobile Layout -->
  <div v-if="mobile.isMobile.value" class="mobile-app">
    <!-- Main Terminal Background -->
    <SCPTerminal />

    <!-- Active Tool Overlay (full-screen) -->
    <template v-if="activeTool">
      <MobileFileManager
        v-if="activeTool === 'filemanager'"
        :visible="true"
        @close="closeActiveTool"
      />
      <MobileEditor
        v-else-if="activeTool === 'editor'"
        :visible="true"
        @close="closeActiveTool"
      />
      <MobileTerminal
        v-else-if="activeTool === 'terminal'"
        :visible="true"
        @close="closeActiveTool"
      />
    </template>

    <!-- iOS Dock -->
    <MobileDock
      :active-tools="activeTools"
      @launch="onDockLaunch"
    />
  </div>

  <!-- Desktop Layout (unchanged) -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SCPTerminal from '../../components/SCPTerminal.vue'
import MobileDock from '../components/MobileDock.vue'
import MobileFileManager from '../tools/filemanager/MobileFileManager.vue'
import MobileEditor from '../tools/editor/MobileEditor.vue'
import MobileTerminal from '../tools/terminal/MobileTerminal.vue'
import { useMobile } from '../composables/useMobile'
import { useWindowManagerStore } from '../stores/windowManager'
import type { MobileDockItem } from '../components/MobileDock.vue'
import type { ToolType } from '../types'

const mobile = useMobile()
const wmStore = useWindowManagerStore()

// On mobile, we track the "active tool" instead of floating windows
const activeTool = computed<ToolType | null>(() => {
  if (!mobile.isMobile.value) return null
  // Check if any GUI window is open
  const topWindow = wmStore.openWindows[wmStore.openWindows.length - 1]
  return topWindow?.config.tool ?? null
})

const activeTools = computed<ToolType[]>(() => {
  return wmStore.openWindows.map(w => w.config.tool)
})

function onDockLaunch(item: MobileDockItem): void {
  // Check if tool is already active
  if (activeTool.value === item.tool) {
    return
  }

  // Open the tool via the window manager (which triggers the mobile overlay)
  wmStore.openWindow({
    id: `${item.tool}-${Date.now()}`,
    tool: item.tool,
    title: item.label,
    iconName: item.iconName,
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

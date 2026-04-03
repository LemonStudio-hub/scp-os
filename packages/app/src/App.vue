<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import SCPTerminal from './components/SCPTerminal.vue'
import Sidebar from './components/Sidebar.vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import SCPToolbar, { type DockItemDef } from './gui/components/SCPToolbar.vue'
import FileManagerWindow from './gui/tools/filemanager/FileManagerWindow.vue'
import EditorWindow from './gui/tools/editor/EditorWindow.vue'
import TerminalPanel from './gui/tools/terminal/TerminalPanel.vue'
import { useTabsStore } from './stores/tabs'
import { useWindowManagerStore } from './gui/stores/windowManager'
import type { ToolType } from './gui/types'
import { injectGUITokens } from './gui/design-tokens'

const tabsStore = useTabsStore()
const wmStore = useWindowManagerStore()

// Performance Dashboard state
const showPerformanceDashboard = ref(false)

// Global function to open performance dashboard
const openPerformanceDashboard = () => {
  showPerformanceDashboard.value = true
}

// Track active tool types for toolbar highlighting
const activeTools = computed<ToolType[]>(() => {
  return wmStore.openWindows.map(w => w.config.tool)
})

// Handle toolbar item launch
function onToolbarLaunch(item: DockItemDef): void {
  // Check if window already exists for this tool
  const existing = wmStore.getWindowByTool(item.tool)
  if (existing) {
    wmStore.focusWindow(existing.config.id)
    return
  }

  // Open new window based on tool type
  switch (item.tool) {
    case 'filemanager':
      wmStore.openWindow({
        id: `filemanager-${Date.now()}`,
        tool: 'filemanager',
        title: 'File Manager',
        iconName: 'folder',
        width: 750,
        height: 480,
      })
      break
    case 'editor':
      wmStore.openWindow({
        id: `editor-${Date.now()}`,
        tool: 'editor',
        title: 'Text Editor',
        iconName: 'edit',
        width: 700,
        height: 500,
      })
      break
    case 'terminal':
      wmStore.openWindow({
        id: `terminal-${Date.now()}`,
        tool: 'terminal',
        title: 'Terminal Panel',
        iconName: 'terminal',
        width: 650,
        height: 380,
      })
      break
  }
}

// Touch gesture control
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return

  const touchX = e.touches[0].clientX
  const touchY = e.touches[0].clientY
  const diffX = touchX - touchStartX.value
  const diffY = touchY - touchStartY.value

  // Determine horizontal or vertical swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (Math.abs(diffX) > 50) {
      // Swipe right to open sidebar
      if (diffX > 0 && !tabsStore.sidebarOpen) {
        tabsStore.openSidebar()
        isSwiping.value = false
      }
      // Swipe left to close sidebar
      else if (diffX < 0 && tabsStore.sidebarOpen) {
        tabsStore.closeSidebar()
        isSwiping.value = false
      }
    }
  }
}

const handleTouchEnd = () => {
  isSwiping.value = false
}

onMounted(async () => {
  // Inject GUI design tokens
  injectGUITokens()

  // Initialize tabs store with IndexedDB
  await tabsStore.initialize()

  // Load saved GUI windows
  await wmStore.loadWindowStates()

  // Default: open File Manager on first launch
  if (wmStore.windowCount === 0) {
    wmStore.openWindow({
      id: `filemanager-init`,
      tool: 'filemanager',
      title: 'File Manager',
      iconName: 'folder',
      width: Math.min(800, window.innerWidth - 40),
      height: Math.min(520, window.innerHeight - 160),
    })
  }

  // Set global function for performance dashboard
  window.openPerformanceDashboard = openPerformanceDashboard

  // Add touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  // Clean up global function
  delete window.openPerformanceDashboard

  // Remove touch event listeners
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div id="app">
    <SCPTerminal />
    <Sidebar />
    <PerformanceDashboard
      :isVisible="showPerformanceDashboard"
      @close="showPerformanceDashboard = false"
    />

    <!-- GUI Windows -->
    <template v-for="win in wmStore.openWindows" :key="win.config.id">
      <FileManagerWindow
        v-if="win.config.tool === 'filemanager'"
        :window-instance="win"
      />
      <EditorWindow
        v-else-if="win.config.tool === 'editor'"
        :window-instance="win"
      />
      <TerminalPanel
        v-else-if="win.config.tool === 'terminal'"
        :window-instance="win"
      />
    </template>

    <!-- Toolbar -->
    <SCPToolbar
      :active-tools="activeTools"
      status="online"
      status-text="SCP-OS v0.1.0"
      @launch="onToolbarLaunch"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #060606;
  color: #ffffff;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  padding-bottom: 48px; /* Reserve space for toolbar */
}
</style>
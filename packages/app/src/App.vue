<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import SCPTerminal from './components/SCPTerminal.vue'
import Sidebar from './components/Sidebar.vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import SCPToolbar, { type DockItemDef } from './gui/components/SCPToolbar.vue'
import FileManagerWindow from './gui/tools/filemanager/FileManagerWindow.vue'
import EditorWindow from './gui/tools/editor/EditorWindow.vue'
import TerminalPanel from './gui/tools/terminal/TerminalPanel.vue'
import MobileApp from './gui/mobile/MobileApp.vue'
import { useTabsStore } from './stores/tabs'
import { useWindowManagerStore } from './gui/stores/windowManager'
import type { ToolType } from './gui/types'
import { injectGUITokens } from './gui/design-tokens'
import { registerAllTools, openTool } from './gui'
import { useThemeStore } from './gui/stores/themeStore'

const tabsStore = useTabsStore()
const wmStore = useWindowManagerStore()
const themeStore = useThemeStore()

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
  openTool(item.tool, (config) => {
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

// Touch gesture control
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

// 检查触摸目标是否在终端区域内
const isInsideTerminal = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof Node)) return false
  const terminalContainer = document.getElementById('terminal-container')
  if (terminalContainer && terminalContainer.contains(target)) return true
  
  // 也检查 xterm 的 viewport 和 screen 元素
  const xtermElements = document.querySelectorAll('.xterm, .xterm-viewport, .xterm-screen')
  for (const el of Array.from(xtermElements)) {
    if (el.contains(target)) return true
  }
  
  return false
}

const handleTouchStart = (e: TouchEvent) => {
  // 如果触摸开始在终端区域内，不处理手势
  if (isInsideTerminal(e.target)) {
    isSwiping.value = false
    return
  }
  
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  
  // 如果手势在终端区域内，不处理
  if (isInsideTerminal(e.target)) {
    return
  }

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
  // Initialize theme store FIRST (before any components render)
  themeStore.init()

  // Inject GUI design tokens
  injectGUITokens()

  // Register all GUI tools with the ToolRegistry
  registerAllTools()

  // Initialize tabs store with IndexedDB
  await tabsStore.initialize()

  // Load saved GUI windows
  await wmStore.loadWindowStates()

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
  <!-- MobileApp handles mobile vs desktop routing internally -->
  <MobileApp>
    <!-- Desktop Layout -->
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
  </MobileApp>
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
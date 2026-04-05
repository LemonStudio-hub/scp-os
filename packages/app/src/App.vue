<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import PCNotification from './gui/components/PCNotification.vue'
import MobileApp from './gui/mobile/MobileApp.vue'
import { useTabsStore } from './stores/tabs'
import { useWindowManagerStore } from './gui/stores/windowManager'
import { injectGUITokens } from './gui/design-tokens'
import { registerAllTools, ToolRegistry } from './gui'
import { useThemeStore } from './gui/stores/themeStore'
import { useNotification } from './gui/composables/useNotification'
import { useMobile } from './gui/composables/useMobile'

const tabsStore = useTabsStore()
const wmStore = useWindowManagerStore()
const themeStore = useThemeStore()
const { addNotification } = useNotification()
const mobile = useMobile()

// Performance Dashboard state
const showPerformanceDashboard = ref(false)

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

  // Test notification
  setTimeout(() => {
    addNotification({
      title: '系统通知',
      message: '欢迎使用SCP-OS系统，这是一个测试通知。',
      icon: 'info',
      duration: 5000
    })
  }, 1000)
})

onUnmounted(() => {
  // Nothing to clean up for now
})
</script>

<template>
  <!-- MobileApp handles mobile vs desktop routing internally -->
  <MobileApp>
    <!-- Desktop-only components (only mounted on desktop) -->
    <template v-if="!mobile.isMobile.value">
      <!-- Performance Dashboard -->
      <PerformanceDashboard
        :isVisible="showPerformanceDashboard"
        @close="showPerformanceDashboard = false"
      />

      <!-- GUI Windows rendered via ToolRegistry (dynamic, no hardcoded v-if chain) -->
      <template v-for="win in wmStore.openWindows" :key="win.config.id">
        <!-- Existing tools (FileManagerWindow, EditorWindow, TerminalPanel) have their own window chrome -->
        <!-- They are rendered directly without PCWindow wrapper -->
        <component
          :is="ToolRegistry.get(win.config.tool)?.desktopComponent"
          :window-instance="win"
          :window-id="win.config.id"
        />
      </template>
    </template>

    <!-- System Notifications (always rendered) -->
    <PCNotification />
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

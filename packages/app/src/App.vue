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
import { useI18n } from './gui/composables/useI18n'

const tabsStore = useTabsStore()
const wmStore = useWindowManagerStore()
const themeStore = useThemeStore()
const { addNotification } = useNotification()
const mobile = useMobile()
const { t } = useI18n()

// Performance Dashboard state
const showPerformanceDashboard = ref(false)

// App loading state
const isAppReady = ref(false)
const loadingProgress = ref(0)
const loadingStep = ref('loading.steps.initializing')

onMounted(async () => {
  // Step 1: Initialize theme store
  loadingStep.value = 'loading.steps.themes'
  loadingProgress.value = 10
  themeStore.init()

  // Step 2: Inject GUI design tokens
  loadingStep.value = 'loading.steps.ui'
  loadingProgress.value = 20
  injectGUITokens()

  // Step 3: Register all GUI tools
  loadingStep.value = 'loading.steps.components'
  loadingProgress.value = 30
  registerAllTools()

  // Step 4: Initialize tabs store with IndexedDB
  loadingStep.value = 'loading.steps.data'
  loadingProgress.value = 50
  await tabsStore.initialize()
  loadingProgress.value = 70

  // Step 5: Load saved GUI windows
  loadingStep.value = 'loading.steps.windows'
  await wmStore.loadWindowStates()
  loadingProgress.value = 90

  // Brief delay for visual smoothness
  await new Promise(resolve => setTimeout(resolve, 200))
  loadingProgress.value = 100
  loadingStep.value = 'loading.steps.ready'

  // Final delay before showing app
  await new Promise(resolve => setTimeout(resolve, 300))
  isAppReady.value = true

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
  <!-- App Loading Overlay -->
  <div v-if="!isAppReady" class="app-loading-overlay">
    <div class="app-loading-content">
      <!-- SCP Logo Animation -->
      <div class="app-loading-logo">
        <div class="app-loading-logo-ring"></div>
        <div class="app-loading-logo-ring app-loading-logo-ring--delayed"></div>
        <div class="app-loading-logo-text">SCP</div>
      </div>

      <!-- Loading Text -->
      <div class="app-loading-text">{{ t(loadingStep) }}</div>

      <!-- Progress Bar -->
      <div class="app-loading-progress">
        <div class="app-loading-progress-bar">
          <div class="app-loading-progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <div class="app-loading-progress-percent">{{ loadingProgress }}%</div>
      </div>

      <!-- Loading Dots Animation -->
      <div class="app-loading-dots">
        <div class="app-loading-dot"></div>
        <div class="app-loading-dot"></div>
        <div class="app-loading-dot"></div>
      </div>
    </div>
  </div>

  <!-- MobileApp handles mobile vs desktop routing internally -->
  <MobileApp :class="{ 'app-loaded': isAppReady }">
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

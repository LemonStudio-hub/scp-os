<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import PCNotification from './gui/components/PCNotification.vue'
import ErrorBoundary from './gui/components/ErrorBoundary.vue'
import MobileApp from './gui/mobile/MobileApp.vue'
import LoginScreen from './gui/mobile/LoginScreen.vue'
import PCLoginScreen from './gui/desktop/PCLoginScreen.vue'
import { useTabsStore } from './stores/tabs'
import { useWindowManagerStore } from './gui/stores/windowManager'
import { useAuthStore } from './stores/authStore'
import { injectGUITokens } from './gui/design-tokens'
import {
  registerAllTools,
  ToolRegistry,
  useKeyboardShortcutManager,
  registerShortcut,
  setContext,
} from './gui'
import { useThemeStore } from './gui/stores/themeStore'
import { filesystem } from './utils/filesystem'
import { useNotification } from './gui/composables/useNotification'
import { useMobile } from './gui/composables/useMobile'
import { useI18n } from './gui/composables/useI18n'
import CursorEffect from './gui/components/CursorEffect.vue'
import logger from './utils/logger'
import indexedDBService from './utils/indexedDB'

const tabsStore = useTabsStore()
const wmStore = useWindowManagerStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { addNotification } = useNotification()
const mobile = useMobile()
const { t } = useI18n()

// Keyboard shortcut manager
useKeyboardShortcutManager()

// Performance Dashboard state
const showPerformanceDashboard = ref(false)

// App loading state
const isAppReady = ref(false)
const loadingProgress = ref(0)
const loadingStep = ref('loading.steps.initializing')

onMounted(() => {
  // Safety timeout: force show app after 3s even if init hangs
  const forceReady = setTimeout(() => {
    if (!isAppReady.value) {
      logger.warn('[App] Initialization timeout, forcing app ready')
      isAppReady.value = true
    }
  }, 3000)

  ;(async () => {
    try {
      // Step 1: Inject GUI design tokens (inject baseline design system variables first)
      loadingStep.value = 'loading.steps.ui'
      loadingProgress.value = 10
      injectGUITokens()

      // Step 2: Initialize theme store (so active theme colors correctly override baseline variables)
      loadingStep.value = 'loading.steps.themes'
      loadingProgress.value = 20
      themeStore.init()

      // Step 3: Register all GUI tools
      loadingStep.value = 'loading.steps.components'
      loadingProgress.value = 30
      registerAllTools()

      // Step 4: Initialize IndexedDB first (required by all data operations)
      loadingStep.value = 'loading.steps.data'
      loadingProgress.value = 45
      await indexedDBService.init()

      // Step 5: Load tabs, window states, and filesystem in parallel
      loadingProgress.value = 50
      await Promise.all([tabsStore.initialize(), wmStore.loadWindowStates(), filesystem.init()])
      loadingProgress.value = 90

      // Step 6: Auth initialization
      loadingStep.value = 'loading.steps.auth'
      loadingProgress.value = 95
      await authStore.initAuth()

      // Loading complete
      loadingProgress.value = 100
      loadingStep.value = 'loading.steps.ready'
      isAppReady.value = true
    } catch (error) {
      logger.error('[App] Failed to initialize:', error)
      isAppReady.value = true
    } finally {
      clearTimeout(forceReady)
    }
  })()

  // Register global keyboard shortcuts
  setContext('global')

  // Ctrl+Shift+T: New terminal tab
  registerShortcut({
    id: 'global-new-terminal',
    keys: 'Ctrl+Shift+T',
    description: '打开新终端',
    category: 'global',
    handler: () => {
      const terminal = ToolRegistry.get('terminal')
      if (terminal) {
        import('./gui/registry/ToolRegistry')
          .then(({ openTool }) => {
            openTool(
              'terminal',
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
              undefined,
              wmStore.openWindows.map((win) => win.config.id)
            )
          })
          .catch((err) => {
            logger.warn('[App] Failed to import ToolRegistry:', err)
          })
      }
    },
  })

  // Ctrl+W: Close focused window
  registerShortcut({
    id: 'global-close-window',
    keys: 'Ctrl+W',
    description: '关闭当前窗口',
    category: 'global',
    handler: () => {
      const openWindows = wmStore.openWindows
      if (openWindows.length > 0) {
        const lastWindow = openWindows[openWindows.length - 1]
        wmStore.closeWindow(lastWindow.config.id)
      }
    },
  })

  // F11: Toggle fullscreen (browser native)
  registerShortcut({
    id: 'global-fullscreen',
    keys: 'F11',
    description: '切换全屏',
    category: 'global',
    handler: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          logger.warn('[App] Failed to request fullscreen:', err)
        })
      } else {
        document.exitFullscreen().catch((err) => {
          logger.warn('[App] Failed to exit fullscreen:', err)
        })
      }
    },
  })

  // Ctrl+Shift+P: Toggle Performance Dashboard
  registerShortcut({
    id: 'global-performance-dashboard',
    keys: 'Ctrl+Shift+P',
    description: '切换性能面板',
    category: 'global',
    handler: () => {
      showPerformanceDashboard.value = !showPerformanceDashboard.value
    },
  })

  // Test notification
  setTimeout(() => {
    addNotification({
      title: '系统通知',
      message: '欢迎使用SCP-OS系统，这是一个测试通知。',
      icon: 'info',
      duration: 5000,
    })
  }, 1000)
})

/**
 * Handle successful login
 * Called when user completes login from LoginScreen or PCLoginScreen
 */
function handleLoginSuccess(): void {
  logger.info('[App] User logged in successfully, transitioning to main interface')
}
</script>

<template>
  <CursorEffect />

  <!-- App Loading Overlay -->
  <div
    v-show="!isAppReady"
    class="app-loading-overlay"
    role="status"
    aria-live="polite"
    aria-label="应用加载中"
  >
    <div class="app-loading-content">
      <!-- SCP Logo Animation -->
      <div class="app-loading-logo" aria-hidden="true">
        <div class="app-loading-logo-ring"></div>
        <div class="app-loading-logo-ring app-loading-logo-ring--delayed"></div>
        <div class="app-loading-logo-text">SCP</div>
      </div>

      <!-- Loading Text -->
      <div class="app-loading-text" aria-live="polite">{{ t(loadingStep) }}</div>

      <!-- Progress Bar -->
      <div
        class="app-loading-progress"
        role="progressbar"
        :aria-valuenow="loadingProgress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="加载进度"
      >
        <div class="app-loading-progress-bar">
          <div class="app-loading-progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <div class="app-loading-progress-percent">{{ loadingProgress }}%</div>
      </div>

      <!-- Loading Dots Animation -->
      <div class="app-loading-dots" aria-hidden="true">
        <div class="app-loading-dot"></div>
        <div class="app-loading-dot"></div>
        <div class="app-loading-dot"></div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div v-show="isAppReady" class="app-content">
    <!-- Login Screen -->
    <div v-if="!authStore.isLoggedIn" class="login-wrapper">
      <LoginScreen
        v-if="mobile.isMobile.value"
        key="mobile-login"
        @login-success="handleLoginSuccess"
      />
      <PCLoginScreen v-else key="desktop-login" @login-success="handleLoginSuccess" />
    </div>

    <!-- Main App -->
    <div v-else class="main-wrapper">
      <MobileApp key="main-app" :class="{ 'app-loaded': true }">
        <!-- Desktop-only components -->
        <template v-if="!mobile.isMobile.value">
          <PerformanceDashboard
            :is-visible="showPerformanceDashboard"
            @close="showPerformanceDashboard = false"
          />

          <template v-for="win in wmStore.openWindows" :key="win.config.id">
            <ErrorBoundary :label="win.config.tool">
              <component
                :is="ToolRegistry.get(win.config.tool)?.desktopComponent"
                :window-instance="win"
                :window-id="win.config.id"
              />
            </ErrorBoundary>
          </template>
        </template>

        <PCNotification />
      </MobileApp>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--gui-bg-base, #000000);
  color: var(--gui-text-primary, #ffffff);
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  padding-bottom: 48px;
}

.app-content {
  width: 100%;
  height: 100%;
}

.login-wrapper,
.main-wrapper {
  width: 100%;
  height: 100%;
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import PCNotification from './gui/components/PCNotification.vue'
import MobileApp from './gui/mobile/MobileApp.vue'
import LoginScreen from './gui/mobile/LoginScreen.vue'
import PCLoginScreen from './gui/desktop/PCLoginScreen.vue'
import { useTabsStore } from './stores/tabs'
import { useWindowManagerStore } from './gui/stores/windowManager'
import { useAuthStore } from './stores/authStore'
import { injectGUITokens } from './gui/design-tokens'
import { registerAllTools, ToolRegistry, useKeyboardShortcutManager, registerShortcut, setContext } from './gui'
import { useThemeStore } from './gui/stores/themeStore'
import { useNotification } from './gui/composables/useNotification'
import { useMobile } from './gui/composables/useMobile'
import { useI18n } from './gui/composables/useI18n'

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

// Auth state
const isAuthReady = ref(false)

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

  // Step 6: Initialize authentication state
  loadingStep.value = 'loading.steps.auth'
  await authStore.initAuth()
  isAuthReady.value = true

  // Register global keyboard shortcuts
  setContext('global')

  // Ctrl+T: New terminal tab
  registerShortcut({
    id: 'global-new-terminal',
    keys: 'Ctrl+Shift+T',
    description: '打开新终端',
    category: 'global',
    handler: () => {
      const terminal = ToolRegistry.get('terminal')
      if (terminal) {
        import('./gui/registry/ToolRegistry').then(({ openTool }) => {
          openTool('terminal', (config) => {
            wmStore.openWindow({
              id: config.id,
              tool: config.tool,
              title: config.title,
              iconName: config.iconName,
              width: config.width,
              height: config.height,
            })
          })
        }).catch(() => {
          // Silently handle import errors
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
        document.documentElement.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
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
      duration: 5000
    })
  }, 1000)
})

onUnmounted(() => {
  // Nothing to clean up for now
})

/**
 * Handle successful login
 * Called when user completes login from LoginScreen or PCLoginScreen
 */
function handleLoginSuccess(): void {
  // The authStore.isLoggedIn is already set to true by the login action
  // This function can be extended for additional post-login logic
  console.log('[App] User logged in successfully, transitioning to main interface')
}
</script>

<template>
  <!-- App Loading Overlay -->
  <div v-if="!isAppReady || !isAuthReady" class="app-loading-overlay">
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

  <!-- Login Screen (shown when auth is ready but user not logged in) -->
  <transition name="fade" mode="out-in">
    <template v-if="isAuthReady && !authStore.isLoggedIn">
      <LoginScreen
        v-if="mobile.isMobile.value"
        key="mobile-login"
        @login-success="handleLoginSuccess"
      />
      <PCLoginScreen
        v-else
        key="desktop-login"
        @login-success="handleLoginSuccess"
      />
    </template>

    <!-- Main App (shown when user is logged in) -->
    <template v-else-if="isAuthReady && authStore.isLoggedIn">
      <MobileApp key="main-app" :class="{ 'app-loaded': true }">
        <!-- Desktop-only components (only mounted on desktop) -->
        <template v-if="!mobile.isMobile.value">
          <!-- Performance Dashboard -->
          <PerformanceDashboard
            :is-visible="showPerformanceDashboard"
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
  </transition>
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

/* ── Fade Transition for Login/Main App Switching ──────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>

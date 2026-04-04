<template>
  <div ref="homeRef" class="home-screen">
    <!-- Status Bar -->
    <div class="home-screen__status-bar">
      <span class="home-screen__status-time">{{ currentTime }}</span>
      <div class="home-screen__status-icons">
        <!-- Signal -->
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" class="home-screen__icon">
          <rect x="0" y="8" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="5" width="3" height="7" rx="0.5"/>
          <rect x="9" y="2" width="3" height="10" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.2"/>
        </svg>
        <!-- WiFi -->
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.5" class="home-screen__icon">
          <path d="M1.5 4.5C4 1.5 12 1.5 14.5 4.5"/>
          <path d="M4.5 7.5C6 5.5 10 5.5 11.5 7.5"/>
          <path d="M7 10.5C7.5 9.5 8.5 9.5 9 10.5"/>
        </svg>
        <!-- Battery -->
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" class="home-screen__icon">
          <rect x="0.5" y="0.5" width="20" height="11" rx="2" stroke="currentColor" stroke-opacity="0.35"/>
          <rect x="21.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" fill-opacity="0.4"/>
          <rect x="2" y="2" width="14" height="8" rx="1" :fill="batteryColor"/>
        </svg>
      </div>
    </div>

    <!-- Wallpaper -->
    <div class="home-screen__wallpaper">
      <div class="home-screen__wallpaper-gradient" />
      <div class="home-screen__wallpaper-pattern">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="400" r="180" stroke="rgba(233,69,96,0.06)" stroke-width="1"/>
          <circle cx="200" cy="400" r="120" stroke="rgba(233,69,96,0.04)" stroke-width="1"/>
          <circle cx="200" cy="400" r="60" stroke="rgba(233,69,96,0.03)" stroke-width="1"/>
          <line x1="0" y1="400" x2="400" y2="400" stroke="rgba(233,69,96,0.03)" stroke-width="0.5"/>
          <line x1="200" y1="0" x2="200" y2="800" stroke="rgba(233,69,96,0.03)" stroke-width="0.5"/>
        </svg>
      </div>
    </div>

    <!-- App Grid -->
    <div class="home-screen__grid gui-stagger">
      <button
        v-for="app in apps"
        :key="app.id"
        class="home-screen__app"
        @click="onAppTap(app)"
      >
        <div class="home-screen__app-icon" :class="`home-screen__app-icon--${app.id}`">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="app.id === 'terminal'" d="M4 17L10 11L4 5M12 19h8"/>
            <path v-else-if="app.id === 'files'" d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"/>
            <path v-else-if="app.id === 'settings'" d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <span class="home-screen__app-label">{{ app.label }}</span>
      </button>
    </div>

    <!-- Home Indicator -->
    <div class="home-screen__home-indicator" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useHammer } from '../composables/useHammer'

export interface HomeApp {
  id: string
  label: string
  tool: string
  color: string
}

const apps: HomeApp[] = [
  { id: 'terminal', label: 'Terminal', tool: 'terminal', color: 'var(--gui-app-icon-terminal-to, #e94560)' },
  { id: 'files', label: 'Files', tool: 'filemanager', color: 'var(--gui-app-icon-files-to, #60a5fa)' },
  { id: 'settings', label: 'Settings', tool: 'settings', color: 'var(--gui-text-secondary, #a0a0a0)' },
]

const emit = defineEmits<{
  launch: [app: HomeApp]
}>()

const homeRef = ref<HTMLDivElement | null>(null)
const currentTime = ref('')

const batteryColor = computed(() => 'var(--gui-status-bar-battery, #34d399)')

// Hammer.js gesture setup
const { setup: setupGestures } = useHammer(homeRef, {
  swipeThreshold: 60,
  swipeVelocity: 0.4,
  directions: ['swipe', 'tap'],
})

function updateTime(): void {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  })
}

function onAppTap(app: HomeApp): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15)
  }
  emit('launch', app)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 10000)
  setupGestures()
})
</script>

<style scoped>
/* ── Home Screen ───────────────────────────────────────────────────── */
.home-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: var(--gui-font-sans);
  -webkit-tap-highlight-color: transparent;
}

/* ── Status Bar ─────────────────────────────────────────────────────── */
.home-screen__status-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--gui-spacing-xl, 24px);
  padding-top: var(--gui-status-bar-padding-top, max(12px, env(safe-area-inset-top, 12px)));
  height: var(--gui-dim-status-bar-height, 44px);
  color: var(--gui-status-bar-text, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.home-screen__status-icons {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  color: var(--gui-status-bar-text, #f0f0f0);
}

.home-screen__icon {
  display: flex;
  align-items: center;
}

/* ── Wallpaper ─────────────────────────────────────────────────────── */
.home-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--gui-wallpaper-base, #060606);
  overflow: hidden;
}

.home-screen__wallpaper-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1, rgba(139, 0, 0, 0.15)) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2, rgba(233, 69, 96, 0.08)) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3, rgba(96, 165, 250, 0.05)) 0%, transparent 40%);
}

.home-screen__wallpaper-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}

/* ── App Grid ───────────────────────────────────────────────────────── */
.home-screen__grid {
  position: relative;
  z-index: 5;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--gui-spacing-4xl, 60px) var(--gui-spacing-xl, 24px) 0;
  gap: var(--gui-dim-home-screen-grid-gap, 32px);
}

.home-screen__app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1));
}

.home-screen__app:active {
  transform: scale(0.88);
}

.home-screen__app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--gui-dim-home-screen-icon-size, 60px);
  height: var(--gui-dim-home-screen-icon-size, 60px);
  border-radius: var(--gui-dim-home-screen-icon-radius, 14px);
  color: var(--gui-text-inverse, #ffffff);
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.home-screen__app-icon--terminal {
  background: linear-gradient(135deg, var(--gui-app-icon-terminal-from, #8b0000), var(--gui-app-icon-terminal-to, #e94560));
}

.home-screen__app-icon--files {
  background: linear-gradient(135deg, var(--gui-app-icon-files-from, #1e3a5f), var(--gui-app-icon-files-to, #60a5fa));
}

.home-screen__app-icon--settings {
  background: linear-gradient(135deg, var(--gui-app-icon-settings-from, #3a3a3a), var(--gui-app-icon-settings-to, #6a6a6a));
}

.home-screen__app:hover .home-screen__app-icon {
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transform: scale(1.04);
}

.home-screen__app-label {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-status-bar-text, #f0f0f0);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
}

/* ── Home Indicator ────────────────────────────────────────────────── */
.home-screen__home-indicator {
  position: relative;
  z-index: 10;
  width: var(--gui-dim-home-indicator-width, 134px);
  height: var(--gui-dim-home-indicator-height, 5px);
  margin: 0 auto;
  margin-bottom: max(var(--gui-spacing-sm, 8px), env(safe-area-inset-bottom, 8px));
  background: var(--gui-home-indicator, rgba(255, 255, 255, 0.3));
  border-radius: var(--gui-radius-full, 9999px);
}
</style>

<template>
  <div ref="homeRef" class="home-screen" :style="homeScreenThemeStyles">
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
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <circle cx="200" cy="400" r="180" :stroke="wallpaperPatternColor1" stroke-width="1"/>
          <circle cx="200" cy="400" r="120" :stroke="wallpaperPatternColor2" stroke-width="1"/>
          <circle cx="200" cy="400" r="60" :stroke="wallpaperPatternColor3" stroke-width="1"/>
          <line x1="0" y1="400" x2="400" y2="400" :stroke="wallpaperPatternColor3" stroke-width="0.5"/>
          <line x1="200" y1="0" x2="200" y2="800" :stroke="wallpaperPatternColor3" stroke-width="0.5"/>
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
        <div class="home-screen__app-icon" :class="`home-screen__app-icon--${app.id}`"
             :style="iconGradientStyle">
          <template v-if="app.id === 'terminal'">
            <span class="home-screen__app-icon--terminal-text">&gt;_</span>
          </template>
          <template v-else-if="app.id === 'files'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
          </template>
          <template v-else-if="app.id === 'settings'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </template>
          <template v-else-if="app.id === 'chat'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
          </template>
          <template v-else-if="app.id === 'dash'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1"/>
              <rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="14" y="12" width="7" height="9" rx="1"/>
              <rect x="3" y="16" width="7" height="5" rx="1"/>
            </svg>
          </template>
          <template v-else-if="app.id === 'feedback'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="13" y2="13"/>
            </svg>
          </template>
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
import { useThemeStore } from '../stores/themeStore'

export interface HomeApp {
  id: string
  label: string
  tool: string
  color: string
}

const apps: HomeApp[] = [
  { id: 'terminal', label: 'Terminal', tool: 'terminal', color: 'var(--gui-accent)' },
  { id: 'files', label: 'Files', tool: 'filemanager', color: 'var(--gui-accent)' },
  { id: 'chat', label: 'Chat', tool: 'chat', color: 'var(--gui-accent)' },
  { id: 'dash', label: 'Dash', tool: 'dash', color: 'var(--gui-accent)' },
  { id: 'feedback', label: 'Feedback', tool: 'feedback', color: 'var(--gui-accent)' },
  { id: 'settings', label: 'Settings', tool: 'settings', color: 'var(--gui-accent)' },
]

const emit = defineEmits<{
  launch: [app: HomeApp]
}>()

const homeRef = ref<HTMLDivElement | null>(null)
const currentTime = ref('')
const themeStore = useThemeStore()
themeStore.init()

const batteryColor = computed(() => themeStore.currentTheme.colors.statusBarBattery)

// Computed styles for theme-reactive properties
const homeScreenThemeStyles = computed(() => ({
  '--home-bg': themeStore.currentTheme.colors.bgBase,
  '--home-text': themeStore.currentTheme.colors.statusBarText,
  '--home-accent': themeStore.currentTheme.colors.accent,
}))

const wallpaperPatternColor1 = computed(() => themeStore.currentTheme.colors.wallpaperGradient1)
const wallpaperPatternColor2 = computed(() => themeStore.currentTheme.colors.wallpaperGradient2)
const wallpaperPatternColor3 = computed(() => themeStore.currentTheme.colors.wallpaperGradient3)

const iconGradientStyle = computed(() => ({
  background: `linear-gradient(135deg, ${themeStore.currentTheme.colors.appIconFrom}, ${themeStore.currentTheme.colors.appIconTo})`,
}))

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
/* Home screen uses CSS variables exclusively for theme support */
.home-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--home-bg, #000000);
}

.home-screen__status-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--gui-spacing-xl, 24px);
  padding-top: var(--gui-status-bar-padding-top, max(12px, env(safe-area-inset-top, 12px)));
  height: var(--gui-dim-status-bar-height, 44px);
  color: var(--home-text, #FFFFFF);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.home-screen__status-icons {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  color: var(--home-text, #FFFFFF);
}

.home-screen__icon {
  display: flex;
  align-items: center;
}

/* Wallpaper */
.home-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--home-bg, #000000);
  overflow: hidden;
}

.home-screen__wallpaper-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3) 0%, transparent 40%);
}

.home-screen__wallpaper-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}

/* App Grid - 响应式网格布局 */
.home-screen__grid {
  position: relative;
  z-index: 5;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  padding: var(--gui-spacing-4xl, 60px) var(--gui-spacing-xl, 24px) 0;
  gap: var(--gui-spacing-2xl, 28px) var(--gui-dim-home-screen-grid-gap, 32px);
  overflow-y: auto;
}

.home-screen__app {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 72px;
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
  color: var(--gui-text-inverse, #FFFFFF);
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.home-screen__app-icon svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.home-screen__app-icon--terminal-text {
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", "Fira Code", "SF Mono", Consolas, monospace);
  font-size: 28px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: var(--gui-text-inverse, #FFFFFF);
  letter-spacing: -1px;
  line-height: 1;
}

.home-screen__app:hover .home-screen__app-icon {
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transform: scale(1.04);
}

.home-screen__app-label {
  width: 100%;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--home-text, #FFFFFF);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Home Indicator */
.home-screen__home-indicator {
  position: relative;
  z-index: 10;
  width: var(--gui-dim-home-indicator-width, 134px);
  height: var(--gui-dim-home-indicator-height, 5px);
  margin: 0 auto;
  margin-bottom: max(var(--gui-spacing-sm, 8px), env(safe-area-inset-bottom, 8px));
  background: var(--gui-home-indicator);
  border-radius: var(--gui-radius-full, 9999px);
}

@media (max-width: 768px) {
  .home-screen__status-bar {
    height: 48px;
  }

  .home-screen__grid {
    padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-lg, 20px) 0;
    gap: 24px 28px;
  }

  .home-screen__app {
    width: 68px;
  }

  .home-screen__app-icon {
    width: 56px;
    height: 56px;
  }
}

@media (max-width: 480px) {
  .home-screen__grid {
    padding: var(--gui-spacing-2xl, 40px) var(--gui-spacing-md, 16px) 0;
    gap: 20px 24px;
  }

  .home-screen__app {
    width: 64px;
  }

  .home-screen__app-icon {
    width: 52px;
    height: 52px;
  }

  .home-screen__app-label {
    font-size: 10px;
  }
}
</style>

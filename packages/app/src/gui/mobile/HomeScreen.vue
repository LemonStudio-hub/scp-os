<template>
  <div ref="homeRef" class="home-screen">
    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-bar__time">{{ currentTime }}</span>
      <div class="status-bar__indicators">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="5" width="3" height="7" rx="0.5"/>
          <rect x="9" y="2" width="3" height="10" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.2"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 4.5C4 1.5 12 1.5 14.5 4.5"/>
          <path d="M4.5 7.5C6 5.5 10 5.5 11.5 7.5"/>
          <path d="M7 10.5C7.5 9.5 8.5 9.5 9 10.5"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="20" height="11" rx="2" stroke="currentColor" stroke-opacity="0.35"/>
          <rect x="21.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" fill-opacity="0.4"/>
          <rect x="2" y="2" width="14" height="8" rx="1" fill="#34d399"/>
        </svg>
      </div>
    </div>

    <!-- Wallpaper -->
    <div class="home-screen__wallpaper">
      <div class="wallpaper__gradient" />
      <div class="wallpaper__pattern">
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
    <div class="home-screen__grid">
      <button
        v-for="app in apps"
        :key="app.id"
        class="app-icon"
        @click="onAppTap(app)"
      >
        <div class="app-icon" :class="`app-icon--${app.id}`">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="app.id === 'terminal'" d="M4 17L10 11L4 5M12 19h8"/>
            <path v-else-if="app.id === 'files'" d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"/>
            <path v-else-if="app.id === 'settings'" d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <span class="app-label">{{ app.label }}</span>
      </button>
    </div>

    <!-- Home Indicator -->
    <div class="home-indicator" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHammer } from '../composables/useHammer'

export interface HomeApp {
  id: string
  label: string
  tool: string
  color: string
}

const apps: HomeApp[] = [
  { id: 'terminal', label: 'Terminal', tool: 'terminal', color: '#e94560' },
  { id: 'files', label: 'Files', tool: 'filemanager', color: '#60a5fa' },
  { id: 'settings', label: 'Settings', tool: 'settings', color: '#a8a8a8' },
]

const emit = defineEmits<{
  launch: [app: HomeApp]
}>()

const homeRef = ref<HTMLDivElement | null>(null)
const currentTime = ref('')

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
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
}

/* ── Status Bar ─────────────────────────────────────────────────────── */
.status-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 0;
  padding-top: max(14px, env(safe-area-inset-top, 14px));
  color: #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-bar__indicators {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f0f0f0;
}

/* ── Wallpaper ─────────────────────────────────────────────────────── */
.home-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #060606;
  overflow: hidden;
}

.wallpaper__gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, rgba(139, 0, 0, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 30% 70%, rgba(233, 69, 96, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(96, 165, 250, 0.05) 0%, transparent 40%);
}

.wallpaper__pattern {
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
  padding: 60px 24px 0;
  gap: 32px;
}

.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.app-icon:active {
  transform: scale(0.88);
}

.app-icon__wrapper {
  width: 60px;
  height: 60px;
}

.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  color: #ffffff;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.app-icon--terminal {
  background: linear-gradient(135deg, #8b0000, #e94560);
}

.app-icon--files {
  background: linear-gradient(135deg, #1e3a5f, #60a5fa);
}

.app-icon--settings {
  background: linear-gradient(135deg, #3a3a3a, #6a6a6a);
}

.app-icon:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.app-label {
  font-size: 11px;
  font-weight: 500;
  color: #f0f0f0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
}

/* ── Home Indicator ────────────────────────────────────────────────── */
.home-indicator {
  position: relative;
  z-index: 10;
  width: 134px;
  height: 5px;
  margin: 0 auto 8px;
  margin-bottom: max(8px, env(safe-area-inset-bottom, 8px));
  background: rgba(255, 255, 255, 0.3);
  border-radius: 100px;
}
</style>

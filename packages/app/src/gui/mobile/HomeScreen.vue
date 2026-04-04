<template>
  <div ref="homeRef" class="home-screen bg-[#1C1C1E] relative w-full h-dvh overflow-hidden flex flex-col">
    <!-- SVG Squircle Filter -->
    <svg class="absolute w-0 h-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="squircle" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    </svg>

    <!-- Status Bar -->
    <div class="relative z-10 flex items-center justify-between px-6 pt-3 h-11 text-white text-sm font-semibold tracking-wide"
         style="padding-top: max(12px, env(safe-area-inset-top, 12px));">
      <span>{{ currentTime }}</span>
      <div class="flex items-center gap-1 text-white">
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
          <rect x="2" y="2" width="14" height="8" rx="1" :fill="batteryColor"/>
        </svg>
      </div>
    </div>

    <!-- Wallpaper -->
    <div class="absolute inset-0 z-0 bg-[#1C1C1E] overflow-hidden">
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at 50% 30%, rgba(142,142,147,0.08) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(142,142,147,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(63,63,66,0.03) 0%, transparent 40%);" />
      <div class="absolute inset-0 opacity-50">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <circle cx="200" cy="400" r="180" stroke="rgba(142,142,147,0.06)" stroke-width="1"/>
          <circle cx="200" cy="400" r="120" stroke="rgba(142,142,147,0.04)" stroke-width="1"/>
          <circle cx="200" cy="400" r="60" stroke="rgba(142,142,147,0.03)" stroke-width="1"/>
          <line x1="0" y1="400" x2="400" y2="400" stroke="rgba(142,142,147,0.03)" stroke-width="0.5"/>
          <line x1="200" y1="0" x2="200" y2="800" stroke="rgba(142,142,147,0.03)" stroke-width="0.5"/>
        </svg>
      </div>
    </div>

    <!-- App Grid -->
    <div class="relative z-5 flex-1 flex items-start justify-center pt-[60px] px-6 gap-8 stagger-children">
      <button
        v-for="app in apps"
        :key="app.id"
        class="flex flex-col items-center gap-2 bg-none border-none cursor-pointer select-none -webkit-tap-highlight-color-transparent transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.88]"
        @click="onAppTap(app)"
      >
        <!-- App Icon with squircle radius -->
        <div :class="['home-screen__app-icon flex items-center justify-center w-[60px] h-[60px] rounded-[14px] text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]', `home-screen__app-icon--${app.id}`]">
          <template v-if="app.id === 'terminal'">
            <span class="font-mono text-[28px] font-bold text-[#FFFFFF] tracking-tighter leading-none">&gt;_</span>
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
        </div>
        <span class="text-[11px] font-medium text-white text-shadow-[0_1px_3px_rgba(0,0,0,0.6)] tracking-wide">{{ app.label }}</span>
      </button>
    </div>

    <!-- Home Indicator -->
    <div class="relative z-10 w-[134px] h-[5px] mx-auto mb-2 rounded-full bg-white/30"
         style="margin-bottom: max(8px, env(safe-area-inset-bottom, 8px));" />
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
  { id: 'terminal', label: 'Terminal', tool: 'terminal', color: 'var(--gui-accent, #8E8E93)' },
  { id: 'files', label: 'Files', tool: 'filemanager', color: 'var(--gui-accent, #8E8E93)' },
  { id: 'settings', label: 'Settings', tool: 'settings', color: 'var(--gui-accent, #8E8E93)' },
]

const emit = defineEmits<{
  launch: [app: HomeApp]
}>()

const homeRef = ref<HTMLDivElement | null>(null)
const currentTime = ref('')

const batteryColor = computed(() => 'var(--gui-status-bar-battery, #34C759)')

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
/* App icon frosted glass dark gray gradient */
.home-screen__app-icon {
  background: linear-gradient(135deg, var(--gui-app-icon-from, #4A4A4C), var(--gui-app-icon-to, #636366));
}

.home-screen__app-icon:hover {
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transform: scale(1.04);
}

/* Staggered entrance animation */
.stagger-children > * {
  animation: ios-fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 30ms; }
.stagger-children > *:nth-child(3) { animation-delay: 60ms; }

@keyframes ios-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .home-screen__app-icon {
    width: 56px;
    height: 56px;
  }
}

@media (max-width: 480px) {
  .home-screen__app-icon {
    width: 52px;
    height: 52px;
  }
}
</style>

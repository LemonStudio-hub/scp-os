<template>
  <div ref="homeRef" class="home-screen" :style="homeScreenThemeStyles">
    <!-- Status Bar -->
    <div class="home-screen__status-bar">
      <span class="home-screen__status-time">{{ currentTime }}</span>
      <div class="home-screen__status-icons">
        <!-- Latency indicator (leftmost) -->
        <div class="home-screen__latency-wrap" @click.stop="onLatencyTap">
          <span class="home-screen__latency-badge" :style="{ color: latencyTipColor }">
            {{ latencyDisplay }}
          </span>
          <Transition name="latency-fade">
            <div v-if="showLatencyPopup" class="home-screen__latency-popup">
              <span class="home-screen__latency-popup__value" :style="{ color: latencyTipColor }">
                {{ latencyDisplay }}
              </span>
              <span class="home-screen__latency-popup__label">{{ latencyLabel }}</span>
            </div>
          </Transition>
        </div>
        <!-- Signal -->
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="currentColor"
          class="home-screen__icon"
        >
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
          <rect x="9" y="2" width="3" height="10" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.2" />
        </svg>
        <!-- WiFi (decorative) -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="home-screen__icon"
        >
          <path d="M0 11a15 15 0 0 1 24 0" />
          <path d="M4 14a10 10 0 0 1 16 0" />
          <path d="M8 17a5 5 0 0 1 8 0" />
          <circle cx="12" cy="20" r="2" fill="currentColor" stroke="none" />
        </svg>
        <!-- Battery -->
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" class="home-screen__icon">
          <rect
            x="0.5"
            y="0.5"
            width="20"
            height="11"
            rx="2"
            stroke="currentColor"
            stroke-opacity="0.35"
          />
          <rect
            x="21.5"
            y="3.5"
            width="2"
            height="5"
            rx="1"
            fill="currentColor"
            fill-opacity="0.4"
          />
          <rect x="2" y="2" width="14" height="8" rx="1" :fill="batteryColor" />
        </svg>
      </div>
    </div>

    <!-- Wallpaper -->
    <div class="home-screen__wallpaper" :class="{ 'has-custom-wallpaper': !!customWallpaperUrl }">
      <!-- Custom wallpaper image -->
      <img
        v-if="customWallpaperUrl"
        :src="customWallpaperUrl"
        class="home-screen__wallpaper-image"
        alt="Custom wallpaper"
        fetchpriority="high"
      />
      <!-- Default gradient overlay -->
      <div class="home-screen__wallpaper-gradient" />
      <!-- SVG pattern overlay -->
      <div class="home-screen__wallpaper-pattern">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <circle cx="200" cy="400" r="180" :stroke="wallpaperPatternColor1" stroke-width="1" />
          <circle cx="200" cy="400" r="120" :stroke="wallpaperPatternColor2" stroke-width="1" />
          <circle cx="200" cy="400" r="60" :stroke="wallpaperPatternColor3" stroke-width="1" />
          <line
            x1="0"
            y1="400"
            x2="400"
            y2="400"
            :stroke="wallpaperPatternColor3"
            stroke-width="0.5"
          />
          <line
            x1="200"
            y1="0"
            x2="200"
            y2="800"
            :stroke="wallpaperPatternColor3"
            stroke-width="0.5"
          />
        </svg>
      </div>
    </div>

    <!-- Jiggle backdrop: tap to exit -->
    <div v-if="isJiggling" class="home-screen__jiggle-backdrop" @click.stop="exitJiggleMode" />

    <!-- Context Menu -->
    <Transition name="ctx-menu-fade">
      <div
        v-if="contextMenuApp"
        class="home-screen__ctx-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <button class="home-screen__ctx-item" @click="onCtxOpen">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          打开
        </button>
        <div class="home-screen__ctx-divider" />
        <button class="home-screen__ctx-item home-screen__ctx-item--danger" @click="onCtxRemove">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
          从主屏幕移除
        </button>
      </div>
    </Transition>

    <!-- App Grid -->
    <TransitionGroup
      tag="div"
      class="home-screen__grid"
      name="app-order"
      @touchstart.passive="onGridLongPressStart"
      @touchend="onGridLongPressEnd"
      @touchmove.passive="onGridLongPressCancel"
      @click.self="isJiggling && exitJiggleMode()"
    >
      <button
        v-for="app in apps"
        :key="app.id"
        :data-app-id="app.id"
        class="home-screen__app"
        :class="{
          'home-screen__app--jiggling': isJiggling && draggingId !== app.id,
          'home-screen__app--dragging': draggingId === app.id,
        }"
        :style="draggingId === app.id ? dragStyle : {}"
        @click="onAppTap(app)"
        @touchstart.passive="(e) => onAppTouchStart(e, app)"
        @touchmove="onAppTouchMove"
        @touchend="onAppTouchEnd"
        @touchcancel="onAppTouchEnd"
      >
        <!-- Delete badge in jiggle mode (hidden for protected apps) -->
        <div
          v-if="isJiggling && !isProtectedApp(app)"
          class="home-screen__app-delete"
          @click.stop="void onDeleteApp(app)"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line
              x1="2"
              y1="2"
              x2="8"
              y2="8"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <line
              x1="8"
              y1="2"
              x2="2"
              y2="8"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div
          class="home-screen__app-icon"
          :class="`home-screen__app-icon--${app.id}`"
          :style="iconGradientStyle"
        >
          <template v-if="app.id === 'terminal'">
            <span class="home-screen__app-icon--terminal-text">&gt;_</span>
          </template>
          <template v-else-if="app.id === 'files'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"
              />
            </svg>
          </template>
          <template v-else-if="app.id === 'settings'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </template>
          <template v-else-if="app.id === 'appmanager'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </template>
          <template v-else-if="app.id === 'chat'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
              />
            </svg>
          </template>
          <template v-else-if="app.id === 'dash'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </template>
          <template v-else-if="app.id === 'feedback'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="13" y2="13" />
            </svg>
          </template>
          <template v-else-if="app.id === 'docs'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
          </template>
          <template v-else-if="app.id === 'editor'">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
            </svg>
          </template>
          <template v-else>
            <span class="home-screen__app-icon--fallback">{{ app.label.slice(0, 1).toUpperCase() }}</span>
          </template>
        </div>
        <span class="home-screen__app-label">{{ app.label }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useHammer } from '../composables/useHammer'
import { useThemeStore } from '../stores/themeStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { useI18n } from '../composables/useI18n'
import { wallpaperService } from '../../utils/wallpaperService'
import { config } from '../../config'
import type { ToolType } from '../types'
import { APP_CATALOG, getInstalledAppTools, uninstallApp } from '../utils/appCatalog'
import { dialogService } from '../composables/useDialog'
import { localAppManager } from '../../platform/apps/local-app-manager'

export interface HomeApp {
  id: string
  label: string
  tool: ToolType
  color: string
}

const { t } = useI18n()
const installedTools = ref<Set<ToolType>>(new Set())

const homeAppLabelKeys: Partial<Record<ToolType, string>> = {
  terminal: 'home.apps.terminal',
  filemanager: 'home.apps.files',
  chat: 'home.apps.chat',
  dash: 'home.apps.dash',
  feedback: 'home.apps.feedback',
  docs: 'home.apps.docs',
  settings: 'home.apps.settings',
  appmanager: 'home.apps.appManager',
  editor: 'home.apps.editor',
}

const prefsStore = usePreferencesStore()

function loadOrder(): string[] {
  if (prefsStore.ready && prefsStore.prefs.homeOrder.length > 0) {
    return [...prefsStore.prefs.homeOrder]
  }
  try {
    return JSON.parse(localStorage.getItem('scp-os-home-order') || '[]')
  } catch {
    return []
  }
}

const customOrder = ref<string[]>(loadOrder())

function saveOrder() {
  prefsStore.set('homeOrder', [...customOrder.value]).catch(() => {
    /* ignore persistence failures */
  })
}

function isLocalAppTool(tool: ToolType): boolean {
  return String(tool).startsWith('local-app:')
}

const baseApps = computed<HomeApp[]>(() => {
  const builtInApps = APP_CATALOG.filter((app) => installedTools.value.has(app.tool)).map((app) => ({
    id: app.id,
    label: t(homeAppLabelKeys[app.tool] ?? app.labelKey),
    tool: app.tool,
    color: 'var(--gui-accent)',
  }))

  const localApps = localAppManager
    .getInstalledApps()
    .filter((app) => app.manifest.runtime === 'iframe-app')
    .map((app) => ({
      id: app.manifest.id,
      label: app.manifest.name,
      tool: app.toolId as ToolType,
      color: 'var(--gui-accent)',
    }))

  return [...builtInApps, ...localApps]
})

// dragOrder: live order during drag (empty = use customOrder)
const dragOrder = ref<string[]>([])

const apps = computed<HomeApp[]>(() => {
  const base = baseApps.value
  const order = dragOrder.value.length > 0 ? dragOrder.value : customOrder.value
  if (order.length === 0) return base
  const ordered = order.map((id) => base.find((a) => a.id === id)).filter(Boolean) as HomeApp[]
  const rest = base.filter((a) => !order.includes(a.id))
  return [...ordered, ...rest]
})

function refreshInstalledApps(): void {
  installedTools.value = getInstalledAppTools()
}

function isProtectedApp(app: HomeApp): boolean {
  return Boolean(APP_CATALOG.find((item) => item.id === app.id)?.protected)
}

const emit = defineEmits<{
  launch: [app: HomeApp]
}>()

const homeRef = ref<HTMLDivElement | null>(null)
const currentTime = ref('')
const customWallpaperUrl = ref<string | null>(null)
const themeStore = useThemeStore()
themeStore.init()

const batteryColor = computed(() => themeStore.currentTheme.colors.statusBarBattery)

// ── Network Latency ──────────────────────────────────────────────────
const isOnline = ref(navigator.onLine)
const backendLatency = ref(0)
const isMeasuring = ref(false)
const showLatencyPopup = ref(false)
let latencyInterval: number | undefined
let latencyPopupTimer: number | undefined

const latencyTipColor = computed(() => {
  if (!isOnline.value) return '#FF3B30'
  const lat = backendLatency.value
  if (lat >= 500 || lat === 9999) return '#FF3B30'
  if (lat >= 200) return '#FF9500'
  if (lat >= 80) return '#8E8E93'
  return '#34C759'
})

const latencyDisplay = computed(() => {
  if (isMeasuring.value) return '···'
  if (!isOnline.value) return '离线'
  if (backendLatency.value === 0) return '--'
  if (backendLatency.value >= 9999) return '超时'
  return `${backendLatency.value}ms`
})

const latencyLabel = computed(() => {
  if (!isOnline.value) return '无网络连接'
  const lat = backendLatency.value
  if (lat >= 9999) return '服务不可达'
  if (lat >= 500) return '信号极差'
  if (lat >= 200) return '信号较差'
  if (lat >= 80) return '信号一般'
  if (lat > 0) return '信号良好'
  return '测量中…'
})

async function measureBackendLatency(): Promise<void> {
  isOnline.value = navigator.onLine
  if (!isOnline.value) {
    backendLatency.value = 0
    return
  }
  if (isMeasuring.value) return
  isMeasuring.value = true
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const start = performance.now()
    await fetch(config.api.workerUrl + '/', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    backendLatency.value = Math.round(performance.now() - start)
  } catch {
    backendLatency.value = 9999
  } finally {
    isMeasuring.value = false
  }
}

function onLatencyTap(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8)
  measureBackendLatency()
  showLatencyPopup.value = true
  clearTimeout(latencyPopupTimer)
  latencyPopupTimer = window.setTimeout(() => {
    showLatencyPopup.value = false
  }, 3000)
}

function closeLatencyPopup(): void {
  showLatencyPopup.value = false
  clearTimeout(latencyPopupTimer)
}

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
  background:
    themeStore.currentTheme.id === 'claude'
      ? '#FAF9F5'
      : `linear-gradient(135deg, ${themeStore.currentTheme.colors.appIconFrom}, ${themeStore.currentTheme.colors.appIconTo})`,
  border: themeStore.currentTheme.id === 'claude' ? '1.5px solid #D97757' : undefined,
  color: themeStore.currentTheme.id === 'claude' ? '#D97757' : undefined,
  boxShadow:
    themeStore.currentTheme.id === 'claude'
      ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.04)'
      : undefined,
}))

useHammer(homeRef, {
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

// ── Jiggle / long-press / drag-reorder ───────────────────────────
const isJiggling = ref(false)
const contextMenuApp = ref<HomeApp | null>(null)
const contextMenuStyle = ref<Record<string, string>>({})

const draggingId = ref<string | null>(null)
const dragStyle = ref<Record<string, string>>({})
const dragOverId = ref<string | null>(null)
// Layout center of the dragging icon in the grid (no transform), used to compute translate offset
let dragLayoutCenterX = 0
let dragLayoutCenterY = 0
let currentTouchX = 0
let currentTouchY = 0
let isReordering = false

// Pending long-press tracking
let pendingApp: HomeApp | null = null
let pendingTouchX = 0
let pendingTouchY = 0
let didDrag = false

let longPressTimer: number | undefined
const LONG_PRESS_MS = 500
const MOVE_CANCEL_PX = 10

function enterJiggleMode(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([12, 30, 12])
  isJiggling.value = true
  contextMenuApp.value = null
}

function exitJiggleMode(): void {
  isJiggling.value = false
  contextMenuApp.value = null
  draggingId.value = null
  dragStyle.value = {}
  dragOverId.value = null
}

// Grid background long press → jiggle mode only
function onGridLongPressStart(e: TouchEvent): void {
  if ((e.target as HTMLElement).closest('.home-screen__app')) return
  longPressTimer = window.setTimeout(enterJiggleMode, LONG_PRESS_MS)
}
function onGridLongPressEnd(): void {
  clearTimeout(longPressTimer)
}
function onGridLongPressCancel(): void {
  clearTimeout(longPressTimer)
}

function updateDragStyle(): void {
  const dx = currentTouchX - dragLayoutCenterX
  const dy = currentTouchY - dragLayoutCenterY
  dragStyle.value = {
    transform: `translate(${dx}px, ${dy}px) scale(1.12)`,
    zIndex: '50',
    opacity: '0.9',
    transition: 'none',
  }
}

function activateDrag(app: HomeApp, touchX: number, touchY: number): void {
  currentTouchX = touchX
  currentTouchY = touchY

  // Capture layout center BEFORE setting draggingId (DOM not yet updated by Vue)
  const btn = document.querySelector<HTMLElement>(`[data-app-id="${app.id}"]`)
  if (btn) {
    const rect = btn.getBoundingClientRect()
    dragLayoutCenterX = rect.left + rect.width / 2
    dragLayoutCenterY = rect.top + rect.height / 2
  }

  draggingId.value = app.id
  didDrag = true
  updateDragStyle()
  dragOrder.value = apps.value.map((a) => a.id)
}

// App icon: unified touch start — merges long-press + drag
function onAppTouchStart(e: TouchEvent, app: HomeApp): void {
  const t0 = e.touches[0]
  pendingTouchX = t0.clientX
  pendingTouchY = t0.clientY
  didDrag = false

  // Already jiggling → start drag immediately, no timer needed
  if (isJiggling.value) {
    activateDrag(app, t0.clientX, t0.clientY)
    return
  }

  pendingApp = app
  longPressTimer = window.setTimeout(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15)
    isJiggling.value = true

    // Position context menu
    const vw = window.innerWidth
    const menuW = 180
    let x = pendingTouchX - menuW / 2
    if (x + menuW > vw - 12) x = vw - menuW - 12
    if (x < 12) x = 12
    contextMenuApp.value = app
    contextMenuStyle.value = { left: `${x}px`, top: `${pendingTouchY + 20}px` }

    // Finger still down → activate drag immediately
    activateDrag(app, pendingTouchX, pendingTouchY)
    pendingApp = null
  }, LONG_PRESS_MS)
}

async function setDragOverAndReorder(targetId: string): Promise<void> {
  if (isReordering || dragOverId.value === targetId) return
  const dragging = draggingId.value
  if (!dragging) return
  isReordering = true
  dragOverId.value = targetId

  const cur = [...dragOrder.value]
  const fromIdx = cur.indexOf(dragging)
  if (fromIdx === -1) {
    isReordering = false
    return
  }

  cur.splice(fromIdx, 1)
  // Find target in the ALREADY-modified array so insert position is exact
  const toIdx = cur.indexOf(targetId)
  if (toIdx !== -1) {
    cur.splice(toIdx, 0, dragging)
    dragOrder.value = cur

    await nextTick()

    // Recalculate layout center by temporarily removing the transform
    const btn = document.querySelector<HTMLElement>(`[data-app-id="${dragging}"]`)
    if (btn) {
      const saved = btn.style.transform
      btn.style.transform = 'none'
      const rect = btn.getBoundingClientRect() // reads pure layout position
      btn.style.transform = saved
      dragLayoutCenterX = rect.left + rect.width / 2
      dragLayoutCenterY = rect.top + rect.height / 2
      updateDragStyle()
    }
  } else {
    // Target not found after removal (edge case) — revert
    cur.splice(fromIdx, 0, dragging)
  }

  isReordering = false
}

function onAppTouchMove(e: TouchEvent): void {
  const t0 = e.touches[0]
  currentTouchX = t0.clientX
  currentTouchY = t0.clientY

  // Still in long-press wait: cancel if moved too far (let scroll happen)
  if (pendingApp) {
    const dx = Math.abs(t0.clientX - pendingTouchX)
    const dy = Math.abs(t0.clientY - pendingTouchY)
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearTimeout(longPressTimer)
      pendingApp = null
    }
    return
  }

  if (!draggingId.value) return
  e.preventDefault()

  if (contextMenuApp.value) contextMenuApp.value = null

  updateDragStyle()

  const el = document.elementFromPoint(t0.clientX, t0.clientY)
  const hoveredBtn = el?.closest('.home-screen__app') as HTMLElement | null
  const hoverApp = hoveredBtn?.dataset.appId
  if (hoverApp && hoverApp !== draggingId.value) {
    void setDragOverAndReorder(hoverApp)
  } else if (!hoverApp) {
    dragOverId.value = null
  }
}

function onAppTouchEnd(): void {
  clearTimeout(longPressTimer)
  pendingApp = null

  if (draggingId.value) {
    // Commit live order if any reorder happened
    if (dragOrder.value.length > 0) {
      customOrder.value = [...dragOrder.value]
      saveOrder()
    }
    dragOrder.value = []
    draggingId.value = null
    dragOverId.value = null
    dragStyle.value = {}
    isReordering = false
  }
}

function onCtxOpen(): void {
  if (!contextMenuApp.value) return
  const app = contextMenuApp.value
  contextMenuApp.value = null
  isJiggling.value = false
  emit('launch', app)
}

function onCtxRemove(): void {
  contextMenuApp.value = null
}

async function onDeleteApp(app: HomeApp): Promise<void> {
  const catalogItem = APP_CATALOG.find((c) => c.id === app.id)
  if (catalogItem?.protected) {
    await dialogService.alert(`"${app.label}" 是系统应用，无法删除。`, '无法删除')
    return
  }

  const first = await dialogService.confirm(`确定要删除 "${app.label}" 吗？`, '删除应用')
  if (!first) return

  const second = await dialogService.confirm(
    `"${app.label}" 将被卸载，应用数据不会保留。确认继续？`,
    '再次确认'
  )
  if (!second) return

  customOrder.value = customOrder.value.filter((id) => id !== app.id)
  saveOrder()
  if (isLocalAppTool(app.tool)) {
    await localAppManager.uninstall(app.id)
  } else {
    uninstallApp(app.tool)
  }
  refreshInstalledApps()
  if (apps.value.length === 0) exitJiggleMode()
}

function onAppTap(app: HomeApp): void {
  if (didDrag) {
    didDrag = false
    return
  }
  if (isJiggling.value) {
    exitJiggleMode()
    return
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15)
  emit('launch', app)
}

onMounted(async () => {
  refreshInstalledApps()
  updateTime()
  setInterval(updateTime, 10000)
  measureBackendLatency()
  latencyInterval = window.setInterval(measureBackendLatency, 20000)
  document.addEventListener('click', closeLatencyPopup)

  // Load custom wallpaper (non-blocking)
  try {
    await wallpaperService.init()
    const url = await wallpaperService.getCurrentWallpaper()
    if (url) customWallpaperUrl.value = url
  } catch {
    // Silently fail - wallpaper is optional
  }

  // Listen for wallpaper changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.addEventListener('wallpaper-changed', async (event: any) => {
    try {
      const wallpaperId = event.detail?.wallpaperId
      if (wallpaperId) {
        const wallpaper = await wallpaperService.getWallpaper(wallpaperId)
        customWallpaperUrl.value = wallpaper?.dataUrl || null
      } else {
        customWallpaperUrl.value = null
      }
    } catch {
      // Silently fail
    }
  })
  window.addEventListener('app-catalog-changed', refreshInstalledApps)
})

onUnmounted(() => {
  window.removeEventListener('app-catalog-changed', refreshInstalledApps)
  if (latencyInterval) clearInterval(latencyInterval)
  clearTimeout(latencyPopupTimer)
  document.removeEventListener('click', closeLatencyPopup)
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
  touch-action: manipulation;
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
  color: var(--home-text, #ffffff);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.home-screen__status-icons {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  color: var(--home-text, #ffffff);
}

.home-screen__icon {
  display: flex;
  align-items: center;
}

/* ── Latency ─────────────────────────────────────────────────────── */
.home-screen__latency-wrap {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  margin-right: 6px;
}

.home-screen__latency-badge {
  font-size: 10px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.3px;
  opacity: 0.85;
}

.home-screen__latency-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--gui-glass-bg-strong, rgba(28, 28, 30, 0.92));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  white-space: nowrap;
  z-index: 100;
}

.home-screen__latency-popup__value {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.3px;
}

.home-screen__latency-popup__label {
  font-size: 10px;
  font-weight: 500;
  color: var(--gui-text-tertiary, rgba(255, 255, 255, 0.4));
  letter-spacing: 0.02em;
}

.latency-fade-enter-active,
.latency-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.latency-fade-enter-from,
.latency-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Wallpaper */
.home-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--home-bg, #000000);
  overflow: hidden;
}

.home-screen__wallpaper-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.3;
  will-change: opacity;
  transform: translateZ(0);
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

/* App Grid - fixed 4-column grid so icons align consistently across screen sizes */
.home-screen__grid {
  position: relative;
  z-index: 5;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-content: flex-start;
  justify-items: center;
  padding: var(--gui-spacing-4xl, 60px) var(--gui-spacing-md, 16px) 0;
  row-gap: var(--gui-spacing-2xl, 28px);
  overflow-y: auto;
}

/* TransitionGroup FLIP：非拖拽 app 移动动画 */
.app-order-move {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.home-screen__app {
  position: relative;
  display: flex;
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
  color: var(--gui-text-inverse, #ffffff);
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

:global(.light:not(.claude) .home-screen__app-icon) {
  background: #ffffff !important;
  border: 1.5px solid #d1d1d6;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 0 0 0.5px rgba(0, 0, 0, 0.02);
}

:global(.light:not(.claude) .home-screen__app-icon svg) {
  stroke: #1c1c1e !important;
}

:global(.light:not(.claude) .home-screen__app-icon--terminal-text) {
  color: #1c1c1e !important;
}

:global(.claude .home-screen__app-icon) {
  background: #faf9f5 !important;
  border: 1.5px solid #d97757;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

:global(.claude .home-screen__app-icon svg) {
  stroke: #d97757 !important;
}

.home-screen__app-icon svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.home-screen__app-icon--terminal-text {
  font-family: var(
    --gui-font-mono,
    'JetBrains Mono',
    'Cascadia Code',
    'Fira Code',
    'SF Mono',
    Consolas,
    monospace
  );
  font-size: 28px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: var(--gui-text-inverse, #ffffff);
  letter-spacing: -1px;
  line-height: 1;
}

:global(.claude .home-screen__app-icon--terminal-text) {
  color: #d97757 !important;
}

.home-screen__app:hover .home-screen__app-icon {
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transform: scale(1.04);
}

:global(.light:not(.claude) .home-screen__app:hover .home-screen__app-icon),
:global(.claude .home-screen__app:hover .home-screen__app-icon) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.home-screen__app-label {
  width: 100%;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--home-text, #ffffff);
  text-align: center;
  text-shadow: 0 1px 3px var(--gui-backdrop-bg, rgba(0, 0, 0, 0.6));
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.light:not(.claude) .home-screen__app-label) {
  text-shadow: none;
  color: #000000;
  font-weight: 600;
}

:global(.claude .home-screen__app-label) {
  width: auto;
  min-width: 64px;
  max-width: 120px;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--gui-glass-bg-strong, rgba(250, 249, 245, 0.96));
  color: var(--gui-text-secondary, #4e4d49);
  text-shadow: none;
  font-weight: 600;
}

/* ── Jiggle Mode ────────────────────────────────────────────────── */
.home-screen__jiggle-backdrop {
  position: absolute;
  inset: 0;
  z-index: 4;
}

@keyframes ios-jiggle {
  0% {
    transform: rotate(-2.5deg) scale(1);
  }
  25% {
    transform: rotate(2.5deg) scale(1);
  }
  50% {
    transform: rotate(-2deg) scale(1);
  }
  75% {
    transform: rotate(2deg) scale(1);
  }
  100% {
    transform: rotate(-2.5deg) scale(1);
  }
}

.home-screen__app--jiggling {
  animation: ios-jiggle 0.48s ease-in-out infinite;
}

.home-screen__app--jiggling:nth-child(2n) {
  animation-delay: 0.1s;
}
.home-screen__app--jiggling:nth-child(3n) {
  animation-delay: 0.2s;
}

.home-screen__app--dragging {
  z-index: 50;
  opacity: 0.85;
  animation: none !important;
  pointer-events: none;
  transition: none !important;
}

.home-screen__app--drag-over {
  transform: scale(0.9);
  opacity: 0.6;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.home-screen__app-delete {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 20px;
  height: 20px;
  background: #1c1c1e;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* ── Context Menu ───────────────────────────────────────────────── */
.home-screen__ctx-menu {
  position: fixed;
  width: 180px;
  background: var(--gui-glass-bg-strong, rgba(30, 30, 32, 0.95));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: 14px;
  overflow: hidden;
  z-index: 20;
}

.home-screen__ctx-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--gui-text-primary, #fff);
  font-size: 14px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.home-screen__ctx-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.home-screen__ctx-item--danger {
  color: #ff453a;
}

.home-screen__ctx-divider {
  height: 0.5px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  margin: 0 12px;
}

.ctx-menu-fade-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ctx-menu-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.ctx-menu-fade-enter-from,
.ctx-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
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
    padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-md, 16px) 0;
    row-gap: 24px;
  }

  .home-screen__app {
    width: 64px;
  }

  .home-screen__app-icon {
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 480px) {
  .home-screen__grid {
    padding: var(--gui-spacing-2xl, 40px) 8px 0;
    row-gap: 20px;
  }

  .home-screen__app {
    width: 58px;
  }

  .home-screen__app-icon {
    width: 48px;
    height: 48px;
  }

  .home-screen__app-label {
    font-size: 10px;
  }
}
</style>

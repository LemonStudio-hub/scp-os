<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<template>
  <div
    ref="taskbarRef"
    class="pc-taskbar fixed bottom-0 left-0 right-0"
    style="z-index: 800"
    @contextmenu.prevent
  >
    <div class="pc-taskbar__container">
      <!-- Start Button -->
      <button class="pc-taskbar__start-btn" @click="$emit('start-click')">
        <GUIIcon :name="'menu'" :size="20" />
        <span class="pc-taskbar__start-label">{{ t('pc.start') }}</span>
      </button>

      <!-- Pinned Apps -->
      <div class="pc-taskbar__pinned">
        <button
          v-for="item in props.items"
          :key="item.id"
          :class="[
            'pc-taskbar__app-btn',
            { 'pc-taskbar__app-btn--disabled': item.disabled },
            { 'pc-taskbar__app-btn--active': isToolOpen(item.tool) },
            { 'pc-taskbar__app-btn--focused': isToolFocused(item.tool) },
          ]"
          :disabled="item.disabled"
          :title="getItemTitle(item)"
          @click="onClick(item)"
          @contextmenu.prevent="onContextMenu($event, item)"
        >
          <GUIIcon :name="item.iconName" :size="20" />
          <span v-if="getWindowCount(item.tool) > 1" class="pc-taskbar__app-count">
            {{ getWindowCount(item.tool) }}
          </span>
        </button>
      </div>

      <!-- System Tray -->
      <div class="pc-taskbar__tray">
        <button
          class="pc-taskbar__tray-item pc-taskbar__notif-btn"
          :title="t('app.notification')"
          @click="openNotifications"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span v-if="notifStore.hasUnread" class="pc-taskbar__notif-badge">{{
            notifStore.unreadCount
          }}</span>
        </button>
        <div
          class="pc-taskbar__tray-item pc-taskbar__wifi"
          @click="measureBackendLatency"
          @mouseenter="showLatencyTooltip = true"
          @mouseleave="showLatencyTooltip = false"
        >
          <!-- Latency tooltip -->
          <Transition name="latency-fade">
            <div v-if="showLatencyTooltip" class="pc-taskbar__latency-tip">
              <div class="pc-taskbar__latency-tip__value" :style="{ color: latencyTipColor }">
                {{ latencyDisplay }}
              </div>
              <div class="pc-taskbar__latency-tip__label">
                {{ latencyLabel }}
              </div>
              <div class="pc-taskbar__latency-tip__debug">
                {{ latencyDebug }}
              </div>
            </div>
          </Transition>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            :stroke="wifiColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- Offline: cross through wifi -->
            <template v-if="!isOnline">
              <path d="M0 11a15 15 0 0 1 24 0" />
              <path d="M4 14a10 10 0 0 1 16 0" />
              <path d="M8 17a5 5 0 0 1 8 0" />
              <line x1="2" y1="2" x2="22" y2="22" />
              <circle cx="12" cy="20" r="2" :fill="wifiColor" stroke="none" />
            </template>
            <!-- Online: signal bars based on latency -->
            <template v-else>
              <path v-if="wifiBars >= 3" d="M0 11a15 15 0 0 1 24 0" />
              <path v-if="wifiBars >= 2" d="M4 14a10 10 0 0 1 16 0" />
              <path v-if="wifiBars >= 1" d="M8 17a5 5 0 0 1 8 0" />
              <circle cx="12" cy="20" r="2" :fill="wifiColor" stroke="none" />
            </template>
          </svg>
        </div>
        <div class="pc-taskbar__tray-item pc-taskbar__battery" :title="batteryTitle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <!-- Battery body -->
            <rect
              x="2"
              y="6"
              width="18"
              height="12"
              rx="2"
              :stroke="batteryColor"
              stroke-width="1.5"
            />
            <!-- Battery cap -->
            <rect x="20" y="9" width="2" height="6" rx="1" :fill="batteryColor" />
            <!-- Battery fill -->
            <rect
              v-if="batteryLevel > 0"
              x="4"
              y="8"
              :width="Math.max(1.5, batteryLevel * 14)"
              height="8"
              rx="1"
              :fill="batteryColor"
            />
            <!-- Charging bolt -->
            <path
              v-if="batteryCharging"
              d="M11 8l-2 4h3l-1 4 4-5h-3l2-3"
              :fill="batteryColor"
              stroke="none"
              style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))"
            />
          </svg>
        </div>
        <div class="pc-taskbar__tray-item pc-taskbar__time">
          <span class="pc-taskbar__time-text">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useNotificationStore } from '../../stores/notificationStore'
import { useWindowManagerStore } from '../stores/windowManager'
import { ToolRegistry } from '../registry/ToolRegistry'
import { config } from '../../config'
import type { ToolType } from '../types'
import type { IconName } from '../icons'
import GUIIcon from './ui/GUIIcon.vue'

const { t } = useI18n()
const notifStore = useNotificationStore()
const windowManager = useWindowManagerStore()

const taskbarRef = ref<HTMLElement | null>(null)

defineExpose({ taskbarRef })

export interface PCTaskbarItem {
  id: string
  tool: ToolType
  label: string
  iconName: IconName
  disabled?: boolean
}

interface Props {
  items?: PCTaskbarItem[]
  activeTools?: ToolType[]
}

// Default values are defined INLINE inside the factory function to avoid
// TDZ errors. defineProps() is a compile-time macro that gets hoisted,
// so referencing any <script setup> variable in default factories causes
// a Temporal Dead Zone error at runtime.
const props = withDefaults(defineProps<Props>(), {
  items: () => [
    {
      id: 'terminal',
      tool: 'terminal' as ToolType,
      label: 'app.terminal',
      iconName: 'terminal' as IconName,
    },
    {
      id: 'files',
      tool: 'filemanager' as ToolType,
      label: 'app.files',
      iconName: 'folder' as IconName,
    },
    { id: 'editor', tool: 'editor' as ToolType, label: 'app.editor', iconName: 'edit' as IconName },
  ],
  activeTools: () => [],
})

const emit = defineEmits<{
  launch: [item: PCTaskbarItem]
  'start-click': []
  'item-contextmenu': [event: MouseEvent, item: PCTaskbarItem]
}>()

const taskbarWindows = computed(() => windowManager.openWindows)

function getWindowsForTool(tool: ToolType) {
  return taskbarWindows.value.filter((win) => win.config.tool === tool)
}

function getWindowCount(tool: ToolType): number {
  return getWindowsForTool(tool).length
}

function isToolOpen(tool: ToolType): boolean {
  return getWindowCount(tool) > 0 || props.activeTools.includes(tool)
}

function isToolFocused(tool: ToolType): boolean {
  return getWindowsForTool(tool).some((win) => win.focused && !win.minimized)
}

function getItemLabel(item: PCTaskbarItem): string {
  return t(item.label)
}

function getItemTitle(item: PCTaskbarItem): string {
  const label = getItemLabel(item)
  const count = getWindowCount(item.tool)
  return count > 1 ? `${label} (${count})` : label
}

function focusOrRestoreWindow(windowId: string): void {
  const win = windowManager.getWindow(windowId)
  if (!win) return

  if (win.minimized) {
    windowManager.restoreWindow(windowId)
  } else {
    windowManager.focusWindow(windowId)
  }
}

const currentTime = ref('')
let timeInterval: number | undefined

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Network / Backend latency state
const isOnline = ref(navigator.onLine)
const backendLatency = ref<number>(0)
const isMeasuring = ref(false)
const showLatencyTooltip = ref(false)
let latencyInterval: number | undefined

const wifiBars = computed(() => {
  if (!isOnline.value) return 0
  const lat = backendLatency.value
  if (lat === 0) return 3
  if (lat < 80) return 3
  if (lat < 200) return 2
  if (lat < 500) return 1
  return 1
})

const wifiColor = computed(() => {
  if (!isOnline.value) return 'var(--gui-error, #FF3B30)'
  const lat = backendLatency.value
  if (lat >= 500) return 'var(--gui-error, #FF3B30)'
  if (lat >= 200) return 'var(--gui-warning, #FF9500)'
  return 'var(--gui-text-secondary, #8e8e93)'
})

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
  if (!isOnline.value) return t('pc.offline')
  if (backendLatency.value === 0) return '--'
  if (backendLatency.value >= 9999) return t('pc.timeout')
  return `${backendLatency.value}ms`
})

const latencyLabel = computed(() => {
  if (!isOnline.value) return t('pc.noConnection')
  const lat = backendLatency.value
  if (lat >= 9999) return t('pc.backendUnreachable')
  if (lat >= 500) return t('pc.verySlow')
  if (lat >= 200) return t('pc.slow')
  if (lat >= 80) return t('pc.moderate')
  if (lat > 0) return t('pc.good')
  return t('pc.measuring')
})

const latencyDebug = computed(() => {
  return config.api.workerUrl
})

async function measureBackendLatency() {
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

function handleVisibilityChange() {
  if (document.hidden) {
    // Page in background: pause auto-ping
    if (latencyInterval) {
      clearInterval(latencyInterval)
      latencyInterval = undefined
    }
  } else {
    // Page back to foreground: resume auto-ping every 20s
    if (!latencyInterval) {
      measureBackendLatency()
      latencyInterval = window.setInterval(measureBackendLatency, 20000)
    }
  }
}

// Battery state
const batteryLevel = ref(0)
const batteryCharging = ref(false)
const batterySupported = ref(false)
let batteryObj: any = null

const batteryColor = computed(() => {
  if (!batterySupported.value) return 'var(--gui-text-secondary, #8e8e93)'
  if (batteryLevel.value <= 0.2) return 'var(--gui-error, #FF3B30)'
  if (batteryCharging.value) return 'var(--gui-success, #34C759)'
  return 'var(--gui-text-secondary, #8e8e93)'
})

const batteryTitle = computed(() => {
  if (!batterySupported.value) return t('pc.batteryUnavailable')
  const pct = Math.round(batteryLevel.value * 100)
  return batteryCharging.value ? t('pc.batteryCharging', { pct }) : t('pc.batteryLevel', { pct })
})

async function initBattery() {
  try {
    const bat = await (navigator as any).getBattery?.()
    if (!bat) return
    batterySupported.value = true
    batteryObj = bat
    batteryLevel.value = bat.level
    batteryCharging.value = bat.charging
    bat.addEventListener('levelchange', onBatteryLevelChange)
    bat.addEventListener('chargingchange', onBatteryChargingChange)
  } catch {
    /* Battery API not supported */
  }
}

function onBatteryLevelChange() {
  if (batteryObj) batteryLevel.value = batteryObj.level
}

function onBatteryChargingChange() {
  if (batteryObj) batteryCharging.value = batteryObj.charging
}

function onClick(item: PCTaskbarItem) {
  const windowsForTool = getWindowsForTool(item.tool)
  if (windowsForTool.length === 0) {
    emit('launch', item)
    return
  }

  const visibleWindows = windowsForTool.filter((win) => !win.minimized)
  if (visibleWindows.length === 0) {
    focusOrRestoreWindow(windowsForTool[windowsForTool.length - 1].config.id)
    return
  }

  if (visibleWindows.length === 1) {
    focusOrRestoreWindow(visibleWindows[0].config.id)
    return
  }

  const focusedIndex = visibleWindows.findIndex((win) => win.focused)
  const targetWindow =
    focusedIndex >= 0
      ? visibleWindows[(focusedIndex + 1) % visibleWindows.length]
      : [...visibleWindows].sort((a, b) => b.lastFocusedAt - a.lastFocusedAt)[0]

  focusOrRestoreWindow(targetWindow.config.id)
}

function onContextMenu(event: MouseEvent, item: PCTaskbarItem) {
  emit('item-contextmenu', event, item)
}

function openNotifications() {
  const tool = ToolRegistry.get('notification' as ToolType)
  if (!tool) return
  const label = typeof tool.label === 'function' ? tool.label() : tool.label
  windowManager.openWindow({
    id: `notification-${Date.now()}`,
    tool: 'notification' as ToolType,
    title: label,
    iconName: tool.icon,
    width: tool.windowConfig.width ?? 380,
    height: tool.windowConfig.height ?? 520,
    minWidth: tool.windowConfig.minWidth,
    minHeight: tool.windowConfig.minHeight,
    resizable: tool.windowConfig.resizable,
    draggable: tool.windowConfig.draggable,
    closable: tool.windowConfig.closable,
    minimizable: tool.windowConfig.minimizable,
    maximizable: tool.windowConfig.maximizable,
    isFullscreen: tool.windowConfig.isFullscreen ?? true,
  })
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000)
  notifStore.startPolling()
  initBattery()
  measureBackendLatency()
  latencyInterval = window.setInterval(measureBackendLatency, 20000)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (latencyInterval) {
    clearInterval(latencyInterval)
  }
  notifStore.stopPolling()
  if (batteryObj) {
    batteryObj.removeEventListener('levelchange', onBatteryLevelChange)
    batteryObj.removeEventListener('chargingchange', onBatteryChargingChange)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
/* ── PC Taskbar - iOS Frosted Glass Style ──────────────────────────── */
.pc-taskbar {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  background: var(--gui-glass-bg, rgba(44, 44, 46, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  box-shadow: var(--gui-shadow-md, 0 -8px 24px rgba(0, 0, 0, 0.5));
  transition:
    background var(--gui-transition-base, 200ms ease),
    box-shadow var(--gui-transition-base, 200ms ease);
}

.pc-taskbar:hover {
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.95));
  box-shadow: var(--gui-shadow-lg, 0 -12px 40px rgba(0, 0, 0, 0.6));
}

.pc-taskbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 var(--gui-spacing-base, 16px);
  max-width: 100vw;
}

/* ── Start Button ──────────────────────────────────────────────────── */
.pc-taskbar__start-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  cursor: pointer;
  user-select: none;
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  flex-shrink: 0;
}

.pc-taskbar__start-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.pc-taskbar__start-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  transform: scale(1.02);
}

.pc-taskbar__start-btn:active {
  transform: scale(0.96);
  opacity: 0.8;
}

/* ── Pinned Apps ───────────────────────────────────────────────────── */
.pc-taskbar__pinned {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  flex: 1;
  margin: 0 var(--gui-spacing-xl, 24px);
  padding: 4px 6px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pc-taskbar__pinned::-webkit-scrollbar {
  display: none;
}

.pc-taskbar__app-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 52px;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  user-select: none;
  color: var(--gui-text-secondary, #8e8e93);
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  box-shadow: inset 0 0 0 1px transparent;
}

.pc-taskbar__app-btn:hover {
  background: var(--gui-dock-item-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #ffffff);
  transform: scale(1.08) translateY(-2px);
}

.pc-taskbar__app-btn:active {
  transform: scale(0.88) translateY(0);
  opacity: 0.7;
}

.pc-taskbar__app-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-taskbar__app-btn--active {
  background: var(--gui-dock-item-active, rgba(142, 142, 147, 0.15));
  color: var(--gui-text-primary, #ffffff);
}

/* Open-window indicator: a thin underline beneath the icon. */
.pc-taskbar__app-btn::after {
  content: '';
  position: absolute;
  bottom: 1px;
  left: 50%;
  width: 0;
  height: 3px;
  background: currentColor;
  border-radius: 999px;
  opacity: 0;
  transform: translateX(-50%);
  transition:
    width 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 160ms ease-out,
    background-color 200ms ease;
  pointer-events: none;
}

.pc-taskbar__app-btn--active::after {
  width: 6px;
  opacity: 0.55;
  background: var(--gui-text-secondary, #8e8e93);
}

.pc-taskbar__app-btn--focused::after {
  width: 22px;
  opacity: 1;
  background: var(--gui-accent, #8e8e93);
}

.pc-taskbar__app-count {
  position: absolute;
  top: 2px;
  right: 4px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--gui-accent, #8e8e93);
  color: var(--gui-text-inverse, #ffffff);
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ── System Tray ───────────────────────────────────────────────────── */
.pc-taskbar__tray {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  flex-shrink: 0;
}

.pc-taskbar__tray-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  color: var(--gui-text-secondary, #8e8e93);
  transition: all var(--gui-transition-base, 200ms ease);
  -webkit-tap-highlight-color: transparent;
}

.pc-taskbar__tray-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #ffffff);
}

.pc-taskbar__tray-item:active {
  transform: scale(0.92);
  opacity: 0.7;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-taskbar {
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
}

.light .pc-taskbar:hover {
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.1);
}

.light .pc-taskbar__app-btn:hover {
  box-shadow: none;
}

.light .pc-taskbar__latency-tip {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* ── Time Display ──────────────────────────────────────────────────── */
.pc-taskbar__wifi,
.pc-taskbar__battery {
  position: relative;
  display: flex;
  align-items: center;
  cursor: default;
}

/* Latency tooltip above WiFi icon */
.pc-taskbar__latency-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--gui-glass-bg-strong, rgba(28, 28, 30, 0.92));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 24px rgba(0, 0, 0, 0.5));
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}

.pc-taskbar__latency-tip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--gui-glass-bg-strong, rgba(28, 28, 30, 0.92));
}

.pc-taskbar__latency-tip__value {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.3px;
}

.pc-taskbar__latency-tip__label {
  font-size: 10px;
  font-weight: 500;
  color: var(--gui-text-tertiary, #636366);
  letter-spacing: 0.02em;
}

.pc-taskbar__latency-tip__debug {
  font-size: 9px;
  font-weight: 400;
  color: var(--gui-text-disabled, #48484a);
  letter-spacing: 0.02em;
  margin-top: 2px;
  padding-top: 2px;
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

/* Tooltip transition */
.latency-fade-enter-active,
.latency-fade-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.latency-fade-enter-from,
.latency-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

.pc-taskbar__time {
  padding-left: var(--gui-spacing-sm, 8px);
  border-left: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.pc-taskbar__notif-btn {
  position: relative;
  background: none;
  border: none;
  font-size: inherit;
}

.pc-taskbar__notif-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 600;
  line-height: 14px;
  text-align: center;
  background: var(--gui-error-bg);
  color: var(--gui-text-primary, #fff);
}

.pc-taskbar__time-text {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

/* ── Responsive Adjustments ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .pc-taskbar__container {
    height: 48px;
    padding: 0 var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__start-btn {
    padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__start-label {
    display: none;
  }

  .pc-taskbar__pinned {
    margin: 0 var(--gui-spacing-sm, 8px);
  }

  .pc-taskbar__app-btn {
    min-width: 48px;
  }
}

@media (max-width: 768px) {
  .pc-taskbar {
    height: 48px;
  }

  .pc-taskbar__tray {
    gap: var(--gui-spacing-xxs, 2px);
  }

  .pc-taskbar__time {
    display: none;
  }
}
</style>

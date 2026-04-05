<template>
  <div class="pc-window-manager">
    <PCWindow
      v-for="windowInstance in openWindows"
      :key="windowInstance.config.id"
      :window-instance="windowInstance"
      @close="onWindowClose"
      @minimize="onWindowMinimize"
      @maximize="onWindowMaximize"
      @focus="onWindowFocus"
    >
      <!-- Dynamic content based on window tool type -->
      <component
        :is="getWindowComponent(windowInstance.config.tool)"
        :window-id="windowInstance.config.id"
      />
    </PCWindow>

    <!-- Taskbar for minimized windows -->
    <div class="pc-taskbar">
      <div class="pc-taskbar__items">
        <button
          v-for="windowInstance in openWindows"
          :key="windowInstance.config.id"
          :class="['pc-taskbar__item', { 'pc-taskbar__item--active': windowInstance.focused }]"
          @click="toggleWindow(windowInstance.config.id)"
        >
          <span class="pc-taskbar__item-title">{{ windowInstance.config.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowManagerStore } from '../stores/windowManager'
import PCWindow from './PCWindow.vue'
import { ToolRegistry } from '../registry/ToolRegistry'
import type { ToolType } from '../types'

const windowManager = useWindowManagerStore()

// Get all open windows
const openWindows = computed(() => windowManager.openWindows)

// Get window component based on tool type
function getWindowComponent(toolType: ToolType) {
  const toolModule = ToolRegistry.get(toolType)
  return toolModule?.desktopComponent || toolModule?.mobileComponent
}

// Handle window events
function onWindowClose() {
  // Window close is handled by PCWindow component
}

function onWindowMinimize() {
  // Window minimize is handled by PCWindow component
}

function onWindowMaximize() {
  // Window maximize is handled by PCWindow component
}

function onWindowFocus() {
  // Window focus is handled by PCWindow component
}

// Toggle window minimized state
function toggleWindow(windowId: string) {
  const windowInstance = windowManager.getWindow(windowId)
  if (windowInstance) {
    if (windowInstance.minimized) {
      windowManager.restoreWindow(windowId)
    } else {
      windowManager.minimizeWindow(windowId)
    }
  }
}
</script>

<style scoped>
.pc-window-manager {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--gui-bg-base, #1C1C1E);
}

/* ── Taskbar ───────────────────────────────────────────────────────── */
.pc-taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--gui-glass-bg-subtle, rgba(44, 44, 46, 0.8));
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  display: flex;
  align-items: center;
  padding: 0 12px;
  z-index: var(--gui-z-taskbar, 1000);
}

.pc-taskbar__items {
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pc-taskbar__item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-md, 10px);
  color: var(--gui-text-secondary, #8E8E93);
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.pc-taskbar__item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-taskbar__item--active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-taskbar__item:active {
  transform: scale(0.96);
}

.pc-taskbar__item-title {
  line-height: 1;
}

/* ── Scrollbar Styling ─────────────────────────────────────────────── */
.pc-taskbar__items::-webkit-scrollbar {
  height: 4px;
}

.pc-taskbar__items::-webkit-scrollbar-track {
  background: transparent;
}

.pc-taskbar__items::-webkit-scrollbar-thumb {
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-full, 999px);
}

.pc-taskbar__items::-webkit-scrollbar-thumb:hover {
  background: var(--gui-border-default, rgba(255, 255, 255, 0.12));
}
</style>
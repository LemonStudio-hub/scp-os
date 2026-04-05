<template>
  <div class="pc-taskbar fixed bottom-0 left-0 right-0 z-[200] bg-[rgba(44,44,46,0.95)] backdrop-blur-[20px] border-t border-white/[0.08] shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
    <div class="pc-taskbar__container flex items-center justify-between px-2 h-[48px]">
      <!-- Start Button -->
      <button 
        class="pc-taskbar__start-btn flex items-center gap-2 px-3 py-1.5 bg-transparent border-none rounded-[6px] cursor-pointer select-none transition-all duration-200 hover:bg-[rgba(142,142,147,0.15)]"
        @click="$emit('start-click')"
      >
        <GUIIcon :name="'menu'" :size="20" />
        <span class="text-sm font-medium text-white whitespace-nowrap">Start</span>
      </button>

      <!-- Pinned Apps -->
      <div class="pc-taskbar__pinned flex items-center gap-1 flex-1 mx-4">
        <button
          v-for="item in items"
          :key="item.id"
          :class="[
            'pc-taskbar__app-btn flex flex-col items-center gap-[2px] px-3 py-1.5 bg-transparent border-none rounded-[6px] cursor-pointer select-none transition-all duration-200',
            { 'opacity-50 cursor-not-allowed': item.disabled },
            { 'bg-[rgba(142,142,147,0.15)]': activeTools.includes(item.tool) },
          ]"
          :disabled="item.disabled"
          :title="item.label"
          @click="onClick(item)"
        >
          <GUIIcon :name="item.iconName" :size="20" />
          <span v-if="activeTools.includes(item.tool)" class="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] bg-white rounded-full" />
        </button>
      </div>

      <!-- System Tray -->
      <div class="pc-taskbar__tray flex items-center gap-2 px-3">
        <div class="pc-taskbar__tray-item flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-[4px] hover:bg-[rgba(142,142,147,0.15)] transition-all duration-200">
          <GUIIcon :name="'wifi'" :size="16" />
        </div>
        <div class="pc-taskbar__tray-item flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-[4px] hover:bg-[rgba(142,142,147,0.15)] transition-all duration-200">
          <GUIIcon :name="'battery'" :size="16" />
        </div>
        <div class="pc-taskbar__tray-item flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-[4px] hover:bg-[rgba(142,142,147,0.15)] transition-all duration-200">
          <span class="text-sm font-medium text-white">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { ToolType } from '../types'
import type { IconName } from '../icons'
import GUIIcon from './ui/GUIIcon.vue'

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
withDefaults(defineProps<Props>(), {
  items: () => [
    { id: 'terminal', tool: 'terminal' as ToolType, label: 'Terminal', iconName: 'terminal' as IconName },
    { id: 'files', tool: 'filemanager' as ToolType, label: 'Files', iconName: 'folder' as IconName },
    { id: 'editor', tool: 'editor' as ToolType, label: 'Editor', iconName: 'edit' as IconName },
  ],
  activeTools: () => [],
})

const emit = defineEmits<{
  launch: [item: PCTaskbarItem]
  'start-click': []
}>()

const currentTime = ref('')
let timeInterval: number | undefined

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function onClick(item: PCTaskbarItem) {
  emit('launch', item)
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000) // Update every minute
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.pc-taskbar {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

.pc-taskbar__container {
  max-width: 100vw;
  overflow: hidden;
}

.pc-taskbar__start-btn {
  flex-shrink: 0;
}

.pc-taskbar__pinned {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pc-taskbar__pinned::-webkit-scrollbar {
  display: none;
}

.pc-taskbar__app-btn {
  position: relative;
  min-width: 48px;
  justify-content: center;
}

.pc-taskbar__tray {
  flex-shrink: 0;
}

.pc-taskbar__tray-item {
  position: relative;
}
</style>
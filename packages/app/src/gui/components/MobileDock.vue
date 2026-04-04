<template>
  <div class="mobile-dock fixed bottom-2 left-1/2 -translate-x-1/2 z-[200]">
    <div class="flex items-center gap-2 px-4 pb-[calc(4px+env(safe-area-inset-bottom,0px))] pt-1 bg-[rgba(44,44,46,0.85)] backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/[0.08] rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
      <div class="flex items-center gap-1">
        <button
          v-for="item in items"
          :key="item.id"
          :class="[
            'flex flex-col items-center gap-[2px] px-2 py-1 bg-transparent border-none rounded-[12px] cursor-pointer select-none -webkit-tap-highlight-color-transparent transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            { 'opacity-30 cursor-not-allowed': item.disabled },
            { 'bg-[rgba(142,142,147,0.15)]': activeTools.includes(item.tool) },
          ]"
          :disabled="item.disabled"
          :title="item.label"
          @click="onTap(item)"
          @touchstart="onTap(item)"
        >
          <GUIIcon :name="item.iconName" :size="24" class="transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15]" />
          <span class="text-[11px] font-medium text-[#8E8E93] whitespace-nowrap tracking-wide">{{ item.label }}</span>
          <span v-if="item.badge && item.badge > 0" class="absolute bottom-[2px] w-[16px] h-[16px] px-[5px] bg-[#FF3B30] rounded-full text-[10px] font-bold text-white leading-none">{{ item.badge }}</span>
          <span v-if="activeTools.includes(item.tool)" class="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] bg-[#8E8E93] rounded-full animate-ios-pulse" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolType } from '../types'
import type { IconName } from '../icons'
import GUIIcon from './ui/GUIIcon.vue'

export interface MobileDockItem {
  id: string
  tool: ToolType
  label: string
  iconName: IconName
  badge?: number
  disabled?: boolean
}

interface Props {
  items?: MobileDockItem[]
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
  launch: [item: MobileDockItem]
}>()

function onTap(item: MobileDockItem) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
  emit('launch', item)
}
</script>

<template>
  <div v-if="isOpen" class="pc-start-menu fixed bottom-[48px] left-0 z-[199] bg-[rgba(32,32,34,0.95)] backdrop-blur-[20px] border border-white/[0.08] shadow-[0_-2px_10px_rgba(0,0,0,0.3)] rounded-t-[12px] w-[600px] max-w-[80vw] overflow-hidden animate-fade-in">
    <div class="pc-start-menu__container flex flex-col h-[500px]">
      <!-- Search Bar -->
      <div class="pc-start-menu__search p-4 border-b border-white/[0.08]">
        <div class="relative">
          <GUIIcon name="search" ::size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search apps, files, settings..."
            class="w-full pl-10 pr-4 py-2 bg-[rgba(255,255,255,0.08)] border border-white/[0.08] rounded-[8px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[rgba(139,92,246,0.5)] transition-all"
            @focus="showSearchResults = true"
            @blur="showSearchResults = false"
          />
        </div>
        <!-- Search Results -->
        <div v-if="showSearchResults && filteredItems.length > 0" class="mt-2 absolute z-10 bg-[rgba(32,32,34,0.98)] backdrop-blur-[20px] border border-white/[0.08] rounded-[8px] w-[568px] max-h-[300px] overflow-y-auto">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/[0.08] transition-colors"
            @click="onItemClick(item)"
          >
            <div class="w-8 h-8 flex items-center justify-center rounded">
              <GUIIcon :name="item.iconName" :size="16" />
            </div>
            <span class="text-white">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        <!-- App List -->
        <div class="pc-start-menu__apps w-1/2 border-r border-white/[0.08] overflow-y-auto">
          <h3 class="px-4 py-3 text-sm font-medium text-white/60 uppercase tracking-wider">Pinned</h3>
          <div class="grid grid-cols-3 gap-2 p-4">
            <button
              v-for="app in apps"
              :key="app.id"
              class="pc-start-menu__app flex flex-col items-center gap-2 p-3 rounded-[8px] cursor-pointer hover:bg-white/[0.08] transition-colors"
              @click="onAppClick(app)"
            >
              <div class="w-12 h-12 flex items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]">
                <GUIIcon :name="app.iconName" :size="20" />
              </div>
              <span class="text-sm text-white text-center">{{ app.label }}</span>
            </button>
          </div>
          <h3 class="px-4 py-3 text-sm font-medium text-white/60 uppercase tracking-wider">All Apps</h3>
          <div class="grid grid-cols-3 gap-2 p-4">
            <button
              v-for="app in allApps"
              :key="app.id"
              class="pc-start-menu__app flex flex-col items-center gap-2 p-3 rounded-[8px] cursor-pointer hover:bg-white/[0.08] transition-colors"
              @click="onAppClick(app)"
            >
              <div class="w-12 h-12 flex items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]">
                <GUIIcon :name="app.iconName" :size="20" />
              </div>
              <span class="text-sm text-white text-center">{{ app.label }}</span>
            </button>
          </div>
        </div>

        <!-- System Options -->
        <div class="pc-start-menu__system w-1/2 overflow-y-auto">
          <h3 class="px-4 py-3 text-sm font-medium text-white/60 uppercase tracking-wider">System</h3>
          <div class="p-4 space-y-2">
            <button
              v-for="option in systemOptions"
              :key="option.id"
              class="flex items-center gap-3 w-full px-4 py-3 rounded-[8px] cursor-pointer hover:bg-white/[0.08] transition-colors"
              @click="onSystemOptionClick(option)"
            >
              <div class="w-10 h-10 flex items-center justify-center rounded-[8px] bg-white/[0.08]">
                <GUIIcon :name="option.iconName" :size="20" />
              </div>
              <span class="text-white">{{ option.label }}</span>
            </button>
          </div>
          <h3 class="px-4 py-3 text-sm font-medium text-white/60 uppercase tracking-wider">Power</h3>
          <div class="p-4 grid grid-cols-3 gap-3">
            <button
              v-for="powerOption in powerOptions"
              :key="powerOption.id"
              class="flex flex-col items-center gap-2 p-3 rounded-[8px] cursor-pointer hover:bg-white/[0.08] transition-colors"
              @click="onPowerOptionClick(powerOption)"
            >
              <div class="w-12 h-12 flex items-center justify-center rounded-[12px] bg-white/[0.08]">
                <GUIIcon :name="powerOption.iconName" :size="20" />
              </div>
              <span class="text-sm text-white text-center">{{ powerOption.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import GUIIcon from './ui/GUIIcon.vue'
import type { IconName } from '../icons'

export interface StartMenuApp {
  id: string
  label: string
  tool: string
  iconName: IconName
}

export interface SystemOption {
  id: string
  label: string
  action: string
  iconName: string
}

export interface PowerOption {
  id: string
  label: string
  action: string
  iconName: string
}

interface Props {
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  launch: [app: StartMenuApp]
  'system-action': [action: string]
  'power-action': [action: string]
}>()

const searchQuery = ref('')
const showSearchResults = ref(false)

// Pinned apps
const apps: StartMenuApp[] = [
  { id: 'terminal', label: 'Terminal', tool: 'terminal', iconName: 'terminal' },
  { id: 'files', label: 'Files', tool: 'filemanager', iconName: 'folder' },
  { id: 'editor', label: 'Editor', tool: 'editor', iconName: 'edit' },
  { id: 'chat', label: 'Chat', tool: 'chat', iconName: 'message-square' },
  { id: 'dash', label: 'Dash', tool: 'dash', iconName: 'bar-chart-2' },
  { id: 'feedback', label: 'Feedback', tool: 'feedback', iconName: 'message-circle' },
]

// All apps (including pinned)
const allApps: StartMenuApp[] = [
  ...apps,
  { id: 'settings', label: 'Settings', tool: 'settings', iconName: 'settings' },
]

// System options
const systemOptions: SystemOption[] = [
  { id: 'settings', label: 'Settings', action: 'settings', iconName: 'settings' },
  { id: 'wallpaper', label: 'Wallpaper', action: 'wallpaper', iconName: 'image' },
  { id: 'themes', label: 'Themes', action: 'themes', iconName: 'palette' },
  { id: 'about', label: 'About', action: 'about', iconName: 'info' },
]

// Power options
const powerOptions: PowerOption[] = [
  { id: 'sleep', label: 'Sleep', action: 'sleep', iconName: 'moon' },
  { id: 'restart', label: 'Restart', action: 'restart', iconName: 'refresh-cw' },
  { id: 'shutdown', label: 'Shutdown', action: 'shutdown', iconName: 'power' },
]

// Combined items for search
const allItems = computed(() => [
  ...apps,
  ...systemOptions,
  ...powerOptions,
])

// Filtered items based on search query
const filteredItems = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  return allItems.value.filter(item => 
    item.label.toLowerCase().includes(query)
  )
})

function onAppClick(app: StartMenuApp) {
  emit('launch', app)
}

function onSystemOptionClick(option: SystemOption) {
  emit('system-action', option.action)
}

function onPowerOptionClick(option: PowerOption) {
  emit('power-action', option.action)
}

function onItemClick(item: any) {
  if ('tool' in item) {
    emit('launch', item)
  } else if ('action' in item) {
    if (['sleep', 'restart', 'shutdown'].includes(item.action)) {
      emit('power-action', item.action)
    } else {
      emit('system-action', item.action)
    }
  }
  showSearchResults.value = false
  searchQuery.value = ''
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const startMenu = document.querySelector('.pc-start-menu')
  const startButton = document.querySelector('.pc-taskbar__start-btn')
  
  if (startMenu && !startMenu.contains(event.target as Node) && 
      startButton && !startButton.contains(event.target as Node)) {
    // Emit close event (would be handled by parent component)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.pc-start-menu {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  animation: fadeIn 0.2s ease-out;
}

.pc-start-menu__apps::-webkit-scrollbar,
.pc-start-menu__system::-webkit-scrollbar {
  width: 6px;
}

.pc-start-menu__apps::-webkit-scrollbar-track,
.pc-start-menu__system::-webkit-scrollbar-track {
  background: transparent;
}

.pc-start-menu__apps::-webkit-scrollbar-thumb,
.pc-start-menu__system::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.pc-start-menu__apps::-webkit-scrollbar-thumb:hover,
.pc-start-menu__system::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>
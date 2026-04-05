<template>
  <div ref="desktopRef" class="desktop-screen" :style="desktopThemeStyles" @contextmenu="handleDesktopContextMenu">
    <!-- Wallpaper -->
    <div class="desktop-screen__wallpaper" :class="{ 'has-custom-wallpaper': !!customWallpaperUrl }">
      <!-- Custom wallpaper image -->
      <img v-if="customWallpaperUrl" :src="customWallpaperUrl" class="desktop-screen__wallpaper-image" alt="Custom wallpaper" fetchpriority="high" />
      <!-- Default gradient overlay -->
      <div class="desktop-screen__wallpaper-gradient" />
      <!-- SVG pattern overlay -->
      <div class="desktop-screen__wallpaper-pattern">
        <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="360" :stroke="wallpaperPatternColor1" stroke-width="1"/>
          <circle cx="400" cy="400" r="240" :stroke="wallpaperPatternColor2" stroke-width="1"/>
          <circle cx="400" cy="400" r="120" :stroke="wallpaperPatternColor3" stroke-width="1"/>
          <line x1="0" y1="400" x2="800" y2="400" :stroke="wallpaperPatternColor3" stroke-width="0.5"/>
          <line x1="400" y1="0" x2="400" y2="800" :stroke="wallpaperPatternColor3" stroke-width="0.5"/>
        </svg>
      </div>
    </div>

    <!-- Desktop Icons -->
    <div class="desktop-screen__icons">
      <div
        v-for="app in apps"
        :key="app.id"
        ref="appIcons"
        :data-app-id="app.id"
        class="desktop-screen__icon"
        :style="getAppStyle(app)"
        @mousedown="handleMouseDown($event, app)"
        @dblclick="onAppDoubleClick(app)"
        @contextmenu="handleAppContextMenu($event, app)"
      >
        <div class="desktop-screen__icon-content">
          <div class="desktop-screen__icon-bg" :class="`desktop-screen__icon-bg--${app.id}`"
               :style="iconGradientStyle">
            <template v-if="app.id === 'terminal'">
              <span class="desktop-screen__icon-text">&gt;_</span>
            </template>
            <template v-else-if="app.id === 'files'">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 007.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2Z"/>
              </svg>
            </template>
            <template v-else-if="app.id === 'settings'">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </template>
            <template v-else-if="app.id === 'chat'">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </template>
            <template v-else-if="app.id === 'dash'">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1"/>
                <rect x="14" y="3" width="7" height="5" rx="1"/>
                <rect x="14" y="12" width="7" height="9" rx="1"/>
                <rect x="3" y="16" width="7" height="5" rx="1"/>
              </svg>
            </template>
            <template v-else-if="app.id === 'feedback'">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="13" x2="13" y2="13"/>
              </svg>
            </template>
          </div>
          <span class="desktop-screen__icon-label">{{ app.label }}</span>
        </div>
      </div>
    </div>

    <!-- PC Taskbar -->
    <PCTaskbar 
      ref="startButtonRef"
      :items="taskbarItems"
      :activeTools="activeTools"
      @launch="onTaskbarLaunch"
      @start-click="onStartClick"
    />

    <!-- PC Start Menu -->
    <PCStartMenu
      ref="startMenuRef"
      :isOpen="isStartMenuOpen"
      @launch="onStartMenuLaunch"
      @system-action="onSystemAction"
      @power-action="onPowerAction"
    />

    <!-- Context Menu -->
    <PCCContextMenu
      ref="contextMenuRef"
      v-model:visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @select="onContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useThemeStore } from '../stores/themeStore'
import { wallpaperService } from '../../utils/wallpaperService'
import PCTaskbar, { type PCTaskbarItem } from '../components/PCTaskbar.vue'
import PCStartMenu, { type StartMenuApp } from '../components/PCStartMenu.vue'
import PCCContextMenu from '../components/ui/PCCContextMenu.vue'
import { useDraggable } from '../composables/useDraggable'
import { useI18n } from '../composables/useI18n'
import type { ToolType, ContextMenuItem } from '../types'

export interface DesktopApp {
  id: string
  label: string
  tool: string
  color: string
  x?: number
  y?: number
}

const { t } = useI18n()

const apps: DesktopApp[] = [
  { id: 'terminal', label: t('home.apps.terminal'), tool: 'terminal', color: 'var(--gui-accent)', x: 50, y: 50 },
  { id: 'files', label: t('home.apps.files'), tool: 'filemanager', color: 'var(--gui-accent)', x: 180, y: 50 },
  { id: 'chat', label: t('home.apps.chat'), tool: 'chat', color: 'var(--gui-accent)', x: 310, y: 50 },
  { id: 'dash', label: t('home.apps.dash'), tool: 'dash', color: 'var(--gui-accent)', x: 50, y: 180 },
  { id: 'feedback', label: t('home.apps.feedback'), tool: 'feedback', color: 'var(--gui-accent)', x: 180, y: 180 },
  { id: 'settings', label: t('home.apps.settings'), tool: 'settings', color: 'var(--gui-accent)', x: 310, y: 180 },
]

const taskbarItems: PCTaskbarItem[] = [
  { id: 'terminal', tool: 'terminal' as ToolType, label: t('app.terminal'), iconName: 'terminal' },
  { id: 'files', tool: 'filemanager' as ToolType, label: t('app.files'), iconName: 'folder' },
  { id: 'editor', tool: 'editor' as ToolType, label: t('app.editor'), iconName: 'edit' },
]

const activeTools = ref<ToolType[]>([])
const isStartMenuOpen = ref(false)

// Context menu state
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  selectedApp: null as DesktopApp | null,
})

const emit = defineEmits<{
  launch: [app: DesktopApp]
  'start-click': []
}>()

const desktopRef = ref<HTMLDivElement | null>(null)
const appIcons = ref<HTMLElement[]>([])
const customWallpaperUrl = ref<string | null>(null)
const themeStore = useThemeStore()
themeStore.init()

// Store drag states for each app
const dragStates = new Map<string, ReturnType<typeof useDraggable>>()

// Get app style with position
const getAppStyle = (app: DesktopApp) => {
  return {
    left: `${app.x}px`,
    top: `${app.y}px`,
  }
}

// Initialize draggable for an app
const initDraggable = (app: DesktopApp, element: HTMLElement) => {
  const draggable = useDraggable(ref(element), {
    boundary: {
      minX: 0,
      minY: 0,
      maxX: window.innerWidth - 100,
      maxY: window.innerHeight - 150, // Account for taskbar
    },
    onEnd: (x, y) => {
      // Update app position
      const appIndex = apps.findIndex(a => a.id === app.id)
      if (appIndex !== -1) {
        apps[appIndex].x = x
        apps[appIndex].y = y
      }
    },
  })
  
  dragStates.set(app.id, draggable)
  return draggable
}

// Handle mouse down on app
const handleMouseDown = (event: MouseEvent, app: DesktopApp) => {
  // Find the element for this app
  const element = appIcons.value.find(el => el.dataset.appId === app.id)
  if (!element) return
  
  // Get or initialize draggable
  let draggable = dragStates.get(app.id)
  if (!draggable) {
    draggable = initDraggable(app, element)
  }
  
  draggable.handleMouseDown(event)
}

// Handle app double click
const onAppDoubleClick = (app: DesktopApp) => {
  emit('launch', app)
}

// Handle taskbar app launch
const onTaskbarLaunch = (item: PCTaskbarItem) => {
  const app = apps.find(a => a.tool === item.tool)
  if (app) {
    emit('launch', app)
  }
}

// Handle start button click
const onStartClick = () => {
  isStartMenuOpen.value = !isStartMenuOpen.value
}

// Handle start menu app launch
const onStartMenuLaunch = (app: StartMenuApp) => {
  const desktopApp = apps.find(a => a.tool === app.tool) || {
    id: app.id,
    label: app.label,
    tool: app.tool,
    color: 'var(--gui-accent)',
    x: 50,
    y: 50,
  }
  emit('launch', desktopApp)
  isStartMenuOpen.value = false
}

// Handle system actions
const onSystemAction = (action: string) => {
  console.log('System action:', action)
  // Implement system action handling here
  isStartMenuOpen.value = false
}

// Handle power actions
const onPowerAction = (action: string) => {
  console.log('Power action:', action)
  // Implement power action handling here
  isStartMenuOpen.value = false
}

// Handle desktop context menu
const handleDesktopContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        id: 'new-folder',
        label: t('fm.newFolder'),
        icon: 'folder',
        action: () => {
          console.log('Create new folder')
          // Implement new folder creation
        },
      },
      {
        id: 'new-text-file',
        label: t('pc.newTextFile'),
        icon: 'file-text',
        action: () => {
          console.log('Create new text file')
          // Implement new text file creation
        },
      },
      { id: 'divider-2', label: '', divider: true },
      {
        id: 'view',
        label: t('pc.view'),
        icon: 'eye',
        children: [
          {
            id: 'view-large-icons',
            label: t('pc.largeIcons'),
            action: () => {
              console.log('View large icons')
              // Implement view mode change
            },
          },
          {
            id: 'view-medium-icons',
            label: t('pc.mediumIcons'),
            action: () => {
              console.log('View medium icons')
              // Implement view mode change
            },
          },
          {
            id: 'view-small-icons',
            label: t('pc.smallIcons'),
            action: () => {
              console.log('View small icons')
              // Implement view mode change
            },
          },
        ],
      },
      {
        id: 'sort-by',
        label: t('pc.sortBy'),
        icon: 'sort',
        children: [
          {
            id: 'sort-by-name',
            label: t('pc.name'),
            action: () => {
              console.log('Sort by name')
              // Implement sort by name
            },
          },
          {
            id: 'sort-by-date',
            label: t('pc.dateModified'),
            action: () => {
              console.log('Sort by date')
              // Implement sort by date
            },
          },
        ],
      },
      { id: 'divider-2', label: '', divider: true },
      {
        id: 'personalize',
        label: t('pc.personalize'),
        icon: 'settings',
        action: () => {
          console.log('Open personalization settings')
          // Implement personalization settings
        },
      },
    ],
    selectedApp: null,
  }
}

// Handle app context menu
const handleAppContextMenu = (event: MouseEvent, app: DesktopApp) => {
  event.preventDefault()
  
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        id: 'open',
        label: t('pc.open'),
        icon: 'play',
        action: () => {
          emit('launch', app)
        },
      },
      {
        id: 'pin-to-taskbar',
        label: t('pc.pinTaskbar'),
        icon: 'pin',
        action: () => {
          console.log('Pin to taskbar:', app.id)
          // Implement pin to taskbar
        },
      },
      { id: 'divider-3', label: '', divider: true },
      {
        id: 'properties',
        label: t('pc.properties'),
        icon: 'info',
        action: () => {
          console.log('Properties:', app.id)
          // Implement properties dialog
        },
      },
    ],
    selectedApp: app,
  }
}

// Handle context menu selection
const onContextMenuSelect = (item: ContextMenuItem) => {
  console.log('Context menu selected:', item.id)
  // Additional handling if needed
}

// Close start menu when clicking outside
const startMenuRef = ref<HTMLElement | null>(null)
const startButtonRef = ref<HTMLElement | null>(null)
const contextMenuRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (startMenuRef.value && !startMenuRef.value.contains(event.target as Node) &&
      startButtonRef.value && !startButtonRef.value.contains(event.target as Node)) {
    isStartMenuOpen.value = false
  }

  if (contextMenuRef.value && !contextMenuRef.value.contains(event.target as Node)) {
    contextMenu.value.visible = false
  }
}

// Computed styles for theme-reactive properties
const desktopThemeStyles = computed(() => ({
  '--desktop-bg': themeStore.currentTheme.colors.bgBase,
  '--desktop-text': themeStore.currentTheme.colors.textPrimary,
  '--desktop-accent': themeStore.currentTheme.colors.accent,
}))

// Wallpaper pattern colors
const wallpaperPatternColor1 = computed(() => themeStore.currentTheme.colors.borderSubtle)
const wallpaperPatternColor2 = computed(() => themeStore.currentTheme.colors.borderDefault)
const wallpaperPatternColor3 = computed(() => themeStore.currentTheme.colors.borderStrong)

// App icon gradient style
const iconGradientStyle = computed(() => ({
  background: `linear-gradient(135deg, ${themeStore.currentTheme.colors.appIconFrom}, ${themeStore.currentTheme.colors.appIconTo})`,
}))

// Load wallpaper
onMounted(async () => {
  try {
    await wallpaperService.init()
    const url = await wallpaperService.getCurrentWallpaper()
    if (url) customWallpaperUrl.value = url
  } catch {
    // Silently fail
  }

  // Listen for wallpaper changes
  if (typeof window !== 'undefined') {
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

    // Add click outside listener
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)

  // Clean up drag states
  dragStates.forEach(draggable => {
    draggable.stop()
  })
  dragStates.clear()
})
</script>

<style scoped>
/* Desktop screen uses CSS variables exclusively for theme support */
.desktop-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: var(--desktop-bg, #000000);
}

/* Wallpaper */
.desktop-screen__wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--desktop-bg, #000000);
  overflow: hidden;
}

.desktop-screen__wallpaper-image {
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

.desktop-screen__wallpaper-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3) 0%, transparent 40%);
}

.desktop-screen__wallpaper-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

/* Desktop Icons */
.desktop-screen__icons {
  position: relative;
  z-index: 5;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.desktop-screen__icon {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  width: 100px;
  pointer-events: auto;
  cursor: move;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.desktop-screen__icon:hover {
  transform: translateY(-4px);
}

.desktop-screen__icon:active {
  transform: scale(0.92);
}

.desktop-screen__icon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
}

.desktop-screen__icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: var(--gui-radius-lg, 14px);
  color: var(--gui-text-inverse, #FFFFFF);
  box-shadow: var(--gui-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5));
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.desktop-screen__icon-bg svg {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.desktop-screen__icon-text {
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", "Fira Code", "SF Mono", Consolas, monospace);
  font-size: 32px;
  font-weight: var(--gui-font-weight-bold, 700);
  color: var(--gui-text-inverse, #FFFFFF);
  letter-spacing: -1px;
  line-height: 1;
}

.desktop-screen__icon:hover .desktop-screen__icon-bg {
  box-shadow: var(--gui-shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
  transform: scale(1.08);
}

.desktop-screen__icon-label {
  width: 100%;
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--desktop-text, #FFFFFF);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: var(--gui-radius-sm, 6px);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .desktop-screen__icon {
    width: 90px;
  }
  
  .desktop-screen__icon-bg {
    width: 64px;
    height: 64px;
  }
  
  .desktop-screen__icon-bg svg {
    width: 28px;
    height: 28px;
  }
  
  .desktop-screen__icon-text {
    font-size: 28px;
  }
  
  .desktop-screen__icon-label {
    font-size: var(--gui-font-xs, 11px);
  }
}

@media (max-width: 768px) {
  .desktop-screen__icon {
    width: 80px;
  }
  
  .desktop-screen__icon-bg {
    width: 56px;
    height: 56px;
  }
  
  .desktop-screen__icon-bg svg {
    width: 24px;
    height: 24px;
  }
  
  .desktop-screen__icon-text {
    font-size: 24px;
  }
  
  .desktop-screen__icon-label {
    font-size: var(--gui-font-xs, 11px);
  }
}
</style>
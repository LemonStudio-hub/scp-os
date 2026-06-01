<template>
  <div v-if="isOpen" class="pc-start-menu">
    <div class="pc-start-menu__container">
      <!-- Search Bar -->
      <div class="pc-start-menu__search">
        <div class="pc-start-menu__search-input">
          <GUIIcon name="search" :size="16" class="pc-start-menu__search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('pc.searchPlaceholder')"
            class="pc-start-menu__search-field"
            @focus="showSearchResults = true"
            @blur="showSearchResults = false"
          />
        </div>
        <!-- Search Results -->
        <Transition name="search-fade">
          <div
            v-if="showSearchResults && filteredItems.length > 0"
            class="pc-start-menu__search-results"
          >
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="pc-start-menu__search-item"
              @click="onItemClick(item)"
            >
              <div class="pc-start-menu__search-item-icon">
                <GUIIcon :name="item.iconName" :size="16" />
              </div>
              <span class="pc-start-menu__search-item-label">{{ item.label }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Main Content -->
      <div class="pc-start-menu__content">
        <!-- App List -->
        <div class="pc-start-menu__apps">
          <h3 class="pc-start-menu__section-title">{{ t('pc.pinned') }}</h3>
          <div class="pc-start-menu__apps-grid">
            <button
              v-for="app in apps"
              :key="app.id"
              class="pc-start-menu__app"
              @click="onAppClick(app)"
            >
              <div class="pc-start-menu__app-icon">
                <GUIIcon :name="app.iconName" :size="20" />
              </div>
              <span class="pc-start-menu__app-label">{{ app.label }}</span>
            </button>
          </div>
          <h3 class="pc-start-menu__section-title">{{ t('pc.allApps') }}</h3>
          <div class="pc-start-menu__apps-grid">
            <button
              v-for="app in allApps"
              :key="app.id"
              class="pc-start-menu__app"
              @click="onAppClick(app)"
            >
              <div class="pc-start-menu__app-icon">
                <GUIIcon :name="app.iconName" :size="20" />
              </div>
              <span class="pc-start-menu__app-label">{{ app.label }}</span>
            </button>
          </div>
        </div>

        <!-- System Options -->
        <div class="pc-start-menu__system">
          <h3 class="pc-start-menu__section-title">{{ t('pc.system') }}</h3>
          <div class="pc-start-menu__system-list">
            <button
              v-for="option in systemOptions"
              :key="option.id"
              class="pc-start-menu__system-item"
              @click="onSystemOptionClick(option)"
            >
              <div class="pc-start-menu__system-item-icon">
                <GUIIcon :name="option.iconName" :size="20" />
              </div>
              <span class="pc-start-menu__system-item-label">{{ option.label }}</span>
            </button>
          </div>
          <h3 class="pc-start-menu__section-title">{{ t('pc.power') }}</h3>
          <div class="pc-start-menu__power-grid">
            <button
              v-for="powerOption in powerOptions"
              :key="powerOption.id"
              class="pc-start-menu__power-item"
              @click="onPowerOptionClick(powerOption)"
            >
              <div class="pc-start-menu__power-item-icon">
                <GUIIcon :name="powerOption.iconName" :size="20" />
              </div>
              <span class="pc-start-menu__power-item-label">{{ powerOption.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import GUIIcon from './ui/GUIIcon.vue'
import type { IconName } from '../icons'
import type { ToolType } from '../types'
import { getInstalledAppTools } from '../utils/appCatalog'

const { t } = useI18n()

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
  iconName: IconName
}

export interface PowerOption {
  id: string
  label: string
  action: string
  iconName: IconName
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
const installedTools = ref<Set<ToolType>>(new Set())

// Pinned apps
const pinnedAppDefinitions: StartMenuApp[] = [
  { id: 'terminal', label: t('home.apps.terminal'), tool: 'terminal', iconName: 'terminal' },
  { id: 'files', label: t('home.apps.files'), tool: 'filemanager', iconName: 'folder' },
  { id: 'editor', label: t('app.editor'), tool: 'editor', iconName: 'edit' },
  { id: 'chat', label: t('home.apps.chat'), tool: 'chat', iconName: 'message-square' },
  { id: 'dash', label: t('home.apps.dash'), tool: 'dash', iconName: 'bar-chart-2' },
  { id: 'feedback', label: t('home.apps.feedback'), tool: 'feedback', iconName: 'message-circle' },
  { id: 'appmanager', label: t('home.apps.appManager'), tool: 'appmanager', iconName: 'grid' },
]

// All apps (including pinned)
const allAppDefinitions: StartMenuApp[] = [
  ...pinnedAppDefinitions,
  { id: 'settings', label: t('home.apps.settings'), tool: 'settings', iconName: 'settings' },
]

function refreshInstalledApps(): void {
  installedTools.value = getInstalledAppTools()
}

function isStartAppInstalled(app: StartMenuApp): boolean {
  return installedTools.value.has(app.tool as ToolType)
}

const apps = computed(() => pinnedAppDefinitions.filter(isStartAppInstalled))
const allApps = computed(() => allAppDefinitions.filter(isStartAppInstalled))

// System options
const systemOptions: SystemOption[] = [
  { id: 'settings', label: t('app.settings'), action: 'settings', iconName: 'settings' },
  { id: 'wallpaper', label: t('settings.wallpaper'), action: 'wallpaper', iconName: 'image' },
  { id: 'themes', label: t('settings.themes'), action: 'themes', iconName: 'palette' },
  { id: 'about', label: t('settings.about'), action: 'about', iconName: 'info' },
]

// Power options
const powerOptions: PowerOption[] = [
  { id: 'sleep', label: t('pc.sleep'), action: 'sleep', iconName: 'moon' },
  { id: 'restart', label: t('pc.restart'), action: 'restart', iconName: 'refresh-cw' },
  { id: 'shutdown', label: t('pc.shutdown'), action: 'shutdown', iconName: 'power' },
]

// Combined items for search
const allItems = computed(() => [...allApps.value, ...systemOptions, ...powerOptions])

// Filtered items based on search query
const filteredItems = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  return allItems.value.filter((item) => item.label.toLowerCase().includes(query))
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

function onItemClick(item: StartMenuApp | SystemOption | PowerOption) {
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

  if (
    startMenu &&
    !startMenu.contains(event.target as Node) &&
    startButton &&
    !startButton.contains(event.target as Node)
  ) {
    // Emit close event (would be handled by parent component)
  }
}

onMounted(() => {
  refreshInstalledApps()
  window.addEventListener('app-catalog-changed', refreshInstalledApps)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('app-catalog-changed', refreshInstalledApps)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ── PC Start Menu - iOS Frosted Glass Style ───────────────────────── */
.pc-start-menu {
  position: fixed;
  bottom: 52px;
  left: 0;
  z-index: 199;
  width: 640px;
  max-width: 85vw;
  max-height: 580px;
  background: var(--gui-glass-bg-strong, rgba(32, 32, 34, 0.95));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-bottom: none;
  border-radius: var(--gui-radius-xl, 14px) var(--gui-radius-xl, 14px) 0 0;
  box-shadow: var(--gui-shadow-ios-sheet, 0 -10px 40px rgba(0, 0, 0, 0.5));
  overflow: hidden;
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  animation: menuSlideUp 0.35s
    var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-start-menu:hover {
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7));
  background: var(--gui-glass-bg-strong, rgba(32, 32, 34, 0.98));
}

@keyframes menuSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pc-start-menu__container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 580px;
}

/* ── Search Bar ────────────────────────────────────────────────────── */
.pc-start-menu__search {
  position: relative;
  padding: var(--gui-spacing-base, 16px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.pc-start-menu__search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.pc-start-menu__search-icon {
  position: absolute;
  left: var(--gui-spacing-sm, 8px);
  color: var(--gui-text-tertiary, #636366);
  pointer-events: none;
}

.pc-start-menu__search-field {
  width: 100%;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-sm, 8px) var(--gui-spacing-sm, 8px) 36px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  outline: none;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-start-menu__search-field::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.pc-start-menu__search-field:focus {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
  box-shadow: 0 0 0 3px var(--gui-accent-glow, rgba(142, 142, 147, 0.15));
}

/* ── Search Results ────────────────────────────────────────────────── */
.pc-start-menu__search-results {
  position: absolute;
  top: calc(100% - 8px);
  left: var(--gui-spacing-base, 16px);
  right: var(--gui-spacing-base, 16px);
  z-index: 10;
  max-height: 320px;
  padding: var(--gui-spacing-xs, 4px);
  background: var(--gui-glass-bg-strong, rgba(32, 32, 34, 0.98));
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  box-shadow: var(--gui-shadow-ios-dropdown, 0 8px 32px rgba(0, 0, 0, 0.6));
  overflow-y: auto;
}

.pc-start-menu__search-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  border-radius: var(--gui-radius-sm, 6px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  -webkit-tap-highlight-color: transparent;
}

.pc-start-menu__search-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-start-menu__search-item:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.pc-start-menu__search-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--gui-text-secondary, #8e8e93);
}

.pc-start-menu__search-item-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
}

/* ── Content Area ──────────────────────────────────────────────────── */
.pc-start-menu__content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Apps Section ──────────────────────────────────────────────────── */
.pc-start-menu__apps {
  flex: 1;
  border-right: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  overflow-y: auto;
  padding: var(--gui-spacing-base, 16px);
}

.pc-start-menu__section-title {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #8e8e93);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--gui-spacing-sm, 8px);
  padding-left: var(--gui-spacing-xs, 4px);
}

.pc-start-menu__apps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gui-spacing-sm, 8px);
  margin-bottom: var(--gui-spacing-base, 16px);
}

.pc-start-menu__app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-sm, 8px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  box-shadow: inset 0 0 0 1px transparent;
}

.pc-start-menu__app:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  transform: scale(1.08) translateY(-2px);
}

.pc-start-menu__app:active {
  transform: scale(0.92) translateY(0);
  opacity: 0.7;
}

.pc-start-menu__app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border-radius: var(--gui-radius-lg, 12px);
  color: var(--gui-text-primary, #ffffff);
  transition: all var(--gui-transition-base, 200ms ease);
  box-shadow: var(--gui-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.3));
}

.pc-start-menu__app:hover .pc-start-menu__app-icon {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
  box-shadow: var(--gui-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.4));
  transform: scale(1.05);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-start-menu,
.claude .pc-start-menu {
  box-shadow: var(--gui-shadow-ios-sheet, 0 -10px 40px rgba(0, 0, 0, 0.12));
}

.light .pc-start-menu:hover,
.claude .pc-start-menu:hover {
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.15));
}

.light .pc-start-menu__search-results,
.claude .pc-start-menu__search-results {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.light .pc-start-menu__search-field,
.claude .pc-start-menu__search-field {
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #000000 !important;
}

.light .pc-start-menu__search-field:focus {
  border-color: #007aff !important;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15) !important;
}

.claude .pc-start-menu__search-field:focus {
  border-color: #d97757 !important;
  box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.15) !important;
}

.claude .pc-start-menu__app-icon,
.claude .pc-start-menu__system-item-icon,
.claude .pc-start-menu__power-item-icon {
  background: #faf9f5 !important;
  border: 1.5px solid #d97757 !important;
  color: #d97757 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}

.claude .pc-start-menu__app-icon :deep(svg),
.claude .pc-start-menu__system-item-icon :deep(svg),
.claude .pc-start-menu__power-item-icon :deep(svg) {
  stroke: #d97757 !important;
}

.claude .pc-start-menu__app:hover .pc-start-menu__app-icon,
.claude .pc-start-menu__system-item:hover .pc-start-menu__system-item-icon,
.claude .pc-start-menu__power-item:hover .pc-start-menu__power-item-icon {
  background: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
}

.pc-start-menu__app-label {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-start-menu__app:hover .pc-start-menu__app-label {
  color: var(--gui-accent, #8e8e93);
  font-weight: var(--gui-font-weight-semibold, 600);
  transform: translateY(-1px);
}

/* ── System Options ────────────────────────────────────────────────── */
.pc-start-menu__system {
  flex: 1;
  overflow-y: auto;
  padding: var(--gui-spacing-base, 16px);
}

.pc-start-menu__system-list {
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xxs, 2px);
  margin-bottom: var(--gui-spacing-base, 16px);
}

.pc-start-menu__system-item {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  transition: all var(--gui-transition-base, 200ms ease);
  -webkit-tap-highlight-color: transparent;
}

.pc-start-menu__system-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-start-menu__system-item:active {
  transform: scale(0.98);
  opacity: 0.7;
}

.pc-start-menu__system-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
}

.pc-start-menu__system-item-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
}

/* ── Power Options ─────────────────────────────────────────────────── */
.pc-start-menu__power-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gui-spacing-sm, 8px);
}

.pc-start-menu__power-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  padding: var(--gui-spacing-sm, 8px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  transition: all var(--gui-transition-bounce-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
}

.pc-start-menu__power-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  transform: scale(1.04);
}

.pc-start-menu__power-item:active {
  transform: scale(0.92);
  opacity: 0.7;
}

.pc-start-menu__power-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border-radius: var(--gui-radius-lg, 12px);
  color: var(--gui-text-primary, #ffffff);
}

.pc-start-menu__power-item-label {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
}

/* ── Scrollbars ────────────────────────────────────────────────────── */
.pc-start-menu__apps::-webkit-scrollbar,
.pc-start-menu__system::-webkit-scrollbar,
.pc-start-menu__search-results::-webkit-scrollbar {
  width: 6px;
}

.pc-start-menu__apps::-webkit-scrollbar-track,
.pc-start-menu__system::-webkit-scrollbar-track,
.pc-start-menu__search-results::-webkit-scrollbar-track {
  background: transparent;
}

.pc-start-menu__apps::-webkit-scrollbar-thumb,
.pc-start-menu__system::-webkit-scrollbar-thumb,
.pc-start-menu__search-results::-webkit-scrollbar-thumb {
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-sm, 6px);
}

.pc-start-menu__apps::-webkit-scrollbar-thumb:hover,
.pc-start-menu__system::-webkit-scrollbar-thumb:hover,
.pc-start-menu__search-results::-webkit-scrollbar-thumb:hover {
  background: var(--gui-border-default, rgba(255, 255, 255, 0.15));
}

/* ── Search Fade Animation ─────────────────────────────────────────── */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: all var(--gui-transition-base, 200ms ease);
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Responsive Adjustments ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .pc-start-menu {
    width: 560px;
  }

  .pc-start-menu__apps-grid,
  .pc-start-menu__power-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .pc-start-menu {
    width: 100vw;
    max-width: 100vw;
    max-height: 70vh;
  }

  .pc-start-menu__content {
    flex-direction: column;
  }

  .pc-start-menu__apps {
    border-right: none;
    border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  }
}
</style>

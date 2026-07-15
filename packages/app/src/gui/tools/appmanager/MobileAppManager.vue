<template>
  <MobileWindow
    :visible="visible"
    :title="t('appManager.title')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-app-manager">
      <div class="mobile-app-manager__summary">
        {{ t('appManager.subtitle', { installed: installedCount, total: apps.length }) }}
      </div>

      <div class="mobile-app-manager__list">
        <div v-for="app in apps" :key="app.tool" class="mobile-app-manager__row">
          <div class="mobile-app-manager__icon">
            <GUIIcon :name="app.iconName" :size="22" />
          </div>
          <div class="mobile-app-manager__meta">
            <div class="mobile-app-manager__name">{{ t(app.labelKey) }}</div>
            <div class="mobile-app-manager__description">{{ t(app.descriptionKey) }}</div>
          </div>
          <button
            v-if="isInstalled(app.tool)"
            class="mobile-app-manager__button mobile-app-manager__button--danger"
            :disabled="app.protected"
            @click="requestUninstall(app)"
          >
            {{ t('appManager.uninstall') }}
          </button>
          <button v-else class="mobile-app-manager__button" @click="install(app)">
            {{ t('appManager.install') }}
          </button>
        </div>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import { useI18n } from '../../composables/useI18n'
import { useWindowManagerStore } from '../../stores/windowManager'
import type { ToolType } from '../../types'
import {
  APP_CATALOG,
  type AppCatalogItem,
  getInstalledAppTools,
  installApp,
  removePinnedTool,
  uninstallApp,
} from '../../utils/appCatalog'

interface Props {
  visible?: boolean
}

withDefaults(defineProps<Props>(), {
  visible: true,
})

defineEmits<{
  close: []
}>()

const { t } = useI18n()
const windowManager = useWindowManagerStore()
const apps = APP_CATALOG
const installedTools = ref<Set<ToolType>>(new Set())
const installedCount = computed(() => installedTools.value.size)

function refreshInstalled(): void {
  installedTools.value = getInstalledAppTools()
}

function isInstalled(tool: ToolType): boolean {
  return installedTools.value.has(tool)
}

function install(app: AppCatalogItem): void {
  installApp(app, t(app.labelKey))
  refreshInstalled()
}

function requestUninstall(app: AppCatalogItem): void {
  if (app.protected) return
  const name = t(app.labelKey)
  const first = window.confirm(t('appManager.uninstallMsg', { app: name }))
  if (!first) return
  const second = window.confirm(t('appManager.finalUninstallMsg', { app: name }))
  if (!second) return

  uninstallApp(app.tool)
  removePinnedTool(app.tool)
  for (const win of [...windowManager.openWindows]) {
    if (win.config.tool === app.tool) windowManager.closeWindow(win.config.id)
  }
  refreshInstalled()
}

onMounted(() => {
  refreshInstalled()
  window.addEventListener('filesystem-changed', refreshInstalled)
})

onUnmounted(() => {
  window.removeEventListener('filesystem-changed', refreshInstalled)
})
</script>

<style scoped>
.mobile-app-manager {
  min-height: 100%;
  padding: 16px;
  background: var(--gui-bg-base, #000000);
  color: var(--gui-text-primary, #ffffff);
}

.mobile-app-manager__summary {
  margin: 0 0 12px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
}

.mobile-app-manager__list {
  overflow: hidden;
  border-radius: 8px;
  background: var(--gui-bg-surface, #1c1c1e);
}

.mobile-app-manager__row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
}

.mobile-app-manager__row:last-child {
  border-bottom: none;
}

.mobile-app-manager__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
}

.mobile-app-manager__meta {
  min-width: 0;
}

.mobile-app-manager__name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-app-manager__description {
  margin-top: 3px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 12px;
  line-height: 1.35;
}

.mobile-app-manager__button {
  min-width: 58px;
  height: 30px;
  border: none;
  border-radius: 7px;
  background: var(--gui-accent, #8e8e93);
  color: var(--gui-text-inverse, #000000);
  font-size: 12px;
  font-weight: 650;
}

.mobile-app-manager__button--danger {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
  color: var(--gui-error, #ff3b30);
}

.mobile-app-manager__button:disabled {
  opacity: 0.45;
}
</style>

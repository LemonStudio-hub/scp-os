<template>
  <PCWindow :window-instance="windowInstance" @close="$emit('close')">
    <div class="app-manager">
      <div class="app-manager__header">
        <div>
          <h2 class="app-manager__title">{{ t('appManager.title') }}</h2>
          <p class="app-manager__subtitle">
            {{ t('appManager.subtitle', { installed: installedCount, total: totalCount }) }}
          </p>
        </div>
        <div class="app-manager__header-actions">
          <button class="app-manager__action" @click="pickDirectory">
            {{ t('appManager.importDirectory') }}
          </button>
          <button class="app-manager__action" @click="pickZip">
            {{ t('appManager.importZip') }}
          </button>
          <button class="app-manager__refresh" :title="t('common.refresh')" @click="refreshInstalled">
            <GUIIcon name="refresh" :size="18" />
          </button>
        </div>
        <input
          ref="directoryInput"
          class="app-manager__file-input"
          type="file"
          multiple
          webkitdirectory
          @change="onDirectorySelected"
        />
        <input
          ref="zipInput"
          class="app-manager__file-input"
          type="file"
          accept=".zip,application/zip"
          @change="onZipSelected"
        />
      </div>

      <div v-if="importMessage" class="app-manager__notice">{{ importMessage }}</div>
      <div v-if="importDiagnostics.length" class="app-manager__diagnostics">
        <div
          v-for="diagnostic in importDiagnostics"
          :key="`${diagnostic.severity}:${diagnostic.code}:${diagnostic.message}`"
          :class="[
            'app-manager__diagnostic',
            `app-manager__diagnostic--${diagnostic.severity}`,
          ]"
        >
          <span class="app-manager__diagnostic-code">{{ diagnostic.code }}</span>
          <span>{{ diagnostic.message }}</span>
        </div>
      </div>

      <div class="app-manager__toolbar">
        <button
          :class="['app-manager__filter', { 'app-manager__filter--active': filter === 'all' }]"
          @click="filter = 'all'"
        >
          {{ t('appManager.allApps') }}
        </button>
        <button
          :class="[
            'app-manager__filter',
            { 'app-manager__filter--active': filter === 'installed' },
          ]"
          @click="filter = 'installed'"
        >
          {{ t('appManager.installed') }}
        </button>
        <button
          :class="[
            'app-manager__filter',
            { 'app-manager__filter--active': filter === 'available' },
          ]"
          @click="filter = 'available'"
        >
          {{ t('appManager.available') }}
        </button>
      </div>

      <div class="app-manager__list">
        <div v-for="app in visibleApps" :key="app.tool" class="app-manager__row">
          <div class="app-manager__icon">
            <GUIIcon :name="app.iconName" :size="24" />
          </div>
          <div class="app-manager__meta">
            <div class="app-manager__name-line">
              <span class="app-manager__name">{{ t(app.labelKey) }}</span>
              <span
                :class="[
                  'app-manager__status',
                  isInstalled(app.tool)
                    ? 'app-manager__status--installed'
                    : 'app-manager__status--available',
                ]"
              >
                {{
                  isInstalled(app.tool)
                    ? t('appManager.statusInstalled')
                    : t('appManager.statusAvailable')
                }}
              </span>
            </div>
            <div class="app-manager__description">{{ t(app.descriptionKey) }}</div>
          </div>
          <div class="app-manager__actions">
            <button
              v-if="isInstalled(app.tool)"
              class="app-manager__action app-manager__action--danger"
              :disabled="app.protected"
              :title="app.protected ? t('appManager.protectedHint') : t('appManager.uninstall')"
              @click="requestUninstall(app)"
            >
              {{ t('appManager.uninstall') }}
            </button>
            <button v-else class="app-manager__action" @click="install(app)">
              {{ t('appManager.install') }}
            </button>
          </div>
        </div>

        <div v-for="app in visibleLocalApps" :key="app.manifest.id" class="app-manager__row">
          <div class="app-manager__icon">
            <GUIIcon name="code" :size="24" />
          </div>
          <div class="app-manager__meta">
            <div class="app-manager__name-line">
              <span class="app-manager__name">{{ app.manifest.name }}</span>
              <span class="app-manager__status app-manager__status--installed">
                {{ app.manifest.version }}
              </span>
              <span class="app-manager__status app-manager__status--available">
                {{ app.manifest.runtime }}
              </span>
            </div>
            <div class="app-manager__description">
              {{ app.manifest.description || t('appManager.localAppDescription') }}
            </div>
            <div class="app-manager__permissions" :aria-label="t('appManager.permissions')">
              <span
                v-if="permissionSummaries(app).length === 0"
                class="app-manager__permission app-manager__permission--none"
              >
                {{ t('common.none') }}
              </span>
              <template v-else>
                <span
                  v-for="permission in permissionSummaries(app)"
                  :key="permission.id"
                  :class="[
                    'app-manager__permission',
                    `app-manager__permission--${permission.risk}`,
                    { 'app-manager__permission--planned': permission.status === 'planned' },
                  ]"
                  :title="permissionChipTitle(permission)"
                >
                  {{ permission.title }}
                </span>
              </template>
            </div>
          </div>
          <div class="app-manager__actions">
            <button
              class="app-manager__action app-manager__action--danger"
              @click="uninstallLocal(app.manifest.id)"
            >
              {{ t('appManager.uninstall') }}
            </button>
          </div>
        </div>
      </div>

      <Transition name="app-manager-dialog">
        <div v-if="confirmTarget" class="app-manager__dialog-overlay" @click.self="cancelUninstall">
          <div class="app-manager__dialog">
            <h3 class="app-manager__dialog-title">{{ confirmDialogTitle }}</h3>
            <p class="app-manager__dialog-text">{{ confirmDialogText }}</p>
            <div class="app-manager__dialog-actions">
              <button class="app-manager__dialog-btn" @click="cancelUninstall">
                {{ t('common.cancel') }}
              </button>
              <button
                class="app-manager__dialog-btn app-manager__dialog-btn--danger"
                @click="advanceUninstall"
              >
                {{ confirmDialogButton }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </PCWindow>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PCWindow from '../../components/PCWindow.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import { useI18n } from '../../composables/useI18n'
import { useWindowManagerStore } from '../../stores/windowManager'
import type { ToolType, WindowInstance } from '../../types'
import {
  APP_CATALOG,
  type AppCatalogItem,
  getInstalledAppTools,
  installApp,
  removePinnedTool,
  uninstallApp,
} from '../../utils/appCatalog'
import { localAppManager } from '../../../platform/apps/local-app-manager'
import { permissionRegistry } from '../../../platform/apps/permission-registry'
import type {
  InstalledLocalApp,
  PackageDiagnostic,
} from '../../../platform/apps/local-app.types'
import type { PermissionSummary } from '../../../platform/apps/permission-registry'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const { t } = useI18n()
const windowManager = useWindowManagerStore()

const filter = ref<'all' | 'installed' | 'available'>('all')
const installedTools = ref<Set<ToolType>>(new Set())
const localApps = ref<InstalledLocalApp[]>([])
const directoryInput = ref<HTMLInputElement | null>(null)
const zipInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importDiagnostics = ref<PackageDiagnostic[]>([])
const confirmTarget = ref<AppCatalogItem | null>(null)
const confirmStep = ref(0)

const apps = APP_CATALOG
const installedCount = computed(() => installedTools.value.size + localApps.value.length)
const totalCount = computed(() => apps.length + localApps.value.length)

function refreshInstalled(): void {
  installedTools.value = getInstalledAppTools()
  localApps.value = localAppManager.getInstalledApps()
}

function isInstalled(tool: ToolType): boolean {
  return installedTools.value.has(tool)
}

const visibleApps = computed(() =>
  apps.filter((app) => {
    if (filter.value === 'installed') return isInstalled(app.tool)
    if (filter.value === 'available') return !isInstalled(app.tool)
    return true
  })
)

const visibleLocalApps = computed(() => {
  if (filter.value === 'available') return []
  return localApps.value
})

function pickDirectory(): void {
  importMessage.value = ''
  importDiagnostics.value = []
  directoryInput.value?.click()
}

function pickZip(): void {
  importMessage.value = ''
  importDiagnostics.value = []
  zipInput.value?.click()
}

async function onDirectorySelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  await installLocalFiles(input.files, 'directory')
  input.value = ''
}

async function onZipSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  await installLocalFiles(input.files, 'zip')
  input.value = ''
}

async function installLocalFiles(files: FileList, source: 'directory' | 'zip'): Promise<void> {
  importMessage.value = t('appManager.importing')
  importDiagnostics.value = []
  const validation = await localAppManager.validateFromFileList(files, source)
  importDiagnostics.value = [...validation.errors, ...validation.warnings]

  if (!validation.ok) {
    importMessage.value = t('appManager.importFailed', {
      error: formatDiagnostics(validation.errors),
    })
    refreshInstalled()
    return
  }

  if (validation.risk === 'high') {
    const highRiskPermissions = validation.permissions
      .filter((permission) => permission.risk === 'high')
      .map((permission) => permission.title)
      .join(', ')
    const confirmed = window.confirm(
      t('appManager.highRiskConfirm', {
        app: validation.manifest?.name ?? t('common.unknown'),
        permissions: highRiskPermissions || t('common.unknown'),
      })
    )
    if (!confirmed) {
      importMessage.value = t('appManager.importCancelled')
      return
    }
  }

  const result = await localAppManager.installFromFileList(files, source)
  importDiagnostics.value = result.validation
    ? [...result.validation.errors, ...result.validation.warnings]
    : []
  importMessage.value = result.success
    ? t('appManager.importSuccess', { app: result.app?.manifest.name ?? '' })
    : t('appManager.importFailed', {
        error: result.error ?? formatDiagnostics(result.validation?.errors ?? []),
      })
  refreshInstalled()
}

function formatDiagnostics(diagnostics: PackageDiagnostic[]): string {
  return diagnostics.map((item) => `${item.code}: ${item.message}`).join('\n') || t('common.unknown')
}

function permissionSummaries(app: InstalledLocalApp): PermissionSummary[] {
  return permissionRegistry.summarize(app.manifest.permissions ?? [])
}

function permissionRiskLabel(risk: PermissionSummary['risk']): string {
  if (risk === 'high') return t('appManager.riskHigh')
  if (risk === 'medium') return t('appManager.riskMedium')
  return t('appManager.riskLow')
}

function permissionChipTitle(permission: PermissionSummary): string {
  const status =
    permission.status === 'planned' ? ` · ${t('appManager.permissionPlanned')}` : ''
  return `${permission.id} · ${permissionRiskLabel(permission.risk)}${status}\n${permission.description}`
}

async function uninstallLocal(appId: string): Promise<void> {
  const target = localApps.value.find((app) => app.manifest.id === appId)
  if (!target) return
  await localAppManager.uninstall(appId)
  for (const win of [...windowManager.openWindows]) {
    if (win.config.tool === target.toolId) windowManager.closeWindow(win.config.id)
  }
  refreshInstalled()
}

function install(app: AppCatalogItem): void {
  installApp(app, t(app.labelKey))
  refreshInstalled()
}

function requestUninstall(app: AppCatalogItem): void {
  if (app.protected) return
  confirmTarget.value = app
  confirmStep.value = 1
}

function cancelUninstall(): void {
  confirmTarget.value = null
  confirmStep.value = 0
}

function advanceUninstall(): void {
  if (!confirmTarget.value) return
  if (confirmStep.value === 1) {
    confirmStep.value = 2
    return
  }

  const target = confirmTarget.value
  uninstallApp(target.tool)
  removePinnedTool(target.tool)
  closeWindowsForTool(target.tool)
  cancelUninstall()
  refreshInstalled()
}

function closeWindowsForTool(tool: ToolType): void {
  for (const win of [...windowManager.openWindows]) {
    if (win.config.tool === tool) {
      windowManager.closeWindow(win.config.id)
    }
  }
}

const confirmDialogTitle = computed(() =>
  confirmStep.value === 1 ? t('appManager.uninstallTitle') : t('appManager.finalUninstallTitle')
)

const confirmDialogText = computed(() => {
  if (!confirmTarget.value) return ''
  const name = t(confirmTarget.value.labelKey)
  return confirmStep.value === 1
    ? t('appManager.uninstallMsg', { app: name })
    : t('appManager.finalUninstallMsg', { app: name })
})

const confirmDialogButton = computed(() =>
  confirmStep.value === 1 ? t('common.confirm') : t('appManager.uninstallNow')
)

onMounted(() => {
  refreshInstalled()
  window.addEventListener('filesystem-changed', refreshInstalled)
})

onUnmounted(() => {
  window.removeEventListener('filesystem-changed', refreshInstalled)
})
</script>

<style scoped>
.app-manager {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #1c1c1e);
  color: var(--gui-text-primary, #ffffff);
  font-family: var(--gui-font-sans);
  overflow: hidden;
}

.app-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 14px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.app-manager__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0;
}

.app-manager__subtitle {
  margin: 4px 0 0;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
}

.app-manager__refresh,
.app-manager__filter,
.app-manager__action,
.app-manager__dialog-btn {
  border: none;
  font-family: inherit;
  cursor: pointer;
}

.app-manager__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-manager__file-input {
  display: none;
}

.app-manager__notice {
  padding: 10px 24px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 12px;
  white-space: pre-wrap;
}

.app-manager__diagnostics {
  display: grid;
  gap: 6px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  background: rgba(255, 255, 255, 0.02);
}

.app-manager__diagnostic {
  display: flex;
  gap: 8px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 12px;
  line-height: 1.4;
}

.app-manager__diagnostic--error {
  color: var(--gui-error, #ff3b30);
}

.app-manager__diagnostic-code {
  flex-shrink: 0;
  font-family: var(--gui-font-mono, monospace);
  font-weight: 700;
}

.app-manager__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--gui-bg-surface, #2c2c2e);
  color: var(--gui-text-primary, #ffffff);
}

.app-manager__toolbar {
  display: flex;
  gap: 6px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.app-manager__filter {
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  background: transparent;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
}

.app-manager__filter--active {
  background: var(--gui-bg-surface-raised, #3a3a3c);
  color: var(--gui-text-primary, #ffffff);
}

.app-manager__list {
  flex: 1;
  overflow: auto;
}

.app-manager__row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 78px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.app-manager__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: var(--gui-bg-surface, #2c2c2e);
  color: var(--gui-icon-fg, #ffffff);
}

.app-manager__meta {
  min-width: 0;
}

.app-manager__name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.app-manager__name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-manager__status {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
}

.app-manager__status--installed {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.1));
  color: var(--gui-success, #34c759);
}

.app-manager__status--available {
  background: var(--gui-bg-surface, #2c2c2e);
  color: var(--gui-text-secondary, #8e8e93);
}

.app-manager__description {
  margin-top: 5px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 12px;
  line-height: 1.4;
}

.app-manager__permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.app-manager__permission {
  max-width: 180px;
  overflow: hidden;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-manager__permission--none {
  background: var(--gui-bg-surface, #2c2c2e);
  color: var(--gui-text-secondary, #8e8e93);
}

.app-manager__permission--low {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.12));
  color: var(--gui-success, #34c759);
}

.app-manager__permission--medium {
  background: rgba(255, 204, 0, 0.14);
  color: #ffcc00;
}

.app-manager__permission--high {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #ff3b30);
}

.app-manager__permission--planned {
  border: 1px dashed currentColor;
}

.app-manager__actions {
  display: flex;
  justify-content: flex-end;
}

.app-manager__action {
  min-width: 78px;
  height: 32px;
  padding: 0 12px;
  border-radius: 7px;
  background: var(--gui-accent, #8e8e93);
  color: var(--gui-text-inverse, #000000);
  font-size: 13px;
  font-weight: 650;
}

.app-manager__action--danger {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
  color: var(--gui-error, #ff3b30);
}

.app-manager__action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.app-manager__dialog-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.48);
}

.app-manager__dialog {
  width: min(360px, calc(100% - 48px));
  padding: 22px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  background: var(--gui-bg-surface, #2c2c2e);
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7));
}

.app-manager__dialog-title {
  margin: 0 0 8px;
  font-size: 17px;
  letter-spacing: 0;
}

.app-manager__dialog-text {
  margin: 0;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
  line-height: 1.55;
}

.app-manager__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.app-manager__dialog-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 7px;
  background: var(--gui-bg-surface-raised, #3a3a3c);
  color: var(--gui-text-primary, #ffffff);
  font-size: 13px;
}

.app-manager__dialog-btn--danger {
  background: var(--gui-error, #ff3b30);
  color: #ffffff;
}

.app-manager-dialog-enter-active,
.app-manager-dialog-leave-active {
  transition: opacity 160ms ease;
}

.app-manager-dialog-enter-from,
.app-manager-dialog-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .app-manager__row {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .app-manager__actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>

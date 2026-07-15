<template>
  <MobileWindow
    :visible="visible"
    :title="t('appManager.title')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-app-manager">
      <div class="mobile-app-manager__summary">
        {{ t('appManager.subtitle', { installed: installedCount, total: totalCount }) }}
      </div>

      <div class="mobile-app-manager__imports">
        <button class="mobile-app-manager__button" @click="pickDirectory">
          {{ t('appManager.importDirectory') }}
        </button>
        <button class="mobile-app-manager__button" @click="pickZip">
          {{ t('appManager.importZip') }}
        </button>
      </div>
      <div v-if="importMessage" class="mobile-app-manager__notice">{{ importMessage }}</div>
      <div v-if="importDiagnostics.length" class="mobile-app-manager__diagnostics">
        <div
          v-for="diagnostic in importDiagnostics"
          :key="`${diagnostic.severity}:${diagnostic.code}:${diagnostic.message}`"
          :class="[
            'mobile-app-manager__diagnostic',
            `mobile-app-manager__diagnostic--${diagnostic.severity}`,
          ]"
        >
          <span class="mobile-app-manager__diagnostic-code">{{ diagnostic.code }}</span>
          <span>{{ diagnostic.message }}</span>
        </div>
      </div>
      <input
        ref="directoryInput"
        class="mobile-app-manager__file-input"
        type="file"
        multiple
        webkitdirectory
        @change="onDirectorySelected"
      />
      <input
        ref="zipInput"
        class="mobile-app-manager__file-input"
        type="file"
        accept=".zip,application/zip"
        @change="onZipSelected"
      />

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

        <div v-for="app in localApps" :key="app.manifest.id" class="mobile-app-manager__row">
          <div class="mobile-app-manager__icon">
            <GUIIcon name="code" :size="22" />
          </div>
          <div class="mobile-app-manager__meta">
            <div class="mobile-app-manager__name">{{ app.manifest.name }}</div>
            <div class="mobile-app-manager__description">
              {{ app.manifest.description || t('appManager.localAppDescription') }}
            </div>
            <div class="mobile-app-manager__permissions" :aria-label="t('appManager.permissions')">
              <span
                v-if="permissionSummaries(app).length === 0"
                class="mobile-app-manager__permission mobile-app-manager__permission--none"
              >
                {{ t('common.none') }}
              </span>
              <template v-else>
                <span
                  v-for="permission in permissionSummaries(app)"
                  :key="permission.id"
                  :class="[
                    'mobile-app-manager__permission',
                    `mobile-app-manager__permission--${permission.risk}`,
                    { 'mobile-app-manager__permission--planned': permission.status === 'planned' },
                  ]"
                  :title="permissionChipTitle(permission)"
                >
                  {{ permission.title }}
                </span>
              </template>
            </div>
          </div>
          <button
            class="mobile-app-manager__button mobile-app-manager__button--danger"
            @click="uninstallLocal(app.manifest.id)"
          >
            {{ t('appManager.uninstall') }}
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
import { dialogService } from '../../composables/useDialog'
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
import { localAppManager } from '../../../platform/apps/local-app-manager'
import { permissionRegistry } from '../../../platform/apps/permission-registry'
import type {
  InstalledLocalApp,
  PackageDiagnostic,
} from '../../../platform/apps/local-app.types'
import type { PermissionSummary } from '../../../platform/apps/permission-registry'

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
const localApps = ref<InstalledLocalApp[]>([])
const directoryInput = ref<HTMLInputElement | null>(null)
const zipInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importDiagnostics = ref<PackageDiagnostic[]>([])
const installedCount = computed(() => installedTools.value.size + localApps.value.length)
const totalCount = computed(() => apps.length + localApps.value.length)

function refreshInstalled(): void {
  installedTools.value = getInstalledAppTools()
  localApps.value = localAppManager.getInstalledApps()
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
    const confirmed = await dialogService.confirm(
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
  const confirmed = await dialogService.confirm(
    t('appManager.uninstallMsg', { app: target.manifest.name })
  )
  if (!confirmed) return

  await localAppManager.uninstall(appId)
  for (const win of [...windowManager.openWindows]) {
    if (win.config.tool === target.toolId) windowManager.closeWindow(win.config.id)
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

.mobile-app-manager__imports {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.mobile-app-manager__notice {
  margin-bottom: 10px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 12px;
  white-space: pre-wrap;
}

.mobile-app-manager__diagnostics {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--gui-bg-surface, #1c1c1e);
}

.mobile-app-manager__diagnostic {
  display: flex;
  gap: 7px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 11px;
  line-height: 1.35;
}

.mobile-app-manager__diagnostic--error {
  color: var(--gui-error, #ff3b30);
}

.mobile-app-manager__diagnostic-code {
  flex-shrink: 0;
  font-family: var(--gui-font-mono, monospace);
  font-weight: 700;
}

.mobile-app-manager__file-input {
  display: none;
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

.mobile-app-manager__permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.mobile-app-manager__permission {
  max-width: 140px;
  overflow: hidden;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-app-manager__permission--none {
  background: var(--gui-bg-surface-raised, #2c2c2e);
  color: var(--gui-text-secondary, #8e8e93);
}

.mobile-app-manager__permission--low {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.12));
  color: var(--gui-success, #34c759);
}

.mobile-app-manager__permission--medium {
  background: rgba(255, 204, 0, 0.14);
  color: #ffcc00;
}

.mobile-app-manager__permission--high {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #ff3b30);
}

.mobile-app-manager__permission--planned {
  border: 1px dashed currentColor;
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

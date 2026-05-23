<template>
  <div class="sys-settings">
    <div v-if="loading" class="sys-settings__loading">
      <div class="sys-settings__spinner"></div>
    </div>
    <template v-else>
      <div v-if="!adminStore.isSuperAdmin" class="sys-settings__no-perm">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.3"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>{{ t('admin.settings.noPermission') }}</span>
      </div>
      <div class="sys-settings__card">
        <div class="sys-settings__card-header">
          <span class="sys-settings__card-title">{{ t('admin.settings.systemConfig') }}</span>
        </div>
        <div class="sys-settings__list">
          <div v-for="item in settingsItems" :key="item.key" class="sys-settings__item">
            <div class="sys-settings__item-info">
              <span class="sys-settings__item-key">{{ item.key }}</span>
            </div>
            <div class="sys-settings__item-control">
              <template v-if="isBooleanValue(item.value)">
                <button
                  class="sys-settings__toggle"
                  :class="{ 'sys-settings__toggle--on': item.value === '1' }"
                  :disabled="!adminStore.isSuperAdmin || saving"
                  @click="toggleBoolean(item)"
                >
                  <span class="sys-settings__toggle-knob" />
                </button>
                <span class="sys-settings__toggle-label">{{
                  item.value === '1' ? t('admin.settings.enabled') : t('admin.settings.disabled')
                }}</span>
              </template>
              <template v-else-if="isNumericValue(item.value)">
                <input
                  v-model="item.value"
                  class="sys-settings__input"
                  type="number"
                  :disabled="!adminStore.isSuperAdmin || saving"
                />
              </template>
              <template v-else>
                <input
                  v-model="item.value"
                  class="sys-settings__input"
                  type="text"
                  :disabled="!adminStore.isSuperAdmin || saving"
                />
              </template>
            </div>
          </div>
        </div>
        <div v-if="adminStore.isSuperAdmin" class="sys-settings__footer">
          <button
            class="sys-settings__btn sys-settings__btn--primary"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? t('common.loading') : t('admin.settings.saveBtn') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import { useI18n } from '../../../composables/useI18n'
import * as adminApi from '../services/adminApi'

interface SettingItem {
  key: string
  value: string
}

const toast = useToast()
const adminStore = useAdminStore()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const settingsItems = ref<SettingItem[]>([])

function isBooleanValue(val: string): boolean {
  return val === '0' || val === '1'
}

function isNumericValue(val: string): boolean {
  if (val === '' || val === '0' || val === '1') return false
  return !isNaN(Number(val)) && val.trim() !== ''
}

function toggleBoolean(item: SettingItem) {
  item.value = item.value === '1' ? '0' : '1'
}

async function fetchSettings() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const res = await adminApi.getSystemSettings(token)
    if (res.success && res.data) {
      const items: SettingItem[] = []
      const data = res.data
      if (Array.isArray(data)) {
        for (const entry of data) {
          items.push({ key: entry.key ?? entry.name ?? '', value: String(entry.value ?? '') })
        }
      } else if (typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
          items.push({ key, value: String(val ?? '') })
        }
      }
      settingsItems.value = items
    } else {
      toast.error(res.error || t('admin.settings.fetchError'))
    }
  } catch {
    toast.error(t('admin.settings.fetchError'))
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const token = adminStore.token
  if (!token) return
  saving.value = true
  try {
    const settings: Record<string, string> = {}
    for (const item of settingsItems.value) {
      settings[item.key] = item.value
    }
    const res = await adminApi.updateSystemSettings(token, settings)
    if (res.success) {
      toast.success(t('admin.settings.saveSuccess'))
    } else {
      toast.error(res.error || t('admin.settings.saveError'))
    }
  } catch {
    toast.error(t('admin.settings.saveActionError'))
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.sys-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sys-settings__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.sys-settings__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gui-border-subtle, #1a1a1a);
  border-top-color: var(--gui-error, #e94560);
  border-radius: 50%;
  animation: sysSettingsSpin 0.8s linear infinite;
}

@keyframes sysSettingsSpin {
  to {
    transform: rotate(360deg);
  }
}

.sys-settings__no-perm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 200px;
  color: var(--gui-text-tertiary, #555555);
  font-size: 14px;
}

.sys-settings__card {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  overflow: hidden;
}

.sys-settings__card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gui-border-default, #2a2a2a);
}

.sys-settings__card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gui-text-primary, #e0e0e0);
}

.sys-settings__list {
  padding: 8px 0;
}

.sys-settings__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
  transition: background 120ms ease;
}

.sys-settings__item:last-child {
  border-bottom: none;
}

.sys-settings__item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.02));
}

.sys-settings__item-info {
  flex: 1;
  min-width: 0;
}

.sys-settings__item-key {
  font-size: 13px;
  color: var(--gui-text-secondary, #a0a0a0);
  word-break: break-all;
}

.sys-settings__item-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.sys-settings__toggle {
  position: relative;
  width: 40px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: var(--gui-border-default, #2a2a2a);
  cursor: pointer;
  transition: background 200ms ease;
  padding: 0;
}

.sys-settings__toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sys-settings__toggle--on {
  background: #e94560;
}

.sys-settings__toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gui-bg-surface, #ffffff);
  transition: transform 200ms ease;
}

.sys-settings__toggle--on .sys-settings__toggle-knob {
  transform: translateX(18px);
}

.sys-settings__toggle-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #6a6a6a);
  min-width: 32px;
}

.sys-settings__input {
  width: 200px;
  padding: 6px 10px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 6px;
  color: var(--gui-text-primary, #e0e0e0);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.sys-settings__input:focus {
  border-color: var(--gui-error, #e94560);
}

.sys-settings__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sys-settings__footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--gui-border-default, #2a2a2a);
}

.sys-settings__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}

.sys-settings__btn:active {
  transform: scale(0.96);
}

.sys-settings__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sys-settings__btn--primary {
  background: #e94560;
  color: var(--gui-text-primary, #ffffff);
}

.sys-settings__btn--primary:hover:not(:disabled) {
  background: #d63d56;
}
</style>

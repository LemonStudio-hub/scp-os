<template>
  <PCWindow :window-instance="windowInstance" @close="$emit('close')">
    <div class="pc-settings">
      <!-- Sidebar Navigation -->
      <div class="pc-settings__sidebar">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="[
            'pc-settings__nav-btn',
            { 'pc-settings__nav-btn--active': activeSection === section.id },
          ]"
          @click="activeSection = section.id"
        >
          <span class="pc-settings__nav-icon">
            <svg
              v-if="section.id === 'terminal'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <svg
              v-else-if="section.id === 'appearance'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
            <svg
              v-else-if="section.id === 'storage'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="18" r="1" fill="currentColor" />
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <span class="pc-settings__nav-label">{{ section.label }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="pc-settings__content gui-scrollable">
        <!-- Terminal Section -->
        <template v-if="activeSection === 'terminal'">
          <div class="pc-settings__section-title">{{ t('settings.terminal') }}</div>
          <div class="pc-settings__card">
            <!-- Font Size -->
            <div class="pc-settings__row pc-settings__row--static">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.fontSize') }}</div>
              </div>
              <span
                class="pc-settings__font-preview"
                :style="{ fontSize: `${settings.fontSize}px` }"
                >{{ t('settings.fontPreview') }}</span
              >
            </div>
            <div class="pc-settings__font-control">
              <button
                class="pc-settings__step-btn"
                :disabled="settings.fontSize <= 10"
                @click="settings.fontSize = Math.max(10, settings.fontSize - 1)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                >
                  <line x1="2" y1="7" x2="12" y2="7" />
                </svg>
              </button>
              <div class="pc-settings__slider-wrap">
                <span class="pc-settings__slider-bound">10</span>
                <input
                  v-model.number="settings.fontSize"
                  type="range"
                  min="10"
                  max="22"
                  step="1"
                  class="pc-settings__slider"
                />
                <span class="pc-settings__slider-bound">22</span>
              </div>
              <button
                class="pc-settings__step-btn"
                :disabled="settings.fontSize >= 22"
                @click="settings.fontSize = Math.min(22, settings.fontSize + 1)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                >
                  <line x1="7" y1="2" x2="7" y2="12" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                </svg>
              </button>
              <span class="pc-settings__font-value">{{ settings.fontSize }}px</span>
            </div>

            <!-- Cursor Blink -->
            <div class="pc-settings__row" @click="settings.cursorBlink = !settings.cursorBlink">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.cursorBlink') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.cursorBlink }"
              />
            </div>

            <!-- Boot Animation -->
            <div class="pc-settings__row" @click="settings.bootAnimation = !settings.bootAnimation">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.bootAnimation') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.bootAnimation }"
              />
            </div>
          </div>
        </template>

        <!-- Appearance Section -->
        <template v-if="activeSection === 'appearance'">
          <div class="pc-settings__section-title">{{ t('settings.appearance') }}</div>

          <!-- Language -->
          <div class="pc-settings__card">
            <div class="pc-settings__row" @click="showLanguageDropdown = !showLanguageDropdown">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.language') }}</div>
                <div class="pc-settings__row-value">{{ currentLanguageName }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
            <div v-if="showLanguageDropdown" class="pc-settings__language-dropdown">
              <div
                v-for="loc in availableLocales"
                :key="loc"
                :class="[
                  'pc-settings__lang-option',
                  { 'pc-settings__lang-option--active': locale === loc },
                ]"
                @click="selectLanguage(loc)"
              >
                <span>{{ localeNames[loc] }}</span>
                <svg
                  v-if="locale === loc"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path d="M4 8L7 11L12 5" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Theme Selection -->
          <div class="pc-settings__card">
            <div
              v-for="theme in themeStore.availableThemes"
              :key="theme.id"
              class="pc-settings__row pc-settings__row--radio"
              @click="themeStore.setTheme(theme.id)"
            >
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t(`theme.${theme.i18nKey}`) }}</div>
                <div class="pc-settings__row-description">
                  {{ t(`theme.${theme.i18nKey}Desc`) }}
                </div>
              </div>
              <div
                class="pc-settings__radio"
                :class="{ 'pc-settings__radio--active': themeStore.currentThemeId === theme.id }"
              />
            </div>
          </div>

          <!-- Haptic Feedback -->
          <div class="pc-settings__card">
            <div class="pc-settings__row" @click="settings.haptic = !settings.haptic">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.hapticFeedback') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.haptic }"
              />
            </div>

            <!-- Animations -->
            <div class="pc-settings__row" @click="settings.animations = !settings.animations">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.animations') }}</div>
              </div>
              <div
                class="pc-settings__toggle"
                :class="{ 'pc-settings__toggle--on': settings.animations }"
              />
            </div>

            <!-- Wallpaper -->
            <div class="pc-settings__row" @click="wallpaperPickerVisible = true">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.wallpaper') }}</div>
                <div class="pc-settings__row-description">{{ currentWallpaperName }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          </div>
        </template>

        <!-- Storage Section -->
        <template v-if="activeSection === 'storage'">
          <div class="pc-settings__section-title">{{ t('settings.storage') }}</div>
          <div class="pc-settings__card">
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.usedSpace') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ storageUsed }}</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.cloudStorage') }}</div>
                <div class="pc-settings__row-description">
                  {{ authStore.canUseCloudSync ? formatCloudFiles(cloudQuota) : '仅普通用户开放' }}
                </div>
              </div>
              <div class="pc-settings__row-value">
                {{ authStore.canUseCloudSync ? formatCloudQuota(cloudQuota) : '游客不可用' }}
              </div>
            </div>
            <div
              class="pc-settings__row"
              :class="{ 'pc-settings__row--disabled': !authStore.canUseCloudSync || syncBusy }"
              @click="handleCloudUpload"
            >
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">上传全部数据到云端</div>
                <div class="pc-settings__row-description">{{ syncMessage }}</div>
              </div>
              <div class="pc-settings__row-value">{{ syncBusy ? '同步中' : '最新覆盖' }}</div>
            </div>
            <div
              class="pc-settings__row"
              :class="{ 'pc-settings__row--disabled': !authStore.canUseCloudSync || syncBusy }"
              @click="handleCloudDownload"
            >
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">从云端恢复全部数据</div>
                <div class="pc-settings__row-description">云端较新的数据会覆盖本地</div>
              </div>
              <div class="pc-settings__row-value">下载</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.terminalStates') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ terminalStateCount }}</div>
            </div>
            <div class="pc-settings__row pc-settings__row--destructive" @click="confirmClearData">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.clearAllData') }}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          </div>
        </template>

        <!-- Account Section -->
        <template v-if="activeSection === 'account'">
          <div class="pc-settings__section-title">账户</div>
          <div class="pc-settings__card">
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">工作代号</div>
                <div class="pc-settings__row-description">{{ authStore.nickname }}</div>
              </div>
              <span
                class="pc-settings__badge"
                :class="{ 'pc-settings__badge--guest': !authStore.canUseCloudSync }"
              >
                {{ authStore.canUseCloudSync ? '普通用户' : '游客' }}
              </span>
            </div>
            <div v-if="authStore.email" class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">邮箱</div>
                <div class="pc-settings__row-description">{{ authStore.email }}</div>
              </div>
            </div>
            <div v-if="!showNicknameEdit" class="pc-settings__row" @click="openNicknameEdit">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">修改工作代号</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
            <div v-else class="pc-settings__nickname-edit">
              <input
                ref="nicknameInputRef"
                v-model="nicknameEditValue"
                class="pc-settings__nickname-input"
                type="text"
                placeholder="输入新的工作代号"
                maxlength="20"
                @keyup.enter="submitNicknameEdit"
                @keyup.escape="cancelNicknameEdit"
              />
              <div v-if="nicknameEditError" class="pc-settings__nickname-error">
                {{ nicknameEditError }}
              </div>
              <div class="pc-settings__nickname-actions">
                <button class="pc-settings__nickname-btn" @click="cancelNicknameEdit">取消</button>
                <button
                  class="pc-settings__nickname-btn pc-settings__nickname-btn--primary"
                  :disabled="authStore.isLoading"
                  @click="submitNicknameEdit"
                >
                  {{ authStore.isLoading ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>
          <div class="pc-settings__card">
            <div class="pc-settings__row pc-settings__row--destructive" @click="handleLogout">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">退出登录</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </div>
          </div>
        </template>

        <!-- About Section -->
        <template v-if="activeSection === 'about'">
          <div class="pc-settings__section-title">{{ t('settings.about') }}</div>
          <div class="pc-settings__card">
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.application') }}</div>
              </div>
              <div class="pc-settings__row-value">SCP-OS</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.version') }}</div>
              </div>
              <div class="pc-settings__row-value">0.1.0</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.userId') }}</div>
                <div class="pc-settings__row-description">{{ userId }}</div>
              </div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.build') }}</div>
              </div>
              <div class="pc-settings__row-value">{{ buildDate }}</div>
            </div>
            <div class="pc-settings__row">
              <div class="pc-settings__row-info">
                <div class="pc-settings__row-label">{{ t('settings.license') }}</div>
              </div>
              <div class="pc-settings__row-value">MIT / CC BY-SA 3.0</div>
            </div>
          </div>
        </template>

        <!-- Reset -->
        <div class="pc-settings__reset-row">
          <button class="pc-settings__reset-btn" @click="confirmResetSettings">
            {{ t('settings.resetAll') }}
          </button>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <Transition name="pc-settings-dialog-fade">
        <div
          v-if="confirmDialog"
          class="pc-settings__dialog-overlay"
          @click.self="confirmDialog = null"
        >
          <div class="pc-settings__dialog">
            <h3 class="pc-settings__dialog-title">{{ confirmDialog.title }}</h3>
            <p class="pc-settings__dialog-text">{{ confirmDialog.text }}</p>
            <div class="pc-settings__dialog-actions">
              <button class="pc-settings__dialog-btn" @click="confirmDialog = null">
                {{ t('common.cancel') }}
              </button>
              <button
                class="pc-settings__dialog-btn pc-settings__dialog-btn--destructive"
                @click="confirmDialog.action"
              >
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Wallpaper Picker -->
    <WallpaperPicker v-model:visible="wallpaperPickerVisible" @change="onWallpaperChange" />
  </PCWindow>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useSettings } from '../../composables/useSettings'
import { localeNames } from '../../../locales'
import PCWindow from '../../components/PCWindow.vue'
import WallpaperPicker from '../../components/WallpaperPicker.vue'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../../stores/authStore'
import { downloadCloudData, uploadAllLocalData } from '../../../services/cloudSyncService'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()
defineEmits<{
  (e: 'close'): void
}>()

const { t, locale, availableLocales } = useI18n()
const {
  settings,
  confirmDialog,
  storageUsed,
  cloudQuota,
  userId,
  terminalStateCount,
  confirmClearData,
  confirmResetSettings,
  formatCloudQuota,
  formatCloudFiles,
} = useSettings()
const themeStore = useThemeStore()
themeStore.init()
const authStore = useAuthStore()

// Account section state
const showNicknameEdit = ref(false)
const nicknameEditValue = ref('')
const nicknameEditError = ref('')
const nicknameInputRef = ref<HTMLInputElement | null>(null)
const syncBusy = ref(false)
const syncMessage = ref('普通用户可用，最大 512MB')

function openNicknameEdit(): void {
  nicknameEditValue.value = authStore.nickname ?? ''
  nicknameEditError.value = ''
  showNicknameEdit.value = true
  nextTick(() => nicknameInputRef.value?.focus())
}

function cancelNicknameEdit(): void {
  showNicknameEdit.value = false
  nicknameEditError.value = ''
}

async function submitNicknameEdit(): Promise<void> {
  nicknameEditError.value = ''
  const result = await authStore.updateNickname(nicknameEditValue.value)
  if (result.success) {
    showNicknameEdit.value = false
  } else {
    nicknameEditError.value = result.error || '更新失败'
  }
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
}

async function handleCloudUpload(): Promise<void> {
  if (!authStore.canUseCloudSync || syncBusy.value) return
  syncBusy.value = true
  syncMessage.value = '正在上传...'
  const result = await uploadAllLocalData()
  syncMessage.value = result.success ? '已上传，冲突策略为最新覆盖' : result.error || '上传失败'
  syncBusy.value = false
}

async function handleCloudDownload(): Promise<void> {
  if (!authStore.canUseCloudSync || syncBusy.value) return
  syncBusy.value = true
  syncMessage.value = '正在下载...'
  const result = await downloadCloudData()
  if (result.success) {
    syncMessage.value = '已恢复云端数据，即将重启...'
    setTimeout(() => location.reload(), 1200)
  } else {
    syncMessage.value = result.error || '下载失败'
    syncBusy.value = false
  }
}

// Navigation sections
const sections = computed(() => [
  {
    id: 'account',
    label: '账户',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  },
  {
    id: 'terminal',
    label: t('settings.terminal'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  },
  {
    id: 'appearance',
    label: t('settings.appearance'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  },
  {
    id: 'storage',
    label: t('settings.storage'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>',
  },
  {
    id: 'about',
    label: t('settings.about'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  },
])

const activeSection = ref('terminal')

// Language
const showLanguageDropdown = ref(false)
const currentLanguageName = computed(() => localeNames[locale.value] || t('common.english'))

function selectLanguage(loc: 'en' | 'zh-CN') {
  locale.value = loc
  showLanguageDropdown.value = false
  loadWallpaperName()
}

// Wallpaper
const wallpaperPickerVisible = ref(false)
const currentWallpaperName = ref<string>('None')

async function loadWallpaperName() {
  try {
    const { wallpaperService } = await import('../../../utils/wallpaperService')
    await wallpaperService.init()
    const id = wallpaperService.getCurrentWallpaperId()
    if (id) {
      const wp = await wallpaperService.getWallpaper(id)
      currentWallpaperName.value = wp?.name || t('common.none')
    } else {
      currentWallpaperName.value = t('common.none')
    }
  } catch {
    /* silently fail */
  }
}
loadWallpaperName()

function onWallpaperChange(_wallpaperId: string | null) {
  window.dispatchEvent(
    new CustomEvent('wallpaper-changed', { detail: { wallpaperId: _wallpaperId } })
  )
  loadWallpaperName()
}

const buildDate = computed(() => '2026-04-06')
</script>

<style scoped>
/* ── Account Section ───────────────────────────────────────────────── */
.pc-settings__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.pc-settings__badge--guest {
  background: rgba(255, 159, 10, 0.15);
  color: var(--gui-warning, #ff9f0a);
  border: 1px solid rgba(255, 159, 10, 0.3);
}

.pc-settings__nickname-edit {
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xs, 4px);
}

.pc-settings__nickname-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--gui-spacing-sm, 8px);
  font-size: 13px;
  color: var(--gui-text-primary, #fff);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-base, 8px);
  outline: none;
}

.pc-settings__nickname-input:focus {
  border-color: var(--gui-accent, #8e8e93);
}

.pc-settings__nickname-error {
  font-size: 11px;
  color: var(--gui-error, #ff3b30);
}

.pc-settings__nickname-actions {
  display: flex;
  gap: var(--gui-spacing-xs, 4px);
  justify-content: flex-end;
}

.pc-settings__nickname-btn {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--gui-text-secondary, #8e8e93);
  transition: background 120ms ease;
}

.pc-settings__nickname-btn:hover {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.12));
}

.pc-settings__nickname-btn--primary {
  background: var(--gui-accent, #8e8e93);
  color: var(--gui-text-inverse, #000);
}

.pc-settings__nickname-btn--primary:hover:not(:disabled) {
  background: var(--gui-accent-hover, #aeaeb2);
}

.pc-settings__nickname-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Layout ────────────────────────────────────────────────────────── */
.pc-settings {
  display: flex;
  height: 100%;
  background: var(--gui-bg-base, #1c1c1e);
}

/* ── Sidebar ───────────────────────────────────────────────────────── */
.pc-settings__sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--gui-bg-surface, #1c1c1e);
  border-right: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  padding: var(--gui-spacing-base, 16px) 0;
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xxs, 2px);
}

.pc-settings__nav-btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-secondary, #8e8e93);
  cursor: pointer;
  transition: all var(--gui-transition-base, 200ms ease);
  text-align: left;
  margin: 0 var(--gui-spacing-xs, 4px);
}

.pc-settings__nav-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__nav-btn--active {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
  color: var(--gui-text-primary, #ffffff);
  font-weight: var(--gui-font-weight-semibold, 600);
}

.pc-settings__nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pc-settings__nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.pc-settings__nav-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
}

/* ── Content Area ──────────────────────────────────────────────────── */
.pc-settings__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--gui-spacing-xl, 24px);
  min-width: 0;
}

.pc-settings__section-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  margin-bottom: var(--gui-spacing-base, 16px);
  letter-spacing: -0.01em;
}

/* ── Card ──────────────────────────────────────────────────────────── */
.pc-settings__card {
  background: var(--gui-bg-surface, #1c1c1e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  overflow: hidden;
  margin-bottom: var(--gui-spacing-base, 16px);
}

/* ── Row ───────────────────────────────────────────────────────────── */
.pc-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  -webkit-tap-highlight-color: transparent;
}

.pc-settings__row:last-child {
  border-bottom: none;
}

.pc-settings__row:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.pc-settings__row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-settings__row--disabled:hover {
  background: transparent;
}

.pc-settings__row:active {
  opacity: 0.8;
}

.pc-settings__row-info {
  flex: 1;
  min-width: 0;
}

.pc-settings__row-label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__row-description {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #8e8e93);
  margin-top: 2px;
}

.pc-settings__row-value {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #8e8e93);
  flex-shrink: 0;
  margin-right: var(--gui-spacing-sm, 8px);
}

/* ── Toggle (iOS-style) ────────────────────────────────────────────── */
.pc-settings__toggle {
  width: 44px;
  height: 24px;
  background: var(--gui-text-tertiary, #636366);
  border-radius: 999px;
  position: relative;
  transition: background var(--gui-transition-base, 200ms ease);
  flex-shrink: 0;
}

.pc-settings__toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--gui-bg-surface, #ffffff);
  border-radius: 50%;
  transition: transform var(--gui-transition-bounce-spring, 300ms cubic-bezier(0.34, 1.56, 0.64, 1));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.pc-settings__toggle--on {
  background: var(--gui-success, #34c759);
}

.pc-settings__toggle--on::after {
  transform: translateX(20px);
}

/* ── Radio ─────────────────────────────────────────────────────────── */
.pc-settings__radio {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gui-text-tertiary, #636366);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-settings__radio--active {
  border-color: var(--gui-accent, #8e8e93);
  background: var(--gui-accent, #8e8e93);
  box-shadow: inset 0 0 0 2px var(--gui-bg-surface, #2c2c2e);
}

/* ── Font Size Control ─────────────────────────────────────────────── */
.pc-settings__row--static {
  cursor: default;
  pointer-events: none;
}

.pc-settings__row--static:hover {
  background: transparent;
}

.pc-settings__font-preview {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  color: var(--gui-text-secondary, #8e8e93);
  transition: font-size var(--gui-transition-base, 200ms ease);
  flex-shrink: 0;
  white-space: nowrap;
}

.pc-settings__font-control {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px) var(--gui-spacing-md, 12px);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
}

.pc-settings__step-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border: 0.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-settings__step-btn:hover:not(:disabled) {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.12));
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.15));
}

.pc-settings__step-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.pc-settings__step-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pc-settings__slider-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
}

.pc-settings__slider-bound {
  font-size: 10px;
  color: var(--gui-text-tertiary, #636366);
  flex-shrink: 0;
  width: 18px;
  text-align: center;
  user-select: none;
}

.pc-settings__slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  background: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
  border-radius: 99px;
  outline: none;
  cursor: pointer;
  position: relative;
}

.pc-settings__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--gui-text-primary, #ffffff);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  transition:
    transform var(--gui-transition-fast, 120ms ease),
    box-shadow var(--gui-transition-fast, 120ms ease);
}

.pc-settings__slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.pc-settings__slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
}

.pc-settings__slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--gui-text-primary, #ffffff);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.pc-settings__font-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--gui-accent, #8e8e93);
  flex-shrink: 0;
  width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ── Language Dropdown ─────────────────────────────────────────────── */
.pc-settings__language-dropdown {
  padding: var(--gui-spacing-xs, 4px);
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  animation: sliderFadeIn 0.2s ease both;
}

.pc-settings__lang-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-base, 16px);
  border-radius: var(--gui-radius-sm, 6px);
  cursor: pointer;
  transition: background var(--gui-transition-fast, 120ms ease);
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-primary, #ffffff);
}

.pc-settings__lang-option:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-settings__lang-option--active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  color: var(--gui-accent, #8e8e93);
}

/* ── Destructive Row ───────────────────────────────────────────────── */
.pc-settings__row--destructive {
  color: var(--gui-error, #ff3b30);
}

.pc-settings__row--destructive .pc-settings__row-label {
  color: var(--gui-error, #ff3b30);
}

/* ── Reset Button ──────────────────────────────────────────────────── */
.pc-settings__reset-row {
  display: flex;
  justify-content: center;
  padding: var(--gui-spacing-xl, 24px) 0;
}

.pc-settings__reset-btn {
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-xl, 24px);
  background: transparent;
  border: 1px solid var(--gui-error, #ff3b30);
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-error, #ff3b30);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-settings__reset-btn:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
}

.pc-settings__reset-btn:active {
  transform: scale(0.96);
  opacity: 0.8;
}

/* ── Confirmation Dialog ───────────────────────────────────────────── */
.pc-settings__dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-modal, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  animation: overlayFadeIn 0.2s ease both;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.pc-settings__dialog {
  width: 100%;
  max-width: 320px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-xl, 14px);
  padding: var(--gui-spacing-xl, 24px);
  box-shadow: var(--gui-shadow-ios-modal, 0 20px 60px rgba(0, 0, 0, 0.7));
  animation: dialogScaleIn 0.3s
    var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
}

@keyframes dialogScaleIn {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.pc-settings__dialog-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  margin: 0 0 var(--gui-spacing-sm, 8px);
}

.pc-settings__dialog-text {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
  margin: 0 0 var(--gui-spacing-lg, 20px);
  line-height: var(--gui-line-height-base, 1.5);
}

.pc-settings__dialog-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
}

.pc-settings__dialog-btn {
  flex: 1;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #1c1c1e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-settings__dialog-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.08));
}

.pc-settings__dialog-btn--destructive {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #ff3b30);
  border-color: transparent;
}

/* ── Dialog Transition ─────────────────────────────────────────────── */
.pc-settings-dialog-fade-enter-active {
  animation:
    overlayFadeIn 0.2s ease both,
    dialogScaleIn 0.3s var(--gui-transition-ios-spring, 400ms cubic-bezier(0.32, 0.72, 0, 1)) both;
}

.pc-settings-dialog-fade-leave-active {
  animation: overlayFadeOut 0.15s ease both;
}

@keyframes overlayFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pc-settings {
    flex-direction: column;
  }

  .pc-settings__sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: var(--gui-spacing-sm, 8px);
    border-right: none;
    border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .pc-settings__nav-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pc-settings__nav-label {
    display: none;
  }
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-settings__modal-overlay {
  background: rgba(0, 0, 0, 0.3);
}
.light .pc-settings__modal {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}
.light .pc-settings__theme-preview {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.light .pc-settings__theme-preview--active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.light .pc-settings__radio--active {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  border-color: var(--gui-accent, #636366);
  box-shadow: inset 0 0 0 2px var(--gui-bg-surface, #ffffff);
}
</style>

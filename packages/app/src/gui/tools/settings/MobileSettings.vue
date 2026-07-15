<template>
  <MobileWindow
    :visible="visible"
    :title="t('settings.title')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="settings-app k-ios-page k-ios-page--dark">
      <div class="settings-app__content gui-scrollable">
        <!-- Terminal Section -->
        <div class="k-ios-block__title">{{ t('settings.terminal') }}</div>
        <div class="k-ios-list">
          <!-- Font Size -->
          <div class="k-ios-list__item" @click="openSlider('fontSize')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.fontSize') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ settings.fontSize }}px</span>
              <svg
                class="k-ios-list__item-chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
          <!-- Cursor Blink -->
          <div class="k-ios-list__item" @click="toggleSetting('cursorBlink')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.cursorBlink') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.cursorBlink" />
            </div>
          </div>
          <!-- Boot Animation -->
          <div class="k-ios-list__item" @click="toggleSetting('bootAnimation')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.bootAnimation') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.bootAnimation" />
            </div>
          </div>
        </div>

        <!-- Appearance Section -->
        <div class="k-ios-block__title">{{ t('settings.appearance') }}</div>
        <div class="k-ios-list">
          <!-- Language Selection -->
          <div class="k-ios-list__item" @click="openLanguagePicker">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.language') }}</div>
                <div class="k-ios-list__item-description">{{ currentLanguageName }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg
                class="k-ios-list__item-chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          <!-- Theme Selection -->
          <div
            v-for="theme in themeStore.availableThemes"
            :key="theme.id"
            class="k-ios-list__item"
            @click="themeStore.setTheme(theme.id)"
          >
            <div class="k-ios-list__item-left">
              <div class="theme-icon">
                <svg
                  v-if="theme.id === 'dark'"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <svg
                  v-else-if="theme.id === 'light'"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg
                  v-else-if="theme.id === 'claude'"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="none"
                >
                  <rect
                    x="1"
                    y="1"
                    width="22"
                    height="22"
                    rx="5.5"
                    fill="#FAF9F5"
                    stroke="#D97757"
                    stroke-width="1.5"
                  />
                  <g transform="translate(3.5, 3.6) scale(0.033)" fill="#D97757">
                    <path
                      fill-rule="nonzero"
                      d="M142.27 316.619l73.655-41.326 1.238-3.589-1.238-1.996-3.589-.001-12.31-.759-42.084-1.138-36.498-1.516-35.361-1.896-8.897-1.895-8.34-10.995.859-5.484 7.482-5.03 10.717.935 23.683 1.617 35.537 2.452 25.782 1.517 38.193 3.968h6.064l.86-2.451-2.073-1.517-1.618-1.517-36.776-24.922-39.81-26.338-20.852-15.166-11.273-7.683-5.687-7.204-2.451-15.721 10.237-11.273 13.75.935 3.513.936 13.928 10.716 29.749 23.027 38.848 28.612 5.687 4.727 2.275-1.617.278-1.138-2.553-4.271-21.13-38.193-22.546-38.848-10.035-16.101-2.654-9.655c-.935-3.968-1.617-7.304-1.617-11.374l11.652-15.823 6.445-2.073 15.545 2.073 6.547 5.687 9.655 22.092 15.646 34.78 24.265 47.291 7.103 14.028 3.791 12.992 1.416 3.968 2.449-.001v-2.275l1.997-26.641 3.69-32.707 3.589-42.084 1.239-11.854 5.863-14.206 11.652-7.683 9.099 4.348 7.482 10.716-1.036 6.926-4.449 28.915-8.72 45.294-5.687 30.331h3.313l3.792-3.791 15.342-20.372 25.782-32.227 11.374-12.789 13.27-14.129 8.517-6.724 16.1-.001 11.854 17.617-5.307 18.199-16.581 21.029-13.75 17.819-19.716 26.54-12.309 21.231 1.138 1.694 2.932-.278 44.536-9.479 24.062-4.347 28.714-4.928 12.992 6.066 1.416 6.167-5.106 12.613-30.71 7.583-36.018 7.204-53.636 12.689-.657.48.758.935 24.164 2.275 10.337.556h25.301l47.114 3.514 12.309 8.139 7.381 9.959-1.238 7.583-18.957 9.655-25.579-6.066-59.702-14.205-20.474-5.106-2.83-.001v1.694l17.061 16.682 31.266 28.233 39.152 36.397 1.997 8.999-5.03 7.102-5.307-.758-34.401-25.883-13.27-11.651-30.053-25.302-1.996-.001v2.654l6.926 10.136 36.574 54.975 1.895 16.859-2.653 5.485-9.479 3.311-10.414-1.895-21.408-30.054-22.092-33.844-17.819-30.331-2.173 1.238-10.515 113.261-4.929 5.788-11.374 4.348-9.478-7.204-5.03-11.652 5.03-23.027 6.066-30.052 4.928-23.886 4.449-29.674 2.654-9.858-.177-.657-2.173.278-22.37 30.71-34.021 45.977-26.919 28.815-6.445 2.553-11.173-5.789 1.037-10.337 6.243-9.2 37.257-47.392 22.47-29.371 14.508-16.961-.101-2.451h-.859l-98.954 64.251-17.618 2.275-7.583-7.103.936-11.652 3.589-3.791 29.749-20.474-.101.102.024.101z"
                    />
                  </g>
                </svg>
                <svg
                  v-else-if="theme.id === 'scp'"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <svg
                  v-else
                  width="20"
                  height="20"
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
              </div>
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ theme.name }}</div>
                <div class="k-ios-list__item-description">{{ theme.description }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <div
                class="k-ios-list__item-radio"
                :class="{
                  'k-ios-list__item-radio--active': themeStore.currentThemeId === theme.id,
                }"
              />
            </div>
          </div>
          <!-- Haptic Feedback -->
          <div class="k-ios-list__item" @click="toggleSetting('haptic')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.hapticFeedback') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.haptic" />
            </div>
          </div>
          <!-- Animations -->
          <div class="k-ios-list__item" @click="toggleSetting('animations')">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.animations') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <ToggleSwitch v-model:active="settings.animations" />
            </div>
          </div>
          <!-- Wallpaper -->
          <div class="k-ios-list__item" @click="wallpaperPickerVisible = true">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.wallpaper') }}</div>
                <div class="k-ios-list__item-description">{{ currentWallpaperName }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg
                class="k-ios-list__item-chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Storage Section -->
        <div class="k-ios-block__title">{{ t('settings.storage') }}</div>
        <div class="k-ios-list">
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.usedSpace') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ storageUsed }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.cloudStorage') }}</div>
                <div class="k-ios-list__item-description">{{ formatCloudFiles(cloudQuota) }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ formatCloudQuota(cloudQuota) }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.terminalStates') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ terminalStateCount }}</span>
            </div>
          </div>
          <div class="k-ios-list__item" @click="confirmClearData">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label k-ios-list__item-label--destructive">
                  {{ t('settings.clearAllData') }}
                </div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg
                class="k-ios-list__item-chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="k-ios-block__title">{{ t('settings.about') }}</div>
        <div class="k-ios-list">
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.application') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">SCP-OS</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.version') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">0.1.0</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.userId') }}</div>
                <div class="k-ios-list__item-description">{{ userId }}</div>
              </div>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.build') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">{{ buildDate }}</span>
            </div>
          </div>
          <div class="k-ios-list__item">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label">{{ t('settings.license') }}</div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <span class="k-ios-list__item-value">MIT / CC BY-SA 3.0</span>
            </div>
          </div>
        </div>

        <!-- Reset -->
        <div class="k-ios-list" style="margin-top: var(--gui-spacing-xl, 24px)">
          <div class="k-ios-list__item" @click="confirmResetSettings">
            <div class="k-ios-list__item-left">
              <div class="k-ios-list__item-content">
                <div class="k-ios-list__item-label k-ios-list__item-label--centered">
                  {{ t('settings.resetAll') }}
                </div>
              </div>
            </div>
            <div class="k-ios-list__item-right">
              <svg
                class="k-ios-list__item-chevron"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div style="height: var(--gui-spacing-3xl, 48px)" />
      </div>

      <!-- Confirmation Dialog -->
      <Transition name="gui-ios-fade">
        <div
          v-if="confirmDialog"
          class="settings-confirm-overlay"
          @click.self="confirmDialog = null"
        >
          <div class="settings-confirm-dialog">
            <h3 class="settings-confirm-title">{{ confirmDialog.title }}</h3>
            <p class="settings-confirm-text">{{ confirmDialog.text }}</p>
            <div class="settings-confirm-actions">
              <button class="settings-confirm-btn" @click="confirmDialog = null">
                {{ t('common.cancel') }}
              </button>
              <button
                class="settings-confirm-btn settings-confirm-btn--destructive"
                @click="confirmDialog.action"
              >
                {{ confirmDialog.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Font Size Slider Sheet -->
      <Sheet v-model:visible="sliderSheets.fontSize">
        <div class="settings-slider-sheet">
          <div class="settings-slider-sheet__header">
            <span class="settings-slider-sheet__spacer" />
            <span class="settings-slider-sheet__title">{{ t('settings.fontSize') }}</span>
            <button
              class="settings-slider-sheet__close"
              @click="onFontSizeChange(); sliderSheets.fontSize = false"
            >
              完成
            </button>
          </div>
          <div
            class="settings-slider-sheet__preview"
            :style="{ fontSize: `${sliderValues.fontSize}px` }"
          >
            {{ t('settings.fontPreview') }}
          </div>
          <input
            v-model.number="sliderValues.fontSize"
            type="range"
            min="10"
            max="22"
            step="1"
            class="k-ios-slider"
            @input="onFontSizeChange"
          />
          <div class="settings-slider-sheet__labels">
            <span>10px</span>
            <span>22px</span>
          </div>
        </div>
      </Sheet>

      <!-- Language Picker Sheet -->
      <Sheet v-model:visible="sliderSheets.language">
        <div class="settings-language-sheet">
          <div class="settings-language-sheet__title">{{ t('settings.language') }}</div>
          <div class="settings-language-sheet__options">
            <div
              v-for="loc in availableLocales"
              :key="loc"
              :class="[
                'settings-language-sheet__option',
                { 'settings-language-sheet__option--active': locale === loc },
              ]"
              @click="selectLanguage(loc)"
            >
              <span class="settings-language-sheet__label">{{ localeNames[loc] }}</span>
              <svg v-if="locale === loc" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 10L9 14L15 6"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </Sheet>
    </div>

    <!-- Wallpaper Picker -->
    <WallpaperPicker v-model:visible="wallpaperPickerVisible" @change="onWallpaperChange" />
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { useSettings } from '../../composables/useSettings'
import { localeNames } from '../../../locales'
import MobileWindow from '../../components/MobileWindow.vue'
import Sheet from '../../konsta/Sheet.vue'
import ToggleSwitch from '../../konsta/ToggleSwitch.vue'
import WallpaperPicker from '../../components/WallpaperPicker.vue'
import { useThemeStore } from '../../stores/themeStore'

const { t, locale, availableLocales } = useI18n()

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  (e: 'close'): void
}>()

const {
  settings,
  confirmDialog,
  storageUsed,
  cloudQuota,
  userId,
  terminalStateCount,
  formatCloudQuota,
  formatCloudFiles,
  toggleSetting,
  triggerHaptic,
  confirmClearData,
  confirmResetSettings,
} = useSettings()
const themeStore = useThemeStore()

// Initialize theme store
themeStore.init()

// Wallpaper picker
const wallpaperPickerVisible = ref(false)
const currentWallpaperName = ref<string>('None')

// Load current wallpaper name
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
    // Silently fail
  }
}

// Load on mount
loadWallpaperName()

// Current language display name
const currentLanguageName = computed(() => localeNames[locale.value] || 'English')

function openLanguagePicker() {
  triggerHaptic()
  sliderSheets.language = true
}

function selectLanguage(loc: 'en' | 'zh-CN') {
  locale.value = loc
  triggerHaptic()
  sliderSheets.language = false
  // Reload to apply language
  setTimeout(() => {
    loadWallpaperName()
  }, 100)
}

function onWallpaperChange(wallpaperId: string | null) {
  // Reload home screen wallpaper by dispatching event
  window.dispatchEvent(new CustomEvent('wallpaper-changed', { detail: { wallpaperId } }))
  // Update the displayed name
  loadWallpaperName()
}

const sliderSheets = reactive({ fontSize: false, language: false })
const sliderValues = reactive({ fontSize: settings.fontSize })

function openSlider(type: 'fontSize'): void {
  if (type === 'fontSize') {
    sliderValues.fontSize = settings.fontSize
    sliderSheets.fontSize = true
  }
}

function onFontSizeChange(): void {
  settings.fontSize = sliderValues.fontSize
}

const buildDate = computed(() => '2026-04-04')
</script>

<style scoped>
.settings-app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-app__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--gui-spacing-base, 16px);
}

/* iOS list item right value */
.k-ios-list__item-value {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #8e8e93);
  white-space: nowrap;
}

.k-ios-list__item-color-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--gui-radius-full, 9999px);
  flex-shrink: 0;
}

.k-ios-list__item-label--destructive {
  color: var(--gui-error, #ff3b30);
}

.k-ios-list__item-label--centered {
  text-align: center;
  width: 100%;
}

/* Radio indicator for theme selection */
.k-ios-list__item-radio {
  width: 20px;
  height: 20px;
  border-radius: var(--gui-radius-full, 9999px);
  border: 2px solid var(--gui-text-tertiary, #636366);
  transition: all var(--gui-transition-fast, 120ms ease);
}

.k-ios-list__item-radio--active {
  border-color: var(--gui-accent, #8e8e93);
  background: var(--gui-accent, #8e8e93);
  box-shadow: inset 0 0 0 3px var(--gui-bg-surface-raised, #3a3a3c);
}

/* Theme icon in settings */
.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--gui-radius-md, 10px);
  background: var(--gui-bg-surface-hover);
  color: var(--gui-text-secondary);
  flex-shrink: 0;
}

.theme-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

/* Confirm Dialog */
.settings-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--gui-z-modal, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-backdrop-bg, rgba(0, 0, 0, 0.5));
  padding: var(--gui-spacing-xl, 24px);
}

.settings-confirm-dialog {
  width: 100%;
  max-width: 280px;
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-xl, 14px);
  padding: var(--gui-spacing-xl, 24px);
  box-shadow: var(--gui-shadow-xl, 0 24px 48px rgba(0, 0, 0, 0.7));
  animation: gui-window-open 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.settings-confirm-title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  margin: 0 0 var(--gui-spacing-sm, 8px);
  text-align: center;
}

.settings-confirm-text {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #8e8e93);
  margin: 0 0 var(--gui-spacing-lg, 20px);
  text-align: center;
  line-height: var(--gui-line-height-base, 1.5);
}

.settings-confirm-actions {
  display: flex;
  gap: var(--gui-spacing-sm, 8px);
}

.settings-confirm-btn {
  flex: 1;
  padding: var(--gui-spacing-sm, 8px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface, #1c1c1e);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #ffffff);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-semibold, 600);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.settings-confirm-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.settings-confirm-btn--destructive {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.15));
  color: var(--gui-error, #ff3b30);
  border-color: transparent;
}

/* Slider Sheet */
.settings-slider-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-slider-sheet__header {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: var(--gui-spacing-lg, 20px);
}

.settings-slider-sheet__spacer {
  flex: 1;
}

.settings-slider-sheet__title {
  flex: 0;
  font-size: var(--gui-font-base, 13px);
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  white-space: nowrap;
}

.settings-slider-sheet__close {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  background: none;
  border: none;
  padding: 0;
  font-size: var(--gui-font-base, 13px);
  font-weight: 500;
  color: var(--gui-accent, #0a84ff);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 100ms ease;
}

.settings-slider-sheet__close:active {
  opacity: 0.5;
}

.settings-slider-sheet__preview {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  color: var(--gui-text-primary, #ffffff);
  padding: var(--gui-spacing-xl, 24px);
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: var(--gui-radius-lg, 12px);
  min-width: 200px;
  text-align: center;
  transition: font-size var(--gui-transition-base, 200ms ease);
}

.settings-slider-sheet__labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 280px;
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #636366);
}

/* Color Picker Sheet */
.settings-color-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gui-spacing-md, 12px);
}

.settings-color-sheet__label {
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-text-tertiary, #636366);
}

/* Language Picker Sheet */
.settings-language-sheet {
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-base, 16px);
  padding-bottom: max(var(--gui-spacing-xl, 24px), env(safe-area-inset-bottom, 24px));
}

.settings-language-sheet__title {
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #ffffff);
  text-align: center;
  margin-bottom: var(--gui-spacing-base, 16px);
}

.settings-language-sheet__options {
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xxs, 2px);
}

.settings-language-sheet__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  background: var(--gui-bg-surface-raised, #2c2c2e);
  border-radius: var(--gui-radius-base, 8px);
  cursor: pointer;
  transition: all var(--gui-transition-fast, 120ms ease);
  -webkit-tap-highlight-color: transparent;
}

.settings-language-sheet__option:active {
  opacity: 0.7;
  transform: scale(0.98);
}

.settings-language-sheet__option--active {
  background: var(--gui-accent-soft, rgba(142, 142, 147, 0.15));
}

.settings-language-sheet__option--active svg {
  color: var(--gui-accent, #8e8e93);
}

.settings-language-sheet__label {
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #ffffff);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .mobile-settings__theme-preview {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.light .mobile-settings__theme-preview--active {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.light .mobile-settings__sheet {
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
}
.light .mobile-settings__lang-sheet {
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
}
.light .k-ios-list__item-radio--active {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  border-color: var(--gui-accent, #636366);
  box-shadow: inset 0 0 0 3px var(--gui-bg-surface-raised, #f2f2f7);
}
</style>

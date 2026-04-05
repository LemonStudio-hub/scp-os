<template>
  <Transition name="wallpaper-picker">
    <div v-if="visible" class="wallpaper-picker-overlay" @click.self="close">
      <div class="wallpaper-picker">
        <!-- Header -->
        <div class="wallpaper-picker__header">
          <span class="wallpaper-picker__title">Wallpaper</span>
          <div class="wallpaper-picker__actions">
            <button class="wallpaper-picker__action-btn" @click="triggerUpload" title="Upload wallpaper">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12V3M9 3L6 6M9 3l3 3"/>
                <path d="M3 12v3a2 2 0 002 2h8a2 2 0 002-2v-3"/>
              </svg>
            </button>
            <button class="wallpaper-picker__close-btn" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M5 5l10 10M15 5L5 15"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="wallpaper-picker__file-input"
          @change="onFileUpload"
        />

        <!-- Upload hint -->
        <div v-if="wallpapers.length === 0 && !isUploading" class="wallpaper-picker__empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="8" y="8" width="32" height="32" rx="4"/>
            <circle cx="18" cy="18" r="4"/>
            <path d="M8 32l10-10 6 6 16-16"/>
          </svg>
          <p class="wallpaper-picker__empty-title">No wallpapers yet</p>
          <p class="wallpaper-picker__empty-hint">Tap the + button to upload an image</p>
        </div>

        <!-- Loading state -->
        <div v-if="isUploading" class="wallpaper-picker__loading">
          <div class="wallpaper-picker__spinner" />
          <span>Saving wallpaper...</span>
        </div>

        <!-- Wallpaper Gallery -->
        <div v-else class="wallpaper-picker__gallery">
          <!-- None option -->
          <button
            class="wallpaper-picker__item"
            :class="{ 'wallpaper-picker__item--active': currentWallpaperId === null }"
            @click="selectWallpaper(null)"
          >
            <div class="wallpaper-picker__item-preview wallpaper-picker__item-preview--default" />
            <span class="wallpaper-picker__item-name">None</span>
          </button>

          <!-- Wallpaper items -->
          <button
            v-for="wp in wallpapers"
            :key="wp.id"
            class="wallpaper-picker__item"
            :class="{ 'wallpaper-picker__item--active': currentWallpaperId === wp.id }"
            @click="selectWallpaper(wp.id)"
          >
            <div class="wallpaper-picker__item-preview">
              <img :src="wp.thumbnailUrl" :alt="wp.name" />
            </div>
            <span class="wallpaper-picker__item-name">{{ wp.name }}</span>
            <button
              class="wallpaper-picker__item-delete"
              @click.stop="confirmDelete(wp)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4"/>
              </svg>
            </button>
          </button>
        </div>

        <!-- Delete confirmation -->
        <div v-if="showDeleteConfirm" class="wallpaper-picker__delete-confirm">
          <p>Delete "{{ deleteTarget?.name }}"?</p>
          <div class="wallpaper-picker__delete-actions">
            <button @click="showDeleteConfirm = false">Cancel</button>
            <button class="wallpaper-picker__delete-btn" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { wallpaperService } from '../../utils/wallpaperService'
import type { WallpaperInfo } from '../../utils/wallpaperService'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'change', wallpaperId: string | null): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const wallpapers = ref<WallpaperInfo[]>([])
const currentWallpaperId = ref<string | null>(null)
const isUploading = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<WallpaperInfo | null>(null)

onMounted(async () => {
  try {
    await wallpaperService.init()
    await loadWallpapers()
  } catch {
    // Silently fail
  }
})

async function loadWallpapers() {
  try {
    wallpapers.value = await wallpaperService.getAllWallpapers()
    currentWallpaperId.value = wallpaperService.getCurrentWallpaperId()
  } catch (error) {
    console.error('[WallpaperPicker] Failed to load wallpapers:', error)
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

async function onFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Image must be less than 10MB')
    return
  }

  isUploading.value = true
  try {
    const wallpaper = await wallpaperService.saveWallpaper(file)
    currentWallpaperId.value = wallpaper.id
    wallpaperService.setCurrentWallpaperId(wallpaper.id)
    await loadWallpapers()
    emit('change', wallpaper.id)
  } catch (error) {
    console.error('[WallpaperPicker] Failed to save wallpaper:', error)
    alert('Failed to save wallpaper')
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

async function selectWallpaper(id: string | null) {
  currentWallpaperId.value = id
  wallpaperService.setCurrentWallpaperId(id)
  emit('change', id)
}

function confirmDelete(wp: WallpaperInfo) {
  deleteTarget.value = wp
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return

  try {
    await wallpaperService.deleteWallpaper(deleteTarget.value.id)
    if (currentWallpaperId.value === deleteTarget.value.id) {
      currentWallpaperId.value = null
      wallpaperService.setCurrentWallpaperId(null)
      emit('change', null)
    }
    await loadWallpapers()
  } catch (error) {
    console.error('[WallpaperPicker] Failed to delete wallpaper:', error)
  } finally {
    showDeleteConfirm.value = false
    deleteTarget.value = null
  }
}

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.wallpaper-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.wallpaper-picker {
  width: 100%;
  max-width: 600px;
  max-height: 80dvh;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: wallpaper-slide-up 0.3s ease;
}

@keyframes wallpaper-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.wallpaper-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.wallpaper-picker__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
}

.wallpaper-picker__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wallpaper-picker__action-btn,
.wallpaper-picker__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.wallpaper-picker__action-btn:active,
.wallpaper-picker__close-btn:active {
  opacity: 0.7;
}

.wallpaper-picker__file-input {
  display: none;
}

/* ── Empty State ────────────────────────────────────────────────────── */
.wallpaper-picker__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--gui-text-tertiary, #636366);
  text-align: center;
}

.wallpaper-picker__empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8E8E93);
  margin: 12px 0 4px;
}

.wallpaper-picker__empty-hint {
  font-size: 13px;
}

/* ── Loading ────────────────────────────────────────────────────────── */
.wallpaper-picker__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 14px;
}

.wallpaper-picker__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--gui-accent, #007AFF);
  border-radius: 50%;
  animation: wallpaper-spin 0.8s linear infinite;
}

@keyframes wallpaper-spin {
  to { transform: rotate(360deg); }
}

/* ── Gallery ────────────────────────────────────────────────────────── */
.wallpaper-picker__gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.wallpaper-picker__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease;
}

.wallpaper-picker__item:active {
  transform: scale(0.95);
}

.wallpaper-picker__item--active .wallpaper-picker__item-preview {
  box-shadow: 0 0 0 2px var(--gui-accent, #007AFF);
}

.wallpaper-picker__item-preview {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  overflow: hidden;
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.wallpaper-picker__item-preview--default {
  background: linear-gradient(135deg, var(--gui-bg-base, #0A0A0A), var(--gui-bg-surface, #2C2C2E));
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallpaper-picker__item-preview--default::after {
  content: '';
  width: 20px;
  height: 20px;
  border: 2px dashed var(--gui-text-tertiary, #636366);
  border-radius: 4px;
}

.wallpaper-picker__item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-picker__item-name {
  font-size: 11px;
  color: var(--gui-text-secondary, #8E8E93);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-picker__item-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #FF3B30;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.wallpaper-picker__item:hover .wallpaper-picker__item-delete,
.wallpaper-picker__item:active .wallpaper-picker__item-delete {
  opacity: 1;
}

/* ── Delete Confirmation ────────────────────────────────────────────── */
.wallpaper-picker__delete-confirm {
  padding: 16px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
  text-align: center;
}

.wallpaper-picker__delete-confirm p {
  font-size: 14px;
  color: var(--gui-text-primary, #FFFFFF);
  margin: 0 0 12px;
}

.wallpaper-picker__delete-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.wallpaper-picker__delete-actions button {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.wallpaper-picker__delete-actions button:first-child {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
}

.wallpaper-picker__delete-actions button:last-child {
  background: #FF3B30;
  color: #FFFFFF;
}

/* ── Transition ─────────────────────────────────────────────────────── */
.wallpaper-picker-enter-active,
.wallpaper-picker-leave-active {
  transition: opacity 0.3s ease;
}

.wallpaper-picker-enter-from,
.wallpaper-picker-leave-to {
  opacity: 0;
}
</style>

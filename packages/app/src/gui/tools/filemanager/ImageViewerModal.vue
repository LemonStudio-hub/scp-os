<template>
  <Transition name="fm-image-modal">
    <div v-if="visible" class="fm-image-viewer-overlay" @click.self="close">
      <div class="fm-image-viewer">
        <!-- Header -->
        <div class="fm-image-viewer__header">
          <span class="fm-image-viewer__title">{{ fileName }}</span>
          <div class="fm-image-viewer__actions">
            <button class="fm-image-viewer__action-btn" :title="t('viewer.rotate')" @click="rotate">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 3h3v3"/>
                <path d="M14 9a5 5 0 10-2 4"/>
              </svg>
            </button>
            <button class="fm-image-viewer__action-btn" :title="t('viewer.zoomIn')" @click="zoomIn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="8" cy="8" r="5"/>
                <path d="M12 12l4 4M6 8h4M8 6v4"/>
              </svg>
            </button>
            <button class="fm-image-viewer__action-btn" :title="t('viewer.zoomOut')" @click="zoomOut">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="8" cy="8" r="5"/>
                <path d="M12 12l4 4M6 8h4"/>
              </svg>
            </button>
            <button class="fm-image-viewer__action-btn" :title="t('viewer.reset')" @click="resetView">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 3v4h4M15 15v-4h-4"/>
                <path d="M15 3L9 9M3 15l6-6"/>
              </svg>
            </button>
            <button class="fm-image-viewer__close-btn" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M5 5l10 10M15 5L5 15"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Image Container -->
        <div
          ref="imageContainerRef"
          class="fm-image-viewer__container"
          @wheel.prevent="onWheel"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend.passive="onTouchEnd"
        >
          <img
            v-if="imageSrc"
            :src="imageSrc"
            :alt="fileName"
            class="fm-image-viewer__image"
            :style="imageStyle"
            @load="onImageLoad"
          />
          <div v-else class="fm-image-viewer__loading">
            <div class="fm-image-viewer__spinner" />
            <span>{{ t('viewer.loading') }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="fm-image-viewer__footer">
          <span class="fm-image-viewer__zoom">{{ Math.round(zoom * 100) }}%</span>
          <span v-if="imageDimensions" class="fm-image-viewer__dimensions">
            {{ imageDimensions.width }} x {{ imageDimensions.height }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../composables/useI18n'
import { filesystem } from '../../../utils/filesystem'

interface Props {
  visible: boolean
  file: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const imageSrc = ref<string>('')
// const imageContainerRef = ref<HTMLElement | null>(null)
const zoom = ref(1)
const rotation = ref(0)
const panX = ref(0)
const panY = ref(0)
const imageDimensions = ref<{ width: number; height: number } | null>(null)

const fileName = computed(() => props.file?.name || '')

const imageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value}) rotate(${rotation.value}deg)`,
  transition: 'transform 0.2s ease',
}))

watch(() => props.visible, async (val) => {
  if (val && props.file) {
    await loadImage()
  } else {
    resetView()
    imageSrc.value = ''
  }
})

async function loadImage() {
  try {
    const path = props.file.path || ('/' + props.file.name)
    const data = filesystem.readFile(path)
    
    if (data !== null && typeof data === 'string') {
      // Check if it's a data URL or a URL
      if (data.startsWith('data:') || data.startsWith('http')) {
        imageSrc.value = data
      } else {
        // Try as base64
        imageSrc.value = 'data:image/png;base64,' + data
      }
    }
  } catch (error) {
    console.error('[ImageViewer] Failed to load image:', error)
  }
}

function onImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  imageDimensions.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  }
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360
}

function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.25, 5)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.25, 0.1)
}

function resetView() {
  zoom.value = 1
  rotation.value = 0
  panX.value = 0
  panY.value = 0
}

function onWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  zoom.value = Math.max(0.1, Math.min(5, zoom.value * delta))
}

// Touch gestures for pinch-to-zoom
let touchStartDist = 0
let touchStartZoom = 1

function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    touchStartDist = getTouchDistance(event.touches[0], event.touches[1])
    touchStartZoom = zoom.value
  }
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length === 2) {
    const dist = getTouchDistance(event.touches[0], event.touches[1])
    const scale = dist / touchStartDist
    zoom.value = Math.max(0.1, Math.min(5, touchStartZoom * scale))
  }
}

function onTouchEnd() {
  // Reset touch state
}

function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.fm-image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.fm-image-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fm-image-fade-in 0.3s ease;
}

@keyframes fm-image-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.fm-image-viewer__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top, 12px));
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.fm-image-viewer__title {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-image-viewer__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fm-image-viewer__action-btn,
.fm-image-viewer__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  cursor: pointer;
  transition: background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.fm-image-viewer__action-btn:active,
.fm-image-viewer__close-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.fm-image-viewer__close-btn {
  width: 38px;
  height: 38px;
}

/* ── Image Container ────────────────────────────────────────────────── */
.fm-image-viewer__container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
}

.fm-image-viewer__image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.fm-image-viewer__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.fm-image-viewer__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: fm-spin 0.8s linear infinite;
}

@keyframes fm-spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.fm-image-viewer__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
}

/* ── Transition ─────────────────────────────────────────────────────── */
.fm-image-modal-enter-active,
.fm-image-modal-leave-active {
  transition: opacity 0.3s ease;
}

.fm-image-modal-enter-from,
.fm-image-modal-leave-to {
  opacity: 0;
}
</style>

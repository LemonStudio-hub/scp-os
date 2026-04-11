<template>
  <Transition name="media-modal">
    <div v-if="visible" class="video-player-overlay" @click.self="close">
      <div class="video-player">
        <!-- Header -->
        <div class="video-player__header">
          <div class="video-player__title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="3" width="14" height="10" rx="2"/>
              <path d="M6 6l4 2-4 2V6z"/>
            </svg>
            {{ fileName }}
          </div>
          <button class="video-player__close-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>

        <!-- Video Player -->
        <div class="video-player__body">
          <video
            v-if="videoSrc"
            ref="videoRef"
            controls
            class="video-player__native"
            @ended="onEnded"
          >
            <source :src="videoSrc" :type="mimeType" />
            Your browser does not support video playback.
          </video>
          <div v-else class="video-player__loading">
            <div class="video-player__spinner" />
            <span>Loading video...</span>
          </div>

          <!-- File Info -->
          <div class="video-player__info">
            <span class="video-player__name">{{ fileName }}</span>
            <span v-if="fileSize" class="video-player__size">{{ fileSize }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
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

const videoRef = ref<HTMLVideoElement | null>(null)
const videoSrc = ref<string>('')

const fileName = computed(() => props.file?.name || 'video.mp4')
const fileSize = computed(() => {
  const size = props.file?.size
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
})

const mimeType = computed(() => {
  const ext = fileName.value.split('.').pop()?.toLowerCase() || ''
  if (ext === 'mp4') return 'video/mp4'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'ogg') return 'video/ogg'
  return 'video/mp4'
})

watch(() => props.visible, async (val) => {
  if (val && props.file) {
    await loadVideo()
    await nextTick()
  } else {
    // Stop playback when closing
    if (videoRef.value) {
      videoRef.value.pause()
      videoRef.value.src = ''
    }
    videoSrc.value = ''
  }
})

async function loadVideo() {
  try {
    const path = props.file.path || ('/' + props.file.name)
    const data = filesystem.readFile(path)

    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        videoSrc.value = data
      } else {
        // Try as base64
        videoSrc.value = `data:${mimeType.value};base64,${data}`
      }
    }
  } catch (error) {
    console.error('[VideoPlayer] Failed to load video:', error)
  }
}

function onEnded() {
  // Video finished playing
}

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.video-player-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.video-player {
  width: 90%;
  max-width: 800px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 16px;
  overflow: hidden;
  animation: video-fade-in 0.3s ease;
}

@keyframes video-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.video-player__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.video-player__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-player__close-btn {
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
  flex-shrink: 0;
}

.video-player__close-btn:active {
  opacity: 0.7;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.video-player__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.video-player__native {
  width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  background: #000;
  outline: none;
}

.video-player__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 14px;
}

.video-player__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--gui-accent, #007AFF);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Info ───────────────────────────────────────────────────────────── */
.video-player__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  width: 100%;
}

.video-player__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gui-text-primary, #FFFFFF);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-player__size {
  font-size: 12px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Transition ─────────────────────────────────────────────────────── */
.media-modal-enter-active,
.media-modal-leave-active {
  transition: opacity 0.3s ease;
}

.media-modal-enter-from,
.media-modal-leave-to {
  opacity: 0;
}
</style>

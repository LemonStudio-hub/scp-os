<template>
  <Transition name="media-modal">
    <div v-if="visible" class="audio-player-overlay" @click.self="close">
      <div class="audio-player">
        <!-- Header -->
        <div class="audio-player__header">
          <div class="audio-player__title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 2v12M6 5l10-3v8L6 13V5z"/>
            </svg>
            {{ fileName }}
          </div>
          <button class="audio-player__close-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>

        <!-- Audio Player -->
        <div class="audio-player__body">
          <!-- Album Art Placeholder -->
          <div class="audio-player__art">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="32" cy="32" r="24"/>
              <circle cx="32" cy="32" r="8"/>
              <circle cx="32" cy="32" r="2"/>
            </svg>
          </div>

          <!-- Native Audio Controls -->
          <audio
            v-if="audioSrc"
            ref="audioRef"
            controls
            class="audio-player__native"
            @ended="onEnded"
          >
            <source :src="audioSrc" :type="mimeType" />
            Your browser does not support audio playback.
          </audio>

          <!-- File Info -->
          <div class="audio-player__info">
            <span class="audio-player__name">{{ fileName }}</span>
            <span class="audio-player__size" v-if="fileSize">{{ fileSize }}</span>
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

const audioRef = ref<HTMLAudioElement | null>(null)
const audioSrc = ref<string>('')

const fileName = computed(() => props.file?.name || 'audio.mp3')
const fileSize = computed(() => {
  const size = props.file?.size
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
})

const mimeType = computed(() => {
  const ext = fileName.value.split('.').pop()?.toLowerCase() || ''
  if (ext === 'mp3') return 'audio/mpeg'
  if (ext === 'wav') return 'audio/wav'
  if (ext === 'ogg') return 'audio/ogg'
  return 'audio/mpeg'
})

watch(() => props.visible, async (val) => {
  if (val && props.file) {
    await loadAudio()
    await nextTick()
  } else {
    // Stop playback when closing
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.src = ''
    }
    audioSrc.value = ''
  }
})

async function loadAudio() {
  try {
    const path = props.file.path || ('/' + props.file.name)
    const data = filesystem.readFile(path)

    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        audioSrc.value = data
      } else {
        // Try as base64
        audioSrc.value = `data:${mimeType.value};base64,${data}`
      }
    }
  } catch (error) {
    console.error('[AudioPlayer] Failed to load audio:', error)
  }
}

function onEnded() {
  // Audio finished playing
}

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.audio-player-overlay {
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

.audio-player {
  width: 100%;
  max-width: 500px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  animation: audio-slide-up 0.3s ease;
}

@keyframes audio-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.audio-player__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.audio-player__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
}

.audio-player__close-btn {
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

.audio-player__close-btn:active {
  opacity: 0.7;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.audio-player__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 16px;
}

.audio-player__art {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gui-accent, #007AFF), var(--gui-accent-muted, rgba(0,122,255,0.5)));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  animation: spin-slow 20s linear infinite;
}

.audio-player__art.paused {
  animation-play-state: paused;
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}

.audio-player__native {
  width: 100%;
  max-width: 400px;
  height: 40px;
  border-radius: 8px;
  outline: none;
}

/* Custom audio controls styling for WebKit */
.audio-player__native::-webkit-media-controls-panel {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

/* ── Info ───────────────────────────────────────────────────────────── */
.audio-player__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.audio-player__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gui-text-primary, #FFFFFF);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-player__size {
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

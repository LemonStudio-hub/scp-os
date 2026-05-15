<template>
  <div :class="['scp-file-icon', `scp-file-icon--${type}`, `scp-file-icon--${sizeClass}`]">
    <GUIIcon :name="iconName" :size="size" class="scp-file-icon__svg" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GUIIcon from './GUIIcon.vue'
import type { IconName } from '../../icons'

interface Props {
  name: string
  isDirectory: boolean
  size?: number
  sizeClass?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  sizeClass: 'md',
})

const iconName = computed<IconName>(() => {
  if (props.isDirectory) return 'folder'

  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, IconName> = {
    // Code
    ts: 'code',
    js: 'code',
    json: 'code',
    html: 'code',
    css: 'code',
    vue: 'code',
    py: 'code',
    rs: 'code',
    go: 'code',
    sh: 'code',
    // Documents
    md: 'file-text',
    txt: 'file-text',
    log: 'file-text',
    csv: 'list',
    pdf: 'pdf',
    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    bmp: 'image',
    ico: 'image',
    // Audio
    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    flac: 'audio',
    aac: 'audio',
    m4a: 'audio',
    // Video
    mp4: 'video',
    webm: 'video',
    avi: 'video',
    mov: 'video',
    mkv: 'video',
    // Archives
    zip: 'archive',
    tar: 'archive',
    gz: 'archive',
    rar: 'archive',
    '7z': 'archive',
  }

  return iconMap[ext] || 'file'
})

const type = computed(() => {
  if (props.isDirectory) return 'folder'
  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  const codeExts = ['ts', 'js', 'json', 'html', 'css', 'vue', 'py', 'rs', 'go', 'sh']
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv']
  const docExts = ['md', 'txt', 'log', 'csv', 'pdf']
  const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z']
  if (codeExts.includes(ext)) return 'code'
  if (imageExts.includes(ext)) return 'image'
  if (audioExts.includes(ext)) return 'audio'
  if (videoExts.includes(ext)) return 'video'
  if (docExts.includes(ext)) return 'document'
  if (archiveExts.includes(ext)) return 'archive'
  return 'file'
})
</script>

<style scoped>
.scp-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--gui-transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.scp-file-icon__svg {
  transition: color var(--gui-transition-fast, 120ms ease);
}

/* Size variants */
.scp-file-icon--sm { width: 16px; height: 16px; }
.scp-file-icon--md { width: 20px; height: 20px; }
.scp-file-icon--lg { width: 32px; height: 32px; }
.scp-file-icon--xl { width: 48px; height: 48px; }

/* Type colors */
.scp-file-icon--folder .scp-file-icon__svg { color: var(--gui-accent, #e94560); }
.scp-file-icon--code .scp-file-icon__svg { color: #60a5fa; }
.scp-file-icon--image .scp-file-icon__svg { color: #34d399; }
.scp-file-icon--audio .scp-file-icon__svg { color: #a78bfa; }
.scp-file-icon--video .scp-file-icon__svg { color: #fbbf24; }
.scp-file-icon--document .scp-file-icon__svg { color: var(--gui-text-secondary, #a8a8a8); }
.scp-file-icon--archive .scp-file-icon__svg { color: #fb923c; }
.scp-file-icon--file .scp-file-icon__svg { color: var(--gui-text-tertiary, #6a6a6a); }

/* Hover effects */
.scp-file-icon:hover {
  transform: scale(1.1);
}
</style>

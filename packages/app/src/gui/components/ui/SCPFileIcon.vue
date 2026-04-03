<template>
  <div :class="['scp-file-icon', `scp-file-icon--${type}`]">
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
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
})

const iconName = computed<IconName>(() => {
  if (props.isDirectory) return 'folder'

  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, IconName> = {
    ts: 'file', js: 'file', json: 'file', html: 'file', css: 'file',
    vue: 'file', py: 'file', rs: 'file', go: 'file', sh: 'file',
    md: 'edit', txt: 'file', log: 'file', csv: 'list',
    png: 'file', jpg: 'file', jpeg: 'file', gif: 'file', svg: 'file', webp: 'file',
    zip: 'file', tar: 'file', gz: 'file',
  }

  return iconMap[ext] || 'file'
})

const type = computed(() => {
  if (props.isDirectory) return 'folder'
  const ext = props.name.split('.').pop()?.toLowerCase() || ''
  const codeExts = ['ts', 'js', 'json', 'html', 'css', 'vue', 'py', 'rs', 'go', 'sh']
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
  const docExts = ['md', 'txt', 'log', 'csv']
  if (codeExts.includes(ext)) return 'code'
  if (imageExts.includes(ext)) return 'image'
  if (docExts.includes(ext)) return 'document'
  return 'file'
})
</script>

<style scoped>
.scp-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: transform var(--gui-transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.scp-file-icon__svg {
  color: var(--gui-text-secondary, #a8a8a8);
  transition: color var(--gui-transition-fast, 120ms ease);
}

.scp-file-icon:hover {
  transform: scale(1.1);
}

.scp-file-icon--folder:hover .scp-file-icon__svg {
  color: var(--gui-accent, #e94560);
}

.scp-file-icon--code:hover .scp-file-icon__svg {
  color: var(--gui-info, #60a5fa);
}

.scp-file-icon--image:hover .scp-file-icon__svg {
  color: var(--gui-success, #34d399);
}
</style>

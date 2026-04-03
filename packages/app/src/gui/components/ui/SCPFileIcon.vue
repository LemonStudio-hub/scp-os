<template>
  <div :class="['scp-file-icon', `scp-file-icon--${type}`]" :title="fileType">
    <span class="scp-file-icon__emoji">{{ icon }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  isDirectory: boolean
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 0,
})

const icon = computed(() => {
  if (props.isDirectory) return '📁'

  const ext = props.name.split('.').pop()?.toLowerCase() || ''

  const iconMap: Record<string, string> = {
    ts: '📘', js: '📗', json: '📋', html: '🌐', css: '🎨',
    vue: '💚', py: '🐍', rs: '🦀', go: '🔵', sh: '⚙️',
    md: '📝', txt: '📄', log: '📃', csv: '📊',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    zip: '📦', tar: '📦', gz: '📦',
  }

  return iconMap[ext] || '📄'
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

const fileType = computed(() => {
  if (props.isDirectory) return 'Folder'
  const ext = props.name.split('.').pop()?.toUpperCase() || ''
  return ext ? `${ext} File` : 'File'
})
</script>

<style scoped>
.scp-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 20px;
  transition: transform var(--gui-transition-spring, 400ms cubic-bezier(0.34, 1.56, 0.64, 1));
}

.scp-file-icon__emoji {
  line-height: 1;
}

/* Subtle hover lift */
.scp-file-icon:hover {
  transform: scale(1.1);
}

/* Type-specific subtle glows */
.scp-file-icon--folder:hover .scp-file-icon__emoji {
  filter: drop-shadow(0 2px 4px rgba(233, 165, 96, 0.3));
}

.scp-file-icon--code:hover .scp-file-icon__emoji {
  filter: drop-shadow(0 2px 4px rgba(96, 165, 250, 0.3));
}

.scp-file-icon--image:hover .scp-file-icon__emoji {
  filter: drop-shadow(0 2px 4px rgba(52, 211, 153, 0.3));
}
</style>

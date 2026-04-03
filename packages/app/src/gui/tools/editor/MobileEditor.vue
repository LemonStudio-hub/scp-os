<template>
  <MobileWindow
    :visible="visible"
    :title="editorStore.activeFile?.name || 'Text Editor'"
    :show-back="true"
    @close="onClose"
  >
    <div class="mobile-editor">
      <!-- Tab Bar (iOS Segmented Control style) -->
      <div v-if="editorStore.openFiles.length > 0" class="mobile-editor__tabs">
        <button
          v-for="file in editorStore.openFiles"
          :key="file.id"
          :class="['mobile-editor__tab', { 'mobile-editor__tab--active': file.id === editorStore.activeFileId }]"
          @click="editorStore.setActiveFile(file.id)"
        >
          {{ file.name }}
          <span v-if="file.dirty" class="mobile-editor__dirty" />
        </button>
      </div>

      <!-- Editor Area -->
      <textarea
        ref="textareaRef"
        :value="activeFileContent"
        class="mobile-editor__textarea gui-scrollable"
        :style="{ fontSize: `${editorStore.fontSize}px` }"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
      />

      <!-- Keyboard Toolbar -->
      <div class="mobile-editor__keyboard-bar">
        <button class="mobile-editor__kb-btn" @click="insertText('\t')">Tab</button>
        <button class="mobile-editor__kb-btn" @click="moveCursor('left')">←</button>
        <button class="mobile-editor__kb-btn" @click="moveCursor('right')">→</button>
        <button class="mobile-editor__kb-btn" @click="moveCursor('up')">↑</button>
        <button class="mobile-editor__kb-btn" @click="moveCursor('down')">↓</button>
        <button class="mobile-editor__kb-btn" @click="saveFile">💾</button>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useTextEditorStore } from '../../stores/textEditor'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const editorStore = useTextEditorStore()
const textareaRef = ref<HTMLTextAreaElement>()

const activeFileContent = computed(() => {
  return editorStore.activeFile?.content ?? ''
})

function onInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  if (editorStore.activeFileId) {
    editorStore.updateContent(editorStore.activeFileId, target.value)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveFile()
  }
}

function insertText(text: string): void {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const value = ta.value
  ta.value = value.substring(0, start) + text + value.substring(ta.selectionEnd)
  ta.selectionStart = ta.selectionEnd = start + text.length
  onInput({ target: ta } as any)
  ta.focus()
}

function moveCursor(direction: 'left' | 'right' | 'up' | 'down'): void {
  const ta = textareaRef.value
  if (!ta) return
  const pos = ta.selectionStart
  const value = ta.value

  switch (direction) {
    case 'left':
      ta.selectionStart = ta.selectionEnd = Math.max(0, pos - 1)
      break
    case 'right':
      ta.selectionStart = ta.selectionEnd = Math.min(value.length, pos + 1)
      break
    case 'up': {
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1
      const prevLineStart = lineStart > 0 ? value.lastIndexOf('\n', lineStart - 2) + 1 : 0
      const col = pos - lineStart
      ta.selectionStart = ta.selectionEnd = Math.min(prevLineStart + col, lineStart > 0 ? lineStart - 1 : value.length)
      break
    }
    case 'down': {
      const lineEnd = value.indexOf('\n', pos)
      const nextLineEnd = lineEnd >= 0 ? value.indexOf('\n', lineEnd + 1) : -1
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1
      const col = pos - lineStart
      const nextLineStart = lineEnd >= 0 ? lineEnd + 1 : value.length
      ta.selectionStart = ta.selectionEnd = Math.min(nextLineStart + col, nextLineEnd >= 0 ? nextLineEnd : value.length)
      break
    }
  }
  ta.focus()
}

function saveFile(): void {
  if (editorStore.activeFileId) {
    editorStore.saveFile(editorStore.activeFileId)
  }
}

function onClose(): void {
  // Check for unsaved changes
  if (editorStore.hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Close anyway?')) {
      return
    }
  }
  editorStore.closeAll()
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

/* ── Tab Bar (Segmented Control) ────────────────────────────────────── */
.mobile-editor__tabs {
  display: flex;
  gap: var(--gui-spacing-xxs, 2px);
  padding: var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-editor__tabs::-webkit-scrollbar {
  display: none;
}

.mobile-editor__tab {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 4px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-md, 12px);
  background: var(--gui-bg-surface-raised, #111111);
  border: none;
  border-radius: var(--gui-radius-full, 9999px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--gui-transition-fast, 120ms ease);
  -webkit-tap-highlight-color: transparent;
}

.mobile-editor__tab--active {
  background: var(--gui-accent, #e94560);
  color: #fff;
}

.mobile-editor__dirty {
  width: 5px;
  height: 5px;
  background: var(--gui-warning, #fbbf24);
  border-radius: var(--gui-radius-full, 9999px);
}

/* ── Textarea ───────────────────────────────────────────────────────── */
.mobile-editor__textarea {
  flex: 1;
  background: var(--gui-editor-bg, #0a0a0a);
  color: var(--gui-text-primary, #f0f0f0);
  border: none;
  outline: none;
  resize: none;
  padding: var(--gui-spacing-base, 16px);
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", Consolas, monospace);
  font-size: var(--gui-font-base, 13px);
  line-height: var(--gui-line-height-relaxed, 1.7);
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  /* Prevent iOS zoom on focus */
  font-size: 16px !important;
}

/* ── Keyboard Toolbar ───────────────────────────────────────────────── */
.mobile-editor__keyboard-bar {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  padding-bottom: calc(var(--gui-spacing-xs, 4px) + env(safe-area-inset-bottom, 0px));
  background: var(--gui-bg-surface, #0c0c0c);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-editor__keyboard-bar::-webkit-scrollbar {
  display: none;
}

.mobile-editor__kb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 36px;
  padding: 0 var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface-raised, #111111);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--gui-transition-fast, 120ms ease);
  flex-shrink: 0;
}

.mobile-editor__kb-btn:active {
  background: var(--gui-bg-surface-active, #222222);
}
</style>

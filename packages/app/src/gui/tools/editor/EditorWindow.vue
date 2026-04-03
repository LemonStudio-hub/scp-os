<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="text-editor">
      <!-- Menu Bar -->
      <div class="text-editor__menu">
        <div class="text-editor__menu-item" @click="editorStore.openNewFile()">File</div>
        <div class="text-editor__menu-item" @click="saveActive">Save</div>
        <div class="text-editor__menu-item" @click="saveAll">Save All</div>
      </div>

      <!-- Tab Bar -->
      <SCPTabs
        :tabs="editorTabs"
        :active-tab-id="editorStore.activeFileId ?? undefined"
        closable
        @activate="editorStore.setActiveFile"
        @close="onCloseFile"
      />

      <!-- Editor Area -->
      <div class="text-editor__area">
        <template v-if="editorStore.openFiles.length === 0">
          <div class="text-editor__empty">
            <span class="text-editor__empty-icon">📝</span>
            <p>No files open</p>
            <p class="text-editor__empty-hint">Click "File" to create a new file</p>
          </div>
        </template>
        <template v-else>
          <textarea
            ref="textareaRef"
            :value="activeFileContent"
            class="text-editor__textarea gui-scrollable"
            :style="{ fontSize: `${editorStore.fontSize}px` }"
            spellcheck="false"
            @input="onInput"
            @keydown="onKeydown"
          />
        </template>
      </div>

      <!-- Status Bar -->
      <SCPStatusBar
        :left-items="statusLeftItems"
        :right-items="statusRightItems"
      />
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPTabs from '../../components/ui/SCPTabs.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import { useTextEditorStore } from '../../stores/textEditor'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const editorStore = useTextEditorStore()
const textareaRef = ref<HTMLTextAreaElement>()

const activeFileContent = computed(() => {
  return editorStore.activeFile?.content ?? ''
})

const editorTabs = computed(() => {
  return editorStore.openFiles.map(f => ({
    id: f.id,
    label: f.name,
    dirty: f.dirty,
  }))
})

const statusLeftItems = computed(() => {
  const items: string[] = []
  if (editorStore.activeFile) {
    items.push(editorStore.activeFile.language)
    items.push(`Ln ${countLines()}, Col 1`)
  }
  return items
})

const statusRightItems = computed(() => {
  const items: string[] = []
  if (editorStore.hasUnsavedChanges) {
    items.push('● Unsaved')
  }
  items.push('UTF-8')
  return items
})

function countLines(): number {
  if (!editorStore.activeFile) return 0
  return editorStore.activeFile.content.split('\n').length
}

function onInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  if (editorStore.activeFileId) {
    editorStore.updateContent(editorStore.activeFileId, target.value)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveActive()
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = ' '.repeat(editorStore.tabSize)
      const value = textarea.value
      textarea.value = value.substring(0, start) + spaces + value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + editorStore.tabSize
      onInput({ target: textarea } as any)
    }
  }
}

function saveActive(): void {
  if (editorStore.activeFileId) {
    editorStore.saveFile(editorStore.activeFileId)
  }
}

function saveAll(): void {
  editorStore.saveAll()
}

function onCloseFile(fileId: string): void {
  editorStore.closeFile(fileId)
}

function onClose(): void {
  // Window manager handles cleanup
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-window-bg, #0e0e0e);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

.text-editor__menu {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.text-editor__menu-item {
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #a8a8a8);
  cursor: pointer;
  border-radius: var(--gui-radius-sm, 6px);
  transition: all var(--gui-transition-fast, 120ms ease);
  font-weight: var(--gui-font-weight-medium, 500);
  letter-spacing: 0.02em;
}

.text-editor__menu-item:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__area {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

/* ── Textarea ───────────────────────────────────────────────────────── */
.text-editor__textarea {
  width: 100%;
  height: 100%;
  background: var(--gui-editor-bg, #0a0a0a);
  color: var(--gui-text-primary, #f0f0f0);
  border: none;
  outline: none;
  resize: none;
  padding: var(--gui-spacing-base, 16px);
  font-family: var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace);
  font-size: var(--gui-font-base, 13px);
  line-height: var(--gui-line-height-relaxed, 1.7);
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  letter-spacing: 0.01em;
}

.text-editor__textarea::placeholder {
  color: var(--gui-text-tertiary, #6a6a6a);
}

/* ── Empty State ────────────────────────────────────────────────────── */
.text-editor__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: var(--gui-font-sm, 12px);
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.text-editor__empty-icon {
  font-size: 48px;
  margin-bottom: var(--gui-spacing-base, 16px);
  opacity: 0.5;
}

.text-editor__empty-hint {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-disabled, #444444);
  margin-top: var(--gui-spacing-xs, 4px);
}
</style>

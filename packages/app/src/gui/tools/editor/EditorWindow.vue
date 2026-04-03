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
            <span>📝</span>
            <p>No files open</p>
            <p class="text-editor__empty-hint">Click "File" to create a new file</p>
          </div>
        </template>
        <template v-else>
          <textarea
            ref="textareaRef"
            :value="activeFileContent"
            class="text-editor__textarea"
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
    items.push(`Ln ${countLines()}, Col ${1}`)
  }
  return items
})

const statusRightItems = computed(() => {
  const items: string[] = []
  if (editorStore.hasUnsavedChanges) {
    items.push('● Unsaved')
  }
  items.push(`UTF-8`)
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
  // Ctrl+S / Cmd+S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveActive()
  }
  // Tab key inserts spaces
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
.text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-color-editor-bg, #0d0d0d);
}

.text-editor__menu {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
}

.text-editor__menu-item {
  padding: 4px 10px;
  font-size: var(--gui-font-sm, 12px);
  color: var(--gui-color-text-secondary, #a0a0a0);
  cursor: pointer;
  border-radius: var(--gui-radius-sm, 4px);
  transition: all var(--gui-transition-fast, 150ms ease);
}

.text-editor__menu-item:hover {
  background: var(--gui-color-bg-hover, #1e1e1e);
  color: var(--gui-color-text-primary, #e0e0e0);
}

.text-editor__area {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.text-editor__textarea {
  width: 100%;
  height: 100%;
  background: var(--gui-color-editor-bg, #0d0d0d);
  color: var(--gui-color-text-primary, #e0e0e0);
  border: none;
  outline: none;
  resize: none;
  padding: 12px 16px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.text-editor__textarea::placeholder {
  color: var(--gui-color-text-muted, #666666);
}

.text-editor__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--gui-color-text-muted, #666666);
  font-size: var(--gui-font-sm, 12px);
}

.text-editor__empty span {
  font-size: 48px;
  margin-bottom: 12px;
}

.text-editor__empty-hint {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-color-text-disabled, #444444);
}
</style>

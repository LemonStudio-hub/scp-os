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
      <div class="text-editor__area" ref="editorContainerRef">
        <template v-if="editorStore.openFiles.length === 0">
          <div class="text-editor__empty">
            <GUIIcon name="empty-doc" :size="48" class="text-editor__empty-icon" />
            <p>No files open</p>
            <p class="text-editor__empty-hint">Click "File" to create a new file</p>
          </div>
        </template>
        <template v-else>
          <!-- CodeMirror container -->
          <div ref="codemirrorRef" class="text-editor__codemirror" />
          <!-- Status overlay for find/replace -->
          <div v-if="showFindReplace" class="text-editor__find-replace">
            <div class="text-editor__find-row">
              <svg class="text-editor__find-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="7" cy="7" r="4.5"/>
                <path d="M10.5 10.5L14 14"/>
              </svg>
              <input
                ref="findInputRef"
                v-model="findText"
                class="text-editor__find-input"
                placeholder="Find"
                @input="performFind"
                @keydown.enter="findNext"
                @keydown.escape="closeFindReplace"
              />
              <button class="text-editor__find-btn" @click="findPrev" :aria-label="'Find previous'">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M13 10L8 5L3 10"/>
                </svg>
              </button>
              <button class="text-editor__find-btn" @click="findNext" :aria-label="'Find next'">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 6L8 11L13 6"/>
                </svg>
              </button>
              <span v-if="findCount > 0" class="text-editor__find-count">{{ findCurrentIndex }}/{{ findCount }}</span>
            </div>
            <div class="text-editor__find-row">
              <svg class="text-editor__find-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 4h10M3 8h10M3 12h10"/>
              </svg>
              <input
                v-model="replaceText"
                class="text-editor__find-input"
                placeholder="Replace"
                @keydown.enter="replaceCurrent"
                @keydown.ctrl.enter="replaceAll"
                @keydown.escape="closeFindReplace"
              />
              <button class="text-editor__find-btn" @click="replaceCurrent">Replace</button>
              <button class="text-editor__find-btn" @click="replaceAll">All</button>
            </div>
            <button class="text-editor__find-close" @click="closeFindReplace">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 2l10 10M12 2L2 12"/>
              </svg>
            </button>
          </div>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, type ViewUpdate } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, foldGutter, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPTabs from '../../components/ui/SCPTabs.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import GUIIcon from '../../components/ui/GUIIcon.vue'
import { useTextEditorStore } from '../../stores/textEditor'
import { registerShortcut, setContext } from '../../composables/useKeyboardShortcuts'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()

const editorStore = useTextEditorStore()
const codemirrorRef = ref<HTMLElement>()
const findInputRef = ref<HTMLInputElement>()

// CodeMirror instances
let editorView: EditorView | null = null
const stateCompartment = new Compartment()
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const fontSizeCompartment = new Compartment()

// Find/Replace state
const showFindReplace = ref(false)
const findText = ref('')
const replaceText = ref('')
const findCount = ref(0)
const findCurrentIndex = ref(0)

const editorTabs = computed(() => {
  return editorStore.openFiles.map(f => ({
    id: f.id,
    label: f.name,
    dirty: f.dirty,
  }))
})

const statusLeftItems = computed(() => {
  const items: string[] = []
  const file = editorStore.activeFile
  if (file) {
    items.push(file.language)
    // Line/col from CodeMirror
    if (editorView) {
      const state = editorView.state
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const col = pos - line.from + 1
      items.push(`Ln ${line.number}, Col ${col}`)
    } else {
      items.push('Ln 1, Col 1')
    }
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

/**
 * Detect language from file extension
 */
function detectLanguage(fileName: string): any {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, any> = {
    js: javascript({ jsx: true, typescript: false }),
    jsx: javascript({ jsx: true, typescript: false }),
    ts: javascript({ jsx: true, typescript: true }),
    tsx: javascript({ jsx: true, typescript: true }),
    py: python(),
    html: html(),
    htm: html(),
    css: css(),
    scss: css(),
    json: json(),
    md: markdown(),
    sql: sql(),
    sh: undefined, // Shell not supported in CodeMirror 6
    bash: undefined,
  }
  return languageMap[ext || ''] || undefined
}

/**
 * Create CodeMirror theme
 */
function createTheme(): any {
  return EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'var(--gui-editor-bg, #0a0a0a)',
      color: 'var(--gui-text-primary, #f0f0f0)',
      fontSize: `${editorStore.fontSize}px`,
      fontFamily: 'var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace)',
    },
    '&.cm-editor.cm-focused': {
      outline: 'none',
    },
    '.cm-content': {
      padding: '16px',
      lineHeight: '1.7',
      letterSpacing: '0.01em',
      caretColor: 'var(--gui-accent, #8E8E93)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--gui-accent, #8E8E93)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--gui-bg-surface, #2C2C2E)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--gui-editor-bg, #0a0a0a)',
      borderRight: '1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06))',
      color: 'var(--gui-text-tertiary, #6a6a6a)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 12px',
      minWidth: '40px',
    },
    '.cm-selectionBackground': {
      background: 'rgba(142, 142, 147, 0.25) !important',
    },
    '.cm-selectionMatch': {
      background: 'rgba(142, 142, 147, 0.15)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(142, 142, 147, 0.3)',
      outline: '1px solid var(--gui-accent, #8E8E93)',
    },
    '.cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
    },
    '.cm-scroller::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '6px',
    },
    '.cm-panels': {
      display: 'none', // Hide default search panel, we use custom UI
    },
  })
}

/**
 * Initialize CodeMirror editor
 */
function initEditor(): void {
  if (!codemirrorRef.value) return

  // Destroy existing editor
  if (editorView) {
    editorView.destroy()
    editorView = null
  }

  const file = editorStore.activeFile
  if (!file) return

  // Detect language
  const langExtension = detectLanguage(file.name)

  // Create extensions
  const extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    bracketMatching(),
    closeBrackets(),
    syntaxHighlighting(defaultHighlightStyle),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    stateCompartment.of([]), // For syncing document
    languageCompartment.of(langExtension ? [langExtension] : []),
    themeCompartment.of(createTheme()),
    fontSizeCompartment.of(EditorView.theme({
      '&': { fontSize: `${editorStore.fontSize}px` },
    })),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString()
        if (editorStore.activeFileId && newContent !== editorStore.activeFile?.content) {
          editorStore.updateContent(editorStore.activeFileId, newContent)
        }
      }
    }),
    EditorState.tabSize.of(editorStore.tabSize),
  ]

  const startState = EditorState.create({
    doc: file.content,
    extensions,
  })

  editorView = new EditorView({
    state: startState,
    parent: codemirrorRef.value,
  })
}

/**
 * Update editor language when file changes
 */
function updateLanguage(): void {
  if (!editorView) return
  const file = editorStore.activeFile
  if (!file) return

  const langExtension = detectLanguage(file.name)
  editorView.dispatch({
    effects: languageCompartment.reconfigure(langExtension ? [langExtension] : []),
  })
}

/**
 * Update editor font size
 */
function updateFontSize(): void {
  if (!editorView) return
  editorView.dispatch({
    effects: fontSizeCompartment.reconfigure(EditorView.theme({
      '&': { fontSize: `${editorStore.fontSize}px` },
    })),
  })
}

/**
 * Save active file
 */
function saveActive(): void {
  if (editorStore.activeFileId) {
    editorStore.saveFile(editorStore.activeFileId)
  }
}

/**
 * Save all open files
 */
function saveAll(): void {
  editorStore.saveAll()
}

/**
 * Close a file
 */
function onCloseFile(fileId: string): void {
  editorStore.closeFile(fileId)
  // Re-init editor if needed
  if (editorStore.openFiles.length > 0) {
    nextTick(() => initEditor())
  }
}

/**
 * Handle window close
 */
function onClose(): void {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

/**
 * Open find/replace panel
 */
function openFindReplace(): void {
  showFindReplace.value = true
  findCount.value = 0
  findCurrentIndex.value = 0
  nextTick(() => {
    findInputRef.value?.focus()
  })
}

/**
 * Close find/replace panel
 */
function closeFindReplace(): void {
  showFindReplace.value = false
  findText.value = ''
  replaceText.value = ''
}

/**
 * Perform find operation
 */
function performFind(): void {
  if (!editorView || !findText.value) {
    findCount.value = 0
    findCurrentIndex.value = 0
    return
  }

  const doc = editorView.state.doc.toString()
  const text = findText.value
  const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  const matches = doc.match(regex)

  findCount.value = matches ? matches.length : 0
  findCurrentIndex.value = findCount.value > 0 ? 1 : 0

  // Find first occurrence
  if (matches && matches.length > 0) {
    const firstMatch = doc.indexOf(text)
    if (firstMatch !== -1) {
      editorView.dispatch({
        selection: { anchor: firstMatch, head: firstMatch + text.length },
        effects: EditorView.scrollIntoView(firstMatch, { y: 'center' }),
      })
    }
  }
}

/**
 * Find next occurrence
 */
function findNext(): void {
  if (!editorView || !findText.value || findCount.value === 0) return

  const doc = editorView.state.doc.toString()
  const text = findText.value
  const currentPos = editorView.state.selection.main.head
  const nextPos = doc.indexOf(text, currentPos)

  if (nextPos !== -1) {
    findCurrentIndex.value = Math.min(findCurrentIndex.value + 1, findCount.value)
    editorView.dispatch({
      selection: { anchor: nextPos, head: nextPos + text.length },
      effects: EditorView.scrollIntoView(nextPos, { y: 'center' }),
    })
  } else {
    // Wrap around
    const wrapPos = doc.indexOf(text)
    if (wrapPos !== -1) {
      findCurrentIndex.value = 1
      editorView.dispatch({
        selection: { anchor: wrapPos, head: wrapPos + text.length },
        effects: EditorView.scrollIntoView(wrapPos, { y: 'center' }),
      })
    }
  }
}

/**
 * Find previous occurrence
 */
function findPrev(): void {
  if (!editorView || !findText.value || findCount.value === 0) return

  const doc = editorView.state.doc.toString()
  const text = findText.value
  const currentPos = editorView.state.selection.main.anchor
  const prevPos = doc.lastIndexOf(text, currentPos - 1)

  if (prevPos !== -1) {
    findCurrentIndex.value = Math.max(findCurrentIndex.value - 1, 1)
    editorView.dispatch({
      selection: { anchor: prevPos, head: prevPos + text.length },
      effects: EditorView.scrollIntoView(prevPos, { y: 'center' }),
    })
  } else {
    // Wrap around to end
    const wrapPos = doc.lastIndexOf(text)
    if (wrapPos !== -1) {
      findCurrentIndex.value = findCount.value
      editorView.dispatch({
        selection: { anchor: wrapPos, head: wrapPos + text.length },
        effects: EditorView.scrollIntoView(wrapPos, { y: 'center' }),
      })
    }
  }
}

/**
 * Replace current match
 */
function replaceCurrent(): void {
  if (!editorView || !findText.value || findCount.value === 0) return

  const currentSelection = editorView.state.selection.main
  const currentText = editorView.state.doc.sliceString(currentSelection.from, currentSelection.to)

  if (currentText === findText.value) {
    editorView.dispatch({
      changes: {
        from: currentSelection.from,
        to: currentSelection.to,
        insert: replaceText.value,
      },
    })
    findNext()
  } else {
    findNext()
  }
}

/**
 * Replace all matches
 */
function replaceAll(): void {
  if (!editorView || !findText.value || findCount.value === 0) return

  const doc = editorView.state.doc.toString()
  const regex = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  const newContent = doc.replace(regex, replaceText.value)

  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: newContent,
    },
  })

  if (editorStore.activeFileId) {
    editorStore.updateContent(editorStore.activeFileId, newContent)
  }

  findCount.value = 0
  findCurrentIndex.value = 0
}

// Watch for file changes
watch(() => editorStore.activeFileId, () => {
  if (editorStore.openFiles.length > 0) {
    nextTick(() => initEditor())
    updateLanguage()
  }
})

// Watch for font size changes
watch(() => editorStore.fontSize, () => {
  updateFontSize()
})

// Set context and register shortcuts
onMounted(() => {
  setContext('editor')
  nextTick(() => initEditor())

  // Register editor-specific shortcuts
  registerShortcut({
    id: 'editor-find',
    keys: 'Ctrl+F',
    description: '打开查找/替换',
    category: 'editor',
    context: 'editor',
    handler: () => openFindReplace(),
  })

  registerShortcut({
    id: 'editor-save',
    keys: 'Ctrl+S',
    description: '保存文件',
    category: 'editor',
    context: 'editor',
    handler: () => saveActive(),
  })
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})
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

/* ── CodeMirror Container ──────────────────────────────────────────── */
.text-editor__codemirror {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.text-editor__codemirror :deep(.cm-editor) {
  height: 100%;
}

.text-editor__codemirror :deep(.cm-scroller) {
  overflow: auto;
}

/* ── Find/Replace Panel ────────────────────────────────────────────── */
.text-editor__find-replace {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 100;
  background: var(--gui-bg-surface, #2C2C2E);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-md, 8px);
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  min-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: findSlideIn 0.2s ease-out;
}

@keyframes findSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-editor__find-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-editor__find-icon {
  color: var(--gui-text-tertiary, #6a6a6a);
  flex-shrink: 0;
}

.text-editor__find-input {
  flex: 1;
  background: var(--gui-bg-base, #0A0A0A);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  padding: 6px 10px;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  font-family: var(--gui-font-mono, "JetBrains Mono", monospace);
  outline: none;
  transition: border-color 0.2s ease;
}

.text-editor__find-input:focus {
  border-color: var(--gui-accent, #8E8E93);
}

.text-editor__find-input::placeholder {
  color: var(--gui-text-disabled, #444444);
}

.text-editor__find-btn {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  padding: 4px 10px;
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: var(--gui-font-xs, 11px);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.text-editor__find-btn:hover {
  background: var(--gui-bg-surface-2, #48484A);
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__find-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--gui-radius-xs, 4px);
  transition: all 0.2s ease;
}

.text-editor__find-close:hover {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__find-count {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-family: var(--gui-font-mono, "JetBrains Mono", monospace);
  min-width: 40px;
  text-align: right;
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

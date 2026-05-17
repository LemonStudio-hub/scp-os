<template>
  <MobileWindow
    :visible="visible"
    :title="editorStore.activeFile?.name || t('editor.textEditor')"
    :show-back="true"
    @close="onClose"
  >
    <div class="mobile-editor">
      <!-- Tab Bar -->
      <div v-if="editorStore.openFiles.length > 0" class="mobile-editor__tabs">
        <div class="mobile-editor__tabs-scroll">
          <button
            v-for="file in editorStore.openFiles"
            :key="file.id"
            :class="[
              'mobile-editor__tab',
              { 'mobile-editor__tab--active': file.id === editorStore.activeFileId },
            ]"
            @click="editorStore.setActiveFile(file.id)"
          >
            <span class="mobile-editor__tab-name">{{ file.name }}</span>
            <span v-if="file.dirty" class="mobile-editor__dirty" />
            <button class="mobile-editor__tab-close" @click.stop="closeFile(file.id)">
              <svg
                width="8"
                height="8"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M1 1l8 8M9 1L1 9" />
              </svg>
            </button>
          </button>
          <button
            class="mobile-editor__tab mobile-editor__tab--add"
            @click="editorStore.openNewFile"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Find Bar -->
      <Transition name="slide-down">
        <div v-if="showFindBar" class="mobile-editor__find-bar">
          <input
            ref="findInputRef"
            v-model="findText"
            class="mobile-editor__find-input"
            :placeholder="t('editor.findPlaceholder')"
            @input="performFind"
          />
          <span v-if="findCount > 0" class="mobile-editor__find-count"
            >{{ findCurrentIndex }}/{{ findCount }}</span
          >
          <span
            v-else-if="findText && findCount === 0"
            class="mobile-editor__find-count mobile-editor__find-count--none"
            >0</span
          >
          <button class="mobile-editor__find-btn" @click="findPrev">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M12 9L8 5L4 9" />
            </svg>
          </button>
          <button class="mobile-editor__find-btn" @click="findNext">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M4 7L8 11L12 7" />
            </svg>
          </button>
          <button
            class="mobile-editor__find-btn mobile-editor__find-btn--close"
            @click="closeFindBar"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
      </Transition>

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

      <!-- Status Bar -->
      <div class="mobile-editor__status-bar">
        <div class="mobile-editor__status-left">
          <span v-if="editorStore.activeFile?.dirty" class="mobile-editor__status-dot" />
          <span class="mobile-editor__status-text">{{ statusInfo }}</span>
        </div>
        <div class="mobile-editor__status-right">
          <span class="mobile-editor__status-text">{{
            editorStore.activeFile?.language?.toUpperCase() || 'TXT'
          }}</span>
        </div>
      </div>

      <!-- Keyboard Toolbar -->
      <div class="mobile-editor__keyboard-bar">
        <div class="mobile-editor__kb-group">
          <button class="mobile-editor__kb-btn" @click="insertText('\t')">⇥</button>
          <button class="mobile-editor__kb-btn" @click="insertText('  ')">␣␣</button>
          <button class="mobile-editor__kb-btn" @click="insertPair('(', ')')">( )</button>
          <button class="mobile-editor__kb-btn" @click="insertPair('[', ']')">[ ]</button>
          <button class="mobile-editor__kb-btn" @click="insertPair('{', '}')">{ }</button>
          <button class="mobile-editor__kb-btn" @click="insertPair('&quot;', '&quot;')">" "</button>
          <button class="mobile-editor__kb-btn" @click="insertSingleQuotes">' '</button>
          <button class="mobile-editor__kb-btn" @click="insertPair('`', '`')">` `</button>
        </div>
        <div class="mobile-editor__kb-divider" />
        <div class="mobile-editor__kb-group">
          <button class="mobile-editor__kb-btn" @click="insertText('=')">=</button>
          <button class="mobile-editor__kb-btn" @click="insertText(';')">;</button>
          <button class="mobile-editor__kb-btn" @click="insertText(':')">:</button>
          <button class="mobile-editor__kb-btn" @click="insertText('.')">.</button>
          <button class="mobile-editor__kb-btn" @click="insertText(',')">,</button>
          <button class="mobile-editor__kb-btn" @click="insertText('/')">/</button>
          <button class="mobile-editor__kb-btn" @click="insertText('\\')">\</button>
          <button class="mobile-editor__kb-btn" @click="insertText('!')">!</button>
          <button class="mobile-editor__kb-btn" @click="insertText('&')">&</button>
          <button class="mobile-editor__kb-btn" @click="insertText('|')">|</button>
          <button class="mobile-editor__kb-btn" @click="insertText('<')">&lt;</button>
          <button class="mobile-editor__kb-btn" @click="insertText('>')">&gt;</button>
          <button class="mobile-editor__kb-btn" @click="insertText('+')">+</button>
          <button class="mobile-editor__kb-btn" @click="insertText('-')">-</button>
          <button class="mobile-editor__kb-btn" @click="insertText('*')">*</button>
          <button class="mobile-editor__kb-btn" @click="insertText('#')">#</button>
          <button class="mobile-editor__kb-btn" @click="insertText('@')">@</button>
          <button class="mobile-editor__kb-btn" @click="insertText('$')">$</button>
          <button class="mobile-editor__kb-btn" @click="insertText('%')">%</button>
          <button class="mobile-editor__kb-btn" @click="insertText('^')">^</button>
          <button class="mobile-editor__kb-btn" @click="insertText('~')">~</button>
          <button class="mobile-editor__kb-btn" @click="insertText('?')">?</button>
        </div>
        <div class="mobile-editor__kb-divider" />
        <div class="mobile-editor__kb-group">
          <button
            class="mobile-editor__kb-btn mobile-editor__kb-btn--nav"
            @click="moveCursor('left')"
          >
            ←
          </button>
          <button
            class="mobile-editor__kb-btn mobile-editor__kb-btn--nav"
            @click="moveCursor('right')"
          >
            →
          </button>
          <button
            class="mobile-editor__kb-btn mobile-editor__kb-btn--nav"
            @click="moveCursor('up')"
          >
            ↑
          </button>
          <button
            class="mobile-editor__kb-btn mobile-editor__kb-btn--nav"
            @click="moveCursor('down')"
          >
            ↓
          </button>
        </div>
        <div class="mobile-editor__kb-divider" />
        <div class="mobile-editor__kb-group">
          <button
            class="mobile-editor__kb-btn"
            :class="{ 'mobile-editor__kb-btn--active': showFindBar }"
            @click="toggleFindBar"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <circle cx="7" cy="7" r="4" />
              <path d="M10 10l3.5 3.5" />
            </svg>
          </button>
          <button class="mobile-editor__kb-btn" @click="toggleWordWrap">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M3 12h15a3 3 0 110 6h-4" />
              <polyline points="14 15 11 18 14 21" />
              <path d="M3 18h7" />
            </svg>
          </button>
          <button class="mobile-editor__kb-btn" @click="undo">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h7a4 4 0 010 8H8" />
              <polyline points="6 3 3 6 6 9" />
            </svg>
          </button>
          <button class="mobile-editor__kb-btn" @click="redo">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M13 6H6a4 4 0 000 8h2" />
              <polyline points="10 3 13 6 10 9" />
            </svg>
          </button>
          <button class="mobile-editor__kb-btn mobile-editor__kb-btn--save" @click="saveFile">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M12.5 14h-9a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013.5 2h7L14 5.5v7a1.5 1.5 0 01-1.5 1.5z"
              />
              <path d="M5 14v-4h6v4" />
              <path d="M5 2v3h4V2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useTextEditorStore } from '../../stores/textEditor'
import { useI18n } from '../../composables/useI18n'

interface Props {
  visible: boolean
  data?: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const editorStore = useTextEditorStore()
const textareaRef = ref<HTMLTextAreaElement>()
const findInputRef = ref<HTMLInputElement>()

const showFindBar = ref(false)
const findText = ref('')
const findCount = ref(0)
const findCurrentIndex = ref(0)

const activeFileContent = computed(() => {
  return editorStore.activeFile?.content ?? ''
})

const statusInfo = computed(() => {
  const ta = textareaRef.value
  if (!ta || !editorStore.activeFile) return ''
  const value = ta.value
  const pos = ta.selectionStart
  const lines = value.substring(0, pos).split('\n')
  const line = lines.length
  const col = lines[lines.length - 1].length + 1
  const totalLines = value.split('\n').length
  const chars = value.length
  return `Ln ${line}, Col ${col} · ${totalLines}${t('editor.lines')} · ${chars}${t('editor.characters')}`
})

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      if (props.data?.filePath) {
        editorStore.openFile(props.data.filePath)
      }
      if (editorStore.openFiles.length === 0) {
        editorStore.openNewFile()
      }
    }
  }
)

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
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault()
    toggleFindBar()
  }
}

function insertText(text: string): void {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const value = ta.value
  ta.value = value.substring(0, start) + text + value.substring(ta.selectionEnd)
  ta.selectionStart = ta.selectionEnd = start + text.length
  if (editorStore.activeFileId) {
    editorStore.updateContent(editorStore.activeFileId, ta.value)
  }
  ta.focus()
}

function insertPair(open: string, close: string): void {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const value = ta.value
  const selected = value.substring(start, end)
  ta.value = value.substring(0, start) + open + selected + close + value.substring(end)
  if (selected.length > 0) {
    ta.selectionStart = start + open.length
    ta.selectionEnd = start + open.length + selected.length
  } else {
    ta.selectionStart = ta.selectionEnd = start + open.length
  }
  if (editorStore.activeFileId) {
    editorStore.updateContent(editorStore.activeFileId, ta.value)
  }
  ta.focus()
}

function insertSingleQuotes(): void {
  insertPair("'", "'")
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
      ta.selectionStart = ta.selectionEnd = Math.min(
        prevLineStart + col,
        lineStart > 0 ? lineStart - 1 : value.length
      )
      break
    }
    case 'down': {
      const lineEnd = value.indexOf('\n', pos)
      const nextLineEnd = lineEnd >= 0 ? value.indexOf('\n', lineEnd + 1) : -1
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1
      const col = pos - lineStart
      const nextLineStart = lineEnd >= 0 ? lineEnd + 1 : value.length
      ta.selectionStart = ta.selectionEnd = Math.min(
        nextLineStart + col,
        nextLineEnd >= 0 ? nextLineEnd : value.length
      )
      break
    }
  }
  ta.focus()
}

function toggleWordWrap(): void {
  editorStore.wordWrap = !editorStore.wordWrap
  if (textareaRef.value) {
    textareaRef.value.style.whiteSpace = editorStore.wordWrap ? 'pre-wrap' : 'pre'
    textareaRef.value.style.wordBreak = editorStore.wordWrap ? 'break-all' : 'normal'
  }
}

function undo(): void {
  document.execCommand('undo')
}

function redo(): void {
  document.execCommand('redo')
}

function saveFile(): void {
  if (editorStore.activeFileId) {
    editorStore.saveFile(editorStore.activeFileId)
  }
}

function closeFile(fileId: string): void {
  const file = editorStore.openFiles.find((f) => f.id === fileId)
  if (file?.dirty) {
    if (!confirm(t('editor.unsavedChanges', { name: file.name }))) {
      return
    }
  }
  editorStore.closeFile(fileId)
  if (editorStore.openFiles.length === 0) {
    emit('close')
  }
}

function onClose(): void {
  if (editorStore.hasUnsavedChanges) {
    if (!confirm(t('editor.unsavedChanges', { name: '' }))) {
      return
    }
  }
  editorStore.closeAll()
  emit('close')
}

function toggleFindBar(): void {
  if (showFindBar.value) {
    closeFindBar()
  } else {
    showFindBar.value = true
    nextTick(() => findInputRef.value?.focus())
  }
}

function closeFindBar(): void {
  showFindBar.value = false
  findText.value = ''
  findCount.value = 0
  findCurrentIndex.value = 0
  textareaRef.value?.focus()
}

function performFind(): void {
  const ta = textareaRef.value
  if (!ta || !findText.value) {
    findCount.value = 0
    findCurrentIndex.value = 0
    return
  }

  const doc = ta.value.toLowerCase()
  const text = findText.value.toLowerCase()
  let count = 0
  let pos = 0
  while ((pos = doc.indexOf(text, pos)) !== -1) {
    count++
    pos += text.length
  }

  findCount.value = count
  findCurrentIndex.value = count > 0 ? 1 : 0

  if (count > 0) {
    const firstPos = doc.indexOf(text)
    ta.setSelectionRange(firstPos, firstPos + text.length)
    ta.focus()
  }
}

function findNext(): void {
  const ta = textareaRef.value
  if (!ta || !findText.value || findCount.value === 0) return

  const doc = ta.value.toLowerCase()
  const text = findText.value.toLowerCase()
  const currentPos = ta.selectionEnd
  const nextPos = doc.indexOf(text, currentPos)

  if (nextPos !== -1) {
    findCurrentIndex.value = Math.min(findCurrentIndex.value + 1, findCount.value)
    ta.setSelectionRange(nextPos, nextPos + text.length)
  } else {
    const wrapPos = doc.indexOf(text)
    if (wrapPos !== -1) {
      findCurrentIndex.value = 1
      ta.setSelectionRange(wrapPos, wrapPos + text.length)
    }
  }
  ta.focus()
}

function findPrev(): void {
  const ta = textareaRef.value
  if (!ta || !findText.value || findCount.value === 0) return

  const doc = ta.value.toLowerCase()
  const text = findText.value.toLowerCase()
  const currentPos = ta.selectionStart
  const prevPos = doc.lastIndexOf(text, currentPos - 1)

  if (prevPos !== -1) {
    findCurrentIndex.value = Math.max(findCurrentIndex.value - 1, 1)
    ta.setSelectionRange(prevPos, prevPos + text.length)
  } else {
    const wrapPos = doc.lastIndexOf(text)
    if (wrapPos !== -1) {
      findCurrentIndex.value = findCount.value
      ta.setSelectionRange(wrapPos, wrapPos + text.length)
    }
  }
  ta.focus()
}
</script>

<style scoped>
.mobile-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #000000);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

/* ── Tab Bar ──────────────────────────────────────────────────────────── */
.mobile-editor__tabs {
  background: var(--gui-bg-surface, #1C1C1E);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  padding: 6px 8px;
}

.mobile-editor__tabs-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-editor__tabs-scroll::-webkit-scrollbar {
  display: none;
}

.mobile-editor__tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--gui-bg-surface-raised, #2C2C2E);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.mobile-editor__tab--active {
  background: rgba(233, 69, 96, 0.12);
  border-color: rgba(233, 69, 96, 0.2);
  color: var(--gui-accent, #e94560);
}

.mobile-editor__tab--add {
  padding: 5px 8px;
  color: var(--gui-text-tertiary, #6a6a6a);
  background: transparent;
  border: 0.5px dashed var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
}

.mobile-editor__tab--add:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.mobile-editor__tab-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-editor__dirty {
  width: 5px;
  height: 5px;
  background: var(--gui-warning, #fbbf24);
  border-radius: 50%;
  flex-shrink: 0;
}

.mobile-editor__tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-editor__tab-close:active {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.1));
  color: var(--gui-text-primary, #f0f0f0);
}

/* ── Find Bar ─────────────────────────────────────────────────────────── */
.mobile-editor__find-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--gui-bg-surface, #1C1C1E);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.mobile-editor__find-input {
  flex: 1;
  background: var(--gui-bg-base, #000000);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: 13px;
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  outline: none;
  transition: border-color 0.15s ease;
}

.mobile-editor__find-input:focus {
  border-color: var(--gui-accent, #e94560);
}

.mobile-editor__find-input::placeholder {
  color: var(--gui-text-disabled, #444444);
}

.mobile-editor__find-count {
  font-size: 10px;
  color: var(--gui-text-secondary, #a8a8a8);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  min-width: 28px;
  text-align: center;
}

.mobile-editor__find-count--none {
  color: var(--gui-text-disabled, #444444);
}

.mobile-editor__find-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--gui-bg-surface-raised, #2C2C2E);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  color: var(--gui-text-secondary, #a8a8a8);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.mobile-editor__find-btn:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #f0f0f0);
}

.mobile-editor__find-btn--close {
  width: 24px;
  height: 24px;
}

/* ── Textarea ─────────────────────────────────────────────────────────── */
.mobile-editor__textarea {
  flex: 1;
  background: var(--gui-editor-bg, #0a0a0a);
  color: var(--gui-text-primary, #f0f0f0);
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: var(--gui-font-mono, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace);
  font-size: 16px !important;
  line-height: 1.7;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  caret-color: var(--gui-accent, #e94560);
}

/* ── Status Bar ───────────────────────────────────────────────────────── */
.mobile-editor__status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--gui-bg-surface, #1C1C1E);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
}

.mobile-editor__status-left,
.mobile-editor__status-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-editor__status-dot {
  width: 6px;
  height: 6px;
  background: var(--gui-warning, #fbbf24);
  border-radius: 50%;
}

.mobile-editor__status-text {
  font-size: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
}

/* ── Keyboard Toolbar ─────────────────────────────────────────────────── */
.mobile-editor__keyboard-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 6px;
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
  background: var(--gui-bg-surface, #1C1C1E);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-editor__keyboard-bar::-webkit-scrollbar {
  display: none;
}

.mobile-editor__kb-group {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.mobile-editor__kb-divider {
  width: 1px;
  height: 20px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  margin: 0 4px;
  flex-shrink: 0;
}

.mobile-editor__kb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  background: var(--gui-bg-surface-raised, #2C2C2E);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 6px;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.1s ease;
  flex-shrink: 0;
}

.mobile-editor__kb-btn:active {
  background: var(--gui-bg-surface-active, #222222);
  transform: scale(0.95);
}

.mobile-editor__kb-btn--nav {
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: 12px;
}

.mobile-editor__kb-btn--active {
  background: rgba(233, 69, 96, 0.12);
  border-color: rgba(233, 69, 96, 0.2);
  color: var(--gui-accent, #e94560);
}

.mobile-editor__kb-btn--save {
  background: rgba(233, 69, 96, 0.1);
  border-color: rgba(233, 69, 96, 0.15);
  color: var(--gui-accent, #e94560);
}

.mobile-editor__kb-btn--save:active {
  background: rgba(233, 69, 96, 0.2);
}

/* ── Transitions ──────────────────────────────────────────────────────── */
.slide-down-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-leave-active {
  transition: all 0.15s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>

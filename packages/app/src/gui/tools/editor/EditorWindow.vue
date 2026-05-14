<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="text-editor">
      <!-- Toolbar -->
      <div class="text-editor__toolbar">
        <div class="text-editor__toolbar-left">
          <button
            class="text-editor__tool-btn"
            :title="'New File (Ctrl+N)'"
            @click="editorStore.openNewFile"
          >
            <GUIIcon name="file" :size="14" />
            <span>New</span>
          </button>
          <button class="text-editor__tool-btn" :title="'Save (Ctrl+S)'" @click="saveActive">
            <GUIIcon name="save" :size="14" />
            <span>Save</span>
          </button>
          <button class="text-editor__tool-btn" :title="'Save All'" @click="saveAll">
            <GUIIcon name="save" :size="14" />
            <span>All</span>
          </button>
          <div class="text-editor__toolbar-divider" />
          <button
            class="text-editor__tool-btn"
            :class="{ 'text-editor__tool-btn--active': showFindReplace }"
            :title="'Find & Replace (Ctrl+F)'"
            @click="toggleFindReplace"
          >
            <GUIIcon name="search" :size="14" />
            <span>Find</span>
          </button>
          <button
            class="text-editor__tool-btn"
            :title="'Go to Line (Ctrl+G)'"
            @click="openGoToLine"
          >
            <GUIIcon name="arrow-right" :size="14" />
            <span>Go</span>
          </button>
          <div class="text-editor__toolbar-divider" />
          <button
            class="text-editor__tool-btn"
            :class="{ 'text-editor__tool-btn--active': editorStore.wordWrap }"
            :title="'Toggle Word Wrap (Alt+Z)'"
            @click="toggleWordWrap"
          >
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
            <span>Wrap</span>
          </button>
        </div>
        <div class="text-editor__toolbar-right">
          <button
            class="text-editor__tool-btn text-editor__tool-btn--icon"
            :title="'Zoom Out (Ctrl+-)'"
            @click="zoomOut"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span class="text-editor__font-size-label">{{ editorStore.fontSize }}px</span>
          <button
            class="text-editor__tool-btn text-editor__tool-btn--icon"
            :title="'Zoom In (Ctrl++)'"
            @click="zoomIn"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
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
      <div ref="editorContainerRef" class="text-editor__area">
        <template v-if="editorStore.openFiles.length === 0">
          <div class="text-editor__empty">
            <div class="text-editor__empty-logo">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
              </svg>
            </div>
            <p class="text-editor__empty-title">Text Editor</p>
            <p class="text-editor__empty-desc">
              Create a new file or open one from the File Manager
            </p>
            <div class="text-editor__empty-shortcuts">
              <div class="text-editor__shortcut" @click="editorStore.openNewFile">
                <kbd>Ctrl</kbd><kbd>N</kbd>
                <span>New File</span>
              </div>
              <div class="text-editor__shortcut" @click="toggleFindReplace">
                <kbd>Ctrl</kbd><kbd>F</kbd>
                <span>Find & Replace</span>
              </div>
              <div class="text-editor__shortcut" @click="saveActive">
                <kbd>Ctrl</kbd><kbd>S</kbd>
                <span>Save File</span>
              </div>
              <div class="text-editor__shortcut" @click="openGoToLine">
                <kbd>Ctrl</kbd><kbd>G</kbd>
                <span>Go to Line</span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- CodeMirror container -->
          <div ref="codemirrorRef" class="text-editor__codemirror" />
          <!-- Find/Replace Panel -->
          <Transition name="find-slide">
            <div v-if="showFindReplace" class="text-editor__find-replace">
              <div class="text-editor__find-row">
                <svg
                  class="text-editor__find-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5L14 14" />
                </svg>
                <input
                  ref="findInputRef"
                  v-model="findText"
                  class="text-editor__find-input"
                  placeholder="Find..."
                  @input="performFind"
                  @keydown.enter="findNext"
                  @keydown.escape="closeFindReplace"
                />
                <button
                  class="text-editor__find-btn"
                  title="Previous (Shift+Enter)"
                  @click="findPrev"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path d="M13 10L8 5L3 10" />
                  </svg>
                </button>
                <button class="text-editor__find-btn" title="Next (Enter)" @click="findNext">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path d="M3 6L8 11L13 6" />
                  </svg>
                </button>
                <span v-if="findCount > 0" class="text-editor__find-count"
                  >{{ findCurrentIndex }}/{{ findCount }}</span
                >
                <span
                  v-else-if="findText && findCount === 0"
                  class="text-editor__find-count text-editor__find-count--none"
                  >No results</span
                >
              </div>
              <div class="text-editor__find-row">
                <svg
                  class="text-editor__find-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M3 4h10M3 8h10M3 12h10" />
                </svg>
                <input
                  v-model="replaceText"
                  class="text-editor__find-input"
                  placeholder="Replace..."
                  @keydown.enter.exact="replaceCurrent"
                  @keydown.ctrl.enter="replaceAll"
                  @keydown.escape="closeFindReplace"
                />
                <button class="text-editor__find-btn" @click="replaceCurrent">Replace</button>
                <button class="text-editor__find-btn" @click="replaceAll">All</button>
              </div>
              <button class="text-editor__find-close" @click="closeFindReplace">
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
          <!-- Go to Line Panel -->
          <Transition name="find-slide">
            <div v-if="showGoToLine" class="text-editor__goto-line">
              <span class="text-editor__goto-label">Line:</span>
              <input
                ref="gotoInputRef"
                v-model="gotoLineText"
                class="text-editor__goto-input"
                type="number"
                min="1"
                :placeholder="`1-${totalLines}`"
                @keydown.enter="goToLine"
                @keydown.escape="closeGoToLine"
              />
              <button class="text-editor__find-btn" @click="goToLine">Go</button>
              <button class="text-editor__find-close" @click="closeGoToLine">
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
        </template>
      </div>

      <!-- Status Bar -->
      <SCPStatusBar :left-items="statusLeftItems" :right-items="statusRightItems" />
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  type ViewUpdate,
} from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
  indentOnInput,
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { rust } from '@codemirror/lang-rust'
import { php } from '@codemirror/lang-php'
import { xml } from '@codemirror/lang-xml'
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

const props = defineProps<Props>()

const editorStore = useTextEditorStore()
const codemirrorRef = ref<HTMLElement>()
const findInputRef = ref<HTMLInputElement>()
const gotoInputRef = ref<HTMLInputElement>()

let editorView: EditorView | null = null
const stateCompartment = new Compartment()
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const fontSizeCompartment = new Compartment()
const wrapCompartment = new Compartment()

const showFindReplace = ref(false)
const findText = ref('')
const replaceText = ref('')
const findCount = ref(0)
const findCurrentIndex = ref(0)

const showGoToLine = ref(false)
const gotoLineText = ref('')

const totalLines = computed(() => {
  if (!editorView) return 1
  return editorView.state.doc.lines
})

const editorTabs = computed(() => {
  return editorStore.openFiles.map((f) => ({
    id: f.id,
    label: f.name,
    dirty: f.dirty,
  }))
})

const statusLeftItems = computed(() => {
  const items: string[] = []
  const file = editorStore.activeFile
  if (file) {
    items.push(file.language.toUpperCase())
    if (editorView) {
      const state = editorView.state
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      const col = pos - line.from + 1
      items.push(`Ln ${line.number}, Col ${col}`)
      const charCount = state.doc.length
      const lineCount = state.doc.lines
      const selectedLen = state.selection.main.to - state.selection.main.from
      if (selectedLen > 0) {
        items.push(`(${selectedLen} selected)`)
      }
      items.push(`${lineCount} lines`)
      items.push(`${charCount} chars`)
    } else {
      items.push('Ln 1, Col 1')
    }
  }
  return items
})

const statusRightItems = computed(() => {
  const items: string[] = []
  if (editorStore.hasUnsavedChanges) {
    items.push('● Modified')
  }
  items.push(`Tab: ${editorStore.tabSize}`)
  items.push(editorStore.wordWrap ? 'Wrap: On' : 'Wrap: Off')
  items.push('UTF-8')
  return items
})

function detectLanguage(fileName: string): any {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, any> = {
    js: javascript({ jsx: true, typescript: false }),
    jsx: javascript({ jsx: true, typescript: false }),
    ts: javascript({ jsx: true, typescript: true }),
    tsx: javascript({ jsx: true, typescript: true }),
    mjs: javascript({ jsx: false, typescript: false }),
    cjs: javascript({ jsx: false, typescript: false }),
    py: python(),
    html: html(),
    htm: html(),
    css: css(),
    scss: css(),
    json: json(),
    md: markdown(),
    sql: sql(),
    c: cpp(),
    cpp: cpp(),
    cc: cpp(),
    h: cpp(),
    hpp: cpp(),
    java: java(),
    rs: rust(),
    php: php(),
    xml: xml(),
    svg: xml(),
  }
  return languageMap[ext || ''] || undefined
}

function createTheme(): any {
  const isLight = document.documentElement.classList.contains('light')
  return EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'var(--gui-editor-bg, #0a0a0a)',
      color: 'var(--gui-text-primary, #f0f0f0)',
      fontSize: `${editorStore.fontSize}px`,
      fontFamily:
        'var(--gui-font-mono, "JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace)',
    },
    '&.cm-editor.cm-focused': {
      outline: 'none',
    },
    '.cm-content': {
      padding: '8px 16px',
      lineHeight: '1.65',
      letterSpacing: '0.01em',
      caretColor: 'var(--gui-accent, #e94560)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--gui-accent, #e94560)',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--gui-editor-bg, #0a0a0a)',
      borderRight: '1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04))',
      color: 'var(--gui-text-tertiary, #4a4a4a)',
      paddingLeft: '4px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 8px',
      minWidth: '36px',
      fontSize: '0.85em',
    },
    '.cm-foldGutter .cm-gutterElement': {
      cursor: 'pointer',
      color: 'var(--gui-text-tertiary, #4a4a4a)',
      transition: 'color 0.15s ease',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
      color: 'var(--gui-text-primary, #f0f0f0)',
    },
    '.cm-selectionBackground': {
      background: 'rgba(233, 69, 96, 0.2) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: 'rgba(233, 69, 96, 0.25) !important',
    },
    '.cm-selectionMatch': {
      background: 'rgba(233, 69, 96, 0.12)',
    },
    '.cm-searchMatch': {
      background: 'rgba(255, 200, 50, 0.2)',
      outline: '1px solid rgba(255, 200, 50, 0.4)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      background: 'rgba(255, 200, 50, 0.35)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(233, 69, 96, 0.25)',
      outline: '1px solid var(--gui-accent, #e94560)',
      color: '#fff !important',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(255, 50, 50, 0.25)',
      outline: '1px solid #ff3232',
    },
    '.cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: isLight
        ? 'rgba(0, 0, 0, 0.15) transparent'
        : 'rgba(255, 255, 255, 0.08) transparent',
    },
    '.cm-scroller::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      background: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.06)',
      borderRadius: '3px',
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      background: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.12)',
    },
    '.cm-panels': {
      display: 'none',
    },
    '.cm-tooltip': {
      background: 'var(--gui-bg-surface, #1a1a1a)',
      border: '1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08))',
      borderRadius: '6px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        padding: '4px 8px',
      },
      '& > ul > li[aria-selected]': {
        background: 'rgba(233, 69, 96, 0.15)',
        color: 'var(--gui-text-primary, #fff)',
      },
    },
  })
}

function initEditor(): void {
  if (!codemirrorRef.value) return

  if (editorView) {
    editorView.destroy()
    editorView = null
  }

  const file = editorStore.activeFile
  if (!file) return

  const langExtension = detectLanguage(file.name)

  const extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
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
    stateCompartment.of([]),
    languageCompartment.of(langExtension ? [langExtension] : []),
    themeCompartment.of(createTheme()),
    fontSizeCompartment.of(
      EditorView.theme({
        '&': { fontSize: `${editorStore.fontSize}px` },
      })
    ),
    wrapCompartment.of(editorStore.wordWrap ? [EditorView.lineWrapping] : []),
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

function updateLanguage(): void {
  if (!editorView) return
  const file = editorStore.activeFile
  if (!file) return

  const langExtension = detectLanguage(file.name)
  editorView.dispatch({
    effects: languageCompartment.reconfigure(langExtension ? [langExtension] : []),
  })
}

function updateFontSize(): void {
  if (!editorView) return
  editorView.dispatch({
    effects: fontSizeCompartment.reconfigure(
      EditorView.theme({
        '&': { fontSize: `${editorStore.fontSize}px` },
      })
    ),
  })
}

function toggleWordWrap(): void {
  editorStore.wordWrap = !editorStore.wordWrap
  if (!editorView) return
  editorView.dispatch({
    effects: wrapCompartment.reconfigure(editorStore.wordWrap ? [EditorView.lineWrapping] : []),
  })
}

function zoomIn(): void {
  editorStore.fontSize = Math.min(editorStore.fontSize + 1, 32)
}

function zoomOut(): void {
  editorStore.fontSize = Math.max(editorStore.fontSize - 1, 10)
}

async function saveActive(): Promise<void> {
  if (editorStore.activeFileId) {
    await editorStore.saveFile(editorStore.activeFileId)
  }
}

async function saveAll(): Promise<void> {
  await editorStore.saveAll()
}

function onCloseFile(fileId: string): void {
  const file = editorStore.openFiles.find((f) => f.id === fileId)
  if (file?.dirty) {
    if (!confirm(`"${file.name}" has unsaved changes. Close anyway?`)) {
      return
    }
  }
  editorStore.closeFile(fileId)
  if (editorStore.openFiles.length > 0) {
    nextTick(() => initEditor())
  }
}

function onClose(): void {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

function toggleFindReplace(): void {
  if (showFindReplace.value) {
    closeFindReplace()
  } else {
    openFindReplace()
  }
}

function openFindReplace(): void {
  showFindReplace.value = true
  findCount.value = 0
  findCurrentIndex.value = 0
  nextTick(() => {
    findInputRef.value?.focus()
  })
}

function closeFindReplace(): void {
  showFindReplace.value = false
  findText.value = ''
  replaceText.value = ''
  findCount.value = 0
  findCurrentIndex.value = 0
}

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

function openGoToLine(): void {
  showGoToLine.value = true
  gotoLineText.value = ''
  nextTick(() => {
    gotoInputRef.value?.focus()
  })
}

function closeGoToLine(): void {
  showGoToLine.value = false
  gotoLineText.value = ''
}

function goToLine(): void {
  if (!editorView) return
  const lineNum = parseInt(gotoLineText.value, 10)
  if (isNaN(lineNum) || lineNum < 1) return

  const line = editorView.state.doc.line(Math.min(lineNum, editorView.state.doc.lines))
  editorView.dispatch({
    selection: { anchor: line.from },
    effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
  })
  closeGoToLine()
  editorView.focus()
}

watch(
  () => editorStore.activeFileId,
  () => {
    if (editorStore.openFiles.length > 0) {
      nextTick(() => initEditor())
      updateLanguage()
    }
  }
)

watch(
  () => editorStore.fontSize,
  () => {
    updateFontSize()
  }
)

onMounted(async () => {
  setContext('editor')

  if (props.windowInstance?.config?.data?.filePath) {
    const filePath = props.windowInstance.config.data.filePath
    await editorStore.openFile(filePath)
  }

  if (editorStore.openFiles.length === 0) {
    editorStore.openNewFile()
  }

  nextTick(() => initEditor())

  registerShortcut({
    id: 'editor-find',
    keys: 'Ctrl+F',
    description: '打开查找/替换',
    category: 'editor',
    context: 'editor',
    handler: () => toggleFindReplace(),
  })

  registerShortcut({
    id: 'editor-save',
    keys: 'Ctrl+S',
    description: '保存文件',
    category: 'editor',
    context: 'editor',
    handler: () => saveActive(),
  })

  registerShortcut({
    id: 'editor-goto-line',
    keys: 'Ctrl+G',
    description: '跳转到行',
    category: 'editor',
    context: 'editor',
    handler: () => openGoToLine(),
  })

  registerShortcut({
    id: 'editor-word-wrap',
    keys: 'Alt+Z',
    description: '切换自动换行',
    category: 'editor',
    context: 'editor',
    handler: () => toggleWordWrap(),
  })

  registerShortcut({
    id: 'editor-zoom-in',
    keys: 'Ctrl+=',
    description: '放大字体',
    category: 'editor',
    context: 'editor',
    handler: () => zoomIn(),
  })

  registerShortcut({
    id: 'editor-zoom-out',
    keys: 'Ctrl+-',
    description: '缩小字体',
    category: 'editor',
    context: 'editor',
    handler: () => zoomOut(),
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
.text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-surface);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

/* ── Toolbar ─────────────────────────────────────────────────────────── */
.text-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-xxs, 2px) var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  gap: var(--gui-spacing-xs, 4px);
}

.text-editor__toolbar-left,
.text-editor__toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
}

.text-editor__toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  margin: 0 var(--gui-spacing-xxs, 2px);
}

.text-editor__tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.text-editor__tool-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__tool-btn--active {
  background: rgba(233, 69, 96, 0.12);
  color: var(--gui-accent, #e94560);
}

.text-editor__tool-btn--active:hover {
  background: rgba(233, 69, 96, 0.18);
  color: var(--gui-accent, #e94560);
}

.text-editor__tool-btn--icon {
  padding: 4px 6px;
}

.text-editor__font-size-label {
  font-size: 10px;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  min-width: 32px;
  text-align: center;
}

/* ── Editor Area ─────────────────────────────────────────────────────── */
.text-editor__area {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

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

/* ── Find/Replace Panel ──────────────────────────────────────────────── */
.text-editor__find-replace {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 100;
  background: var(--gui-bg-surface, #1a1a1c);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  padding: 12px 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  min-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-editor__find-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-editor__find-icon {
  color: var(--gui-text-tertiary, #6a6a6a);
  flex-shrink: 0;
}

.text-editor__find-input {
  flex: 1;
  background: var(--gui-bg-base, #0a0a0a);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  padding: 5px 8px;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-xs, 11px);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  outline: none;
  transition: border-color 0.15s ease;
}

.text-editor__find-input:focus {
  border-color: var(--gui-accent, #e94560);
}

.text-editor__find-input::placeholder {
  color: var(--gui-text-disabled, #444444);
}

.text-editor__find-btn {
  background: var(--gui-bg-surface-hover, #3a3a3c);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  padding: 4px 8px;
  color: var(--gui-text-secondary, #a8a8a8);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.text-editor__find-btn:hover {
  background: var(--gui-bg-surface-2, #48484a);
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__find-close {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  color: var(--gui-text-tertiary, #6a6a6a);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--gui-radius-xs, 4px);
  transition: all 0.15s ease;
}

.text-editor__find-close:hover {
  background: var(--gui-bg-surface-hover, #3a3a3c);
  color: var(--gui-text-primary, #f0f0f0);
}

.text-editor__find-count {
  font-size: 10px;
  color: var(--gui-text-secondary, #a8a8a8);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  min-width: 40px;
  text-align: right;
}

.text-editor__find-count--none {
  color: var(--gui-text-disabled, #444444);
}

/* ── Go to Line ──────────────────────────────────────────────────────── */
.text-editor__goto-line {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: var(--gui-bg-surface, #1a1a1c);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--gui-radius-lg, 12px);
  padding: 8px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-editor__goto-label {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-secondary, #a8a8a8);
  font-weight: var(--gui-font-weight-medium, 500);
}

.text-editor__goto-input {
  width: 80px;
  background: var(--gui-bg-base, #0a0a0a);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  padding: 5px 8px;
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-xs, 11px);
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  outline: none;
  transition: border-color 0.15s ease;
}

.text-editor__goto-input:focus {
  border-color: var(--gui-accent, #e94560);
}

/* ── Empty State ─────────────────────────────────────────────────────── */
.text-editor__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--gui-spacing-sm, 8px);
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.text-editor__empty-logo {
  color: var(--gui-text-tertiary, #4a4a4a);
  margin-bottom: var(--gui-spacing-sm, 8px);
  opacity: 0.6;
}

.text-editor__empty-title {
  font-size: var(--gui-font-lg, 18px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #a8a8a8);
  letter-spacing: -0.01em;
}

.text-editor__empty-desc {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
  margin-bottom: var(--gui-spacing-lg, 20px);
}

.text-editor__empty-shortcuts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gui-spacing-sm, 8px);
}

.text-editor__shortcut {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--gui-bg-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  border-radius: var(--gui-radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
}

.text-editor__shortcut:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.08));
}

.text-editor__shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 4px;
  background: var(--gui-bg-surface-raised, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 3px;
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  font-size: 9px;
  color: var(--gui-text-secondary, #a8a8a8);
  line-height: 1;
}

.text-editor__shortcut span {
  font-size: var(--gui-font-xs, 11px);
  color: var(--gui-text-tertiary, #6a6a6a);
}

/* ── Transitions ─────────────────────────────────────────────────────── */
.find-slide-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.find-slide-leave-active {
  transition: all 0.15s ease;
}

.find-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.find-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<template>
  <div class="scp-terminal w-screen h-dvh relative flex flex-col overflow-hidden"
       :style="{ backgroundColor: themeStore.currentTheme.colors.terminalBg }">
    <!-- Terminal Header -->
    <div class="scp-terminal__header flex items-center justify-between h-11 px-4 border-b flex-shrink-0"
         :style="{ backgroundColor: themeStore.currentTheme.colors.terminalBg, borderColor: themeStore.currentTheme.colors.borderSubtle }"
         style="padding-top: env(safe-area-inset-top, 0px);">
      <!-- Traffic Lights -->
      <div class="flex items-center gap-1">
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#FF5F57] shadow-[0_0_4px_rgba(255,95,87,0.4)]" />
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#FFBD2E] shadow-[0_0_4px_rgba(255,189,46,0.4)]" />
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#28C840] shadow-[0_0_4px_rgba(40,200,64,0.4)]" />
      </div>
      <!-- Title -->
      <div class="scp-terminal__title absolute left-1/2 -translate-x-1/2 flex items-center gap-1 text-[12px] font-semibold text-[#8E8E93] whitespace-nowrap overflow-hidden text-ellipsis tracking-wide">
        <span class="scp-terminal__title-icon text-[#8E8E93] font-bold">⟩</span>
        SCP Terminal
      </div>
      <!-- Status -->
      <div class="scp-terminal__status flex items-center gap-1 text-[11px] font-semibold text-[#8E8E93] tracking-widest">
        <span
          class="scp-terminal__status-dot w-[6px] h-[6px] rounded-full animate-ios-pulse"
          :class="statusDotClass"
        />
        {{ statusText }}
      </div>
    </div>

    <!-- Terminal Body -->
    <div class="scp-terminal__body flex-1 relative overflow-hidden"
         :style="{ backgroundColor: themeStore.currentTheme.colors.terminalBg }">
      <div id="terminal-container" ref="terminalContainer" class="w-full h-full"
           style="touch-action: pan-y; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch;"
           :style="{ backgroundColor: themeStore.currentTheme.colors.terminalBg }" />
    </div>

    <!-- Virtual Keyboard (Termux-style) -->
    <Transition name="scp-terminal__keyboard">
      <div v-if="isMobile" class="scp-terminal__keyboard"
           :style="{ backgroundColor: themeStore.currentTheme.colors.terminalBg }">
        <!-- Extra Keys Row (ESC, TAB, CTRL, ALT, HOME, END, PGUP, PGDN, ←, →, ↑, ↓) -->
        <div class="scp-terminal__extra-keys">
          <button class="scp-terminal__key" @click="handleKey('esc')">ESC</button>
          <button class="scp-terminal__key" @click="handleKey('tab')">TAB</button>
          <button class="scp-terminal__key" @click="handleKey('up')">↑</button>
          <button class="scp-terminal__key" @click="handleKey('down')">↓</button>
          <button class="scp-terminal__key" @click="handleKey('left')">←</button>
          <button class="scp-terminal__key" @click="handleKey('right')">→</button>
          <button class="scp-terminal__key" @click="handleKey('home')">HOME</button>
          <button class="scp-terminal__key" @click="handleKey('end')">END</button>
          <button class="scp-terminal__key" @click="handleKey('pageup')">PGUP</button>
          <button class="scp-terminal__key" @click="handleKey('pagedown')">PGDN</button>
          <button class="scp-terminal__key" @click="handleModifier('ctrl')">CTRL</button>
          <button class="scp-terminal__key" @click="handleModifier('alt')">ALT</button>
        </div>

        <!-- Enter Key (full width, prominent) -->
        <div class="scp-terminal__enter-row">
          <button class="scp-terminal__enter-key" @click="handleKey('enter')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 14L9 9L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9V4H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useTerminal } from '../composables/useTerminal'
import { updateTerminalFontSize } from '../utils/terminal'
import { useTabsStore } from '../stores/tabs'
import { useSystemStore } from '../stores/system'
import { useThemeStore } from '../gui/stores/themeStore'
import indexedDBService from '../utils/indexedDB'

const tabsStore = useTabsStore()
const systemStore = useSystemStore()
const themeStore = useThemeStore()
const terminalContainer = ref<HTMLDivElement>()

// Initialize theme store
themeStore.init()

const terminalStates = ref<Record<string, string | string[]>>({})
const modifiers = ref({ ctrl: false, alt: false })

const statusDotClass = computed(() => {
  if (systemStore.isRunning) return 'bg-[#34C759] shadow-[0_0_6px_#34C759]'
  return 'bg-[#FF3B30] shadow-[0_0_6px_#FF3B30]'
})

const statusText = computed(() => systemStore.isRunning ? 'ONLINE' : 'OFFLINE')

const isMobile = computed(() => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
})

const {
  initTerminal,
  destroyTerminal,
  displayWelcomeMessage,
  displayStartupPrompt,
  setupCommandHandler,
  clear,
  navigateHistory,
  getTerminal,
  sendKey,
  sendText,
  terminalInstance,
} = useTerminal(terminalContainer)

function handleModifier(id: 'ctrl' | 'alt'): void {
  modifiers.value[id] = !modifiers.value[id]
  triggerHaptic()
}

function handleKey(action: string): void {
  const terminal = getTerminal()
  if (!terminal) return

  triggerHaptic()

  switch (action) {
    case 'esc': sendKey('\x1b'); break
    case 'tab': sendKey('\t'); break
    case 'up': sendKey('\x1b[A'); break
    case 'down': sendKey('\x1b[B'); break
    case 'left': sendKey('\x1b[D'); break
    case 'right': sendKey('\x1b[C'); break
    case 'home': sendKey('\x1b[H'); break
    case 'end': sendKey('\x1b[F'); break
    case 'pageup': terminal.scrollPages(-1); break
    case 'pagedown': terminal.scrollPages(1); break
    case 'clear':
      clear()
      if (!systemStore.isRunning) displayWelcomeMessage()
      break
    case 'help': sendText('help\n'); break
    case 'history': navigateHistory(1); break
    case 'enter': sendKey('\r'); break
  }

  // Reset modifiers after sending
  setTimeout(() => { modifiers.value = { ctrl: false, alt: false } }, 100)
}

function triggerHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8)
  }
}

let resizeTimeout: number | null = null
const handleResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    const terminal = getTerminal()
    if (terminal) updateTerminalFontSize(terminal)
  }, 250)
}

onMounted(async () => {
  try {
    await indexedDBService.init()
    const allStates = await indexedDBService.loadAllTerminalStates()
    terminalStates.value = allStates
  } catch (error) {
    console.error('[Terminal] Failed to initialize IndexedDB:', error)
  }

  try {
    initTerminal()
    window.addEventListener('resize', handleResize)

    // Always show startup prompt — user must type 'start' to boot
    clear()
    displayStartupPrompt()
    setupCommandHandler()

    // Apply initial terminal theme
    applyTerminalTheme()
  } catch (error) {
    console.error('[Terminal] Failed to initialize:', error)
  }
})

// Apply terminal theme colors
function applyTerminalTheme(): void {
  const terminal = getTerminal()
  if (!terminal) return

  const c = themeStore.currentTheme.colors

  terminal.options.theme = {
    background: c.terminalBg,
    foreground: c.terminalFg,
    cursor: c.terminalCursor,
    cursorAccent: c.terminalCursorAccent,
    selectionBackground: c.terminalSelection,
    black: c.terminalBlack,
    red: c.terminalRed,
    green: c.terminalGreen,
    yellow: c.terminalYellow,
    blue: c.terminalBlue,
    magenta: c.terminalMagenta,
    cyan: c.terminalCyan,
    white: c.terminalWhite,
    brightBlack: c.terminalBrightBlack,
    brightRed: c.terminalBrightRed,
    brightGreen: c.terminalBrightGreen,
    brightYellow: c.terminalBrightYellow,
    brightBlue: c.terminalBrightBlue,
    brightMagenta: c.terminalBrightMagenta,
    brightCyan: c.terminalBrightCyan,
    brightWhite: c.terminalBrightWhite,
  }

  terminal.refresh(0, terminal.rows - 1)
}

// Watch for theme changes and update terminal colors
watch(() => themeStore.currentThemeId, () => {
  applyTerminalTheme()
})

// Tab switching — save and restore terminal state
watch(() => tabsStore.activeTabId, async (newTabId, oldTabId) => {
  const terminal = getTerminal()
  if (!terminal) return
  if (newTabId === oldTabId) return

  // Save old tab
  if (oldTabId) {
    try {
      const buffer = terminal.buffer.active
      if (buffer) {
        const lines: string[] = []
        for (let i = 0; i < buffer.length; i++) {
          const line = buffer.getLine(i)
          lines.push(line ? line.translateToString(true) : '')
        }
        terminalStates.value[oldTabId] = lines
        indexedDBService.saveTerminalState(oldTabId, lines).catch(() => {})
      }
    } catch (error) {
      console.error('[Terminal] Failed to save state:', error)
    }
  }

  // Restore new tab
  if (newTabId) {
    let savedLines: string[] | null = null

    if (terminalStates.value[newTabId]) {
      const cached = terminalStates.value[newTabId]
      savedLines = Array.isArray(cached) ? cached : null
    }

    if (!savedLines) {
      try {
        const savedContent = await indexedDBService.loadTerminalState(newTabId)
        if (savedContent && Array.isArray(savedContent)) {
          savedLines = savedContent
          terminalStates.value[newTabId] = savedLines
        }
      } catch { /* ignore */ }
    }

    clear()

    if (savedLines && savedLines.length > 0) {
      for (const line of savedLines) terminal.writeln(line || '')
    }

    requestAnimationFrame(() => {
      if (terminalInstance.value.fitAddon && terminal) {
        try { terminalInstance.value.fitAddon.fit() } catch { /* ignore */ }
      }
      terminal.scrollToBottom()
      window.__terminalInstance = { cols: terminal.cols, rows: terminal.rows }
    })
  }
}, { flush: 'post' })

// Cleanup
onBeforeUnmount(() => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  window.removeEventListener('resize', handleResize)
  destroyTerminal()
})
</script>

<style scoped>
/* ── Terminal Header ─────────────────────────────────────────────── */
.scp-terminal__header {
  transition: background 200ms ease,
              border-color 200ms ease;
}

/* Traffic light dots with subtle pulse */
.scp-terminal__dot {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 150ms ease;
}

.scp-terminal__header:hover .scp-terminal__dot {
  transform: scale(1.15);
}

/* Status dot with smooth pulse */
.scp-terminal__status-dot {
  transition: background 200ms ease,
              box-shadow 200ms ease;
}

/* ── Terminal Container ──────────────────────────────────────────── */
#terminal-container {
  transition: opacity 200ms ease;
}

/* ── Terminal Scrollbar ──────────────────────────────────────────── */
#terminal-container :deep(.xterm) {
  height: 100%;
  padding: 8px;
}

#terminal-container :deep(.xterm-viewport) {
  overflow-y: auto !important;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y !important;
  overscroll-behavior-y: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(142, 142, 147, 0.5) transparent;
}

#terminal-container :deep(.xterm-viewport)::-webkit-scrollbar {
  width: 4px;
}

#terminal-container :deep(.xterm-viewport)::-webkit-scrollbar-track {
  background: transparent;
}

#terminal-container :deep(.xterm-viewport)::-webkit-scrollbar-thumb {
  background: var(--gui-accent, #8E8E93);
  border-radius: 999px;
  transition: background 150ms ease;
}

#terminal-container :deep(.xterm-viewport)::-webkit-scrollbar-thumb:hover {
  background: var(--gui-accent-hover, #AEAEB2);
}

#terminal-container :deep(.xterm-screen) {
  background-color: var(--gui-terminal-bg, #1C1C1E) !important;
}

/* ── Termux-style Virtual Keyboard ─────────────────────────────────── */
.scp-terminal__keyboard {
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
}

/* Extra keys row (Termux-style scrollable row) */
.scp-terminal__extra-keys {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 4px;
  gap: 0;
}

.scp-terminal__extra-keys::-webkit-scrollbar {
  display: none;
}

.scp-terminal__key {
  flex: 0 0 auto;
  min-width: 52px;
  height: 38px;
  background: transparent;
  border: none;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: background 100ms ease,
              transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  color: var(--gui-text-primary, #FFFFFF);
  border-radius: var(--gui-radius-sm, 6px);
}

.scp-terminal__key:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.12));
  transform: scale(0.95);
}

/* Enter key row */
.scp-terminal__enter-row {
  display: flex;
  justify-content: flex-end;
  padding: 0 4px 4px;
}

.scp-terminal__enter-key {
  width: 64px;
  height: 48px;
  background: transparent;
  border: none;
  border-radius: var(--gui-radius-md, 10px);
  color: var(--gui-text-primary, #FFFFFF);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  transition: background 100ms ease,
              transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
}

.scp-terminal__enter-key:active {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.12));
  transform: scale(0.95);
}

/* Keyboard transition — improved spring */
.scp-terminal__keyboard-enter-active {
  transition: all 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.scp-terminal__keyboard-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.scp-terminal__keyboard-enter-from,
.scp-terminal__keyboard-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .scp-terminal__header {
    height: 48px;
  }
}
</style>

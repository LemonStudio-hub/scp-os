<template>
  <div class="terminal-shell">
    <!-- Terminal Header -->
    <div class="terminal-header">
      <div class="terminal-header__dots">
        <span class="terminal-header__dot terminal-header__dot--red" />
        <span class="terminal-header__dot terminal-header__dot--yellow" />
        <span class="terminal-header__dot terminal-header__dot--green" />
      </div>
      <div class="terminal-header__title">
        <span class="terminal-header__icon">⟩</span>
        SCP Terminal
      </div>
      <div class="terminal-header__status">
        <span class="terminal-header__status-dot" :class="statusDotClass" />
        {{ statusText }}
      </div>
    </div>

    <!-- Terminal Container -->
    <div class="terminal-body">
      <div id="terminal-container" ref="terminalContainer"></div>
    </div>

    <!-- Virtual Keyboard -->
    <Transition name="terminal-keyboard">
      <div v-if="isMobile" class="virtual-keyboard">
        <!-- Modifier Keys -->
        <div class="virtual-keyboard__modifiers">
          <button
            v-for="mod in modifierKeys"
            :key="mod.id"
            :class="['virtual-keyboard__key', 'virtual-keyboard__key--modifier', { 'virtual-keyboard__key--active': modifiers[mod.id as keyof typeof modifiers] }]"
            @click="handleModifier(mod.id)"
          >
            {{ mod.label }}
          </button>
        </div>

        <!-- Navigation Keys -->
        <div class="virtual-keyboard__row">
          <button
            v-for="key in navKeys"
            :key="key.id"
            class="virtual-keyboard__key virtual-keyboard__key--nav"
            @click="handleKey(key.action)"
          >
            <span v-if="key.icon" class="virtual-keyboard__key-icon" v-html="key.icon" />
            <span v-else>{{ key.label }}</span>
          </button>
          <button
            class="virtual-keyboard__key virtual-keyboard__key--enter"
            @click="handleKey('enter')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 14L9 9L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9V4H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Action Keys -->
        <div class="virtual-keyboard__row">
          <button
            v-for="key in actionKeys"
            :key="key.id"
            class="virtual-keyboard__key virtual-keyboard__key--action"
            @click="handleKey(key.action)"
          >
            {{ key.label }}
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
import indexedDBService from '../utils/indexedDB'

const tabsStore = useTabsStore()
const systemStore = useSystemStore()
const terminalContainer = ref<HTMLDivElement>()

// Terminal state
const terminalStates = ref<Record<string, string | string[]>>({})

// Modifier keys
const modifiers = ref({ ctrl: false, alt: false })

// Status computed
const statusDotClass = computed(() => {
  if (systemStore.isRunning) return 'terminal-header__status-dot--online'
  return 'terminal-header__status-dot--offline'
})

const statusText = computed(() => {
  if (systemStore.isRunning) return 'ONLINE'
  return 'OFFLINE'
})

// Mobile detection
const isMobile = computed(() => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
})

// Keyboard configuration
const modifierKeys = [
  { id: 'ctrl' as const, label: 'CTRL' },
  { id: 'alt' as const, label: 'ALT' },
]

const navKeys = [
  { id: 'esc', label: 'ESC', action: 'esc' },
  { id: 'tab', label: 'TAB', action: 'tab' },
  { id: 'up', label: '', icon: '↑', action: 'up' },
  { id: 'down', label: '', icon: '↓', action: 'down' },
  { id: 'left', label: '', icon: '←', action: 'left' },
  { id: 'right', label: '', icon: '→', action: 'right' },
  { id: 'home', label: 'HOME', action: 'home' },
  { id: 'end', label: 'END', action: 'end' },
]

const actionKeys = [
  { id: 'clear', label: 'CLS', action: 'clear' },
  { id: 'pageup', label: 'PGUP', action: 'pageup' },
  { id: 'pagedown', label: 'PGDN', action: 'pagedown' },
  { id: 'help', label: 'HELP', action: 'help' },
  { id: 'history', label: 'HIST', action: 'history' },
]

// Terminal instance
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

// Key handling
function handleModifier(id: 'ctrl' | 'alt'): void {
  modifiers.value[id] = !modifiers.value[id]
  triggerHaptic()
}

function handleKey(action: string): void {
  const terminal = getTerminal()
  if (!terminal) return

  triggerHaptic()

  switch (action) {
    case 'esc':
      sendKey('\x1b')
      break
    case 'tab':
      sendKey('\t')
      break
    case 'up':
      sendKey('\x1b[A')
      break
    case 'down':
      sendKey('\x1b[B')
      break
    case 'left':
      sendKey('\x1b[D')
      break
    case 'right':
      sendKey('\x1b[C')
      break
    case 'home':
      terminal.scrollToTop()
      break
    case 'end':
      terminal.scrollToBottom()
      break
    case 'pageup':
      terminal.scrollPages(-1)
      break
    case 'pagedown':
      terminal.scrollPages(1)
      break
    case 'clear':
      clear()
      if (!systemStore.isRunning) {
        displayWelcomeMessage()
      }
      break
    case 'help':
      sendText('help\n')
      break
    case 'history':
      navigateHistory(1)
      break
    case 'enter':
      sendKey('\r')
      break
  }

  // Reset modifiers after sending
  setTimeout(() => {
    modifiers.value = { ctrl: false, alt: false }
  }, 100)
}

function triggerHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8)
  }
}

// Resize handling
let resizeTimeout: number | null = null
const handleResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }

  resizeTimeout = window.setTimeout(() => {
    const terminal = getTerminal()
    if (terminal) {
      updateTerminalFontSize(terminal)
    }
  }, 250)
}

// Initialize
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

    // Clear terminal and show startup prompt
    clear()
    displayStartupPrompt()

    setupCommandHandler()
  } catch (error) {
    console.error('[Terminal] Failed to initialize:', error)
  }
})

// Tab switching
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
        indexedDBService.saveTerminalState(oldTabId, lines).catch(err => {
          console.error('[Terminal] Failed to save state:', err)
        })
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
      } catch (error) {
        console.error('[Terminal] Failed to load state:', error)
      }
    }

    clear()

    if (savedLines && savedLines.length > 0) {
      for (const line of savedLines) {
        terminal.writeln(line || '')
      }
    }

    requestAnimationFrame(() => {
      if (terminalInstance.value.fitAddon && terminal) {
        try {
          terminalInstance.value.fitAddon.fit()
        } catch { /* ignore */ }
      }
      terminal.scrollToBottom()
      window.__terminalInstance = {
        cols: terminal.cols,
        rows: terminal.rows,
      }
    })
  }
}, { flush: 'post' })

// Cleanup
onBeforeUnmount(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  window.removeEventListener('resize', handleResize)
  destroyTerminal()
})
</script>

<style scoped>
/* ── Terminal Shell ────────────────────────────────────────────────── */
.terminal-shell {
  width: 100vw;
  height: 100dvh;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--gui-bg-base, #060606);
  overflow: hidden;
}

/* ── Terminal Header ────────────────────────────────────────────────── */
.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--gui-spacing-base, 16px);
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--gui-glass-bg, rgba(16, 16, 16, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  flex-shrink: 0;
}

.terminal-header__dots {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
}

.terminal-header__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--gui-radius-full, 9999px);
  transition: all var(--gui-transition-base, 200ms ease);
}

.terminal-header__dot--red {
  background: #ff5f57;
  box-shadow: 0 0 4px rgba(255, 95, 87, 0.4);
}

.terminal-header__dot--yellow {
  background: #ffbd2e;
  box-shadow: 0 0 4px rgba(255, 189, 46, 0.4);
}

.terminal-header__dot--green {
  background: #28c840;
  box-shadow: 0 0 4px rgba(40, 200, 64, 0.4);
}

.terminal-header__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #a0a0a0);
  letter-spacing: 0.03em;
}

.terminal-header__icon {
  color: var(--gui-accent, #e94560);
  font-weight: var(--gui-font-weight-bold, 700);
}

.terminal-header__status {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-semibold, 600);
  letter-spacing: 0.05em;
}

.terminal-header__status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--gui-radius-full, 9999px);
  animation: status-pulse 2s ease-in-out infinite;
}

.terminal-header__status-dot--online {
  background: var(--gui-success, #34d399);
  box-shadow: 0 0 6px var(--gui-success, #34d399);
}

.terminal-header__status-dot--offline {
  background: var(--gui-error, #f87171);
  box-shadow: 0 0 6px var(--gui-error, #f87171);
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

/* ── Terminal Body ─────────────────────────────────────────────────── */
.terminal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--gui-editor-bg, #0a0a0a);
}

#terminal-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--gui-editor-bg, #0a0a0a);
  overflow: visible;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

#terminal-container ::v-deep(.xterm) {
  height: 100%;
  padding: var(--gui-spacing-sm, 8px);
}

#terminal-container ::v-deep(.xterm-viewport) {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: var(--gui-accent, #e94560) transparent;
}

#terminal-container ::v-deep(.xterm-viewport)::-webkit-scrollbar {
  width: 4px;
}

#terminal-container ::v-deep(.xterm-viewport)::-webkit-scrollbar-track {
  background: transparent;
}

#terminal-container ::v-deep(.xterm-viewport)::-webkit-scrollbar-thumb {
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
  opacity: 0.6;
}

#terminal-container ::v-deep(.xterm-screen) {
  background-color: var(--gui-editor-bg, #0a0a0a) !important;
}

/* ── Virtual Keyboard ──────────────────────────────────────────────── */
.virtual-keyboard {
  padding: var(--gui-spacing-xs, 4px);
  padding-bottom: calc(var(--gui-spacing-xs, 4px) + env(safe-area-inset-bottom, 0px));
  background: var(--gui-glass-bg, rgba(12, 12, 12, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

/* Modifier Keys */
.virtual-keyboard__modifiers {
  display: flex;
  gap: var(--gui-spacing-xs, 4px);
  margin-bottom: var(--gui-spacing-xs, 4px);
}

/* Key Base Styles */
.virtual-keyboard__key {
  flex: 1;
  min-width: 40px;
  height: var(--gui-dim-keyboard-button-height, 40px);
  background: var(--gui-bg-surface, #0c0c0c);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-base, 8px);
  color: var(--gui-text-primary, #f0f0f0);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all var(--gui-transition-fast, 120ms ease);
}

.virtual-keyboard__key:active {
  transform: scale(0.92);
  background: var(--gui-bg-surface-active, #222222);
}

.virtual-keyboard__key:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

/* Modifier Keys */
.virtual-keyboard__key--modifier {
  background: var(--gui-bg-surface-raised, #111111);
  font-size: var(--gui-font-xs, 11px);
  letter-spacing: 0.05em;
}

.virtual-keyboard__key--modifier.virtual-keyboard__key--active {
  background: var(--gui-accent-soft, rgba(233, 69, 96, 0.15));
  color: var(--gui-accent, #e94560);
  border-color: var(--gui-accent, #e94560);
}

/* Navigation Keys */
.virtual-keyboard__key--nav {
  min-width: 44px;
  font-size: var(--gui-font-md, 14px);
}

.virtual-keyboard__key--enter {
  background: var(--gui-accent, #e94560);
  color: var(--gui-text-inverse, #ffffff);
  border-color: var(--gui-accent, #e94560);
  min-width: 60px;
}

.virtual-keyboard__key--enter:active {
  background: var(--gui-accent-hover, #ff5a73);
  border-color: var(--gui-accent-hover, #ff5a73);
}

.virtual-keyboard__key-icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

/* Action Keys */
.virtual-keyboard__key--action {
  background: var(--gui-bg-surface, #0c0c0c);
  font-size: var(--gui-font-xs, 11px);
  letter-spacing: 0.03em;
}

/* Keyboard Rows */
.virtual-keyboard__row {
  display: flex;
  gap: var(--gui-spacing-xxs, 2px);
  margin-bottom: var(--gui-spacing-xxs, 2px);
}

.virtual-keyboard__row:last-child {
  margin-bottom: 0;
}

/* ── Keyboard Transition ────────────────────────────────────────────── */
.terminal-keyboard-enter-active {
  transition: all var(--gui-transition-base, 200ms cubic-bezier(0.4, 0, 0.2, 1));
}

.terminal-keyboard-leave-active {
  transition: all var(--gui-transition-base, 200ms cubic-bezier(0.4, 0, 0.2, 1));
}

.terminal-keyboard-enter-from,
.terminal-keyboard-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ── Mobile Adjustments ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .terminal-header {
    height: 48px;
  }

  .virtual-keyboard {
    padding: var(--gui-spacing-xxs, 2px);
    padding-bottom: calc(var(--gui-spacing-xxs, 2px) + env(safe-area-inset-bottom, 0px));
  }

  .virtual-keyboard__modifiers {
    margin-bottom: var(--gui-spacing-xxs, 2px);
  }

  .virtual-keyboard__row {
    gap: var(--gui-spacing-xxs, 2px);
    margin-bottom: var(--gui-spacing-xxs, 2px);
  }

  .virtual-keyboard__key {
    height: 36px;
    min-width: 36px;
    font-size: 10px;
    border-radius: var(--gui-radius-sm, 6px);
  }

  .virtual-keyboard__key--nav {
    min-width: 40px;
  }

  .virtual-keyboard__key--enter {
    min-width: 52px;
  }
}

@media (max-width: 480px) {
  .virtual-keyboard__key {
    height: 32px;
    min-width: 32px;
    font-size: 9px;
  }

  .virtual-keyboard__key--modifier {
    font-size: 9px;
  }

  .virtual-keyboard__key--action {
    font-size: 9px;
  }
}

@media (max-width: 360px) {
  .virtual-keyboard__key {
    height: 30px;
    min-width: 28px;
  }
}
</style>

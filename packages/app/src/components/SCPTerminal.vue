<template>
  <div class="scp-terminal w-screen h-dvh relative flex flex-col bg-[#1C1C1E] overflow-hidden">
    <!-- Terminal Header -->
    <div class="scp-terminal__header flex items-center justify-between h-11 px-4 bg-[rgba(44,44,46,0.85)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-white/[0.06] flex-shrink-0"
         style="padding-top: env(safe-area-inset-top, 0px);">
      <!-- Traffic Lights -->
      <div class="flex items-center gap-1">
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#FF5F57] shadow-[0_0_4px_rgba(255,95,87,0.4)] transition-all duration-200" />
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#FFBD2E] shadow-[0_0_4px_rgba(255,189,46,0.4)] transition-all duration-200" />
        <span class="scp-terminal__dot w-[10px] h-[10px] rounded-full bg-[#28C840] shadow-[0_0_4px_rgba(40,200,64,0.4)] transition-all duration-200" />
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
    <div class="scp-terminal__body flex-1 relative overflow-hidden bg-[#1C1C1E]">
      <div id="terminal-container" ref="terminalContainer" class="w-full h-full bg-[#1C1C1E] touch-pan-y overscroll-y-contain -webkit-overflow-scrolling-touch scroll-smooth" />
    </div>

    <!-- Virtual Keyboard -->
    <Transition name="scp-terminal__keyboard">
      <div v-if="isMobile" class="scp-terminal__keyboard px-1 pb-[calc(4px+env(safe-area-inset-bottom,0px))] pt-1 bg-[rgba(44,44,46,0.85)] backdrop-blur-[20px] backdrop-saturate-[180%] border-t border-white/[0.06]">
        <!-- Modifier Keys -->
        <div class="flex gap-1 mb-2">
          <button
            v-for="mod in modifierKeys"
            :key="mod.id"
            :class="[
              'flex-1 min-w-[40px] h-10 bg-[#2C2C2E] border border-white/[0.06] rounded-[8px] text-[#FFFFFF] text-[11px] font-medium cursor-pointer flex items-center justify-center select-none -webkit-tap-highlight-color-transparent transition-all duration-120 ease-in-out',
              { 'bg-[rgba(142,142,147,0.15)] text-[#8E8E93] border-[#8E8E93]': modifiers[mod.id] },
            ]"
            @click="handleModifier(mod.id)"
          >
            {{ mod.label }}
          </button>
        </div>
        <!-- Navigation Keys -->
        <div class="flex gap-[2px] mb-[2px]">
          <button
            v-for="key in navKeys"
            :key="key.id"
            class="flex-1 min-w-[44px] h-10 bg-[#1C1C1E] border border-white/[0.06] rounded-[8px] text-[#FFFFFF] text-[14px] font-medium cursor-pointer flex items-center justify-center select-none -webkit-tap-highlight-color-transparent transition-all duration-120 ease-in-out active:scale-[0.92] active:bg-[#3A3A3C] hover:bg-white/[0.06]"
            @click="handleKey(key.action)"
          >
            <span v-if="key.icon" v-html="key.icon" />
            <span v-else>{{ key.label }}</span>
          </button>
          <button
            class="flex-1 min-w-[60px] h-10 bg-[#8E8E93] border border-[#8E8E93] rounded-[8px] text-[#FFFFFF] cursor-pointer flex items-center justify-center select-none -webkit-tap-highlight-color-transparent transition-all duration-120 ease-in-out active:scale-[0.92] active:bg-[#AEAEB2] active:border-[#AEAEB2]"
            @click="handleKey('enter')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 14L9 9L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9V4H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <!-- Action Keys -->
        <div class="flex gap-[2px]">
          <button
            v-for="key in actionKeys"
            :key="key.id"
            class="flex-1 min-w-[40px] h-10 bg-[#1C1C1E] border border-white/[0.06] rounded-[8px] text-[#FFFFFF] text-[11px] font-medium cursor-pointer flex items-center justify-center select-none -webkit-tap-highlight-color-transparent transition-all duration-120 ease-in-out active:scale-[0.92] active:bg-[#3A3A3C] hover:bg-white/[0.06]"
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
    case 'home': terminal.scrollToTop(); break
    case 'end': terminal.scrollToBottom(); break
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

    clear()
    displayStartupPrompt()
    setupCommandHandler()
  } catch (error) {
    console.error('[Terminal] Failed to initialize:', error)
  }
})

watch(() => tabsStore.activeTabId, async (newTabId, oldTabId) => {
  const terminal = getTerminal()
  if (!terminal) return
  if (newTabId === oldTabId) return

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

onBeforeUnmount(() => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  window.removeEventListener('resize', handleResize)
  destroyTerminal()
})
</script>

<style scoped>
/* Terminal scrollbar */
#terminal-container :deep(.xterm) {
  height: 100%;
  padding: 8px;
}

#terminal-container :deep(.xterm-viewport) {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: var(--gui-accent, #8E8E93) transparent;
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
  opacity: 0.6;
}

#terminal-container :deep(.xterm-screen) {
  background-color: var(--gui-editor-bg, #1C1C1E) !important;
}

/* Keyboard transition */
.scp-terminal__keyboard-enter-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
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

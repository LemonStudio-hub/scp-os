<template>
  <div class="terminal-wrapper">
    <div id="terminal-container" ref="terminalContainer"></div>
    
    <!-- Mobile Virtual Keyboard (Termux-style) -->
    <div v-if="isMobile" class="virtual-keyboard">
      <div class="keyboard-row">
        <button 
          v-for="key in firstRowKeys" 
          :key="key.id"
          :class="['key-button', key.class]"
          @click="handleKeyPress(key)"
          @touchstart.prevent="handleKeyPress(key)"
        >
          <span v-html="key.label"></span>
        </button>
      </div>
      <div class="keyboard-row">
        <button 
          v-for="key in secondRowKeys" 
          :key="key.id"
          :class="['key-button', key.class]"
          @click="handleKeyPress(key)"
          @touchstart.prevent="handleKeyPress(key)"
        >
          <span v-html="key.label"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useTerminal } from '../composables/useTerminal'
import { useGestures } from '../composables/useGestures'
import { updateTerminalFontSize } from '../utils/terminal'

const terminalContainer = ref<HTMLDivElement>()

// Detect if device is mobile
const isMobile = computed(() => {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
})

// Virtual keyboard configuration
const firstRowKeys = [
  { id: 'esc', label: 'ESC', class: 'key-esc', action: 'esc' },
  { id: 'tab', label: 'TAB', class: 'key-tab', action: 'tab' },
  { id: 'ctrl', label: 'CTRL', class: 'key-ctrl', action: 'ctrl' },
  { id: 'alt', label: 'ALT', class: 'key-alt', action: 'alt' },
  { id: 'up', label: '↑', class: 'key-arrow', action: 'up' },
  { id: 'down', label: '↓', class: 'key-arrow', action: 'down' },
  { id: 'clear', label: 'CLS', class: 'key-clear', action: 'clear' },
]

const secondRowKeys = [
  { id: 'home', label: 'HOME', class: 'key-home', action: 'home' },
  { id: 'end', label: 'END', class: 'key-end', action: 'end' },
  { id: 'pageup', label: 'PGUP', class: 'key-page', action: 'pageup' },
  { id: 'pagedown', label: 'PGDN', class: 'key-page', action: 'pagedown' },
  { id: 'help', label: 'HELP', class: 'key-help', action: 'help' },
  { id: 'history', label: 'HIST', class: 'key-history', action: 'history' },
  { id: 'enter', label: 'ENTER', class: 'key-enter', action: 'enter' },
]

// Modifier key states
const modifiers = ref({
  ctrl: false,
  alt: false
})

const {
  initTerminal,
  destroyTerminal,
  displayBootLog,
  displayWelcomeMessage,
  setupCommandHandler,
  focus,
  clear,
  navigateHistory,
  autocomplete,
  getTerminal,
  sendKey,
  sendText
} = useTerminal(terminalContainer)

const {
  initGestures
} = useGestures(terminalContainer, {
  onClearScreen: () => {
    clear()
    displayWelcomeMessage()
  },
  onHistoryUp: () => navigateHistory(-1),
  onHistoryDown: () => navigateHistory(1),
  onFocus: focus,
  onScrollTop: () => {
    const terminal = getTerminal()
    if (terminal) {
      terminal.scrollToTop()
    }
  },
  onScrollBottom: () => {
    const terminal = getTerminal()
    if (terminal) {
      terminal.scrollToBottom()
    }
  }
})

const scrollToTop = () => {
  const terminal = getTerminal()
  if (terminal) {
    terminal.scrollToTop()
  }
}

const scrollToBottom = () => {
  const terminal = getTerminal()
  if (terminal) {
    terminal.scrollToBottom()
  }
}

const handleKeyPress = (key: any) => {
  const terminal = getTerminal()
  if (!terminal) return

  switch (key.action) {
    case 'esc':
      sendKey('\x1b')
      break
    case 'tab':
      sendKey('\t')
      break
    case 'ctrl':
      modifiers.value.ctrl = !modifiers.value.ctrl
      // Toggle visual feedback
      break
    case 'alt':
      modifiers.value.alt = !modifiers.value.alt
      // Toggle visual feedback
      break
    case 'up':
      sendKey('\x1b[A')
      break
    case 'down':
      sendKey('\x1b[B')
      break
    case 'clear':
      clear()
      displayWelcomeMessage()
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
    case 'help':
      sendText('help\n')
      break
    case 'history':
      // Show command history
      navigateHistory(1)
      break
    case 'enter':
      sendKey('\r')
      break
  }
}

// Handle resize events with debounced font size update
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

onMounted(async () => {
  initTerminal()
  initGestures()
  
  // Add resize listener for responsive font size
  window.addEventListener('resize', handleResize)
  
  await displayBootLog()
  displayWelcomeMessage()
  setupCommandHandler()
})

onBeforeUnmount(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  window.removeEventListener('resize', handleResize)
  destroyTerminal()
})

// Export functions for gesture handlers
window.scpTerminalActions = {
  clearScreen: () => {
    clear()
    displayWelcomeMessage()
  },
  navigateHistory,
  autocomplete,
  focus,
  scrollToTop,
  scrollToBottom
}
</script>

<style scoped>
.terminal-wrapper {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #0a0a0a;
}

#terminal-container {
  width: 100%;
  height: calc(100vh - 140px); /* Reserve space for virtual keyboard */
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  background: #0a0a0a;
  overflow: hidden;
}

#terminal-container ::v-deep(.xterm) {
  height: 100%;
  padding: 8px;
}

#terminal-container ::v-deep(.xterm-viewport) {
  overflow-y: auto;
}

#terminal-container ::v-deep(.xterm-screen) {
  background-color: #0a0a0a !important;
}

/* Virtual Keyboard Styles */
.virtual-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  border-top: 1px solid #333;
  padding: 8px;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
}

.keyboard-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 4px;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-button {
  flex: 1;
  min-width: 40px;
  height: 40px;
  background: #2d2d2d;
  border: none;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.key-button:active {
  background: #3d3d3d;
  transform: scale(0.95);
}

.key-button:hover {
  background: #3d3d3d;
}

/* Key-specific styles */
.key-esc {
  background: #4a4a4a;
  font-weight: 600;
}

.key-tab {
  background: #4a4a4a;
}

.key-ctrl, .key-alt {
  background: #3a3a3a;
}

.key-ctrl.active, .key-alt.active {
  background: #5a5a5a;
  box-shadow: 0 0 0 2px #4a90e2;
}

.key-arrow {
  background: #4a4a4a;
  font-size: 14px;
}

.key-clear {
  background: #5a4a4a;
}

.key-home, .key-end {
  background: #4a4a4a;
}

.key-page {
  background: #4a4a4a;
  font-size: 10px;
}

.key-help {
  background: #4a90e2;
  color: white;
  font-weight: 600;
}

.key-history {
  background: #f39c12;
  color: white;
  font-weight: 600;
}

.key-enter {
  background: #4a90e2;
  color: white;
  font-weight: 600;
}

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  #terminal-container {
    height: calc(100vh - 130px);
  }
  
  #terminal-container ::v-deep(.xterm) {
    padding: 4px;
  }
  
  .virtual-keyboard {
    padding: 6px;
  }
  
  .keyboard-row {
    gap: 3px;
  }
  
  .key-button {
    height: 36px;
    font-size: 10px;
    min-width: 36px;
  }
}

@media (max-width: 480px) {
  #terminal-container {
    height: calc(100vh - 120px);
  }
  
  #terminal-container ::v-deep(.xterm) {
    padding: 2px;
  }
  
  .virtual-keyboard {
    padding: 4px;
  }
  
  .keyboard-row {
    gap: 2px;
  }
  
  .key-button {
    height: 32px;
    font-size: 9px;
    min-width: 32px;
  }
}

@media (max-width: 360px) {
  .key-button {
    font-size: 8px;
    min-width: 28px;
  }
}
</style>
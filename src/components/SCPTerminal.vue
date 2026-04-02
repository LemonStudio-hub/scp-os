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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useTerminal } from '../composables/useTerminal'
import { updateTerminalFontSize } from '../utils/terminal'
import { useTabsStore } from '../stores/tabs'

const tabsStore = useTabsStore()
const terminalContainer = ref<HTMLDivElement>()

// 存储每个标签页的终端状态
const terminalStates = ref<Record<string, string>>({})

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
  clear,
  navigateHistory,
  getTerminal,
  sendKey,
  sendText
} = useTerminal(terminalContainer)

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
  
  // Add resize listener for responsive font size
  window.addEventListener('resize', handleResize)
  
  await displayBootLog()
  displayWelcomeMessage()
  setupCommandHandler()
})

// 监听标签页切换，保存和恢复终端状态
watch(() => tabsStore.activeTabId, async (newTabId, oldTabId) => {
  const terminal = getTerminal()
  if (!terminal) return

  // 保存旧标签页的终端状态（保存当前行）
  if (oldTabId && terminal.buffer.active) {
    const cursorLine = terminal.buffer.active.getLine(terminal.buffer.active.cursorY)
    if (cursorLine) {
      terminalStates.value[oldTabId] = cursorLine.translateToString()
    }
  }

  // 恢复新标签页的终端状态
  if (newTabId && terminalStates.value[newTabId]) {
    clear()
    displayWelcomeMessage()
  } else if (newTabId) {
    // 新标签页，显示欢迎信息
    clear()
    displayWelcomeMessage()
  }
})

onBeforeUnmount(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  window.removeEventListener('resize', handleResize)
  destroyTerminal()
})
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
  overflow: visible;
  touch-action: pan-y;
  /* 移动端滚动优化 */
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  will-change: transform;
}

#terminal-container ::v-deep(.xterm) {
  height: 100%;
  padding: 8px;
}

#terminal-container ::v-deep(.xterm-viewport) {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
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
  background: #0a0a0a;
  border-top: 1px solid #1a1a1a;
  padding: 8px;
  z-index: 1000;
  touch-action: manipulation;
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
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  color: #ffffff;
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
  background: #000000;
  border-color: #1a1a1a;
}

.key-button:hover {
  background: #000000;
  border-color: #1a1a1a;
}

/* Key-specific styles - all unified with terminal theme */
.key-esc,
.key-tab,
.key-ctrl,
.key-alt,
.key-arrow,
.key-clear,
.key-home,
.key-end,
.key-page,
.key-help,
.key-history,
.key-enter {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  color: #ffffff;
}

/* Modifier key active state */
.key-ctrl.active, .key-alt.active {
  background: #000000;
  border-color: #1a1a1a;
}

/* Key-specific font sizes */
.key-arrow {
  font-size: 14px;
}

.key-page {
  font-size: 10px;
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
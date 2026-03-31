<template>
  <div id="terminal-container" ref="terminalContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTerminal } from '../composables/useTerminal'
import { setupGestures, destroyGestures } from '../utils/gestures'
import { updateTerminalFontSize } from '../utils/terminal'

const terminalContainer = ref<HTMLDivElement>()
let hammer: HammerManager | null = null

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
  getTerminal
} = useTerminal(terminalContainer)

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
  if (terminalContainer.value) {
    hammer = setupGestures(terminalContainer.value)
  }
  
  // Add resize listener for responsive font size
  window.addEventListener('resize', handleResize)
  
  await displayBootLog()
  displayWelcomeMessage()
  setupCommandHandler()
})

onBeforeUnmount(() => {
  if (hammer) {
    destroyGestures(hammer)
  }
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
#terminal-container {
  width: 100vw;
  height: 100vh;
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

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  #terminal-container ::v-deep(.xterm) {
    padding: 4px;
  }
}

@media (max-width: 480px) {
  #terminal-container ::v-deep(.xterm) {
    padding: 2px;
  }
}
</style>
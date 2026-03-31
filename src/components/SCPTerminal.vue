<template>
  <div id="terminal-container" ref="terminalContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTerminal } from '../composables/useTerminal'
import { setupGestures, destroyGestures } from '../utils/gestures'

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
  autocomplete
} = useTerminal(terminalContainer)

onMounted(async () => {
  initTerminal()
  if (terminalContainer.value) {
    hammer = setupGestures(terminalContainer.value)
  }
  await displayBootLog()
  displayWelcomeMessage()
  setupCommandHandler()
})

onBeforeUnmount(() => {
  if (hammer) {
    destroyGestures(hammer)
  }
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
  focus
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
</style>
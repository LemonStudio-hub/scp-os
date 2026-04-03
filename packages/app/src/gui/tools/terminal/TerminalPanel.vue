<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="terminal-panel">
      <!-- Toolbar -->
      <div class="terminal-panel__toolbar">
        <div class="terminal-panel__toolbar-left">
          <SCPButton variant="ghost" size="sm" icon="🗑️" title="Clear" @click="onClear" />
          <SCPButton variant="ghost" size="sm" icon="🔄" title="Restart" @click="onRestart" />
        </div>
        <div class="terminal-panel__toolbar-right">
          <SCPButton variant="ghost" size="sm" :icon="fontSize > 14 ? 'A-' : 'A+'" :title="`Font: ${fontSize}px`" @click="onToggleFontSize" />
        </div>
      </div>

      <!-- Terminal Container -->
      <div ref="terminalContainerRef" class="terminal-panel__terminal" />

      <!-- Status Bar -->
      <SCPStatusBar
        :left-items="[`Terminal`, `bash`]"
        :right-items="[`${fontSize}px`]"
      />
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPButton from '../../components/ui/SCPButton.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import { useTerminalPanelStore } from '../../stores/terminalPanel'
import { commandHandlers } from '../../../commands/index'
import type { WindowInstance } from '../../types'
import { ANSICode } from '../../../constants/theme'

interface Props {
  windowInstance: WindowInstance
}

const props = defineProps<Props>()

const tpStore = useTerminalPanelStore()
const terminalContainerRef = ref<HTMLDivElement>()
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)
const inputBuffer = ref('')

const fontSize = computed(() => tpStore.fontSize)

function initTerminal(): void {
  if (!terminalContainerRef.value) return

  const term = new Terminal({
    cursorBlink: true,
    fontSize: tpStore.fontSize,
    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    theme: {
      background: '#0a0a0a',
      foreground: '#e0e0e0',
      cursor: '#e94560',
      selectionBackground: '#264f78',
    },
    scrollback: 1000,
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.open(terminalContainerRef.value)
  fit.fit()

  terminal.value = term
  fitAddon.value = fit

  tpStore.registerTerminal(props.windowInstance.config.id, term)

  // Welcome message
  term.writeln(`${ANSICode.green}Welcome to SCP Terminal Panel${ANSICode.reset}`)
  term.writeln('')
  writePrompt()

  // Input handler
  term.onData(handleInput)
}

function writePrompt(): void {
  const term = terminal.value
  if (!term) return
  term.write(`\r\n${ANSICode.red}scp@foundation${ANSICode.reset}:${ANSICode.cyan}~${ANSICode.reset}$ `)
  inputBuffer.value = ''
}

function handleInput(data: string): void {
  const term = terminal.value
  if (!term) return

  if (data === '\r') {
    // Enter - execute command
    term.writeln('')
    executeCommand(inputBuffer.value.trim())
  } else if (data === '\x7f' || data === '\b') {
    // Backspace
    if (inputBuffer.value.length > 0) {
      inputBuffer.value = inputBuffer.value.slice(0, -1)
      term.write('\b \b')
    }
  } else if (data === '\x03') {
    // Ctrl+C
    term.writeln('^C')
    writePrompt()
  } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
    // Printable character
    inputBuffer.value += data
    term.write(data)
  }
}

async function executeCommand(cmd: string): Promise<void> {
  const term = terminal.value
  if (!term) return

  if (!cmd) {
    writePrompt()
    return
  }

  const [command, ...args] = cmd.split(/\s+/)
  const handler = commandHandlers[command as keyof typeof commandHandlers]

  if (handler) {
    try {
      await handler(
        args,
        (data: string) => term.write(data),
        (data: string) => term.writeln(data)
      )
    } catch (error) {
      term.writeln(`${ANSICode.red}Error: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  } else {
    term.writeln(`${ANSICode.yellow}Command not found: ${command}${ANSICode.reset}`)
  }

  writePrompt()
}

function onClear(): void {
  terminal.value?.clear()
  writePrompt()
}

function onRestart(): void {
  if (terminal.value) {
    terminal.value.clear()
    writePrompt()
  }
}

function onToggleFontSize(): void {
  const newSize = tpStore.fontSize > 14 ? 12 : tpStore.fontSize < 13 ? 14 : 13
  tpStore.setFontSize(newSize)
  if (terminal.value) {
    terminal.value.options.fontSize = newSize
  }
  setTimeout(() => fitAddon.value?.fit(), 50)
}

function onClose(): void {
  if (terminal.value) {
    tpStore.unregisterTerminal(props.windowInstance.config.id)
    terminal.value.dispose()
    terminal.value = null
  }
}

onMounted(() => {
  initTerminal()
})

onBeforeUnmount(() => {
  onClose()
})
</script>

<style scoped>
.terminal-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0a0a0a;
}

.terminal-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--gui-color-bg-tertiary, #1a1a1a);
  border-bottom: 1px solid var(--gui-color-border-default, #2a2a2a);
}

.terminal-panel__toolbar-left,
.terminal-panel__toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.terminal-panel__terminal {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.terminal-panel__terminal :deep(.xterm) {
  height: 100%;
  padding: 8px;
}

.terminal-panel__terminal :deep(.xterm-viewport) {
  overflow-y: auto;
}
</style>

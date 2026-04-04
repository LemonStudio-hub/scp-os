<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="terminal-panel">
      <!-- Toolbar -->
      <div class="terminal-panel__toolbar">
        <div class="terminal-panel__toolbar-left">
          <SCPButton variant="ghost" size="sm" icon="trash" title="Clear" @click="onClear" />
          <SCPButton variant="ghost" size="sm" icon="refresh" title="Restart" @click="onRestart" />
        </div>
        <div class="terminal-panel__toolbar-right">
          <SCPButton variant="ghost" size="sm" :title="`Font: ${fontSize}px`" @click="onToggleFontSize">
            <span class="terminal-panel__font-size">{{ fontSize > 14 ? 'A-' : 'A+' }}</span>
          </SCPButton>
        </div>
      </div>

      <!-- Terminal Container -->
      <div ref="terminalContainerRef" class="terminal-panel__terminal" />

      <!-- Status Bar -->
      <SCPStatusBar
        :left-items="['Terminal', 'bash']"
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
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'SF Mono', Consolas, monospace",
    theme: {
      background: '#0a0a0a',
      foreground: '#f0f0f0',
      cursor: '#e94560',
      cursorAccent: '#0a0a0a',
      selectionBackground: 'rgba(96, 165, 250, 0.25)',
      black: '#1a1a1a',
      red: '#e94560',
      green: '#34d399',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#22d3ee',
      white: '#f0f0f0',
      brightBlack: '#555555',
      brightRed: '#ff5a73',
      brightGreen: '#6ee7b7',
      brightYellow: '#fcd34d',
      brightBlue: '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan: '#67e8f9',
      brightWhite: '#ffffff',
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

  term.writeln(`${ANSICode.green}Welcome to SCP Terminal Panel${ANSICode.reset}`)
  term.writeln('')
  writePrompt()

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
    term.writeln('')
    executeCommand(inputBuffer.value.trim())
  } else if (data === '\x7f' || data === '\b') {
    if (inputBuffer.value.length > 0) {
      inputBuffer.value = inputBuffer.value.slice(0, -1)
      term.write('\b \b')
    }
  } else if (data === '\x03') {
    term.writeln('^C')
    writePrompt()
  } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
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
/* ── Layout ─────────────────────────────────────────────────────────── */
.terminal-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-editor-bg, #0a0a0a);
}

.terminal-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-xs, 4px) var(--gui-spacing-sm, 8px);
  background: var(--gui-bg-surface, #0c0c0c);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
}

.terminal-panel__toolbar-left,
.terminal-panel__toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
}

.terminal-panel__font-size {
  font-family: var(--gui-font-sans);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-primary, #f0f0f0);
}

.terminal-panel__terminal {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.terminal-panel__terminal :deep(.xterm) {
  height: 100%;
  padding: var(--gui-spacing-sm, 8px);
}

.terminal-panel__terminal :deep(.xterm-viewport) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gui-accent, #e94560) transparent;
}

.terminal-panel__terminal :deep(.xterm-viewport)::-webkit-scrollbar {
  width: 6px;
}

.terminal-panel__terminal :deep(.xterm-viewport)::-webkit-scrollbar-track {
  background: transparent;
}

.terminal-panel__terminal :deep(.xterm-viewport)::-webkit-scrollbar-thumb {
  background: var(--gui-accent, #e94560);
  border-radius: 999px;
}
</style>

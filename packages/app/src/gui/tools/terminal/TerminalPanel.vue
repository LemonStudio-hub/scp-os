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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import SCPWindow from '../../components/SCPWindow.vue'
import SCPButton from '../../components/ui/SCPButton.vue'
import SCPStatusBar from '../../components/ui/SCPStatusBar.vue'
import { useTerminalPanelStore } from '../../stores/terminalPanel'
import { useTerminalEmulator } from '../../composables/useTerminalEmulator'
import { useThemeStore } from '../../stores/themeStore'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

const props = defineProps<Props>()

const tpStore = useTerminalPanelStore()
const themeStore = useThemeStore()
const terminalContainerRef = ref<HTMLDivElement>()
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)

const fontSize = computed(() => tpStore.fontSize)

// Use shared terminal emulator composable
const { writePrompt, handleInput, clearAndPrompt } = useTerminalEmulator({
  getTerminal: () => terminal.value,
})

function getTerminalTheme() {
  const c = themeStore.currentTheme.colors
  return {
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
}

function initTerminal(): void {
  if (!terminalContainerRef.value) return

  const term = new Terminal({
    cursorBlink: true,
    fontSize: tpStore.fontSize,
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'SF Mono', Consolas, monospace",
    theme: getTerminalTheme(),
    scrollback: 1000,
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.open(terminalContainerRef.value)
  fit.fit()

  terminal.value = term
  fitAddon.value = fit

  tpStore.registerTerminal(props.windowInstance.config.id, term)

  term.writeln('\x1b[32mWelcome to SCP Terminal Panel\x1b[0m')
  term.writeln('')
  writePrompt()

  term.onData(handleInput)
}

function onClear(): void {
  clearAndPrompt()
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

// Watch for theme changes
watch(() => themeStore.currentThemeId, () => {
  if (terminal.value) {
    terminal.value.options.theme = getTerminalTheme()
    terminal.value.refresh(0, terminal.value.rows - 1)
  }
})

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

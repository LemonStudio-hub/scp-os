<template>
  <MobileWindow
    :visible="visible"
    :title="t('app.terminal')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-terminal">
      <!-- Terminal Container -->
      <div ref="terminalRef" class="mobile-terminal__container" />

      <!-- Virtual Keyboard (iOS style) -->
      <div class="mobile-terminal__keyboard">
        <div class="mobile-terminal__kb-row">
          <button class="mobile-terminal__key" @click="sendKey('\x1b')">ESC</button>
          <button class="mobile-terminal__key" @click="sendKey('\t')">TAB</button>
          <button class="mobile-terminal__key" @click="sendKey('\x1b[D')">←</button>
          <button class="mobile-terminal__key" @click="sendKey('\x1b[C')">→</button>
          <button class="mobile-terminal__key" @click="sendKey('\x1b[A')">↑</button>
          <button class="mobile-terminal__key" @click="sendKey('\x1b[B')">↓</button>
        </div>
        <div class="mobile-terminal__kb-row">
          <button class="mobile-terminal__key" @click="sendKey('\x1b[H')">HOME</button>
          <button class="mobile-terminal__key" @click="sendKey('\x1b[F')">END</button>
          <button class="mobile-terminal__key" @click="onClear">CLS</button>
          <button class="mobile-terminal__key" @click="sendKey('\r')">↵</button>
        </div>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import MobileWindow from '../../components/MobileWindow.vue'
import { useI18n } from '../../composables/useI18n'
import { useTerminalEmulator } from '../../composables/useTerminalEmulator'
import { useThemeStore } from '../../stores/themeStore'
import { useSystemStore } from '../../../stores/system'
import { getBootLogs, getShutdownLogs } from '../../../constants/bootLogs'
import { config } from '../../../config'
import { getResponsiveFontSize, isMobileDevice } from '../../../utils/terminal'

const { t } = useI18n()

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const terminalRef = ref<HTMLDivElement | null>(null)
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)
const themeStore = useThemeStore()
const systemStore = useSystemStore()

function getMobileTerminalTheme() {
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

// Use shared terminal emulator composable
const { writePrompt, handleInput, clearAndPrompt: onClear } = useTerminalEmulator({
  getTerminal: () => terminal.value,
})

// Boot/Shutdown log display functions
async function displayBootLog(): Promise<void> {
  const term = terminal.value
  if (!term) return

  const bootLogs = getBootLogs(config.app.fastBoot)
  const fastMode = config.app.fastBoot
  
  // 动态速度配置（与主终端保持一致）
  const baseDelay = fastMode ? 5 : 30
  const minDelay = fastMode ? 3 : 15
  const maxDelay = fastMode ? 10 : 60

  for (const line of bootLogs) {
    term.writeln(line)
    if (!fastMode) {
      // 根据行内容计算延迟
      let delay = baseDelay
      
      // 空行快速滚动
      if (line.trim().length === 0) {
        delay = minDelay
      }
      
      // 包含重要信息的行显示更长时间
      if (line.includes('ONLINE') || line.includes('Security') || 
          line.includes('Established') || line.includes('ACTIVE') ||
          line.includes('COMPLETE') || line.includes('══════════')) {
        delay *= 1.3
      }
      
      // ASCII 框线框显示更长时间
      if (line.includes('═') || line.includes('█')) {
        delay *= 1.2
      }
      
      await new Promise(r => setTimeout(r, Math.min(delay, maxDelay)))
    }
  }
}

async function displayShutdownLog(): Promise<void> {
  const term = terminal.value
  if (!term) return

  const shutdownLogs = getShutdownLogs(config.app.fastBoot)
  const fastMode = config.app.fastBoot
  
  // 动态速度配置（与开机日志保持一致）
  const baseDelay = fastMode ? 5 : 30
  const minDelay = fastMode ? 3 : 15
  const maxDelay = fastMode ? 10 : 60

  for (const line of shutdownLogs) {
    term.writeln(line)
    if (!fastMode) {
      // 根据行内容计算延迟
      let delay = baseDelay
      
      // 空行快速滚动
      if (line.trim().length === 0) {
        delay = minDelay
      }
      
      // OK 状态显示更长时间
      if (line.includes('[  OK  ]')) {
        delay *= 1.2
      }
      
      // 系统停止信息显示更长时间
      if (line.includes('halted') || line.includes('SHUTDOWN') || line.includes('HALTED')) {
        delay *= 1.5
      }
      
      await new Promise(r => setTimeout(r, Math.min(delay, maxDelay)))
    }
  }
}

function displayStartupPrompt(): void {
  const term = terminal.value
  if (!term) return
  
  term.writeln('')
  term.writeln('\x1b[33mSystem is offline. Type "start" to boot.\x1b[0m')
  writePrompt()
}

function displayWelcomeMessage(): void {
  const term = terminal.value
  if (!term) return

  const isMobile = isMobileDevice()

  term.writeln('')
  term.writeln('\x1b[32m   _____ __________ \x1b[0m')
  term.writeln('\x1b[32m  / ___// ____/ __ \\\x1b[0m')
  term.writeln('\x1b[32m  \\__ \\/ /   / /_/ /\x1b[0m')
  term.writeln('\x1b[32m ___/ / /___/ ____/ \x1b[0m')
  term.writeln('\x1b[32m/____/\\____/_/      \x1b[0m')
  term.writeln('\x1b[32m                    \x1b[0m')
  term.writeln('\x1b[32m   Foundation Terminal System\x1b[0m')
  term.writeln('')

  if (isMobile) {
    // Mobile: shorter box to fit narrow terminals (~40 cols)
    term.writeln('\x1b[32m╔══════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[32m║\x1b[0m   \x1b[1;32mSCP Foundation Terminal\x1b[0m      \x1b[32m║\x1b[0m')
    term.writeln('\x1b[32m║\x1b[0m     \x1b[33mSecure. Contain. Protect.\x1b[0m      \x1b[32m║\x1b[0m')
    term.writeln('\x1b[32m╚══════════════════════════════════╝\x1b[0m')
  } else {
    // Desktop: full width box
    term.writeln('\x1b[32m╔══════════════════════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[32m║\x1b[0m          \x1b[1;32mSCP Foundation Terminal System\x1b[0m            \x1b[32m║\x1b[0m')
    term.writeln('\x1b[32m║\x1b[0m              \x1b[33mSecure. Contain. Protect.\x1b[0m              \x1b[32m║\x1b[0m')
    term.writeln('\x1b[32m╚══════════════════════════════════════════════════════════╝\x1b[0m')
  }

  term.writeln('')
  term.writeln('Type \x1b[1;33m"help"\x1b[0m to see available commands.')
  writePrompt()
}

// Setup global terminal controller for command handlers
function setupTerminalController(): void {
  window.__terminalController = {
    displayBootLog,
    displayShutdownLog,
    displayWelcomeMessage,
    displayStartupPrompt,
    clear: () => terminal.value?.clear(),
    markBootLogShown: () => systemStore.markBootLogShown(),
  }
}

function initTerminal(): void {
  if (!terminalRef.value) return

  // Use responsive font size for mobile
  const fontSize = getResponsiveFontSize()

  const term = new Terminal({
    cursorBlink: true,
    fontSize,
    fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
    lineHeight: 1.6,
    allowProposedApi: true,
    theme: getMobileTerminalTheme(),
    scrollback: 1000,
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.open(terminalRef.value)

  // Fit SYNCHRONOUSLY to avoid race condition with content writing
  fit.fit()

  terminal.value = term
  fitAddon.value = fit

  // Setup global terminal controller
  setupTerminalController()

  // Check if system is already running (from previous session)
  if (systemStore.isRunning) {
    // System was left running - skip startup prompt, show welcome directly
    term.writeln('')
    displayWelcomeMessage()
  } else {
    // First launch or system was shutdown - show startup prompt
    term.writeln('')
    displayStartupPrompt()
  }

  term.onData(handleInput)
}

function sendKey(key: string): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8)
  }
  terminal.value?.write(key)
  handleInput(key)
}

// Watch for theme changes
watch(() => themeStore.currentThemeId, () => {
  if (terminal.value) {
    terminal.value.options.theme = getMobileTerminalTheme()
    terminal.value.refresh(0, terminal.value.rows - 1)
  }
})

onMounted(() => {
  setTimeout(() => initTerminal(), 50)
})

onBeforeUnmount(() => {
  terminal.value?.dispose()
  terminal.value = null
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.mobile-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
}

.mobile-terminal__container {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.mobile-terminal__container :deep(.xterm) {
  height: 100%;
  padding: var(--gui-spacing-sm, 8px);
}

.mobile-terminal__container :deep(.xterm-viewport) {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
}

/* ── Virtual Keyboard (iOS Style) ───────────────────────────────────── */
.mobile-terminal__keyboard {
  padding: var(--gui-spacing-xs, 4px);
  padding-bottom: calc(var(--gui-spacing-xs, 4px) + env(safe-area-inset-bottom, 0px));
  background: var(--gui-glass-bg, rgba(16, 16, 16, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.08));
}

.mobile-terminal__kb-row {
  display: flex;
  gap: var(--gui-spacing-xxs, 4px);
  margin-bottom: var(--gui-spacing-xxs, 4px);
}

.mobile-terminal__kb-row:last-child {
  margin-bottom: 0;
}

.mobile-terminal__key {
  flex: 1;
  height: 40px;
  background: var(--gui-bg-surface-raised, #111111);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-sm, 6px);
  color: var(--gui-text-primary, #f0f0f0);
  font-family: var(--gui-font-mono, "JetBrains Mono", Consolas, monospace);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all var(--gui-transition-fast, 120ms ease);
  box-shadow: var(--gui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.3));
}

.mobile-terminal__key:active {
  background: var(--gui-bg-surface-active, #222222);
  transform: scale(0.95);
  box-shadow: none;
}
</style>

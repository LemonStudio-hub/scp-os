import { ref } from 'vue'
import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import type { TerminalInstance } from '../types/terminal'
import { createTerminalConfig, sleep, isMobileDevice } from '../utils/terminal'
import { ANSICode } from '../constants/theme'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'
import { useTerminalEmulator } from '../gui/composables/useTerminalEmulator'
import { getBootLogs, getShutdownLogs } from '../constants/bootLogs'
import { config } from '../config'
import { useTabsStore } from '../stores/tabs'
import { useSystemStore } from '../stores/system'

// Global terminal controller for command handlers
export interface TerminalController {
  displayBootLog: (fastMode?: boolean) => Promise<void>
  displayShutdownLog: (fastMode?: boolean) => Promise<void>
  displayWelcomeMessage: () => void
  displayStartupPrompt: () => void
  clear: () => void
  markBootLogShown: () => void
}

declare global {
  interface Window {
    __terminalController?: TerminalController
  }
}

// ASCII Art Constants - Desktop (Full width)
const SCP_LOGO_ART_DESKTOP = [
  '   _____ __________ ',
  '  / ___// ____/ __ \\',
  '  \\__ \\/ /   / /_/ /',
  ' ___/ / /___/ ____/ ',
  '/____/\\____/_/      ',
  '                    ',
  '    __________  __  ___   ______  ___  ______________  _   __',
  '   / ____/ __ \\/ / / / | / / __ \\/   |/_  __/  _/ __ \\/ | / /',
  '  / /_  / / / / / / /  |/ / / / / /| | / /  / // / / /  |/ / ',
  ' / __/ / /_/ / /_/ / /|  / /_/ / ___ |/ / _/ // /_/ / /|  /  ',
  '/_/    \\____/\\____/_/ |_/_____/_/  |_/_/ /___/\\____/_/ |_/   ',
  '                                                             ',
]

// ASCII Art Constants - Mobile (Compact)
const SCP_LOGO_ART_MOBILE = [
  '   _____ __________ ',
  '  / ___// ____/ __ \\',
  '  \\__ \\/ /   / /_/ /',
  ' ___/ / /___/ ____/ ',
  '/____/\\____/_/      ',
  '                    ',
  '    __________  __  ___   ______  ___',
  '   / ____/ __ \\/ / / / | / / __ \\/   |',
  '  / /_  / / / / / / /  |/ / / / / /| |',
  ' / __/ / /_/ / /_/ / /|  / /_/ / ___ |',
  '/_/    \\____/\\____/_/ |_/_____/_/  |_|',
  '                                         ',
]

// Border Styles - Desktop (Full width borders)
const BORDER_DESKTOP = {
  top: '═══════════════════════════════════════════════════════════════',
  left: '█',
  right: '█',
  bottom: '████████████████████████████████████████████████████████████████████████████████',
  fill: ' ',
}

// Border Styles - Mobile (Compact borders)
const BORDER_MOBILE = {
  top: '═════════════════════════════════════',
  left: '│',
  right: '│',
  bottom: '─────────────────────────────────────',
  fill: ' ',
}

export function useTerminal(container: Ref<HTMLElement | undefined>) {
  const terminalInstance = ref<TerminalInstance>({
    terminal: null,
    fitAddon: null,
  })

  const systemStore = useSystemStore()

  // Guard against duplicate event listener registration
  let commandHandlerSetup = false
  let resizeHandler: (() => void) | null = null

  // Unified input handling — shared with GUI terminal components
  const { inputBuffer, writePrompt, handleInput, navigateHistory, autocomplete, executeCommand } =
    useTerminalEmulator({
      getTerminal: () => terminalInstance.value.terminal,
      promptStyle: 'legacy',
    })

  const initTerminal = () => {
    try {
      const config = createTerminalConfig()
      terminalInstance.value.terminal = new Terminal(config)

      const fitAddon = new FitAddon()
      terminalInstance.value.terminal.loadAddon(fitAddon)
      terminalInstance.value.fitAddon = fitAddon

      if (container.value) {
        terminalInstance.value.terminal.open(container.value)
        fitAddon.fit()
        // Set global terminal instance for responsive formatting
        window.__terminalInstance = {
          cols: terminalInstance.value.terminal.cols,
          rows: terminalInstance.value.terminal.rows,
        }
        terminalInstance.value.terminal.focus()
      } else {
        throw new Error('Container element not found')
      }

      resizeHandler = () => {
        try {
          if (terminalInstance.value.fitAddon && terminalInstance.value.terminal) {
            terminalInstance.value.fitAddon.fit()
            // Update global terminal instance on resize
            window.__terminalInstance = {
              cols: terminalInstance.value.terminal.cols,
              rows: terminalInstance.value.terminal.rows,
            }
          }
        } catch (error) {
          errorHandler.handleError({
            type: ErrorType.SYSTEM_ERROR,
            severity: ErrorSeverity.LOW,
            message: 'Terminal resize failed',
            details: error instanceof Error ? error.message : String(error),
          })
        }
      }
      window.addEventListener('resize', resizeHandler)

      // Wire terminal writer into error handler so errors display in terminal
      errorHandler.setTerminalWriter((data: string) => {
        terminalInstance.value.terminal?.write(data)
      })

      // Initialize global terminal controller
      window.__terminalController = {
        displayBootLog: async (fastMode?: boolean) => {
          await displayBootLog(fastMode)
        },
        displayShutdownLog: async (fastMode?: boolean) => {
          await displayShutdownLog(fastMode)
        },
        displayWelcomeMessage: () => {
          displayWelcomeMessage()
        },
        displayStartupPrompt: () => {
          displayStartupPrompt()
        },
        clear: () => {
          clear()
        },
        markBootLogShown: () => {
          systemStore.markBootLogShown()
        },
      }
    } catch (error) {
      const errorObj = errorHandler.handleError({
        type: ErrorType.TERMINAL_INIT_FAILED,
        severity: ErrorSeverity.CRITICAL,
        message: 'Terminal initialization failed',
        details: error instanceof Error ? error.message : String(error),
        logToConsole: true,
      })
      throw errorObj
    }
  }

  const destroyTerminal = () => {
    try {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
      }
      if (terminalInstance.value.terminal) {
        terminalInstance.value.terminal.dispose()
        terminalInstance.value.terminal = null
      }
      // Reset the guard so listeners can be re-attached on re-init
      commandHandlerSetup = false
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_DISPOSE_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: 'Terminal disposal failed',
        details: error instanceof Error ? error.message : String(error),
        logToConsole: true,
      })
    }
  }

  const displayBootLog = async (fastMode: boolean = false) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_NOT_AVAILABLE,
        severity: ErrorSeverity.HIGH,
        message: 'Terminal not available, cannot display boot log',
      })
      return
    }

    const bootLogs = getBootLogs(fastMode || config.app.fastBoot)

    // Tuned for a slower, more cinematic boot animation
    const baseDelay = fastMode || config.app.fastBoot ? 5 : 30
    const speedDecay = fastMode || config.app.fastBoot ? 0.98 : 0.98 // Multiplier applied each line to gradually speed up
    const minDelay = fastMode || config.app.fastBoot ? 3 : 15 // Floor to prevent instant playback
    const maxDelay = fastMode || config.app.fastBoot ? 10 : 60 // Cap to prevent excessively long pauses

    let currentSpeedMultiplier = 1.0

    for (const line of bootLogs) {
      try {
        terminal.writeln(line)

        // Calculate dynamic delay based on multiple factors
        let dynamicDelay = baseDelay

        // 1. Longer lines take more time to read
        const lineLength = line.replace(/\x1b\[[0-9;]*m/g, '').length // Strip ANSI codes for accurate length
        const lengthMultiplier = Math.min(Math.max(lineLength / 50, 0.8), 1.5)

        // 2. Empty lines scroll quickly
        const isEmptyLine = line.trim().length === 0
        if (isEmptyLine) {
          dynamicDelay = minDelay
        }

        // 3. Important status lines linger longer so users can read them
        const hasImportantInfo =
          line.includes('ONLINE') ||
          line.includes('Security') ||
          line.includes('Established') ||
          line.includes('ACTIVE') ||
          line.includes('COMPLETE') ||
          line.includes('══════════')
        if (hasImportantInfo) {
          dynamicDelay *= 1.3
        }

        // 4. ASCII art borders get a slight extra pause
        const isBoxArt = line.includes('═') || line.includes('█')
        if (isBoxArt) {
          dynamicDelay *= 1.2
        }

        // 5. Apply length multiplier
        if (!isEmptyLine) {
          dynamicDelay *= lengthMultiplier
        }

        // 6. Apply progressive speed multiplier (boot accelerates over time)
        dynamicDelay *= currentSpeedMultiplier

        // 7. Clamp delay to configured bounds
        dynamicDelay = Math.max(minDelay, Math.min(maxDelay, dynamicDelay))

        // 8. Add jitter to avoid a mechanical, metronome-like feel
        if (!fastMode) {
          dynamicDelay *= 0.9 + Math.random() * 0.2 // +/-10% random variation
        }

        await sleep(Math.round(dynamicDelay))

        // Decay the speed multiplier so later lines display faster
        if (!fastMode) {
          currentSpeedMultiplier *= speedDecay
          currentSpeedMultiplier = Math.max(0.5, currentSpeedMultiplier) // Cap at 2x speedup
        }
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.LOW,
          message: 'Boot log output failed',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    }

    try {
      // Final pause so users can read the last boot message
      await sleep(fastMode || config.app.fastBoot ? 100 : 500)
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Boot delay failed',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Display startup prompt for first-time users
   */
  const displayStartupPrompt = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    terminal.writeln(`${ANSICode.yellow}SCP Foundation Operating System${ANSICode.reset}`)
    terminal.writeln('')
    terminal.writeln(`${ANSICode.cyan}Type 'start' to boot the system${ANSICode.reset}`)
    terminal.writeln('')
    writePrompt()
  }

  /**
   * Display shutdown log
   */
  const displayShutdownLog = async (fastMode: boolean = false) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_NOT_AVAILABLE,
        severity: ErrorSeverity.HIGH,
        message: 'Terminal not available, cannot display shutdown log',
      })
      return
    }

    const shutdownLogs = getShutdownLogs(fastMode || config.app.fastBoot)

    // Dynamic speed configuration
    const baseDelay = fastMode || config.app.fastBoot ? 50 : 150
    const speedDecay = fastMode || config.app.fastBoot ? 0.98 : 0.97
    const minDelay = fastMode || config.app.fastBoot ? 20 : 50
    const maxDelay = fastMode || config.app.fastBoot ? 100 : 300

    let currentSpeedMultiplier = 1.0

    for (const line of shutdownLogs) {
      try {
        terminal.writeln(line)

        // Calculate dynamic delay
        let dynamicDelay = baseDelay

        // Adjust based on line length
        const lineLength = line.replace(/\x1b\[[0-9;]*m/g, '').length
        const lengthMultiplier = Math.min(Math.max(lineLength / 50, 0.8), 1.5)

        // Adjust based on empty lines
        const isEmptyLine = line.trim().length === 0
        if (isEmptyLine) {
          dynamicDelay = minDelay
        }

        // Adjust based on important info
        const hasImportantInfo =
          line.includes('[  OK  ]') || line.includes('[FAILED]') || line.includes('System halted')
        if (hasImportantInfo) {
          dynamicDelay *= 1.2
        }

        // Apply length multiplier
        if (!isEmptyLine) {
          dynamicDelay *= lengthMultiplier
        }

        // Apply current speed multiplier
        dynamicDelay *= currentSpeedMultiplier

        // Ensure delay is within reasonable range
        dynamicDelay = Math.max(minDelay, Math.min(maxDelay, dynamicDelay))

        // Apply random variation
        if (!fastMode) {
          dynamicDelay *= 0.9 + Math.random() * 0.2
        }

        await sleep(Math.round(dynamicDelay))

        // Update speed multiplier
        if (!fastMode) {
          currentSpeedMultiplier *= speedDecay
          currentSpeedMultiplier = Math.max(0.5, currentSpeedMultiplier)
        }
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.LOW,
          message: 'Shutdown log output failed',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    }

    try {
      await sleep(fastMode || config.app.fastBoot ? 200 : 500)
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Shutdown delay failed',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Restart the system
   */
  const restartSystem = async () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    terminal.writeln(`${ANSICode.yellow}Restarting system...${ANSICode.reset}`)
    await sleep(500)

    clear()

    // Reset first launch flag to show boot log again
    systemStore.markSystemRunning()

    // Display boot log and welcome message
    await displayBootLog()
    displayWelcomeMessage()
  }

  /**
   * Shutdown the system
   */
  const shutdownSystem = async (confirmed: boolean = false) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    if (!confirmed) {
      terminal.writeln(
        `${ANSICode.yellow}Are you sure you want to shutdown? (yes/no)${ANSICode.reset}`
      )
      return
    }

    terminal.writeln(`${ANSICode.yellow}Shutting down system...${ANSICode.reset}`)
    await sleep(500)

    // Clear all tabs
    const tabsStore = useTabsStore()
    tabsStore.clearAllTabs()

    // Mark system as shutdown
    systemStore.markSystemShutdown()

    terminal.writeln(`${ANSICode.red}System shutdown complete.${ANSICode.reset}`)
    terminal.writeln('')
    terminal.writeln(`${ANSICode.green}Type 'start' to boot the system again.${ANSICode.reset}`)
    terminal.writeln('')

    // Clear the terminal
    clear()

    // Display startup prompt again
    displayStartupPrompt()
  }

  const displayWelcomeMessage = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    const isMobile = isMobileDevice()
    const border = isMobile ? BORDER_MOBILE : BORDER_DESKTOP
    const logoArt = isMobile ? SCP_LOGO_ART_MOBILE : SCP_LOGO_ART_DESKTOP

    const lines: string[] = []

    // Top border
    lines.push(`${ANSICode.green}${border.top}${ANSICode.reset}`)

    // Add ASCII art logo
    logoArt.forEach((line) => {
      lines.push(`${ANSICode.red}${line}${ANSICode.reset}`)
    })

    // Bottom border
    lines.push(`${ANSICode.green}${border.top}${ANSICode.reset}`)
    lines.push('')

    if (isMobile) {
      // Mobile version - Compact layout
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} System Info${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Ver: ${config.app.version} | Security: 4${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Site-19 | AES-256-GCM${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Status: Online${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push('')
    } else {
      // Desktop version - Full width layout
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset}                        System Information                        ${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Version: ${config.app.version}                         Security Level: 4         ${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Location: Site-19 Main Server          Encryption: AES-256-GCM  ${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(
        `${ANSICode.green}${border.left}${ANSICode.reset} Status: Online                           Last Update: 2026-04-01 ${ANSICode.green}${border.right}${ANSICode.reset}`
      )
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push('')
    }

    lines.push(`${ANSICode.green}Type "help" to see available commands${ANSICode.reset}`)
    lines.push('')

    lines.forEach((line) => terminal.writeln(line))
    writePrompt()

    // Mark system as running after welcome message
    systemStore.markSystemRunning()
  }

  // System-state guard: only 'start' is allowed when the system is offline
  const processCommand = async (command: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_NOT_AVAILABLE,
        severity: ErrorSeverity.HIGH,
        message: 'Terminal not available, cannot execute command',
        details: `Attempted command: ${command}`,
      })
      return
    }

    const cmd = command.toLowerCase().trim().split(/\s+/)[0]

    if (!systemStore.isRunning && cmd !== 'start') {
      terminal.writeln(
        `${ANSICode.yellow}[!] System is offline. Please boot the system first.${ANSICode.reset}`
      )
      terminal.writeln('')
      terminal.writeln(`${ANSICode.gray}Usage: Type "start" to boot the system.${ANSICode.reset}`)
      terminal.writeln(
        `${ANSICode.gray}       Type "help" after booting to see available commands.${ANSICode.reset}`
      )
      terminal.writeln('')
      return
    }

    await executeCommand(command)
  }

  const setupCommandHandler = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    // Prevent duplicate event listener binding
    if (commandHandlerSetup) {
      return
    }
    commandHandlerSetup = true

    terminal.onData((data) => {
      if (data === '\r') {
        // Enter — execute with system-state guard, then write prompt
        terminal.write('\r\n')
        processCommand(inputBuffer.value).then(() => writePrompt())
      } else {
        // Delegate all other input to the unified handler
        handleInput(data)
      }
    })
  }

  const focus = () => {
    terminalInstance.value.terminal?.focus()
  }

  const clear = () => {
    terminalInstance.value.terminal?.clear()
  }

  const getTerminal = () => {
    return terminalInstance.value.terminal
  }

  const sendKey = (key: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return
    terminal.write(key)
  }

  const sendText = (text: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return
    terminal.write(text)
  }

  return {
    terminalInstance,
    inputBuffer,
    initTerminal,
    destroyTerminal,
    displayBootLog,
    displayWelcomeMessage,
    displayStartupPrompt,
    restartSystem,
    shutdownSystem,
    setupCommandHandler,
    focus,
    clear,
    navigateHistory,
    autocomplete,
    getTerminal,
    sendKey,
    sendText,
    isFirstLaunch: () => systemStore.isFirstLaunch,
    markSystemLaunched: () => systemStore.markSystemLaunched(),
    isSystemRunning: () => systemStore.isRunning,
    markSystemRunning: () => systemStore.markSystemRunning(),
    markSystemShutdown: () => systemStore.markSystemShutdown(),
    resetFirstLaunch: () => systemStore.resetFirstLaunch(),
    hasBootLogBeenShown: () => systemStore.bootLogShown,
    resetBootLogShown: () => systemStore.resetBootLogShown(),
  }
}

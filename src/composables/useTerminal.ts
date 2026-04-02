import { ref } from 'vue'
import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import type { TerminalInstance } from '../types/terminal'
import { createTerminalConfig, sleep, isPrintableCharacter, isMobileDevice } from '../utils/terminal'
import { AVAILABLE_COMMANDS } from '../constants/commands'
import { ANSICode } from '../constants/theme'
import { getCommandHandler } from '../commands'
import { useCommandHistory } from './useCommandHistory'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'
import { getBootLogs } from '../constants/bootLogs'
import { config } from '../config'
import { useTabsStore } from '../stores/tabs'

// Local storage key for first launch detection
const FIRST_LAUNCH_KEY = 'scp-os-first-launch'
const SYSTEM_STATUS_KEY = 'scp-os-system-status'

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
  fill: ' '
}

// Border Styles - Mobile (Compact borders)
const BORDER_MOBILE = {
  top: '═════════════════════════════════════',
  left: '│',
  right: '│',
  bottom: '─────────────────────────────────────',
  fill: ' '
}

/**
 * Check if this is the first launch of the system
 */
function isFirstLaunch(): boolean {
  return localStorage.getItem(FIRST_LAUNCH_KEY) === null
}

/**
 * Mark system as launched
 */
function markSystemLaunched(): void {
  localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
}

/**
 * Check if system is running
 */
function isSystemRunning(): boolean {
  return localStorage.getItem(SYSTEM_STATUS_KEY) === 'running'
}

/**
 * Mark system as running
 */
function markSystemRunning(): void {
  localStorage.setItem(SYSTEM_STATUS_KEY, 'running')
}

/**
 * Mark system as shutdown
 */
function markSystemShutdown(): void {
  localStorage.setItem(SYSTEM_STATUS_KEY, 'shutdown')
}

/**
 * Reset first launch flag (for restart)
 */
function resetFirstLaunch(): void {
  localStorage.removeItem(FIRST_LAUNCH_KEY)
}

export function useTerminal(container: Ref<HTMLElement | undefined>) {
  const terminalInstance = ref<TerminalInstance>({
    terminal: null,
    fitAddon: null
  })

  const { addToHistory, navigateHistory: navHistory, resetIndex } = useCommandHistory()
  const currentInput = ref('')

  // 标记：防止重复绑定事件监听器
  let commandHandlerSetup = false

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
        terminalInstance.value.terminal.focus()
      } else {
        throw new Error('容器元素未找到')
      }

      window.addEventListener('resize', () => {
        try {
          if (terminalInstance.value.fitAddon && terminalInstance.value.terminal) {
            terminalInstance.value.fitAddon.fit()
          }
        } catch (error) {
          errorHandler.handleError({
            type: ErrorType.SYSTEM_ERROR,
            severity: ErrorSeverity.LOW,
            message: '终端调整大小失败',
            details: error instanceof Error ? error.message : String(error),
          })
        }
      })

      // 设置终端写入器到错误处理器
      errorHandler.setTerminalWriter((data: string) => {
        terminalInstance.value.terminal?.write(data)
      })
    } catch (error) {
      const errorObj = errorHandler.handleError({
        type: ErrorType.TERMINAL_INIT_FAILED,
        severity: ErrorSeverity.CRITICAL,
        message: '终端初始化失败',
        details: error instanceof Error ? error.message : String(error),
        logToConsole: true,
      })
      throw errorObj
    }
  }

  const destroyTerminal = () => {
    try {
      if (terminalInstance.value.terminal) {
        terminalInstance.value.terminal.dispose()
        terminalInstance.value.terminal = null
      }
      // 重置事件监听器标志
      commandHandlerSetup = false
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_DISPOSE_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: '终端销毁失败',
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
    
    // 动态速度配置
    const baseDelay = fastMode || config.app.fastBoot ? 1 : 15
    const speedDecay = fastMode || config.app.fastBoot ? 0.98 : 0.97  // 速度衰减因子
    const minDelay = fastMode || config.app.fastBoot ? 1 : 5    // 最小延迟
    const maxDelay = fastMode || config.app.fastBoot ? 5 : 30   // 最大延迟
    
    let currentSpeedMultiplier = 1.0

    for (const line of bootLogs) {
      try {
        terminal.writeln(line)
        
        // 计算动态延迟
        let dynamicDelay = baseDelay
        
        // 1. 根据行长度调整（更长的行需要更长时间阅读）
        const lineLength = line.replace(/\x1b\[[0-9;]*m/g, '').length  // 移除 ANSI 颜色代码
        const lengthMultiplier = Math.min(Math.max(lineLength / 50, 0.8), 1.5)
        
        // 2. 根据是否为空行调整（空行快速滚动）
        const isEmptyLine = line.trim().length === 0
        if (isEmptyLine) {
          dynamicDelay = minDelay
        }
        
        // 3. 根据是否包含重要信息调整（颜色代码、系统状态等）
        const hasImportantInfo = line.includes('ONLINE') || 
                                line.includes('Security') ||
                                line.includes('Established') ||
                                line.includes('ACTIVE') ||
                                line.includes('COMPLETE') ||
                                line.includes('══════════')
        if (hasImportantInfo) {
          dynamicDelay *= 1.3  // 重要信息显示更长时间
        }
        
        // 4. 根据是否为ASCII艺术框调整
        const isBoxArt = line.includes('═') || line.includes('█')
        if (isBoxArt) {
          dynamicDelay *= 1.2
        }
        
        // 5. 应用长度倍数
        if (!isEmptyLine) {
          dynamicDelay *= lengthMultiplier
        }
        
        // 6. 应用当前速度倍数（逐渐加快）
        dynamicDelay *= currentSpeedMultiplier
        
        // 7. 确保延迟在合理范围内
        dynamicDelay = Math.max(minDelay, Math.min(maxDelay, dynamicDelay))
        
        // 8. 应用随机变化（避免过于机械）
        if (!fastMode) {
          dynamicDelay *= (0.9 + Math.random() * 0.2)  // ±10% 的随机变化
        }
        
        await sleep(Math.round(dynamicDelay))
        
        // 更新速度倍数（逐渐加快）
        if (!fastMode) {
          currentSpeedMultiplier *= speedDecay
          currentSpeedMultiplier = Math.max(0.5, currentSpeedMultiplier)  // 最多加快到2倍
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
      // 最终延迟（让用户有时间阅读最后的信息）
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

    const lines: string[] = []

    lines.push(`${ANSICode.green}${BORDER_MOBILE.top}${ANSICode.reset}`)
    lines.push('')
    lines.push(`${ANSICode.red}    _____ __________ ${ANSICode.reset}`)
    lines.push(`${ANSICode.red}   / ___// ____/ __ \\${ANSICode.reset}`)
    lines.push(`${ANSICode.red}   \\__ \\/ /   / /_/ /${ANSICode.reset}`)
    lines.push(`${ANSICode.red}  ___/ / /___/ ____/ ${ANSICode.reset}`)
    lines.push(`${ANSICode.red} /____/\\____/_/      ${ANSICode.reset}`)
    lines.push('')
    lines.push(`${ANSICode.green}${BORDER_MOBILE.top}${ANSICode.reset}`)
    lines.push('')
    lines.push(`${ANSICode.yellow}Welcome to SCP Foundation Terminal System${ANSICode.reset}`)
    lines.push('')
    lines.push(`${ANSICode.cyan}To start the system, type: ${ANSICode.bold}start${ANSICode.reset}`)
    lines.push('')
    lines.push(`${ANSICode.gray}Security Level: 4 | Version: ${config.app.version}${ANSICode.reset}`)
    lines.push('')

    lines.forEach(line => terminal.writeln(line))
    writePrompt()
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
    markSystemRunning()
    
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
      terminal.writeln(`${ANSICode.yellow}Are you sure you want to shutdown? (yes/no)${ANSICode.reset}`)
      return
    }

    terminal.writeln(`${ANSICode.yellow}Shutting down system...${ANSICode.reset}`)
    await sleep(500)
    
    // Clear all tabs
    const tabsStore = useTabsStore()
    tabsStore.clearAllTabs()
    
    // Mark system as shutdown
    markSystemShutdown()
    
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
    logoArt.forEach(line => {
      lines.push(`${ANSICode.red}${line}${ANSICode.reset}`)
    })

    // Bottom border
    lines.push(`${ANSICode.green}${border.top}${ANSICode.reset}`)
    lines.push('')

    if (isMobile) {
      // Mobile version - Compact layout
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} System Info${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Ver: ${config.app.version} | Security: 4${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Site-19 | AES-256-GCM${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Status: Online${ANSICode.reset}${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push('')
    } else {
      // Desktop version - Full width layout
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset}                        System Information                        ${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Version: ${config.app.version}                         Security Level: 4         ${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Location: Site-19 Main Server          Encryption: AES-256-GCM  ${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.left}${ANSICode.reset} Status: Online                           Last Update: 2026-04-01 ${ANSICode.green}${border.right}${ANSICode.reset}`)
      lines.push(`${ANSICode.green}${border.bottom}${ANSICode.reset}`)
      lines.push('')
    }

    lines.push(`${ANSICode.green}Type "help" to see available commands${ANSICode.reset}`)
    lines.push('')

    lines.forEach(line => terminal.writeln(line))
    writePrompt()
    
    // Mark system as running after welcome message
    markSystemRunning()
  }

  const writePrompt = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return
    terminal.write(`${ANSICode.red}SCP-ROOT>${ANSICode.reset} `)
  }

  const replaceCurrentLine = (newInput: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return
    terminal.write('\r\x1b[K')
    writePrompt()
    terminal.write(newInput)
    currentInput.value = newInput
  }

  const navigateHistory = (direction: number) => {
    navHistory(direction, (command) => {
      replaceCurrentLine(command)
    })
  }

  const autocomplete = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal || currentInput.value.trim() === '') return

    const matches = AVAILABLE_COMMANDS.filter(cmd =>
      cmd.startsWith(currentInput.value.toLowerCase())
    )

    if (matches.length === 1) {
      const autoComplete = matches[0].slice(currentInput.value.length)
      currentInput.value = matches[0]
      terminal.write(autoComplete)
    } else if (matches.length > 1) {
      terminal.writeln('\r\n')
      terminal.writeln(`${ANSICode.cyan}可能的命令: ${matches.join(', ')}${ANSICode.reset}`)
      writePrompt()
      terminal.write(currentInput.value)
    }
  }

  const executeCommand = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    const command = currentInput.value.trim()
    if (!command) {
      writePrompt()
      return
    }

    addToHistory(command)
    resetIndex()
    currentInput.value = ''

    processCommand(command)
    writePrompt()
  }

  // 辅助函数：安全的终端写入
  const safeTerminalWrite = (data: string, isWriteln = false) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    try {
      if (isWriteln) {
        terminal.writeln(data)
      } else {
        terminal.write(data)
      }
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_WRITE_FAILED,
        severity: ErrorSeverity.LOW,
        message: '终端写入失败',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // 辅助函数：执行命令处理器（带错误处理）
  const executeCommandHandler = (handler: any, args: string[], cmd: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    try {
      handler(
        args,
        (data: string) => safeTerminalWrite(data, false),
        (data: string) => safeTerminalWrite(data, true)
      )
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.COMMAND_EXECUTION_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: `命令执行失败: ${cmd}`,
        details: error instanceof Error ? error.message : String(error),
        logToConsole: true,
      })
      terminal.writeln(`${ANSICode.red}命令执行失败: ${cmd}${ANSICode.reset}`)
      terminal.writeln(`${ANSICode.yellow}详情: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`)
    }
  }

  const processCommand = (command: string) => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_NOT_AVAILABLE,
        severity: ErrorSeverity.HIGH,
        message: '终端不可用，无法执行命令',
        details: `尝试执行的命令: ${command}`,
      })
      return
    }

    try {
      const [cmd, ...args] = command.toLowerCase().split(' ')
      const handler = getCommandHandler(cmd as any)

      if (handler) {
        executeCommandHandler(handler, args, cmd)
      } else {
        terminal.writeln(`${ANSICode.red}未知命令: ${cmd}. 输入 "help" 查看可用命令.${ANSICode.reset}`)
      }
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.COMMAND_PARSING_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: '命令解析失败',
        details: error instanceof Error ? error.message : String(error),
        logToConsole: true,
      })
      terminal.writeln(`${ANSICode.red}命令解析失败${ANSICode.reset}`)
    }
  }

  const setupCommandHandler = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    // 防止重复绑定事件监听器
    if (commandHandlerSetup) {
      return
    }
    commandHandlerSetup = true

    terminal.onData((data) => {
      if (data === '\r') { // Enter
        terminal.write('\r\n')
        executeCommand()
      } else if (data === '\x1b[A') { // Arrow Up
        navigateHistory(-1)
      } else if (data === '\x1b[B') { // Arrow Down
        navigateHistory(1)
      } else if (data === '\t') { // Tab
        autocomplete()
      } else if (data === '\x7f') { // Backspace
        if (currentInput.value.length > 0) {
          currentInput.value = currentInput.value.slice(0, -1)
          terminal.write('\b \b')
        }
      } else if (data === '\x03') { // Ctrl+C
        terminal.write('^C\r\n')
        currentInput.value = ''
        writePrompt()
      } else if (isPrintableCharacter(data)) {
        currentInput.value += data
        terminal.write(data)
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
    currentInput,
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
    isFirstLaunch,
    markSystemLaunched,
    isSystemRunning,
    markSystemRunning,
    markSystemShutdown,
    resetFirstLaunch
  }
}
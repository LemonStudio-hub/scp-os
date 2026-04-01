import { ref } from 'vue'
import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import type { TerminalInstance } from '../types/terminal'
import { createTerminalConfig, sleep, randomDelay, isPrintableCharacter } from '../utils/terminal'
import { AVAILABLE_COMMANDS } from '../constants/commands'
import { ANSICode } from '../constants/theme'
import { getCommandHandler } from '../commands'
import { useCommandHistory } from './useCommandHistory'
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'
import { BOOT_LOGS } from '../constants/bootLogs'

// ASCII Art Constants
const SCP_LOGO_ART = [
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

export function useTerminal(container: Ref<HTMLElement | undefined>) {
  const terminalInstance = ref<TerminalInstance>({
    terminal: null,
    fitAddon: null,
    hammer: null
  })

  const { addToHistory, navigateHistory: navHistory, resetIndex } = useCommandHistory()
  const currentInput = ref('')

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
      if (terminalInstance.value.hammer) {
        terminalInstance.value.hammer.destroy()
        terminalInstance.value.hammer = null
      }
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

  const displayBootLog = async () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) {
      errorHandler.handleError({
        type: ErrorType.TERMINAL_NOT_AVAILABLE,
        severity: ErrorSeverity.HIGH,
        message: '终端不可用，无法显示启动日志',
      })
      return
    }

    for (const line of BOOT_LOGS) {
      try {
        terminal.writeln(line)
        await sleep(randomDelay(10, 30))
      } catch (error) {
        errorHandler.handleError({
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.LOW,
          message: '启动日志输出失败',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    }
    
    try {
      await sleep(300)
    } catch (error) {
      errorHandler.handleError({
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.LOW,
        message: '启动延迟失败',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const displayWelcomeMessage = () => {
    const terminal = terminalInstance.value.terminal
    if (!terminal) return

    const lines = [
      `${ANSICode.green}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
    ]

    // Add ASCII art logo
    SCP_LOGO_ART.forEach(line => {
      lines.push(`${ANSICode.red}${line}${ANSICode.reset}`)
    })

    lines.push(
      `${ANSICode.green}═══════════════════════════════════════════════════════════════${ANSICode.reset}`,
      '',
      `${ANSICode.green}████████████████████████████████████████████████████████████████████████████████${ANSICode.reset}`,
      `${ANSICode.green}█${ANSICode.reset}                        系统信息                                ${ANSICode.green}█${ANSICode.reset}`,
      `${ANSICode.green}████████████████████████████████████████████████████████████████████████████████${ANSICode.reset}`,
      `${ANSICode.green}█${ANSICode.reset} 版本: 3.0.2                           安全级别: 4级          ${ANSICode.green}█${ANSICode.reset}`,
      `${ANSICode.green}█${ANSICode.reset} 位置: Site-19 主服务器                 加密: AES-256-GCM     ${ANSICode.green}█${ANSICode.reset}`,
      `${ANSICode.green}█${ANSICode.reset} 状态: 在线                            最后更新: 2026-04-01  ${ANSICode.green}█${ANSICode.reset}`,
      `${ANSICode.green}████████████████████████████████████████████████████████████████████████████████${ANSICode.reset}`,
      '',
      `${ANSICode.green}输入 "help" 查看可用命令${ANSICode.reset}`,
      ''
    )

    lines.forEach(line => terminal.writeln(line))
    writePrompt()
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
        try {
          handler(args, (data: string) => {
            try {
              terminal.write(data)
            } catch (error) {
              errorHandler.handleError({
                type: ErrorType.TERMINAL_WRITE_FAILED,
                severity: ErrorSeverity.LOW,
                message: '终端写入失败',
                details: error instanceof Error ? error.message : String(error),
              })
            }
          }, (data: string) => {
            try {
              terminal.writeln(data)
            } catch (error) {
              errorHandler.handleError({
                type: ErrorType.TERMINAL_WRITE_FAILED,
                severity: ErrorSeverity.LOW,
                message: '终端写入失败',
                details: error instanceof Error ? error.message : String(error),
              })
            }
          })
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

  return {
    terminalInstance,
    currentInput,
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
  }
}
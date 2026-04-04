/**
 * useTerminalEmulator — Shared terminal input handling
 * Extracts the common handleInput/executeCommand/writePrompt logic
 * used by both TerminalPanel.vue and MobileTerminal.vue.
 */

import { ref } from 'vue'
import type { Terminal } from 'xterm'
import { commandHandlers } from '../../commands/index'
import { ANSICode } from '../../constants/theme'

export interface UseTerminalEmulatorOptions {
  /** Callback to get the active terminal instance */
  getTerminal: () => Terminal | null
}

export function useTerminalEmulator(options: UseTerminalEmulatorOptions) {
  const { getTerminal } = options

  const inputBuffer = ref('')

  /**
   * Write the command prompt to the terminal.
   */
  function writePrompt(): void {
    const terminal = getTerminal()
    if (!terminal) return

    terminal.write(
      `\r\n${ANSICode.red}scp@foundation${ANSICode.reset}:${ANSICode.cyan}~${ANSICode.reset}$ `
    )
    inputBuffer.value = ''
  }

  /**
   * Execute a command string through the command handler system.
   */
  async function executeCommand(cmd: string): Promise<void> {
    const terminal = getTerminal()
    if (!terminal) return

    if (!cmd.trim()) {
      writePrompt()
      return
    }

    const [command, ...args] = cmd.trim().split(/\s+/)
    const handler = commandHandlers[command as keyof typeof commandHandlers]

    if (handler) {
      try {
        await handler(
          args,
          (data: string) => terminal.write(data),
          (data: string) => terminal.writeln(data)
        )
      } catch (error) {
        terminal.writeln(
          `${ANSICode.red}Error: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`
        )
      }
    } else {
      terminal.writeln(
        `${ANSICode.yellow}Command not found: ${command}${ANSICode.reset}`
      )
    }

    writePrompt()
  }

  /**
   * Process a single character or escape sequence from the terminal.
   * This is the main input handler that should be connected to terminal.onData().
   */
  function handleInput(data: string): void {
    const terminal = getTerminal()
    if (!terminal) return

    if (data === '\r') {
      // Enter — execute command
      terminal.writeln('')
      executeCommand(inputBuffer.value)
    } else if (data === '\x7f' || data === '\b') {
      // Backspace
      if (inputBuffer.value.length > 0) {
        inputBuffer.value = inputBuffer.value.slice(0, -1)
        terminal.write('\b \b')
      }
    } else if (data === '\x03') {
      // Ctrl+C — cancel current input
      terminal.writeln('^C')
      writePrompt()
    } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
      // Printable character
      inputBuffer.value += data
      terminal.write(data)
    }
    // Arrow keys, tab, escape are handled by xterm bindings or key event
  }

  /**
   * Clear the terminal and write a fresh prompt.
   */
  function clearAndPrompt(): void {
    const terminal = getTerminal()
    if (!terminal) return
    terminal.clear()
    writePrompt()
  }

  return {
    inputBuffer,
    writePrompt,
    executeCommand,
    handleInput,
    clearAndPrompt,
  }
}

/**
 * useTerminalEmulator — Shared terminal input handling
 *
 * Single source of truth for terminal input logic used by all three
 * terminal components (SCPTerminal, TerminalPanel, MobileTerminal).
 * Provides command history (arrow keys), tab autocomplete, command
 * highlighting, and configurable prompt styling.
 */

import { ref } from 'vue'
import type { Terminal } from 'xterm'
import { commandHandlers } from '../../commands/index'
import { AVAILABLE_COMMANDS } from '../../constants/commands'
import { ANSICode } from '../../constants/theme'
import { useCommandHistory } from '../../composables/useCommandHistory'
import { autocompleteService } from '../../utils/commandAutocomplete'

export interface UseTerminalEmulatorOptions {
  /** Callback to get the active terminal instance */
  getTerminal: () => Terminal | null
  t?: (key: string, params?: Record<string, string | number>) => string
  /** Prompt style: 'scp' for bash-like, 'legacy' for SCP-ROOT> */
  promptStyle?: 'scp' | 'legacy'
}

export function useTerminalEmulator(options: UseTerminalEmulatorOptions) {
  const { getTerminal, t, promptStyle = 'scp' } = options

  const _t = t || ((key: string) => key)

  function translate(key: string, params?: Record<string, string | number>): string {
    const result = _t(key, params)
    if (result !== key) return result
    const fallbacks: Record<string, string> = {
      'terminal.errorPrefix': '错误',
      'terminal.commandNotFound': '未找到命令',
    }
    let str = fallbacks[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
  }

  // ── State ──────────────────────────────────────────────────────────
  const inputBuffer = ref('')
  const { addToHistory, navigateHistory: navHistory, resetIndex } = useCommandHistory()

  // Autocomplete cycling state
  const autocompleteSuggestions = ref<string[]>([])
  const autocompleteIndex = ref(0)

  // ── Prompt ─────────────────────────────────────────────────────────
  function writePrompt(): void {
    const terminal = getTerminal()
    if (!terminal) return

    if (promptStyle === 'legacy') {
      terminal.write(`${ANSICode.prompt}SCP-ROOT>${ANSICode.reset} `)
    } else {
      terminal.write(
        `\r\n${ANSICode.red}scp@foundation${ANSICode.reset}:${ANSICode.cyan}~${ANSICode.reset}$ `
      )
    }
    inputBuffer.value = ''
  }

  // ── Line Rendering ─────────────────────────────────────────────────
  function replaceCurrentLine(newInput: string): void {
    const terminal = getTerminal()
    if (!terminal) return

    terminal.write('\r\x1b[K') // carriage return + erase to end of line

    if (promptStyle === 'legacy') {
      terminal.write(`${ANSICode.prompt}SCP-ROOT>${ANSICode.reset} `)
    } else {
      terminal.write(
        `${ANSICode.red}scp@foundation${ANSICode.reset}:${ANSICode.cyan}~${ANSICode.reset}$ `
      )
    }

    // Highlight recognized commands in green
    const inputLower = newInput.toLowerCase().trim()
    const isCommand = AVAILABLE_COMMANDS.some((cmd) => cmd === inputLower)

    if (isCommand && newInput.trim() !== '') {
      terminal.write(`${ANSICode.command}${newInput}${ANSICode.reset}`)
    } else {
      terminal.write(newInput)
    }

    inputBuffer.value = newInput

    // Invalidate stale autocomplete suggestions when input changes
    if (autocompleteSuggestions.value.length > 0) {
      const lastSuggestion = autocompleteSuggestions.value[autocompleteIndex.value]
      if (newInput !== lastSuggestion) {
        autocompleteSuggestions.value = []
        autocompleteIndex.value = 0
      }
    }
  }

  // ── Command History ────────────────────────────────────────────────
  function navigateHistory(direction: number): void {
    navHistory(direction, (command) => {
      inputBuffer.value = command
      replaceCurrentLine(command)
    })
  }

  // ── Tab Autocomplete ──────────────────────────────────────────────
  function autocomplete(): void {
    const terminal = getTerminal()
    if (!terminal || inputBuffer.value.trim() === '') return

    const suggestions = autocompleteService.getSuggestions(inputBuffer.value)

    if (suggestions.length === 0) return

    if (suggestions.length === 1) {
      // Single match: apply immediately
      const suggestion = suggestions[0]
      inputBuffer.value = suggestion.text
      replaceCurrentLine(inputBuffer.value)
      autocompleteService.recordChoice(inputBuffer.value, suggestion.text)
      autocompleteSuggestions.value = []
      autocompleteIndex.value = 0
    } else {
      // Multiple matches: show list or cycle
      if (autocompleteSuggestions.value.length > 0) {
        autocompleteIndex.value = autocompleteService.cycleSuggestions(
          suggestions,
          autocompleteIndex.value
        )
        const selected = autocompleteService.getSuggestionAt(suggestions, autocompleteIndex.value)
        if (selected) {
          inputBuffer.value = selected
          replaceCurrentLine(inputBuffer.value)
        }
      } else {
        // First tab press: show suggestion list
        const formatted = autocompleteService.formatSuggestions(suggestions)
        terminal.writeln('\r\n')
        formatted.forEach((line) => terminal.writeln(line))
        writePrompt()
        replaceCurrentLine(inputBuffer.value)
        autocompleteSuggestions.value = suggestions.map((s) => s.text)
        autocompleteIndex.value = 0
      }
    }
  }

  // ── Command Execution ──────────────────────────────────────────────
  async function executeCommand(cmd: string): Promise<void> {
    const terminal = getTerminal()
    if (!terminal) return

    if (!cmd.trim()) return

    addToHistory(cmd)
    resetIndex()
    inputBuffer.value = ''

    // Clear autocomplete state
    autocompleteSuggestions.value = []
    autocompleteIndex.value = 0

    const [command, ...args] = cmd.trim().toLowerCase().split(/\s+/)
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
          `${ANSICode.red}${translate('terminal.errorPrefix')}: ${error instanceof Error ? error.message : String(error)}${ANSICode.reset}`
        )
      }
    } else {
      terminal.writeln(
        `${ANSICode.yellow}${translate('terminal.commandNotFound', { cmd: command })}: ${command}${ANSICode.reset}`
      )
    }
  }

  // ── Input Handler ──────────────────────────────────────────────────
  function handleInput(data: string): void {
    const terminal = getTerminal()
    if (!terminal) return

    if (data === '\r') {
      // Enter — execute command
      terminal.write('\r\n')
      executeCommand(inputBuffer.value).then(() => writePrompt())
    } else if (data === '\x1b[A') {
      // Arrow Up — history back
      navigateHistory(-1)
      autocompleteSuggestions.value = []
      autocompleteIndex.value = 0
    } else if (data === '\x1b[B') {
      // Arrow Down — history forward
      navigateHistory(1)
      autocompleteSuggestions.value = []
      autocompleteIndex.value = 0
    } else if (data === '\t') {
      // Tab — autocomplete
      autocomplete()
    } else if (data === '\x7f' || data === '\b') {
      // Backspace
      if (inputBuffer.value.length > 0) {
        inputBuffer.value = inputBuffer.value.slice(0, -1)
        replaceCurrentLine(inputBuffer.value)
      }
      if (autocompleteSuggestions.value.length > 0) {
        autocompleteSuggestions.value = []
        autocompleteIndex.value = 0
      }
    } else if (data === '\x03') {
      // Ctrl+C — cancel current input
      terminal.write('^C\r\n')
      inputBuffer.value = ''
      autocompleteSuggestions.value = []
      autocompleteIndex.value = 0
      writePrompt()
    } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
      // Printable character
      inputBuffer.value += data
      replaceCurrentLine(inputBuffer.value)
    }
    // Multi-byte escape sequences (Home, End, arrow keys handled above) are silently ignored
  }

  // ── Utilities ──────────────────────────────────────────────────────
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
    navigateHistory,
    autocomplete,
  }
}

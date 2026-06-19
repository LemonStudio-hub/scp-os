import { AVAILABLE_COMMANDS, COMMAND_DESCRIPTIONS } from '../constants/commands'
import type { CommandType } from '../types/command'
import { ANSICode } from '../constants/theme'

/**
 * A single autocomplete suggestion returned to the terminal
 */
export interface AutocompleteSuggestion {
  text: string
  displayText?: string
  description?: string
  type: 'command' | 'argument' | 'option'
}

/**
 * Tracks past autocomplete selections to rank frequently-used suggestions higher
 */
class CompletionHistory {
  private history: Map<string, number> = new Map()
  private maxHistory: number = 100

  /**
   * Record a user selection to boost its ranking in future suggestions
   */
  recordChoice(input: string, choice: string): void {
    const key = `${input}|${choice}`
    const count = this.history.get(key) || 0
    this.history.set(key, count + 1)

    // Evict least-used entries when history exceeds the cap
    if (this.history.size > this.maxHistory) {
      const sorted = Array.from(this.history.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(this.maxHistory)
      this.history = new Map(sorted)
    }
  }

  /**
   * Return a bonus score based on how often this suggestion was chosen before
   */
  getScore(input: string, suggestion: string): number {
    const key = `${input}|${suggestion}`
    return this.history.get(key) || 0
  }
}

/**
 * Provides tab-completion for terminal commands and their arguments
 */
export class CommandAutocompleteService {
  private history: CompletionHistory = new CompletionHistory()
  private maxSuggestions: number = 8

  /**
   * Subsequence-based fuzzy match -- characters don't need to be contiguous
   */
  private fuzzyMatch(pattern: string, text: string): boolean {
    pattern = pattern.toLowerCase()
    text = text.toLowerCase()

    let patternIndex = 0
    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
      if (text[i] === pattern[patternIndex]) {
        patternIndex++
      }
    }

    return patternIndex === pattern.length
  }

  /**
   * Score a candidate against the input (higher = better match)
   */
  private calculateMatchScore(pattern: string, text: string): number {
    pattern = pattern.toLowerCase()
    text = text.toLowerCase()

    // Exact match gets the highest score
    if (text === pattern) return 100

    // Prefix match scores second-highest
    if (text.startsWith(pattern)) return 80

    // Fuzzy subsequence match
    if (this.fuzzyMatch(pattern, text)) {
      // Scale score by how much of the total text was matched
      const matchedChars = pattern.length
      const totalChars = text.length
      const ratio = matchedChars / totalChars
      return Math.round(ratio * 60)
    }

    return 0
  }

  /**
   * Score and rank all matching commands
   */
  private getCommandSuggestions(input: string): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = []

    for (const command of AVAILABLE_COMMANDS) {
      const score = this.calculateMatchScore(input, command)
      if (score > 0) {
        suggestions.push({
          text: command,
          displayText: command,
          description: COMMAND_DESCRIPTIONS[command],
          type: 'command',
        })
      }
    }

    // Boost score for frequently-chosen suggestions
    return suggestions
      .map((s) => ({
        ...s,
        _score: this.calculateMatchScore(input, s.text) + this.history.getScore(input, s.text),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, this.maxSuggestions)
      .map(({ _score: _, ...rest }) => rest)
  }

  /**
   * Suggest arguments for the shutdown command
   */
  private getShutdownSuggestions(args: string[]): AutocompleteSuggestion[] {
    if (args.length === 0) {
      return [
        {
          text: 'now',
          displayText: 'now',
          description: 'Shut down the system immediately',
          type: 'argument',
        },
      ]
    }
    return []
  }

  /**
   * Suggest SCP numbers and CN- prefixed entries for the info command
   */
  private getInfoSuggestions(args: string[]): AutocompleteSuggestion[] {
    if (args.length === 0) {
      return [
        {
          text: 'CN-',
          displayText: 'CN-<number>',
          description: 'Query Chinese Branch SCP',
          type: 'argument',
        },
        {
          text: '173',
          displayText: '173',
          description: 'SCP-173 - The Sculpture',
          type: 'argument',
        },
        { text: '096', displayText: '096', description: 'SCP-096 - The Shy Guy', type: 'argument' },
        {
          text: '682',
          displayText: '682',
          description: 'SCP-682 - The Hard-to-Destroy Reptile',
          type: 'argument',
        },
        {
          text: '999',
          displayText: '999',
          description: 'SCP-999 - The Tickle Monster',
          type: 'argument',
        },
        {
          text: '049',
          displayText: '049',
          description: 'SCP-049 - The Plague Doctor',
          type: 'argument',
        },
      ]
    }

    // Suggest well-known CN branch SCPs when user starts typing CN-
    if (args[0].toLowerCase().startsWith('cn-')) {
      const cnNumbers = ['001', '002', '003', '009', '173', '994']
      const suggestions: AutocompleteSuggestion[] = []

      for (const num of cnNumbers) {
        const fullNum = `CN-${num}`
        if (fullNum.toLowerCase().startsWith(args[0].toLowerCase())) {
          suggestions.push({
            text: fullNum,
            displayText: fullNum,
            description: `Chinese Branch SCP-${num}`,
            type: 'argument',
          })
        }
      }

      return suggestions.slice(0, this.maxSuggestions)
    }

    return []
  }

  /**
   * Dispatch to the appropriate argument completer for a given command
   */
  private getArgumentSuggestions(command: CommandType, args: string[]): AutocompleteSuggestion[] {
    switch (command) {
      case 'shutdown':
        return this.getShutdownSuggestions(args)
      case 'info':
        return this.getInfoSuggestions(args)
      default:
        return []
    }
  }

  /**
   * Main entry point: return suggestions for the current terminal input
   */
  getSuggestions(input: string): AutocompleteSuggestion[] {
    const trimmed = input.trim()

    if (!trimmed) {
      // Empty input: list all available commands
      return AVAILABLE_COMMANDS.map((cmd) => ({
        text: cmd,
        displayText: cmd,
        description: COMMAND_DESCRIPTIONS[cmd],
        type: 'command' as const,
      })).slice(0, this.maxSuggestions)
    }

    // Split input into command and arguments
    const parts = trimmed.split(/\s+/)
    const command = parts[0] as CommandType
    const args = parts.slice(1)

    // Determine whether the first word is a known command
    const knownCommand = AVAILABLE_COMMANDS.includes(command)

    if (!knownCommand) {
      // Unknown command: try to complete the command name itself
      return this.getCommandSuggestions(command)
    }

    // Known command: try to complete its arguments
    if (args.length === 0 || (args.length === 1 && parts[parts.length - 1] !== '')) {
      return this.getArgumentSuggestions(command, args)
    }

    return []
  }

  /**
   * Render suggestions as formatted terminal lines for display
   */
  formatSuggestions(suggestions: AutocompleteSuggestion[]): string[] {
    if (suggestions.length === 0) {
      return []
    }

    const lines: string[] = []

    if (suggestions.length === 1) {
      // Single match: return it directly for inline completion
      return [suggestions[0].text]
    }

    // Multiple matches: display a formatted list
    lines.push(`${ANSICode.cyan}Possible completions:${ANSICode.reset}`)
    lines.push('')

    const maxTextLength = Math.max(...suggestions.map((s) => s.text.length))

    for (const suggestion of suggestions) {
      const paddedText = suggestion.text.padEnd(maxTextLength + 2)
      const description = suggestion.description || ''

      if (suggestion.type === 'command') {
        lines.push(
          `  ${ANSICode.green}${paddedText}${ANSICode.reset}${ANSICode.gray}${description}${ANSICode.reset}`
        )
      } else {
        lines.push(
          `  ${ANSICode.yellow}${paddedText}${ANSICode.reset}${ANSICode.gray}${description}${ANSICode.reset}`
        )
      }
    }

    lines.push('')
    lines.push(`${ANSICode.gray}Press Tab to cycle through suggestions${ANSICode.reset}`)

    return lines
  }

  /**
   * Record a selection to improve future suggestion ranking
   */
  recordChoice(input: string, choice: string): void {
    this.history.recordChoice(input, choice)
  }

  /**
   * Advance to the next suggestion index (wraps around)
   */
  cycleSuggestions(suggestions: AutocompleteSuggestion[], currentIndex: number): number {
    return (currentIndex + 1) % suggestions.length
  }

  /**
   * Return the suggestion text at a given index (wraps around)
   */
  getSuggestionAt(suggestions: AutocompleteSuggestion[], index: number): string | null {
    if (suggestions.length === 0) return null
    return suggestions[index % suggestions.length].text
  }
}

// Export singleton instance for use across the terminal
export const autocompleteService = new CommandAutocompleteService()

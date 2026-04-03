import { AVAILABLE_COMMANDS, COMMAND_DESCRIPTIONS } from '../constants/commands'
import type { CommandType } from '../types/command'
import { ANSICode } from '../constants/theme'

/**
 * 补全结果接口
 */
export interface AutocompleteSuggestion {
  text: string
  displayText?: string
  description?: string
  type: 'command' | 'argument' | 'option'
}

/**
 * 补全历史记录
 */
class CompletionHistory {
  private history: Map<string, number> = new Map()
  private maxHistory: number = 100

  /**
   * 记录补全选择
   */
  recordChoice(input: string, choice: string): void {
    const key = `${input}|${choice}`
    const count = this.history.get(key) || 0
    this.history.set(key, count + 1)

    // 限制历史记录大小
    if (this.history.size > this.maxHistory) {
      const sorted = Array.from(this.history.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(this.maxHistory)
      this.history = new Map(sorted)
    }
  }

  /**
   * 获取建议的排序分数
   */
  getScore(input: string, suggestion: string): number {
    const key = `${input}|${suggestion}`
    return this.history.get(key) || 0
  }
}

/**
 * 命令补全服务
 */
export class CommandAutocompleteService {
  private history: CompletionHistory = new CompletionHistory()
  private maxSuggestions: number = 8

  /**
   * 模糊匹配算法
   * 使用子序列匹配，允许字符不连续
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
   * 计算匹配分数
   * 分数越高表示匹配度越好
   */
  private calculateMatchScore(pattern: string, text: string): number {
    pattern = pattern.toLowerCase()
    text = text.toLowerCase()

    // 完全匹配
    if (text === pattern) return 100

    // 前缀匹配
    if (text.startsWith(pattern)) return 80

    // 模糊匹配
    if (this.fuzzyMatch(pattern, text)) {
      // 根据匹配字符数计算分数
      const matchedChars = pattern.length
      const totalChars = text.length
      const ratio = matchedChars / totalChars
      return Math.round(ratio * 60)
    }

    return 0
  }

  /**
   * 获取命令补全建议
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
          type: 'command'
        })
      }
    }

    // 添加历史记录分数
    return suggestions
      .map(s => ({
        ...s,
        _score: this.calculateMatchScore(input, s.text) + this.history.getScore(input, s.text)
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, this.maxSuggestions)
      .map(s => {
        const { _score, ...rest } = s as any
        return rest
      })
  }

  /**
   * 获取 shutdown 命令参数补全
   */
  private getShutdownSuggestions(args: string[]): AutocompleteSuggestion[] {
    if (args.length === 0) {
      return [{
        text: 'now',
        displayText: 'now',
        description: '立即关闭系统',
        type: 'argument'
      }]
    }
    return []
  }

  /**
   * 获取 info 命令参数补全
   * 支持 SCP 编号补全和 CN- 前缀补全
   */
  private getInfoSuggestions(args: string[]): AutocompleteSuggestion[] {
    if (args.length === 0) {
      return [
        { text: 'CN-', displayText: 'CN-<number>', description: '查询中文分部 SCP', type: 'argument' },
        { text: '173', displayText: '173', description: 'SCP-173 - The Sculpture', type: 'argument' },
        { text: '096', displayText: '096', description: 'SCP-096 - The Shy Guy', type: 'argument' },
        { text: '682', displayText: '682', description: 'SCP-682 - The Hard-to-Destroy Reptile', type: 'argument' },
        { text: '999', displayText: '999', description: 'SCP-999 - The Tickle Monster', type: 'argument' },
        { text: '049', displayText: '049', description: 'SCP-049 - The Plague Doctor', type: 'argument' },
      ]
    }

    // 如果用户输入了 CN-，建议一些常见的中文 SCP
    if (args[0].toLowerCase().startsWith('cn-')) {
      const cnNumbers = ['001', '002', '003', '009', '173', '994']
      const suggestions: AutocompleteSuggestion[] = []

      for (const num of cnNumbers) {
        const fullNum = `CN-${num}`
        if (fullNum.toLowerCase().startsWith(args[0].toLowerCase())) {
          suggestions.push({
            text: fullNum,
            displayText: fullNum,
            description: `中文分部 SCP-${num}`,
            type: 'argument'
          })
        }
      }

      return suggestions.slice(0, this.maxSuggestions)
    }

    return []
  }

  /**
   * 获取命令参数补全建议
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
   * 获取补全建议
   */
  getSuggestions(input: string): AutocompleteSuggestion[] {
    const trimmed = input.trim()

    if (!trimmed) {
      // 空输入，返回所有命令
      return AVAILABLE_COMMANDS.map(cmd => ({
        text: cmd,
        displayText: cmd,
        description: COMMAND_DESCRIPTIONS[cmd],
        type: 'command' as const
      })).slice(0, this.maxSuggestions)
    }

    // 解析输入
    const parts = trimmed.split(/\s+/)
    const command = parts[0] as CommandType
    const args = parts.slice(1)

    // 检查是否是已知命令
    const knownCommand = AVAILABLE_COMMANDS.includes(command)

    if (!knownCommand) {
      // 未知命令，尝试补全命令名
      return this.getCommandSuggestions(command)
    }

    // 已知命令，尝试补全参数
    if (args.length === 0 || (args.length === 1 && parts[parts.length - 1] !== '')) {
      return this.getArgumentSuggestions(command, args)
    }

    return []
  }

  /**
   * 格式化补全建议显示
   */
  formatSuggestions(suggestions: AutocompleteSuggestion[]): string[] {
    if (suggestions.length === 0) {
      return []
    }

    const lines: string[] = []

    if (suggestions.length === 1) {
      // 单个匹配，直接返回
      return [suggestions[0].text]
    }

    // 多个匹配，格式化显示
    lines.push(`${ANSICode.cyan}可能的补全:${ANSICode.reset}`)
    lines.push('')

    const maxTextLength = Math.max(...suggestions.map(s => s.text.length))

    for (const suggestion of suggestions) {
      const paddedText = suggestion.text.padEnd(maxTextLength + 2)
      const description = suggestion.description || ''

      if (suggestion.type === 'command') {
        lines.push(`  ${ANSICode.green}${paddedText}${ANSICode.reset}${ANSICode.gray}${description}${ANSICode.reset}`)
      } else {
        lines.push(`  ${ANSICode.yellow}${paddedText}${ANSICode.reset}${ANSICode.gray}${description}${ANSICode.reset}`)
      }
    }

    lines.push('')
    lines.push(`${ANSICode.gray}按 Tab 键循环选择${ANSICode.reset}`)

    return lines
  }

  /**
   * 记录补全选择
   */
  recordChoice(input: string, choice: string): void {
    this.history.recordChoice(input, choice)
  }

  /**
   * 循环选择建议
   */
  cycleSuggestions(suggestions: AutocompleteSuggestion[], currentIndex: number): number {
    return (currentIndex + 1) % suggestions.length
  }

  /**
   * 根据索引获取建议文本
   */
  getSuggestionAt(suggestions: AutocompleteSuggestion[], index: number): string | null {
    if (suggestions.length === 0) return null
    return suggestions[index % suggestions.length].text
  }
}

// 导出单例
export const autocompleteService = new CommandAutocompleteService()
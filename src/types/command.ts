export type CommandType = 
  | 'help'
  | 'status'
  | 'clear'
  | 'cls'
  | 'containment'
  | 'scp-list'
  | 'info'
  | 'protocol'
  | 'emergency'
  | 'logout'
  | 'version'
  | 'about'
  | 'search'

export interface Command {
  name: CommandType
  description: string
  usage?: string
}

import type { TerminalWrite, TerminalWriteln } from './terminal'

export interface CommandHandler {
  (args: string[], terminal: TerminalWrite, terminalWriteln: TerminalWriteln): void | Promise<void>
}

export type CommandMap = Record<CommandType, CommandHandler>

export interface CommandHistory {
  history: string[]
  currentIndex: number
}

export interface CommandExecutionResult {
  success: boolean
  output?: string
  error?: string
}
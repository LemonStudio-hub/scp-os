export type CommandType =
  | 'start'
  | 'restart'
  | 'shutdown'
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
  | 'network'
  | 'performance'
  | 'ls'
  | 'cd'
  | 'pwd'
  | 'mkdir'
  | 'rm'
  | 'cat'
  | 'echo'
  | 'touch'
  | 'cp'
  | 'mv'
  | 'uname'
  | 'df'
  | 'free'
  | 'uptime'
  | 'find'
  | 'grep'
  | 'chmod'
  | 'chown'

import type { TerminalWrite, TerminalWriteln } from './terminal'

export interface Command {
  name: CommandType
  description: string
  usage?: string
}

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
/**
 * Command History Domain Entity
 * Represents a command history entry in the domain
 */

import type { Entity } from './entity.interface'

/**
 * Command History Entity
 */
export class CommandHistoryEntity implements Entity {
  /**
   * Unique identifier
   */
  readonly id: string

  /**
   * Command text
   */
  readonly command: string

  /**
   * Execution timestamp
   */
  readonly timestamp: Date

  /**
   * Whether execution was successful
   */
  readonly success: boolean

  /**
   * Execution duration in milliseconds
   */
  readonly duration?: number

  /**
   * Error message (if failed)
   */
  readonly error?: string

  /**
   * Creation timestamp
   */
  readonly createdAt: Date

  /**
   * Last update timestamp
   */
  readonly updatedAt: Date

  constructor(data: {
    id: string
    command: string
    timestamp: Date
    success: boolean
    duration?: number
    error?: string
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.id = data.id
    this.command = data.command
    this.timestamp = data.timestamp
    this.success = data.success
    this.duration = data.duration
    this.error = data.error
    this.createdAt = data.createdAt ?? data.timestamp
    this.updatedAt = data.updatedAt ?? data.timestamp
  }

  /**
   * Get command name (first word)
   */
  getCommandName(): string {
    return this.command.split(' ')[0] || ''
  }

  /**
   * Get command arguments
   */
  getArguments(): string[] {
    const parts = this.command.split(' ')
    return parts.length > 1 ? parts.slice(1) : []
  }

  /**
   * Convert to plain object
   */
  toJSON(): {
    id: string
    command: string
    timestamp: string
    success: boolean
    duration?: number
    error?: string
  } {
    return {
      id: this.id,
      command: this.command,
      timestamp: this.timestamp.toISOString(),
      success: this.success,
      duration: this.duration,
      error: this.error
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: {
    id: string
    command: string
    timestamp: string
    success: boolean
    duration?: number
    error?: string
  }): CommandHistoryEntity {
    return new CommandHistoryEntity({
      ...data,
      timestamp: new Date(data.timestamp)
    })
  }
}

/**
 * Command History Collection
 * Manages a collection of command history entries
 */
export class CommandHistoryCollection {
  private entries: CommandHistoryEntity[]
  private maxSize: number
  private currentIndex: number = -1

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
    this.entries = []
  }

  /**
   * Add a command history entry
   */
  add(entry: CommandHistoryEntity): void {
    this.entries.push(entry)

    // Remove oldest entries if exceeding max size
    if (this.entries.length > this.maxSize) {
      this.entries.shift()
    }

    // Set current index to the new entry
    this.currentIndex = this.entries.length - 1
  }

  /**
   * Get all entries
   */
  getAll(): CommandHistoryEntity[] {
    return [...this.entries]
  }

  /**
   * Get entry by index
   */
  getByIndex(index: number): CommandHistoryEntity | undefined {
    return this.entries[index]
  }

  /**
   * Get previous command
   */
  getPrevious(): CommandHistoryEntity | undefined {
    if (this.currentIndex >= 0) {
      const entry = this.entries[this.currentIndex]
      this.currentIndex--
      return entry
    }
    return undefined
  }

  /**
   * Get next command
   */
  getNext(): CommandHistoryEntity | undefined {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++
      return this.entries[this.currentIndex]
    }
    return undefined
  }

  /**
   * Reset navigation index
   */
  resetNavigation(): void {
    this.currentIndex = this.entries.length - 1
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.currentIndex = -1
  }

  /**
   * Get current navigation index
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * Get entry count
   */
  getCount(): number {
    return this.entries.length
  }

  /**
   * Search entries by command text
   */
  search(query: string): CommandHistoryEntity[] {
    const lowerQuery = query.toLowerCase()
    return this.entries.filter(entry =>
      entry.command.toLowerCase().includes(lowerQuery)
    )
  }
}
/**
 * CommandId Value Object
 * Represents a command identifier with validation
 */

import { ValueObject } from './value-object'

/**
 * CommandId Value Object
 */
export class CommandId extends ValueObject<string> {
  private static readonly COMMAND_PATTERN = /^[a-z][a-z0-9-]*$/

  constructor(value: string) {
    super(value.toLowerCase())
    this.validate()
  }

  /**
   * Validate command ID
   */
  protected validate(): void {
    if (!this.value) {
      throw new Error('Command ID cannot be empty')
    }

    if (this.value.length > 50) {
      throw new Error('Command ID cannot exceed 50 characters')
    }

    if (!CommandId.COMMAND_PATTERN.test(this.value)) {
      throw new Error(
        `Invalid command ID: ${this.value}. Must start with a letter and contain only lowercase letters, numbers, and hyphens`
      )
    }
  }

  /**
   * Create CommandId from string
   */
  static create(value: string): CommandId {
    return new CommandId(value)
  }

  /**
   * Check if value is valid
   */
  static isValid(value: string): boolean {
    try {
      new CommandId(value)
      return true
    } catch {
      return false
    }
  }
}
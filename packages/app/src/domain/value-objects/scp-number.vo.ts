/**
 * SCPNumber Value Object
 * Represents an SCP number with validation
 */

import { ValueObject } from './value-object'

/**
 * SCPNumber Value Object
 */
export class SCPNumber extends ValueObject<string> {
  private static readonly SCP_PATTERN = /^SCP-(\d+)(-[A-Za-z]+)?$/

  constructor(value: string) {
    super(value.toUpperCase())
    this.validate()
  }

  /**
   * Validate SCP number
   */
  protected validate(): void {
    if (!this.value) {
      throw new Error('SCP number cannot be empty')
    }

    if (!SCPNumber.SCP_PATTERN.test(this.value)) {
      throw new Error(
        `Invalid SCP number: ${this.value}. Must be in format "SCP-XXX" or "SCP-XXX-variant"`
      )
    }

    const match = this.value.match(SCPNumber.SCP_PATTERN)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num < 0 || num > 9999) {
        throw new Error(`SCP number must be between 0 and 9999`)
      }
    }
  }

  /**
   * Get numeric part of SCP number
   */
  getNumber(): number {
    const match = this.value.match(SCPNumber.SCP_PATTERN)
    return match ? parseInt(match[1], 10) : 0
  }

  /**
   * Get variant part of SCP number (if any)
   */
  getVariant(): string | null {
    const match = this.value.match(SCPNumber.SCP_PATTERN)
    return match && match[2] ? match[2].replace('-', '') : null
  }

  /**
   * Check if has variant
   */
  hasVariant(): boolean {
    return this.getVariant() !== null
  }

  /**
   * Compare SCP numbers by numeric value
   */
  compareTo(other: SCPNumber): number {
    return this.getNumber() - other.getNumber()
  }

  /**
   * Create SCPNumber from string
   */
  static create(value: string): SCPNumber {
    return new SCPNumber(value)
  }

  /**
   * Create SCPNumber from number
   */
  static fromNumber(num: number, variant?: string): SCPNumber {
    const value = variant ? `SCP-${num}-${variant}` : `SCP-${num}`
    return new SCPNumber(value)
  }

  /**
   * Check if value is valid
   */
  static isValid(value: string): boolean {
    try {
      new SCPNumber(value)
      return true
    } catch {
      return false
    }
  }
}
/**
 * ValueObject Base Class
 * Base class for all value objects in the domain
 *
 * Value Objects are immutable objects that are defined by their attributes
 * rather than their identity. Two value objects with the same attributes are
 * considered equal.
 */

export abstract class ValueObject<T> {
  protected readonly value: T

  constructor(value: T) {
    this.value = value
    this.validate()
  }

  /**
   * Validate the value object
   * Subclasses must implement this method
   */
  protected abstract validate(): void

  /**
   * Get the value
   */
  getValue(): T {
    return this.value
  }

  /**
   * Convert to string
   */
  toString(): string {
    return String(this.value)
  }

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.value
  }

  /**
   * Check equality with another value object
   */
  equals(other: ValueObject<T>): boolean {
    if (this === other) {
      return true
    }

    if (!(other instanceof ValueObject)) {
      return false
    }

    return this.value === other.value
  }

  /**
   * Get hash code
   */
  hashCode(): number {
    return String(this.value).split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0)
  }
}
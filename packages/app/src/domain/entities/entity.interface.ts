/**
 * Entity Base Interface
 * Base interface for all entities in the domain
 */

/**
 * Entity Base Interface
 */
export interface Entity {
  /**
   * Unique identifier
   */
  readonly id: string

  /**
   * Creation timestamp
   */
  readonly createdAt: Date

  /**
   * Last update timestamp
   */
  readonly updatedAt: Date
}
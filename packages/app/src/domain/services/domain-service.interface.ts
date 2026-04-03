/**
 * Base Domain Service Interface
 * Base interface for all domain services
 */

/**
 * Domain Service Interface
 */
export interface IDomainService {
  /**
   * Service name
   */
  readonly name: string

  /**
   * Initialize service
   */
  initialize?(): Promise<void>

  /**
   * Dispose service
   */
  dispose?(): Promise<void>
}
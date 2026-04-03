/**
 * Application Service Interface
 * Base interface for all application services
 */

/**
 * Application Service Interface
 */
export interface IApplicationService {
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
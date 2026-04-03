/**
 * Base Controller Interface
 * Base interface for all controllers in the application layer
 */

/**
 * Controller Interface
 */
export interface IController {
  /**
   * Controller name
   */
  readonly name: string

  /**
   * Initialize controller
   */
  initialize?(): Promise<void>

  /**
   * Dispose controller
   */
  dispose?(): Promise<void>
}
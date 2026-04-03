/**
 * Repository Base Interface
 * Base repository interface for all repositories in the domain
 */

import type { Entity } from '../entities'

/**
 * Query options
 */
export interface QueryOptions<T> {
  filter?: (entity: T) => boolean
  sort?: (a: T, b: T) => number
  limit?: number
  offset?: number
}

/**
 * Query result
 */
export interface QueryResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

/**
 * Base Repository Interface
 */
export interface IRepository<T extends Entity> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>

  /**
   * Find entities with query options
   */
  find(options: QueryOptions<T>): Promise<QueryResult<T>>

  /**
   * Find one entity matching filter
   */
  findOne(filter: (entity: T) => boolean): Promise<T | null>

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<T>

  /**
   * Delete entity by ID
   */
  delete(id: string): Promise<void>

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Count entities
   */
  count(): Promise<number>

  /**
   * Clear all entities
   */
  clear(): Promise<void>
}
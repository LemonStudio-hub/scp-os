/**
 * Memory Base Repository
 * Base repository implementation using in-memory storage
 */

import type { IRepository, QueryOptions, QueryResult } from '../../domain/repositories'
import type { Entity } from '../../domain/entities'

/**
 * Memory Base Repository
 */
export abstract class MemoryBaseRepository<T extends Entity> implements IRepository<T> {
  protected entities: Map<string, T> = new Map()

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.entities.get(id) || null
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<T[]> {
    return Array.from(this.entities.values())
  }

  /**
   * Find entities with query options
   */
  async find(options: QueryOptions<T>): Promise<QueryResult<T>> {
    let entities = Array.from(this.entities.values())

    // Apply filter
    if (options.filter) {
      entities = entities.filter(options.filter)
    }

    // Get total before limit/offset
    const total = entities.length

    // Apply sort
    if (options.sort) {
      entities.sort(options.sort)
    }

    // Apply offset
    if (options.offset) {
      entities = entities.slice(options.offset)
    }

    // Apply limit
    const hasMore = options.limit ? entities.length > options.limit : false
    if (options.limit) {
      entities = entities.slice(0, options.limit)
    }

    return {
      data: entities,
      total,
      hasMore
    }
  }

  /**
   * Find one entity matching filter
   */
  async findOne(filter: (entity: T) => boolean): Promise<T | null> {
    for (const entity of this.entities.values()) {
      if (filter(entity)) {
        return entity
      }
    }
    return null
  }

  /**
   * Save entity (create or update)
   */
  async save(entity: T): Promise<T> {
    this.entities.set(entity.id, entity)
    return entity
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    this.entities.delete(id)
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    return this.entities.has(id)
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    return this.entities.size
  }

  /**
   * Clear all entities
   */
  async clear(): Promise<void> {
    this.entities.clear()
  }

  /**
   * Initialize repository with seed data
   */
  async initializeWith(entities: T[]): Promise<void> {
    this.entities.clear()
    for (const entity of entities) {
      this.entities.set(entity.id, entity)
    }
  }

  /**
   * Get all entities IDs
   */
  getIds(): string[] {
    return Array.from(this.entities.keys())
  }
}
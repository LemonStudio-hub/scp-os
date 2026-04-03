/**
 * SCP Repository Interface
 * Repository interface for SCP entities
 */

import type { SCPEntity } from '../entities'
import type { IRepository, QueryOptions } from './repository.interface'
import type { SCPClass } from '../../types/scp'

/**
 * SCP Query Options
 */
export interface SCPQueryOptions extends QueryOptions<SCPEntity> {
  class?: SCPClass
  site?: string
  warningLevel?: 'low' | 'medium' | 'high' | 'extreme'
  search?: string
}

/**
 * SCP Repository Interface
 */
export interface ISCPSRepository extends IRepository<SCPEntity> {
  /**
   * Find SCP by number (e.g., "SCP-173")
   */
  findByNumber(number: string): Promise<SCPEntity | null>

  /**
   * Find SCPs by class
   */
  findByClass(scpClass: SCPClass): Promise<SCPEntity[]>

  /**
   * Find SCPs by site
   */
  findBySite(site: string): Promise<SCPEntity[]>

  /**
   * Find SCPs by warning level
   */
  findByWarningLevel(level: 'low' | 'medium' | 'high' | 'extreme'): Promise<SCPEntity[]>

  /**
   * Search SCPs by name or description
   */
  search(query: string): Promise<SCPEntity[]>

  /**
   * Find all SCPs with query options
   */
  findWithQuery(options: SCPQueryOptions): Promise<SCPEntity[]>

  /**
   * Get dangerous SCPs (Euclid or Keter)
   */
  getDangerous(): Promise<SCPEntity[]>

  /**
   * Get extremely dangerous SCPs (Keter or extreme warning)
   */
  getExtremelyDangerous(): Promise<SCPEntity[]>

  /**
   * Get safe SCPs
   */
  getSafe(): Promise<SCPEntity[]>

  /**
   * Get containment procedures for SCP
   */
  getContainmentProcedures(scpId: string): Promise<string[]>

  /**
   * Update containment procedures
   */
  updateContainmentProcedures(scpId: string, procedures: string[]): Promise<void>

  /**
   * Get count by class
   */
  getCountByClass(): Promise<Record<SCPClass, number>>

  /**
   * Get count by site
   */
  getCountBySite(): Promise<Record<string, number>>
}
/**
 * SCP Domain Service Interface
 * Service interface for SCP-related business logic
 */

import type { SCPEntity } from '../entities'
import type { SCPClass } from '../../types/scp'
import type { IDomainService } from './domain-service.interface'

/**
 * SCP Query Result
 */
export interface SCPQueryResult {
  scp: SCPEntity
  procedures: string[]
  warningLevel: string
  recommendations: string[]
}

/**
 * SCP Service Interface
 */
export interface ISCPService extends IDomainService {
  /**
   * Get SCP by number
   */
  getSCP(number: string): Promise<SCPEntity | null>

  /**
   * Query SCP details (including procedures and recommendations)
   */
  querySCP(number: string): Promise<SCPQueryResult | null>

  /**
   * Search SCPs by keyword
   */
  searchSCPs(keyword: string): Promise<SCPEntity[]>

  /**
   * Get all SCPs
   */
  getAllSCPs(): Promise<SCPEntity[]>

  /**
   * Get SCPs by class
   */
  getSCPsByClass(scpClass: SCPClass): Promise<SCPEntity[]>

  /**
   * Get dangerous SCPs
   */
  getDangerousSCPs(): Promise<SCPEntity[]>

  /**
   * Get safe SCPs
   */
  getSafeSCPs(): Promise<SCPEntity[]>

  /**
   * Get containment procedures for SCP
   */
  getContainmentProcedures(scpId: string): Promise<string[]>

  /**
   * Validate SCP number format
   */
  validateSCPNumber(number: string): boolean

  /**
   * Get SCP statistics
   */
  getStatistics(): Promise<{
    total: number
    byClass: Record<SCPClass, number>
    dangerous: number
    safe: number
  }>
}
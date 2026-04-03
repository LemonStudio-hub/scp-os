/**
 * SCP Domain Entity
 * Represents a SCP (Secure, Contain, Protect) object in the domain
 */

import type { Entity } from './entity.interface'
import type { SCPClass } from '../../types/scp'

/**
 * SCP Entity
 */
export class SCPEntity implements Entity {
  /**
   * Unique identifier (e.g., "SCP-173")
   */
  readonly id: string

  /**
   * SCP name/title
   */
  readonly name: string

  /**
   * SCP containment class
   */
  readonly class: SCPClass

  /**
   * Site location
   */
  readonly site: string

  /**
   * SCP description
   */
  readonly description: string

  /**
   * Containment procedures
   */
  readonly containmentProcedures: string[]

  /**
   * Warning level
   */
  readonly warningLevel: 'low' | 'medium' | 'high' | 'extreme'

  /**
   * Creation timestamp
   */
  readonly createdAt: Date

  /**
   * Last update timestamp
   */
  readonly updatedAt: Date

  constructor(data: {
    id: string
    name: string
    class: SCPClass
    site: string
    description: string
    containmentProcedures: string[]
    warningLevel: 'low' | 'medium' | 'high' | 'extreme'
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.id = data.id
    this.name = data.name
    this.class = data.class
    this.site = data.site
    this.description = data.description
    this.containmentProcedures = data.containmentProcedures
    this.warningLevel = data.warningLevel
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  /**
   * Check if SCP is safe
   */
  isSafe(): boolean {
    return this.class === 'Safe'
  }

  /**
   * Check if SCP is dangerous
   */
  isDangerous(): boolean {
    return this.class === 'Euclid' || this.class === 'Keter'
  }

  /**
   * Check if SCP is extremely dangerous
   */
  isExtremelyDangerous(): boolean {
    return this.class === 'Keter' || this.warningLevel === 'extreme'
  }

  /**
   * Get warning level priority
   */
  getWarningPriority(): number {
    const priority: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      extreme: 4
    }
    return priority[this.warningLevel] ?? 0
  }

  /**
   * Get containment class priority
   */
  getClassPriority(): number {
    const priority: Record<string, number> = {
      Safe: 1,
      Euclid: 2,
      Keter: 3,
      Thaumiel: 4
    }
    return priority[this.class] ?? 0
  }

  /**
   * Convert to plain object
   */
  toJSON(): {
    id: string
    name: string
    class: SCPClass
    site: string
    description: string
    containmentProcedures: string[]
    warningLevel: 'low' | 'medium' | 'high' | 'extreme'
    createdAt: string
    updatedAt: string
  } {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      site: this.site,
      description: this.description,
      containmentProcedures: this.containmentProcedures,
      warningLevel: this.warningLevel,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: {
    id: string
    name: string
    class: SCPClass
    site: string
    description: string
    containmentProcedures: string[]
    warningLevel: 'low' | 'medium' | 'high' | 'extreme'
    createdAt?: string
    updatedAt?: string
  }): SCPEntity {
    return new SCPEntity({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    })
  }
}
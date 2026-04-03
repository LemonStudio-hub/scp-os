export const SCPClass = {
  Safe: 'Safe',
  Euclid: 'Euclid',
  Keter: 'Keter',
  Thaumiel: 'Thaumiel'
} as const

export type SCPClass = typeof SCPClass[keyof typeof SCPClass]

export interface SCPObject {
  id: string
  name: string
  class: SCPClass
  site: string
  description: string
  containmentProcedures: string[]
  warningLevel: 'low' | 'medium' | 'high' | 'extreme'
}

export interface SCPInfo {
  id: string
  name: string
  class: string
  site: string
  procedures: string[]
  description: string[]
}

export interface SCPDatabase {
  [id: string]: SCPInfo
}

export interface ContainmentProtocol {
  class: SCPClass
  description: string
  procedures: string[]
  requirements: string[]
}

export interface SecurityProtocol {
  name: string
  code: string
  description: string
  purpose: string
  members: string[]
}

export interface EmergencyContact {
  department: string
  extension: string
  description: string
  priority: 'normal' | 'high' | 'critical'
}
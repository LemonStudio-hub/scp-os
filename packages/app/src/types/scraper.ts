export interface SCPWikiData {
  id: string
  name: string
  objectClass: ObjectClass // 使用联合类型，与 Worker 保持一致
  containment: string[]
  description: string[]
  appendix: string[]
  references?: string[]
  author?: string
  url: string
}

export interface ScraperConfig {
  baseUrl: string
  userAgent: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

export interface ScraperResult {
  success: boolean
  data?: SCPWikiData
  error?: string
  cached?: boolean
}

export interface SCPListItem {
  scp_id: number
  name: string
  object_class: string
  tags: string
  clearance_level: number
  updated_at: string
}

export interface SCPListResult {
  success: boolean
  data?: SCPListItem[]
  total?: number
  error?: string
}

export type ObjectClass = 'SAFE' | 'EUCLID' | 'KETER' | 'THAUMIEL' | 'NEUTRALIZED' | 'PENDING' | 'UNKNOWN'

export interface ObjectClassInfo {
  class: ObjectClass
  color: string
  displayName: string
  description: string
}
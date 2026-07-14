/** Cloudflare secret binding or plain string (local/dev). */
export type SecretBinding = string | { get: () => Promise<string> }

export interface Env {
  SCP_DB: D1Database
  SCP_READER_DB: D1Database
  CHAT_ROOM_DO: DurableObjectNamespace
  JWT_SECRET?: string
  ADMIN_JWT_SECRET?: string
  /** Resend API key for email verification codes */
  KEY_RESEND?: SecretBinding
  RESEND_API_KEY?: SecretBinding
  EMAIL_FROM?: string
  ENVIRONMENT?: string
}

export interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  count?: number
  total?: number
  stats?: unknown
  pagination?: unknown
  available?: boolean
}

export interface RequestInfo {
  ip: string
  origin: string
  userAgent: string
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminSession {
  adminId: number
  username: string
  role: AdminRole
}

export type AccountType = 'guest' | 'registered'

export interface JwtUserPayload {
  userId: string
  accountType?: AccountType
  email?: string
  iat?: number
  exp?: number
}

export interface UserSession {
  userId: string
  accountType: AccountType
  email?: string
}

export interface JwtAdminPayload {
  adminId: number
  username: string
  role: AdminRole
  iat?: number
  exp?: number
}

export interface SCPData {
  id: string
  name: string
  objectClass: string
  containment: string[]
  description: string[]
  appendix: string[]
  author?: string
  url: string
}

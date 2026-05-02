﻿﻿﻿/**
 * 统一类型定义
 * 前端和 Worker 共享此类型定义
 */

/**
 * SCP 项目等级
 */
export type ObjectClass =
  | 'SAFE'
  | 'EUCLID'
  | 'KETER'
  | 'THAUMIEL'
  | 'NEUTRALIZED'
  | 'PENDING'
  | 'UNKNOWN'

/**
 * 项目等级信息
 */
export interface ObjectClassInfo {
  class: ObjectClass
  color: string
  displayName: string
  description: string
}

/**
 * SCP 维基数据
 */
export interface SCPWikiData {
  id: string
  name: string
  objectClass: ObjectClass
  containment: string[]
  description: string[]
  appendix: string[]
  references?: string[]
  author?: string
  url: string
}

/**
 * 爬虫结果
 */
export interface ScraperResult {
  success: boolean
  data?: SCPWikiData
  error?: string
  cached?: boolean
  metadata?: ScraperMetadata
}

/**
 * 爬虫元数据
 */
export interface ScraperMetadata {
  cached?: boolean
  parseTime?: number
  fetchTime?: number
  source?: string
}

/**
 * 爬虫配置
 */
export interface ScraperConfig {
  baseUrl: string
  userAgent: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  cacheDuration: number
  cacheMaxSize: number
  rateLimit: {
    maxRequests: number
    windowMs: number
  }
  cors: {
    allowedOrigins: string[]
    allowedMethods: string[]
    allowedHeaders: string[]
    maxAge: number
  }
  htmlCleanup: {
    removeSelectors: string[]
    minContentLength: number
  }
  parsing: {
    minParagraphLength: number
    maxParagraphLength: number
    ignorePatterns: RegExp[]
  }
}

/**
 * 解析后的章节
 */
export interface ParsedSections {
  title: string
  objectClass: ObjectClass
  containment: string[]
  description: string[]
  appendix: string[]
  author?: string
}

/**
 * KV 命名空间
 */
export interface Env {
  SCP_CACHE: KVNamespace
  SCP_DB: D1Database
  SCP_READER_DB: D1Database
  CHAT_ROOM_DO: DurableObjectNamespace
  JWT_SECRET?: string
}

/**
 * Worker 请求上下文
 */
export interface RequestContext {
  ip: string
  origin: string
  userAgent: string
  timestamp: number
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: number
  user_id: string
  username: string
  content: string
  room_id: number
  created_at: string
  is_broadcast: number
  broadcast_count: number
}

/**
 * 聊天消息（发送时不需要 id 和时间戳）
 */
export interface ChatMessageInput {
  user_id: string
  username: string
  content: string
}

/**
 * 聊天 API 响应
 */
export interface ChatApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

/**
 * 聊天室
 */
export interface ChatRoom {
  id: number
  name: string
  description: string
  created_by: string
  created_at: string
  is_public: number
  message_count: number
}

/**
 * 聊天室输入
 */
export interface ChatRoomInput {
  name: string
  description?: string
  created_by: string
  is_public?: number
}

/**
 * WebSocket用户
 */
export interface WSUser {
  user_id: string
  username: string
}

export interface ChatSendMessageBody {
  user_id: string
  nickname?: string
  content: string
  room_id?: number
}

export interface CreateChatRoomBody {
  name: string
  description?: string
  created_by: string
  is_public?: number
}

export interface SetNicknameBody {
  user_id: string
  nickname: string
}

export interface SubmitFeedbackBody {
  title: string
  content: string
  category?: string
}

export interface LikeFeedbackBody {
  id: number
}

export interface SubmitCommentBody {
  feedback_id: number
  content: string
}

export interface VoteFeedbackBody {
  id: number
  vote: 'up' | 'down'
}

export interface RegisterUserBody {
  userId: string
  nickname: string
}

export interface PerformanceMetricsBody {
  [key: string]: unknown
}

export interface D1StatRow {
  object_class: string
  count: number
}

export interface D1ClearanceRow {
  clearance_level: number
  count: number
}

export interface SCPItem {
  scp_number: string
  title: string
  object_class: string | null
  series: string | null
  rating: number
  tags: string
  creator: string | null
  created_at: string | null
  clearance_level: number
  has_content: number
  content_file: string | null
}

export interface SCPTale {
  link: string
  title: string
  year: number | null
  rating: number
  tags: string
  creator: string | null
  created_at: string | null
  content_file: string | null
}

export interface SCPGOI {
  link: string
  title: string
  rating: number
  tags: string
  creator: string | null
  created_at: string | null
}

export interface SCPHub {
  link: string
  title: string
  references_json: string
  tags: string
}

export interface DocsContentResponse {
  scp_number: string
  content: string
  cached: boolean
  source: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
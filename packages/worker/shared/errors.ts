/**
 * 统一 API 错误码体系
 */

import type { ApiError } from './types'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SCRAPE_ERROR = 'SCRAPE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export function validationError(message: string, details?: unknown): ApiError {
  return { code: ErrorCode.VALIDATION_ERROR, message, details }
}

export function notFoundError(message: string): ApiError {
  return { code: ErrorCode.NOT_FOUND, message }
}

export function rateLimitedError(message: string): ApiError {
  return { code: ErrorCode.RATE_LIMITED, message }
}

export function unauthorizedError(message?: string): ApiError {
  return { code: ErrorCode.UNAUTHORIZED, message: message || 'Unauthorized' }
}

export function internalError(message?: string): ApiError {
  return { code: ErrorCode.INTERNAL_ERROR, message: message || 'Internal server error' }
}

export function databaseError(message: string): ApiError {
  return { code: ErrorCode.DATABASE_ERROR, message }
}

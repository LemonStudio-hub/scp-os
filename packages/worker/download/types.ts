import type { ApiError } from '../shared/types'

export interface DownloadRequest {
  url: string
  filename?: string
  rateLimit?: number
}

export interface DownloadProgress {
  downloadId: string
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'
  url: string
  filename: string
  totalBytes: number
  downloadedBytes: number
  progress: number
  speed: number
  startTime: number
  endTime?: number
  error?: string
  contentType?: string
}

export interface DownloadHistoryItem {
  id: string
  url: string
  filename: string
  totalBytes: number
  downloadedBytes: number
  status: 'completed' | 'failed' | 'cancelled'
  createdAt: string
  completedAt?: string
  error?: string
  contentType?: string
}

export interface DownloadHistoryResponse {
  success: boolean
  data: DownloadHistoryItem[]
  total: number
  error?: string
}

export interface DownloadInitResponse {
  success: boolean
  downloadId: string
  filename: string
  totalBytes: number
  contentType: string
  streamingUrl: string
  error?: string
}

export interface DownloadErrorResponse {
  success: false
  error: ApiError
}

export const DOWNLOAD_CONFIG = {
  maxFileSize: 500 * 1024 * 1024,
  maxUrlLength: 2048,
  allowedProtocols: ['http:', 'https:'],
  blockedHosts: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '::1',
    '169.254.',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
  ],
  rateLimit: {
    default: 0,
    min: 0,
    max: 50 * 1024 * 1024,
  },
  chunkSize: 64 * 1024,
  progressUpdateInterval: 500,
  maxRedirects: 5,
  cache: {
    enabled: true,
    maxCacheSize: 25 * 1024 * 1024,
    ttl: 3600,
  },
  streaming: {
    bufferSize: 64 * 1024,
  },
} as const

export type DownloadConfig = typeof DOWNLOAD_CONFIG

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

export interface DownloadInitResponse {
  success: boolean
  downloadId: string
  filename: string
  totalBytes: number
  contentType: string
  streamingUrl: string
  error?: string
}

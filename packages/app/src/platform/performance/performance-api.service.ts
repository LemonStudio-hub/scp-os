import type { PerformanceMetric, PerformanceReport } from './performance-monitor.service'
import { getAuthHeaders } from '../../utils/authFetch'
import logger from '../../utils/logger'

export class PerformanceApiService {
  private apiUrl: string
  private userId: string | null = null
  private isSending = false
  private sendInterval: number | null = null

  constructor(apiUrl: string = 'https://api.scpos.site/performance') {
    this.apiUrl = apiUrl
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  private async buildHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.userId) {
      const authHeaders = await getAuthHeaders(this.userId)
      headers['Authorization'] = authHeaders.Authorization
    }
    return headers
  }

  async sendMetrics(metrics: PerformanceMetric[]): Promise<boolean> {
    if (this.isSending) {
      logger.warn('Already sending metrics')
      return false
    }

    this.isSending = true

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: await this.buildHeaders(),
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          metrics: metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      logger.info('Metrics sent successfully', result)
      return true
    } catch (error) {
      logger.error('Failed to send metrics', error)
      return false
    } finally {
      this.isSending = false
    }
  }

  async sendReport(report: PerformanceReport): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: await this.buildHeaders(),
        body: JSON.stringify({
          type: 'report',
          timestamp: new Date().toISOString(),
          report: report,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      logger.info('Report sent successfully')
      return true
    } catch (error) {
      logger.error('Failed to send report', error)
      return false
    }
  }

  async getRecentMetrics(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}?limit=${limit}`, {
        method: 'GET',
        headers: await this.buildHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.metrics || []
    } catch (error) {
      logger.error('Failed to retrieve metrics', error)
      return []
    }
  }

  startAutoSend(intervalMs: number = 60000, metricsProvider: () => PerformanceMetric[]): void {
    if (this.sendInterval) {
      logger.warn('Auto-send already started')
      return
    }

    logger.info(`Starting auto-send every ${intervalMs}ms`)

    this.sendInterval = window.setInterval(async () => {
      const metrics = metricsProvider()
      if (metrics.length > 0) {
        await this.sendMetrics(metrics)
      }
    }, intervalMs)
  }

  stopAutoSend(): void {
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
      this.sendInterval = null
      logger.info('Auto-send stopped')
    }
  }

  async getApiStatus(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: await this.buildHeaders(),
      })

      return response.ok
    } catch (error) {
      logger.error('API status check failed', error)
      return false
    }
  }
}

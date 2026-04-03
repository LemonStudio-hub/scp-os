/**
 * Performance API Service
 * Handles communication with the backend performance monitoring API
 */

import type { PerformanceMetric, PerformanceReport } from './performance-monitor.service'

/**
 * Performance API Service
 */
export class PerformanceApiService {
  private apiUrl: string
  private isSending = false
  private sendInterval: number | null = null

  constructor(apiUrl: string = 'https://api.scpos.site/performance') {
    this.apiUrl = apiUrl
  }

  /**
   * Send performance metrics to the backend
   * @param metrics Performance metrics to send
   * @returns Promise<boolean> Success status
   */
  async sendMetrics(metrics: PerformanceMetric[]): Promise<boolean> {
    if (this.isSending) {
      console.warn('[PerformanceAPI] Already sending metrics')
      return false
    }

    this.isSending = true

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.log('[PerformanceAPI] Metrics sent successfully', result)
      return true
    } catch (error) {
      console.error('[PerformanceAPI] Failed to send metrics', error)
      return false
    } finally {
      this.isSending = false
    }
  }

  /**
   * Send performance report to the backend
   * @param report Performance report to send
   * @returns Promise<boolean> Success status
   */
  async sendReport(report: PerformanceReport): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      console.log('[PerformanceAPI] Report sent successfully')
      return true
    } catch (error) {
      console.error('[PerformanceAPI] Failed to send report', error)
      return false
    }
  }

  /**
   * Retrieve recent metrics from the backend
   * @param limit Maximum number of metrics to retrieve
   * @returns Promise<any[]> Array of metrics
   */
  async getRecentMetrics(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.metrics || []
    } catch (error) {
      console.error('[PerformanceAPI] Failed to retrieve metrics', error)
      return []
    }
  }

  /**
   * Start automatic metrics transmission
   * @param intervalMs Interval in milliseconds
   * @param metricsProvider Function to provide metrics
   */
  startAutoSend(intervalMs: number = 60000, metricsProvider: () => PerformanceMetric[]): void {
    if (this.sendInterval) {
      console.warn('[PerformanceAPI] Auto-send already started')
      return
    }

    console.log(`[PerformanceAPI] Starting auto-send every ${intervalMs}ms`)
    
    this.sendInterval = window.setInterval(async () => {
      const metrics = metricsProvider()
      if (metrics.length > 0) {
        await this.sendMetrics(metrics)
      }
    }, intervalMs)
  }

  /**
   * Stop automatic metrics transmission
   */
  stopAutoSend(): void {
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
      this.sendInterval = null
      console.log('[PerformanceAPI] Auto-send stopped')
    }
  }

  /**
   * Get API status
   * @returns Promise<boolean> API availability status
   */
  async getApiStatus(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('[PerformanceAPI] API status check failed', error)
      return false
    }
  }
}
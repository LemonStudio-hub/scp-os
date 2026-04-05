/**
 * Performance Monitor Service
 * Collects real browser performance metrics using native APIs
 * Provides meaningful data with actionable insights
 */

import type { IEventBus } from '../events/event-bus'

/**
 * Performance Metric
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

/**
 * Performance Report
 */
export interface PerformanceReport {
  id: string
  timestamp: Date
  score: number
  issues: PerformanceIssue[]
  recommendations: string[]
  metrics: PerformanceMetric[]
  webVitals: WebVitals
  fps: FPSInfo
  network: NetworkInfo | null
}

/**
 * Performance Issue
 */
export interface PerformanceIssue {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation?: string
  component?: string
}

/**
 * Web Vitals
 */
export interface WebVitals {
  lcp: number | null       // Largest Contentful Paint (ms)
  cls: number | null       // Cumulative Layout Shift
  inp: number | null       // Interaction to Next Paint (ms)
  fcp: number | null       // First Contentful Paint (ms)
  ttfb: number | null      // Time to First Byte (ms)
}

/**
 * Network Info
 */
export interface NetworkInfo {
  effectiveType: string    // 'slow-2g' | '2g' | '3g' | '4g'
  downlink: number         // Mbps
  rtt: number              // ms
  saveData: boolean
  type: string             // 'wifi' | 'cellular' | 'ethernet' etc.
}

/**
 * Storage Info
 */
export interface StorageInfo {
  usage: number            // bytes
  quota: number            // bytes
  usagePercent: number
}

/**
 * FPS Monitor
 */
export interface FPSInfo {
  current: number
  min: number
  max: number
  avg: number
  frames: number
  droppedFrames: number
}

/**
 * Performance Monitor Service
 */
export class PerformanceMonitorService {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private eventBus: IEventBus | null = null
  private isMonitoring = false
  private monitoringInterval: number | null = null
  private fpsInfo: FPSInfo = { current: 60, min: 60, max: 60, avg: 60, frames: 0, droppedFrames: 0 }
  private webVitals: WebVitals = { lcp: null, cls: null, inp: null, fcp: null, ttfb: null }
  private fpsRAF: number | null = null

  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
    this.initWebVitals()
    this.startFPSMonitor()
  }

  /**
   * Initialize Web Vitals observers
   */
  private initWebVitals(): void {
    // Navigation timing for TTFB and FCP
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming
        this.webVitals.ttfb = nav.responseStart - nav.requestStart
        this.webVitals.fcp = nav.domContentLoadedEventEnd - nav.startTime
      }
    }

    // LCP observer
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any
          this.webVitals.lcp = lastEntry.startTime
          this.recordMetric('web-vitals-lcp', lastEntry.startTime, 'ms')
        }
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch { /* LCP not supported */ }

    // CLS observer
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.webVitals.cls = clsValue
        this.recordMetric('web-vitals-cls', clsValue, 'score')
      })
      observer.observe({ type: 'layout-shift', buffered: true })
    } catch { /* CLS not supported */ }

    // INP observer (formerly FID)
    try {
      const observer = new PerformanceObserver((list) => {
        let maxInp = 0
        for (const entry of list.getEntries()) {
          const duration = entry.duration || 0
          if (duration > maxInp) maxInp = duration
        }
        if (maxInp > 0) {
          this.webVitals.inp = maxInp
          this.recordMetric('web-vitals-inp', maxInp, 'ms')
        }
      })
      observer.observe({ type: 'event', buffered: true })
    } catch { /* INP not supported */ }
  }

  /**
   * Start FPS monitoring via requestAnimationFrame
   */
  private startFPSMonitor(): void {
    let lastTime = performance.now()
    let frames = 0
    let fpsValues: number[] = []
    let minFps = 60
    let maxFps = 60
    let totalFrames = 0
    let droppedFrames = 0

    const measureFPS = (now: number) => {
      frames++
      totalFrames++

      const delta = now - lastTime
      if (delta >= 1000) {
        const fps = Math.round((frames * 1000) / delta)
        fpsValues.push(fps)
        if (fpsValues.length > 30) fpsValues.shift()

        // Keep last 30 readings for average
        const avgFps = Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length)

        // Estimate dropped frames (expected 60fps)
        const expectedFrames = delta / (1000 / 60)
        if (frames < expectedFrames * 0.8) {
          droppedFrames += Math.round(expectedFrames - frames)
        }

        minFps = Math.min(minFps, fps)
        maxFps = Math.max(maxFps, fps)

        this.fpsInfo = {
          current: fps,
          min: minFps,
          max: maxFps,
          avg: avgFps,
          frames: totalFrames,
          droppedFrames,
        }

        this.recordMetric('fps-current', fps, 'fps')
        this.recordMetric('fps-avg', avgFps, 'fps')

        frames = 0
        lastTime = now
      }

      this.fpsRAF = requestAnimationFrame(measureFPS)
    }

    this.fpsRAF = requestAnimationFrame(measureFPS)
  }

  /**
   * Start monitoring
   * @param interval Monitoring interval in ms
   */
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
    }, interval)

    // Initial collection
    this.collectMetrics()
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    if (this.fpsRAF) {
      cancelAnimationFrame(this.fpsRAF)
      this.fpsRAF = null
    }

    this.isMonitoring = false
  }

  /**
   * Collect all performance metrics
   */
  private collectMetrics(): void {
    const now = new Date()

    // Memory metrics
    if (performance.memory) {
      const mem = performance.memory
      this.recordMetric('memory-used', mem.usedJSHeapSize, 'bytes', now)
      this.recordMetric('memory-total', mem.totalJSHeapSize, 'bytes', now)
      this.recordMetric('memory-limit', mem.jsHeapSizeLimit, 'bytes', now)
      this.recordMetric('memory-percent', (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100, '%', now)
    }

    // Navigation timing
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming
        this.recordMetric('page-load-time', nav.loadEventEnd - nav.startTime, 'ms', now)
        this.recordMetric('dom-interactive', nav.domInteractive - nav.startTime, 'ms', now)
        this.recordMetric('dom-complete', nav.domComplete - nav.startTime, 'ms', now)
        this.recordMetric('dns-time', nav.domainLookupEnd - nav.domainLookupStart, 'ms', now)
        this.recordMetric('tcp-time', nav.connectEnd - nav.connectStart, 'ms', now)
        this.recordMetric('ttfb', nav.responseStart - nav.requestStart, 'ms', now)
        this.recordMetric('download-time', nav.responseEnd - nav.responseStart, 'ms', now)
      }

      // Resource timing
      const resourceEntries = performance.getEntriesByType('resource')
      const totalResources = resourceEntries.length
      this.recordMetric('resource-count', totalResources, 'count', now)

      // Calculate resource stats
      if (totalResources > 0) {
        let totalDuration = 0
        let totalSize = 0
        let errorCount = 0

        for (const entry of resourceEntries) {
          const res = entry as PerformanceResourceTiming
          totalDuration += res.duration
          totalSize += (res.transferSize || 0)

          if (res.responseStatus && res.responseStatus >= 400) {
            errorCount++
          }
        }

        this.recordMetric('avg-resource-time', totalDuration / totalResources, 'ms', now)
        this.recordMetric('total-transfer-size', totalSize, 'bytes', now)
        this.recordMetric('resource-errors', errorCount, 'count', now)
      }
    }

    // DOM stats
    this.recordMetric('dom-nodes', document.querySelectorAll('*').length, 'count', now)

    // Network info
    const conn = (navigator as any).connection
    if (conn) {
      this.recordMetric('network-downlink', conn.downlink || 0, 'Mbps', now)
      this.recordMetric('network-rtt', conn.rtt || 0, 'ms', now)
    }

    // Storage estimation
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          this.recordMetric('storage-usage', estimate.usage, 'bytes', now)
          this.recordMetric('storage-quota', estimate.quota, 'bytes', now)
          this.recordMetric('storage-percent', (estimate.usage / estimate.quota) * 100, '%', now)
        }
      })
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string, timestamp: Date = new Date(), tags?: Record<string, string>): void {
    const metric: PerformanceMetric = { name, value, unit, timestamp, tags }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metricArray = this.metrics.get(name)!
    metricArray.push(metric)

    // Keep only last 100 entries per metric
    if (metricArray.length > 100) {
      metricArray.shift()
    }

    if (this.eventBus) {
      this.eventBus.emit('performance:metric:recorded', { name, value, unit })
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || []
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys())
  }

  /**
   * Get latest metric by name
   */
  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetrics(name)
    return metrics.length > 0 ? metrics[metrics.length - 1] : null
  }

  /**
   * Get Web Vitals
   */
  getWebVitals(): WebVitals {
    return { ...this.webVitals }
  }

  /**
   * Get FPS info
   */
  getFPSInfo(): FPSInfo {
    return { ...this.fpsInfo }
  }

  /**
   * Get Network info
   */
  getNetworkInfo(): NetworkInfo | null {
    const conn = (navigator as any).connection
    if (!conn) return null

    return {
      effectiveType: conn.effectiveType || 'unknown',
      downlink: conn.downlink || 0,
      rtt: conn.rtt || 0,
      saveData: conn.saveData || false,
      type: conn.type || 'unknown',
    }
  }

  /**
   * Get DOM node count
   */
  getDOMNodeCount(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const now = new Date()
    const issues: PerformanceIssue[] = []
    const recommendations: string[] = []
    const metrics: PerformanceMetric[] = []

    // Collect all latest metrics
    for (const name of this.getMetricNames()) {
      const latest = this.getLatestMetric(name)
      if (latest) metrics.push(latest)

      // Analyze metric and generate issues
      this.analyzeMetric(latest, issues)
    }

    // Calculate overall score
    const score = this.calculateScore(issues)

    return {
      id: `perf-${now.getTime()}`,
      timestamp: now,
      score,
      issues,
      recommendations,
      metrics,
      webVitals: this.getWebVitals(),
      fps: this.getFPSInfo(),
      network: this.getNetworkInfo(),
    }
  }

  /**
   * Analyze a metric and generate issues
   * @param metric Performance metric
   * @param issues Issues array to populate
   */
  private analyzeMetric(metric: PerformanceMetric | null, issues: PerformanceIssue[]): void {
    if (!metric) return

    switch (metric.name) {
      case 'memory-percent':
        if (metric.value > 80) {
          issues.push({
            id: 'high-memory',
            severity: metric.value > 90 ? 'critical' : 'high',
            title: 'High Memory Usage',
            description: `JS heap is at ${metric.value.toFixed(1)}% of limit`,
            recommendation: 'Close unused tabs or reload the page to free memory',
            component: 'Memory',
          })
        }
        break
      case 'page-load-time':
        if (metric.value > 3000) {
          issues.push({
            id: 'slow-page-load',
            severity: metric.value > 5000 ? 'high' : 'medium',
            title: 'Slow Page Load',
            description: `Page load time is ${metric.value.toFixed(0)}ms`,
            recommendation: 'Optimize initial load by implementing code splitting and lazy loading',
            component: 'Navigation',
          })
        }
        break
      case 'avg-resource-time':
        if (metric.value > 1000) {
          issues.push({
            id: 'slow-resource-loading',
            severity: metric.value > 2000 ? 'high' : 'medium',
            title: 'Slow Resource Loading',
            description: `Average resource load time is ${metric.value.toFixed(0)}ms`,
            recommendation: 'Optimize resource sizes and implement caching',
            component: 'Network',
          })
        }
        break
      case 'resource-errors':
        if (metric.value > 0) {
          issues.push({
            id: 'resource-errors',
            severity: metric.value > 5 ? 'high' : 'medium',
            title: `${metric.value} Resource Load Errors`,
            description: 'Some resources failed to load',
            recommendation: 'Check network tab for failed requests and fix broken URLs',
            component: 'Network',
          })
        }
        break
    }
  }

  /**
   * Calculate performance score
   * @param issues Performance issues
   * @returns Score (0-100)
   */
  private calculateScore(issues: PerformanceIssue[]): number {
    let score = 100
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 25; break
        case 'high': score -= 15; break
        case 'medium': score -= 8; break
        case 'low': score -= 3; break
      }
    }
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()

    if (this.eventBus) {
      this.eventBus.emit('performance:metrics:cleared', {})
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isMonitoring: boolean; metricCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      metricCount: this.metrics.size,
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stopMonitoring()
    this.metrics.clear()
  }
}

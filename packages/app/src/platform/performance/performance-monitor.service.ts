/**
 * Performance Monitor Service
 * Monitors and reports application performance metrics
 */

import type { IEventBus } from '../events/event-bus'

/**
 * Performance Metric
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string
  /** Metric value */
  value: number
  /** Metric unit */
  unit: string
  /** Metric timestamp */
  timestamp: Date
  /** Metric tags */
  tags?: Record<string, string>
}

/**
 * Performance Report
 */
export interface PerformanceReport {
  /** Report ID */
  id: string
  /** Report timestamp */
  timestamp: Date
  /** Overall score (0-100) */
  score: number
  /** Metrics */
  metrics: PerformanceMetric[]
  /** Recommendations */
  recommendations: string[]
  /** Issues identified */
  issues: PerformanceIssue[]
}

/**
 * Performance Issue
 */
export interface PerformanceIssue {
  /** Issue ID */
  id: string
  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Issue title */
  title: string
  /** Issue description */
  description: string
  /** Affected component */
  component?: string
  /** Recommendation */
  recommendation?: string
}

/**
 * Performance Monitor Service
 */
export class PerformanceMonitorService {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private eventBus: IEventBus | null = null
  private isMonitoring = false
  private monitoringInterval: number | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Start monitoring
   * @param interval Monitoring interval in ms
   */
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('[PerformanceMonitor] Already monitoring')
      return
    }
    
    this.isMonitoring = true
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
    }, interval)
    
    if (this.eventBus) {
      this.eventBus.emit('performance:monitoring:started', {})
    }
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    this.isMonitoring = false
    
    if (this.eventBus) {
      this.eventBus.emit('performance:monitoring:stopped', {})
    }
  }
  
  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    const now = new Date()
    
    // Memory metrics
    if (performance.memory) {
      this.recordMetric('memory-used', performance.memory.usedJSHeapSize, 'bytes', now, {
        memoryType: 'used'
      })
      this.recordMetric('memory-total', performance.memory.totalJSHeapSize, 'bytes', now, {
        memoryType: 'total'
      })
      this.recordMetric('memory-limit', performance.memory.jsHeapSizeLimit, 'bytes', now, {
        memoryType: 'limit'
      })
    }
    
    // Navigation timing
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming
        this.recordMetric('page-load-time', navEntry.domContentLoadedEventEnd - navEntry.startTime, 'ms', now)
        this.recordMetric('dom-interactive', navEntry.domInteractive - navEntry.startTime, 'ms', now)
        this.recordMetric('dom-complete', navEntry.domComplete - navEntry.startTime, 'ms', now)
      }
    }
    
    // Network timing
    if (performance.getEntriesByType) {
      const resourceEntries = performance.getEntriesByType('resource')
      const totalResources = resourceEntries.length
      this.recordMetric('resource-count', totalResources, 'count', now)
      
      const resourceTimingSum = resourceEntries.reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).duration, 0)
      const avgResourceTiming = totalResources > 0 ? resourceTimingSum / totalResources : 0
      this.recordMetric('avg-resource-time', avgResourceTiming, 'ms', now)
    }
  }
  
  /**
   * Record a metric
   * @param name Metric name
   * @param value Metric value
   * @param unit Metric unit
   * @param timestamp Timestamp
   * @param tags Optional tags
   */
  recordMetric(name: string, value: number, unit: string, timestamp: Date = new Date(), tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp,
      tags
    }
    
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
   * @param name Metric name
   * @returns Array of metrics
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || []
  }
  
  /**
   * Get all metric names
   * @returns Array of metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys())
  }
  
  /**
   * Get latest metric by name
   * @param name Metric name
   * @returns Latest metric or null
   */
  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetrics(name)
    return metrics.length > 0 ? metrics[metrics.length - 1] : null
  }
  
  /**
   * Generate performance report
   * @returns Performance report
   */
  generateReport(): PerformanceReport {
    const now = new Date()
    const metrics: PerformanceMetric[] = []
    const issues: PerformanceIssue[] = []
    const recommendations: string[] = []
    
    // Collect all latest metrics
    for (const name of this.getMetricNames()) {
      const latest = this.getLatestMetric(name)
      if (latest) {
        metrics.push(latest)
        
        // Analyze metric and generate issues
        this.analyzeMetric(latest, issues)
      }
    }
    
    // Calculate overall score
    const score = this.calculateScore(issues)
    
    return {
      id: `perf-${now.getTime()}`,
      timestamp: now,
      score,
      metrics,
      recommendations,
      issues
    }
  }
  
  /**
   * Analyze a metric and generate issues
   * @param metric Performance metric
   * @param issues Issues array to populate
   */
  private analyzeMetric(metric: PerformanceMetric, issues: PerformanceIssue[]): void {
    switch (metric.name) {
      case 'memory-used':
        if (performance.memory && metric.value > performance.memory.jsHeapSizeLimit * 0.8) {
          issues.push({
            id: 'high-memory-usage',
            severity: 'high',
            title: 'High Memory Usage',
            description: `Memory usage is at ${((metric.value / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)}% of limit`,
            recommendation: 'Consider implementing memory cleanup or reducing data retention'
          })
        }
        break
        
      case 'page-load-time':
        if (metric.value > 3000) {
          issues.push({
            id: 'slow-page-load',
            severity: 'medium',
            title: 'Slow Page Load',
            description: `Page load time is ${metric.value}ms`,
            recommendation: 'Optimize initial load by implementing code splitting and lazy loading'
          })
        }
        break
        
      case 'avg-resource-time':
        if (metric.value > 1000) {
          issues.push({
            id: 'slow-resource-loading',
            severity: 'medium',
            title: 'Slow Resource Loading',
            description: `Average resource load time is ${metric.value}ms`,
            recommendation: 'Optimize resource sizes and implement caching'
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
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }
    
    return Math.max(0, score)
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
   * @returns Monitoring status
   */
  getStatus(): {
    isMonitoring: boolean
    metricCount: number
    latestReport: PerformanceReport | null
  } {
    return {
      isMonitoring: this.isMonitoring,
      metricCount: this.metrics.size,
      latestReport: null // TODO: Cache latest report
    }
  }
}
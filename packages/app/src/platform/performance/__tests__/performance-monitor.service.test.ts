/**
 * Performance Monitor Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceMonitorService } from '../performance-monitor.service'
import type { IEventBus } from '../../events/event-bus'

// Mock EventBus
const mockEventBus: IEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
  listenerCount: vi.fn(() => 0)
}

describe('PerformanceMonitorService', () => {
  let monitor: PerformanceMonitorService
  
  beforeEach(() => {
    monitor = new PerformanceMonitorService(mockEventBus)
    vi.clearAllMocks()
  })
  
  describe('Initialization', () => {
    it('should initialize without event bus', () => {
      const monitorWithoutEventBus = new PerformanceMonitorService()
      expect(monitorWithoutEventBus).toBeDefined()
    })
    
    it('should initialize with event bus', () => {
      expect(monitor).toBeDefined()
    })
  })
  
  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      monitor.startMonitoring()
      const status = monitor.getStatus()
      expect(status.isMonitoring).toBe(true)
    })
    
    it('should stop monitoring', () => {
      monitor.startMonitoring()
      monitor.stopMonitoring()
      const status = monitor.getStatus()
      expect(status.isMonitoring).toBe(false)
    })
    
    it('should not start monitoring twice', () => {
      monitor.startMonitoring()
      monitor.startMonitoring()
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
    })
    
    it('should emit event when monitoring starts', () => {
      monitor.startMonitoring()
      expect(mockEventBus.emit).toHaveBeenCalledWith('performance:monitoring:started', {})
    })
    
    it('should emit event when monitoring stops', () => {
      monitor.startMonitoring()
      monitor.stopMonitoring()
      // Check that stop event was emitted (among other possible events)
      const emitMock = vi.mocked(mockEventBus.emit)
      const calls = emitMock.mock.calls
      const stopCall = calls.find((c: [string, any]) => c[0] === 'performance:monitoring:stopped')
      expect(stopCall).toBeDefined()
    })
  })
  
  describe('Metric Recording', () => {
    it('should record metric', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      const metrics = monitor.getMetrics('test-metric')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].name).toBe('test-metric')
      expect(metrics[0].value).toBe(100)
      expect(metrics[0].unit).toBe('ms')
    })
    
    it('should record multiple metrics', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      monitor.recordMetric('test-metric', 200, 'ms')
      monitor.recordMetric('test-metric', 300, 'ms')
      const metrics = monitor.getMetrics('test-metric')
      expect(metrics).toHaveLength(3)
    })
    
    it('should keep only last 100 metrics', () => {
      for (let i = 0; i < 105; i++) {
        monitor.recordMetric('test-metric', i, 'ms')
      }
      const metrics = monitor.getMetrics('test-metric')
      expect(metrics).toHaveLength(100)
      expect(metrics[0].value).toBe(5) // First 5 should be removed
    })
    
    it('should record metric with tags', () => {
      monitor.recordMetric('test-metric', 100, 'ms', new Date(), { tag1: 'value1' })
      const metrics = monitor.getMetrics('test-metric')
      expect(metrics[0].tags).toEqual({ tag1: 'value1' })
    })
    
    it('should emit event when metric is recorded', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      expect(mockEventBus.emit).toHaveBeenCalledWith('performance:metric:recorded', {
        name: 'test-metric',
        value: 100,
        unit: 'ms'
      })
    })
  })
  
  describe('Metric Retrieval', () => {
    beforeEach(() => {
      monitor.recordMetric('metric1', 100, 'ms')
      monitor.recordMetric('metric2', 200, 'bytes')
      monitor.recordMetric('metric1', 150, 'ms')
    })
    
    it('should get metrics by name', () => {
      const metrics = monitor.getMetrics('metric1')
      expect(metrics).toHaveLength(2)
      expect(metrics[0].value).toBe(100)
      expect(metrics[1].value).toBe(150)
    })
    
    it('should return empty array for non-existent metric', () => {
      const metrics = monitor.getMetrics('non-existent')
      expect(metrics).toEqual([])
    })
    
    it('should get all metric names', () => {
      const names = monitor.getMetricNames()
      expect(names).toContain('metric1')
      expect(names).toContain('metric2')
    })
    
    it('should get latest metric', () => {
      const latest = monitor.getLatestMetric('metric1')
      expect(latest?.value).toBe(150)
    })
    
    it('should return null for non-existent latest metric', () => {
      const latest = monitor.getLatestMetric('non-existent')
      expect(latest).toBeNull()
    })
  })
  
  describe('Performance Report Generation', () => {
    it('should generate report with metrics', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      const report = monitor.generateReport()
      
      expect(report.id).toMatch(/^perf-/)
      expect(report.timestamp).toBeInstanceOf(Date)
      expect(report.metrics).toHaveLength(1)
      expect(report.metrics[0].name).toBe('test-metric')
    })
    
    it('should generate report with score', () => {
      const report = monitor.generateReport()
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.score).toBeLessThanOrEqual(100)
    })
    
    it('should generate report with issues', () => {
      const report = monitor.generateReport()
      expect(Array.isArray(report.issues)).toBe(true)
    })
    
    it('should generate report with recommendations', () => {
      const report = monitor.generateReport()
      expect(Array.isArray(report.recommendations)).toBe(true)
    })
  })
  
  describe('Clear Metrics', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      monitor.clear()
      const names = monitor.getMetricNames()
      expect(names).toHaveLength(0)
    })
    
    it('should emit event when metrics are cleared', () => {
      monitor.clear()
      expect(mockEventBus.emit).toHaveBeenCalledWith('performance:metrics:cleared', {})
    })
  })
  
  describe('Status', () => {
    it('should return monitoring status', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      const status = monitor.getStatus()
      
      expect(status.isMonitoring).toBe(false)
      expect(status.metricCount).toBe(1)
    })
  })
})
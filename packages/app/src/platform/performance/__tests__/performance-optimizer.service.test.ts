/**
 * Performance Optimizer Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PerformanceOptimizerService } from '../performance-optimizer.service'
import type { PerformanceIssue } from '../performance-monitor.service'

describe('PerformanceOptimizerService', () => {
  let optimizer: PerformanceOptimizerService
  
  beforeEach(() => {
    optimizer = new PerformanceOptimizerService()
  })
  
  describe('Initialization', () => {
    it('should initialize with strategies', () => {
      const strategies = optimizer.getAllStrategies()
      expect(strategies.length).toBeGreaterThan(0)
    })
  })
  
  describe('Strategy Retrieval', () => {
    it('should get all strategies', () => {
      const strategies = optimizer.getAllStrategies()
      expect(strategies.length).toBe(6)
    })
    
    it('should get strategy by type', () => {
      const codeStrategies = optimizer.getStrategiesByType('code')
      expect(codeStrategies.length).toBeGreaterThan(0)
      codeStrategies.forEach(strategy => {
        expect(strategy.type).toBe('code')
      })
    })
    
    it('should get strategy by ID', () => {
      const strategy = optimizer.getStrategy('code-splitting')
      expect(strategy).toBeDefined()
      expect(strategy?.id).toBe('code-splitting')
      expect(strategy?.name).toBe('Code Splitting')
    })
    
    it('should return null for non-existent strategy', () => {
      const strategy = optimizer.getStrategy('non-existent')
      expect(strategy).toBeNull()
    })
    
    it('should get strategies by effort', () => {
      const lowEffortStrategies = optimizer.getStrategiesByEffort('low')
      expect(lowEffortStrategies.length).toBeGreaterThan(0)
      lowEffortStrategies.forEach(strategy => {
        expect(strategy.effort).toBe('low')
      })
    })
  })
  
  describe('Strategy Properties', () => {
    it('should have valid strategy properties', () => {
      const strategies = optimizer.getAllStrategies()
      
      strategies.forEach(strategy => {
        expect(strategy.id).toBeTruthy()
        expect(strategy.name).toBeTruthy()
        expect(strategy.description).toBeTruthy()
        expect(strategy.type).toBeTruthy()
        expect(strategy.estimatedImprovement).toBeTruthy()
        expect(strategy.effort).toBeTruthy()
        expect(strategy.steps).toBeInstanceOf(Array)
        expect(strategy.steps.length).toBeGreaterThan(0)
      })
    })
    
    it('should have valid effort values', () => {
      const strategies = optimizer.getAllStrategies()
      const validEfforts = ['low', 'medium', 'high']
      
      strategies.forEach(strategy => {
        expect(validEfforts).toContain(strategy.effort)
      })
    })
    
    it('should have valid type values', () => {
      const strategies = optimizer.getAllStrategies()
      const validTypes = ['code', 'configuration', 'resource', 'architecture']
      
      strategies.forEach(strategy => {
        expect(validTypes).toContain(strategy.type)
      })
    })
  })
  
  describe('Recommendation System', () => {
    it('should recommend strategies for memory issues', () => {
      const issues: PerformanceIssue[] = [
        {
          id: 'high-memory-usage',
          severity: 'high',
          title: 'High Memory Usage',
          description: 'Memory usage is at 90% of limit'
        }
      ]
      
      const recommendations = optimizer.recommendOptimizations(issues)
      expect(recommendations.length).toBeGreaterThan(0)
      
      const hasMemoryOptimization = recommendations.some(
        strategy => strategy.id === 'memory-optimization'
      )
      expect(hasMemoryOptimization).toBe(true)
    })
    
    it('should recommend strategies for load time issues', () => {
      const issues: PerformanceIssue[] = [
        {
          id: 'slow-page-load',
          severity: 'medium',
          title: 'Slow Page Load',
          description: 'Page load time is 4000ms'
        }
      ]
      
      const recommendations = optimizer.recommendOptimizations(issues)
      expect(recommendations.length).toBeGreaterThan(0)
      
      const hasCodeSplitting = recommendations.some(
        strategy => strategy.id === 'code-splitting'
      )
      expect(hasCodeSplitting).toBe(true)
    })
    
    it('should recommend strategies for resource issues', () => {
      const issues: PerformanceIssue[] = [
        {
          id: 'slow-resource-loading',
          severity: 'medium',
          title: 'Slow Resource Loading',
          description: 'Average resource load time is 1200ms'
        }
      ]
      
      const recommendations = optimizer.recommendOptimizations(issues)
      expect(recommendations.length).toBeGreaterThan(0)
      
      const hasImageOptimization = recommendations.some(
        strategy => strategy.id === 'image-optimization'
      )
      expect(hasImageOptimization).toBe(true)
    })
    
    it('should return empty recommendations for no issues', () => {
      const issues: PerformanceIssue[] = []
      const recommendations = optimizer.recommendOptimizations(issues)
      expect(recommendations).toEqual([])
    })
  })
  
  describe('Optimization Plan', () => {
    it('should create optimization plan', () => {
      const issues: PerformanceIssue[] = [
        {
          id: 'high-memory-usage',
          severity: 'high',
          title: 'High Memory Usage',
          description: 'Memory usage is at 90% of limit'
        }
      ]
      
      const plan = optimizer.createOptimizationPlan(issues)
      
      expect(plan).toBeDefined()
      expect(plan.issues).toEqual(issues)
      expect(plan.strategies).toBeInstanceOf(Array)
      expect(plan.estimatedTotalImprovement).toBeTruthy()
    })
    
    it('should calculate total improvement estimate', () => {
      const issues: PerformanceIssue[] = [
        {
          id: 'high-memory-usage',
          severity: 'high',
          title: 'High Memory Usage',
          description: 'Memory usage is at 90% of limit'
        },
        {
          id: 'slow-page-load',
          severity: 'medium',
          title: 'Slow Page Load',
          description: 'Page load time is 4000ms'
        }
      ]
      
      const plan = optimizer.createOptimizationPlan(issues)
      // Extract numeric value from percentage string (e.g., "100%")
      const improvementValue = parseFloat(plan.estimatedTotalImprovement.replace('%', ''))
      expect(improvementValue).toBeGreaterThan(0)
    })
  })
  
  describe('Implementation Validation', () => {
    it('should validate implementation', () => {
      const validation = optimizer.validateImplementation('code-splitting')
      
      expect(validation).toBeDefined()
      expect(validation.valid).toBe(false) // No implementation yet
      expect(validation.checks).toBeDefined()
      expect(validation.missingSteps).toBeInstanceOf(Array)
    })
    
    it('should throw error for non-existent strategy', () => {
      expect(() => {
        optimizer.validateImplementation('non-existent')
      }).toThrow()
    })
    
    it('should return missing steps', () => {
      const validation = optimizer.validateImplementation('code-splitting')
      expect(validation.missingSteps.length).toBeGreaterThan(0)
    })
  })
})
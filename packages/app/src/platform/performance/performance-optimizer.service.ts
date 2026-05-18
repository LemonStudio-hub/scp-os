/**
 * Performance Optimizer Service
 * Provides performance optimization strategies and tools
 */

import type { PerformanceIssue } from './performance-monitor.service'

/**
 * Optimization Strategy
 */
export interface OptimizationStrategy {
  /** Strategy ID */
  id: string
  /** Strategy name */
  name: string
  /** Strategy description */
  description: string
  /** Strategy type */
  type: 'code' | 'configuration' | 'resource' | 'architecture'
  /** Estimated improvement */
  estimatedImprovement: string
  /** Implementation effort */
  effort: 'low' | 'medium' | 'high'
  /** Implementation steps */
  steps: string[]
}

/**
 * Performance Optimizer Service
 */
export class PerformanceOptimizerService {
  private strategies: OptimizationStrategy[] = []

  constructor() {
    this.initializeStrategies()
  }

  /**
   * Initialize optimization strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        id: 'code-splitting',
        name: 'Code Splitting',
        description: 'Split code into smaller chunks for lazy loading',
        type: 'code',
        estimatedImprovement: '30-40%',
        effort: 'medium',
        steps: [
          'Identify large JavaScript bundles',
          'Configure dynamic imports for routes and components',
          'Implement lazy loading for heavy modules',
          'Test performance improvement',
        ],
      },
      {
        id: 'image-optimization',
        name: 'Image Optimization',
        description: 'Optimize images for web delivery',
        type: 'resource',
        estimatedImprovement: '40-60%',
        effort: 'low',
        steps: [
          'Convert images to modern formats (WebP, AVIF)',
          'Implement responsive images',
          'Add lazy loading for images',
          'Optimize image compression',
        ],
      },
      {
        id: 'caching-strategy',
        name: 'Caching Strategy',
        description: 'Implement intelligent caching',
        type: 'configuration',
        estimatedImprovement: '50-70%',
        effort: 'medium',
        steps: [
          'Implement service worker for caching',
          'Configure cache headers',
          'Implement cache invalidation strategy',
          'Monitor cache hit rates',
        ],
      },
      {
        id: 'bundle-analysis',
        name: 'Bundle Analysis',
        description: 'Analyze and optimize bundle size',
        type: 'code',
        estimatedImprovement: '20-30%',
        effort: 'low',
        steps: [
          'Analyze bundle size with tools',
          'Identify large dependencies',
          'Consider tree shaking unused code',
          'Replace heavy libraries with lighter alternatives',
        ],
      },
      {
        id: 'rendering-optimization',
        name: 'Rendering Optimization',
        description: 'Optimize rendering performance',
        type: 'architecture',
        estimatedImprovement: '15-25%',
        effort: 'high',
        steps: [
          'Implement virtual scrolling for long lists',
          'Optimize re-renders with memoization',
          'Implement requestAnimationFrame for animations',
          'Debounce expensive operations',
        ],
      },
      {
        id: 'memory-optimization',
        name: 'Memory Optimization',
        description: 'Optimize memory usage',
        type: 'code',
        estimatedImprovement: '20-30%',
        effort: 'medium',
        steps: [
          'Implement memory cleanup for unused data',
          'Use object pooling for frequently created objects',
          'Optimize data retention policies',
          'Implement lazy loading for large datasets',
        ],
      },
    ]
  }

  /**
   * Get all optimization strategies
   * @returns Array of strategies
   */
  getAllStrategies(): OptimizationStrategy[] {
    return this.strategies
  }

  /**
   * Get strategies by type
   * @param type Strategy type
   * @returns Array of strategies
   */
  getStrategiesByType(type: string): OptimizationStrategy[] {
    return this.strategies.filter((s) => s.type === type)
  }

  /**
   * Get strategy by ID
   * @param id Strategy ID
   * @returns Strategy or null
   */
  getStrategy(id: string): OptimizationStrategy | null {
    return this.strategies.find((s) => s.id === id) || null
  }

  /**
   * Get strategies by effort level
   * @param effort Effort level
   * @returns Array of strategies
   */
  getStrategiesByEffort(effort: string): OptimizationStrategy[] {
    return this.strategies.filter((s) => s.effort === effort)
  }

  /**
   * Analyze performance issues and recommend optimizations
   * @param issues Performance issues
   * @returns Recommended strategies
   */
  recommendOptimizations(issues: PerformanceIssue[]): OptimizationStrategy[] {
    const recommended: OptimizationStrategy[] = []

    // Analyze issues and recommend strategies
    const hasMemoryIssues = issues.some((i) => i.id === 'high-memory-usage')
    const hasLoadTimeIssues = issues.some((i) => i.id === 'slow-page-load')
    const hasResourceIssues = issues.some((i) => i.id === 'slow-resource-loading')

    if (hasMemoryIssues) {
      const s = this.getStrategy('memory-optimization')
      if (s) recommended.push(s)
    }

    if (hasLoadTimeIssues) {
      const s1 = this.getStrategy('code-splitting')
      const s2 = this.getStrategy('bundle-analysis')
      if (s1) recommended.push(s1)
      if (s2) recommended.push(s2)
    }

    if (hasResourceIssues) {
      const s1 = this.getStrategy('image-optimization')
      const s2 = this.getStrategy('caching-strategy')
      if (s1) recommended.push(s1)
      if (s2) recommended.push(s2)
    }

    return recommended
  }

  /**
   * Create optimization plan
   * @param issues Performance issues
   * @returns Optimization plan
   */
  createOptimizationPlan(issues: PerformanceIssue[]): {
    score: number
    currentScore: number
    issues: PerformanceIssue[]
    strategies: OptimizationStrategy[]
    estimatedTotalImprovement: string
  } {
    const recommended = this.recommendOptimizations(issues)

    // Estimate total improvement
    const estimatedTotalImprovement = recommended.reduce((sum, strategy) => {
      // Remove % from the string and split
      const cleanRange = strategy.estimatedImprovement
        .replace('%', '')
        .split('-')
        .map(Number)
        .filter((n) => !isNaN(n))
      const avgImprovement =
        cleanRange.length === 2 ? (cleanRange[0] + cleanRange[1]) / 2 : cleanRange[0] || 0
      return sum + avgImprovement
    }, 0)

    // Calculate current score based on issue severity
    const severityPenalty: Record<string, number> = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5,
    }
    const currentScore = Math.max(
      0,
      100 -
        issues.reduce((sum, issue) => {
          return sum + (severityPenalty[issue.severity] ?? 10)
        }, 0)
    )

    // Calculate projected score after applying optimizations
    const avgImprovement =
      recommended.length > 0 ? estimatedTotalImprovement / recommended.length : 0
    const score = Math.min(100, Math.round(currentScore + avgImprovement))

    return {
      score,
      currentScore: Math.round(currentScore),
      issues,
      strategies: recommended,
      estimatedTotalImprovement: `${estimatedTotalImprovement.toFixed(0)}%`,
    }
  }

  /**
   * Validate optimization strategy implementation
   * @param strategyId Strategy ID
   * @returns Validation result
   */
  /**
   * Mark a strategy step as implemented (persisted in localStorage)
   */
  markStepImplemented(strategyId: string, stepIndex: number): void {
    try {
      const key = `scp:perf-opt:${strategyId}`
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : []
      const completed: number[] = Array.isArray(parsed) ? parsed : []
      if (!completed.includes(stepIndex)) {
        completed.push(stepIndex)
        localStorage.setItem(key, JSON.stringify(completed))
      }
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Mark a strategy step as not implemented
   */
  markStepNotImplemented(strategyId: string, stepIndex: number): void {
    try {
      const key = `scp:perf-opt:${strategyId}`
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : []
      const completed: number[] = Array.isArray(parsed) ? parsed : []
      const filtered = completed.filter((i) => i !== stepIndex)
      localStorage.setItem(key, JSON.stringify(filtered))
    } catch {
      // ignore storage errors
    }
  }

  /**
   * Check if a specific step is marked as implemented
   */
  private isStepImplemented(strategyId: string, stepIndex: number): boolean {
    try {
      const raw = localStorage.getItem(`scp:perf-opt:${strategyId}`)
      const parsed = raw ? JSON.parse(raw) : []
      const completed: number[] = Array.isArray(parsed) ? parsed : []
      return completed.includes(stepIndex)
    } catch {
      return false
    }
  }

  /**
   * Validate optimization strategy implementation
   * @param strategyId Strategy ID
   * @returns Validation result
   */
  validateImplementation(strategyId: string): {
    valid: boolean
    checks: {
      [key: string]: boolean
    }
    missingSteps: string[]
  } {
    const strategy = this.getStrategy(strategyId)
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`)
    }

    const checks: { [key: string]: boolean } = {}
    const missingSteps: string[] = []

    strategy.steps.forEach((step, index) => {
      const key = `step-${index}`
      const implemented = this.isStepImplemented(strategyId, index)
      checks[key] = implemented
      if (!implemented) {
        missingSteps.push(step)
      }
    })

    return {
      valid: missingSteps.length === 0,
      checks,
      missingSteps,
    }
  }
}

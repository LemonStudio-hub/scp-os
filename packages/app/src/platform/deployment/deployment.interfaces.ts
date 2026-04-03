/**
 * Deployment System Interfaces
 * Defines deployment configuration and targets for the SCP-OS platform
 */

/**
 * Deployment Environment
 */
export type DeploymentEnvironment = 'development' | 'staging' | 'production'

/**
 * Deployment Target
 */
export interface DeploymentTarget {
  /** Target ID */
  id: string
  /** Target name */
  name: string
  /** Target type (e.g., 'vercel', 'netlify', 'cloudflare', 'docker') */
  type: 'vercel' | 'netlify' | 'cloudflare' | 'docker' | 'custom'
  /** Target URL */
  url?: string
  /** Target region */
  region?: string
  /** Target configuration */
  config: Record<string, any>
}

/**
 * Build Configuration
 */
export interface BuildConfiguration {
  /** Build command */
  command: string
  /** Output directory */
  output: string
  /** Environment variables */
  envVars: Record<string, string>
  /** Build optimizations */
  optimizations: {
    /** Minify code */
    minify: boolean
    /** Split code */
    codeSplitting: boolean
    /** Tree shaking */
    treeShaking: boolean
    /** Source maps */
    sourceMaps: boolean
  }
}

/**
 * Deployment Configuration
 */
export interface DeploymentConfiguration {
  /** Deployment name */
  name: string
  /** Deployment description */
  description: string
  /** Deployment environment */
  environment: DeploymentEnvironment
  /** Deployment targets */
  targets: DeploymentTarget[]
  /** Build configuration */
  build: BuildConfiguration
  /** Deployment strategy */
  strategy: 'manual' | 'automatic' | 'git'
  /** Git configuration */
  git?: {
    /** Repository URL */
    repository: string
    /** Branch */
    branch: string
    /** Commit message pattern */
    commitMessagePattern?: string
  }
  /** Environment variables */
  envVars: Record<string, string>
  /** Secrets (encrypted) */
  secrets: Record<string, string>
  /** Rollback configuration */
  rollback: {
    /** Enable automatic rollback on failure */
    enabled: boolean
    /** Maximum rollback attempts */
    maxAttempts: number
    /** Rollback timeout (ms) */
    timeout: number
  }
  /** Health check configuration */
  healthCheck: {
    /** Enable health check */
    enabled: boolean
    /** Health check endpoint */
    endpoint: string
    /** Health check interval (ms) */
    interval: number
    /** Health check timeout (ms) */
    timeout: number
    /** Unhealthy threshold */
    unhealthyThreshold: number
  }
}

/**
 * Deployment Status
 */
export interface DeploymentStatus {
  /** Deployment ID */
  id: string
  /** Status */
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rollback'
  /** Current step */
  currentStep: string
  /** Total steps */
  totalSteps: number
  /** Start time */
  startTime: Date
  /** End time */
  endTime?: Date
  /** Error message */
  error?: string
  /** Deployment URL */
  url?: string
}

/**
 * Deployment Result
 */
export interface DeploymentResult {
  /** Success flag */
  success: boolean
  /** Deployment status */
  status: DeploymentStatus
  /** Deployment URL */
  url?: string
  /** Error message */
  error?: string
  /** Logs */
  logs: DeploymentLog[]
}

/**
 * Deployment Log Entry
 */
export interface DeploymentLog {
  /** Timestamp */
  timestamp: Date
  /** Level */
  level: 'info' | 'warn' | 'error' | 'debug'
  /** Message */
  message: string
  /** Step */
  step?: string
}

/**
 * IDeploymentService
 * Interface for deployment services
 */
export interface IDeploymentService {
  /**
   * Get deployment configuration
   * @returns Deployment configuration
   */
  getConfiguration(): DeploymentConfiguration
  
  /**
   * Set deployment configuration
   * @param config New configuration
   */
  setConfiguration(config: DeploymentConfiguration): void
  
  /**
   * Validate deployment configuration
   * @returns Validation result
   */
  validateConfiguration(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
  
  /**
   * Build application
   * @returns Build result
   */
  build(): Promise<{
    success: boolean
    output: string
    logs: DeploymentLog[]
    error?: string
  }>
  
  /**
   * Deploy application
   * @param targetId Target ID
   * @param buildOutput Build output directory
   * @returns Deployment result
   */
  deploy(targetId: string, buildOutput: string): Promise<DeploymentResult>
  
  /**
   * Rollback deployment
   * @param deploymentId Deployment ID
   * @returns Rollback result
   */
  rollback(deploymentId: string): Promise<DeploymentResult>
  
  /**
   * Get deployment status
   * @param deploymentId Deployment ID
   * @returns Deployment status
   */
  getStatus(deploymentId: string): Promise<DeploymentStatus>
  
  /**
   * List deployments
   * @param limit Maximum number of deployments
   * @param offset Offset for pagination
   * @returns Array of deployment statuses
   */
  listDeployments(limit?: number, offset?: number): Promise<DeploymentStatus[]>
  
  /**
   * Get deployment logs
   * @param deploymentId Deployment ID
   * @returns Array of log entries
   */
  getLogs(deploymentId: string): Promise<DeploymentLog[]>
  
  /**
   * Cancel deployment
   * @param deploymentId Deployment ID
   */
  cancelDeployment(deploymentId: string): Promise<void>
}
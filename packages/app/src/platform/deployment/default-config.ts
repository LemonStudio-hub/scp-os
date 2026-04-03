/**
 * Default Deployment Configuration
 * Provides default deployment configurations for different environments
 */

import type { DeploymentConfiguration, DeploymentEnvironment } from './deployment.interfaces'

/**
 * Default Development Configuration
 */
export const DEFAULT_DEV_CONFIG: DeploymentConfiguration = {
  name: 'scp-os-development',
  description: 'Development environment for SCP-OS',
  environment: 'development',
  targets: [
    {
      id: 'local',
      name: 'Local Development',
      type: 'custom',
      config: {
        port: 5173,
        host: 'localhost'
      }
    }
  ],
  build: {
    command: 'npm run build:development',
    output: 'dist',
    envVars: {
      NODE_ENV: 'development',
      VITE_APP_ENV: 'development'
    },
    optimizations: {
      minify: false,
      codeSplitting: true,
      treeShaking: true,
      sourceMaps: true
    }
  },
  strategy: 'manual',
  envVars: {
    VITE_APP_NAME: 'SCP Foundation Terminal (Dev)',
    VITE_APP_VERSION: '0.0.0-dev'
  },
  secrets: {},
  rollback: {
    enabled: false,
    maxAttempts: 3,
    timeout: 30000
  },
  healthCheck: {
    enabled: false,
    endpoint: '/health',
    interval: 30000,
    timeout: 5000,
    unhealthyThreshold: 3
  }
}

/**
 * Default Staging Configuration
 */
export const DEFAULT_STAGING_CONFIG: DeploymentConfiguration = {
  name: 'scp-os-staging',
  description: 'Staging environment for SCP-OS',
  environment: 'staging',
  targets: [
    {
      id: 'vercel-staging',
      name: 'Vercel Staging',
      type: 'vercel',
      url: 'https://scp-os-staging.vercel.app',
      region: 'us-east-1',
      config: {
        framework: 'vite',
        installCommand: 'npm install',
        buildCommand: 'npm run build:production',
        outputDirectory: 'dist',
        devCommand: 'npm run dev'
      }
    }
  ],
  build: {
    command: 'npm run build:production',
    output: 'dist',
    envVars: {
      NODE_ENV: 'production',
      VITE_APP_ENV: 'staging'
    },
    optimizations: {
      minify: true,
      codeSplitting: true,
      treeShaking: true,
      sourceMaps: false
    }
  },
  strategy: 'git',
  git: {
    repository: 'https://github.com/LemonStudio-hub/scp-os.git',
    branch: 'main',
    commitMessagePattern: 'chore(release): v{version}'
  },
  envVars: {
    VITE_APP_NAME: 'SCP Foundation Terminal (Staging)',
    VITE_APP_VERSION: '0.0.0-staging'
  },
  secrets: {},
  rollback: {
    enabled: true,
    maxAttempts: 3,
    timeout: 60000
  },
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 30000,
    timeout: 10000,
    unhealthyThreshold: 3
  }
}

/**
 * Default Production Configuration
 */
export const DEFAULT_PROD_CONFIG: DeploymentConfiguration = {
  name: 'scp-os-production',
  description: 'Production environment for SCP-OS',
  environment: 'production',
  targets: [
    {
      id: 'vercel-production',
      name: 'Vercel Production',
      type: 'vercel',
      url: 'https://scp-os.vercel.app',
      region: 'us-east-1',
      config: {
        framework: 'vite',
        installCommand: 'npm install',
        buildCommand: 'npm run build:production',
        outputDirectory: 'dist',
        devCommand: 'npm run dev'
      }
    },
    {
      id: 'cloudflare-workers',
      name: 'Cloudflare Workers',
      type: 'cloudflare',
      url: 'https://api.woodcat.online',
      config: {
        type: 'workers',
        entrypoint: 'worker/index.ts',
        compatibility_date: '2024-01-01'
      }
    }
  ],
  build: {
    command: 'npm run build:production',
    output: 'dist',
    envVars: {
      NODE_ENV: 'production',
      VITE_APP_ENV: 'production'
    },
    optimizations: {
      minify: true,
      codeSplitting: true,
      treeShaking: true,
      sourceMaps: false
    }
  },
  strategy: 'git',
  git: {
    repository: 'https://github.com/LemonStudio-hub/scp-os.git',
    branch: 'main',
    commitMessagePattern: 'chore(release): v{version}'
  },
  envVars: {
    VITE_APP_NAME: 'SCP Foundation Terminal',
    VITE_APP_VERSION: '0.0.0'
  },
  secrets: {},
  rollback: {
    enabled: true,
    maxAttempts: 5,
    timeout: 120000
  },
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 60000,
    timeout: 15000,
    unhealthyThreshold: 5
  }
}

/**
 * Get default configuration for environment
 * @param environment Environment type
 * @returns Default configuration
 */
export function getDefaultConfiguration(environment: DeploymentEnvironment): DeploymentConfiguration {
  switch (environment) {
    case 'development':
      return DEFAULT_DEV_CONFIG
    case 'staging':
      return DEFAULT_STAGING_CONFIG
    case 'production':
      return DEFAULT_PROD_CONFIG
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
}
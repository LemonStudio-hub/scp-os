/**
 * Data Source Plugin Interface
 * Interface for data source plugins in the SCP-OS platform
 *
 * @deprecated Import directly from types.ts instead
 * @example
 * ```typescript
 * import type { DataSourcePlugin, DataSourceQueryOptions } from './types'
 * ```
 */

export type {
  DataSourcePlugin,
  DataSourceQueryOptions,
  DataSourceQueryResult,
  DataSourceMetadata,
  DataSourceDefinition,
} from './types'

/**
 * Data Source Plugin Factory
 * Factory function for creating data source plugins
 */
export type DataSourcePluginFactory = () => DataSourcePlugin | Promise<DataSourcePlugin>

import type { DataSourcePlugin } from './types'

/**
 * ToolRegistry — Decoupled tool module registration
 * Each tool registers itself with the registry, which provides:
 *   - Open window configuration
 *   - Component (desktop + mobile)
 *   - Store (optional)
 *
 * This eliminates the giant switch statement in App.vue/MobileApp.vue
 * and makes adding new tools a matter of calling `registerTool()`.
 */

import type { ToolType } from '../types'

// Opaque component type — used for dynamic component registration.
// We cannot use DefineComponent here because Vue SFCs have varying
// Props/Emits that don't unify. Since these are rendered via :is,
// runtime rendering handles the type compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolComponent = any

export interface ToolWindowConfig {
  /** Default window width */
  width?: number
  /** Default window height */
  height?: number
  /** Minimum window width */
  minWidth?: number
  /** Minimum window height */
  minHeight?: number
  /** Whether the window is resizable */
  resizable?: boolean
}

export interface ToolModule {
  /** Unique tool identifier (matches ToolType) */
  id: ToolType
  /** Display label — can be a static string or a function that returns the translated label */
  label: string | (() => string)
  /** Icon name (matches IconName) */
  icon: string
  /** Default window configuration */
  windowConfig: ToolWindowConfig
  /** Desktop window component */
  desktopComponent?: ToolComponent
  /** Mobile window component */
  mobileComponent: ToolComponent
  /** Pinia store factory (optional) */
  store?: () => void
  /** Called when tool is about to open */
  onOpen?: () => void
  /** Called when tool window is closed */
  onClose?: () => void
}

class ToolRegistryClass {
  private tools: Map<ToolType, ToolModule> = new Map()

  /**
   * Register a tool module. Overwrites existing registration.
   */
  register(tool: ToolModule): void {
    this.tools.set(tool.id, tool)
  }

  /**
   * Unregister a tool.
   */
  unregister(id: ToolType): void {
    this.tools.delete(id)
  }

  /**
   * Get a tool module by ID.
   */
  get(id: ToolType): ToolModule | undefined {
    return this.tools.get(id)
  }

  /**
   * Check if a tool is registered.
   */
  has(id: ToolType): boolean {
    return this.tools.has(id)
  }

  /**
   * Get all registered tool modules.
   */
  getAll(): ToolModule[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get all registered tool IDs.
   */
  getIds(): ToolType[] {
    return Array.from(this.tools.keys())
  }
}

// Singleton instance — modules import and use this
export const ToolRegistry = new ToolRegistryClass()

/**
 * Open a tool window using the registry's configuration.
 * This is the single entry point for opening any tool window.
 */
export function openTool(toolId: ToolType, openWindow: (config: {
  id: string
  tool: ToolType
  title: string
  iconName?: string
  width: number
  height: number
}) => void): void {
  const tool = ToolRegistry.get(toolId)
  if (!tool) {
    console.warn(`[ToolRegistry] Tool "${toolId}" is not registered`)
    return
  }

  tool.onOpen?.()

  // Resolve label — supports both static strings and translation functions
  const resolvedLabel = typeof tool.label === 'function' ? tool.label() : tool.label

  openWindow({
    id: `${toolId}-${Date.now()}`,
    tool: toolId,
    title: resolvedLabel,
    iconName: tool.icon,
    width: tool.windowConfig.width ?? 750,
    height: tool.windowConfig.height ?? 500,
  })
}

/**
 * Resolve a tool's label to a string (handles both static and function labels).
 */
export function getToolLabel(toolId: ToolType): string {
  const tool = ToolRegistry.get(toolId)
  if (!tool) return toolId
  return typeof tool.label === 'function' ? tool.label() : tool.label
}

/**
 * Capability Manager Service
 * Manages platform capabilities and their providers
 */

import type { ITerminalCapability, IDataCapability, IUICapability } from './capability.interfaces'
import type { IEventBus } from '../events/event-bus'

/**
 * Capability Manager Service
 * Central manager for all platform capabilities
 */
export class CapabilityManagerService {
  private terminalCapabilities: Map<string, ITerminalCapability> = new Map()
  private dataCapabilities: Map<string, IDataCapability> = new Map()
  private uiCapabilities: Map<string, IUICapability> = new Map()
  private eventBus: IEventBus | null = null
  
  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus || null
  }
  
  /**
   * Register a terminal capability
   * @param name Capability name
   * @param capability Terminal capability implementation
   */
  registerTerminalCapability(name: string, capability: ITerminalCapability): void {
    this.terminalCapabilities.set(name, capability)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:registered', { 
        type: 'terminal',
        name 
      })
    }
  }
  
  /**
   * Register a data capability
   * @param name Capability name
   * @param capability Data capability implementation
   */
  registerDataCapability(name: string, capability: IDataCapability): void {
    this.dataCapabilities.set(name, capability)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:registered', { 
        type: 'data',
        name 
      })
    }
  }
  
  /**
   * Register a UI capability
   * @param name Capability name
   * @param capability UI capability implementation
   */
  registerUICapability(name: string, capability: IUICapability): void {
    this.uiCapabilities.set(name, capability)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:registered', { 
        type: 'ui',
        name 
      })
    }
  }
  
  /**
   * Get terminal capability by name
   * @param name Capability name
   * @returns Terminal capability or null
   */
  getTerminalCapability(name: string): ITerminalCapability | null {
    return this.terminalCapabilities.get(name) || null
  }
  
  /**
   * Get data capability by name
   * @param name Capability name
   * @returns Data capability or null
   */
  getDataCapability(name: string): IDataCapability | null {
    return this.dataCapabilities.get(name) || null
  }
  
  /**
   * Get UI capability by name
   * @param name Capability name
   * @returns UI capability or null
   */
  getUICapability(name: string): IUICapability | null {
    return this.uiCapabilities.get(name) || null
  }
  
  /**
   * Get default terminal capability
   * @returns Default terminal capability or null
   */
  getDefaultTerminalCapability(): ITerminalCapability | null {
    const names = Array.from(this.terminalCapabilities.keys())
    if (names.length === 0) return null
    return this.terminalCapabilities.get(names[0]) || null
  }
  
  /**
   * Get default data capability
   * @returns Default data capability or null
   */
  getDefaultDataCapability(): IDataCapability | null {
    const names = Array.from(this.dataCapabilities.keys())
    if (names.length === 0) return null
    return this.dataCapabilities.get(names[0]) || null
  }
  
  /**
   * Get default UI capability
   * @returns Default UI capability or null
   */
  getDefaultUICapability(): IUICapability | null {
    const names = Array.from(this.uiCapabilities.keys())
    if (names.length === 0) return null
    return this.uiCapabilities.get(names[0]) || null
  }
  
  /**
   * Get all terminal capability names
   * @returns Array of capability names
   */
  getTerminalCapabilityNames(): string[] {
    return Array.from(this.terminalCapabilities.keys())
  }
  
  /**
   * Get all data capability names
   * @returns Array of capability names
   */
  getDataCapabilityNames(): string[] {
    return Array.from(this.dataCapabilities.keys())
  }
  
  /**
   * Get all UI capability names
   * @returns Array of capability names
   */
  getUICapabilityNames(): string[] {
    return Array.from(this.uiCapabilities.keys())
  }
  
  /**
   * Unregister a terminal capability
   * @param name Capability name
   */
  unregisterTerminalCapability(name: string): void {
    this.terminalCapabilities.delete(name)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:unregistered', { 
        type: 'terminal',
        name 
      })
    }
  }
  
  /**
   * Unregister a data capability
   * @param name Capability name
   */
  unregisterDataCapability(name: string): void {
    this.dataCapabilities.delete(name)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:unregistered', { 
        type: 'data',
        name 
      })
    }
  }
  
  /**
   * Unregister a UI capability
   * @param name Capability name
   */
  unregisterUICapability(name: string): void {
    this.uiCapabilities.delete(name)
    
    if (this.eventBus) {
      this.eventBus.emit('capability:unregistered', { 
        type: 'ui',
        name 
      })
    }
  }
  
  /**
   * Get capability statistics
   * @returns Statistics about registered capabilities
   */
  getStatistics(): {
    terminalCapabilities: number
    dataCapabilities: number
    uiCapabilities: number
    totalCapabilities: number
  } {
    return {
      terminalCapabilities: this.terminalCapabilities.size,
      dataCapabilities: this.dataCapabilities.size,
      uiCapabilities: this.uiCapabilities.size,
      totalCapabilities: this.terminalCapabilities.size + this.dataCapabilities.size + this.uiCapabilities.size
    }
  }
  
  /**
   * Check if a terminal capability exists
   * @param name Capability name
   * @returns True if capability exists
   */
  hasTerminalCapability(name: string): boolean {
    return this.terminalCapabilities.has(name)
  }
  
  /**
   * Check if a data capability exists
   * @param name Capability name
   * @returns True if capability exists
   */
  hasDataCapability(name: string): boolean {
    return this.dataCapabilities.has(name)
  }
  
  /**
   * Check if a UI capability exists
   * @param name Capability name
   * @returns True if capability exists
   */
  hasUICapability(name: string): boolean {
    return this.uiCapabilities.has(name)
  }
  
  /**
   * Clear all capabilities
   */
  clear(): void {
    this.terminalCapabilities.clear()
    this.dataCapabilities.clear()
    this.uiCapabilities.clear()
    
    if (this.eventBus) {
      this.eventBus.emit('capability:registry:cleared')
    }
  }
}
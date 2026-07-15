export interface PluginSyncDescriptor {
  id: string
  localStorageKeys?: string[]
  idbSettingsKey?: string
  defaults?: Record<string, unknown>
  onRestore?: (data: unknown) => void
}

export type PluginSyncDescriptorInput = PluginSyncDescriptor

export class PluginSyncRegistry {
  private descriptors = new Map<string, PluginSyncDescriptor>()

  register(desc: PluginSyncDescriptorInput): void {
    this.descriptors.set(desc.id, this.cloneDescriptor(desc))
  }

  unregister(id: string): void {
    this.descriptors.delete(id)
  }

  getAll(): PluginSyncDescriptor[] {
    return Array.from(this.descriptors.values()).map((desc) => this.cloneDescriptor(desc))
  }

  collectAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const desc of this.descriptors.values()) {
      const pluginData: Record<string, unknown> = {}

      for (const key of desc.localStorageKeys ?? []) {
        const storedValue = localStorage.getItem(key)
        if (storedValue !== null) {
          pluginData[key] = storedValue
        } else if (desc.defaults && Object.prototype.hasOwnProperty.call(desc.defaults, key)) {
          pluginData[key] = desc.defaults[key]
        }
      }

      if (Object.keys(pluginData).length > 0) {
        result[desc.id] = pluginData
      }
    }

    return result
  }

  applyAll(data: Record<string, unknown>): void {
    for (const [pluginId, pluginData] of Object.entries(data)) {
      const desc = this.descriptors.get(pluginId)
      if (!desc || !pluginData || typeof pluginData !== 'object') {
        continue
      }

      const pluginRecord = pluginData as Record<string, unknown>
      for (const key of desc.localStorageKeys ?? []) {
        if (!Object.prototype.hasOwnProperty.call(pluginRecord, key)) {
          continue
        }

        const value = pluginRecord[key]
        if (value === null || value === undefined) {
          localStorage.removeItem(key)
        } else if (typeof value === 'string') {
          localStorage.setItem(key, value)
        } else {
          localStorage.setItem(key, JSON.stringify(value))
        }
      }

      try {
        desc.onRestore?.(pluginData)
      } catch {
        // Restore callbacks are best-effort; persisted data has already been applied.
      }
    }
  }

  private cloneDescriptor(desc: PluginSyncDescriptor): PluginSyncDescriptor {
    return {
      ...desc,
      localStorageKeys: desc.localStorageKeys ? [...desc.localStorageKeys] : undefined,
      defaults: desc.defaults ? { ...desc.defaults } : undefined,
    }
  }
}

export const pluginSyncRegistry = new PluginSyncRegistry()

/**
 * Terminal Panel Store
 * Per-panel terminal instances and history.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTerminalPanelStore = defineStore('terminalPanel', () => {
  // State
  const terminalInstances = ref<Map<string, any>>(new Map())
  const activeTerminalId = ref<string | null>(null)
  const fontSize = ref(13)

  // Actions
  function registerTerminal(id: string, instance: any): void {
    terminalInstances.value.set(id, instance)
    activeTerminalId.value = id
  }

  function unregisterTerminal(id: string): void {
    const instance = terminalInstances.value.get(id)
    if (instance && instance.destroy) {
      instance.destroy()
    }
    terminalInstances.value.delete(id)

    if (activeTerminalId.value === id) {
      activeTerminalId.value = null
    }
  }

  function setFontSize(size: number): void {
    fontSize.value = size
    // Update all terminal instances
    terminalInstances.value.forEach(instance => {
      if (instance.options) {
        instance.options.fontSize = size
      }
    })
  }

  function clear(): void {
    const instance = activeTerminalId.value ? terminalInstances.value.get(activeTerminalId.value) : null
    if (instance && instance.clear) {
      instance.clear()
    }
  }

  return {
    terminalInstances,
    activeTerminalId,
    fontSize,
    registerTerminal,
    unregisterTerminal,
    setFontSize,
    clear,
  }
})

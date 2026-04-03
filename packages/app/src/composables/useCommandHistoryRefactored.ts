/**
 * Refactored Command History Composable
 * Uses dependency injection and event-driven architecture
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { ICommandHistoryRepository } from '../domain/repositories'
import { CommandHistoryEntity } from '../domain/entities'
import { getGlobalContainer } from '../core/container'
import { getGlobalEventBus } from '../platform/events/event-bus'

/**
 * Command History Composable
 * Refactored to use dependency injection and event bus
 */
export function useCommandHistory() {
  const history = ref<string[]>([])
  const currentIndex = ref(-1)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Inject dependencies
  const repository = getGlobalContainer().resolve<ICommandHistoryRepository>('CommandHistoryRepository')
  const eventBus = getGlobalEventBus()

  // Load history from repository
  const loadHistory = async () => {
    loading.value = true
    error.value = null

    try {
      const entities = await repository.getRecent(100)
      history.value = entities.map(e => e.command)
      currentIndex.value = -1
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useCommandHistory] Failed to load history:', err)
    } finally {
      loading.value = false
    }
  }

  // Add command to history
  const addToHistory = async (command: string) => {
    if (!command || typeof command !== 'string') {
      return
    }

    try {
      const entry = new CommandHistoryEntity({
        id: crypto.randomUUID(),
        command,
        timestamp: new Date(),
        success: true
      })

      await repository.addCommand(entry)

      // Update local state
      history.value.push(command)
      if (history.value.length > 100) {
        history.value.shift()
      }
      currentIndex.value = -1

      // Emit event
      eventBus.emit('command:history:added', { command, entry })
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useCommandHistory] Failed to add command:', err)
    }
  }

  // Navigate history
  const navigateHistory = (direction: number): string => {
    if (history.value.length === 0) {
      return ''
    }

    if (direction === -1) { // Up
      if (currentIndex.value < history.value.length - 1) {
        currentIndex.value++
        const index = history.value.length - 1 - currentIndex.value
        const command = history.value[index]
        eventBus.emit('command:history:navigated', { command, direction })
        return command
      }
    } else { // Down
      if (currentIndex.value > -1) {
        currentIndex.value--
        if (currentIndex.value === -1) {
          eventBus.emit('command:history:navigated', { command: '', direction })
          return ''
        } else {
          const index = history.value.length - 1 - currentIndex.value
          const command = history.value[index]
          eventBus.emit('command:history:navigated', { command, direction })
          return command
        }
      }
    }

    return ''
  }

  // Reset navigation index
  const resetIndex = () => {
    currentIndex.value = -1
  }

  // Clear history
  const clearHistory = async () => {
    try {
      await repository.clearHistory()
      history.value = []
      currentIndex.value = -1
      eventBus.emit('command:history:cleared', {})
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useCommandHistory] Failed to clear history:', err)
    }
  }

  // Search history
  const searchHistory = async (query: string): Promise<string[]> => {
    try {
      const results = await repository.search(query)
      return results.map(r => r.command)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useCommandHistory] Failed to search history:', err)
      return []
    }
  }

  // Get statistics
  const getStatistics = async () => {
    try {
      return await repository.getStatistics()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('[useCommandHistory] Failed to get statistics:', err)
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        mostUsedCommands: []
      }
    }
  }

  // Listen to events
  const handleHistoryAdded = (event: any) => {
    console.log('[useCommandHistory] Command added to history:', event.command)
  }

  const handleHistoryCleared = () => {
    console.log('[useCommandHistory] History cleared')
  }

  // Lifecycle hooks
  onMounted(() => {
    loadHistory()
    eventBus.on('command:history:added', handleHistoryAdded)
    eventBus.on('command:history:cleared', handleHistoryCleared)
  })

  onUnmounted(() => {
    eventBus.off('command:history:added', handleHistoryAdded)
    eventBus.off('command:history:cleared', handleHistoryCleared)
  })

  return {
    history,
    currentIndex,
    loading,
    error,
    addToHistory,
    navigateHistory,
    resetIndex,
    clearHistory,
    searchHistory,
    getStatistics,
    loadHistory
  }
}
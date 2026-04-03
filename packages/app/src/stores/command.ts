import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Command history and state management
 */
export const useCommandStore = defineStore('command', () => {
  const history = ref<string[]>([])
  const currentIndex = ref(-1)
  const maxSize = 500

  /**
   * Add command to history
   */
  function addToHistory(command: string) {
    // Skip empty strings
    if (!command || command.trim() === '') {
      return
    }

    // Check if it's the same as the last command
    if (history.value.length > 0 && history.value[history.value.length - 1] === command) {
      return
    }

    // Add to history
    history.value.push(command)

    // Limit history size
    if (history.value.length > maxSize) {
      history.value.shift()
    }

    // Reset current index to the latest
    currentIndex.value = history.value.length
  }

  /**
   * Navigate history
   */
  function navigateHistory(direction: number): string | null {
    if (history.value.length === 0) {
      return null
    }

    const newIndex = currentIndex.value + direction

    // Check bounds
    if (newIndex < -1 || newIndex >= history.value.length) {
      return null
    }

    currentIndex.value = newIndex

    if (newIndex === -1) {
      // At the bottom of history
      return ''
    } else if (newIndex >= 0 && newIndex < history.value.length) {
      // Navigate to a command in history
      return history.value[newIndex]
    }

    return null
  }

  /**
   * Search history
   */
  function searchHistory(query: string): string[] {
    if (!query) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    return history.value.filter(cmd => 
      cmd.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Reset navigation
   */
  function resetNavigation() {
    currentIndex.value = history.value.length
  }

  /**
   * Clear history
   */
  function clearHistory() {
    history.value = []
    currentIndex.value = -1
  }

  /**
   * Get history statistics
   */
  function getStats() {
    return {
      total: history.value.length,
      currentIndex: currentIndex.value,
      maxSize: maxSize,
      percentage: (history.value.length / maxSize) * 100,
    }
  }

  return {
    history,
    currentIndex,
    addToHistory,
    navigateHistory,
    searchHistory,
    resetNavigation,
    clearHistory,
    getStats,
  }
})
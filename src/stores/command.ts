/**
 * Command Store
 * 管理命令历史和状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CommandHistoryItem {
  command: string
  timestamp: number
  index: number
}

export const useCommandStore = defineStore('command', () => {
  // State
  const history = ref<CommandHistoryItem[]>([])
  const currentIndex = ref(-1)
  const maxHistorySize = 500
  const currentInput = ref('')

  // Getters
  const historyCount = computed(() => history.value.length)
  const previousCommand = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value].command
    }
    return ''
  })
  const nextCommand = computed(() => {
    const nextIndex = currentIndex.value + 1
    if (nextIndex >= 0 && nextIndex < history.value.length) {
      return history.value[nextIndex].command
    }
    return ''
  })
  const canGoBack = computed(() => currentIndex.value > 0)
  const canGoForward = computed(() => currentIndex.value < history.value.length - 1)

  // Actions
  function addToHistory(command: string) {
    // 跳过空字符串
    if (!command.trim()) {
      return
    }

    // 检查是否与上一条命令相同
    const lastCommand = history.value[history.value.length - 1]
    if (lastCommand && lastCommand.command === command) {
      return
    }

    // 添加到历史记录
    history.value.push({
      command,
      timestamp: Date.now(),
      index: history.value.length,
    })

    // 如果超过最大大小，移除最旧的
    if (history.value.length > maxHistorySize) {
      history.value.shift()
    }

    // 重置当前索引到最新
    currentIndex.value = history.value.length - 1
  }

  function navigateBack() {
    if (canGoBack.value) {
      currentIndex.value--
      return history.value[currentIndex.value].command
    }
    return ''
  }

  function navigateForward() {
    if (canGoForward.value) {
      currentIndex.value++
      return history.value[currentIndex.value].command
    }
    return ''
  }

  function resetNavigation() {
    currentIndex.value = history.value.length
  }

  function setCurrentInput(input: string) {
    currentInput.value = input
  }

  function clearHistory() {
    history.value = []
    currentIndex.value = -1
    currentInput.value = ''
  }

  function getCommandByIndex(index: number): string | null {
    if (index >= 0 && index < history.value.length) {
      return history.value[index].command
    }
    return null
  }

  function searchHistory(keyword: string): CommandHistoryItem[] {
    if (!keyword.trim()) {
      return []
    }
    return history.value.filter(item =>
      item.command.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  return {
    // State
    history,
    currentIndex,
    currentInput,
    maxHistorySize,
    // Getters
    historyCount,
    previousCommand,
    nextCommand,
    canGoBack,
    canGoForward,
    // Actions
    addToHistory,
    navigateBack,
    navigateForward,
    resetNavigation,
    setCurrentInput,
    clearHistory,
    getCommandByIndex,
    searchHistory,
  }
})
import { ref } from 'vue'

export function useCommandHistory() {
  const history = ref<string[]>([])
  const currentIndex = ref(-1)

  const addToHistory = (command: string) => {
    history.value.push(command)
    currentIndex.value = -1
  }

  const navigateHistory = (direction: number, callback: (command: string) => void) => {
    if (history.value.length === 0) return

    if (direction === -1) { // Up
      if (currentIndex.value < history.value.length - 1) {
        currentIndex.value++
        const index = history.value.length - 1 - currentIndex.value
        callback(history.value[index])
      }
    } else { // Down
      if (currentIndex.value > -1) {
        currentIndex.value--
        if (currentIndex.value === -1) {
          callback('')
        } else {
          const index = history.value.length - 1 - currentIndex.value
          callback(history.value[index])
        }
      }
    }
  }

  const resetIndex = () => {
    currentIndex.value = -1
  }

  return {
    history,
    currentIndex,
    addToHistory,
    navigateHistory,
    resetIndex
  }
}
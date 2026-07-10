import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCommandHistory } from './useCommandHistory'

describe('useCommandHistory', () => {
  let callback: any

  beforeEach(() => {
    callback = vi.fn()
  })

  describe('initial state', () => {
    it('should start with empty history', () => {
      const { history } = useCommandHistory()
      expect(history.value).toEqual([])
    })

    it('should initialize index to -1', () => {
      const { currentIndex } = useCommandHistory()
      expect(currentIndex.value).toBe(-1)
    })
  })

  describe('addToHistory', () => {
    it('should append a command to history', () => {
      const { history, addToHistory } = useCommandHistory()

      addToHistory('help')

      expect(history.value).toEqual(['help'])
    })

    it('should preserve insertion order for multiple commands', () => {
      const { history, addToHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')

      expect(history.value).toEqual(['help', 'status', 'clear'])
    })

    it('should reset index to -1 after adding a command', () => {
      const { currentIndex, addToHistory } = useCommandHistory()

      addToHistory('help')

      expect(currentIndex.value).toBe(-1)
    })

    it('should reject empty strings to keep history clean', () => {
      const { history, addToHistory } = useCommandHistory()

      // Empty input is treated as invalid and should not pollute the history
      addToHistory('')

      expect(history.value).toEqual([])
    })
  })

  describe('navigateHistory - upward (direction = -1)', () => {
    it('should no-op when history is empty', () => {
      const { navigateHistory } = useCommandHistory()

      navigateHistory(-1, callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should return the most recent command on first upward press', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      navigateHistory(-1, callback)

      expect(callback).toHaveBeenCalledWith('status')
    })

    it('should walk backward through history in reverse insertion order', () => {
      const { addToHistory, navigateHistory, currentIndex: _currentIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenLastCalledWith('clear')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenLastCalledWith('status')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenLastCalledWith('help')
    })

    it('should clamp at the oldest entry and not go further back', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenCalledWith('help')

      navigateHistory(-1, callback)
      // At the start of history, further up navigation should be a no-op
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should update currentIndex to reflect position in history', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)

      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(1)
    })
  })

  describe('navigateHistory - downward (direction = 1)', () => {
    it('should no-op when history is empty', () => {
      const { navigateHistory } = useCommandHistory()

      navigateHistory(1, callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should return empty string when navigating past the end', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      // Navigate up first to enter the history traversal state
      navigateHistory(-1, callback)
      callback.mockClear()

      // Navigate down should cycle past the end and return empty string
      navigateHistory(1, callback)

      expect(callback).toHaveBeenCalledWith('')
    })

    it('should walk forward through history in insertion order', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')

      // Move two steps back into history
      navigateHistory(-1, callback)
      navigateHistory(-1, callback)
      callback.mockClear()

      // Walk forward one step to verify correct next entry
      navigateHistory(1, callback)
      expect(callback).toHaveBeenCalledWith('clear')
    })

    it('should stop at the end of history and not fire callback again', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      // Move up once so we have room to navigate down
      navigateHistory(-1, callback)
      callback.mockClear()

      // Navigate down past the last entry (should return empty string)
      navigateHistory(1, callback)
      callback.mockClear()

      // Further down navigation should be a no-op at the boundary
      navigateHistory(1, callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should reset currentIndex to -1 when navigating past the end', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      // Move up to enter history traversal
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)

      // Move down past the end resets to "not browsing" state
      navigateHistory(1, callback)
      expect(currentIndex.value).toBe(-1)
    })
  })

  describe('resetIndex', () => {
    it('should reset index to -1 regardless of current position', () => {
      const { addToHistory, navigateHistory, currentIndex, resetIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)

      resetIndex()
      expect(currentIndex.value).toBe(-1)
    })

    it('should preserve history entries when resetting index', () => {
      const { addToHistory, history, resetIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      resetIndex()

      expect(history.value).toEqual(['help', 'status'])
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple up/down navigations in sequence', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')

      // Up, up, up, down, down, down — exercises boundary clamping in both directions
      navigateHistory(-1, callback) // clear
      navigateHistory(-1, callback) // status
      navigateHistory(-1, callback) // help
      navigateHistory(1, callback) // status
      navigateHistory(1, callback) // clear
      navigateHistory(1, callback) // ''

      expect(callback).toHaveBeenLastCalledWith('')
    })

    it('should reset navigation state when a new command is added mid-browse', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()

      addToHistory('help')
      addToHistory('status')

      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)

      // Adding a new command should reset the browse index so the user exits history mode
      addToHistory('clear')
      expect(currentIndex.value).toBe(-1)
    })

    it('should allow duplicate commands in history', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()

      addToHistory('help')
      addToHistory('help')
      addToHistory('status')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenCalledWith('status')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenCalledWith('help')

      navigateHistory(-1, callback)
      expect(callback).toHaveBeenCalledWith('help')
    })
  })
})

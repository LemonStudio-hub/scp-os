import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCommandHistory } from './useCommandHistory'

describe('useCommandHistory', () => {
  let callback: any

  beforeEach(() => {
    callback = vi.fn()
  })

  describe('初始状态', () => {
    it('应该初始化为空历史记录', () => {
      const { history } = useCommandHistory()
      expect(history.value).toEqual([])
    })

    it('应该初始化索引为 -1', () => {
      const { currentIndex } = useCommandHistory()
      expect(currentIndex.value).toBe(-1)
    })
  })

  describe('addToHistory', () => {
    it('应该添加命令到历史记录', () => {
      const { history, addToHistory } = useCommandHistory()
      
      addToHistory('help')
      
      expect(history.value).toEqual(['help'])
    })

    it('应该添加多个命令', () => {
      const { history, addToHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')
      
      expect(history.value).toEqual(['help', 'status', 'clear'])
    })

    it('应该重置索引为 -1', () => {
      const { currentIndex, addToHistory } = useCommandHistory()
      
      addToHistory('help')
      
      expect(currentIndex.value).toBe(-1)
    })

    it('应该添加空字符串', () => {
      const { history, addToHistory } = useCommandHistory()
      
      // 空字符串现在被视为无效输入，不会添加到历史记录
      addToHistory('')
      
      expect(history.value).toEqual([])
    })
  })

  describe('navigateHistory - 向上导航 (direction = -1)', () => {
    it('应该在空历史记录时不执行任何操作', () => {
      const { navigateHistory } = useCommandHistory()
      
      navigateHistory(-1, callback)
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该返回最后一个命令', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      navigateHistory(-1, callback)
      
      expect(callback).toHaveBeenCalledWith('status')
    })

    it('应该正确返回上一个命令', () => {
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

    it('应该在到达历史记录开头时停止', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      
      navigateHistory(-1, callback)
      expect(callback).toHaveBeenCalledWith('help')
      
      navigateHistory(-1, callback)
      // 应该不再调用，因为已经到了开头
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该更新 currentIndex', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)
      
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(1)
    })
  })

  describe('navigateHistory - 向下导航 (direction = 1)', () => {
    it('应该在空历史记录时不执行任何操作', () => {
      const { navigateHistory } = useCommandHistory()
      
      navigateHistory(1, callback)
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该返回空字符串当从底部开始', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      // 先向上导航
      navigateHistory(-1, callback)
      callback.mockClear()
      
      // 再向下导航
      navigateHistory(1, callback)
      
      expect(callback).toHaveBeenCalledWith('')
    })

    it('应该正确返回下一个命令', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')
      
      // 向上导航两次
      navigateHistory(-1, callback)
      navigateHistory(-1, callback)
      callback.mockClear()
      
      // 向下导航一次
      navigateHistory(1, callback)
      expect(callback).toHaveBeenCalledWith('clear')
    })

    it('应该在到达历史记录底部时停止', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      // 向上导航一次
      navigateHistory(-1, callback)
      callback.mockClear()
      
      // 向下导航一次（返回空字符串）
      navigateHistory(1, callback)
      callback.mockClear()
      
      // 再向下导航（应该不调用）
      navigateHistory(1, callback)
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该更新 currentIndex', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      // 向上导航
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)
      
      // 向下导航
      navigateHistory(1, callback)
      expect(currentIndex.value).toBe(-1)
    })
  })

  describe('resetIndex', () => {
    it('应该重置索引为 -1', () => {
      const { addToHistory, navigateHistory, currentIndex, resetIndex } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)
      
      resetIndex()
      expect(currentIndex.value).toBe(-1)
    })

    it('应该不影响历史记录', () => {
      const { addToHistory, history, resetIndex } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      resetIndex()
      
      expect(history.value).toEqual(['help', 'status'])
    })
  })

  describe('复杂场景', () => {
    it('应该正确处理多次上下导航', () => {
      const { addToHistory, navigateHistory } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      addToHistory('clear')
      
      // 上上上下下上
      navigateHistory(-1, callback) // clear
      navigateHistory(-1, callback) // status
      navigateHistory(-1, callback) // help
      navigateHistory(1, callback)  // status
      navigateHistory(1, callback)  // clear
      navigateHistory(1, callback)  // ''
      
      expect(callback).toHaveBeenLastCalledWith('')
    })

    it('应该在添加新命令后重置导航', () => {
      const { addToHistory, navigateHistory, currentIndex } = useCommandHistory()
      
      addToHistory('help')
      addToHistory('status')
      
      navigateHistory(-1, callback)
      expect(currentIndex.value).toBe(0)
      
      // 添加新命令应该重置索引
      addToHistory('clear')
      expect(currentIndex.value).toBe(-1)
    })

    it('应该处理包含相同命令的历史记录', () => {
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
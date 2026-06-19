import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotification } from '../useNotification'

describe('useNotification', () => {
  let notifications: ReturnType<typeof useNotification>

  beforeEach(() => {
    vi.useFakeTimers()
    notifications = useNotification()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('addNotification', () => {
    it('should return a unique string ID', () => {
      const id1 = notifications.addNotification({
        title: 'Test',
        message: 'Hello',
        duration: 5000,
      })
      const id2 = notifications.addNotification({
        title: 'Test',
        message: 'World',
        duration: 5000,
      })

      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
      expect(id1).not.toBe(id2)
    })

    it('should grow the notifications array', () => {
      expect(notifications.notifications.value).toHaveLength(0)

      notifications.addNotification({ title: 'A', message: 'msg1', duration: 5000 })
      expect(notifications.notifications.value).toHaveLength(1)

      notifications.addNotification({ title: 'B', message: 'msg2', duration: 5000 })
      expect(notifications.notifications.value).toHaveLength(2)
    })

    it('should set removing to false on new notification', () => {
      notifications.addNotification({ title: 'Test', message: 'msg', duration: 5000 })
      expect(notifications.notifications.value[0].removing).toBe(false)
    })

    it('should default duration to 5000 when not provided', () => {
      notifications.addNotification({ title: 'Test', message: 'msg' } as any)
      expect(notifications.notifications.value[0].duration).toBe(5000)
    })

    it('should auto-remove notification after duration', () => {
      notifications.addNotification({ title: 'Test', message: 'msg', duration: 1000 })

      expect(notifications.notifications.value).toHaveLength(1)

      // Advance past the auto-remove timeout (1000ms) + animation (300ms)
      vi.advanceTimersByTime(1300)

      expect(notifications.notifications.value).toHaveLength(0)
    })

    it('should not auto-remove when duration is 0', () => {
      notifications.addNotification({ title: 'Test', message: 'msg', duration: 0 })

      vi.advanceTimersByTime(10000)

      expect(notifications.notifications.value).toHaveLength(1)
    })
  })

  describe('removeNotification', () => {
    it('should set removing flag to true immediately', () => {
      const id = notifications.addNotification({
        title: 'Test',
        message: 'msg',
        duration: 5000,
      })

      notifications.removeNotification(id)

      expect(notifications.notifications.value[0].removing).toBe(true)
    })

    it('should remove notification from array after 300ms', () => {
      const id = notifications.addNotification({
        title: 'Test',
        message: 'msg',
        duration: 5000,
      })

      notifications.removeNotification(id)
      expect(notifications.notifications.value).toHaveLength(1)

      vi.advanceTimersByTime(300)
      expect(notifications.notifications.value).toHaveLength(0)
    })

    it('should do nothing for non-existent ID', () => {
      notifications.addNotification({ title: 'Test', message: 'msg', duration: 5000 })

      notifications.removeNotification('non-existent-id')
      expect(notifications.notifications.value).toHaveLength(1)
    })

    it('should clear the auto-remove timeout when manually removed', () => {
      // Add notification with short auto-remove duration
      notifications.addNotification({ title: 'Auto', message: 'msg1', duration: 500 })
      // Add second notification
      const id2 = notifications.addNotification({
        title: 'Manual',
        message: 'msg2',
        duration: 5000,
      })

      // Manually remove the second notification
      notifications.removeNotification(id2)
      vi.advanceTimersByTime(300) // remove animation completes

      // Now only the first notification should remain
      expect(notifications.notifications.value).toHaveLength(1)
      expect(notifications.notifications.value[0].title).toBe('Auto')

      // Advance past first notification's auto-remove
      vi.advanceTimersByTime(500 + 300)
      expect(notifications.notifications.value).toHaveLength(0)
    })
  })

  describe('clearAllNotifications', () => {
    it('should set removing flag on all notifications', () => {
      notifications.addNotification({ title: 'A', message: 'msg1', duration: 5000 })
      notifications.addNotification({ title: 'B', message: 'msg2', duration: 5000 })
      notifications.addNotification({ title: 'C', message: 'msg3', duration: 5000 })

      notifications.clearAllNotifications()

      notifications.notifications.value.forEach((n) => {
        expect(n.removing).toBe(true)
      })
    })

    it('should clear all notifications after 300ms animation', () => {
      notifications.addNotification({ title: 'A', message: 'msg1', duration: 5000 })
      notifications.addNotification({ title: 'B', message: 'msg2', duration: 5000 })

      notifications.clearAllNotifications()
      expect(notifications.notifications.value).toHaveLength(2)

      vi.advanceTimersByTime(300)
      expect(notifications.notifications.value).toHaveLength(0)
    })

    it('should clear pending auto-remove timeouts', () => {
      notifications.addNotification({ title: 'A', message: 'msg1', duration: 500 })

      notifications.clearAllNotifications()
      vi.advanceTimersByTime(300) // clear animation

      // Advance past the auto-remove duration - array should stay empty
      vi.advanceTimersByTime(1000)
      expect(notifications.notifications.value).toHaveLength(0)
    })
  })
})

import { ref, type Ref } from 'vue'
import type { IconName } from '../icons'

interface Notification {
  id: string
  title: string
  message: string
  icon?: IconName
  duration: number
  removing?: boolean
}

export function useNotification() {
  const notifications: Ref<Notification[]> = ref([])
  const timeouts = new Map<string, number>()

  function addNotification(notification: Omit<Notification, 'id' | 'removing'>) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      ...notification,
      duration: notification.duration ?? 5000,
      removing: false
    }

    notifications.value.push(newNotification)

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      const timeoutId = window.setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
      timeouts.set(id, timeoutId)
    }

    return id
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      // Add removing flag for animation
      notifications.value[index].removing = true

      // Clear timeout if exists
      const timeoutId = timeouts.get(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeouts.delete(id)
      }

      // Remove from array after animation
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id)
      }, 300) // Match animation duration
    }
  }

  function clearAllNotifications() {
    // Clear all timeouts
    timeouts.forEach(timeoutId => clearTimeout(timeoutId))
    timeouts.clear()

    // Remove all notifications with animation
    notifications.value.forEach(notification => {
      notification.removing = true
    })

    // Clear array after animation
    setTimeout(() => {
      notifications.value = []
    }, 300)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  }
}

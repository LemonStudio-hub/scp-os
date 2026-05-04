import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { config } from '../config'
import { useAuthStore } from './authStore'

export type NotificationType =
  | 'feedback_comment'
  | 'feedback_upvote'
  | 'feedback_downvote'
  | 'chat_message'

export interface AppNotification {
  id: number
  recipient_user_id: string
  actor_user_id: string
  actor_nickname: string
  type: NotificationType
  title: string
  body: string
  reference_id: string
  reference_type: string
  is_read: number
  created_at: string
  read_at: string | null
}

export interface NotificationPreferences {
  feedback_comment: number
  feedback_upvote: number
  feedback_downvote: number
  chat_message: number
}

const API_BASE = config.api.workerUrl

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const total = ref(0)
  const isLoading = ref(false)
  const preferences = ref<NotificationPreferences>({
    feedback_comment: 1,
    feedback_upvote: 1,
    feedback_downvote: 1,
    chat_message: 1,
  })

  let pollTimer: ReturnType<typeof setInterval> | null = null

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications(limit = 20, offset = 0): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    isLoading.value = true
    try {
      const response = await authStore.authFetch(
        `${API_BASE}/notifications?limit=${limit}&offset=${offset}`
      )
      if (!response.ok) return
      const result = await response.json()
      if (result.success) {
        notifications.value = result.data || []
        total.value = result.total || 0
        unreadCount.value = result.unreadCount || 0
      }
    } catch {
      // ignore
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    try {
      const response = await authStore.authFetch(`${API_BASE}/notifications?limit=1&unread=true`)
      if (!response.ok) return
      const result = await response.json()
      if (result.success) {
        unreadCount.value = result.total || 0
      }
    } catch {
      // ignore
    }
  }

  async function markAsRead(notificationId?: number): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    try {
      const body = notificationId ? { id: notificationId } : {}
      const response = await authStore.authFetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) return
      const result = await response.json()
      if (result.success) {
        if (notificationId) {
          const n = notifications.value.find((n) => n.id === notificationId)
          if (n) n.is_read = 1
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        } else {
          notifications.value.forEach((n) => {
            n.is_read = 1
          })
          unreadCount.value = 0
        }
      }
    } catch {
      // ignore
    }
  }

  async function deleteNotification(notificationId: number): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    try {
      const response = await authStore.authFetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) return
      const result = await response.json()
      if (result.success) {
        const n = notifications.value.find((n) => n.id === notificationId)
        if (n && !n.is_read) unreadCount.value = Math.max(0, unreadCount.value - 1)
        notifications.value = notifications.value.filter((n) => n.id !== notificationId)
        total.value = Math.max(0, total.value - 1)
      }
    } catch {
      // ignore
    }
  }

  async function fetchPreferences(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    try {
      const response = await authStore.authFetch(`${API_BASE}/notifications/preferences`)
      if (!response.ok) return
      const result = await response.json()
      if (result.success && result.data) {
        preferences.value = result.data
      }
    } catch {
      // ignore
    }
  }

  async function updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return
    try {
      const response = await authStore.authFetch(`${API_BASE}/notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!response.ok) return
      const result = await response.json()
      if (result.success) {
        preferences.value = { ...preferences.value, ...prefs }
      }
    } catch {
      // ignore
    }
  }

  function startPolling(intervalMs = 8000): void {
    stopPolling()
    fetchUnreadCount()
    pollTimer = setInterval(() => {
      fetchUnreadCount()
    }, intervalMs)
  }

  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    notifications,
    unreadCount,
    total,
    isLoading,
    preferences,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    startPolling,
    stopPolling,
  }
})

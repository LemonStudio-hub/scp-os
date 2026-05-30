import { ref, computed, onMounted } from 'vue'
import { useNotificationStore } from '../../stores/notificationStore'
import { useI18n } from './useI18n'
import type { NotificationType } from '../../stores/notificationStore'

export function useNotificationCenter() {
  const store = useNotificationStore()
  const { t } = useI18n()
  const showPrefs = ref(false)

  const prefItems = computed(() => [
    { key: 'feedback_comment' as const, label: t('notif.prefComment') },
    { key: 'feedback_upvote' as const, label: t('notif.prefUpvote') },
    { key: 'feedback_downvote' as const, label: t('notif.prefDownvote') },
    { key: 'chat_message' as const, label: t('notif.prefChat') },
  ])

  function typeLabel(type: NotificationType): string {
    switch (type) {
      case 'feedback_comment':
        return t('notif.typeComment')
      case 'feedback_upvote':
        return t('notif.typeUpvote')
      case 'feedback_downvote':
        return t('notif.typeDownvote')
      case 'chat_message':
        return t('notif.typeChat')
      default:
        return type
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return t('notif.timeJustNow')
    if (diff < 3600000) return t('notif.timeMinAgo', { n: Math.floor(diff / 60000) })
    if (diff < 86400000) return t('notif.timeHourAgo', { n: Math.floor(diff / 3600000) })
    return t('notif.timeDayAgo', { n: Math.floor(diff / 86400000) })
  }

  async function handleClick(item: any): Promise<void> {
    if (!item.is_read) await store.markAsRead(item.id)
  }

  async function markAllRead(): Promise<void> {
    await store.markAsRead()
  }

  async function togglePref(key: keyof typeof store.preferences): Promise<void> {
    await store.updatePreferences({ [key]: store.preferences[key] ? 0 : 1 })
  }

  onMounted(() => {
    store.fetchNotifications()
    store.fetchPreferences()
  })

  return {
    t,
    store,
    showPrefs,
    prefItems,
    typeLabel,
    formatTimeAgo,
    handleClick,
    markAllRead,
    togglePref,
  }
}

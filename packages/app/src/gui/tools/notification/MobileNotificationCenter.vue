<template>
  <MobileWindow
    :visible="visible"
    :title="t('notif.title')"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="mobile-notif">
      <div class="mobile-notif__body">
        <div class="mobile-notif__header">
          <div class="mobile-notif__header-left">
            <span v-if="store.hasUnread" class="mobile-notif__badge">{{ store.unreadCount }}</span>
          </div>
          <div class="mobile-notif__header-actions">
            <button v-if="store.hasUnread" class="mobile-notif__btn" @click="markAllRead">
              {{ t('notif.markAllRead') }}
            </button>
            <button class="mobile-notif__btn" @click="showPrefs = !showPrefs">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                />
              </svg>
            </button>
          </div>
        </div>

        <transition name="mnotif-slide">
          <div v-if="showPrefs" class="mobile-notif__prefs">
            <div v-for="pref in prefItems" :key="pref.key" class="mobile-notif__pref-item">
              <span class="mobile-notif__pref-label">{{ pref.label }}</span>
              <button
                class="mobile-notif__toggle"
                :class="{ 'mobile-notif__toggle--on': store.preferences[pref.key] }"
                @click="togglePref(pref.key)"
              >
                <span class="mobile-notif__toggle-knob" />
              </button>
            </div>
          </div>
        </transition>

        <div v-if="store.isLoading" class="mobile-notif__loading">
          <div class="mobile-notif__spinner" />
        </div>

        <div v-else-if="store.notifications.length === 0" class="mobile-notif__empty">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            opacity="0.3"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span>{{ t('notif.empty') }}</span>
        </div>

        <div v-else class="mobile-notif__list">
          <div
            v-for="item in store.notifications"
            :key="item.id"
            class="mobile-notif__item"
            :class="{ 'mobile-notif__item--unread': !item.is_read }"
            @click="handleClick(item)"
          >
            <div class="mobile-notif__item-icon" :class="`mobile-notif__item-icon--${item.type}`">
              <svg
                v-if="item.type === 'feedback_comment'"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <svg
                v-else-if="item.type === 'feedback_upvote'"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                />
              </svg>
              <svg
                v-else-if="item.type === 'feedback_downvote'"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
                />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div class="mobile-notif__item-content">
              <div class="mobile-notif__item-header">
                <span class="mobile-notif__item-type">{{ typeLabel(item.type) }}</span>
                <span class="mobile-notif__item-time">{{ formatTimeAgo(item.created_at) }}</span>
              </div>
              <p class="mobile-notif__item-title">{{ item.title }}</p>
              <p class="mobile-notif__item-body">{{ item.actor_nickname }}: {{ item.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MobileWindow from '../../components/MobileWindow.vue'
import { useNotificationStore } from '../../../stores/notificationStore'
import { useI18n } from '../../composables/useI18n'
import type { NotificationType } from '../../../stores/notificationStore'

interface Props {
  visible: boolean
}
defineProps<Props>()
defineEmits<{ close: [] }>()

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
</script>

<style scoped>
.mobile-notif {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: #c9d1d9;
  font-size: 13px;
}

.mobile-notif__body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px;
}

.mobile-notif__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.mobile-notif__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-notif__badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(248, 81, 73, 0.9);
  color: #fff;
}

.mobile-notif__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-notif__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  background: #161b22;
  color: #8b949e;
  cursor: pointer;
}

.mobile-notif__prefs {
  padding: 12px;
  background: #161b22;
  border-radius: 10px;
  border: 1px solid #21262d;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-notif__pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-notif__pref-label {
  font-size: 13px;
  color: #c9d1d9;
}

.mobile-notif__toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: #30363d;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.mobile-notif__toggle--on {
  background: #238636;
}

.mobile-notif__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.mobile-notif__toggle--on .mobile-notif__toggle-knob {
  transform: translateX(18px);
}

.mnotif-slide-enter-active,
.mnotif-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.mnotif-slide-enter-from,
.mnotif-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.mnotif-slide-enter-to,
.mnotif-slide-leave-from {
  opacity: 1;
  max-height: 200px;
}

.mobile-notif__loading {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.mobile-notif__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: mnotif-spin 0.8s linear infinite;
}

@keyframes mnotif-spin {
  to {
    transform: rotate(360deg);
  }
}

.mobile-notif__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: #484f58;
  font-size: 13px;
}

.mobile-notif__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mobile-notif__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #161b22;
  border-radius: 10px;
  border: 1px solid transparent;
}

.mobile-notif__item--unread {
  border-left: 3px solid #58a6ff;
  background: rgba(56, 139, 253, 0.04);
}

.mobile-notif__item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-notif__item-icon--feedback_comment {
  background: rgba(56, 139, 253, 0.12);
  color: #58a6ff;
}
.mobile-notif__item-icon--feedback_upvote {
  background: rgba(46, 160, 67, 0.12);
  color: #3fb950;
}
.mobile-notif__item-icon--feedback_downvote {
  background: rgba(210, 153, 34, 0.12);
  color: #d29922;
}
.mobile-notif__item-icon--chat_message {
  background: rgba(163, 113, 247, 0.12);
  color: #a371f7;
}

.mobile-notif__item-content {
  flex: 1;
  min-width: 0;
}

.mobile-notif__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.mobile-notif__item-type {
  font-size: 11px;
  font-weight: 500;
  color: #8b949e;
  text-transform: uppercase;
}

.mobile-notif__item-time {
  font-size: 10px;
  color: #484f58;
}

.mobile-notif__item-title {
  font-size: 13px;
  font-weight: 500;
  color: #c9d1d9;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-notif__item-body {
  font-size: 12px;
  color: #8b949e;
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

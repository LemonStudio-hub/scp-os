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
import MobileWindow from '../../components/MobileWindow.vue'
import { useNotificationCenter } from '../../composables/useNotificationCenter'

interface Props {
  visible: boolean
}
defineProps<Props>()
defineEmits<{ close: [] }>()

const { t, store, showPrefs, prefItems, typeLabel, formatTimeAgo, handleClick, markAllRead, togglePref } = useNotificationCenter()
</script>

<style scoped>
.mobile-notif {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: var(--gui-text-secondary);
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
  background: var(--gui-error-bg);
  color: var(--gui-text-primary, #fff);
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
  background: var(--gui-bg-surface);
  color: var(--gui-text-tertiary);
  cursor: pointer;
}

.mobile-notif__prefs {
  padding: 12px;
  background: var(--gui-bg-surface);
  border-radius: 10px;
  border: 1px solid var(--gui-border-default);
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
  color: var(--gui-text-secondary);
}

.mobile-notif__toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--gui-border-default);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.mobile-notif__toggle--on {
  background: var(--gui-success);
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
  border: 2px solid var(--gui-border-default);
  border-top-color: var(--gui-accent);
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
  color: var(--gui-text-disabled);
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
  background: var(--gui-bg-surface);
  border-radius: 10px;
  border: 1px solid transparent;
}

.mobile-notif__item--unread {
  border-left: 3px solid #58a6ff;
  background: var(--gui-accent-soft);
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
  background: var(--gui-accent-soft);
  color: var(--gui-accent);
}
.mobile-notif__item-icon--feedback_upvote {
  background: var(--gui-success-bg);
  color: var(--gui-success);
}
.mobile-notif__item-icon--feedback_downvote {
  background: var(--gui-warning-bg);
  color: var(--gui-warning);
}
.mobile-notif__item-icon--chat_message {
  background: var(--gui-accent-soft);
  color: var(--gui-accent);
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
  color: var(--gui-text-tertiary);
  text-transform: uppercase;
}

.mobile-notif__item-time {
  font-size: 10px;
  color: var(--gui-text-disabled);
}

.mobile-notif__item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--gui-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-notif__item-body {
  font-size: 12px;
  color: var(--gui-text-tertiary);
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="notif-center">
      <div class="notif-center__header">
        <div class="notif-center__header-left">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span class="notif-center__header-title">{{ t('notif.title') }}</span>
          <span v-if="store.hasUnread" class="notif-center__badge">{{ store.unreadCount }}</span>
        </div>
        <div class="notif-center__header-actions">
          <button
            v-if="store.hasUnread"
            class="notif-center__btn notif-center__btn--ghost"
            @click="markAllRead"
          >
            {{ t('notif.markAllRead') }}
          </button>
          <button
            class="notif-center__btn notif-center__btn--ghost"
            @click="showPrefs = !showPrefs"
          >
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

      <transition name="notif-slide">
        <div v-if="showPrefs" class="notif-center__prefs">
          <div v-for="pref in prefItems" :key="pref.key" class="notif-center__pref-item">
            <span class="notif-center__pref-label">{{ pref.label }}</span>
            <button
              class="notif-center__toggle"
              :class="{ 'notif-center__toggle--on': store.preferences[pref.key] }"
              @click="togglePref(pref.key)"
            >
              <span class="notif-center__toggle-knob" />
            </button>
          </div>
        </div>
      </transition>

      <div class="notif-center__body">
        <div v-if="store.isLoading" class="notif-center__loading">
          <div class="notif-center__spinner" />
        </div>

        <div v-else-if="store.notifications.length === 0" class="notif-center__empty">
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

        <div v-else class="notif-center__list">
          <div
            v-for="item in store.notifications"
            :key="item.id"
            class="notif-center__item"
            :class="{ 'notif-center__item--unread': !item.is_read }"
            @click="handleClick(item)"
          >
            <div class="notif-center__item-icon" :class="`notif-center__item-icon--${item.type}`">
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
            <div class="notif-center__item-content">
              <div class="notif-center__item-header">
                <span class="notif-center__item-type">{{ typeLabel(item.type) }}</span>
                <span class="notif-center__item-time">{{ formatTimeAgo(item.created_at) }}</span>
              </div>
              <p class="notif-center__item-title">{{ item.title }}</p>
              <p class="notif-center__item-body">{{ item.actor_nickname }}: {{ item.body }}</p>
            </div>
            <button
              class="notif-center__item-delete"
              @click.stop="store.deleteNotification(item.id)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import SCPWindow from '../../components/SCPWindow.vue'
import { useNotificationCenter } from '../../composables/useNotificationCenter'
import type { WindowInstance } from '../../types'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const {
  t,
  store,
  showPrefs,
  prefItems,
  typeLabel,
  formatTimeAgo,
  handleClick: baseHandleClick,
  markAllRead,
  togglePref,
} = useNotificationCenter()

async function handleClick(item: any): Promise<void> {
  await baseHandleClick(item)
  emit('close')
}

function onClose() {
  emit('close')
}
</script>

<style scoped>
.notif-center {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0d1117);
  color: var(--gui-text-secondary, #c9d1d9);
  font-size: 13px;
}

.notif-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(
    135deg,
    var(--gui-bg-surface, #161b22) 0%,
    var(--gui-bg-surface-raised, #1a2233) 100%
  );
  border-bottom: 1px solid var(--gui-border-default, #21262d);
}

.notif-center__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gui-accent, #58a6ff);
}

.notif-center__header-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--gui-text-primary, #e6edf3);
}

.notif-center__badge {
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--gui-error-bg);
  color: var(--gui-text-primary, #fff);
  min-width: 18px;
  text-align: center;
}

.notif-center__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notif-center__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.notif-center__btn--ghost {
  background: transparent;
  color: var(--gui-text-tertiary, #8b949e);
}

.notif-center__btn--ghost:hover {
  background: var(--gui-bg-surface-hover, #21262d);
  color: var(--gui-text-secondary, #c9d1d9);
}

.notif-center__prefs {
  padding: 12px 16px;
  background: var(--gui-bg-surface, #161b22);
  border-bottom: 1px solid var(--gui-border-default, #21262d);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-center__pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-center__pref-label {
  font-size: 12px;
  color: var(--gui-text-tertiary, #8b949e);
}

.notif-center__toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--gui-border-default, #30363d);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.notif-center__toggle--on {
  background: var(--gui-success, #238636);
}

.notif-center__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gui-text-inverse, #fff);
  transition: transform 0.2s;
}

.notif-center__toggle--on .notif-center__toggle-knob {
  transform: translateX(16px);
}

.notif-slide-enter-active,
.notif-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.notif-slide-enter-from,
.notif-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.notif-slide-enter-to,
.notif-slide-leave-from {
  opacity: 1;
  max-height: 200px;
}

.notif-center__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.notif-center__loading {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.notif-center__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gui-border-default);
  border-top-color: var(--gui-accent);
  border-radius: 50%;
  animation: notif-spin 0.8s linear infinite;
}

@keyframes notif-spin {
  to {
    transform: rotate(360deg);
  }
}

.notif-center__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--gui-text-disabled, #484f58);
  font-size: 12px;
}

.notif-center__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notif-center__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--gui-bg-surface);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.notif-center__item:hover {
  border-color: var(--gui-border-default, #30363d);
  background: var(--gui-bg-surface-hover, #1c2129);
}

.notif-center__item--unread {
  border-left: 3px solid var(--gui-accent);
  background: var(--gui-accent-soft);
}

.notif-center__item-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-center__item-icon--feedback_comment {
  background: var(--gui-accent-soft);
  color: var(--gui-accent, #58a6ff);
}
.notif-center__item-icon--feedback_upvote {
  background: var(--gui-success-bg);
  color: var(--gui-success);
}
.notif-center__item-icon--feedback_downvote {
  background: var(--gui-warning-bg);
  color: var(--gui-warning);
}
.notif-center__item-icon--chat_message {
  background: var(--gui-accent-soft);
  color: var(--gui-accent);
}

.notif-center__item-content {
  flex: 1;
  min-width: 0;
}

.notif-center__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.notif-center__item-type {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-text-tertiary, #8b949e);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.notif-center__item-time {
  font-size: 10px;
  color: var(--gui-text-disabled, #484f58);
}

.notif-center__item-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--gui-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-center__item-body {
  font-size: 11px;
  color: var(--gui-text-tertiary, #8b949e);
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-center__item-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--gui-text-disabled, #484f58);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}

.notif-center__item:hover .notif-center__item-delete {
  opacity: 1;
}
.notif-center__item-delete:hover {
  background: var(--gui-error-bg);
  color: var(--gui-error);
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .notif-center__panel {
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
}
.light .notif-center__item {
  background: var(--gui-bg-surface-hover, rgba(0, 0, 0, 0.04));
}
.light .notif-center__item:hover {
  background: var(--gui-bg-surface-hover, rgba(0, 0, 0, 0.06));
}
</style>

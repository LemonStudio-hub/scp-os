<template>
  <PCWindow :window-instance="windowInstance" @close="$emit('close')">
    <div class="pc-feedback">
      <div class="pc-feedback__content">
        <!-- Tab Bar -->
        <div class="pc-feedback__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="pc-feedback__tab"
            :class="{ 'pc-feedback__tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Submit Form -->
        <div v-if="activeTab === 'submit'" class="pc-feedback__form">
          <div class="pc-feedback__form-group">
            <label class="pc-feedback__label">{{ t('fb.formTitle') }}</label>
            <input
              v-model="form.title"
              type="text"
              class="pc-feedback__input"
              :placeholder="t('fb.formTitlePlaceholder')"
              maxlength="100"
            />
          </div>

          <div class="pc-feedback__form-group">
            <label class="pc-feedback__label">{{ t('fb.formCategory') }}</label>
            <div class="pc-feedback__categories">
              <button
                v-for="cat in categories"
                :key="cat.id"
                class="pc-feedback__category"
                :class="{ 'pc-feedback__category--active': form.category === cat.id }"
                @click="form.category = cat.id"
              >
                {{ cat.icon }} {{ cat.label }}
              </button>
            </div>
          </div>

          <div class="pc-feedback__form-group">
            <label class="pc-feedback__label">{{ t('fb.formContent') }}</label>
            <textarea
              v-model="form.content"
              class="pc-feedback__textarea"
              :placeholder="t('fb.formContentPlaceholder')"
              rows="6"
              maxlength="2000"
            />
            <div class="pc-feedback__char-count">{{ form.content.length }}/2000</div>
          </div>

          <button
            class="pc-feedback__submit-btn"
            :disabled="!canSubmit || isSubmitting"
            @click="submitFeedback"
          >
            {{ isSubmitting ? t('fb.submitting') : t('fb.submitBtn') }}
          </button>
        </div>

        <!-- Feedback List -->
        <div v-else class="pc-feedback__list">
          <!-- Loading -->
          <div v-if="isLoading" class="pc-feedback__loading">
            <div class="pc-feedback__loading-dot" />
            <div class="pc-feedback__loading-dot" />
            <div class="pc-feedback__loading-dot" />
          </div>

          <!-- Empty State -->
          <div v-else-if="feedbacks.length === 0" class="pc-feedback__empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z" />
              <path d="M16 20h16M16 26h10" />
            </svg>
            <p>{{ t('fb.emptyTitle') }}</p>
          </div>

          <!-- Feedback Items -->
          <div v-else class="pc-feedback__items">
            <div v-for="item in feedbacks" :key="item.id" class="pc-feedback__item">
              <div class="pc-feedback__item-header">
                <div class="pc-feedback__item-user">
                  <div class="pc-feedback__avatar">{{ item.nickname.charAt(0).toUpperCase() }}</div>
                  <div class="pc-feedback__item-info">
                    <span class="pc-feedback__item-name">{{ item.nickname }}</span>
                    <span class="pc-feedback__item-time">{{ formatTime(item.created_at) }}</span>
                  </div>
                </div>
                <span class="pc-feedback__item-category">{{ getCategoryIcon(item.category) }}</span>
              </div>
              <h3 class="pc-feedback__item-title">{{ item.title }}</h3>
              <p class="pc-feedback__item-content">{{ item.content }}</p>
              <div class="pc-feedback__item-footer">
                <div class="pc-feedback__votes">
                  <button
                    class="pc-feedback__vote-btn"
                    :class="{ 'pc-feedback__vote-btn--up': item.userVote === 'up' }"
                    :disabled="isVoting[item.id]"
                    @click="voteFeedback(item, 'up')"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 9h2.5V15H2V9z" fill="currentColor" />
                      <path
                        d="M5.5 9l2.5-5.5V2a1 1 0 011-1h.5L11 4.5V7h3a1 1 0 011 1.1l-1.2 5.5a1 1 0 01-1 .9H5.5V9z"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>{{ item.upvotes || 0 }}</span>
                  </button>
                  <button
                    class="pc-feedback__vote-btn"
                    :class="{ 'pc-feedback__vote-btn--down': item.userVote === 'down' }"
                    :disabled="isVoting[item.id]"
                    @click="voteFeedback(item, 'down')"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 7h2.5V1H2v6z" fill="currentColor" />
                      <path
                        d="M5.5 7l2.5 5.5V14a1 1 0 001 1h.5L11 11.5V9h3a1 1 0 011-1.1l-1.2-5.5a1 1 0 00-1-.9H5.5V7z"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>{{ item.downvotes || 0 }}</span>
                  </button>
                </div>
                <button class="pc-feedback__comment-btn" @click="toggleComments(item)">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5V10z"
                    />
                  </svg>
                  <span>{{ item.commentsCount || 0 }}</span>
                </button>
              </div>

              <!-- Comments Section -->
              <div v-if="isCommentsExpanded(item.id)" class="pc-feedback__comments">
                <div v-if="isLoadingComments[item.id]" class="pc-feedback__comments-loading">
                  <div class="pc-feedback__loading-dot" />
                  <div class="pc-feedback__loading-dot" />
                  <div class="pc-feedback__loading-dot" />
                </div>
                <div v-else-if="item.comments.length === 0" class="pc-feedback__comments-empty">
                  {{ t('fb.noComments') }}
                </div>
                <div v-else class="pc-feedback__comments-list">
                  <div
                    v-for="comment in item.comments"
                    :key="comment.id"
                    class="pc-feedback__comment"
                  >
                    <div class="pc-feedback__comment-header">
                      <div class="pc-feedback__comment-avatar">
                        {{ comment.nickname.charAt(0).toUpperCase() }}
                      </div>
                      <div class="pc-feedback__comment-info">
                        <span class="pc-feedback__comment-name">{{ comment.nickname }}</span>
                        <span class="pc-feedback__comment-time">{{
                          formatTime(comment.created_at)
                        }}</span>
                      </div>
                    </div>
                    <p class="pc-feedback__comment-content">{{ comment.content }}</p>
                  </div>
                </div>

                <!-- Comment Form -->
                <div class="pc-feedback__comment-form">
                  <textarea
                    v-model="commentForms[item.id]"
                    class="pc-feedback__comment-input"
                    :placeholder="t('fb.addCommentPlaceholder')"
                    rows="2"
                    maxlength="500"
                  />
                  <button
                    class="pc-feedback__comment-submit"
                    :disabled="!commentForms[item.id]?.trim() || isSubmittingComment[item.id]"
                    @click="submitComment(item.id)"
                  >
                    {{ isSubmittingComment[item.id] ? t('fb.submitting') : t('fb.submitBtn') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <button
            v-if="hasMore"
            class="pc-feedback__load-more"
            :disabled="isLoadingMore"
            @click="loadMore"
          >
            {{ isLoadingMore ? t('common.loading') : t('fb.loadMore') }}
          </button>
        </div>
      </div>
    </div>
  </PCWindow>
</template>

<script setup lang="ts">
import PCWindow from '../../components/PCWindow.vue'
import { useI18n } from '../../composables/useI18n'
import { useFeedback } from '../../composables/useFeedback'
import type { WindowInstance } from '../../types'

interface Props {
  visible?: boolean
  windowInstance?: WindowInstance
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const { t } = useI18n()
const {
  tabs,
  activeTab,
  form,
  categories,
  canSubmit,
  isSubmitting,
  feedbacks,
  isLoading,
  isLoadingMore,
  hasMore,
  commentForms,
  isSubmittingComment,
  isLoadingComments,
  isVoting,
  submitFeedback,
  loadMore,
  voteFeedback,
  toggleComments,
  isCommentsExpanded,
  submitComment,
  formatTime,
  getCategoryIcon,
} = useFeedback()
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.pc-feedback {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0a0a0a);
}

.pc-feedback__content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gui-border-subtle, #38383a) var(--gui-bg-surface, #2c2c2e);
}

.pc-feedback__content::-webkit-scrollbar {
  width: 8px;
}

.pc-feedback__content::-webkit-scrollbar-track {
  background: var(--gui-bg-surface, #1c1c1e);
}

.pc-feedback__content::-webkit-scrollbar-thumb {
  background-color: var(--gui-border-subtle, #38383a);
  border-radius: 4px;
}

/* ── Tabs ───────────────────────────────────────────────────────────── */
.pc-feedback__tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: var(--gui-bg-surface, #1c1c1e);
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383a);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.pc-feedback__tab {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  border-bottom: 2px solid transparent;
}

.pc-feedback__tab:hover {
  color: var(--gui-text-primary, #ffffff);
}

.pc-feedback__tab--active {
  color: var(--gui-accent, #007aff);
  border-bottom-color: var(--gui-accent, #007aff);
}

/* ── Form ───────────────────────────────────────────────────────────── */
.pc-feedback__form {
  padding: 16px;
}

.pc-feedback__form-group {
  margin-bottom: 20px;
}

.pc-feedback__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  margin-bottom: 8px;
}

.pc-feedback__input,
.pc-feedback__textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 0.5px solid var(--gui-border-subtle, #38383a);
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.pc-feedback__input:focus,
.pc-feedback__textarea:focus {
  border-color: var(--gui-accent, #007aff);
}

.pc-feedback__textarea {
  resize: none;
  min-height: 120px;
  font-family: inherit;
}

.pc-feedback__char-count {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  text-align: right;
  margin-top: 4px;
}

/* ── Categories ─────────────────────────────────────────────────────── */
.pc-feedback__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pc-feedback__category {
  padding: 8px 14px;
  border-radius: 16px;
  border: 0.5px solid var(--gui-border-subtle, #38383a);
  background: var(--gui-bg-surface, #1c1c1e);
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pc-feedback__category:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

.pc-feedback__category--active {
  background: var(--gui-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  border-color: var(--gui-accent, #007aff);
}

/* ── Submit Button ──────────────────────────────────────────────────── */
.pc-feedback__submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: var(--gui-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.1s ease;
}

.pc-feedback__submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-feedback__submit-btn:not(:disabled):hover {
  opacity: 0.9;
}

.pc-feedback__submit-btn:not(:disabled):active {
  transform: scale(0.98);
}

/* ── Feedback List ──────────────────────────────────────────────────── */
.pc-feedback__list {
  padding: 16px;
}

.pc-feedback__loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 40px 0;
}

.pc-feedback__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gui-accent, #007aff);
  animation: feedback-bounce 1.2s ease-in-out infinite;
}

.pc-feedback__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.pc-feedback__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes feedback-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.pc-feedback__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--gui-text-tertiary, #636366);
  gap: 12px;
  text-align: center;
}

.pc-feedback__items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Feedback Item ──────────────────────────────────────────────────── */
.pc-feedback__item {
  background: var(--gui-bg-surface, #1c1c1e);
  border-radius: 14px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383a);
  animation: feedback-fade-in 0.3s ease;
  transition: box-shadow 0.2s ease;
}

.pc-feedback__item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes feedback-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pc-feedback__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pc-feedback__item-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pc-feedback__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gui-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.pc-feedback__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-feedback__item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
}

.pc-feedback__item-time {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-feedback__item-category {
  font-size: 18px;
}

.pc-feedback__item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  margin: 0 0 8px;
}

.pc-feedback__item-content {
  font-size: 14px;
  color: var(--gui-text-secondary, #8e8e93);
  line-height: 1.5;
  margin: 0 0 12px;
  word-wrap: break-word;
}

.pc-feedback__item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383a);
}

.pc-feedback__votes {
  display: flex;
  gap: 12px;
}

.pc-feedback__vote-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.pc-feedback__vote-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
}

.pc-feedback__vote-btn--up {
  color: var(--gui-success, #34c759);
  background: rgba(52, 199, 89, 0.1);
}

.pc-feedback__vote-btn--down {
  color: var(--gui-error, #ff3b30);
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.1));
}

.pc-feedback__vote-btn:active {
  transform: scale(0.95);
}

.pc-feedback__comment-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.pc-feedback__comment-btn:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #ffffff);
}

.pc-feedback__comment-btn:active {
  transform: scale(0.95);
}

/* ── Comments ───────────────────────────────────────────────────────── */
.pc-feedback__comments {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383a);
}

.pc-feedback__comments-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
}

.pc-feedback__comments-empty {
  padding: 20px 0;
  color: var(--gui-text-tertiary, #636366);
  text-align: center;
  font-size: 13px;
}

.pc-feedback__comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.pc-feedback__comment {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-radius: 12px;
  padding: 12px;
}

.pc-feedback__comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pc-feedback__comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gui-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.pc-feedback__comment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pc-feedback__comment-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
}

.pc-feedback__comment-time {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-feedback__comment-content {
  font-size: 14px;
  color: var(--gui-text-secondary, #8e8e93);
  line-height: 1.4;
  margin: 0;
  word-wrap: break-word;
}

.pc-feedback__comment-form {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.pc-feedback__comment-input {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 0.5px solid var(--gui-border-subtle, #38383a);
  background: var(--gui-bg-surface, #1c1c1e);
  color: var(--gui-text-primary, #ffffff);
  font-size: 13px;
  outline: none;
  resize: none;
  font-family: inherit;
  min-height: 40px;
}

.pc-feedback__comment-input:focus {
  border-color: var(--gui-accent, #007aff);
}

.pc-feedback__comment-submit {
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: var(--gui-accent, #007aff);
  color: var(--gui-text-primary, #ffffff);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  min-height: 40px;
  white-space: nowrap;
}

.pc-feedback__comment-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-feedback__comment-submit:not(:disabled):hover {
  opacity: 0.9;
}

/* ── Load More ──────────────────────────────────────────────────────── */
.pc-feedback__load-more {
  width: 100%;
  height: 44px;
  margin-top: 16px;
  border-radius: 12px;
  border: 0.5px solid var(--gui-border-subtle, #38383a);
  background: var(--gui-bg-surface, #1c1c1e);
  color: var(--gui-text-primary, #ffffff);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.pc-feedback__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-feedback__load-more:not(:disabled):hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .pc-feedback__item {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.light .pc-feedback__item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.light .pc-feedback__compose {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.light .pc-feedback__category--active {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--gui-accent, #636366);
  border-color: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
}
.light .pc-feedback__submit-btn {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--gui-accent, #636366);
}
.light .pc-feedback__submit-btn:not(:disabled):hover {
  background: rgba(99, 99, 102, 0.2);
}
.light .pc-feedback__avatar {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--gui-accent, #636366);
}
.light .pc-feedback__comment-avatar {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--gui-accent, #636366);
}
.light .pc-feedback__comment-submit {
  background: var(--gui-accent-soft, rgba(99, 99, 102, 0.15));
  color: var(--gui-accent, #636366);
}
.light .pc-feedback__comment-submit:not(:disabled):hover {
  background: rgba(99, 99, 102, 0.2);
}
.light .pc-feedback__loading-dot {
  background: var(--gui-accent, #636366);
}
</style>

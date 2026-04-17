<template>
  <PCWindow
    :visible="visible"
    :title="t('fb.title')"
    @close="$emit('close')"
  >
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
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M24 44c11 0 20-8 20-18S35 8 24 8 4 16 4 26s9 18 20 18z"/>
              <path d="M16 20h16M16 26h10"/>
            </svg>
            <p>{{ t('fb.emptyTitle') }}</p>
          </div>

          <!-- Feedback Items -->
          <div v-else class="pc-feedback__items">
            <div
              v-for="item in feedbacks"
              :key="item.id"
              class="pc-feedback__item"
            >
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
                    :class="{ 'pc-feedback__vote-btn--active': item.userVote === 'up' }"
                    @click="voteFeedback(item, 'up')"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M8 3l-4 4 1.41 1.41L8 6.83l2.59 2.58L12 7l-4-4z"/>
                    </svg>
                    <span>{{ item.upvotes || 0 }}</span>
                  </button>
                  <button 
                    class="pc-feedback__vote-btn"
                    :class="{ 'pc-feedback__vote-btn--active': item.userVote === 'down' }"
                    @click="voteFeedback(item, 'down')"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M8 13l4-4-1.41-1.41L8 10.17 5.41 7.58 4 9l4 4z"/>
                    </svg>
                    <span>{{ item.downvotes || 0 }}</span>
                  </button>
                </div>
                <button 
                  class="pc-feedback__comment-btn"
                  @click="toggleComments(item)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>{{ item.commentsCount || 0 }}</span>
                </button>
              </div>

              <!-- Comments Section -->
              <div v-if="item.showComments" class="pc-feedback__comments">
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
                      <div class="pc-feedback__comment-avatar">{{ comment.nickname.charAt(0).toUpperCase() }}</div>
                      <div class="pc-feedback__comment-info">
                        <span class="pc-feedback__comment-name">{{ comment.nickname }}</span>
                        <span class="pc-feedback__comment-time">{{ formatTime(comment.created_at) }}</span>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import PCWindow from '../../components/PCWindow.vue'
import { config } from '../../../config'
import indexedDBService from '../../../utils/indexedDB'
import { useI18n } from '../../composables/useI18n'
import { useAuthStore } from '../../../stores/authStore'
import logger from '../../../utils/logger'

interface FeedbackItem {
  id: number
  user_id: string
  nickname: string
  title: string
  content: string
  category: string
  status: string
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  commentsCount: number
  userVote?: 'up' | 'down' | null
  showComments: boolean
  comments: CommentItem[]
}

interface CommentItem {
  id: number
  feedback_id: number
  user_id: string
  nickname: string
  content: string
  created_at: string
  updated_at: string
}

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const { t } = useI18n()
const authStore = useAuthStore()

const API_BASE = config.api.workerUrl

const tabs = computed(() => [
  { id: 'list', label: t('fb.tabAll') },
  { id: 'submit', label: t('fb.tabSubmit') },
])
const activeTab = ref('list')

const form = reactive({
  title: '',
  content: '',
  category: 'general',
})

const categories = computed(() => [
  { id: 'general', label: t('fb.catGeneral'), icon: 'Msg' },
  { id: 'bug', label: t('fb.catBug'), icon: 'Bug' },
  { id: 'feature', label: t('fb.catFeature'), icon: 'Feat' },
  { id: 'improvement', label: t('fb.catImprovement'), icon: 'Tool' },
  { id: 'other', label: t('fb.catOther'), icon: 'Note' },
])

const canSubmit = computed(() => form.title.trim() && form.content.trim())
const isSubmitting = ref(false)

const feedbacks = ref<FeedbackItem[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const offset = ref(0)
const limit = 20
let userId = ''

const commentForms = ref<Record<string, string>>({})
const isSubmittingComment = ref<Record<string, boolean>>({})
const isLoadingComments = ref<Record<string, boolean>>({})

onMounted(async () => {
  userId = authStore.userId || await indexedDBService.getUserId()
  loadFeedbacks()
})

watch(() => authStore.userId, (newUserId) => {
  if (newUserId) {
    userId = newUserId
  }
})

async function submitFeedback() {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await fetch(`${API_BASE}/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        nickname: authStore.nickname || undefined,
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
      }),
    })

    const data = await response.json()
    if (data.success) {
      form.title = ''
      form.content = ''
      form.category = 'general'
      activeTab.value = 'list'
      offset.value = 0
      await loadFeedbacks()
    }
  } catch (error) {
    logger.error('[Feedback] Failed to submit:', error as Error)
  } finally {
    isSubmitting.value = false
  }
}

function normalizeFeedback(raw: Record<string, unknown>): FeedbackItem {
  return {
    id: raw.id as number,
    user_id: raw.user_id as string,
    nickname: (raw.nickname as string) || 'Anonymous',
    title: raw.title as string,
    content: raw.content as string,
    category: (raw.category as string) || 'general',
    status: (raw.status as string) || 'published',
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
    upvotes: (raw.upvotes as number) || 0,
    downvotes: (raw.downvotes as number) || 0,
    commentsCount: (raw.commentsCount as number) || 0,
    userVote: (raw.userVote as 'up' | 'down') || null,
    showComments: false,
    comments: [],
  }
}

async function loadFeedbacks() {
  isLoading.value = true
  try {
    const response = await fetch(
      `${API_BASE}/feedback/list-with-votes?limit=${limit}&offset=${offset.value}&user_id=${encodeURIComponent(userId)}`
    )
    const data = await response.json()

    if (data.success && data.data) {
      const items = (data.data as Record<string, unknown>[]).map(normalizeFeedback)
      if (offset.value === 0) {
        feedbacks.value = items
      } else {
        feedbacks.value.push(...items)
      }
      hasMore.value = data.count > offset.value + limit
    }
  } catch (error) {
    logger.error('[Feedback] Failed to load:', error as Error)
  } finally {
    isLoading.value = false
  }
}

async function loadMore() {
  isLoadingMore.value = true
  offset.value += limit
  await loadFeedbacks()
  isLoadingMore.value = false
}

async function voteFeedback(item: FeedbackItem, voteType: 'up' | 'down') {
  try {
    const response = await fetch(`${API_BASE}/feedback/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        user_id: userId,
        vote: voteType
      }),
    })

    const data = await response.json()
    if (data.success) {
      const action = data.data?.action
      if (action === 'removed') {
        if (voteType === 'up') {
          item.upvotes = Math.max(0, (item.upvotes || 0) - 1)
        } else {
          item.downvotes = Math.max(0, (item.downvotes || 0) - 1)
        }
        item.userVote = null
      } else if (action === 'changed') {
        if (voteType === 'up') {
          item.upvotes = (item.upvotes || 0) + 1
          item.downvotes = Math.max(0, (item.downvotes || 0) - 1)
        } else {
          item.downvotes = (item.downvotes || 0) + 1
          item.upvotes = Math.max(0, (item.upvotes || 0) - 1)
        }
        item.userVote = voteType
      } else {
        if (voteType === 'up') {
          item.upvotes = (item.upvotes || 0) + 1
        } else {
          item.downvotes = (item.downvotes || 0) + 1
        }
        item.userVote = voteType
      }
    }
  } catch (error) {
    logger.error('[Feedback] Failed to vote:', error as Error)
  }
}

async function toggleComments(item: FeedbackItem) {
  item.showComments = !item.showComments

  if (item.showComments && item.comments.length === 0) {
    await loadComments(item)
  }
}

async function loadComments(item: FeedbackItem) {
  isLoadingComments.value[item.id] = true
  try {
    const response = await fetch(`${API_BASE}/feedback/comments?feedback_id=${item.id}`)
    const data = await response.json()

    if (data.success) {
      item.comments = (data.data as CommentItem[]) || []
    }
  } catch (error) {
    logger.error('[Feedback] Failed to load comments:', error as Error)
  } finally {
    isLoadingComments.value[item.id] = false
  }
}

async function submitComment(feedbackId: number) {
  const content = commentForms.value[feedbackId]?.trim()
  if (!content || isSubmittingComment.value[feedbackId]) return

  isSubmittingComment.value[feedbackId] = true
  try {
    const response = await fetch(`${API_BASE}/feedback/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback_id: feedbackId,
        user_id: userId,
        nickname: authStore.nickname || undefined,
        content: content
      }),
    })

    const data = await response.json()
    if (data.success) {
      const feedback = feedbacks.value.find(f => f.id === feedbackId)
      if (feedback) {
        feedback.comments.push(data.data as CommentItem)
        feedback.commentsCount = (feedback.commentsCount || 0) + 1
        commentForms.value[feedbackId] = ''
      }
    }
  } catch (error) {
    logger.error('[Feedback] Failed to submit comment:', error as Error)
  } finally {
    isSubmittingComment.value[feedbackId] = false
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('fb.timeJustNow')
  if (diff < 3600000) return t('fb.timeMinAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('fb.timeHourAgo', { n: Math.floor(diff / 3600000) })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getCategoryIcon(category: string): string {
  return categories.value.find(c => c.id === category)?.icon || 'Msg'
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.pc-feedback {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #0A0A0A);
}

.pc-feedback__content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gui-border-subtle, #38383A) var(--gui-bg-surface, #2C2C2E);
}

.pc-feedback__content::-webkit-scrollbar {
  width: 8px;
}

.pc-feedback__content::-webkit-scrollbar-track {
  background: var(--gui-bg-surface, #2C2C2E);
}

.pc-feedback__content::-webkit-scrollbar-thumb {
  background-color: var(--gui-border-subtle, #38383A);
  border-radius: 4px;
}

/* ── Tabs ───────────────────────────────────────────────────────────── */
.pc-feedback__tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: var(--gui-bg-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.pc-feedback__tab {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  border-bottom: 2px solid transparent;
}

.pc-feedback__tab:hover {
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-feedback__tab--active {
  color: var(--gui-accent, #007AFF);
  border-bottom-color: var(--gui-accent, #007AFF);
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
  color: var(--gui-text-primary, #FFFFFF);
  margin-bottom: 8px;
}

.pc-feedback__input,
.pc-feedback__textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.pc-feedback__input:focus,
.pc-feedback__textarea:focus {
  border-color: var(--gui-accent, #007AFF);
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
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  background: var(--gui-bg-surface, #2C2C2E);
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pc-feedback__category:hover {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}

.pc-feedback__category--active {
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
  border-color: var(--gui-accent, #007AFF);
}

/* ── Submit Button ──────────────────────────────────────────────────── */
.pc-feedback__submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
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
  background: var(--gui-accent, #007AFF);
  animation: feedback-bounce 1.2s ease-in-out infinite;
}

.pc-feedback__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.pc-feedback__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes feedback-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
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
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 14px;
  padding: 14px;
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  animation: feedback-fade-in 0.3s ease;
  transition: box-shadow 0.2s ease;
}

.pc-feedback__item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes feedback-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
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
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
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
  color: var(--gui-text-primary, #FFFFFF);
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
  color: var(--gui-text-primary, #FFFFFF);
  margin: 0 0 8px;
}

.pc-feedback__item-content {
  font-size: 14px;
  color: var(--gui-text-secondary, #8E8E93);
  line-height: 1.5;
  margin: 0 0 12px;
  word-wrap: break-word;
}

.pc-feedback__item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
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
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.pc-feedback__vote-btn:hover {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-feedback__vote-btn--active {
  color: var(--gui-accent, #007AFF);
  background: rgba(0, 122, 255, 0.1);
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
  color: var(--gui-text-secondary, #8E8E93);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.pc-feedback__comment-btn:hover {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-feedback__comment-btn:active {
  transform: scale(0.95);
}

/* ── Comments ───────────────────────────────────────────────────────── */
.pc-feedback__comments {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
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
  background: var(--gui-bg-surface-hover, #3A3A3C);
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
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
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
  color: var(--gui-text-primary, #FFFFFF);
}

.pc-feedback__comment-time {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-feedback__comment-content {
  font-size: 14px;
  color: var(--gui-text-secondary, #8E8E93);
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
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  background: var(--gui-bg-surface, #2C2C2E);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 13px;
  outline: none;
  resize: none;
  font-family: inherit;
  min-height: 40px;
}

.pc-feedback__comment-input:focus {
  border-color: var(--gui-accent, #007AFF);
}

.pc-feedback__comment-submit {
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
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
  border: 0.5px solid var(--gui-border-subtle, #38383A);
  background: var(--gui-bg-surface, #2C2C2E);
  color: var(--gui-text-primary, #FFFFFF);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.pc-feedback__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pc-feedback__load-more:not(:disabled):hover {
  background: var(--gui-bg-surface-hover, #3A3A3C);
}
</style>
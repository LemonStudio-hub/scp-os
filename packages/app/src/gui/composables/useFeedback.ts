import { computed, onMounted, reactive, ref, watch } from 'vue'
import { config } from '../../config'
import { useAuthStore } from '../../stores/authStore'
import indexedDBService from '../../utils/indexedDB'
import logger from '../../utils/logger'
import { useI18n } from './useI18n'
import type { Comment, FeedbackForm, FeedbackItem, FeedbackVote } from '../types/feedback'

interface FeedbackListResponse {
  success: boolean
  data?: Record<string, unknown>[]
  count?: number
}

interface FeedbackMutationResponse {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

const API_BASE = config.api.workerUrl
const DEFAULT_LIMIT = 20

export function normalizeFeedback(raw: Record<string, unknown>): FeedbackItem {
  const userVote = raw.userVote === 'up' || raw.userVote === 'down' ? raw.userVote : null

  return {
    id: Number(raw.id),
    user_id: String(raw.user_id || ''),
    nickname: String(raw.nickname || 'Anonymous'),
    title: String(raw.title || ''),
    content: String(raw.content || ''),
    category: String(raw.category || 'general'),
    status: String(raw.status || 'published'),
    created_at: String(raw.created_at || ''),
    updated_at: String(raw.updated_at || ''),
    upvotes: Number(raw.upvotes || 0),
    downvotes: Number(raw.downvotes || 0),
    commentsCount: Number(raw.commentsCount ?? raw.comments_count ?? 0),
    userVote,
    showComments: false,
    comments: [],
  }
}

function normalizeComment(raw: Record<string, unknown>): Comment {
  return {
    id: Number(raw.id),
    feedback_id: Number(raw.feedback_id),
    user_id: String(raw.user_id || ''),
    nickname: String(raw.nickname || 'Anonymous'),
    content: String(raw.content || ''),
    created_at: String(raw.created_at || ''),
    updated_at: String(raw.updated_at || ''),
  }
}

export function useFeedback() {
  const { t } = useI18n()
  const authStore = useAuthStore()
  // `t` is returned for callers that still destructure it from useFeedback.

  const tabs = computed(() => [
    { id: 'list', label: t('fb.tabAll') },
    { id: 'submit', label: t('fb.tabSubmit') },
  ])
  const activeTab = ref('list')

  const form = reactive<FeedbackForm>({
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

  const canSubmit = computed(() => Boolean(form.title.trim() && form.content.trim()))
  const isSubmitting = ref(false)

  const feedbacks = ref<FeedbackItem[]>([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMore = ref(false)
  const offset = ref(0)
  const userId = ref('')

  const commentForms = ref<Record<number, string>>({})
  const isSubmittingComment = ref<Record<number, boolean>>({})
  const isLoadingComments = ref<Record<number, boolean>>({})
  const isVoting = ref<Record<number, boolean>>({})
  const expandedComments = ref<Record<number, boolean>>({})

  onMounted(async () => {
    userId.value = authStore.userId || (await indexedDBService.getUserId())
    void loadFeedbacks()
  })

  watch(
    () => authStore.userId,
    (newUserId) => {
      if (newUserId) userId.value = newUserId
    }
  )

  async function submitFeedback(): Promise<void> {
    if (!canSubmit.value || isSubmitting.value) return
    if (!userId.value) {
      alert(t('fb.loginRequired'))
      return
    }

    isSubmitting.value = true
    try {
      const response = await authStore.authFetch(`${API_BASE}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          nickname: authStore.nickname || undefined,
        }),
      })

      const data = (await response.json()) as FeedbackMutationResponse
      if (data.success) {
        form.title = ''
        form.content = ''
        form.category = 'general'
        activeTab.value = 'list'
        offset.value = 0
        await loadFeedbacks()
      } else {
        alert(t('fb.submitFailed', { msg: data.error || 'Unknown error' }))
      }
    } catch (error) {
      logger.error('[Feedback] Failed to submit:', error as Error)
      alert(t('fb.submitFailed', { msg: (error as Error).message }))
    } finally {
      isSubmitting.value = false
    }
  }

  async function loadFeedbacks(silent = false): Promise<void> {
    if (!silent) isLoading.value = true
    try {
      const response = await fetch(
        `${API_BASE}/feedback/list-with-votes?limit=${DEFAULT_LIMIT}&offset=${offset.value}&user_id=${encodeURIComponent(userId.value)}`
      )
      const data = (await response.json()) as FeedbackListResponse

      if (data.success && data.data) {
        const items = data.data.map(normalizeFeedback)
        if (offset.value === 0) {
          feedbacks.value = items
        } else {
          feedbacks.value.push(...items)
        }
        hasMore.value = (data.count || 0) > offset.value + DEFAULT_LIMIT
      }
    } catch (error) {
      logger.error('[Feedback] Failed to load:', error as Error)
    } finally {
      if (!silent) isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (isLoadingMore.value) return
    isLoadingMore.value = true
    offset.value += DEFAULT_LIMIT
    try {
      await loadFeedbacks()
    } finally {
      isLoadingMore.value = false
    }
  }

  async function voteFeedback(item: FeedbackItem, voteType: FeedbackVote): Promise<void> {
    if (isVoting.value[item.id]) return
    if (!userId.value) {
      alert(t('fb.loginRequired'))
      return
    }
    isVoting.value[item.id] = true

    try {
      const response = await authStore.authFetch(`${API_BASE}/feedback/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          vote: voteType,
        }),
      })

      const data = (await response.json()) as FeedbackMutationResponse
      if (data.success) {
        applyVote(item.id, voteType, String(data.data?.action || ''))
        await loadFeedbacks(true)
      } else {
        alert(t('fb.voteFailed', { msg: data.error || 'Unknown error' }))
      }
    } catch (error) {
      logger.error('[Feedback] Failed to vote:', error as Error)
      alert(t('fb.voteFailed', { msg: (error as Error).message }))
    } finally {
      isVoting.value[item.id] = false
    }
  }

  function applyVote(feedbackId: number, voteType: FeedbackVote, action: string): void {
    const feedback = feedbacks.value.find((f) => f.id === feedbackId)
    if (!feedback) return

    if (action === 'removed') {
      if (voteType === 'up') {
        feedback.upvotes = Math.max(0, (feedback.upvotes || 0) - 1)
      } else {
        feedback.downvotes = Math.max(0, (feedback.downvotes || 0) - 1)
      }
      feedback.userVote = null
    } else if (action === 'changed') {
      if (voteType === 'up') {
        feedback.upvotes = (feedback.upvotes || 0) + 1
        feedback.downvotes = Math.max(0, (feedback.downvotes || 0) - 1)
      } else {
        feedback.downvotes = (feedback.downvotes || 0) + 1
        feedback.upvotes = Math.max(0, (feedback.upvotes || 0) - 1)
      }
      feedback.userVote = voteType
    } else {
      if (voteType === 'up') {
        feedback.upvotes = (feedback.upvotes || 0) + 1
      } else {
        feedback.downvotes = (feedback.downvotes || 0) + 1
      }
      feedback.userVote = voteType
    }
  }

  async function toggleComments(item: FeedbackItem): Promise<void> {
    const isExpanded = Boolean(expandedComments.value[item.id])
    if (isExpanded) {
      delete expandedComments.value[item.id]
    } else {
      expandedComments.value[item.id] = true
    }

    if (!isExpanded && item.comments.length === 0) {
      await loadComments(item)
    }
  }

  function isCommentsExpanded(itemId: number): boolean {
    return Boolean(expandedComments.value[itemId])
  }

  async function loadComments(item: FeedbackItem): Promise<void> {
    isLoadingComments.value[item.id] = true
    try {
      const response = await fetch(`${API_BASE}/feedback/comments?feedback_id=${item.id}`)
      const data = (await response.json()) as FeedbackMutationResponse & {
        data?: Record<string, unknown>[]
      }

      if (data.success) {
        const feedback = feedbacks.value.find((f) => f.id === item.id)
        if (feedback) feedback.comments = (data.data || []).map(normalizeComment)
      }
    } catch (error) {
      logger.error('[Feedback] Failed to load comments:', error as Error)
    } finally {
      isLoadingComments.value[item.id] = false
    }
  }

  async function submitComment(feedbackId: number): Promise<void> {
    const content = commentForms.value[feedbackId]?.trim()
    if (!content || isSubmittingComment.value[feedbackId]) return
    if (!userId.value) {
      alert(t('fb.loginRequired'))
      return
    }

    isSubmittingComment.value[feedbackId] = true
    try {
      const response = await authStore.authFetch(`${API_BASE}/feedback/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: feedbackId,
          content,
          nickname: authStore.nickname || undefined,
        }),
      })

      const data = (await response.json()) as FeedbackMutationResponse
      if (data.success) {
        const feedback = feedbacks.value.find((f) => f.id === feedbackId)
        if (feedback && data.data) {
          feedback.comments.push(normalizeComment(data.data))
          feedback.commentsCount = (feedback.commentsCount || 0) + 1
          commentForms.value[feedbackId] = ''
        }
        await loadFeedbacks(true)
      } else {
        alert(t('fb.commentFailed', { msg: data.error || 'Unknown error' }))
      }
    } catch (error) {
      logger.error('[Feedback] Failed to submit comment:', error as Error)
      alert(t('fb.commentFailed', { msg: (error as Error).message }))
    } finally {
      isSubmittingComment.value[feedbackId] = false
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const diff = Date.now() - date.getTime()

    if (diff < 60000) return t('fb.timeJustNow')
    if (diff < 3600000) return t('fb.timeMinAgo', { n: Math.floor(diff / 60000) })
    if (diff < 86400000) return t('fb.timeHourAgo', { n: Math.floor(diff / 3600000) })
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  function getCategoryIcon(category: string): string {
    return categories.value.find((c) => c.id === category)?.icon || 'Msg'
  }

  return {
    t,
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
    offset,
    userId,
    commentForms,
    isSubmittingComment,
    isLoadingComments,
    isVoting,
    expandedComments,
    submitFeedback,
    loadFeedbacks,
    loadMore,
    voteFeedback,
    toggleComments,
    isCommentsExpanded,
    loadComments,
    submitComment,
    formatTime,
    getCategoryIcon,
  }
}

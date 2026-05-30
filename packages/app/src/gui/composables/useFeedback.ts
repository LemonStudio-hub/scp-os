import { ref, reactive, computed, onMounted } from 'vue'
import { config } from '../../config'
import indexedDBService from '../../utils/indexedDB'
import { useI18n } from './useI18n'
import { useAuthStore } from '../../stores/authStore'
import logger from '../../utils/logger'
import type { FeedbackItem, CommentItem, FeedbackCategory, FeedbackTab } from '../types/feedback'

export function useFeedback() {
  const { t } = useI18n()
  const authStore = useAuthStore()

  const API_BASE = config.api.workerUrl

  const tabs = computed<FeedbackTab[]>(() => [
    { id: 'list', label: t('fb.tabAll') },
    { id: 'submit', label: t('fb.tabSubmit') },
  ])
  const activeTab = ref('list')

  const form = reactive({
    title: '',
    content: '',
    category: 'general',
  })

  const categories = computed<FeedbackCategory[]>(() => [
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
  const isVoting = ref<Record<string, boolean>>({})
  const expandedComments = ref<Record<number, boolean>>({})

  onMounted(async () => {
    userId = authStore.userId || (await indexedDBService.getUserId())
    loadFeedbacks()
  })

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
      commentsCount: (raw.commentsCount as number) ?? (raw.comments_count as number) ?? 0,
      userVote: (raw.userVote as 'up' | 'down') ?? null,
      showComments: false,
      comments: [],
    }
  }

  async function submitFeedback() {
    if (!canSubmit.value || isSubmitting.value) return
    if (!userId) {
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

      const data = await response.json()
      if (response.ok && data.success) {
        form.title = ''
        form.content = ''
        form.category = 'general'
        activeTab.value = 'list'
        offset.value = 0
        await loadFeedbacks()
      } else {
        alert(t('fb.submitFailed', { msg: data.error || data.message || 'Unknown error' }))
      }
    } catch (error) {
      logger.error('[Feedback] Failed to submit:', error as Error)
      alert(t('fb.submitFailed', { msg: (error as Error).message }))
    } finally {
      isSubmitting.value = false
    }
  }

  async function loadFeedbacks() {
    isLoading.value = true
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset.value),
      })
      if (userId) params.set('user_id', userId)

      const response = await fetch(`${API_BASE}/feedback/list-with-votes?${params}`)
      const data = await response.json()

      if (response.ok && data.success && data.data) {
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
    if (isVoting.value[item.id]) return
    if (!userId) {
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

      const data = await response.json()
      if (response.ok && data.success) {
        const idx = feedbacks.value.findIndex((f) => f.id === item.id)
        if (idx === -1) return

        const feedback = feedbacks.value[idx]
        const action = data.data?.action
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

  async function toggleComments(item: FeedbackItem) {
    const isExpanded = !!expandedComments.value[item.id]
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
    return !!expandedComments.value[itemId]
  }

  async function loadComments(item: FeedbackItem) {
    isLoadingComments.value[item.id] = true
    try {
      const response = await fetch(`${API_BASE}/feedback/comments?feedback_id=${item.id}`)
      const data = await response.json()

      if (data.success) {
        const idx = feedbacks.value.findIndex((f) => f.id === item.id)
        if (idx !== -1) {
          feedbacks.value[idx].comments = (data.data as CommentItem[]) || []
        }
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
    if (!userId) {
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
          content: content,
          nickname: authStore.nickname || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        const idx = feedbacks.value.findIndex((f) => f.id === feedbackId)
        if (idx !== -1) {
          const feedback = feedbacks.value[idx]
          feedback.comments.push(data.data as CommentItem)
          feedback.commentsCount = (feedback.commentsCount || 0) + 1
          commentForms.value[feedbackId] = ''
        }
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
    const now = new Date()
    const diff = now.getTime() - date.getTime()

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

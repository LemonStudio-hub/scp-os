import type { ChatApiResponse } from '../shared/types'

export interface Feedback {
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
  comments_count: number
  userVote?: 'up' | 'down'
}

export interface FeedbackInput {
  user_id: string
  nickname?: string
  title: string
  content: string
  category?: string
}

export interface Comment {
  id: number
  feedback_id: number
  user_id: string
  nickname: string
  content: string
  created_at: string
  updated_at: string
}

export interface CommentInput {
  feedback_id: number
  user_id: string
  nickname?: string
  content: string
}

export interface VoteInput {
  id: number
  user_id: string
  vote: 'up' | 'down'
}

function normalizeFeedbackRow(row: Record<string, unknown>): Feedback {
  return {
    id: row.id as number,
    user_id: row.user_id as string,
    nickname: (row.nickname as string) || 'Anonymous',
    title: row.title as string,
    content: row.content as string,
    category: (row.category as string) || 'general',
    status: (row.status as string) || 'published',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    upvotes: (row.upvotes as number) || 0,
    downvotes: (row.downvotes as number) || 0,
    comments_count: (row.commentsCount as number) ?? (row.comments_count as number) ?? 0,
    userVote: (row.userVote as 'up' | 'down') || undefined,
  }
}

function buildFeedbackQuery(
  baseQuery: string,
  category?: string
): { query: string; params: any[] } {
  let query = baseQuery
  const params: any[] = ['published']

  if (category && category !== 'all') {
    query += ' AND category = ?'
    params.push(category)
  }

  return { query, params }
}

export async function submitFeedback(
  db: D1Database,
  input: FeedbackInput
): Promise<ChatApiResponse<Feedback | null>> {
  try {
    if (!input.title || input.title.length > 100) {
      return { success: false, error: 'Title must be 1-100 characters' }
    }
    if (!input.content || input.content.length > 2000) {
      return { success: false, error: 'Content must be 1-2000 characters' }
    }

    const validCategories = ['general', 'bug', 'feature', 'improvement', 'other']
    const category = validCategories.includes(input.category || '') ? input.category : 'general'

    const result = await db.prepare(
      `INSERT INTO feedbacks (user_id, nickname, title, content, category) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      input.user_id,
      input.nickname || 'Anonymous',
      input.title,
      input.content,
      category
    ).run()

    if (!result.success) {
      return { success: false, error: 'Failed to submit feedback' }
    }

    const row = await db.prepare(
      'SELECT * FROM feedbacks WHERE id = ?'
    ).bind(result.meta?.last_row_id).first()

    return { success: true, data: row ? normalizeFeedbackRow(row as Record<string, unknown>) : null }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function getFeedbackList(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  category?: string
): Promise<ChatApiResponse<Feedback[]>> {
  try {
    const { query, params } = buildFeedbackQuery(
      'SELECT * FROM feedbacks WHERE status = ?',
      category
    )

    const feedbacks = await db.prepare(
      `${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    const { query: countQuery, params: countParams } = buildFeedbackQuery(
      'SELECT COUNT(*) as total FROM feedbacks WHERE status = ?',
      category
    )

    const countResult = await db.prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()

    const normalized = (feedbacks.results || []).map(row => normalizeFeedbackRow(row as Record<string, unknown>))

    return {
      success: true,
      data: normalized,
      count: countResult?.total || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function likeFeedback(
  db: D1Database,
  feedbackId: number
): Promise<ChatApiResponse<{ id: number; likes: number }>> {
  try {
    const feedback = await db.prepare(
      'SELECT id, upvotes FROM feedbacks WHERE id = ?'
    ).bind(feedbackId).first<{ id: number; upvotes: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    await db.prepare(
      'UPDATE feedbacks SET upvotes = upvotes + 1 WHERE id = ?'
    ).bind(feedbackId).run()

    return {
      success: true,
      data: { id: feedbackId, likes: feedback.upvotes + 1 }
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function getFeedbackCategories(
  db: D1Database
): Promise<ChatApiResponse<{ category: string; count: number }[]>> {
  try {
    const categories = await db.prepare(
      `SELECT category, COUNT(*) as count FROM feedbacks WHERE status = 'published' GROUP BY category ORDER BY count DESC`
    ).all<{ category: string; count: number }>()

    return {
      success: true,
      data: categories.results || [],
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function submitComment(
  db: D1Database,
  input: CommentInput
): Promise<ChatApiResponse<Comment | undefined>> {
  try {
    if (!input.content || input.content.length > 500) {
      return { success: false, error: 'Comment must be 1-500 characters' }
    }

    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(input.feedback_id, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    const [insertResult] = await db.batch([
      db.prepare(
        `INSERT INTO feedback_comments (feedback_id, user_id, nickname, content) VALUES (?, ?, ?, ?)`
      ).bind(
        input.feedback_id,
        input.user_id,
        input.nickname || 'Anonymous',
        input.content
      ),
      db.prepare(
        'UPDATE feedbacks SET commentsCount = commentsCount + 1 WHERE id = ?'
      ).bind(input.feedback_id),
    ])

    if (!insertResult.success) {
      return { success: false, error: 'Failed to submit comment' }
    }

    const comment = await db.prepare(
      'SELECT * FROM feedback_comments WHERE id = ?'
    ).bind(insertResult.meta?.last_row_id).first<Comment>()

    return { success: true, data: comment ?? undefined }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function getComments(
  db: D1Database,
  feedbackId: number,
  limit: number = 50,
  offset: number = 0
): Promise<ChatApiResponse<Comment[]>> {
  try {
    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(feedbackId, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    const comments = await db.prepare(
      'SELECT * FROM feedback_comments WHERE feedback_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
    ).bind(feedbackId, limit, offset).all<Comment>()

    return {
      success: true,
      data: comments.results || [],
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function voteFeedback(
  db: D1Database,
  input: VoteInput
): Promise<ChatApiResponse<{ id: number; vote: string | null; action: string }>> {
  try {
    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(input.id, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    const existingVote = await db.prepare(
      'SELECT id, vote FROM feedback_votes WHERE feedback_id = ? AND user_id = ?'
    ).bind(input.id, input.user_id).first<{ id: number; vote: 'up' | 'down' }>()

    if (existingVote) {
      if (existingVote.vote === input.vote) {
        const column = input.vote === 'up' ? 'upvotes' : 'downvotes'
        await db.batch([
          db.prepare('DELETE FROM feedback_votes WHERE id = ?').bind(existingVote.id),
          db.prepare(`UPDATE feedbacks SET ${column} = MAX(0, ${column} - 1) WHERE id = ?`).bind(input.id),
        ])
        return { success: true, data: { id: input.id, vote: null, action: 'removed' } }
      } else {
        const incrementCol = input.vote === 'up' ? 'upvotes' : 'downvotes'
        const decrementCol = input.vote === 'up' ? 'downvotes' : 'upvotes'
        await db.batch([
          db.prepare('UPDATE feedback_votes SET vote = ? WHERE id = ?').bind(input.vote, existingVote.id),
          db.prepare(`UPDATE feedbacks SET ${incrementCol} = ${incrementCol} + 1, ${decrementCol} = MAX(0, ${decrementCol} - 1) WHERE id = ?`).bind(input.id),
        ])
        return { success: true, data: { id: input.id, vote: input.vote, action: 'changed' } }
      }
    }

    const column = input.vote === 'up' ? 'upvotes' : 'downvotes'
    await db.batch([
      db.prepare('INSERT INTO feedback_votes (feedback_id, user_id, vote) VALUES (?, ?, ?)').bind(input.id, input.user_id, input.vote),
      db.prepare(`UPDATE feedbacks SET ${column} = ${column} + 1 WHERE id = ?`).bind(input.id),
    ])
    return { success: true, data: { id: input.id, vote: input.vote, action: 'added' } }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function getUserVote(
  db: D1Database,
  feedbackId: number,
  userId: string
): Promise<'up' | 'down' | null> {
  try {
    const vote = await db.prepare(
      'SELECT vote FROM feedback_votes WHERE feedback_id = ? AND user_id = ?'
    ).bind(feedbackId, userId).first<{ vote: 'up' | 'down' }>()

    return vote?.vote || null
  } catch {
    return null
  }
}

export async function getFeedbackListWithVotes(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  category?: string,
  userId?: string
): Promise<ChatApiResponse<Feedback[]>> {
  try {
    const { query, params } = buildFeedbackQuery(
      'SELECT * FROM feedbacks WHERE status = ?',
      category
    )

    const feedbacks = await db.prepare(
      `${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    const { query: countQuery, params: countParams } = buildFeedbackQuery(
      'SELECT COUNT(*) as total FROM feedbacks WHERE status = ?',
      category
    )

    const countResult = await db.prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()

    const normalized = (feedbacks.results || []).map(row => normalizeFeedbackRow(row as Record<string, unknown>))

    if (userId && normalized.length > 0) {
      const feedbackIds = normalized.map(f => f.id)
      const placeholders = feedbackIds.map(() => '?').join(',')
      const votes = await db.prepare(
        `SELECT feedback_id, vote FROM feedback_votes WHERE user_id = ? AND feedback_id IN (${placeholders})`
      ).bind(userId, ...feedbackIds).all<{ feedback_id: number; vote: 'up' | 'down' }>()

      const voteMap = new Map<number, 'up' | 'down'>()
      for (const v of votes.results || []) {
        voteMap.set(v.feedback_id, v.vote)
      }

      for (const feedback of normalized) {
        feedback.userVote = voteMap.get(feedback.id)
      }
    }

    return {
      success: true,
      data: normalized,
      count: countResult?.total || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}
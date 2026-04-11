/**
 * Feedback API Handlers
 * Submit, list, like, and manage user feedback
 */

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
  commentsCount: number
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

/**
 * Submit new feedback
 */
export async function submitFeedback(
  db: D1Database,
  input: FeedbackInput
): Promise<ChatApiResponse> {
  try {
    // Validate
    if (!input.title || input.title.length > 100) {
      return { success: false, error: 'Title must be 1-100 characters' }
    }
    if (!input.content || input.content.length > 2000) {
      return { success: false, error: 'Content must be 1-2000 characters' }
    }

    const validCategories = ['general', 'bug', 'feature', 'improvement', 'other']
    const category = validCategories.includes(input.category || '') ? input.category : 'general'

    // Insert
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

    // Return the created feedback
    const feedback = await db.prepare(
      'SELECT * FROM feedbacks WHERE id = ?'
    ).bind(result.meta?.last_row_id).first<Feedback>()

    return { success: true, data: feedback }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Get feedback list (published only, ordered by time)
 */
export async function getFeedbackList(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  category?: string
): Promise<ChatApiResponse> {
  try {
    let query = 'SELECT * FROM feedbacks WHERE status = ?'
    const params: any[] = ['published']

    if (category && category !== 'all') {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const feedbacks = await db.prepare(query)
      .bind(...params)
      .all<Feedback>()

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM feedbacks WHERE status = ?'
    const countParams: any[] = ['published']

    if (category && category !== 'all') {
      countQuery += ' AND category = ?'
      countParams.push(category)
    }

    const countResult = await db.prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()

    return {
      success: true,
      data: feedbacks.results || [],
      count: countResult?.total || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Like a feedback
 */
export async function likeFeedback(
  db: D1Database,
  feedbackId: number
): Promise<ChatApiResponse> {
  try {
    // Check if feedback exists
    const feedback = await db.prepare(
      'SELECT id, likes FROM feedbacks WHERE id = ?'
    ).bind(feedbackId).first<{ id: number; likes: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    // Increment likes
    await db.prepare(
      'UPDATE feedbacks SET likes = likes + 1 WHERE id = ?'
    ).bind(feedbackId).run()

    return {
      success: true,
      data: { id: feedbackId, likes: feedback.likes + 1 }
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Get feedback categories with counts
 */
export async function getFeedbackCategories(
  db: D1Database
): Promise<ChatApiResponse> {
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

/**
 * Submit a comment on feedback
 */
export async function submitComment(
  db: D1Database,
  input: CommentInput
): Promise<ChatApiResponse> {
  try {
    // Validate
    if (!input.content || input.content.length > 500) {
      return { success: false, error: 'Comment must be 1-500 characters' }
    }

    // Check if feedback exists
    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(input.feedback_id, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    // Insert comment
    const result = await db.prepare(
      `INSERT INTO feedback_comments (feedback_id, user_id, nickname, content) VALUES (?, ?, ?, ?)`
    ).bind(
      input.feedback_id,
      input.user_id,
      input.nickname || 'Anonymous',
      input.content
    ).run()

    if (!result.success) {
      return { success: false, error: 'Failed to submit comment' }
    }

    // Update comments count
    await db.prepare(
      'UPDATE feedbacks SET commentsCount = commentsCount + 1 WHERE id = ?'
    ).bind(input.feedback_id).run()

    // Return the created comment
    const comment = await db.prepare(
      'SELECT * FROM feedback_comments WHERE id = ?'
    ).bind(result.meta?.last_row_id).first<Comment>()

    return { success: true, data: comment }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Get comments for a feedback
 */
export async function getComments(
  db: D1Database,
  feedbackId: number
): Promise<ChatApiResponse> {
  try {
    // Check if feedback exists
    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(feedbackId, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    // Get comments
    const comments = await db.prepare(
      'SELECT * FROM feedback_comments WHERE feedback_id = ? ORDER BY created_at ASC'
    ).bind(feedbackId).all<Comment>()

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

/**
 * Vote on feedback
 */
export async function voteFeedback(
  db: D1Database,
  input: VoteInput
): Promise<ChatApiResponse> {
  try {
    // Check if feedback exists
    const feedback = await db.prepare(
      'SELECT id FROM feedbacks WHERE id = ? AND status = ?'
    ).bind(input.id, 'published').first<{ id: number }>()

    if (!feedback) {
      return { success: false, error: 'Feedback not found' }
    }

    // Check if user already voted
    const existingVote = await db.prepare(
      'SELECT id, vote FROM feedback_votes WHERE feedback_id = ? AND user_id = ?'
    ).bind(input.id, input.user_id).first<{ id: number; vote: 'up' | 'down' }>()

    if (existingVote) {
      return { success: false, error: 'You have already voted on this feedback' }
    }

    // Begin transaction
    await db.exec('BEGIN TRANSACTION')

    try {
      // Insert vote
      await db.prepare(
        `INSERT INTO feedback_votes (feedback_id, user_id, vote) VALUES (?, ?, ?)`
      ).bind(
        input.id,
        input.user_id,
        input.vote
      ).run()

      // Update vote counts
      if (input.vote === 'up') {
        await db.prepare(
          'UPDATE feedbacks SET upvotes = upvotes + 1 WHERE id = ?'
        ).bind(input.id).run()
      } else {
        await db.prepare(
          'UPDATE feedbacks SET downvotes = downvotes + 1 WHERE id = ?'
        ).bind(input.id).run()
      }

      // Commit transaction
      await db.exec('COMMIT')

      return {
        success: true,
        data: { id: input.id, vote: input.vote }
      }
    } catch (error) {
      // Rollback transaction
      await db.exec('ROLLBACK')
      throw error
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Get user's vote for a feedback
 */
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
  } catch (error) {
    console.error('Error getting user vote:', error)
    return null
  }
}

/**
 * Get feedback list with user votes
 */
export async function getFeedbackListWithVotes(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  category?: string,
  userId?: string
): Promise<ChatApiResponse> {
  try {
    let query = 'SELECT * FROM feedbacks WHERE status = ?'
    const params: any[] = ['published']

    if (category && category !== 'all') {
      query += ' AND category = ?'
      params.push(category)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const feedbacks = await db.prepare(query)
      .bind(...params)
      .all<Feedback>()

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM feedbacks WHERE status = ?'
    const countParams: any[] = ['published']

    if (category && category !== 'all') {
      countQuery += ' AND category = ?'
      countParams.push(category)
    }

    const countResult = await db.prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()

    // Add user votes if userId is provided
    if (userId) {
      for (const feedback of feedbacks.results || []) {
        feedback.userVote = await getUserVote(db, feedback.id, userId)
      }
    }

    return {
      success: true,
      data: feedbacks.results || [],
      count: countResult?.total || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

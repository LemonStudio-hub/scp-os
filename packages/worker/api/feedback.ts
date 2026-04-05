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
  likes: number
}

export interface FeedbackInput {
  user_id: string
  nickname?: string
  title: string
  content: string
  category?: string
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

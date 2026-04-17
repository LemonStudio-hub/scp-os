/**
 * User API Handlers
 * Register, query, and manage user authentication
 */

import type { ChatApiResponse } from '../shared/types'

export interface User {
  id: number
  user_id: string
  nickname: string
  created_at: string
  last_active_at: string
}

export interface UserRegisterInput {
  userId: string
  nickname: string
}

/**
 * Register or update user information in D1 database
 */
export async function registerUser(
  db: D1Database,
  input: UserRegisterInput
): Promise<ChatApiResponse> {
  try {
    // Validate input
    if (!input.userId || !input.nickname) {
      return { success: false, error: 'Missing userId or nickname' }
    }

    if (input.nickname.length > 30) {
      return { success: false, error: 'Nickname too long (max 30 characters)' }
    }

    // Check if user exists
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE user_id = ?'
    ).bind(input.userId).first<{ id: number }>()

    // Check if nickname is already used by another user
    const existingNicknameUser = await db.prepare(
      'SELECT id FROM users WHERE nickname = ? AND user_id != ?'
    ).bind(input.nickname, input.userId).first<{ id: number }>()

    if (existingNicknameUser) {
      return { success: false, error: 'Nickname already taken' }
    }

    if (existingUser) {
      // Update existing user
      await db.prepare(
        `UPDATE users SET nickname = ?, last_active_at = CURRENT_TIMESTAMP WHERE user_id = ?`
      ).bind(input.nickname, input.userId).run()
    } else {
      // Insert new user
      await db.prepare(
        `INSERT INTO users (user_id, nickname, created_at, last_active_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(input.userId, input.nickname).run()
    }

    // Return the updated/created user
    const user = await db.prepare(
      'SELECT * FROM users WHERE user_id = ?'
    ).bind(input.userId).first<User>()

    return { success: true, data: user }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

/**
 * Get user by UUID
 */
export async function getUserByUserId(
  db: D1Database,
  userId: string
): Promise<ChatApiResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'Missing userId' }
    }

    const user = await db.prepare(
      'SELECT * FROM users WHERE user_id = ?'
    ).bind(userId).first<User>()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, data: user }
  } catch (error) {
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

export async function checkNicknameAvailability(
  db: D1Database,
  nickname: string,
  excludeUserId?: string
): Promise<ChatApiResponse & { available?: boolean }> {
  try {
    if (!nickname) {
      return { success: false, available: false, error: 'Missing nickname' }
    }

    let query = 'SELECT id FROM users WHERE nickname = ?'
    const params: string[] = [nickname]

    if (excludeUserId) {
      query += ' AND user_id != ?'
      params.push(excludeUserId)
    }

    const existing = await db.prepare(query).bind(...params).first<{ id: number }>()

    return {
      success: true,
      available: !existing,
    }
  } catch (error) {
    return {
      success: false,
      available: false,
      error: `Database error: ${(error as Error).message}`
    }
  }
}

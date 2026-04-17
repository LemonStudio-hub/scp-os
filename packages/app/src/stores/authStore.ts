/**
 * User Authentication Store
 * Manages user authentication state using Pinia
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { indexedDBService } from '../utils/indexedDB'
import { config } from '../config'
import logger from '../utils/logger'

const API_BASE = config.api.workerUrl

export const useAuthStore = defineStore('auth', () => {
  // State
  const isLoggedIn = ref<boolean>(false)
  const nickname = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const isLoading = ref<boolean>(false)

  /**
   * Initialize authentication state
   * Check local storage for existing nickname and UUID
   */
  async function initAuth(): Promise<void> {
    isLoading.value = true
    try {
      // Get or generate user ID
      const savedUserId = await indexedDBService.getUserId()
      userId.value = savedUserId

      // Check for saved nickname
      const savedNickname = await indexedDBService.getNickname()
      if (savedNickname) {
        nickname.value = savedNickname
        isLoggedIn.value = true
        logger.info('[Auth] Auto-login with existing user:', { userId: savedUserId, nickname: savedNickname })
      } else {
        isLoggedIn.value = false
        logger.info('[Auth] No saved nickname found, user not logged in')
      }
    } catch (error) {
      logger.error('[Auth] Failed to initialize auth:', error)
      isLoggedIn.value = false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Login with nickname
   * Bind nickname with UUID and save to IndexedDB and remote API
   */
  async function login(nicknameInput: string): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true
    try {
      // Validate nickname
      if (!nicknameInput || nicknameInput.trim().length === 0) {
        return { success: false, error: 'Nickname cannot be empty' }
      }

      if (nicknameInput.length > 30) {
        return { success: false, error: 'Nickname too long (max 30 characters)' }
      }

      const trimmedNickname = nicknameInput.trim()

      // Get or generate user ID
      const currentUserId = await indexedDBService.getUserId()
      userId.value = currentUserId

      // Save to IndexedDB
      await indexedDBService.saveNickname(trimmedNickname)
      nickname.value = trimmedNickname

      // Register/update user on remote API
      try {
        const response = await fetch(`${API_BASE}/api/user/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId,
            nickname: trimmedNickname,
          }),
        })

        if (!response.ok) {
          // Try to parse error response
          try {
            const errorData = await response.json()
            if (errorData.success === false && errorData.error === 'Nickname already taken') {
              // Nickname is already taken, roll back local changes
              await indexedDBService.clearUserData()
              nickname.value = null
              isLoggedIn.value = false
              return { success: false, error: 'Nickname already taken' }
            }
          } catch (parseError) {
            // Failed to parse error response
            logger.warn('[Auth] Failed to parse error response:', parseError)
          }
          logger.warn('[Auth] Failed to register user on remote API, but local login succeeded')
        }
      } catch (apiError) {
        // Remote API failure should not block local login
        logger.warn('[Auth] Remote API unavailable, local login succeeded:', apiError)
      }

      isLoggedIn.value = true
      logger.info('[Auth] User logged in successfully:', { userId: currentUserId, nickname: trimmedNickname })
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Login failed:', error)
      return { success: false, error: `Login failed: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout and clear local state
   */
  async function logout(): Promise<void> {
    try {
      await indexedDBService.clearUserData()
      isLoggedIn.value = false
      nickname.value = null
      // Keep userId as it's a persistent identifier
      logger.info('[Auth] User logged out successfully')
    } catch (error) {
      logger.error('[Auth] Logout failed:', error)
      throw error
    }
  }

  /**
   * Check if user is currently logged in
   */
  function checkLoginStatus(): boolean {
    return isLoggedIn.value
  }

  async function checkNicknameAvailability(nicknameInput: string): Promise<{ available: boolean; error?: string }> {
    const trimmed = nicknameInput.trim()
    if (!trimmed) {
      return { available: false, error: 'Nickname cannot be empty' }
    }
    if (trimmed.length > 30) {
      return { available: false, error: 'Nickname too long (max 30 characters)' }
    }

    try {
      const response = await fetch(`${API_BASE}/api/user/check-nickname?nickname=${encodeURIComponent(trimmed)}&excludeUserId=${encodeURIComponent(userId.value || '')}`)
      const data = await response.json()
      if (data.success && data.available) {
        return { available: true }
      }
      return { available: false, error: data.error || 'Nickname already taken' }
    } catch (error) {
      logger.warn('[Auth] Failed to check nickname availability:', error)
      return { available: true }
    }
  }

  async function updateNickname(newNickname: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = newNickname.trim()
    if (!trimmed) {
      return { success: false, error: 'Nickname cannot be empty' }
    }
    if (trimmed.length > 30) {
      return { success: false, error: 'Nickname too long (max 30 characters)' }
    }

    isLoading.value = true
    try {
      const availability = await checkNicknameAvailability(trimmed)
      if (!availability.available) {
        return { success: false, error: availability.error || 'Nickname already taken' }
      }

      await indexedDBService.saveNickname(trimmed)
      nickname.value = trimmed

      try {
        const response = await fetch(`${API_BASE}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId.value, nickname: trimmed }),
        })

        if (!response.ok) {
          try {
            const errorData = await response.json()
            if (errorData.success === false && errorData.error === 'Nickname already taken') {
              const oldNickname = await indexedDBService.getNickname()
              nickname.value = oldNickname
              return { success: false, error: 'Nickname already taken' }
            }
          } catch {
            // ignore parse error
          }
          logger.warn('[Auth] Failed to update nickname on remote API, but local update succeeded')
        } else {
          try {
            await fetch(`${API_BASE}/chat/nickname`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId.value, nickname: trimmed }),
            })
          } catch {
            // ignore chat nickname update error
          }
        }
      } catch (apiError) {
        logger.warn('[Auth] Remote API unavailable, local update succeeded:', apiError)
      }

      logger.info('[Auth] Nickname updated successfully:', trimmed)
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Failed to update nickname:', error)
      return { success: false, error: `Update failed: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoggedIn,
    nickname,
    userId,
    isLoading,

    initAuth,
    login,
    logout,
    checkLoginStatus,
    updateNickname,
    checkNicknameAvailability,
  }
})

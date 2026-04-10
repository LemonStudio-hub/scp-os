/**
 * User Authentication Store
 * Manages user authentication state using Pinia
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { indexedDBService } from '../utils/indexedDB'

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
        console.log('[Auth] Auto-login with existing user:', { userId: savedUserId, nickname: savedNickname })
      } else {
        isLoggedIn.value = false
        console.log('[Auth] No saved nickname found, user not logged in')
      }
    } catch (error) {
      console.error('[Auth] Failed to initialize auth:', error)
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
        const response = await fetch('/api/user/register', {
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
          console.warn('[Auth] Failed to register user on remote API, but local login succeeded')
        }
      } catch (apiError) {
        // Remote API failure should not block local login
        console.warn('[Auth] Remote API unavailable, local login succeeded:', apiError)
      }

      isLoggedIn.value = true
      console.log('[Auth] User logged in successfully:', { userId: currentUserId, nickname: trimmedNickname })
      return { success: true }
    } catch (error) {
      console.error('[Auth] Login failed:', error)
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
      console.log('[Auth] User logged out successfully')
    } catch (error) {
      console.error('[Auth] Logout failed:', error)
      throw error
    }
  }

  /**
   * Check if user is currently logged in
   */
  function checkLoginStatus(): boolean {
    return isLoggedIn.value
  }

  return {
    // State
    isLoggedIn,
    nickname,
    userId,
    isLoading,

    // Actions
    initAuth,
    login,
    logout,
    checkLoginStatus,
  }
})

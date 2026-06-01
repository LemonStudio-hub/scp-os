import { defineStore } from 'pinia'
import { ref } from 'vue'
import indexedDBService from '../utils/indexedDB'
import { config } from '../config'
import { authenticatedFetch, clearAuthToken } from '../utils/authFetch'
import { validateNickname } from '../utils/nicknameValidator'
import logger from '../utils/logger'

const API_BASE = config.api.workerUrl

export type AccountType = 'guest' | 'registered'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean>(false)
  const nickname = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const accountType = ref<AccountType | null>(null)
  const isLoading = ref<boolean>(false)

  async function initAuth(): Promise<void> {
    isLoading.value = true
    try {
      const savedUserId = await indexedDBService.getUserId()
      userId.value = savedUserId
      const savedNickname = await indexedDBService.getNickname()
      if (savedNickname) {
        nickname.value = savedNickname
        accountType.value = 'guest'
        isLoggedIn.value = true
        logger.info('[Auth] Auto-login:', { userId: savedUserId, nickname: savedNickname })
      } else {
        isLoggedIn.value = false
        logger.info('[Auth] No saved nickname, user not logged in')
      }
    } catch (error) {
      logger.error('[Auth] Failed to initialize auth:', error)
      isLoggedIn.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function login(nicknameInput: string): Promise<{ success: boolean; error?: string }> {
    const validation = validateNickname(nicknameInput)
    if (!validation.valid) return { success: false, error: validation.error }

    isLoading.value = true
    try {
      const trimmed = nicknameInput.trim()
      const currentUserId = await indexedDBService.getUserId()
      userId.value = currentUserId

      try {
        const response = await authenticatedFetch(`${API_BASE}/api/user/register`, currentUserId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, nickname: trimmed, account_type: 'guest' }),
        })

        if (!response.ok) {
          logger.warn('[Auth] Remote API returned error, proceeding with local login')
        }
      } catch (apiError) {
        logger.warn('[Auth] Remote API unavailable, proceeding with local login:', apiError)
      }

      await indexedDBService.saveNickname(trimmed)
      nickname.value = trimmed
      accountType.value = 'guest'
      isLoggedIn.value = true
      logger.info('[Auth] Logged in:', { userId: currentUserId, nickname: trimmed })
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Login failed:', error)
      return { success: false, error: `登录失败: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      clearAuthToken()
      await indexedDBService.clearUserData()
      isLoggedIn.value = false
      nickname.value = null
      accountType.value = null
      logger.info('[Auth] Logged out')
    } catch (error) {
      logger.error('[Auth] Logout failed:', error)
      throw error
    }
  }

  async function checkNicknameAvailability(
    nicknameInput: string
  ): Promise<{ available: boolean; error?: string }> {
    const validation = validateNickname(nicknameInput)
    if (!validation.valid) return { available: false, error: validation.error }

    try {
      const response = await fetch(
        `${API_BASE}/api/user/check-nickname?nickname=${encodeURIComponent(nicknameInput.trim())}&excludeUserId=${encodeURIComponent(userId.value || '')}`
      )
      const data = await response.json()
      if (data.success && data.available) return { available: true }
      return { available: false, error: data.error || '工作代号已被占用' }
    } catch (error) {
      logger.warn('[Auth] Failed to check nickname availability:', error)
      return { available: true }
    }
  }

  async function updateNickname(
    newNickname: string
  ): Promise<{ success: boolean; error?: string }> {
    const validation = validateNickname(newNickname)
    if (!validation.valid) return { success: false, error: validation.error }

    isLoading.value = true
    try {
      const trimmed = newNickname.trim()
      const uid = userId.value ?? ''

      const response = await authenticatedFetch(`${API_BASE}/api/user/register`, uid, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          nickname: trimmed,
          account_type: accountType.value ?? 'guest',
        }),
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          if (errorData.success === false && errorData.error === 'Nickname already taken') {
            return { success: false, error: '工作代号已被占用' }
          }
        } catch {
          /* ignore */
        }
        logger.warn('[Auth] Remote update failed, updating locally only')
      }

      await indexedDBService.saveNickname(trimmed)
      nickname.value = trimmed
      logger.info('[Auth] Nickname updated:', trimmed)
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Failed to update nickname:', error)
      return { success: false, error: `更新失败: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return authenticatedFetch(url, userId.value ?? '', options)
  }

  return {
    isLoggedIn,
    nickname,
    userId,
    accountType,
    isLoading,
    initAuth,
    login,
    logout,
    checkNicknameAvailability,
    updateNickname,
    authFetch,
  }
})

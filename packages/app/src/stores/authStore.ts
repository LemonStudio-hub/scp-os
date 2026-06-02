import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import indexedDBService from '../utils/indexedDB'
import { config } from '../config'
import { authenticatedFetch, clearAuthToken, setAuthToken } from '../utils/authFetch'
import { validateNickname } from '../utils/nicknameValidator'
import logger from '../utils/logger'

const API_BASE = config.api.workerUrl

export type AccountType = 'guest' | 'registered'

interface AuthUser {
  userId: string
  email?: string
  nickname: string
  accountType: AccountType
}

async function authRequest(
  path: string,
  body: Record<string, unknown>
): Promise<{
  success: boolean
  token?: string
  user?: AuthUser
  error?: string
  message?: string
}> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      success: false,
      error: data.error || data.message || `HTTP ${response.status}`,
      message: data.message,
    }
  }
  return data
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean>(false)
  const nickname = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const email = ref<string | null>(null)
  const accountType = ref<AccountType | null>(null)
  const isLoading = ref<boolean>(false)
  const canUseCloudSync = computed(() => accountType.value === 'registered')

  async function persistSession(user: AuthUser, token?: string): Promise<void> {
    await indexedDBService.saveNickname(user.nickname)
    await indexedDBService.saveSetting('account_type', user.accountType)
    await indexedDBService.saveSetting('auth_email', user.email || null)
    await indexedDBService.saveSetting('auth_token', token || null)
    if (user.accountType === 'registered') {
      await indexedDBService.saveSetting('user_id', user.userId)
    }
    if (token) setAuthToken(token, user.userId)
    userId.value = user.userId
    nickname.value = user.nickname
    email.value = user.email || null
    accountType.value = user.accountType
    isLoggedIn.value = true
  }

  async function initAuth(): Promise<void> {
    isLoading.value = true
    try {
      const savedNickname = await indexedDBService.getNickname()
      const savedAccountType = (await indexedDBService.loadSetting(
        'account_type'
      )) as AccountType | null
      const savedEmail = (await indexedDBService.loadSetting('auth_email')) as string | null
      const savedToken = (await indexedDBService.loadSetting('auth_token')) as string | null
      const savedUserId = await indexedDBService.getUserId()

      if (savedNickname && savedAccountType === 'registered' && savedEmail && savedToken) {
        setAuthToken(savedToken, savedEmail)
        userId.value = savedEmail
        email.value = savedEmail
        nickname.value = savedNickname
        accountType.value = 'registered'
        isLoggedIn.value = true
        return
      }

      if (savedNickname) {
        userId.value = savedUserId
        nickname.value = savedNickname
        email.value = null
        accountType.value = 'guest'
        isLoggedIn.value = true
        logger.info('[Auth] Auto-login guest:', { userId: savedUserId, nickname: savedNickname })
      } else {
        isLoggedIn.value = false
      }
    } catch (error) {
      logger.error('[Auth] Failed to initialize auth:', error)
      isLoggedIn.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function loginGuest(nicknameInput: string): Promise<{ success: boolean; error?: string }> {
    const validation = validateNickname(nicknameInput)
    if (!validation.valid) return { success: false, error: validation.error }

    isLoading.value = true
    try {
      const trimmed = nicknameInput.trim()
      const currentUserId = await indexedDBService.getUserId()
      const data = await authRequest('/api/auth/guest', {
        userId: currentUserId,
        nickname: trimmed,
      })
      if (!data.success || !data.user || !data.token) {
        return { success: false, error: data.error || 'Guest login failed' }
      }
      await persistSession(data.user, data.token)
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Guest login failed:', error)
      return { success: false, error: `登录失败: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  async function loginRegistered(
    emailInput: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    isLoading.value = true
    try {
      const data = await authRequest('/api/auth/login', {
        email: emailInput.trim(),
        password,
      })
      if (!data.success || !data.user || !data.token) {
        return { success: false, error: data.error || 'Email or password is incorrect' }
      }
      await persistSession(data.user, data.token)
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Login failed:', error)
      return { success: false, error: `登录失败: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  async function register(
    emailInput: string,
    password: string,
    nicknameInput: string
  ): Promise<{ success: boolean; error?: string }> {
    const validation = validateNickname(nicknameInput)
    if (!validation.valid) return { success: false, error: validation.error }

    isLoading.value = true
    try {
      const data = await authRequest('/api/auth/register', {
        email: emailInput.trim(),
        password,
        nickname: nicknameInput.trim(),
      })
      if (!data.success || !data.user || !data.token) {
        return { success: false, error: data.error || data.message || 'Registration failed' }
      }
      await persistSession(data.user, data.token)
      return { success: true }
    } catch (error) {
      logger.error('[Auth] Registration failed:', error)
      return { success: false, error: `注册失败: ${(error as Error).message}` }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      clearAuthToken()
      await indexedDBService.deleteSetting('nickname')
      await indexedDBService.deleteSetting('account_type')
      await indexedDBService.deleteSetting('auth_email')
      await indexedDBService.deleteSetting('auth_token')
      isLoggedIn.value = false
      nickname.value = null
      userId.value = null
      email.value = null
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
    return { available: true }
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
        body: JSON.stringify({ nickname: trimmed }),
      })

      if (!response.ok) {
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
    email,
    accountType,
    isLoading,
    canUseCloudSync,
    initAuth,
    login: loginGuest,
    loginGuest,
    loginRegistered,
    register,
    logout,
    checkNicknameAvailability,
    updateNickname,
    authFetch,
  }
})

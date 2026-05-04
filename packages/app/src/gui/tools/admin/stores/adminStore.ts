import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as adminApi from '../services/adminApi'

const STORAGE_KEY = 'admin_token'

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string | null>(null)
  const admin = ref<{ adminId: number; username: string; role: string } | null>(null)
  const isAuthenticated = computed(() => !!token.value)
  const isSuperAdmin = computed(() => admin.value?.role === 'super_admin')

  async function login(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await adminApi.adminLogin(username, password)
      if (data.success && data.token) {
        token.value = data.token
        admin.value = {
          adminId: data.admin.adminId,
          username: data.admin.username,
          role: data.admin.role,
        }
        localStorage.setItem(STORAGE_KEY, data.token)
        return { success: true }
      }
      return { success: false, error: data.error || 'Login failed' }
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Network error' }
    }
  }

  async function verifyToken(): Promise<boolean> {
    if (!token.value) return false
    try {
      const data = await adminApi.verifyAdminToken(token.value)
      if (data.success && data.admin) {
        admin.value = {
          adminId: data.admin.adminId,
          username: data.admin.username,
          role: data.admin.role,
        }
        return true
      }
      logout()
      return false
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    token.value = null
    admin.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      token.value = saved
    }
  }

  return {
    token,
    admin,
    isAuthenticated,
    isSuperAdmin,
    login,
    verifyToken,
    logout,
    init,
  }
})

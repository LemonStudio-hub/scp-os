import { defineStore } from 'pinia'
import { ref } from 'vue'

// Local storage keys
const FIRST_LAUNCH_KEY = 'scp-os-first-launch'
const SYSTEM_STATUS_KEY = 'scp-os-system-status'
const BOOT_LOG_SHOWN_KEY = 'scp-os-boot-log-shown'

export const useSystemStore = defineStore('system', () => {
  // State
  const isFirstLaunch = ref<boolean>(localStorage.getItem(FIRST_LAUNCH_KEY) === null)
  const isRunning = ref<boolean>(localStorage.getItem(SYSTEM_STATUS_KEY) === 'running')
  const bootLogShown = ref<boolean>(localStorage.getItem(BOOT_LOG_SHOWN_KEY) === 'true')

  // Actions
  function markSystemLaunched() {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
    isFirstLaunch.value = false
  }

  function markSystemRunning() {
    localStorage.setItem(SYSTEM_STATUS_KEY, 'running')
    isRunning.value = true
  }

  function markSystemShutdown() {
    localStorage.setItem(SYSTEM_STATUS_KEY, 'shutdown')
    isRunning.value = false
  }

  function markBootLogShown() {
    localStorage.setItem(BOOT_LOG_SHOWN_KEY, 'true')
    bootLogShown.value = true
  }

  function resetBootLogShown() {
    localStorage.removeItem(BOOT_LOG_SHOWN_KEY)
    bootLogShown.value = false
  }

  function resetFirstLaunch() {
    localStorage.removeItem(FIRST_LAUNCH_KEY)
    isFirstLaunch.value = true
  }

  return {
    // State
    isFirstLaunch,
    isRunning,
    bootLogShown,

    // Actions
    markSystemLaunched,
    markSystemRunning,
    markSystemShutdown,
    markBootLogShown,
    resetBootLogShown,
    resetFirstLaunch
  }
})

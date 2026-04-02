/**
 * Terminal Store
 * 管理终端相关的状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TerminalState {
  isReady: boolean
  fontSize: number
  isMobile: boolean
  fastBoot: boolean
}

export const useTerminalStore = defineStore('terminal', () => {
  // State
  const isReady = ref(false)
  const fontSize = ref(16)
  const isMobile = ref(false)
  const fastBoot = ref(false)

  // Getters
  const terminalState = computed<TerminalState>(() => ({
    isReady: isReady.value,
    fontSize: fontSize.value,
    isMobile: isMobile.value,
    fastBoot: fastBoot.value,
  }))

  // Actions
  function setReady(ready: boolean) {
    isReady.value = ready
  }

  function setFontSize(size: number) {
    fontSize.value = size
  }

  function setMobile(mobile: boolean) {
    isMobile.value = mobile
  }

  function setFastBoot(enabled: boolean) {
    fastBoot.value = enabled
  }

  function updateFontSize() {
    const screenWidth = window.innerWidth

    if (screenWidth >= 1200) {
      fontSize.value = 16
    } else if (screenWidth >= 768) {
      fontSize.value = 14
    } else if (screenWidth >= 480) {
      fontSize.value = 12
    } else {
      fontSize.value = 10
    }
  }

  function checkMobile() {
    const screenWidth = window.innerWidth
    isMobile.value = screenWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  return {
    // State
    isReady,
    fontSize,
    isMobile,
    fastBoot,
    // Getters
    terminalState,
    // Actions
    setReady,
    setFontSize,
    setMobile,
    setFastBoot,
    updateFontSize,
    checkMobile,
  }
})
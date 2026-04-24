import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getResponsiveFontSize } from '../utils/terminal'

export const useTerminalStore = defineStore('terminal', () => {
  const isReady = ref(false)
  const fontSize = ref(getResponsiveFontSize())
  const isMobile = ref(false)
  let resizeHandler: (() => void) | null = null

  function initialize() {
    updateFontSize()
    checkMobile()
    isReady.value = true
  }

  function updateFontSize() {
    fontSize.value = getResponsiveFontSize()
  }

  function checkMobile() {
    isMobile.value = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  function setupResizeListener() {
    if (resizeHandler) return

    resizeHandler = () => {
      updateFontSize()
      checkMobile()
    }
    window.addEventListener('resize', resizeHandler)
  }

  function cleanupResizeListener() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
  }

  return {
    isReady,
    fontSize,
    isMobile,
    initialize,
    updateFontSize,
    checkMobile,
    setupResizeListener,
    cleanupResizeListener,
  }
})
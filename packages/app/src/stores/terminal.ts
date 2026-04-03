import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getResponsiveFontSize } from '../utils/terminal'

/**
 * Terminal state management
 */
export const useTerminalStore = defineStore('terminal', () => {
  const isReady = ref(false)
  const fontSize = ref(getResponsiveFontSize())
  const isMobile = ref(false)

  /**
   * Initialize terminal
   */
  function initialize() {
    updateFontSize()
    checkMobile()
    isReady.value = true
  }

  /**
   * Update font size based on screen width
   */
  function updateFontSize() {
    fontSize.value = getResponsiveFontSize()
  }

  /**
   * Check if device is mobile
   */
  function checkMobile() {
    isMobile.value = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  /**
   * Setup resize listener
   */
  function setupResizeListener() {
    window.addEventListener('resize', () => {
      updateFontSize()
      checkMobile()
    })
  }

  return {
    isReady,
    fontSize,
    isMobile,
    initialize,
    updateFontSize,
    checkMobile,
    setupResizeListener,
  }
})
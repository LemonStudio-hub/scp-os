/**
 * Mobile Detection Composable
 * Single source of truth for device type, safe area, and viewport info.
 * Replaces all duplicated isMobile checks across the codebase.
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const screenHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)
const isMobileUA = typeof navigator !== 'undefined'
  ? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  : false

// Safe area insets (populated from CSS env() values)
const safeArea = ref({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
})

function updateSafeArea(): void {
  if (typeof window === 'undefined') return
  const style = getComputedStyle(document.documentElement)
  safeArea.value = {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0px', 10) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0px', 10) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0px', 10) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0px', 10) || 0,
  }
}

function onResize(): void {
  screenWidth.value = window.innerWidth
  screenHeight.value = window.innerHeight
  updateSafeArea()
}

export function useMobile() {
  // Mobile: phone-sized screens OR mobile user agent on small screens
  const isMobile = computed(() => (screenWidth.value <= 768 && isMobileUA))
  // Tablet: medium screens (769-1024px)
  const isTablet = computed(() => screenWidth.value > 768 && screenWidth.value <= 1024)
  // Desktop: large screens OR non-mobile devices on medium+ screens
  const isDesktop = computed(() => !isMobile.value)
  const isPortrait = computed(() => screenHeight.value > screenWidth.value)
  const isLandscape = computed(() => screenWidth.value > screenHeight.value)

  // Breakpoints
  const isSmallMobile = computed(() => screenWidth.value < 480)
  const isLargeMobile = computed(() => screenWidth.value >= 480 && screenWidth.value <= 768)

  // Haptic feedback (Android only, gracefully degrades on iOS)
  function haptic(pattern: number | number[] = 10): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  onMounted(() => {
    window.addEventListener('resize', onResize, { passive: true })
    updateSafeArea()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    isSmallMobile,
    isLargeMobile,
    screenWidth,
    screenHeight,
    safeArea,
    haptic,
  }
}

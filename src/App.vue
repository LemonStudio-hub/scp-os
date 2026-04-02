<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SCPTerminal from './components/SCPTerminal.vue'
import Sidebar from './components/Sidebar.vue'
import PerformanceDashboard from './components/PerformanceDashboard.vue'
import { useTabsStore } from './stores/tabs'

const tabsStore = useTabsStore()

// Performance Dashboard state
const showPerformanceDashboard = ref(false)

// Global function to open performance dashboard
const openPerformanceDashboard = () => {
  showPerformanceDashboard.value = true
}

// Touch gesture control
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return

  const touchX = e.touches[0].clientX
  const touchY = e.touches[0].clientY
  const diffX = touchX - touchStartX.value
  const diffY = touchY - touchStartY.value

  // Determine horizontal or vertical swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Horizontal swipe
    if (Math.abs(diffX) > 50) {
      // Swipe right to open sidebar
      if (diffX > 0 && !tabsStore.sidebarOpen) {
        tabsStore.openSidebar()
        isSwiping.value = false
      }
      // Swipe left to close sidebar
      else if (diffX < 0 && tabsStore.sidebarOpen) {
        tabsStore.closeSidebar()
        isSwiping.value = false
      }
    }
  }
}

const handleTouchEnd = () => {
  isSwiping.value = false
}

onMounted(async () => {
  // Initialize tabs store with IndexedDB
  await tabsStore.initialize()

  // Set global function for performance dashboard
  window.openPerformanceDashboard = openPerformanceDashboard

  // Add touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  // Clean up global function
  delete window.openPerformanceDashboard

  // Remove touch event listeners
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div id="app">
    <SCPTerminal />
    <Sidebar />
    <PerformanceDashboard 
      :isVisible="showPerformanceDashboard" 
      @close="showPerformanceDashboard = false"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Courier New', Consolas, monospace;
  background: #0a0a0a;
  color: #ffffff;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
</style>
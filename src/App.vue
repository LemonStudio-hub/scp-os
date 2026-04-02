<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SCPTerminal from './components/SCPTerminal.vue'
import Sidebar from './components/Sidebar.vue'
import TabBar from './components/TabBar.vue'
import { useTabsStore } from './stores/tabs'

const tabsStore = useTabsStore()

// 手势控制相关
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

  // 判断是横向滑动还是纵向滑动
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // 横向滑动
    if (Math.abs(diffX) > 50) {
      // 向右滑动打开侧边栏
      if (diffX > 0 && !tabsStore.sidebarOpen) {
        tabsStore.openSidebar()
        isSwiping.value = false
      }
      // 向左滑动关闭侧边栏
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

onMounted(() => {
  // 添加触摸事件监听
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  // 移除触摸事件监听
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div id="app">
    <TabBar />
    <div class="main-content">
      <SCPTerminal />
    </div>
    <Sidebar />
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
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
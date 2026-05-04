<template>
  <div class="download-proxy flex flex-col h-full bg-gray-900 text-gray-100">
    <div class="flex-1 overflow-auto p-4">
      <div class="max-w-2xl mx-auto">
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-1">下载代理</h2>
          <p class="text-sm text-gray-400">
            通过 Cloudflare Workers 代理下载文件，支持流式传输和速率控制
          </p>
        </div>

        <div v-if="store.error && !store.isDownloading" class="alert alert-error mb-4">
          <div class="flex items-start gap-2">
            <span class="text-red-400 shrink-0 mt-0.5">&#x26A0;</span>
            <div>
              <p class="text-sm text-red-300">{{ store.error }}</p>
              <button
                class="text-xs text-red-400 hover:text-red-300 mt-1 underline"
                @click="store.clearError()"
              >
                关闭
              </button>
            </div>
          </div>
        </div>

        <div v-if="!store.isDownloading" class="mb-4">
          <div class="flex flex-col gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">下载链接</label>
              <div class="flex gap-2">
                <input
                  v-model="downloadUrl"
                  type="url"
                  placeholder="https://example.com/file.zip"
                  class="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  :disabled="store.isDownloading"
                  @keyup.enter="startDownload()"
                />
                <button
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="store.isDownloading || !downloadUrl.trim()"
                  @click="startDownload()"
                >
                  开始下载
                </button>
              </div>
            </div>

            <button
              class="text-xs text-gray-400 hover:text-gray-300 self-start flex items-center gap-1"
              @click="showAdvanced = !showAdvanced"
            >
              <span class="transition-transform" :class="{ 'rotate-90': showAdvanced }"
                >&#9654;</span
              >
              高级选项
            </button>

            <div
              v-if="showAdvanced"
              class="flex flex-wrap gap-4 bg-gray-800/50 rounded p-3 border border-gray-700/50"
            >
              <div class="flex-1 min-w-[180px]">
                <label class="block text-xs text-gray-400 mb-1">自定义文件名（可选）</label>
                <input
                  v-model="customFilename"
                  type="text"
                  placeholder="留空则自动识别"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div class="w-[160px]">
                <label class="block text-xs text-gray-400 mb-1">速率限制 (KB/s)</label>
                <input
                  v-model.number="rateLimitKBps"
                  type="number"
                  min="0"
                  max="51200"
                  placeholder="0 = 不限制"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.downloadProgress && store.isDownloading" class="mb-4">
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-200 truncate max-w-[60%]">
                {{ store.downloadProgress.filename }}
              </span>
              <span class="text-xs text-gray-400">
                {{ formatSpeed(store.currentSpeed) }}
              </span>
            </div>

            <div class="w-full bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-200"
                :class="progressBarColor"
                :style="{ width: `${Math.min(100, store.currentProgress)}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">
                {{ formatBytes(store.downloadProgress.downloadedBytes) }}
                <template v-if="store.downloadProgress.totalBytes > 0">
                  / {{ formatBytes(store.downloadProgress.totalBytes) }}
                </template>
                ({{ Math.min(100, store.currentProgress) }}%)
              </span>
              <button
                class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                @click="cancel()"
              >
                取消下载
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="
            store.downloadProgress &&
            !store.isDownloading &&
            store.downloadProgress.status === 'completed'
          "
          class="mb-4"
        >
          <div class="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-300">下载完成</p>
                <p class="text-xs text-green-400/70 mt-0.5">
                  {{ store.downloadProgress.filename }} -
                  {{
                    formatBytes(
                      store.downloadProgress.totalBytes || store.downloadProgress.downloadedBytes
                    )
                  }}
                </p>
              </div>
              <button
                class="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
                @click="reset()"
              >
                下载新文件
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700/50 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-300">下载历史</h3>
            <button
              v-if="history.length > 0"
              class="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              @click="store.fetchHistory(20, 0)"
            >
              刷新
            </button>
          </div>

          <div v-if="store.isLoadingHistory" class="text-center py-6">
            <div
              class="inline-block w-5 h-5 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin"
            ></div>
          </div>

          <div v-else-if="history.length === 0" class="text-center py-6">
            <p class="text-sm text-gray-500">暂无下载记录</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="item in history"
              :key="item.id"
              class="bg-gray-800/50 rounded p-3 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-200 truncate" :title="item.filename">
                    {{ item.filename }}
                  </p>
                  <p class="text-xs text-gray-500 truncate mt-0.5" :title="item.url">
                    {{ item.url }}
                  </p>
                  <div class="flex items-center gap-3 mt-1.5">
                    <span class="text-xs" :class="statusColor(item.status)">{{
                      statusLabel(item.status)
                    }}</span>
                    <span class="text-xs text-gray-500">{{
                      formatBytes(item.totalBytes || item.downloadedBytes)
                    }}</span>
                    <span class="text-xs text-gray-500">{{ formatTimeAgo(item.createdAt) }}</span>
                  </div>
                </div>
                <button
                  class="text-gray-500 hover:text-red-400 shrink-0 p-1 rounded hover:bg-red-400/10 transition-colors"
                  title="删除记录"
                  @click="store.deleteHistoryItem(item.id)"
                >
                  <span class="text-xs">&#10005;</span>
                </button>
              </div>
            </div>

            <div v-if="store.historyTotal > history.length" class="text-center pt-2">
              <button
                class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                @click="store.fetchHistory(Math.min(100, store.historyTotal), history.length)"
              >
                加载更多 ({{ store.historyTotal - history.length }} 条剩余)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDownload } from '../../composables/useDownload'

const {
  downloadUrl,
  customFilename,
  rateLimitKBps,
  showAdvanced,
  store,
  startDownload,
  cancel,
  reset,
  formatBytes,
  formatSpeed,
  formatTimeAgo,
} = useDownload()

const history = computed(() => store.history)

const progressBarColor = computed(() => {
  const status = store.downloadProgress?.status
  if (status === 'completed') return 'bg-green-500'
  if (status === 'failed') return 'bg-red-500'
  if (status === 'cancelled') return 'bg-yellow-500'
  return 'bg-blue-500'
})

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-400'
    case 'failed':
      return 'text-red-400'
    case 'cancelled':
      return 'text-yellow-400'
    default:
      return 'text-gray-400'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

onMounted(() => {
  store.fetchHistory(20, 0)
})
</script>

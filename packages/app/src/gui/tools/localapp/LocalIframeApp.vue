<template>
  <PCWindow v-if="windowInstance" :window-instance="windowInstance" @close="$emit('close')">
    <div class="local-app-frame">
      <div v-if="error" class="local-app-frame__state">{{ error }}</div>
      <div v-else-if="loading" class="local-app-frame__state">Loading local app...</div>
      <iframe
        v-else
        ref="iframeRef"
        class="local-app-frame__iframe"
        :srcdoc="srcdoc"
        :sandbox="sandbox"
        title="Local app"
      />
    </div>
  </PCWindow>
  <div v-else class="local-app-frame local-app-frame--mobile">
    <div v-if="error" class="local-app-frame__state">{{ error }}</div>
    <div v-else-if="loading" class="local-app-frame__state">Loading local app...</div>
    <iframe
      v-else
      ref="iframeRef"
      class="local-app-frame__iframe"
      :srcdoc="srcdoc"
      :sandbox="sandbox"
      title="Local app"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import PCWindow from '../../components/PCWindow.vue'
import type { WindowInstance } from '../../types'
import { localAppManager } from '../../../platform/apps/local-app-manager'

interface Props {
  windowInstance?: WindowInstance
  data?: Record<string, unknown>
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const srcdoc = ref('')
const sandbox = ref('allow-scripts allow-forms allow-modals allow-downloads')
const loading = ref(true)
const error = ref('')

function getAppId(): string {
  const fromData = props.data?.appId
  if (typeof fromData === 'string') return fromData

  const tool = props.windowInstance?.config.tool ?? ''
  return String(tool).replace(/^local-app:/, '')
}

function onMessage(event: MessageEvent): void {
  const iframeWindow = iframeRef.value?.contentWindow
  if (!iframeWindow || event.source !== iframeWindow) return
  localAppManager.handleIframeMessage(getAppId(), event, props.windowInstance?.config.id)
}

onMounted(async () => {
  try {
    window.addEventListener('message', onMessage)
    const appId = getAppId()
    sandbox.value = localAppManager.getIframeSandbox(appId)
    srcdoc.value = await localAppManager.createIframeDocument(appId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
  localAppManager.releaseIframeSession(getAppId(), props.windowInstance?.config.id)
})
</script>

<style scoped>
.local-app-frame {
  width: 100%;
  height: 100%;
  background: var(--gui-bg-base, #000);
  color: var(--gui-text-primary, #fff);
}

.local-app-frame--mobile {
  min-height: 100dvh;
}

.local-app-frame__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.local-app-frame__state {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 24px;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 13px;
}
</style>

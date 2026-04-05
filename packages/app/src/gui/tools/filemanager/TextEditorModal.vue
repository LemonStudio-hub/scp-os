<template>
  <Transition name="fm-modal">
    <div v-if="visible" class="fm-text-editor-overlay" @click.self="close">
      <div class="fm-text-editor">
        <!-- Header -->
        <div class="fm-text-editor__header">
          <button class="fm-text-editor__cancel-btn" @click="close">Cancel</button>
          <span class="fm-text-editor__title">{{ fileName }}</span>
          <button class="fm-text-editor__save-btn" :disabled="!canSave" @click="save">Save</button>
        </div>

        <!-- Editor -->
        <textarea
          ref="textareaRef"
          v-model="content"
          class="fm-text-editor__textarea"
          :placeholder="'Start typing...'"
          spellcheck="false"
          @keydown="onKeyDown"
        />

        <!-- Footer -->
        <div class="fm-text-editor__footer">
          <span class="fm-text-editor__chars">{{ charCount }} characters</span>
          <span class="fm-text-editor__lines">{{ lineCount }} lines</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { filesystem } from '../../../utils/filesystem'

interface Props {
  visible: boolean
  file: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: { name: string; content: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const content = ref('')
const isNewFile = ref(false)
const fileName = computed(() => props.file?.name || 'untitled.txt')

const canSave = computed(() => content.value.trim().length > 0 || isNewFile.value)
const charCount = computed(() => content.value.length)
const lineCount = computed(() => content.value.split('\n').length)

watch(() => props.visible, async (val) => {
  if (val && props.file) {
    await loadFile()
    await nextTick()
    textareaRef.value?.focus()
  }
})

async function loadFile() {
  try {
    const path = props.file.path || ('/' + props.file.name)
    const data = filesystem.readFile(path)
    if (data !== null) {
      content.value = typeof data === 'string' ? data : ''
    } else {
      content.value = ''
    }
    isNewFile.value = false
  } catch (error) {
    // File might not exist yet (new file)
    content.value = ''
    isNewFile.value = true
  }
}

function save() {
  emit('save', { name: fileName.value, content: content.value })
  close()
}

function close() {
  emit('update:visible', false)
}

function onKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    save()
  }
  if (event.key === 'Escape') {
    close()
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      content.value = content.value.substring(0, start) + '  ' + content.value.substring(end)
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }
}
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────── */
.fm-text-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.fm-text-editor {
  width: 100%;
  max-width: 600px;
  max-height: 90dvh;
  background: var(--gui-bg-surface, #2C2C2E);
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: fm-slide-up 0.3s ease;
}

@keyframes fm-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.fm-text-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--gui-border-subtle, #38383A);
}

.fm-text-editor__cancel-btn,
.fm-text-editor__save-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.fm-text-editor__cancel-btn {
  background: var(--gui-bg-surface-hover, #3A3A3C);
  color: var(--gui-text-primary, #FFFFFF);
}

.fm-text-editor__save-btn {
  background: var(--gui-accent, #007AFF);
  color: #FFFFFF;
}

.fm-text-editor__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fm-text-editor__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Textarea ───────────────────────────────────────────────────────── */
.fm-text-editor__textarea {
  flex: 1;
  min-height: 300px;
  max-height: calc(90dvh - 120px);
  padding: 16px;
  background: var(--gui-bg-base, #0A0A0A);
  color: var(--gui-text-primary, #FFFFFF);
  font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
}

.fm-text-editor__textarea::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

/* ── Footer ─────────────────────────────────────────────────────────── */
.fm-text-editor__footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 0.5px solid var(--gui-border-subtle, #38383A);
  font-size: 12px;
  color: var(--gui-text-tertiary, #636366);
}

/* ── Transition ─────────────────────────────────────────────────────── */
.fm-modal-enter-active,
.fm-modal-leave-active {
  transition: opacity 0.3s ease;
}

.fm-modal-enter-from,
.fm-modal-leave-to {
  opacity: 0;
}
</style>

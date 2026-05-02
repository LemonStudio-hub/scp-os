<template>
  <div class="doc-reader">
    <!-- ── Loading State ──────────────────────────────────────────── -->
    <div v-if="loading" class="doc-reader__loading">
      <div class="doc-reader__loading-dot" />
      <div class="doc-reader__loading-dot" />
      <div class="doc-reader__loading-dot" />
    </div>

    <!-- ── Reader Content ─────────────────────────────────────────── -->
    <template v-else>
      <!-- Meta Header -->
      <header class="doc-reader__header">
        <h1 class="doc-reader__title">{{ title }}</h1>
        <div class="doc-reader__meta">
          <span v-if="author" class="doc-reader__author">
            <svg class="doc-reader__meta-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="5" r="3" stroke="currentColor" stroke-width="1.2"/>
              <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            {{ author }}
          </span>
          <span v-if="wordCount !== null" class="doc-reader__word-count">
            <svg class="doc-reader__meta-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M5 5h4M5 7.5h3M5 10h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            {{ formattedWordCount }}
          </span>
          <span v-if="rating !== null" class="doc-reader__rating">
            <svg class="doc-reader__meta-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L2 5.5l3.5-.5z" fill="currentColor"/>
            </svg>
            {{ rating }}
          </span>
        </div>
        <div class="doc-reader__divider" />
      </header>

      <!-- Content Body -->
      <div class="doc-reader__body" v-html="sanitizedContent" />

      <!-- Empty State -->
      <div v-if="!content" class="doc-reader__empty">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M16 18h16M16 24h12M16 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No content to display</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { config } from '../config'

const ALLOWED_IMAGE_HOSTS = [
  'scp-wiki.wdfiles.com',
  'scp-wiki-cn.wdfiles.com',
  'wikidot.com',
  'scpfoundation.ru',
  'scp-wiki.wikidot.com',
  'scp-wiki-cn.wikidot.com',
]

function proxyImageUrl(src: string): string {
  if (!src) return src
  try {
    const url = new URL(src, window.location.origin)
    if (ALLOWED_IMAGE_HOSTS.some(host => url.hostname.endsWith(host))) {
      return `${config.api.workerUrl}/image-proxy?url=${encodeURIComponent(src)}`
    }
  } catch {
    // invalid URL, return as-is
  }
  return src
}

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  title: string
  content: string
  author?: string
  rating?: number | null
  wordCount?: number | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  author: undefined,
  rating: null,
  wordCount: null,
  loading: false,
})

// ── Computed ─────────────────────────────────────────────────────────

const formattedWordCount = computed(() => {
  if (props.wordCount === null || props.wordCount === undefined) return ''
  if (props.wordCount >= 1000) {
    return `${(props.wordCount / 1000).toFixed(1)}k words`
  }
  return `${props.wordCount} words`
})

const sanitizedContent = computed(() => {
  if (!props.content) return ''
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'src' && data.attrValue && node.nodeName === 'IMG') {
      data.attrValue = proxyImageUrl(data.attrValue)
    }
  })
  try {
    return DOMPurify.sanitize(props.content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr', 'blockquote', 'pre', 'code',
        'ul', 'ol', 'li',
        'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
        'span', 'div', 'sup', 'sub',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    })
  } finally {
    DOMPurify.removeAllHooks()
  }
})
</script>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────────────── */
.doc-reader {
  --reader-bg: #0a0a0a;
  --reader-text: #e0e0e0;
  --reader-text-secondary: #9a9a9a;
  --reader-text-tertiary: #5a5a5a;
  --reader-accent: #8E8E93;
  --reader-border: rgba(255, 255, 255, 0.06);
  --reader-surface: #141416;
  --reader-surface-hover: #1e1e22;

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--reader-bg);
  color: var(--reader-text);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
}

/* ── Loading ────────────────────────────────────────────────────────── */
.doc-reader__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.doc-reader__loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--reader-accent);
  animation: reader-bounce 1.3s ease-in-out infinite;
}

.doc-reader__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.doc-reader__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes reader-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Header ─────────────────────────────────────────────────────────── */
.doc-reader__header {
  padding: 24px 28px 0;
  flex-shrink: 0;
}

.doc-reader__title {
  margin: 0 0 10px 0;
  font-size: 1.5em;
  font-weight: 700;
  line-height: 1.3;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.doc-reader__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--reader-text-secondary);
  font-size: 13px;
}

.doc-reader__author,
.doc-reader__word-count,
.doc-reader__rating {
  display: flex;
  align-items: center;
  gap: 5px;
}

.doc-reader__meta-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.doc-reader__rating {
  color: #FFCC00;
}

.doc-reader__divider {
  margin-top: 16px;
  border-bottom: 1px solid var(--reader-border);
}

/* ── Body ───────────────────────────────────────────────────────────── */
.doc-reader__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 32px;
  scrollbar-width: thin;
  scrollbar-color: var(--reader-border) transparent;
  line-height: 1.85;
  word-wrap: break-word;
}

.doc-reader__body::-webkit-scrollbar {
  width: 8px;
}

.doc-reader__body::-webkit-scrollbar-track {
  background: transparent;
}

.doc-reader__body::-webkit-scrollbar-thumb {
  background-color: var(--reader-border);
  border-radius: 4px;
}

/* ── Content Styles (Deep Selectors) ────────────────────────────────── */
.doc-reader__body :deep(h1) {
  font-size: 1.7em;
  font-weight: 700;
  margin: 0 0 0.6em;
  color: #ffffff;
  border-bottom: 1px solid var(--reader-border);
  padding-bottom: 0.3em;
}

.doc-reader__body :deep(h2) {
  font-size: 1.35em;
  font-weight: 600;
  margin: 1.2em 0 0.5em;
  color: #ffffff;
}

.doc-reader__body :deep(h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 1em 0 0.4em;
  color: #f0f0f0;
}

.doc-reader__body :deep(p) {
  margin: 0 0 1em;
}

.doc-reader__body :deep(blockquote) {
  margin: 1em 0;
  padding: 12px 18px;
  border-left: 3px solid var(--reader-accent);
  background: var(--reader-surface);
  border-radius: 0 8px 8px 0;
  color: var(--reader-text-secondary);
}

.doc-reader__body :deep(code) {
  font-family: var(--gui-font-mono, "JetBrains Mono", "Fira Code", monospace);
  font-size: 0.88em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--reader-surface);
  color: #d4d4d4;
}

.doc-reader__body :deep(pre) {
  margin: 1em 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--reader-surface);
  overflow-x: auto;
  border: 1px solid var(--reader-border);
}

.doc-reader__body :deep(pre code) {
  padding: 0;
  background: transparent;
  border: none;
}

.doc-reader__body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.92em;
}

.doc-reader__body :deep(th),
.doc-reader__body :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--reader-border);
  text-align: left;
}

.doc-reader__body :deep(th) {
  background: var(--reader-surface);
  font-weight: 600;
  color: #ffffff;
}

.doc-reader__body :deep(a) {
  color: var(--reader-accent);
  text-decoration: none;
  transition: opacity 0.15s;
}

.doc-reader__body :deep(a:hover) {
  opacity: 0.75;
  text-decoration: underline;
}

.doc-reader__body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.doc-reader__body :deep(hr) {
  border: none;
  border-top: 1px solid var(--reader-border);
  margin: 2em 0;
}

.doc-reader__body :deep(ul),
.doc-reader__body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}

.doc-reader__body :deep(li) {
  margin: 0.35em 0;
}

.doc-reader__body :deep(strong),
.doc-reader__body :deep(b) {
  color: #ffffff;
  font-weight: 600;
}

.doc-reader__body :deep(em),
.doc-reader__body :deep(i) {
  font-style: italic;
}

/* ── Empty State ────────────────────────────────────────────────────── */
.doc-reader__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--reader-text-tertiary);
  gap: 12px;
}

.doc-reader__empty p {
  margin: 0;
  font-size: 14px;
}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .doc-reader__header {
    padding: 18px 16px 0;
  }

  .doc-reader__title {
    font-size: 1.3em;
  }

  .doc-reader__body {
    padding: 16px 16px 24px;
  }
}
</style>

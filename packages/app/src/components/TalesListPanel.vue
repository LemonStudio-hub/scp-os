<template>
  <div class="tales-panel">
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- LIST VIEW                                                        -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <template v-if="view === 'list'">
      <!-- Search Bar -->
      <div class="tales-panel__search">
        <svg class="tales-panel__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="tales-panel__search-input"
          placeholder="Search tales by title..."
          @input="onSearchInput"
        />
        <button
          v-if="searchQuery"
          class="tales-panel__search-clear"
          title="Clear search"
          @click="clearSearch"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Info Bar -->
      <div class="tales-panel__info-bar">
        <span class="tales-panel__info-count">{{ filteredTales.length }} tale{{ filteredTales.length !== 1 ? 's' : '' }}</span>
        <span v-if="error" class="tales-panel__info-error">{{ error }}</span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tales-panel__loading">
        <div class="tales-panel__loading-dot" />
        <div class="tales-panel__loading-dot" />
        <div class="tales-panel__loading-dot" />
      </div>

      <!-- Error State (no data) -->
      <div v-else-if="error && tales.length === 0" class="tales-panel__error-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2"/>
          <path d="M24 14v14M24 34v1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Failed to load tales</p>
        <button class="tales-panel__retry-btn" @click="fetchTales">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTales.length === 0" class="tales-panel__empty">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M16 18h16M16 24h12M16 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p v-if="searchQuery">No tales match "{{ searchQuery }}"</p>
        <p v-else>No tales available</p>
      </div>

      <!-- Tales List -->
      <div v-else class="tales-panel__list">
        <div
          v-for="tale in filteredTales"
          :key="tale.id"
          class="tales-panel__item"
          :class="{ 'tales-panel__item--active': selectedTaleId === tale.id }"
          @click="openTale(tale)"
        >
          <div class="tales-panel__item-main">
            <span class="tales-panel__item-title">{{ tale.title }}</span>
            <span class="tales-panel__item-author">{{ tale.author || 'Unknown Author' }}</span>
          </div>
          <div class="tales-panel__item-meta">
            <span v-if="tale.year" class="tales-panel__item-year">{{ tale.year }}</span>
            <svg class="tales-panel__item-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- DETAIL VIEW                                                      -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- Toolbar -->
      <div class="tales-panel__toolbar">
        <button class="tales-panel__toolbar-btn" title="Back to list" @click="backToList">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="tales-panel__toolbar-label">Back</span>
        </button>
        <span class="tales-panel__toolbar-title">{{ selectedTale?.title || '' }}</span>
        <div class="tales-panel__toolbar-spacer" />
      </div>

      <!-- DocReaderPanel -->
      <div class="tales-panel__reader-wrapper">
        <DocReaderPanel
          :title="selectedTale?.title || ''"
          :content="taleContent"
          :author="selectedTale?.author"
          :rating="selectedTale?.rating ?? null"
          :word-count="taleWordCount"
          :loading="loadingDetail"
        />
      </div>

      <!-- Detail Error Overlay -->
      <div v-if="detailError && !loadingDetail && !taleContent" class="tales-panel__detail-error">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2"/>
          <path d="M16 10v8M16 22v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>{{ detailError }}</p>
        <button class="tales-panel__retry-btn" @click="retryLoadDetail">Retry</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { config } from '../config'
import DocReaderPanel from './DocReaderPanel.vue'

// ── Types ──────────────────────────────────────────────────────────────

interface TaleSummary {
  id: string
  title: string
  author: string
  year: number | null
  rating: number | null
  url: string
}

interface TaleDetail extends TaleSummary {
  content: string
  wordCount: number | null
}

// ── Constants ──────────────────────────────────────────────────────────

const API_BASE = config.api.workerUrl
const FETCH_TIMEOUT_MS = 15000

// ── State ──────────────────────────────────────────────────────────────

const view = ref<'list' | 'detail'>('list')
const tales = ref<TaleSummary[]>([])
const searchQuery = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Detail state
const selectedTaleId = ref<string | null>(null)
const selectedTale = ref<TaleSummary | null>(null)
const taleContent = ref('')
const taleWordCount = ref<number | null>(null)
const loadingDetail = ref(false)
const detailError = ref<string | null>(null)

// ── Computed ───────────────────────────────────────────────────────────

const filteredTales = computed(() => {
  if (!searchQuery.value.trim()) {
    return tales.value
  }
  const query = searchQuery.value.trim().toLowerCase()
  return tales.value.filter((tale) =>
    tale.title.toLowerCase().includes(query)
  )
})

// ── HTTP Helper ────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── API Methods ────────────────────────────────────────────────────────

async function fetchTales(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const response = await fetchWithTimeout(`${API_BASE}/docs/tales`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && Array.isArray(data.data)) {
      tales.value = data.data.map(normalizeTaleSummary)
    } else if (Array.isArray(data)) {
      tales.value = data.map(normalizeTaleSummary)
    } else {
      tales.value = []
      error.value = 'Unexpected response format from API'
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tales'
    error.value = message
    console.error('[TalesListPanel]', message)
  } finally {
    loading.value = false
  }
}

async function fetchTaleDetail(tale: TaleSummary): Promise<void> {
  loadingDetail.value = true
  detailError.value = null
  taleContent.value = ''

  try {
    const id = encodeURIComponent(tale.id)

    // Fetch content from API
    const [contentResponse, metaResponse] = await Promise.allSettled([
      fetchWithTimeout(`${API_BASE}/docs/tales/${id}`),
      fetchWithTimeout(`${API_BASE}/docs/tales/${id}/meta`),
    ])

    let contentData: any = null
    if (contentResponse.status === 'fulfilled' && contentResponse.value.ok) {
      contentData = await contentResponse.value.json()
    }

    let metaData: any = null
    if (metaResponse.status === 'fulfilled' && metaResponse.value.ok) {
      metaData = await metaResponse.value.json()
    }

    if (!contentData) {
      throw new Error('Failed to fetch tale content')
    }

    // Normalize content - handle various API response shapes
    const rawContent: string =
      contentData.data?.content ||
      contentData.content ||
      contentData.data ||
      ''

    const wordCountValue: number | null =
      metaData?.data?.word_count ??
      metaData?.wordCount ??
      contentData.data?.word_count ??
      contentData.wordCount ??
      (rawContent ? rawContent.replace(/<[^>]*>/g, '').length : null)

    taleContent.value = rawContent
    taleWordCount.value = wordCountValue

    // Update selected tale with enriched meta if available
    if (metaData?.data) {
      selectedTale.value = {
        ...tale,
        author: metaData.data.author || tale.author,
        year: metaData.data.year ?? tale.year,
        rating: metaData.data.rating ?? tale.rating,
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load tale content'
    detailError.value = message
    console.error('[TalesListPanel] Failed to load detail:', message)
  } finally {
    loadingDetail.value = false
  }
}

// ── Normalization ──────────────────────────────────────────────────────

function normalizeTaleSummary(raw: any): TaleSummary {
  return {
    id: String(raw.id || raw._id || raw.slug || ''),
    title: String(raw.title || 'Untitled'),
    author: String(raw.author || raw.by || 'Unknown'),
    year: raw.year ?? raw.published_year ?? raw.publishYear ?? null,
    rating: raw.rating ?? raw.score ?? null,
    url: String(raw.url || raw.link || ''),
  }
}

// ── Event Handlers ─────────────────────────────────────────────────────

function onSearchInput(): void {
  // Frontend filtering is handled reactively via computed
}

function clearSearch(): void {
  searchQuery.value = ''
}

async function openTale(tale: TaleSummary): Promise<void> {
  selectedTaleId.value = tale.id
  selectedTale.value = { ...tale }
  view.value = 'detail'

  await fetchTaleDetail(tale)
}

function backToList(): void {
  view.value = 'list'
  selectedTaleId.value = null
  selectedTale.value = null
  taleContent.value = ''
  taleWordCount.value = null
  detailError.value = null
}

async function retryLoadDetail(): Promise<void> {
  if (selectedTale.value) {
    await fetchTaleDetail(selectedTale.value)
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────

onMounted(() => {
  fetchTales()
})
</script>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────────────── */
.tales-panel {
  --tp-bg: #0a0a0a;
  --tp-surface: #131315;
  --tp-surface-hover: #1c1c20;
  --tp-surface-active: #25252a;
  --tp-border: rgba(255, 255, 255, 0.06);
  --tp-text-primary: #e0e0e0;
  --tp-text-secondary: #9a9a9a;
  --tp-text-tertiary: #5a5a5a;
  --tp-accent: #8E8E93;
  --tp-accent-soft: rgba(142, 142, 147, 0.12);
  --tp-radius: 10px;
  --tp-radius-sm: 6px;

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tp-bg);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  color: var(--tp-text-primary);
}

/* ── Search Bar ─────────────────────────────────────────────────────── */
.tales-panel__search {
  position: relative;
  padding: 12px 16px;
  background: var(--tp-surface);
  border-bottom: 1px solid var(--tp-border);
  flex-shrink: 0;
}

.tales-panel__search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--tp-text-tertiary);
  pointer-events: none;
}

.tales-panel__search-input {
  width: 100%;
  height: 38px;
  padding: 0 36px 0 36px;
  border-radius: var(--tp-radius);
  border: none;
  background: var(--tp-bg);
  color: var(--tp-text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow 0.2s ease;
}

.tales-panel__search-input:focus {
  box-shadow: 0 0 0 2px var(--tp-accent);
}

.tales-panel__search-input::placeholder {
  color: var(--tp-text-tertiary);
}

.tales-panel__search-clear {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--tp-surface-hover);
  color: var(--tp-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.tales-panel__search-clear:hover {
  background: var(--tp-surface-active);
  color: var(--tp-text-primary);
}

/* ── Info Bar ───────────────────────────────────────────────────────── */
.tales-panel__info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--tp-surface);
  border-bottom: 1px solid var(--tp-border);
  flex-shrink: 0;
}

.tales-panel__info-count {
  font-size: 12px;
  color: var(--tp-text-secondary);
}

.tales-panel__info-error {
  font-size: 12px;
  color: #FF3B30;
}

/* ── Loading ────────────────────────────────────────────────────────── */
.tales-panel__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  flex: 1;
}

.tales-panel__loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tp-accent);
  animation: tp-bounce 1.3s ease-in-out infinite;
}

.tales-panel__loading-dot:nth-child(2) { animation-delay: 0.2s; }
.tales-panel__loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes tp-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Error / Empty States ───────────────────────────────────────────── */
.tales-panel__error-state,
.tales-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: var(--tp-text-tertiary);
  gap: 12px;
  flex: 1;
}

.tales-panel__error-state p,
.tales-panel__empty p {
  margin: 0;
  font-size: 14px;
}

/* ── Retry Button ───────────────────────────────────────────────────── */
.tales-panel__retry-btn {
  padding: 8px 20px;
  border-radius: var(--tp-radius);
  border: 1px solid var(--tp-accent);
  background: transparent;
  color: var(--tp-accent);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tales-panel__retry-btn:hover {
  background: var(--tp-accent);
  color: #ffffff;
}

.tales-panel__retry-btn:active {
  transform: scale(0.96);
}

/* ── Tales List ─────────────────────────────────────────────────────── */
.tales-panel__list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--tp-border) transparent;
  -webkit-overflow-scrolling: touch;
}

.tales-panel__list::-webkit-scrollbar { width: 6px; }
.tales-panel__list::-webkit-scrollbar-track { background: transparent; }
.tales-panel__list::-webkit-scrollbar-thumb { background-color: var(--tp-border); border-radius: 3px; }

.tales-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--tp-border);
  gap: 12px;
}

.tales-panel__item:hover {
  background: var(--tp-surface-hover);
}

.tales-panel__item:active {
  background: var(--tp-surface-active);
  transform: scale(0.995);
}

.tales-panel__item--active {
  background: var(--tp-accent-soft);
  border-left: 3px solid var(--tp-accent);
  padding-left: 13px;
}

.tales-panel__item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tales-panel__item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--tp-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tales-panel__item-author {
  font-size: 12px;
  color: var(--tp-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tales-panel__item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tales-panel__item-year {
  font-size: 12px;
  color: var(--tp-text-tertiary);
  font-variant-numeric: tabular-nums;
  font-family: var(--gui-font-mono, "JetBrains Mono", monospace);
}

.tales-panel__item-chevron {
  color: var(--tp-text-tertiary);
}

/* ── Toolbar (Detail View) ──────────────────────────────────────────── */
.tales-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--tp-surface);
  border-bottom: 1px solid var(--tp-border);
  min-height: 44px;
  flex-shrink: 0;
}

.tales-panel__toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--tp-radius-sm);
  border: none;
  background: transparent;
  color: var(--tp-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tales-panel__toolbar-btn:hover {
  background: var(--tp-surface-hover);
  color: var(--tp-text-primary);
}

.tales-panel__toolbar-btn:active {
  transform: scale(0.96);
}

.tales-panel__toolbar-label {
  font-weight: 500;
}

.tales-panel__toolbar-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--tp-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tales-panel__toolbar-spacer {
  width: 48px;
  flex-shrink: 0;
}

/* ── Reader Wrapper ─────────────────────────────────────────────────── */
.tales-panel__reader-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Detail Error ───────────────────────────────────────────────────── */
.tales-panel__detail-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--tp-bg);
  color: var(--tp-text-tertiary);
  z-index: 10;
}

.tales-panel__detail-error p {
  margin: 0;
  font-size: 14px;
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tales-panel__search {
    padding: 10px 12px;
  }

  .tales-panel__search-input {
    height: 40px;
    font-size: 15px;
  }

  .tales-panel__info-bar {
    padding: 6px 12px;
  }

  .tales-panel__item {
    padding: 14px 12px;
  }

  .tales-panel__toolbar {
    padding: 8px 10px;
    min-height: 48px;
  }
}
</style>

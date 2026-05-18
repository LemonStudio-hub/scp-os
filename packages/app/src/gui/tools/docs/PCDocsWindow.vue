<template>
  <SCPWindow :window-instance="windowInstance" @close="onClose">
    <div class="pc-docs" :class="`pc-docs--${reader.readerTheme.value}`">
      <!-- Left Sidebar -->
      <div class="pc-docs__sidebar">
        <!-- Search -->
        <div class="pc-docs__search">
          <svg class="pc-docs__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="reader.searchQuery.value"
            type="text"
            class="pc-docs__search-input"
            :placeholder="t('docs.searchPlaceholder')"
            @keydown.enter="reader.search()"
          />
        </div>

        <!-- Doc Type Tabs -->
        <div class="pc-docs__doc-type-tabs">
          <button
            v-for="dt in reader.DOC_TYPE_OPTIONS"
            :key="dt.value"
            class="pc-docs__doc-type-tab"
            :class="{ 'pc-docs__doc-type-tab--active': reader.docType.value === dt.value }"
            @click="reader.setDocType(dt.value)"
          >
            {{ dt.label }}
          </button>
        </div>

        <!-- Filters -->
        <div v-if="reader.docType.value === 'scp'" class="pc-docs__filters">
          <div class="pc-docs__filter-group">
            <select
              :value="reader.selectedSeries.value ?? ''"
              class="pc-docs__filter-select"
              @change="onSeriesChange"
            >
              <option value="">{{ t('docs.allSeries') }}</option>
              <option v-for="s in reader.SERIES_OPTIONS" :key="s.value" :value="s.value">
                {{ s.label }} ({{ s.range }})
              </option>
            </select>
          </div>
          <div class="pc-docs__filter-group">
            <select
              :value="reader.selectedClass.value ?? ''"
              class="pc-docs__filter-select"
              @change="onClassChange"
            >
              <option value="">{{ t('docs.allClasses') }}</option>
              <option v-for="c in reader.CLASS_OPTIONS" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Article List -->
        <div ref="listRef" class="pc-docs__list" @scroll="onListScroll">
          <!-- Loading State -->
          <div v-if="reader.loading.value" class="pc-docs__list-loading">
            <div class="pc-docs__loading-dot" />
            <div class="pc-docs__loading-dot" />
            <div class="pc-docs__loading-dot" />
          </div>

          <!-- Error State -->
          <div v-else-if="reader.error.value" class="pc-docs__list-empty pc-docs__list-error">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M20 12v12M20 28v1"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <p>{{ reader.error.value }}</p>
            <button class="pc-docs__retry-btn" @click="reader.fetchArticles(1)">
              {{ t('docs.retry') }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="reader.filteredArticles.value.length === 0" class="pc-docs__list-empty">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect
                x="6"
                y="4"
                width="28"
                height="32"
                rx="3"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M12 14h16M12 20h12M12 26h8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <p>{{ t('docs.noArticles') }}</p>
          </div>

          <!-- Article Items -->
          <template v-else>
            <div
              class="pc-docs__item pc-docs__item--guide"
              :class="{
                'pc-docs__item--active':
                  reader.currentArticle.value?.scpNumber === reader.GUIDE_SCP_NUMBER,
              }"
              @click="reader.selectGuide()"
            >
              <div class="pc-docs__item-number pc-docs__item-number--guide">📖</div>
              <div class="pc-docs__item-body">
                <span class="pc-docs__item-title">{{ reader.GUIDE_ARTICLE.title }}</span>
                <span class="pc-docs__item-class" style="color: #58a6ff">{{
                  t('docs.guide')
                }}</span>
              </div>
            </div>
            <div
              v-for="article in reader.filteredArticles.value"
              :key="article.scpNumber"
              class="pc-docs__item"
              :class="{
                'pc-docs__item--active':
                  reader.currentArticle.value?.scpNumber === article.scpNumber,
              }"
              @click="reader.selectArticle(article.scpNumber, article.url)"
            >
              <div class="pc-docs__item-number">{{ article.scpNumber }}</div>
              <div class="pc-docs__item-body">
                <span class="pc-docs__item-title">{{ article.title }}</span>
                <span
                  v-if="reader.docType.value === 'scp'"
                  class="pc-docs__item-class"
                  :style="{ color: reader.OBJECT_CLASS_COLORS[article.objectClass] }"
                  >{{ article.objectClass }}</span
                >
              </div>
            </div>

            <!-- Load More Indicator -->
            <div v-if="reader.loadingMore.value" class="pc-docs__list-loading">
              <div class="pc-docs__loading-dot" />
              <div class="pc-docs__loading-dot" />
              <div class="pc-docs__loading-dot" />
            </div>
            <div
              v-else-if="reader.hasMore.value"
              class="pc-docs__load-more"
              @click="reader.loadMore()"
            >
              {{ t('docs.loadMore') }}
            </div>
          </template>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="pc-docs__main">
        <!-- No Article Selected -->
        <div v-if="!reader.currentArticle.value" class="pc-docs__empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect
              x="10"
              y="6"
              width="44"
              height="52"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M20 20h24M20 28h20M20 36h16M20 44h12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <p>{{ t('docs.selectArticle') }}</p>
        </div>

        <!-- Article View -->
        <template v-else>
          <!-- Toolbar -->
          <div class="pc-docs__toolbar">
            <button
              class="pc-docs__toolbar-btn"
              :title="t('docs.backToList')"
              @click="reader.clearArticle()"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 3L5 8L10 13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div class="pc-docs__toolbar-title">
              {{ reader.currentArticle.value.scpNumber }} - {{ reader.currentArticle.value.title }}
            </div>
            <div class="pc-docs__toolbar-actions">
              <!-- Font Size -->
              <button
                class="pc-docs__toolbar-btn"
                :title="t('docs.decreaseFont')"
                @click="reader.decreaseFontSize()"
              >
                <span class="pc-docs__font-label">A-</span>
              </button>
              <button
                class="pc-docs__toolbar-btn"
                :title="t('docs.increaseFont')"
                @click="reader.increaseFontSize()"
              >
                <span class="pc-docs__font-label pc-docs__font-label--large">A+</span>
              </button>
              <!-- Favorite -->
              <button
                class="pc-docs__toolbar-btn"
                :class="{ 'pc-docs__toolbar-btn--active': reader.isFavorited.value }"
                :title="t('docs.favorite')"
                @click="reader.toggleFavorite()"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z"
                    :fill="reader.isFavorited.value ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="1.3"
                  />
                </svg>
              </button>
              <!-- Cache Status -->
              <div
                class="pc-docs__cache-status"
                :class="`pc-docs__cache-status--${reader.cacheStatus.value}`"
              >
                <span class="pc-docs__cache-dot" />
              </div>
            </div>
          </div>

          <!-- TOC Sidebar (optional overlay) -->
          <Transition name="toc-slide">
            <div v-if="showTOC" class="pc-docs__toc">
              <div class="pc-docs__toc-header">
                <span>{{ t('docs.contents') }}</span>
                <button class="pc-docs__toc-close" @click="showTOC = false">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div class="pc-docs__toc-list">
                <button
                  v-for="item in reader.currentArticle.value.toc"
                  :key="item.id"
                  class="pc-docs__toc-item"
                  :style="{ paddingLeft: `${12 + (item.level - 1) * 16}px` }"
                  @click="reader.scrollToTOCItem(item)"
                >
                  {{ item.text }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Content Area -->
          <div
            ref="contentRef"
            class="pc-docs__content"
            :style="{ fontSize: `${reader.fontSize.value}px` }"
          >
            <!-- Loading -->
            <div v-if="reader.loadingDetail.value" class="pc-docs__content-loading">
              <div class="pc-docs__loading-dot" />
              <div class="pc-docs__loading-dot" />
              <div class="pc-docs__loading-dot" />
            </div>

            <!-- Error -->
            <div v-else-if="reader.error.value" class="pc-docs__content-error">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2" />
                <path
                  d="M16 10v8M16 22v1"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <p>{{ reader.error.value }}</p>
              <button
                class="pc-docs__retry-btn"
                @click="reader.selectArticle(reader.currentArticle.value!.scpNumber)"
              >
                {{ t('docs.retry') }}
              </button>
            </div>

            <!-- Article Content -->
            <div v-else class="pc-docs__article" v-html="sanitizedContent" />
          </div>

          <!-- TOC Toggle Button -->
          <button
            v-if="reader.currentArticle.value?.toc.length"
            class="pc-docs__toc-toggle"
            :class="{ 'pc-docs__toc-toggle--active': showTOC }"
            :title="t('docs.tableOfContents')"
            @click="showTOC = !showTOC"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 3h12M2 7h8M2 11h10"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </template>
      </div>
    </div>
  </SCPWindow>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import DOMPurify from 'dompurify'
import SCPWindow from '../../components/SCPWindow.vue'
import { useDocsReader } from '../../composables/useDocsReader'
import { applyImageProxyHook } from '../../../utils/imageProxy'
import { useI18n } from '../../composables/useI18n'
import type { WindowInstance } from '../../types'
import type { SCPObjectClass } from '../../composables/useDocsReader'

interface Props {
  windowInstance: WindowInstance
}

defineProps<Props>()
const reader = useDocsReader()
const { t } = useI18n()

const sanitizedContent = computed(() => {
  const content = reader.currentArticle.value?.content
  if (!content) return ''
  applyImageProxyHook()
  try {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'hr',
        'blockquote',
        'pre',
        'code',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'del',
        'ins',
        'span',
        'div',
        'sup',
        'sub',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    })
  } finally {
    DOMPurify.removeAllHooks()
  }
})

const listRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const showTOC = ref(false)

// ── Filter Handlers ──────────────────────────────────────────────────

function onSeriesChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  reader.setSeries(value ? Number(value) : null)
}

function onClassChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  reader.setObjectClass((value || null) as SCPObjectClass | null)
}

// ── Infinite Scroll ──────────────────────────────────────────────────

function onListScroll(): void {
  if (!listRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = listRef.value
  if (scrollHeight - scrollTop - clientHeight < 100) {
    reader.loadMore()
  }
}

// ── Progress Auto-Save ───────────────────────────────────────────────

function getContentScrollPosition(): number {
  return contentRef.value?.scrollTop ?? 0
}

// ── Scroll Restoration ───────────────────────────────────────────────

watch(
  () => reader.currentArticle.value,
  (article) => {
    if (article && contentRef.value) {
      const scrollPos = (article as any)._scrollPosition as number | undefined
      if (scrollPos) {
        nextTick(() => {
          contentRef.value?.scrollTo({ top: scrollPos })
        })
      }
    }
  }
)

// ── Window Close ─────────────────────────────────────────────────────

function onClose(): void {
  reader.stopProgressAutoSave()
  reader.saveProgress(getContentScrollPosition())
}

// ── Lifecycle ────────────────────────────────────────────────────────

onMounted(() => {
  reader.startProgressAutoSave(getContentScrollPosition)
})

onBeforeUnmount(() => {
  reader.stopProgressAutoSave()
  reader.saveProgress(getContentScrollPosition())
})
</script>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────────────── */
.pc-docs {
  --docs-bg: #0e0e0e;
  --docs-surface: #1a1a1c;
  --docs-surface-hover: #2c2c2e;
  --docs-bg-hover: #2c2c2e;
  --docs-border: rgba(255, 255, 255, 0.06);
  --docs-text-primary: #f0f0f0;
  --docs-text-secondary: #a8a8a8;
  --docs-text-tertiary: #6a6a6a;
  --docs-accent: #8e8e93;
  --docs-accent-soft: rgba(142, 142, 147, 0.12);
  --docs-content-bg: #111113;
  --docs-content-text: #e0e0e0;
  --docs-popover-shadow: rgba(0, 0, 0, 0.2);

  display: flex;
  height: 100%;
  background: var(--docs-bg);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  position: relative;
}

/* Light theme overrides */
.pc-docs--light {
  --docs-bg: #f5f5f7;
  --docs-surface: #ffffff;
  --docs-surface-hover: #e8e8ed;
  --docs-bg-hover: #e8e8ed;
  --docs-border: rgba(0, 0, 0, 0.08);
  --docs-text-primary: #1d1d1f;
  --docs-text-secondary: #6e6e73;
  --docs-text-tertiary: #86868b;
  --docs-accent: #007aff;
  --docs-accent-soft: rgba(0, 122, 255, 0.12);
  --docs-content-bg: #ffffff;
  --docs-content-text: #1d1d1f;
  --docs-popover-shadow: rgba(0, 0, 0, 0.1);
}

/* ── Sidebar ────────────────────────────────────────────────────────── */
.pc-docs__sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--docs-surface);
  border-right: 1px solid var(--docs-border);
}

/* ── Search ─────────────────────────────────────────────────────────── */
.pc-docs__search {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid var(--docs-border);
}

.pc-docs__search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--docs-text-tertiary);
  pointer-events: none;
}

.pc-docs__search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border-radius: 10px;
  border: none;
  background: var(--docs-bg);
  color: var(--docs-text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow 0.2s ease;
}

.pc-docs__search-input:focus {
  box-shadow: 0 0 0 2px var(--docs-accent);
}

.pc-docs__search-input::placeholder {
  color: var(--docs-text-tertiary);
}

/* ── Doc Type Tabs ──────────────────────────────────────────────────── */
.pc-docs__doc-type-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--docs-border);
  overflow-x: auto;
  scrollbar-width: none;
}

.pc-docs__doc-type-tabs::-webkit-scrollbar {
  display: none;
}

.pc-docs__doc-type-tab {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.pc-docs__doc-type-tab:hover {
  background: var(--docs-bg-hover);
  color: var(--docs-text-primary);
}

.pc-docs__doc-type-tab--active {
  background: var(--docs-accent-soft);
  color: var(--docs-accent);
}

/* ── Filters ────────────────────────────────────────────────────────── */
.pc-docs__filters {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--docs-border);
}

.pc-docs__filter-group {
  flex: 1;
}

.pc-docs__filter-select {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid var(--docs-border);
  background: var(--docs-bg);
  color: var(--docs-text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236a6a6a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 24px;
}

.pc-docs__filter-select:focus {
  border-color: var(--docs-accent);
}

/* ── Article List ───────────────────────────────────────────────────── */
.pc-docs__list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--docs-border) transparent;
}

.pc-docs__list::-webkit-scrollbar {
  width: 4px;
}
.pc-docs__list::-webkit-scrollbar-track {
  background: transparent;
}
.pc-docs__list::-webkit-scrollbar-thumb {
  background-color: var(--docs-border);
  border-radius: 2px;
}

.pc-docs__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--docs-border);
}

.pc-docs__item:hover {
  background: var(--docs-surface-hover);
}

.pc-docs__item--active {
  background: var(--docs-accent);
}

.pc-docs__item--active:hover {
  background: var(--docs-accent);
  opacity: 0.9;
}

.pc-docs__item-number {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  font-size: 12px;
  font-weight: 600;
  color: var(--docs-text-secondary);
  min-width: 60px;
  flex-shrink: 0;
}

.pc-docs__item--active .pc-docs__item-number {
  color: var(--gui-text-primary, rgba(255, 255, 255, 0.9));
}

.pc-docs__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-docs__item-title {
  font-size: 13px;
  color: var(--docs-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-docs__item--active .pc-docs__item-title {
  color: var(--gui-text-primary, #ffffff);
}

.pc-docs__item-class {
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.pc-docs__item--active .pc-docs__item-class {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* ── List Loading / Empty ───────────────────────────────────────────── */
.pc-docs__list-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 32px 0;
}

.pc-docs__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--docs-accent);
  animation: docs-bounce 1.2s ease-in-out infinite;
}

.pc-docs__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.pc-docs__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes docs-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.pc-docs__list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--docs-text-tertiary);
  gap: 12px;
}

.pc-docs__list-empty p {
  font-size: 13px;
  margin: 0;
}

.pc-docs__list-error {
  color: var(--gui-error, #ff3b30);
}

.pc-docs__list-error p {
  font-size: 13px;
  margin: 0;
  max-width: 240px;
  text-align: center;
  word-break: break-word;
}

.pc-docs__load-more {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--docs-accent);
  cursor: pointer;
  transition: opacity 0.15s;
}

.pc-docs__load-more:hover {
  opacity: 0.7;
}

/* ── Main Panel ─────────────────────────────────────────────────────── */
.pc-docs__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* ── Empty State ────────────────────────────────────────────────────── */
.pc-docs__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--docs-text-tertiary);
  gap: 16px;
}

.pc-docs__empty p {
  font-size: 14px;
  margin: 0;
}

/* ── Toolbar ────────────────────────────────────────────────────────── */
.pc-docs__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--docs-surface);
  border-bottom: 1px solid var(--docs-border);
  min-height: 44px;
}

.pc-docs__toolbar-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--docs-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-docs__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pc-docs__toolbar-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--docs-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.pc-docs__toolbar-btn:hover {
  background: var(--docs-surface-hover);
  color: var(--docs-text-primary);
}

.pc-docs__toolbar-btn--active {
  color: var(--gui-error, #ff3b30);
}

.pc-docs__font-label {
  font-size: 12px;
  font-weight: 700;
  font-family: var(--gui-font-sans, sans-serif);
}

.pc-docs__font-label--large {
  font-size: 14px;
}

/* ── Cache Status ───────────────────────────────────────────────────── */
.pc-docs__cache-status {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.pc-docs__cache-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--docs-text-tertiary);
  transition: all 0.3s ease;
}

.pc-docs__cache-status--loading .pc-docs__cache-dot {
  background: #ff9500;
  animation: cache-pulse 1s ease-in-out infinite;
}

.pc-docs__cache-status--cached .pc-docs__cache-dot {
  background: #34c759;
  box-shadow: 0 0 4px rgba(52, 199, 89, 0.5);
}

@keyframes cache-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ── Table of Contents ──────────────────────────────────────────────── */
.pc-docs__toc {
  position: absolute;
  top: 44px;
  right: 0;
  width: 260px;
  max-height: calc(100% - 44px);
  background: var(--docs-surface);
  border-left: 1px solid var(--docs-border);
  border-bottom: 1px solid var(--docs-border);
  z-index: 50;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 4px 16px var(--docs-popover-shadow);
}

.pc-docs__toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--docs-text-primary);
  border-bottom: 1px solid var(--docs-border);
}

.pc-docs__toc-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--docs-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pc-docs__toc-close:hover {
  background: var(--docs-surface-hover);
}

.pc-docs__toc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--docs-border) transparent;
}

.pc-docs__toc-item {
  display: block;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-docs__toc-item:hover {
  background: var(--docs-surface-hover);
  color: var(--docs-text-primary);
}

/* TOC Toggle Button */
.pc-docs__toc-toggle {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--docs-border);
  background: var(--docs-surface);
  color: var(--docs-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 8px var(--docs-popover-shadow);
  z-index: 10;
}

.pc-docs__toc-toggle:hover {
  background: var(--docs-surface-hover);
  color: var(--docs-text-primary);
}

.pc-docs__toc-toggle--active {
  background: var(--docs-accent);
  color: var(--gui-text-primary, #ffffff);
  border-color: var(--docs-accent);
}

/* ── Content Area ───────────────────────────────────────────────────── */
.pc-docs__content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background: var(--docs-content-bg);
  scrollbar-width: thin;
  scrollbar-color: var(--docs-border) transparent;
  line-height: 1.8;
  color: var(--docs-content-text);
}

.pc-docs__content::-webkit-scrollbar {
  width: 8px;
}
.pc-docs__content::-webkit-scrollbar-track {
  background: transparent;
}
.pc-docs__content::-webkit-scrollbar-thumb {
  background-color: var(--docs-border);
  border-radius: 4px;
}

.pc-docs__content-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 64px 0;
}

.pc-docs__content-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  color: var(--docs-text-tertiary);
  gap: 12px;
}

.pc-docs__content-error p {
  font-size: 14px;
  margin: 0;
}

.pc-docs__retry-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid var(--docs-accent);
  background: transparent;
  color: var(--docs-accent);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.pc-docs__retry-btn:hover {
  background: var(--docs-accent);
  color: var(--gui-text-primary, #ffffff);
}

/* ── Article Content Styles ─────────────────────────────────────────── */
.pc-docs__article {
  max-width: 780px;
  margin: 0 auto;
  word-wrap: break-word;
}

.pc-docs--light .pc-docs__article :deep(.guide-wrap) {
  color: var(--docs-text-secondary) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-hero),
.pc-docs--light .pc-docs__article :deep(.guide-intro-card),
.pc-docs--light .pc-docs__article :deep(.guide-cmd-block) {
  background: #f7f8fa !important;
  border-color: var(--docs-border) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-toc),
.pc-docs--light .pc-docs__article :deep(.guide-app-card),
.pc-docs--light .pc-docs__article :deep(.guide-step),
.pc-docs--light .pc-docs__article :deep(.guide-faq-item),
.pc-docs--light .pc-docs__article :deep(.guide-shortcut) {
  background: #ffffff !important;
  border-color: var(--docs-border) !important;
  box-shadow: none !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-hero h1),
.pc-docs--light .pc-docs__article :deep(.guide-section-title h2),
.pc-docs--light .pc-docs__article :deep(.guide-app-card h4),
.pc-docs--light .pc-docs__article :deep(.guide-step-content h4),
.pc-docs--light .pc-docs__article :deep(.guide-faq-item h4),
.pc-docs--light .pc-docs__article :deep(.guide-section li strong) {
  color: var(--docs-text-primary) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-hero p),
.pc-docs--light .pc-docs__article :deep(.guide-section p),
.pc-docs--light .pc-docs__article :deep(.guide-section li),
.pc-docs--light .pc-docs__article :deep(.guide-app-card p),
.pc-docs--light .pc-docs__article :deep(.guide-step-content p),
.pc-docs--light .pc-docs__article :deep(.guide-faq-item p),
.pc-docs--light .pc-docs__article :deep(.guide-shortcut-desc) {
  color: var(--docs-text-secondary) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-section code),
.pc-docs--light .pc-docs__article :deep(.guide-shortcut-key),
.pc-docs--light .pc-docs__article :deep(.guide-step-tools code) {
  background: #eef1f5 !important;
  border-color: var(--docs-border) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-section pre) {
  background: #f7f8fa !important;
  border-color: var(--docs-border) !important;
}

.pc-docs--light .pc-docs__article :deep(.guide-section pre code) {
  color: var(--docs-text-primary) !important;
}

.pc-docs__article :deep(h1) {
  font-size: 1.8em;
  font-weight: 700;
  margin: 0 0 0.6em;
  color: var(--docs-text-primary);
  border-bottom: 1px solid var(--docs-border);
  padding-bottom: 0.3em;
}

.pc-docs__article :deep(h2) {
  font-size: 1.4em;
  font-weight: 600;
  margin: 1.2em 0 0.5em;
  color: var(--docs-text-primary);
}

.pc-docs__article :deep(h3) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 1em 0 0.4em;
  color: var(--docs-text-primary);
}

.pc-docs__article :deep(p) {
  margin: 0 0 1em;
  line-height: 1.8;
}

.pc-docs__article :deep(blockquote) {
  margin: 1em 0;
  padding: 12px 20px;
  border-left: 3px solid var(--docs-accent);
  background: var(--docs-surface);
  border-radius: 0 8px 8px 0;
  color: var(--docs-text-secondary);
}

.pc-docs__article :deep(code) {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  font-size: 0.9em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--docs-surface);
}

.pc-docs__article :deep(pre) {
  margin: 1em 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--docs-surface);
  overflow-x: auto;
}

.pc-docs__article :deep(pre code) {
  padding: 0;
  background: transparent;
}

.pc-docs__article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.pc-docs__article :deep(th),
.pc-docs__article :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--docs-border);
  text-align: left;
}

.pc-docs__article :deep(th) {
  background: var(--docs-surface);
  font-weight: 600;
}

.pc-docs__article :deep(a) {
  color: var(--docs-accent);
  text-decoration: none;
}

.pc-docs__article :deep(a:hover) {
  text-decoration: underline;
}

.pc-docs__article :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.pc-docs__article :deep(hr) {
  border: none;
  border-top: 1px solid var(--docs-border);
  margin: 2em 0;
}

.pc-docs__article :deep(ul),
.pc-docs__article :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}

.pc-docs__article :deep(li) {
  margin: 0.3em 0;
}

/* ── TOC Transition ─────────────────────────────────────────────────── */
.toc-slide-enter-active,
.toc-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.toc-slide-enter-from,
.toc-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pc-docs__sidebar {
    width: 220px;
    min-width: 220px;
  }

  .pc-docs__content {
    padding: 16px 20px;
  }
}

.pc-docs__item--guide {
  background: rgba(56, 139, 253, 0.06);
  border: 1px solid rgba(56, 139, 253, 0.15);
}
.pc-docs__item--guide:hover {
  background: var(--gui-accent-soft);
  border-color: rgba(56, 139, 253, 0.3);
}
.pc-docs__item-number--guide {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

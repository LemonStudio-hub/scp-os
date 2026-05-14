<template>
  <MobileWindow
    :visible="visible"
    :title="view === 'list' ? 'SCP Docs' : reader.currentArticle.value?.scpNumber || ''"
    :show-back="true"
    @close="$emit('close')"
    @back="view === 'detail' ? onBack() : $emit('close')"
  >
    <div class="mobile-docs" :class="`mobile-docs--${reader.readerTheme.value}`">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- LIST VIEW                                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div v-if="view === 'list'" class="mobile-docs__list-view">
        <!-- Search Bar -->
        <div class="mobile-docs__search-bar">
          <svg
            class="mobile-docs__search-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
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
            class="mobile-docs__search-input"
            placeholder="Search SCP..."
            @keydown.enter="reader.search()"
          />
        </div>

        <!-- Filter Tags (horizontal scroll) -->
        <div class="mobile-docs__filter-scroll">
          <div class="mobile-docs__filter-tags">
            <button
              class="mobile-docs__filter-tag"
              :class="{
                'mobile-docs__filter-tag--active':
                  reader.selectedSeries.value === null && reader.selectedClass.value === null,
              }"
              @click="clearFilters"
            >
              All
            </button>
            <button
              v-for="s in reader.SERIES_OPTIONS.slice(0, 6)"
              :key="s.value"
              class="mobile-docs__filter-tag"
              :class="{
                'mobile-docs__filter-tag--active': reader.selectedSeries.value === s.value,
              }"
              @click="reader.setSeries(reader.selectedSeries.value === s.value ? null : s.value)"
            >
              {{ s.label }}
            </button>
            <button
              v-for="c in reader.CLASS_OPTIONS"
              :key="c.value"
              class="mobile-docs__filter-tag mobile-docs__filter-tag--class"
              :class="{ 'mobile-docs__filter-tag--active': reader.selectedClass.value === c.value }"
              :style="
                reader.selectedClass.value === c.value
                  ? {
                      borderColor: reader.OBJECT_CLASS_COLORS[c.value],
                      color: reader.OBJECT_CLASS_COLORS[c.value],
                    }
                  : {}
              "
              @click="
                reader.setObjectClass(reader.selectedClass.value === c.value ? null : c.value)
              "
            >
              {{ c.label }}
            </button>
          </div>
        </div>

        <!-- Offline Indicator -->
        <div v-if="!reader.isOnline.value" class="mobile-docs__offline-bar">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M7 12a5 5 0 10-5-5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <span>Offline Mode</span>
        </div>

        <!-- Card List -->
        <div
          class="mobile-docs__cards"
          @touchstart.passive="onCardsTouchStart"
          @touchmove.passive="onCardsTouchMove"
          @touchend="onCardsTouchEnd"
        >
          <!-- Pull-to-refresh indicator -->
          <div
            v-if="pullDistance > 0"
            class="mobile-docs__pull-indicator"
            :style="{ height: `${Math.min(pullDistance, 60)}px` }"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              :style="{ transform: `rotate(${pullDistance * 3}deg)` }"
            >
              <path
                d="M10 4v12M4 10l6 6 6-6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Loading -->
          <div v-if="reader.loading.value" class="mobile-docs__cards-loading">
            <div class="mobile-docs__loading-dot" />
            <div class="mobile-docs__loading-dot" />
            <div class="mobile-docs__loading-dot" />
          </div>

          <!-- Error -->
          <div
            v-else-if="reader.error.value"
            class="mobile-docs__cards-empty mobile-docs__cards-error"
          >
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
            <button class="mobile-docs__retry-btn" @click="reader.fetchArticles(1)">Retry</button>
          </div>

          <!-- Empty -->
          <div
            v-else-if="reader.filteredArticles.value.length === 0"
            class="mobile-docs__cards-empty"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect
                x="8"
                y="4"
                width="32"
                height="40"
                rx="4"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M16 18h16M16 24h12M16 30h8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <p>No articles found</p>
          </div>

          <!-- Cards -->
          <template v-else>
            <div class="mobile-docs__card mobile-docs__card--guide" @click="openGuide">
              <div class="mobile-docs__card-header">
                <span class="mobile-docs__card-number mobile-docs__card-number--guide">📖</span>
                <span
                  class="mobile-docs__card-class"
                  style="background: rgba(88, 166, 255, 0.15); color: #58a6ff"
                  >使用指南</span
                >
              </div>
              <div class="mobile-docs__card-title">{{ reader.GUIDE_ARTICLE.title }}</div>
            </div>
            <div
              v-for="article in reader.filteredArticles.value"
              :key="article.scpNumber"
              class="mobile-docs__card"
              @click="openArticle(article.scpNumber)"
            >
              <div class="mobile-docs__card-header">
                <span class="mobile-docs__card-number">{{ article.scpNumber }}</span>
                <span
                  class="mobile-docs__card-class"
                  :style="{
                    background: reader.OBJECT_CLASS_COLORS[article.objectClass] + '20',
                    color: reader.OBJECT_CLASS_COLORS[article.objectClass],
                  }"
                  >{{ article.objectClass }}</span
                >
              </div>
              <div class="mobile-docs__card-title">{{ article.title }}</div>
              <div v-if="article.rating" class="mobile-docs__card-rating">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1l1.5 3.5L11 5l-2.5 2.5L9 11l-3-1.5L3 11l.5-3.5L1 5l3.5-.5z"
                    fill="currentColor"
                  />
                </svg>
                {{ article.rating }}
              </div>
            </div>

            <!-- Load More -->
            <div v-if="reader.loadingMore.value" class="mobile-docs__cards-loading">
              <div class="mobile-docs__loading-dot" />
              <div class="mobile-docs__loading-dot" />
              <div class="mobile-docs__loading-dot" />
            </div>
            <div
              v-else-if="reader.hasMore.value"
              class="mobile-docs__load-more"
              @click="reader.loadMore()"
            >
              Load more
            </div>
          </template>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DETAIL VIEW                                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div
        v-else
        class="mobile-docs__detail-view"
        @touchstart.passive="onDetailTouchStart"
        @touchmove.passive="onDetailTouchMove"
        @touchend="onDetailTouchEnd"
      >
        <!-- Offline indicator in detail view -->
        <div v-if="!reader.isOnline.value" class="mobile-docs__detail-offline">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1l10 10M6 10a4 4 0 10-4-4"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          Offline
        </div>

        <!-- Content -->
        <div
          ref="detailContentRef"
          class="mobile-docs__detail-content"
          :style="{ fontSize: `${reader.fontSize.value}px` }"
        >
          <!-- Loading -->
          <div v-if="reader.loadingDetail.value" class="mobile-docs__detail-loading">
            <div class="mobile-docs__loading-dot" />
            <div class="mobile-docs__loading-dot" />
            <div class="mobile-docs__loading-dot" />
          </div>

          <!-- Error -->
          <div v-else-if="reader.error.value" class="mobile-docs__detail-error">
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
              class="mobile-docs__retry-btn"
              @click="reader.selectArticle(reader.currentArticle.value!.scpNumber)"
            >
              Retry
            </button>
          </div>

          <!-- Article Content -->
          <div
            v-else-if="reader.currentArticle.value"
            class="mobile-docs__article"
            v-html="sanitizedContent"
          />
        </div>

        <!-- Bottom Navigation Bar -->
        <div class="mobile-docs__bottom-bar">
          <button class="mobile-docs__bottom-btn" @click="showMobileTOC = true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h10M3 15h12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <span>TOC</span>
          </button>
          <button class="mobile-docs__bottom-btn" @click="showFontSettings = !showFontSettings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4l3 12M13 4l-3 12M6 9h6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Font</span>
          </button>
          <button class="mobile-docs__bottom-btn" @click="scrollToTop">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 16V4M4 10l6-6 6 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Top</span>
          </button>
        </div>

        <!-- Font Settings Panel -->
        <Transition name="mobile-slide-up">
          <div v-if="showFontSettings" class="mobile-docs__font-panel">
            <div class="mobile-docs__font-panel-header">
              <span>Reading Settings</span>
              <button class="mobile-docs__font-panel-close" @click="showFontSettings = false">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <div class="mobile-docs__font-panel-body">
              <div class="mobile-docs__font-row">
                <span class="mobile-docs__font-label">Font Size</span>
                <div class="mobile-docs__font-controls">
                  <button class="mobile-docs__font-btn" @click="reader.decreaseFontSize()">
                    A-
                  </button>
                  <span class="mobile-docs__font-value">{{ reader.fontSize.value }}px</span>
                  <button
                    class="mobile-docs__font-btn mobile-docs__font-btn--large"
                    @click="reader.increaseFontSize()"
                  >
                    A+
                  </button>
                </div>
              </div>
              <div class="mobile-docs__font-row">
                <span class="mobile-docs__font-label">Theme</span>
                <div class="mobile-docs__theme-toggle">
                  <!-- prettier-ignore -->
                  <button
                    class="mobile-docs__theme-btn"
                    :class="{
                      'mobile-docs__theme-btn--active': reader.readerTheme.value === 'dark',
                    }"
                    @click="reader.readerTheme.value = 'dark'; reader.toggleTheme()"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M14 9.3A6.5 6.5 0 016.7 2 6.5 6.5 0 108 14.5a6.47 6.47 0 006-5.2z"
                        stroke="currentColor"
                        stroke-width="1.3"
                      />
                    </svg>
                    Dark
                  </button>
                  <!-- prettier-ignore -->
                  <button
                    class="mobile-docs__theme-btn"
                    :class="{
                      'mobile-docs__theme-btn--active': reader.readerTheme.value === 'light',
                    }"
                    @click="reader.readerTheme.value = 'light'; reader.toggleTheme()"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.3" />
                      <path
                        d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"
                        stroke="currentColor"
                        stroke-width="1.1"
                        stroke-linecap="round"
                      />
                    </svg>
                    Light
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- TOC Panel -->
        <Transition name="mobile-slide-up">
          <div v-if="showMobileTOC" class="mobile-docs__toc-panel">
            <div class="mobile-docs__toc-panel-header">
              <span>Table of Contents</span>
              <button class="mobile-docs__toc-panel-close" @click="showMobileTOC = false">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <div class="mobile-docs__toc-panel-list">
              <button
                v-for="item in reader.currentArticle.value?.toc || []"
                :key="item.id"
                class="mobile-docs__toc-item"
                :style="{ paddingLeft: `${16 + (item.level - 1) * 16}px` }"
                @click="onTOCItemClick(item)"
              >
                {{ item.text }}
              </button>
              <div v-if="!reader.currentArticle.value?.toc.length" class="mobile-docs__toc-empty">
                No headings found
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import DOMPurify from 'dompurify'
import MobileWindow from '../../components/MobileWindow.vue'
import { useDocsReader, type TOCItem } from '../../composables/useDocsReader'
import { applyImageProxyHook } from '../../../utils/imageProxy'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const reader = useDocsReader()

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

const view = ref<'list' | 'detail'>('list')
const detailContentRef = ref<HTMLElement>()
const showFontSettings = ref(false)
const showMobileTOC = ref(false)

// ── Pull-to-Refresh ──────────────────────────────────────────────────

const pullDistance = ref(0)
let pullStartY = 0
let isPulling = false

function onCardsTouchStart(e: TouchEvent): void {
  const touch = e.touches[0]
  if (!touch) return
  pullStartY = touch.clientY
  isPulling = true
}

function onCardsTouchMove(e: TouchEvent): void {
  if (!isPulling) return
  const touch = e.touches[0]
  if (!touch) return
  const deltaY = touch.clientY - pullStartY
  if (deltaY > 0) {
    pullDistance.value = deltaY * 0.5
  }
}

function onCardsTouchEnd(): void {
  if (pullDistance.value > 60) {
    reader.search()
  }
  pullDistance.value = 0
  isPulling = false
}

// ── Swipe Back Gesture ───────────────────────────────────────────────

let swipeStartX = 0
let swipeStartY = 0

function onDetailTouchStart(e: TouchEvent): void {
  const touch = e.touches[0]
  if (!touch) return
  swipeStartX = touch.clientX
  swipeStartY = touch.clientY
}

function onDetailTouchMove(): void {
  // Handled passively
}

function onDetailTouchEnd(e: TouchEvent): void {
  const touch = e.changedTouches[0]
  if (!touch) return
  const deltaX = touch.clientX - swipeStartX
  const deltaY = Math.abs(touch.clientY - swipeStartY)

  // Left swipe (deltaX < -50) with minimal vertical movement
  if (deltaX < -50 && deltaY < 80) {
    onBack()
  }
}

// ── Navigation ───────────────────────────────────────────────────────

async function openArticle(scpNumber: string): Promise<void> {
  await reader.selectArticle(scpNumber)
  view.value = 'detail'
}

async function openGuide(): Promise<void> {
  await reader.selectGuide()
  view.value = 'detail'
}

function onBack(): void {
  reader.saveProgress(detailContentRef.value?.scrollTop ?? 0)
  reader.clearArticle()
  view.value = 'list'
  showFontSettings.value = false
  showMobileTOC.value = false
}

function clearFilters(): void {
  reader.setSeries(null)
  reader.setObjectClass(null)
}

function scrollToTop(): void {
  detailContentRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function onTOCItemClick(item: TOCItem): void {
  reader.scrollToTOCItem(item)
  showMobileTOC.value = false
}

// ── Progress Auto-Save ───────────────────────────────────────────────

function getDetailScrollPosition(): number {
  return detailContentRef.value?.scrollTop ?? 0
}

// ── Scroll Restoration ───────────────────────────────────────────────

watch(
  () => reader.currentArticle.value,
  (article) => {
    if (article && detailContentRef.value) {
      const scrollPos = (article as any)._scrollPosition as number | undefined
      if (scrollPos) {
        nextTick(() => {
          detailContentRef.value?.scrollTo({ top: scrollPos })
        })
      }
    }
  }
)

// ── Lifecycle ────────────────────────────────────────────────────────

onMounted(() => {
  reader.startProgressAutoSave(getDetailScrollPosition)
})

onBeforeUnmount(() => {
  reader.stopProgressAutoSave()
  reader.saveProgress(getDetailScrollPosition())
})
</script>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────────────── */
.mobile-docs {
  --docs-bg: #0e0e0e;
  --docs-surface: #1a1a1c;
  --docs-surface-hover: #2c2c2e;
  --docs-border: rgba(255, 255, 255, 0.06);
  --docs-text-primary: #f0f0f0;
  --docs-text-secondary: #a8a8a8;
  --docs-text-tertiary: #6a6a6a;
  --docs-accent: #8e8e93;
  --docs-content-bg: #111113;
  --docs-content-text: #e0e0e0;
  --docs-card-bg: #1c1c1e;
  --docs-card-shadow: rgba(0, 0, 0, 0.3);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--docs-bg);
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  position: relative;
}

/* Light theme overrides */
.mobile-docs--light {
  --docs-bg: #f5f5f7;
  --docs-surface: #ffffff;
  --docs-surface-hover: #e8e8ed;
  --docs-border: rgba(0, 0, 0, 0.08);
  --docs-text-primary: #1d1d1f;
  --docs-text-secondary: #6e6e73;
  --docs-text-tertiary: #86868b;
  --docs-accent: #007aff;
  --docs-content-bg: #ffffff;
  --docs-content-text: #1d1d1f;
  --docs-card-bg: #ffffff;
  --docs-card-shadow: rgba(0, 0, 0, 0.08);
}

/* ══════════════════════════════════════════════════════════════════════ */
/* LIST VIEW                                                           */
/* ══════════════════════════════════════════════════════════════════════ */

.mobile-docs__list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── Search Bar ─────────────────────────────────────────────────────── */
.mobile-docs__search-bar {
  position: relative;
  padding: 8px 12px;
  background: var(--docs-surface);
  border-bottom: 0.5px solid var(--docs-border);
}

.mobile-docs__search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--docs-text-tertiary);
  pointer-events: none;
}

.mobile-docs__search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border-radius: 10px;
  border: none;
  background: var(--docs-bg);
  color: var(--docs-text-primary);
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.mobile-docs__search-input::placeholder {
  color: var(--docs-text-tertiary);
}

/* ── Filter Tags ────────────────────────────────────────────────────── */
.mobile-docs__filter-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: var(--docs-surface);
  border-bottom: 0.5px solid var(--docs-border);
}

.mobile-docs__filter-scroll::-webkit-scrollbar {
  display: none;
}

.mobile-docs__filter-tags {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  white-space: nowrap;
}

.mobile-docs__filter-tag {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid var(--docs-border);
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.mobile-docs__filter-tag:active {
  transform: scale(0.95);
}

.mobile-docs__filter-tag--active {
  background: var(--docs-accent);
  color: var(--gui-text-primary, #ffffff);
  border-color: var(--docs-accent);
}

.mobile-docs__filter-tag--class {
  font-weight: 600;
}

/* ── Offline Bar ────────────────────────────────────────────────────── */
.mobile-docs__offline-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
  font-size: 12px;
  font-weight: 500;
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.mobile-docs__cards {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--docs-border) transparent;
}

.mobile-docs__pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--docs-text-tertiary);
  overflow: hidden;
  transition: height 0.2s ease;
}

.mobile-docs__card {
  background: var(--docs-card-bg);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px var(--docs-card-shadow);
  cursor: pointer;
  transition: transform 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.mobile-docs__card:active {
  transform: scale(0.98);
}

.mobile-docs__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mobile-docs__card-number {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  font-size: 13px;
  font-weight: 600;
  color: var(--docs-text-primary);
}

.mobile-docs__card-class {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.mobile-docs__card-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--docs-text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-docs__card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--docs-text-tertiary);
}

/* ── Loading / Empty ────────────────────────────────────────────────── */
.mobile-docs__cards-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 32px 0;
}

.mobile-docs__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--docs-accent);
  animation: docs-bounce 1.2s ease-in-out infinite;
}

.mobile-docs__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.mobile-docs__loading-dot:nth-child(3) {
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

.mobile-docs__cards-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  color: var(--docs-text-tertiary);
  gap: 12px;
}

.mobile-docs__cards-empty p {
  font-size: 15px;
  margin: 0;
}

.mobile-docs__cards-error {
  color: var(--gui-error, #ff3b30);
}

.mobile-docs__cards-error p {
  font-size: 14px;
  margin: 0;
  max-width: 280px;
  text-align: center;
  word-break: break-word;
}

.mobile-docs__load-more {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: var(--docs-accent);
  cursor: pointer;
}

/* ══════════════════════════════════════════════════════════════════════ */
/* DETAIL VIEW                                                         */
/* ══════════════════════════════════════════════════════════════════════ */

.mobile-docs__detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.mobile-docs__detail-offline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 149, 0, 0.12);
  color: #ff9500;
  font-size: 11px;
  font-weight: 500;
}

/* ── Detail Content ─────────────────────────────────────────────────── */
.mobile-docs__detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--docs-content-bg);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--docs-border) transparent;
  line-height: 1.8;
  color: var(--docs-content-text);
}

.mobile-docs__detail-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 64px 0;
}

.mobile-docs__detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  color: var(--docs-text-tertiary);
  gap: 12px;
}

.mobile-docs__detail-error p {
  font-size: 14px;
  margin: 0;
}

.mobile-docs__retry-btn {
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid var(--docs-accent);
  background: transparent;
  color: var(--docs-accent);
  font-size: 15px;
  cursor: pointer;
  min-height: 44px;
}

/* ── Article Content Styles ─────────────────────────────────────────── */
.mobile-docs__article {
  word-wrap: break-word;
}

.mobile-docs__article :deep(h1) {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0 0 0.5em;
  color: var(--docs-text-primary);
  border-bottom: 1px solid var(--docs-border);
  padding-bottom: 0.3em;
}

.mobile-docs__article :deep(h2) {
  font-size: 1.3em;
  font-weight: 600;
  margin: 1em 0 0.4em;
  color: var(--docs-text-primary);
}

.mobile-docs__article :deep(h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0.8em 0 0.3em;
  color: var(--docs-text-primary);
}

.mobile-docs__article :deep(p) {
  margin: 0 0 0.8em;
  line-height: 1.8;
}

.mobile-docs__article :deep(blockquote) {
  margin: 0.8em 0;
  padding: 10px 16px;
  border-left: 3px solid var(--docs-accent);
  background: var(--docs-surface);
  border-radius: 0 8px 8px 0;
  color: var(--docs-text-secondary);
}

.mobile-docs__article :deep(code) {
  font-family: var(--gui-font-mono, 'JetBrains Mono', monospace);
  font-size: 0.88em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--docs-surface);
}

.mobile-docs__article :deep(pre) {
  margin: 0.8em 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--docs-surface);
  overflow-x: auto;
}

.mobile-docs__article :deep(pre code) {
  padding: 0;
  background: transparent;
}

.mobile-docs__article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8em 0;
  font-size: 0.9em;
}

.mobile-docs__article :deep(th),
.mobile-docs__article :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--docs-border);
  text-align: left;
}

.mobile-docs__article :deep(th) {
  background: var(--docs-surface);
  font-weight: 600;
}

.mobile-docs__article :deep(a) {
  color: var(--docs-accent);
  text-decoration: none;
}

.mobile-docs__article :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 0.8em 0;
}

.mobile-docs__article :deep(hr) {
  border: none;
  border-top: 1px solid var(--docs-border);
  margin: 1.5em 0;
}

.mobile-docs__article :deep(ul),
.mobile-docs__article :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0 0.8em;
}

/* ── Bottom Navigation Bar ──────────────────────────────────────────── */
.mobile-docs__bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 16px;
  background: var(--docs-surface);
  border-top: 0.5px solid var(--docs-border);
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.mobile-docs__bottom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 11px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.mobile-docs__bottom-btn:active {
  background: var(--docs-surface-hover);
  transform: scale(0.95);
}

/* ── Font Settings Panel ────────────────────────────────────────────── */
.mobile-docs__font-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--docs-surface);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.mobile-docs__font-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--docs-text-primary);
}

.mobile-docs__font-panel-close {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: var(--docs-surface-hover);
  color: var(--docs-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-docs__font-panel-body {
  padding: 0 20px 16px;
}

.mobile-docs__font-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--docs-border);
}

.mobile-docs__font-label {
  font-size: 15px;
  color: var(--docs-text-primary);
}

.mobile-docs__font-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-docs__font-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--docs-border);
  background: var(--docs-bg);
  color: var(--docs-text-primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
}

.mobile-docs__font-btn--large {
  font-size: 16px;
}

.mobile-docs__font-value {
  font-size: 14px;
  color: var(--docs-text-secondary);
  min-width: 40px;
  text-align: center;
  font-family: var(--gui-font-mono, monospace);
}

.mobile-docs__theme-toggle {
  display: flex;
  gap: 8px;
}

.mobile-docs__theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--docs-border);
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s;
}

.mobile-docs__theme-btn--active {
  background: var(--docs-accent);
  color: var(--gui-text-primary, #ffffff);
  border-color: var(--docs-accent);
}

/* ── TOC Panel ──────────────────────────────────────────────────────── */
.mobile-docs__toc-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 60%;
  background: var(--docs-surface);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.mobile-docs__toc-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--docs-text-primary);
  border-bottom: 0.5px solid var(--docs-border);
}

.mobile-docs__toc-panel-close {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: var(--docs-surface-hover);
  color: var(--docs-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-docs__toc-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  -webkit-overflow-scrolling: touch;
}

.mobile-docs__toc-item {
  display: block;
  width: 100%;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: var(--docs-text-secondary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  line-height: 1.4;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.mobile-docs__toc-item:active {
  background: var(--docs-surface-hover);
}

.mobile-docs__toc-empty {
  padding: 24px;
  text-align: center;
  color: var(--docs-text-tertiary);
  font-size: 14px;
}

/* ── Transitions ────────────────────────────────────────────────────── */
.mobile-slide-up-enter-active,
.mobile-slide-up-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease;
}

.mobile-slide-up-enter-from,
.mobile-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.mobile-docs__card--guide {
  background: rgba(56, 139, 253, 0.06);
  border: 1px solid rgba(56, 139, 253, 0.15);
}
.mobile-docs__card--guide:active {
  background: var(--gui-accent-soft);
  border-color: rgba(56, 139, 253, 0.3);
}
.mobile-docs__card-number--guide {
  font-size: 16px;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .mobile-docs__card {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.light .mobile-docs__card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.light .mobile-docs__search-bar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.light .mobile-docs__filter-chips {
  box-shadow: none;
}
</style>

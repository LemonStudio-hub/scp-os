<template>
  <div class="admin-pagination">
    <span class="admin-pagination__total">共 {{ totalItems }} 条</span>
    <div class="admin-pagination__controls">
      <button
        class="admin-pagination__btn"
        :disabled="currentPage <= 1"
        @click="onPageChange(currentPage - 1)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M9 3L5 7L9 11"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <template v-for="page in displayPages" :key="page">
        <span v-if="page === '...'" class="admin-pagination__ellipsis">...</span>
        <button
          v-else
          class="admin-pagination__btn"
          :class="{ 'admin-pagination__btn--active': page === currentPage }"
          @click="onPageChange(page as number)"
        >
          {{ page }}
        </button>
      </template>
      <button
        class="admin-pagination__btn"
        :disabled="currentPage >= totalPages"
        @click="onPageChange(currentPage + 1)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5 3L9 7L5 11"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const displayPages = computed(() => {
  const pages: (number | string)[] = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
})

function onPageChange(page: number) {
  if (page < 1 || page > props.totalPages) return
  emit('pageChange', page)
}
</script>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  font-size: 13px;
}

.admin-pagination__total {
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: 12px;
  white-space: nowrap;
}

.admin-pagination__controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.admin-pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--gui-text-secondary, #a0a0a0);
  font-size: 13px;
  cursor: pointer;
  transition: all 120ms ease;
}

.admin-pagination__btn:hover:not(:disabled):not(.admin-pagination__btn--active) {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #e0e0e0);
}

.admin-pagination__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.admin-pagination__btn--active {
  background: rgba(233, 69, 96, 0.15);
  color: var(--gui-error, #e94560);
  border-color: rgba(233, 69, 96, 0.2);
  font-weight: 500;
}

.admin-pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--gui-text-tertiary, #6a6a6a);
  font-size: 13px;
  user-select: none;
}
</style>

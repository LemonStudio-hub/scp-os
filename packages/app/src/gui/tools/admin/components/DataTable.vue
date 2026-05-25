<!-- eslint-disable @typescript-eslint/no-explicit-any -->

<template>
  <div class="admin-table-wrapper">
    <div class="admin-table-scroll">
      <table class="admin-table">
        <thead>
          <tr>
            <th v-if="selectable" class="admin-table__th admin-table__th--checkbox">
              <label class="admin-table__checkbox">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="onSelectAll"
                />
                <span class="admin-table__checkmark" />
              </label>
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              class="admin-table__th"
              :style="col.width ? { width: col.width } : undefined"
              @click="col.sortable ? onSort(col.key) : undefined"
            >
              <div
                class="admin-table__th-content"
                :class="{ 'admin-table__th--sortable': col.sortable }"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="admin-table__sort-icon">
                  <svg
                    v-if="sortColumn === col.key && sortDirection === 'asc'"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M6 3L9 7H3L6 3Z" fill="currentColor" />
                  </svg>
                  <svg
                    v-else-if="sortColumn === col.key && sortDirection === 'desc'"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M6 9L3 5H9L6 9Z" fill="currentColor" />
                  </svg>
                  <svg
                    v-else
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    class="admin-table__sort-inactive"
                  >
                    <path d="M6 2L9 6H3L6 2Z" fill="currentColor" opacity="0.3" />
                    <path d="M6 10L3 6H9L6 10Z" fill="currentColor" opacity="0.3" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="i in 5" :key="`skeleton-${i}`" class="admin-table__row">
            <td v-if="selectable" class="admin-table__td admin-table__td--checkbox">
              <div class="admin-table__skeleton admin-table__skeleton--checkbox" />
            </td>
            <td v-for="col in columns" :key="col.key" class="admin-table__td">
              <div class="admin-table__skeleton" />
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="data.length === 0">
          <tr>
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="admin-table__empty">
              <div class="admin-table__empty-content">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 8V32M8 20H32"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    opacity="0.3"
                  />
                  <rect
                    x="4"
                    y="4"
                    width="32"
                    height="32"
                    rx="6"
                    stroke="currentColor"
                    stroke-width="1.5"
                    opacity="0.2"
                  />
                </svg>
                <span>{{ t('admin.table.empty') }}</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr
            v-for="(row, index) in data"
            :key="row.id ?? index"
            class="admin-table__row"
            :class="{
              'admin-table__row--selected': selectedIds.includes(row.id),
              'admin-table__row--striped': index % 2 === 1,
            }"
            @click="$emit('rowClick', row)"
          >
            <td v-if="selectable" class="admin-table__td admin-table__td--checkbox" @click.stop>
              <label class="admin-table__checkbox">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.id)"
                  @change="onSelectRow(row.id)"
                />
                <span class="admin-table__checkmark" />
              </label>
            </td>
            <td v-for="col in columns" :key="col.key" class="admin-table__td">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from 'vue'
import { useI18n } from '../../../composables/useI18n'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

interface Props {
  columns: TableColumn[]
  data: Record<string, any>[]
  loading?: boolean
  selectedIds?: number[]
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedIds: () => [],
  selectable: true,
})

const { t } = useI18n()

const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc']
  select: [ids: number[]]
  rowClick: [row: Record<string, any>]
}>()

const sortColumn = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')

const allSelected = computed(
  () => props.data.length > 0 && props.data.every((row) => props.selectedIds.includes(row.id))
)

const someSelected = computed(
  () => !allSelected.value && props.data.some((row) => props.selectedIds.includes(row.id))
)

function onSort(key: string) {
  if (sortColumn.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = key
    sortDirection.value = 'asc'
  }
  emit('sort', key, sortDirection.value)
}

function onSelectAll() {
  if (allSelected.value) {
    emit('select', [])
  } else {
    emit(
      'select',
      props.data.map((row) => row.id)
    )
  }
}

function onSelectRow(id: number) {
  const newIds = [...props.selectedIds]
  const index = newIds.indexOf(id)
  if (index > -1) {
    newIds.splice(index, 1)
  } else {
    newIds.push(id)
  }
  emit('select', newIds)
}
</script>

<style scoped>
.admin-table-wrapper {
  width: 100%;
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  overflow: hidden;
  background: var(--gui-bg-surface, #0f0f0f);
}

.admin-table-scroll {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

.admin-table__th {
  padding: 10px 16px;
  text-align: left;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gui-text-tertiary, #6a6a6a);
  background: var(--gui-bg-surface, #141414);
  border-bottom: 1px solid var(--gui-border-default, #2a2a2a);
  user-select: none;
}

.admin-table__th--checkbox {
  width: 44px;
  padding: 10px 12px;
}

.admin-table__th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.admin-table__th--sortable {
  cursor: pointer;
}

.admin-table__th--sortable:hover {
  color: var(--gui-text-primary, #e0e0e0);
}

.admin-table__sort-icon {
  display: flex;
  align-items: center;
  color: var(--gui-error, #e94560);
}

.admin-table__sort-inactive {
  color: var(--gui-text-tertiary, #6a6a6a);
}

.admin-table__row {
  transition: background 100ms ease;
}

.admin-table__row--striped {
  background: rgba(255, 255, 255, 0.015);
}

.admin-table__row:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.04));
}

.admin-table__row--selected {
  background: rgba(233, 69, 96, 0.06);
}

.admin-table__row--selected:hover {
  background: rgba(233, 69, 96, 0.1);
}

.admin-table__row {
  cursor: pointer;
}

.admin-table__td {
  padding: 10px 16px;
  color: var(--gui-text-primary, #e0e0e0);
  border-bottom: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
}

.admin-table__td--checkbox {
  width: 44px;
  padding: 10px 12px;
}

.admin-table__checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.admin-table__checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.admin-table__checkmark {
  width: 16px;
  height: 16px;
  border: 1.5px solid #4a4a4a;
  border-radius: 4px;
  background: transparent;
  transition: all 120ms ease;
  position: relative;
}

.admin-table__checkbox input:checked + .admin-table__checkmark {
  background: #e94560;
  border-color: var(--gui-error, #e94560);
}

.admin-table__checkbox input:checked + .admin-table__checkmark::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.admin-table__checkbox input:indeterminate + .admin-table__checkmark {
  background: #e94560;
  border-color: var(--gui-error, #e94560);
}

.admin-table__checkbox input:indeterminate + .admin-table__checkmark::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 3px;
  width: 8px;
  height: 1.5px;
  background: white;
  border-radius: 1px;
}

.admin-table__skeleton {
  height: 14px;
  background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: admin-skeleton-shimmer 1.5s ease-in-out infinite;
  width: 80%;
}

.admin-table__skeleton--checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

@keyframes admin-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.admin-table__empty {
  padding: 48px 16px;
  text-align: center;
}

.admin-table__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--gui-text-disabled, #4a4a4a);
  font-size: 13px;
}
</style>

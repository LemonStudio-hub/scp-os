<template>
  <header class="mobile-nav-bar" :class="{ 'mobile-nav-bar--no-border': !border }">
    <div class="mobile-nav-bar__left">
      <slot name="left">
        <button v-if="showBack" class="mobile-nav-bar__btn" @click="$emit('back')">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L7 11L14 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-if="backLabel" class="mobile-nav-bar__btn-label">{{ backLabel }}</span>
        </button>
      </slot>
    </div>
    <div class="mobile-nav-bar__center">
      <slot />
    </div>
    <div class="mobile-nav-bar__right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  showBack?: boolean
  backLabel?: string
  border?: boolean
}

withDefaults(defineProps<Props>(), {
  showBack: false,
  backLabel: '',
  border: true,
})

defineEmits<{
  back: []
}>()
</script>

<style scoped>
/* ── iOS-style Navigation Bar ──────────────────────────────────────── */
.mobile-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--gui-spacing-sm, 8px);
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--gui-glass-bg, rgba(16, 16, 16, 0.75));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.mobile-nav-bar--no-border {
  border-bottom: none;
}

/* ── Left / Right Slots ─────────────────────────────────────────────── */
.mobile-nav-bar__left,
.mobile-nav-bar__right {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  min-width: 80px;
}

.mobile-nav-bar__left {
  justify-content: flex-start;
}

.mobile-nav-bar__right {
  justify-content: flex-end;
}

.mobile-nav-bar__center {
  flex: 1;
  text-align: center;
  overflow: hidden;
  min-width: 0;
}

/* ── Back Button ───────────────────────────────────────────────────── */
.mobile-nav-bar__btn {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xxs, 2px);
  background: none;
  border: none;
  color: var(--gui-accent, #e94560);
  cursor: pointer;
  padding: var(--gui-spacing-xs, 4px);
  margin-left: calc(-1 * var(--gui-spacing-sm, 8px));
  border-radius: var(--gui-radius-sm, 6px);
  transition: opacity var(--gui-transition-fast, 120ms ease);
  -webkit-tap-highlight-color: transparent;
}

.mobile-nav-bar__btn:active {
  opacity: 0.5;
}

.mobile-nav-bar__btn-label {
  font-family: var(--gui-font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--gui-font-base, 13px);
}
</style>

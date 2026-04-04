<template>
  <MobileWindow
    :visible="visible"
    title="Settings"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="settings-app">
      <div class="settings-app__content gui-scrollable">
        <!-- Appearance -->
        <div class="settings-section">
          <div class="settings-section__label">Appearance</div>
          <div class="settings-section__content">
            <div class="settings-row">
              <span class="settings-row__label">Font Size</span>
              <div class="settings-row__control">
                <span class="settings-row__value">{{ terminalStore.fontSize }}px</span>
                <input
                  type="range"
                  min="10"
                  max="20"
                  :value="terminalStore.fontSize"
                  class="settings-slider"
                  @input="onFontSizeChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal -->
        <div class="settings-section">
          <div class="settings-section__label">Terminal</div>
          <div class="settings-section__content">
            <div class="settings-row">
              <span class="settings-row__label">Scrollback</span>
              <span class="settings-row__value">{{ config.terminal.scrollback }} lines</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">Cursor Blink</span>
              <span class="settings-row__value">Enabled</span>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <div class="settings-section__label">About</div>
          <div class="settings-section__content">
            <div class="settings-row">
              <span class="settings-row__label">Application</span>
              <span class="settings-row__value">SCP-OS</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">Version</span>
              <span class="settings-row__value">{{ config.app.version }}</span>
            </div>
            <div class="settings-row">
              <span class="settings-row__label">License</span>
              <span class="settings-row__value">MIT / CC BY-SA 3.0</span>
            </div>
          </div>
        </div>

        <div style="height: var(--gui-spacing-2xl, 32px);" />
      </div>
    </div>
  </MobileWindow>
</template>

<script setup lang="ts">
import MobileWindow from '../../components/MobileWindow.vue'
import { useTerminalStore } from '../../../stores/terminal'
import { config } from '../../../config'

interface Props {
  visible: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const terminalStore = useTerminalStore()

function onFontSizeChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const size = parseInt(target.value, 10)
  terminalStore.fontSize = size
}
</script>

<style scoped>
.settings-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
  font-family: var(--gui-font-sans);
}

.settings-app__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--gui-spacing-base, 16px);
}

/* ── Section ────────────────────────────────────────────────────────── */
.settings-section {
  margin-bottom: var(--gui-spacing-xl, 24px);
}

.settings-section__label {
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #a0a0a0);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--gui-spacing-sm, 8px);
  padding-left: var(--gui-spacing-md, 12px);
}

.settings-section__content {
  background: var(--gui-bg-surface, #0c0c0c);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-lg, 12px);
  overflow: hidden;
}

/* ── Row ────────────────────────────────────────────────────────────── */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gui-spacing-md, 12px) var(--gui-spacing-base, 16px);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  gap: var(--gui-spacing-md, 12px);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row__label {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-primary, #f0f0f0);
  flex: 1;
  min-width: 0;
}

.settings-row__value {
  font-size: var(--gui-font-base, 13px);
  color: var(--gui-text-secondary, #a0a0a0);
  white-space: nowrap;
}

.settings-row__control {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-sm, 8px);
}

/* ── Slider ─────────────────────────────────────────────────────────── */
.settings-slider {
  -webkit-appearance: none;
  appearance: none;
  width: var(--gui-spacing-2xl, 32px);
  width: 100px;
  height: var(--gui-dim-slider-track-height, 4px);
  background: var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: var(--gui-radius-xs, 4px);
  outline: none;
}

.settings-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--gui-dim-slider-thumb-size, 20px);
  height: var(--gui-dim-slider-thumb-size, 20px);
  background: var(--gui-accent, #e94560);
  border-radius: var(--gui-radius-full, 9999px);
  cursor: pointer;
  box-shadow: var(--gui-shadow-glow, 0 0 20px rgba(233, 69, 96, 0.15));
}
</style>

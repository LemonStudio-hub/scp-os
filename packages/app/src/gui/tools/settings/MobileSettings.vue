<template>
  <MobileWindow
    :visible="visible"
    title="Settings"
    :show-back="true"
    @close="$emit('close')"
  >
    <div class="settings-app">
      <div class="settings-app__content gui-scrollable">
        <!-- Appearance Section -->
        <div class="settings-group">
          <div class="settings-group__label">Appearance</div>
          <div class="settings-group__content">
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">Font Size</span>
              </div>
              <div class="settings-row__right">
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

        <!-- Terminal Section -->
        <div class="settings-group">
          <div class="settings-group__label">Terminal</div>
          <div class="settings-group__content">
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">Scrollback Lines</span>
              </div>
              <div class="settings-row__right">
                <span class="settings-row__value">{{ config.terminal.scrollback }}</span>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">Cursor Blink</span>
              </div>
              <div class="settings-row__right">
                <span class="settings-row__value">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="settings-group">
          <div class="settings-group__label">About</div>
          <div class="settings-group__content">
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">Application</span>
              </div>
              <div class="settings-row__right">
                <span class="settings-row__value">SCP-OS</span>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">Version</span>
              </div>
              <div class="settings-row__right">
                <span class="settings-row__value">{{ config.app.version }}</span>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-row__left">
                <span class="settings-row__label">License</span>
              </div>
              <div class="settings-row__right">
                <span class="settings-row__value">MIT / CC BY-SA 3.0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Spacer for bottom padding -->
        <div style="height: 32px;" />
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
/* ── Settings App ──────────────────────────────────────────────────── */
.settings-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gui-bg-base, #060606);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
}

.settings-app__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

/* ── Settings Group ────────────────────────────────────────────────── */
.settings-group {
  margin-bottom: 24px;
}

.settings-group__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-secondary, #a8a8a8);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  padding-left: 16px;
}

.settings-group__content {
  background: var(--gui-bg-surface, #0c0c0c);
  border: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 12px;
  overflow: hidden;
}

/* ── Settings Row ──────────────────────────────────────────────────── */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row__left {
  flex: 1;
  min-width: 0;
}

.settings-row__label {
  font-size: 15px;
  color: var(--gui-text-primary, #f0f0f0);
}

.settings-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-row__value {
  font-size: 15px;
  color: var(--gui-text-secondary, #a8a8a8);
}

/* ── Slider ────────────────────────────────────────────────────────── */
.settings-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  background: var(--gui-border-default, rgba(255, 255, 255, 0.1));
  border-radius: 2px;
  outline: none;
}

.settings-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--gui-accent, #e94560);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(233, 69, 96, 0.3);
}
</style>

<template>
  <div class="dashboard-header">
    <div class="header-left">
      <div class="dashboard-title">
        <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
        <h2>Performance Monitor</h2>
      </div>
      <span class="version">{{ version }}</span>
    </div>
    
    <div class="header-right">
      <div class="monitoring-status" :class="{ active: isMonitoring }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isMonitoring ? 'Monitoring' : 'Stopped' }}</span>
      </div>
      
      <button 
        class="btn-control" 
        @click="$emit('toggleMonitoring')"
        :title="isMonitoring ? 'Stop monitoring' : 'Start monitoring'"
        aria-label="Toggle monitoring"
      >
        {{ isMonitoring ? '⏹' : '▶' }}
      </button>
      
      <button 
        class="btn-control" 
        @click="$emit('refresh')"
        title="Refresh data"
        aria-label="Refresh data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
      
      <button 
        class="btn-close" 
        @click="$emit('close')"
        aria-label="Close dashboard"
      >
        X
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isMonitoring: boolean
  version: string
}>()

defineEmits<{
  toggleMonitoring: []
  refresh: []
  close: []
}>()
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--gui-bg-surface, #2C2C2E);
  border-bottom: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-title .icon {
  display: flex;
  align-items: center;
  color: var(--gui-accent, #8E8E93);
}

.dashboard-title h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--gui-text-primary, #FFFFFF);
  letter-spacing: -0.01em;
}

.version {
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-text-tertiary, #636366);
  background: var(--gui-bg-surface-raised, #3A3A3C);
  padding: 3px 8px;
  border-radius: var(--gui-radius-sm, 6px);
  letter-spacing: 0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.monitoring-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  border-radius: var(--gui-radius-md, 10px);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  transition: all 200ms ease;
}

.monitoring-status.active {
  background: var(--gui-success-bg, rgba(52, 199, 89, 0.1));
  border-color: rgba(52, 199, 89, 0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gui-text-tertiary, #636366);
  transition: all 200ms ease;
}

.monitoring-status.active .status-dot {
  background: var(--gui-success, #34C759);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

.status-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8E8E93);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  transition: color 200ms ease;
}

.monitoring-status.active .status-text {
  color: var(--gui-success, #34C759);
}

/* ── Control Buttons ─────────────────────────────────────────────── */
.btn-control {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-text-secondary, #8E8E93);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-md, 10px);
  cursor: pointer;
  font-size: 14px;
  transition: all 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  -webkit-tap-highlight-color: transparent;
}

.btn-control:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  color: var(--gui-text-primary, #FFFFFF);
}

.btn-control:active {
  transform: scale(0.9);
}

.btn-close {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-surface-raised, #3A3A3C);
  color: var(--gui-text-secondary, #8E8E93);
  border: 0.5px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--gui-radius-md, 10px);
  cursor: pointer;
  font-size: 16px;
  font-weight: 400;
  transition: all 100ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
  -webkit-tap-highlight-color: transparent;
}

.btn-close:hover {
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.12));
  color: var(--gui-error, #FF3B30);
}

.btn-close:active {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 14px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .header-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .dashboard-title h2 {
    font-size: 15px;
  }

  .version {
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
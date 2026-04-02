<template>
  <div class="dashboard-header">
    <div class="header-left">
      <div class="dashboard-title">
        <span class="icon">📊</span>
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
        🔄
      </button>
      
      <button 
        class="btn-close" 
        @click="$emit('close')"
        aria-label="Close dashboard"
      >
        ✕
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
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.08) 0%, rgba(255, 0, 0, 0.02) 100%);
  border-bottom: 1px solid rgba(255, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-title .icon {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.3));
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.dashboard-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.version {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.monitoring-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.monitoring-status.active {
  background: rgba(0, 255, 0, 0.08);
  border-color: rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  transition: all 0.3s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.monitoring-status.active .status-dot {
  background: #00ff00;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.btn-control {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-control::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-control:hover::before {
  width: 100%;
  height: 100%;
}

.btn-control:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-control:active {
  transform: translateY(0);
}

.btn-close {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 0, 0, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 300;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.5);
  transform: translateY(-2px) rotate(90deg);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
}

.btn-close:active {
  transform: translateY(0) rotate(90deg);
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 16px;
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
    font-size: 18px;
  }

  .version {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
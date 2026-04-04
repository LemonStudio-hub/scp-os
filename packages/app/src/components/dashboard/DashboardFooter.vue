<template>
  <div class="dashboard-footer">
    <div class="footer-content">
      <div class="footer-info">
        <div class="info-item">
          <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
          <span class="info-label">Metrics:</span>
          <span class="info-value">{{ metricCount }}</span>
        </div>
        <div class="info-item">
          <span class="info-icon">🕐</span>
          <span class="info-label">Updated:</span>
          <span class="info-value">{{ lastUpdated }}</span>
        </div>
        <div class="info-item" v-if="apiStatus">
          <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
          <span class="info-label">API:</span>
          <span class="info-value" :class="apiStatusClass">{{ apiStatus }}</span>
        </div>
      </div>
      
      <div class="footer-actions">
        <button 
          class="btn-action"
          @click="$emit('export')"
          title="Export data"
        >
          <span class="btn-icon">📥</span>
          <span class="btn-text">Export</span>
        </button>
        
        <button 
          class="btn-action"
          @click="$emit('refresh')"
          title="Refresh data"
        >
          <span class="btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          <span class="btn-text">Refresh</span>
        </button>
        
        <button 
          class="btn-action btn-danger"
          @click="$emit('clear')"
          title="Clear all data"
        >
          <span class="btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></span>
          <span class="btn-text">Clear</span>
        </button>
      </div>
    </div>
    
    <div class="footer-status" v-if="statusMessage">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-text">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  metricCount: number
  lastUpdated: string
  apiStatus?: string
  statusMessage?: string
}>()

defineEmits<{
  export: []
  refresh: []
  clear: []
}>()

const apiStatusClass = computed(() => {
  if (!props.apiStatus) return ''
  switch (props.apiStatus.toLowerCase()) {
    case 'online':
    case 'connected':
      return 'status-online'
    case 'offline':
    case 'disconnected':
      return 'status-offline'
    default:
      return 'status-unknown'
  }
})

const statusIcon = computed(() => {
  if (!props.statusMessage) return ''
  const msg = props.statusMessage.toLowerCase()
  if (msg.includes('error') || msg.includes('failed')) return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  if (msg.includes('success') || msg.includes('complete')) return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  if (msg.includes('loading') || msg.includes('processing')) return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  if (msg.includes('warning') || msg.includes('caution')) return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
})
</script>

<style scoped>
.dashboard-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.info-icon {
  font-size: 14px;
  opacity: 0.8;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  transition: all 0.3s ease;
}

.info-value.status-online {
  color: #00ff00;
}

.info-value.status-offline {
  color: #ff4444;
}

.info-value.status-unknown {
  color: #ffcc00;
}

.footer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-action::before {
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

.btn-action:hover::before {
  width: 200%;
  height: 200%;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-action:active {
  transform: translateY(0);
}

.btn-action.btn-danger:hover {
  background: rgba(255, 68, 68, 0.1);
  border-color: rgba(255, 68, 68, 0.3);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
}

.btn-icon {
  font-size: 14px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.btn-text {
  font-size: 12px;
  letter-spacing: 0.3px;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-icon {
  font-size: 14px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.9;
  letter-spacing: 0.3px;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-footer {
    padding: 12px 16px;
  }

  .footer-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .footer-info {
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    justify-content: space-between;
  }

  .footer-actions {
    justify-content: center;
  }

  .btn-action {
    flex: 1;
    justify-content: center;
  }
}
</style>
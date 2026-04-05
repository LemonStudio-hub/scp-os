<template>
  <div class="issues-section" v-if="issues.length > 0">
    <div class="section-header">
      <h3 class="section-title">
        <svg class="title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Performance Issues
      </h3>
      <span class="issue-count">{{ issues.length }}</span>
    </div>
    
    <div class="issues-list">
      <div 
        v-for="issue in issues" 
        :key="issue.id"
        class="issue-item"
        :class="`severity-${issue.severity}`"
      >
        <div class="issue-header">
          <div class="issue-icon-wrapper" :class="`severity-${issue.severity}`">
            <span class="issue-icon">{{ getSeverityIcon(issue.severity) }}</span>
          </div>
          <div class="issue-title-group">
            <span class="issue-title">{{ issue.title }}</span>
            <span class="issue-badge" :class="`severity-${issue.severity}`">
              {{ issue.severity }}
            </span>
          </div>
          <button 
            class="issue-expand" 
            @click="toggleIssue(issue.id)"
            :class="{ expanded: expandedIssues.has(issue.id) }"
            aria-label="Toggle issue details"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="issue-body" :class="{ expanded: expandedIssues.has(issue.id) }">
          <p class="issue-description">{{ issue.description }}</p>
          
          <div class="issue-recommendation" v-if="issue.recommendation">
            <div class="rec-header">
              <span class="rec-icon">→</span>
              <span class="rec-label">Recommendation</span>
            </div>
            <p class="rec-text">{{ issue.recommendation }}</p>
          </div>
          
          <div class="issue-actions" v-if="issue.component">
            <span class="component-badge">
              <span class="component-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
              {{ issue.component }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PerformanceIssue } from '../../platform/performance/performance-monitor.service'

defineProps<{
  issues: PerformanceIssue[]
}>()

const expandedIssues = ref<Set<string>>(new Set())

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>'
    case 'high': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>'
    case 'medium': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>'
    case 'low': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>'
    default: return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>'
  }
}

const toggleIssue = (issueId: string) => {
  if (expandedIssues.value.has(issueId)) {
    expandedIssues.value.delete(issueId)
  } else {
    expandedIssues.value.add(issueId)
  }
}
</script>

<style scoped>
.issues-section {
  padding: 0 24px 24px 24px;
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.5px;
}

.title-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.issue-count {
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 68, 68, 0.3);
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.2);
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.issue-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.03) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.issue-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.issue-item:hover::before {
  opacity: 1;
}

.issue-item.severity-critical {
  border-left-color: #ff4444;
  background: linear-gradient(135deg, rgba(255, 68, 68, 0.08) 0%, rgba(255, 68, 68, 0.03) 100%);
}

.issue-item.severity-high {
  border-left-color: #ff8800;
  background: linear-gradient(135deg, rgba(255, 136, 0, 0.08) 0%, rgba(255, 136, 0, 0.03) 100%);
}

.issue-item.severity-medium {
  border-left-color: #ffcc00;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(255, 204, 0, 0.03) 100%);
}

.issue-item.severity-low {
  border-left-color: #00ff00;
  background: linear-gradient(135deg, rgba(0, 255, 0, 0.08) 0%, rgba(0, 255, 0, 0.03) 100%);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}

.issue-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.issue-icon-wrapper.severity-critical {
  background: rgba(255, 68, 68, 0.15);
  border-color: rgba(255, 68, 68, 0.3);
  box-shadow: 0 0 12px rgba(255, 68, 68, 0.3);
}

.issue-icon-wrapper.severity-high {
  background: rgba(255, 136, 0, 0.15);
  border-color: rgba(255, 136, 0, 0.3);
  box-shadow: 0 0 12px rgba(255, 136, 0, 0.3);
}

.issue-icon-wrapper.severity-medium {
  background: rgba(255, 204, 0, 0.15);
  border-color: rgba(255, 204, 0, 0.3);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.3);
}

.issue-icon-wrapper.severity-low {
  background: rgba(0, 255, 0, 0.15);
  border-color: rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.3);
}

.issue-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.issue-title-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.issue-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-badge {
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.issue-badge.severity-critical {
  background: rgba(255, 68, 68, 0.2);
  border-color: rgba(255, 68, 68, 0.4);
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
}

.issue-badge.severity-high {
  background: rgba(255, 136, 0, 0.2);
  border-color: rgba(255, 136, 0, 0.4);
  box-shadow: 0 0 8px rgba(255, 136, 0, 0.3);
}

.issue-badge.severity-medium {
  background: rgba(255, 204, 0, 0.2);
  border-color: rgba(255, 204, 0, 0.4);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.3);
}

.issue-badge.severity-low {
  background: rgba(0, 255, 0, 0.2);
  border-color: rgba(0, 255, 0, 0.4);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

.issue-expand {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
}

.issue-expand:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.issue-expand.expanded {
  background: rgba(255, 255, 255, 0.08);
  transform: rotate(180deg);
}

.issue-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  opacity: 0;
}

.issue-body.expanded {
  max-height: 500px;
  opacity: 1;
  padding-top: 12px;
}

.issue-description {
  font-size: 13px;
  color: #ffffff;
  opacity: 0.8;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.issue-recommendation {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rec-icon {
  font-size: 14px;
}

.rec-label {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rec-text {
  font-size: 12px;
  color: #ffffff;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

.issue-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.component-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 11px;
  color: #ffffff;
  opacity: 0.7;
}

.component-icon {
  font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
  .issues-section {
    padding: 0 16px 16px 16px;
  }

  .issue-item {
    padding: 14px;
  }

  .issue-header {
    flex-wrap: wrap;
  }

  .issue-title-group {
    width: 100%;
    margin-top: 8px;
  }

  .issue-expand {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}
</style>
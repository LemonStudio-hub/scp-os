<template>
  <div v-if="recommendations.length > 0" class="recommendations-section">
    <div class="section-header">
      <h3 class="section-title">
        <span class="title-icon">→</span>
        Optimization Recommendations
      </h3>
      <span class="rec-count">{{ recommendations.length }}</span>
    </div>
    
    <div class="recommendations-list">
      <div 
        v-for="rec in recommendations" 
        :key="rec.id"
        class="recommendation-item"
        :class="`effort-${rec.effort}`"
      >
        <div class="rec-header">
          <div class="rec-icon-wrapper" :class="`effort-${rec.effort}`">
            <span class="rec-icon">{{ getTypeIcon(rec.type) }}</span>
          </div>
          <div class="rec-title-group">
            <span class="rec-name">{{ rec.name }}</span>
            <span class="rec-effort-badge" :class="`effort-${rec.effort}`">
              {{ rec.effort }}
            </span>
          </div>
          <span class="rec-improvement">
            <span class="improvement-icon">→</span>
            {{ rec.estimatedImprovement }}
          </span>
        </div>
        
        <p class="rec-description">{{ rec.description }}</p>
        
        <div class="rec-meta">
          <span class="rec-type" :class="`type-${rec.type}`">
            <span class="type-icon">{{ getTypeIcon(rec.type) }}</span>
            {{ rec.type }}
          </span>
          <span class="rec-steps-count">
            <span class="steps-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></span>
            {{ rec.steps.length }} steps
          </span>
        </div>
        
        <div v-if="showSteps" class="rec-steps">
          <div class="steps-header">
            <span class="steps-title">Implementation Steps</span>
            <button 
              class="steps-toggle" 
              :class="{ expanded: expandedRecs.has(rec.id) }"
              aria-label="Toggle steps"
              @click="toggleSteps(rec.id)"
            >
              {{ expandedRecs.has(rec.id) ? 'Hide' : 'Show' }}
            </button>
          </div>
          <div class="steps-list" :class="{ expanded: expandedRecs.has(rec.id) }">
            <div 
              v-for="(step, index) in rec.steps" 
              :key="index"
              class="step-item"
            >
              <span class="step-number">{{ index + 1 }}</span>
              <span class="step-text">{{ step }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  recommendations: Array<{
    id: string
    name: string
    description: string
    type: string
    estimatedImprovement: string
    effort: string
    steps: string[]
  }>
  showSteps?: boolean
}>()

const expandedRecs = ref<Set<string>>(new Set())

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'code': return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
    case 'configuration': return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    case 'resource': return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
    case 'architecture': return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
    default: return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  }
}

const toggleSteps = (recId: string) => {
  if (expandedRecs.value.has(recId)) {
    expandedRecs.value.delete(recId)
  } else {
    expandedRecs.value.add(recId)
  }
}
</script>

<style scoped>
.recommendations-section {
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

.rec-count {
  font-size: 12px;
  font-weight: 700;
  background: rgba(0, 255, 0, 0.2);
  color: #00ff00;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.recommendation-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00ff00, #ffff00, #ff4444);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recommendation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
}

.recommendation-item:hover::before {
  opacity: 0.6;
}

.recommendation-item.effort-low::before {
  background: linear-gradient(90deg, #00ff00, #00cc00);
}

.recommendation-item.effort-medium::before {
  background: linear-gradient(90deg, #ffff00, #cccc00);
}

.recommendation-item.effort-high::before {
  background: linear-gradient(90deg, #ff4444, #cc0000);
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-icon-wrapper {
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

.recommendation-item:hover .rec-icon-wrapper {
  transform: scale(1.05);
}

.rec-icon-wrapper.effort-low {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
}

.rec-icon-wrapper.effort-medium {
  background: rgba(255, 255, 0, 0.1);
  border-color: rgba(255, 255, 0, 0.3);
  box-shadow: 0 0 12px rgba(255, 255, 0, 0.2);
}

.rec-icon-wrapper.effort-high {
  background: rgba(255, 68, 68, 0.1);
  border-color: rgba(255, 68, 68, 0.3);
  box-shadow: 0 0 12px rgba(255, 68, 68, 0.2);
}

.rec-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.rec-title-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rec-name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-effort-badge {
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

.rec-effort-badge.effort-low {
  background: rgba(0, 255, 0, 0.2);
  border-color: rgba(0, 255, 0, 0.4);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

.rec-effort-badge.effort-medium {
  background: rgba(255, 255, 0, 0.2);
  border-color: rgba(255, 255, 0, 0.4);
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.3);
}

.rec-effort-badge.effort-high {
  background: rgba(255, 68, 68, 0.2);
  border-color: rgba(255, 68, 68, 0.4);
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
}

.rec-improvement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 255, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 0, 0.3);
  font-size: 12px;
  font-weight: 700;
  color: #00ff00;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
  flex-shrink: 0;
}

.improvement-icon {
  font-size: 14px;
}

.rec-description {
  font-size: 13px;
  color: #ffffff;
  opacity: 0.8;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.rec-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.rec-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.type-icon {
  font-size: 12px;
}

.rec-steps-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 11px;
  color: #ffffff;
  opacity: 0.7;
}

.steps-icon {
  font-size: 12px;
}

.rec-steps {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.steps-title {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.steps-toggle {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.steps-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.steps-toggle.expanded {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
  color: #00ff00;
}

.steps-list {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.steps-list.expanded {
  max-height: 500px;
  opacity: 1;
}

.step-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 6px;
  transition: all 0.3s ease;
}

.step-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(4px);
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.step-text {
  font-size: 12px;
  color: #ffffff;
  opacity: 0.8;
  line-height: 1.5;
}

/* Responsive design */
@media (max-width: 768px) {
  .recommendations-section {
    padding: 0 16px 16px 16px;
  }

  .recommendation-item {
    padding: 14px;
  }

  .rec-header {
    flex-wrap: wrap;
  }

  .rec-title-group {
    width: 100%;
    margin-top: 8px;
  }

  .rec-improvement {
    width: 100%;
    justify-content: center;
  }
}
</style>
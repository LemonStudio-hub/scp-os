<template>
  <div class="score-section">
    <div class="score-card">
      <div class="score-header">
        <div class="score-label-group">
          <span class="score-icon">◎</span>
          <span class="score-label">Overall Score</span>
        </div>
        <div class="score-value-container">
          <span 
            class="score-value" 
            :class="scoreClass"
          >
            {{ score }}/100
          </span>
          <span 
            class="score-badge" 
            :class="scoreClass"
          >
            {{ scoreGrade }}
          </span>
        </div>
      </div>
      
      <div class="score-bar-container">
        <div class="score-bar-bg">
          <div 
            class="score-bar-fill" 
            :class="scoreClass"
            :style="{ width: `${score}%` }"
          >
            <div class="score-bar-glow"></div>
          </div>
        </div>
        <div class="score-marks">
          <span v-for="n in 5" :key="n" class="mark"></span>
        </div>
      </div>
      
      <div class="score-details">
        <div class="score-detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value" :class="scoreClass">{{ scoreStatus }}</span>
        </div>
        <div class="score-detail-item">
          <span class="detail-label">Issues:</span>
          <span class="detail-value">{{ issueCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  issueCount: number
}>()

const scoreClass = computed(() => {
  if (props.score >= 80) return 'score-good'
  if (props.score >= 60) return 'score-medium'
  return 'score-poor'
})

const scoreGrade = computed(() => {
  if (props.score >= 90) return 'A+'
  if (props.score >= 80) return 'A'
  if (props.score >= 70) return 'B'
  if (props.score >= 60) return 'C'
  if (props.score >= 50) return 'D'
  return 'F'
})

const scoreStatus = computed(() => {
  if (props.score >= 90) return 'Excellent'
  if (props.score >= 80) return 'Good'
  if (props.score >= 70) return 'Fair'
  if (props.score >= 60) return 'Warning'
  if (props.score >= 50) return 'Poor'
  return 'Critical'
})
</script>

<style scoped>
.score-section {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.01);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.score-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.score-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.score-label-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.score-label {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.9;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.score-value-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.score-value.score-good {
  color: #00ff00;
  text-shadow: 0 2px 8px rgba(0, 255, 0, 0.4);
}

.score-value.score-medium {
  color: #ffff00;
  text-shadow: 0 2px 8px rgba(255, 255, 0, 0.4);
}

.score-value.score-poor {
  color: #ff4444;
  text-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
}

.score-badge {
  font-size: 14px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.score-badge.score-good {
  background: rgba(0, 255, 0, 0.15);
  color: #00ff00;
  border: 1px solid rgba(0, 255, 0, 0.3);
}

.score-badge.score-medium {
  background: rgba(255, 255, 0, 0.15);
  color: #ffff00;
  border: 1px solid rgba(255, 255, 0, 0.3);
}

.score-badge.score-poor {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.score-bar-container {
  position: relative;
  margin-bottom: 20px;
}

.score-bar-bg {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.score-bar-fill {
  height: 100%;
  border-radius: 8px;
  position: relative;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.score-bar-fill.score-good {
  background: linear-gradient(90deg, #00cc00, #00ff00);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
}

.score-bar-fill.score-medium {
  background: linear-gradient(90deg, #cccc00, #ffff00);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.4);
}

.score-bar-fill.score-poor {
  background: linear-gradient(90deg, #cc0000, #ff4444);
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
}

.score-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.score-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 2px;
}

.score-marks .mark {
  width: 2px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

.score-details {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.score-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  transition: all 0.3s ease;
}

.detail-value.score-good {
  color: #00ff00;
}

.detail-value.score-medium {
  color: #ffff00;
}

.detail-value.score-poor {
  color: #ff4444;
}

/* Responsive design */
@media (max-width: 768px) {
  .score-section {
    padding: 16px;
  }

  .score-card {
    padding: 20px;
  }

  .score-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .score-value {
    font-size: 28px;
  }

  .score-details {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
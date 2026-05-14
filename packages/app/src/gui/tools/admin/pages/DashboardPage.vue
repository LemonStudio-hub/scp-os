<template>
  <div class="dashboard-page">
    <div v-if="loading" class="dashboard-page__loading">
      <div class="dashboard-page__spinner"></div>
    </div>
    <template v-else>
      <div class="dashboard-page__stats">
        <StatCard
          title="总用户数"
          :value="stats.totalUsers ?? 0"
          icon="users"
          :trend="stats.totalUsersTrend"
          color="#E94560"
        />
        <StatCard
          title="活跃用户"
          :value="stats.activeUsers ?? 0"
          icon="activity"
          :trend="stats.activeUsersTrend"
          color="#34C759"
        />
        <StatCard
          title="总内容数"
          :value="stats.totalContent ?? 0"
          icon="server"
          :trend="stats.totalContentTrend"
          color="#0A84FF"
        />
        <StatCard
          title="总反馈数"
          :value="stats.totalFeedback ?? 0"
          icon="shield"
          :trend="stats.totalFeedbackTrend"
          color="#FFCC00"
        />
      </div>

      <div class="dashboard-page__charts">
        <div class="dashboard-page__chart-card">
          <div class="dashboard-page__chart-header">
            <span class="dashboard-page__chart-title">用户增长趋势</span>
          </div>
          <TrendChart :data="userTrendData" color="#E94560" />
        </div>
        <div class="dashboard-page__chart-card">
          <div class="dashboard-page__chart-header">
            <span class="dashboard-page__chart-title">内容增长趋势</span>
          </div>
          <TrendChart :data="contentTrendData" color="#0A84FF" />
        </div>
        <div class="dashboard-page__chart-card">
          <div class="dashboard-page__chart-header">
            <span class="dashboard-page__chart-title">反馈增长趋势</span>
          </div>
          <TrendChart :data="feedbackTrendData" color="#FFCC00" />
        </div>
      </div>

      <div class="dashboard-page__activity">
        <div class="dashboard-page__activity-card">
          <div class="dashboard-page__activity-header">
            <span class="dashboard-page__activity-title">近期活动概况</span>
          </div>
          <div class="dashboard-page__activity-grid">
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">今日新增用户</span>
              <span class="dashboard-page__activity-value">{{ stats.todayNewUsers ?? 0 }}</span>
            </div>
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">今日新增内容</span>
              <span class="dashboard-page__activity-value">{{ stats.todayNewContent ?? 0 }}</span>
            </div>
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">今日新增反馈</span>
              <span class="dashboard-page__activity-value">{{ stats.todayNewFeedback ?? 0 }}</span>
            </div>
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">待处理反馈</span>
              <span class="dashboard-page__activity-value">{{ stats.pendingFeedback ?? 0 }}</span>
            </div>
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">封禁用户数</span>
              <span class="dashboard-page__activity-value">{{ stats.bannedUsers ?? 0 }}</span>
            </div>
            <div class="dashboard-page__activity-item">
              <span class="dashboard-page__activity-label">今日聊天消息</span>
              <span class="dashboard-page__activity-value">{{ stats.todayMessages ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { StatCard, TrendChart } from '../components'
import { useToast } from '../composables/useToast'
import { useAdminStore } from '../stores/adminStore'
import * as adminApi from '../services/adminApi'

interface DataPoint {
  date: string
  value: number
}

const toast = useToast()
const adminStore = useAdminStore()

const loading = ref(true)
const stats = ref<Record<string, number>>({})
const userTrendData = ref<DataPoint[]>([])
const contentTrendData = ref<DataPoint[]>([])
const feedbackTrendData = ref<DataPoint[]>([])

async function fetchDashboard() {
  const token = adminStore.token
  if (!token) return
  loading.value = true
  try {
    const [statsRes, trendRes] = await Promise.all([
      adminApi.getDashboardStats(token),
      adminApi.getTrendData(token, 30),
    ])
    if (statsRes.success) {
      stats.value = statsRes.data || {}
    } else {
      toast.error(statsRes.error || '获取统计数据失败')
    }
    if (trendRes.success && trendRes.data) {
      userTrendData.value = trendRes.data.users || []
      contentTrendData.value = trendRes.data.content || []
      feedbackTrendData.value = trendRes.data.feedback || []
    } else {
      toast.error(trendRes.error || '获取趋势数据失败')
    }
  } catch {
    toast.error('获取仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.dashboard-page__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gui-border-subtle, #1a1a1a);
  border-top-color: var(--gui-error, #e94560);
  border-radius: 50%;
  animation: dashboardSpin 0.8s linear infinite;
}

@keyframes dashboardSpin {
  to {
    transform: rotate(360deg);
  }
}

.dashboard-page__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dashboard-page__charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.dashboard-page__chart-card {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  padding: 16px;
}

.dashboard-page__chart-header {
  margin-bottom: 12px;
}

.dashboard-page__chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #e0e0e0);
}

.dashboard-page__activity {
  width: 100%;
}

.dashboard-page__activity-card {
  background: var(--gui-bg-surface-raised, #1a1a1a);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 10px;
  padding: 16px 20px;
}

.dashboard-page__activity-header {
  margin-bottom: 16px;
}

.dashboard-page__activity-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gui-text-primary, #e0e0e0);
}

.dashboard-page__activity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.dashboard-page__activity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: var(--gui-bg-surface, #0f0f0f);
  border: 1px solid var(--gui-border-default, #2a2a2a);
  border-radius: 8px;
}

.dashboard-page__activity-label {
  font-size: 11px;
  color: var(--gui-text-tertiary, #6a6a6a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dashboard-page__activity-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--gui-text-primary, #e0e0e0);
  font-variant-numeric: tabular-nums;
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .dashboard-page__stat-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.light .dashboard-page__stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.light .dashboard-page__activity-item:hover {
  background: var(--gui-bg-surface-hover, rgba(0, 0, 0, 0.04));
}
</style>

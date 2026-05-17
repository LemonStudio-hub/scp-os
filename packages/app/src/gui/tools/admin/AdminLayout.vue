<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from './stores/adminStore'
import { useI18n } from '../../composables/useI18n'
import AdminLogin from './AdminLogin.vue'
import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'
import ToastContainer from './components/ToastContainer.vue'
import DashboardPage from './pages/DashboardPage.vue'
import UserManagement from './pages/UserManagement.vue'
import ContentManagement from './pages/ContentManagement.vue'
import ChatManagement from './pages/ChatManagement.vue'
import FeedbackManagement from './pages/FeedbackManagement.vue'
import SystemSettings from './pages/SystemSettings.vue'
import AuditLog from './pages/AuditLog.vue'

const adminStore = useAdminStore()
const { t } = useI18n()
const currentPage = ref('dashboard')
const isSidebarCollapsed = ref(false)
const isInitializing = ref(true)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: t('admin.nav.dashboard'),
    users: t('admin.nav.users'),
    content: t('admin.nav.content'),
    chat: t('admin.nav.chat'),
    feedback: t('admin.nav.feedback'),
    settings: t('admin.nav.settings'),
    logs: t('admin.nav.logs'),
  }
  return titles[currentPage.value] || t('admin.title')
})

onMounted(async () => {
  adminStore.init()
  if (adminStore.token) {
    await adminStore.verifyToken()
  }
  isInitializing.value = false
})

function handleLogout() {
  adminStore.logout()
}
</script>

<template>
  <div class="admin-layout">
    <div v-if="isInitializing" class="admin-layout__loading">
      <div class="admin-layout__spinner"></div>
    </div>

    <AdminLogin v-else-if="!adminStore.isAuthenticated" @login-success="isInitializing = false" />

    <template v-else>
      <AdminSidebar
        :current-page="currentPage"
        :collapsed="isSidebarCollapsed"
        @navigate="currentPage = $event"
        @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
      />

      <div class="admin-layout__main">
        <AdminTopbar @logout="handleLogout">
          <template #title>
            <span class="admin-layout__page-title">{{ pageTitle }}</span>
          </template>
        </AdminTopbar>

        <div class="admin-layout__content">
          <DashboardPage v-if="currentPage === 'dashboard'" class="admin-layout__page" />
          <UserManagement v-else-if="currentPage === 'users'" class="admin-layout__page" />
          <ContentManagement v-else-if="currentPage === 'content'" class="admin-layout__page" />
          <ChatManagement v-else-if="currentPage === 'chat'" class="admin-layout__page" />
          <FeedbackManagement v-else-if="currentPage === 'feedback'" class="admin-layout__page" />
          <SystemSettings v-else-if="currentPage === 'settings'" class="admin-layout__page" />
          <AuditLog v-else-if="currentPage === 'logs'" class="admin-layout__page" />
        </div>
      </div>
    </template>

    <ToastContainer />
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--gui-bg-base, #000000);
  color: var(--gui-text-primary, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.admin-layout__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.admin-layout__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gui-border-subtle, #1a1a1a);
  border-top-color: var(--gui-error, #e94560);
  border-radius: 50%;
  animation: adminLayoutSpin 0.8s linear infinite;
}

@keyframes adminLayoutSpin {
  to {
    transform: rotate(360deg);
  }
}

.admin-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.admin-layout__page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-primary, #ffffff);
  letter-spacing: -0.01em;
}

.admin-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.admin-layout__page {
  animation: adminLayoutPageIn 0.3s ease both;
}

@keyframes adminLayoutPageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

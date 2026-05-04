<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from './stores/adminStore'
import { useToast } from './composables/useToast'

const emit = defineEmits<{ loginSuccess: [] }>()
const adminStore = useAdminStore()
const { error: showError } = useToast()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  const result = await adminStore.login(username.value.trim(), password.value)
  isLoading.value = false
  if (result.success) {
    emit('loginSuccess')
  } else {
    errorMsg.value = result.error || '登录失败'
    showError(errorMsg.value)
  }
}
</script>

<template>
  <div class="admin-login">
    <div class="admin-login__card">
      <div class="admin-login__header">
        <div class="admin-login__icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 class="admin-login__title">SCP-OS Admin</h1>
        <p class="admin-login__subtitle">管理后台登录</p>
      </div>

      <form class="admin-login__form" @submit.prevent="handleLogin">
        <div class="admin-login__field">
          <label class="admin-login__label" for="admin-username">用户名</label>
          <input
            id="admin-username"
            v-model="username"
            type="text"
            class="admin-login__input"
            placeholder="输入管理员用户名"
            autocomplete="username"
            :disabled="isLoading"
          />
        </div>

        <div class="admin-login__field">
          <label class="admin-login__label" for="admin-password">密码</label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            class="admin-login__input"
            placeholder="输入密码"
            autocomplete="current-password"
            :disabled="isLoading"
          />
        </div>

        <div v-if="errorMsg" class="admin-login__error">{{ errorMsg }}</div>

        <button type="submit" class="admin-login__btn" :disabled="isLoading">
          <span v-if="isLoading" class="admin-login__spinner"></span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="admin-login__footer">
        <span>SCP Foundation &middot; Restricted Access</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  background: #0a0a0a;
  animation: adminLoginFadeIn 0.4s ease both;
}

@keyframes adminLoginFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.admin-login__card {
  width: 100%;
  max-width: 380px;
  background: #111111;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  padding: 40px 32px 32px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  animation: adminLoginCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

@keyframes adminLoginCardIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.admin-login__header {
  text-align: center;
  margin-bottom: 32px;
}

.admin-login__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(233, 69, 96, 0.1);
  color: #e94560;
  margin-bottom: 16px;
}

.admin-login__title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.admin-login__subtitle {
  font-size: 13px;
  color: #666666;
  margin: 0;
}

.admin-login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-login__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-login__label {
  font-size: 12px;
  font-weight: 500;
  color: #888888;
  letter-spacing: 0.02em;
}

.admin-login__input {
  width: 100%;
  padding: 10px 14px;
  background: #0a0a0a;
  border: 1px solid #222222;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  box-sizing: border-box;
}

.admin-login__input::placeholder {
  color: #444444;
}

.admin-login__input:focus {
  border-color: #e94560;
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.admin-login__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-login__error {
  font-size: 12px;
  color: #e94560;
  padding: 8px 12px;
  background: rgba(233, 69, 96, 0.08);
  border-radius: 8px;
  animation: adminLoginShake 0.4s ease;
}

@keyframes adminLoginShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.admin-login__btn {
  width: 100%;
  padding: 11px 16px;
  background: #e94560;
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.admin-login__btn:hover:not(:disabled) {
  background: #d63d56;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
}

.admin-login__btn:active:not(:disabled) {
  transform: translateY(0);
}

.admin-login__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-login__spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: adminLoginSpin 0.6s linear infinite;
}

@keyframes adminLoginSpin {
  to {
    transform: rotate(360deg);
  }
}

.admin-login__footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #1a1a1a;
}

.admin-login__footer span {
  font-size: 11px;
  color: #444444;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>

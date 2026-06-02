<template>
  <div class="pc-login-screen">
    <div class="pc-login-screen__background">
      <div class="pc-login-screen__gradient" />
      <div class="pc-login-screen__pattern">
        <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="360" :stroke="patternColor1" stroke-width="1" />
          <circle cx="400" cy="400" r="240" :stroke="patternColor2" stroke-width="1" />
          <circle cx="400" cy="400" r="120" :stroke="patternColor3" stroke-width="1" />
          <line x1="0" y1="400" x2="800" y2="400" :stroke="patternColor3" stroke-width="0.5" />
          <line x1="400" y1="0" x2="400" y2="800" :stroke="patternColor3" stroke-width="0.5" />
        </svg>
      </div>
    </div>

    <div class="pc-login-screen__card-container">
      <div class="pc-login-screen__card">
        <div class="pc-login-screen__card-glow" />

        <div class="pc-login-screen__logo-section" aria-hidden="true">
          <div class="pc-login-screen__logo-container">
            <svg
              class="pc-login-screen__logo"
              width="100"
              height="100"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                stroke-width="2.5"
                opacity="0.6"
              />
              <circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="2" opacity="0.4" />
              <circle
                cx="50"
                cy="50"
                r="25"
                stroke="currentColor"
                stroke-width="1.5"
                opacity="0.2"
              />
              <text
                x="50"
                y="60"
                text-anchor="middle"
                font-family="'Courier New', monospace"
                font-size="26"
                font-weight="900"
                fill="currentColor"
                letter-spacing="3"
              >
                SCP
              </text>
            </svg>
          </div>
        </div>

        <h1 class="pc-login-screen__title">欢迎回来</h1>
        <p class="pc-login-screen__subtitle">游客可直接进入，注册账号需邮箱验证码</p>

        <div class="pc-login-screen__mode-tabs">
          <button
            v-for="item in modes"
            :key="item.id"
            type="button"
            class="pc-login-screen__mode-tab"
            :class="{ 'pc-login-screen__mode-tab--active': mode === item.id }"
            @click="setMode(item.id)"
          >
            {{ item.label }}
          </button>
        </div>

        <form class="pc-login-screen__form" @submit.prevent="handleLogin">
          <div v-if="mode !== 'guest'" class="pc-login-screen__input-group">
            <label class="pc-login-screen__label" for="email-input">邮箱</label>
            <div class="pc-login-screen__input-wrapper">
              <input
                id="email-input"
                v-model="email"
                type="email"
                class="pc-login-screen__input"
                :class="{ 'pc-login-screen__input--error': error }"
                placeholder="name@example.com"
                autocomplete="email"
                @input="onInputChange"
              />
            </div>
          </div>

          <div v-if="mode !== 'guest'" class="pc-login-screen__input-group">
            <label class="pc-login-screen__label" for="password-input">密码</label>
            <div class="pc-login-screen__input-wrapper">
              <input
                id="password-input"
                v-model="password"
                type="password"
                class="pc-login-screen__input"
                :class="{ 'pc-login-screen__input--error': error }"
                placeholder="至少 8 位"
                autocomplete="current-password"
                @input="onInputChange"
              />
            </div>
          </div>

          <div v-if="mode === 'register'" class="pc-login-screen__input-group">
            <label class="pc-login-screen__label" for="verification-code-input">邮箱验证码</label>
            <div class="pc-login-screen__code-row">
              <div class="pc-login-screen__input-wrapper">
                <input
                  id="verification-code-input"
                  v-model="verificationCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  class="pc-login-screen__input"
                  :class="{ 'pc-login-screen__input--error': error }"
                  placeholder="6 位验证码"
                  autocomplete="one-time-code"
                  @input="onInputChange"
                />
              </div>
              <button
                type="button"
                class="pc-login-screen__code-button"
                :disabled="sendCodeLoading || countdownSeconds > 0"
                @click="handleSendCode"
              >
                {{ sendCodeLabel }}
              </button>
            </div>
          </div>

          <div v-if="mode !== 'login'" class="pc-login-screen__input-group">
            <label class="pc-login-screen__label" for="nickname-input">工作代号</label>
            <div class="pc-login-screen__input-wrapper">
              <input
                id="nickname-input"
                ref="inputRef"
                v-model="nickname"
                type="text"
                class="pc-login-screen__input"
                :class="{
                  'pc-login-screen__input--error': error,
                  'pc-login-screen__input--focused': isFocused,
                }"
                placeholder="工作代号 / 昵称"
                maxlength="20"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                @focus="isFocused = true"
                @blur="isFocused = false"
                @input="onInputChange"
              />
              <div
                v-if="nickname && !error"
                class="pc-login-screen__input-clear"
                @click="clearInput"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path
                    d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <transition name="error-slide">
            <p v-if="error" class="pc-login-screen__error">
              {{ error }}
            </p>
          </transition>

          <div v-if="mode !== 'login'" class="pc-login-screen__meta-row">
            <span
              class="pc-login-screen__char-count"
              :class="{ 'pc-login-screen__char-count--warning': nickname.length >= 18 }"
            >
              {{ nickname.length }}/20 字符
            </span>
            <span v-if="mode === 'register'" class="pc-login-screen__hint">
              验证码 10 分钟有效
            </span>
          </div>

          <button
            type="submit"
            class="pc-login-screen__button"
            :class="{
              'pc-login-screen__button--loading': isLoading,
              'pc-login-screen__button--disabled': !isValid || isLoading,
            }"
            :disabled="!isValid || isLoading"
          >
            <span v-if="!isLoading" class="pc-login-screen__button-text">
              {{ submitLabel }}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 3l5 5m0 0l-5 5m5-5H3"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span v-else class="pc-login-screen__button-loading">
              <svg
                class="pc-login-screen__spinner"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  opacity="0.25"
                />
                <path
                  d="M10 2a8 8 0 0 1 8 8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              验证中...
            </span>
          </button>
        </form>

        <div class="pc-login-screen__card-footer">
          <p class="pc-login-card-footer__text">SCP Foundation &mdash; 安全、收容、保护</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { isNicknameValid, validateNickname } from '../../utils/nicknameValidator'

const emit = defineEmits<{
  'login-success': []
}>()

type LoginMode = 'guest' | 'login' | 'register'

const authStore = useAuthStore()
const modes: { id: LoginMode; label: string }[] = [
  { id: 'guest', label: '游客' },
  { id: 'login', label: '邮箱登录' },
  { id: 'register', label: '邮箱注册' },
]

const mode = ref<LoginMode>('guest')
const nickname = ref('')
const email = ref('')
const password = ref('')
const verificationCode = ref('')
const isLoading = ref(false)
const sendCodeLoading = ref(false)
const countdownSeconds = ref(0)
const error = ref('')
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
let countdownTimer: number | null = null

const isValid = computed(() => {
  if (mode.value === 'guest') return isNicknameValid(nickname.value)
  if (!emailPattern.test(email.value.trim()) || password.value.length < 8) return false
  if (mode.value === 'login') return true
  return isNicknameValid(nickname.value) && /^\d{6}$/.test(verificationCode.value.trim())
})

const submitLabel = computed(() => {
  if (mode.value === 'guest') return '游客进入'
  if (mode.value === 'register') return '注册并进入'
  return '登录'
})

const sendCodeLabel = computed(() => {
  if (sendCodeLoading.value) return '发送中...'
  if (countdownSeconds.value > 0) return `${countdownSeconds.value}s`
  return '发送验证码'
})

function setMode(nextMode: LoginMode): void {
  mode.value = nextMode
  error.value = ''
  verificationCode.value = ''
}

function clearInput(): void {
  nickname.value = ''
  error.value = ''
  inputRef.value?.focus()
}

function onInputChange(): void {
  if (error.value) error.value = ''
}

function stopCountdown(): void {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function startCountdown(seconds: number): void {
  stopCountdown()
  countdownSeconds.value = seconds
  countdownTimer = window.setInterval(() => {
    if (countdownSeconds.value <= 1) {
      countdownSeconds.value = 0
      stopCountdown()
      return
    }
    countdownSeconds.value -= 1
  }, 1000)
}

async function handleSendCode(): Promise<void> {
  if (!emailPattern.test(email.value.trim())) {
    error.value = '请输入有效邮箱'
    return
  }

  error.value = ''
  sendCodeLoading.value = true
  try {
    const result = await authStore.sendVerificationCode(email.value.trim())
    if (!result.success) {
      error.value = result.error || '验证码发送失败'
      return
    }
    startCountdown(60)
  } catch (err) {
    console.error('[PCLogin] Send code error:', err)
    error.value = '验证码发送失败，请稍后重试'
  } finally {
    sendCodeLoading.value = false
  }
}

async function handleLogin(): Promise<void> {
  if (
    mode.value !== 'guest' &&
    (!emailPattern.test(email.value.trim()) || password.value.length < 8)
  ) {
    error.value = '请输入有效邮箱和至少 8 位密码'
    return
  }
  if (mode.value === 'register' && !/^\d{6}$/.test(verificationCode.value.trim())) {
    error.value = '请输入 6 位邮箱验证码'
    return
  }

  const validation = validateNickname(nickname.value)
  if (mode.value !== 'login' && !validation.valid) {
    error.value = validation.error || '请输入有效的工作代号'
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    const result =
      mode.value === 'guest'
        ? await authStore.loginGuest(nickname.value.trim())
        : mode.value === 'login'
          ? await authStore.loginRegistered(email.value.trim(), password.value)
          : await authStore.register(
              email.value.trim(),
              password.value,
              nickname.value.trim(),
              verificationCode.value.trim()
            )

    if (result.success) {
      emit('login-success')
    } else {
      error.value = result.error || '登录失败，请重试'
    }
  } catch (err) {
    console.error('[PCLogin] Error:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const patternColor1 = computed(() =>
  document.documentElement.classList.contains('light')
    ? 'rgba(0, 0, 0, 0.06)'
    : 'rgba(255, 255, 255, 0.06)'
)
const patternColor2 = computed(() =>
  document.documentElement.classList.contains('light')
    ? 'rgba(0, 0, 0, 0.08)'
    : 'rgba(255, 255, 255, 0.08)'
)
const patternColor3 = computed(() =>
  document.documentElement.classList.contains('light')
    ? 'rgba(60, 60, 67, 0.03)'
    : 'rgba(63, 63, 66, 0.03)'
)

onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 700)
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.pc-login-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-base, #1c1c1e);
}

.pc-login-screen__background {
  position: absolute;
  inset: 0;
  background: var(--gui-bg-base, #1c1c1e);
  overflow: hidden;
}

.pc-login-screen__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(142, 142, 147, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, rgba(142, 142, 147, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(63, 63, 66, 0.03) 0%, transparent 40%);
}

.pc-login-screen__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.pc-login-screen__card-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 24px;
}

.pc-login-screen__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 48px 32px;
  background: rgba(44, 44, 46, 0.75);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.pc-login-screen__card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 50% 30%, rgba(142, 142, 147, 0.04) 0%, transparent 60%);
  pointer-events: none;
}

.pc-login-screen__logo-section {
  margin-bottom: 32px;
}

.pc-login-screen__logo {
  color: var(--gui-text-primary, #ffffff);
  filter: drop-shadow(0 0 30px rgba(142, 142, 147, 0.35));
}

.pc-login-screen__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: var(--gui-text-primary, #ffffff);
}

.pc-login-screen__subtitle {
  margin: 0 0 36px;
  font-size: 13px;
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
}

.pc-login-screen__mode-tabs {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.pc-login-screen__mode-tab {
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.pc-login-screen__mode-tab--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--gui-text-primary, #ffffff);
}

.pc-login-screen__form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pc-login-screen__input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pc-login-screen__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gui-text-secondary, #8e8e93);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pc-login-screen__input-wrapper {
  position: relative;
  width: 100%;
}

.pc-login-screen__code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 10px;
}

.pc-login-screen__input {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  padding-right: 48px;
  font-size: 15px;
  color: var(--gui-text-primary, #ffffff);
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  outline: none;
  transition: all 200ms ease;
}

.pc-login-screen__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.pc-login-screen__input:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
}

.pc-login-screen__input--focused,
.pc-login-screen__input:focus {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 4px rgba(142, 142, 147, 0.12);
}

.pc-login-screen__input--error {
  border-color: var(--gui-error, #ff3b30);
  background: rgba(255, 59, 48, 0.04);
}

.pc-login-screen__input-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: var(--gui-text-tertiary, #636366);
  border-radius: 9999px;
}

.pc-login-screen__code-button {
  height: 56px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--gui-text-primary, #ffffff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.pc-login-screen__code-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09);
}

.pc-login-screen__code-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pc-login-screen__error {
  margin: 0;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-error, #ff3b30);
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.2s ease;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.pc-login-screen__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pc-login-screen__char-count {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-login-screen__char-count--warning {
  color: var(--gui-warning, #ffcc00);
}

.pc-login-screen__hint {
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.pc-login-screen__button {
  width: 100%;
  height: 56px;
  margin-top: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--gui-text-inverse, #000000);
  background: linear-gradient(
    135deg,
    var(--gui-accent-hover, #aeaeb2) 0%,
    var(--gui-accent, #8e8e93) 100%
  );
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms ease;
}

.pc-login-screen__button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-login-screen__button-text,
.pc-login-screen__button-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pc-login-screen__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pc-login-screen__card-footer {
  width: 100%;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.pc-login-card-footer__text {
  margin: 0;
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  opacity: 0.75;
}

@media (max-width: 480px) {
  .pc-login-screen__card-container {
    max-width: 100%;
    padding: 20px;
  }

  .pc-login-screen__card {
    padding: 48px 32px 24px;
    border-radius: 14px;
  }

  .pc-login-screen__input,
  .pc-login-screen__button,
  .pc-login-screen__code-button {
    height: 52px;
  }

  .pc-login-screen__code-row {
    grid-template-columns: minmax(0, 1fr) 112px;
  }
}
</style>

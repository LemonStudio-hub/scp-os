<template>
  <div class="login-screen" role="dialog" aria-label="SCP-OS 登录" aria-modal="true">
    <div class="login-screen__background">
      <div class="login-screen__gradient" />
      <div class="login-screen__pattern">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <circle cx="200" cy="400" r="180" :stroke="patternColor1" stroke-width="1" />
          <circle cx="200" cy="400" r="120" :stroke="patternColor2" stroke-width="1" />
          <circle cx="200" cy="400" r="60" :stroke="patternColor3" stroke-width="1" />
          <line x1="0" y1="400" x2="400" y2="400" :stroke="patternColor3" stroke-width="0.5" />
          <line x1="200" y1="0" x2="200" y2="800" :stroke="patternColor3" stroke-width="0.5" />
        </svg>
      </div>
    </div>

    <div class="login-screen__content">
      <div class="login-screen__logo-section" aria-hidden="true">
        <div class="login-screen__logo-container">
          <svg class="login-screen__logo" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="2" opacity="0.6" />
            <circle cx="40" cy="40" r="28" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
            <circle cx="40" cy="40" r="20" stroke="currentColor" stroke-width="1" opacity="0.2" />
            <text
              x="40"
              y="48"
              text-anchor="middle"
              font-family="'Courier New', monospace"
              font-size="20"
              font-weight="900"
              fill="currentColor"
              letter-spacing="2"
            >
              SCP
            </text>
          </svg>
        </div>
      </div>

      <h1 class="login-screen__title">欢迎</h1>
      <p class="login-screen__subtitle">选择进入方式并完成身份验证</p>

      <div class="login-screen__mode-tabs">
        <button
          v-for="item in modes"
          :key="item.id"
          type="button"
          class="login-screen__mode-tab"
          :class="{ 'login-screen__mode-tab--active': mode === item.id }"
          @click="setMode(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <form class="login-screen__form" aria-label="登录表单" @submit.prevent="handleLogin">
        <div v-if="mode !== 'guest'" class="login-screen__input-wrapper">
          <input
            v-model="email"
            type="email"
            class="login-screen__input"
            :class="{ 'login-screen__input--error': error }"
            placeholder="邮箱"
            autocomplete="email"
            @input="onInputChange"
          />
        </div>

        <div v-if="mode !== 'guest'" class="login-screen__input-wrapper">
          <input
            v-model="password"
            type="password"
            class="login-screen__input"
            :class="{ 'login-screen__input--error': error }"
            placeholder="密码，至少 8 位"
            autocomplete="current-password"
            @input="onInputChange"
          />
        </div>

        <div v-if="mode === 'register'" class="login-screen__code-row">
          <div class="login-screen__input-wrapper login-screen__input-wrapper--code">
            <input
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="login-screen__input"
              :class="{ 'login-screen__input--error': error }"
              placeholder="邮箱验证码"
              autocomplete="one-time-code"
              @input="onInputChange"
            />
          </div>
          <button
            type="button"
            class="login-screen__code-button"
            :disabled="sendCodeLoading || countdownSeconds > 0"
            @click="handleSendCode"
          >
            {{ sendCodeLabel }}
          </button>
        </div>

        <div v-if="mode !== 'login'" class="login-screen__input-wrapper">
          <label for="mobile-nickname-input" class="sr-only">工作代号</label>
          <input
            id="mobile-nickname-input"
            ref="inputRef"
            v-model="nickname"
            type="text"
            class="login-screen__input"
            :class="{
              'login-screen__input--error': error,
              'login-screen__input--focused': isFocused,
            }"
            placeholder="工作代号 / 昵称"
            maxlength="20"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'mobile-login-error' : undefined"
            @focus="isFocused = true"
            @blur="isFocused = false"
            @input="onInputChange"
          />
          <div v-if="nickname && !error" class="login-screen__input-clear" @click="clearInput">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>

        <transition name="error-fade">
          <p v-if="error" id="mobile-login-error" class="login-screen__error" role="alert">
            {{ error }}
          </p>
        </transition>

        <div
          v-if="mode !== 'login'"
          class="login-screen__char-count"
          :class="{ 'login-screen__char-count--warning': nickname.length >= 18 }"
        >
          {{ nickname.length }}/20
        </div>

        <button
          type="submit"
          class="login-screen__button"
          :class="{
            'login-screen__button--loading': isLoading,
            'login-screen__button--disabled': !isValid || isLoading,
          }"
          :disabled="!isValid || isLoading"
        >
          <span v-if="!isLoading" class="login-screen__button-text">{{ submitLabel }}</span>
          <span v-else class="login-screen__button-loading">
            <svg
              class="login-screen__spinner"
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
    </div>

    <footer class="login-screen__footer">
      <p class="login-screen__copyright">&copy; SCP Foundation &mdash; Secure. Contain. Protect.</p>
    </footer>
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
    console.error('[Login] Send code error:', err)
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
    console.error('[Login] Error:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const patternColor1 = 'rgba(142, 142, 147, 0.08)'
const patternColor2 = 'rgba(142, 142, 147, 0.05)'
const patternColor3 = 'rgba(63, 63, 66, 0.03)'

onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 600)
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.login-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--gui-bg-base, #1c1c1e);
  color: var(--gui-text-primary, #ffffff);
}

.login-screen__background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--gui-bg-base, #1c1c1e);
  overflow: hidden;
}

.login-screen__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 50% 30%,
      var(--gui-wallpaper-gradient1, rgba(142, 142, 147, 0.08)) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 30% 70%,
      var(--gui-wallpaper-gradient2, rgba(142, 142, 147, 0.05)) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 70% 80%,
      var(--gui-wallpaper-gradient3, rgba(63, 63, 66, 0.03)) 0%,
      transparent 40%
    );
}

.login-screen__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}

.login-screen__content {
  position: relative;
  z-index: 5;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.login-screen__logo-section {
  margin-bottom: 32px;
}

.login-screen__logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-screen__logo {
  color: var(--gui-text-primary, #ffffff);
  filter: drop-shadow(0 0 20px rgba(142, 142, 147, 0.3));
}

.login-screen__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
}

.login-screen__subtitle {
  margin: 0 0 32px;
  font-size: 13px;
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
}

.login-screen__mode-tabs {
  width: 100%;
  max-width: 340px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.login-screen__mode-tab {
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.login-screen__mode-tab--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--gui-text-primary, #ffffff);
}

.login-screen__form {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-screen__input-wrapper {
  position: relative;
  width: 100%;
}

.login-screen__code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 8px;
}

.login-screen__input {
  width: 100%;
  height: 52px;
  padding: 0 20px;
  padding-right: 44px;
  font-size: 15px;
  color: var(--gui-text-primary, #ffffff);
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid transparent;
  border-radius: 12px;
  outline: none;
  transition: all 200ms ease;
}

.login-screen__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.login-screen__input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.08);
}

.login-screen__input--focused,
.login-screen__input:focus {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 3px rgba(142, 142, 147, 0.15);
}

.login-screen__input--error {
  border-color: var(--gui-error, #ff3b30);
  background: rgba(255, 59, 48, 0.05);
}

.login-screen__input-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  color: var(--gui-text-tertiary, #636366);
  border-radius: 9999px;
}

.login-screen__code-button {
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--gui-text-primary, #ffffff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.login-screen__code-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.14);
}

.login-screen__code-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.login-screen__error {
  margin: 0;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-error, #ff3b30);
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.login-screen__char-count {
  align-self: flex-end;
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
}

.login-screen__char-count--warning {
  color: var(--gui-warning, #ffcc00);
}

.login-screen__button {
  width: 100%;
  height: 52px;
  margin-top: 12px;
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

.login-screen__button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.login-screen__button-loading,
.login-screen__button-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-screen__spinner {
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

.login-screen__footer {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 20px 24px;
  text-align: center;
}

.login-screen__copyright {
  margin: 0;
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  opacity: 0.7;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 480px) {
  .login-screen__content {
    padding: 48px 20px;
  }

  .login-screen__form {
    max-width: 300px;
  }

  .login-screen__input,
  .login-screen__button,
  .login-screen__code-button {
    height: 48px;
  }

  .login-screen__code-row {
    grid-template-columns: minmax(0, 1fr) 104px;
  }
}

/* ── Reduced Motion Support ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Light Mode Overrides ─────────────────────────────────────────── */
.light .login-screen__input {
  background: var(--gui-bg-surface-hover, rgba(0, 0, 0, 0.04));
  border-color: var(--gui-border-default, rgba(0, 0, 0, 0.1));
}
.light .login-screen__input:hover {
  background: var(--gui-bg-surface-active, rgba(0, 0, 0, 0.06));
}
.light .login-screen__input:focus {
  background: var(--gui-bg-surface, #fff);
  border-color: var(--gui-accent, #636366);
  box-shadow: 0 0 0 3px var(--gui-accent-glow, rgba(99, 99, 102, 0.15));
}
.light
  .login-screen__button:hover:not(.login-screen__button--disabled):not(
    .login-screen__button--loading
  ) {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.04);
}
.light
  .login-screen__button:active:not(.login-screen__button--disabled):not(
    .login-screen__button--loading
  ) {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
}
</style>

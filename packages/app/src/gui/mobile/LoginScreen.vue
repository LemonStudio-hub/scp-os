<template>
  <div class="login-screen">
    <!-- Background with gradient and pattern (same as HomeScreen) -->
    <div class="login-screen__background">
      <div class="login-screen__gradient" />
      <div class="login-screen__pattern">
        <svg width="100%" height="100%" viewBox="0 0 400 800" fill="none">
          <circle cx="200" cy="400" r="180" :stroke="patternColor1" stroke-width="1"/>
          <circle cx="200" cy="400" r="120" :stroke="patternColor2" stroke-width="1"/>
          <circle cx="200" cy="400" r="60" :stroke="patternColor3" stroke-width="1"/>
          <line x1="0" y1="400" x2="400" y2="400" :stroke="patternColor3" stroke-width="0.5"/>
          <line x1="200" y1="0" x2="200" y2="800" :stroke="patternColor3" stroke-width="0.5"/>
        </svg>
      </div>
    </div>

    <!-- Main Content -->
    <div class="login-screen__content">
      <!-- Logo Section -->
      <div class="login-screen__logo-section">
        <div class="login-screen__logo-container">
          <!-- SCP Foundation Logo -->
          <svg class="login-screen__logo" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="2" opacity="0.6"/>
            <circle cx="40" cy="40" r="28" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
            <circle cx="40" cy="40" r="20" stroke="currentColor" stroke-width="1" opacity="0.2"/>
            <text
              x="40"
              y="48"
              text-anchor="middle"
              font-family="'Courier New', monospace"
              font-size="20"
              font-weight="900"
              fill="currentColor"
              letter-spacing="2"
            >SCP</text>
          </svg>
        </div>
      </div>

      <!-- Welcome Text -->
      <h1 class="login-screen__title">欢迎</h1>
      <p class="login-screen__subtitle">输入您的工作代号以开始</p>

      <!-- Login Form -->
      <form class="login-screen__form" @submit.prevent="handleLogin">
        <!-- Input Field -->
        <div class="login-screen__input-wrapper">
          <input
            ref="inputRef"
            v-model="nickname"
            type="text"
            class="login-screen__input"
            :class="{ 'login-screen__input--error': error, 'login-screen__input--focused': isFocused }"
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
          <div v-if="nickname && !error" class="login-screen__input-clear" @click="clearInput">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Error Message -->
        <transition name="error-fade">
          <p v-if="error" class="login-screen__error">{{ error }}</p>
        </transition>

        <!-- Character Count -->
        <div class="login-screen__char-count" :class="{ 'login-screen__char-count--warning': nickname.length >= 18 }">
          {{ nickname.length }}/20
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="login-screen__button"
          :class="{ 'login-screen__button--loading': isLoading, 'login-screen__button--disabled': !isValid || isLoading }"
          :disabled="!isValid || isLoading"
        >
          <span v-if="!isLoading" class="login-screen__button-text">进入系统</span>
          <span v-else class="login-screen__button-loading">
            <svg class="login-screen__spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
              <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            验证中...
          </span>
        </button>
      </form>
    </div>

    <!-- Footer -->
    <footer class="login-screen__footer">
      <p class="login-screen__copyright">&copy; SCP Foundation &mdash; Secure. Contain. Protect.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const emit = defineEmits<{
  'login-success': []
}>()

const authStore = useAuthStore()
const nickname = ref('')
const isLoading = ref(false)
const error = ref('')
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Validation: 2-20 characters, only letters, numbers, underscores, Chinese
const isValid = computed(() => {
  const value = nickname.value.trim()
  if (!value) return false
  if (value.length < 2 || value.length > 20) return false
  const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
  return regex.test(value)
})

function clearInput(): void {
  nickname.value = ''
  error.value = ''
  inputRef.value?.focus()
}

function onInputChange(): void {
  // Clear error when user starts typing
  if (error.value) {
    error.value = ''
  }
}

async function handleLogin(): void {
  const trimmedNickname = nickname.value.trim()

  // Client-side validation
  if (!trimmedNickname) {
    error.value = '请输入工作代号'
    return
  }

  if (trimmedNickname.length < 2) {
    error.value = '工作代号至少需要 2 个字符'
    return
  }

  if (trimmedNickname.length > 20) {
    error.value = '工作代号不能超过 20 个字符'
    return
  }

  const regex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
  if (!regex.test(trimmedNickname)) {
    error.value = '只允许字母、数字、下划线和中文'
    return
  }

  // Proceed with login
  error.value = ''
  isLoading.value = true

  try {
    const result = await authStore.login(trimmedNickname)
    if (result.success) {
      emit('login-success')
    } else {
      error.value = result.error || '登录失败，请重试'
    }
  } catch (e) {
    console.error('[Login] Error:', e)
    error.value = '网络错误，请检查连接后重试'
  } finally {
    isLoading.value = false
  }
}

// Pattern colors from theme store (fallback to design tokens)
const patternColor1 = 'rgba(142, 142, 147, 0.08)'
const patternColor2 = 'rgba(142, 142, 147, 0.05)'
const patternColor3 = 'rgba(63, 63, 66, 0.03)'

// Auto-focus input on mount
onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 600) // Wait for entrance animation to complete
})
</script>

<style scoped>
/* ── Main Container ─────────────────────────────────────────────── */
.login-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--gui-bg-base, #1C1C1E);
  color: var(--gui-text-primary, #FFFFFF);
}

/* ── Background Layer ───────────────────────────────────────────── */
.login-screen__background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--gui-bg-base, #1C1C1E);
  overflow: hidden;
}

.login-screen__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1, rgba(142, 142, 147, 0.08)) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2, rgba(142, 142, 147, 0.05)) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3, rgba(63, 63, 66, 0.03)) 0%, transparent 40%);
}

.login-screen__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.5;
}

/* ── Main Content ───────────────────────────────────────────────── */
.login-screen__content {
  position: relative;
  z-index: 5;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--gui-spacing-4xl, 60px) var(--gui-spacing-xl, 24px);
  animation: login-content-enter 0.7s var(--ease-ios-spring, cubic-bezier(0.32, 0.72, 0, 1)) both;
}

@keyframes login-content-enter {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Logo Section ───────────────────────────────────────────────── */
.login-screen__logo-section {
  margin-bottom: var(--gui-spacing-2xl, 32px);
  animation: logo-enter 0.6s var(--ease-ios-bounce, cubic-bezier(0.34, 1.56, 0.64, 1)) 0.15s both;
}

@keyframes logo-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.login-screen__logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-screen__logo {
  color: var(--gui-text-primary, #FFFFFF);
  filter: drop-shadow(0 0 20px rgba(142, 142, 147, 0.3));
  animation: subtle-glow 3s ease-in-out infinite;
}

@keyframes subtle-glow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(142, 142, 147, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(142, 142, 147, 0.5));
  }
}

/* ── Typography ─────────────────────────────────────────────────── */
.login-screen__title {
  margin: 0 0 var(--gui-spacing-sm, 8px);
  font-family: var(--gui-font-sans, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif);
  font-size: var(--gui-font-3xl, 28px);
  font-weight: var(--gui-font-weight-bold, 700);
  letter-spacing: 0.02em;
  text-align: center;
  background: linear-gradient(
    135deg,
    var(--gui-text-primary, #FFFFFF) 0%,
    var(--gui-text-secondary, #8E8E93) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: title-shimmer 3s ease-in-out infinite;
  background-size: 200% 200%;
}

@keyframes title-shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.login-screen__subtitle {
  margin: 0 0 var(--gui-spacing-3xl, 48px);
  font-size: var(--gui-font-sm, 12px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-secondary, #8E8E93);
  text-align: center;
  letter-spacing: 0.02em;
  animation: subtitle-fade-in 0.5s ease 0.3s both;
}

@keyframes subtitle-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Form ───────────────────────────────────────────────────────── */
.login-screen__form {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-md, 12px);
  animation: form-slide-up 0.5s var(--ease-ios-gentle, cubic-bezier(0.25, 0.46, 0.45, 0.94)) 0.35s both;
}

@keyframes form-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Input Field ────────────────────────────────────────────────── */
.login-screen__input-wrapper {
  position: relative;
  width: 100%;
}

.login-screen__input {
  width: 100%;
  height: 52px;
  padding: 0 var(--gui-spacing-lg, 20px);
  padding-right: 44px; /* Space for clear button */
  font-family: var(--gui-font-sans, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif);
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #FFFFFF);
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid transparent;
  border-radius: var(--gui-radius-lg, 12px);
  outline: none;
  transition: all var(--gui-transition-base, 200ms ease);
  -webkit-tap-highlight-color: transparent;
}

.login-screen__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
  font-weight: var(--gui-font-weight-normal, 400);
}

.login-screen__input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.08);
}

.login-screen__input--focused,
.login-screen__input:focus {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--gui-accent, #8E8E93);
  box-shadow:
    0 0 0 3px rgba(142, 142, 147, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.2);
}

.login-screen__input--error {
  border-color: var(--gui-error, #FF3B30);
  background: rgba(255, 59, 48, 0.05);
}

.login-screen__input--error:focus {
  border-color: var(--gui-error, #FF3B30);
  box-shadow:
    0 0 0 3px rgba(255, 59, 48, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Clear Button */
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
  border-radius: var(--gui-radius-full, 9999px);
  transition: all var(--gui-transition-fast, 120ms ease);
  -webkit-tap-highlight-color: transparent;
}

.login-screen__input-clear:hover {
  color: var(--gui-text-primary, #FFFFFF);
  background: rgba(255, 255, 255, 0.1);
}

.login-screen__input-clear:active {
  transform: translateY(-50%) scale(0.9);
}

/* ── Error Message ──────────────────────────────────────────────── */
.login-screen__error {
  margin: 0;
  padding: 0 var(--gui-spacing-sm, 8px);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-error, #FF3B30);
  line-height: var(--gui-line-height-tight, 1.3);
}

.error-fade-enter-active {
  transition: all 0.25s ease;
}

.error-fade-leave-active {
  transition: all 0.2s ease;
}

.error-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Character Count ────────────────────────────────────────────── */
.login-screen__char-count {
  align-self: flex-end;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-normal, 400);
  color: var(--gui-text-tertiary, #636366);
  transition: color var(--gui-transition-fast, 120ms ease);
}

.login-screen__char-count--warning {
  color: var(--gui-warning, #FFCC00);
}

/* ── Submit Button ──────────────────────────────────────────────── */
.login-screen__button {
  position: relative;
  width: 100%;
  height: 52px;
  margin-top: var(--gui-spacing-md, 12px);
  font-family: var(--gui-font-sans, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif);
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-inverse, #000000);
  background: linear-gradient(
    135deg,
    var(--gui-accent-hover, #AEAEB2) 0%,
    var(--gui-accent, #8E8E93) 100%
  );
  border: none;
  border-radius: var(--gui-radius-lg, 12px);
  cursor: pointer;
  overflow: hidden;
  transition: all var(--gui-transition-base, 200ms ease);
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
}

.login-screen__button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity var(--gui-transition-fast, 120ms ease);
}

.login-screen__button:hover:not(.login-screen__button--disabled):not(.login-screen__button--loading) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(142, 142, 147, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.2);
}

.login-screen__button:hover:not(.login-screen__button--disabled):not(.login-screen__button--loading)::before {
  opacity: 1;
}

.login-screen__button:active:not(.login-screen__button--disabled):not(.login-screen__button--loading) {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 4px 12px rgba(142, 142, 147, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.login-screen__button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.login-screen__button--loading {
  cursor: wait;
}

.login-screen__button-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-sm, 8px);
}

.login-screen__button-loading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-sm, 8px);
}

/* Spinner Animation */
.login-screen__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Footer ─────────────────────────────────────────────────────── */
.login-screen__footer {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: var(--gui-spacing-lg, 20px) var(--gui-spacing-xl, 24px);
  padding-bottom: max(var(--gui-spacing-lg, 20px), env(safe-area-inset-bottom, 20px));
  text-align: center;
  animation: footer-fade-in 0.5s ease 0.6s both;
}

@keyframes footer-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.login-screen__copyright {
  margin: 0;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-normal, 400);
  color: var(--gui-text-tertiary, #636366);
  letter-spacing: 0.04em;
  opacity: 0.7;
}

/* ── Responsive Adjustments ─────────────────────────────────────── */
@media (max-width: 480px) {
  .login-screen__content {
    padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-lg, 20px);
  }

  .login-screen__logo svg {
    width: 70px;
    height: 70px;
  }

  .login-screen__title {
    font-size: 26px;
  }

  .login-screen__subtitle {
    margin-bottom: var(--gui-spacing-2xl, 32px);
  }

  .login-screen__form {
    max-width: 300px;
  }

  .login-screen__input,
  .login-screen__button {
    height: 48px;
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
</style>

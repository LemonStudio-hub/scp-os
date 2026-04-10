<template>
  <div class="pc-login-screen">
    <!-- Background (same as DesktopScreen) -->
    <div class="pc-login-screen__background">
      <div class="pc-login-screen__gradient" />
      <div class="pc-login-screen__pattern">
        <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="360" :stroke="patternColor1" stroke-width="1"/>
          <circle cx="400" cy="400" r="240" :stroke="patternColor2" stroke-width="1"/>
          <circle cx="400" cy="400" r="120" :stroke="patternColor3" stroke-width="1"/>
          <line x1="0" y1="400" x2="800" y2="400" :stroke="patternColor3" stroke-width="0.5"/>
          <line x1="400" y1="0" x2="400" y2="800" :stroke="patternColor3" stroke-width="0.5"/>
        </svg>
      </div>
    </div>

    <!-- Centered Login Card -->
    <div class="pc-login-screen__card-container">
      <div class="pc-login-screen__card">
        <!-- Card Inner Glow Effect -->
        <div class="pc-login-screen__card-glow" />

        <!-- Logo Section -->
        <div class="pc-login-screen__logo-section">
          <div class="pc-login-screen__logo-container">
            <!-- SCP Foundation Logo (larger for desktop) -->
            <svg class="pc-login-screen__logo" width="100" height="100" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
              <circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="2" opacity="0.4"/>
              <circle cx="50" cy="50" r="25" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
              <text
                x="50"
                y="60"
                text-anchor="middle"
                font-family="'Courier New', monospace"
                font-size="26"
                font-weight="900"
                fill="currentColor"
                letter-spacing="3"
              >SCP</text>
            </svg>
          </div>
        </div>

        <!-- Welcome Text -->
        <h1 class="pc-login-screen__title">欢迎回来</h1>
        <p class="pc-login-screen__subtitle">输入您的工作代号以访问系统</p>

        <!-- Login Form -->
        <form class="pc-login-screen__form" @submit.prevent="handleLogin">
          <!-- Input Field Group -->
          <div class="pc-login-screen__input-group">
            <label class="pc-login-screen__label" for="nickname-input">工作代号</label>
            <div class="pc-login-screen__input-wrapper">
              <input
                ref="inputRef"
                id="nickname-input"
                v-model="nickname"
                type="text"
                class="pc-login-screen__input"
                :class="{ 'pc-login-screen__input--error': error, 'pc-login-screen__input--focused': isFocused }"
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
              <div v-if="nickname && !error" class="pc-login-screen__input-clear" @click="clearInput">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <!-- Error Message -->
            <transition name="error-slide">
              <p v-if="error" class="pc-login-screen__error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
                  <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <circle cx="7" cy="10" r="0.6" fill="currentColor"/>
                </svg>
                {{ error }}
              </p>
            </transition>
          </div>

          <!-- Character Count & Validation Hint -->
          <div class="pc-login-screen__meta-row">
            <span class="pc-login-screen__char-count" :class="{ 'pc-login-screen__char-count--warning': nickname.length >= 18 }">
              {{ nickname.length }}/20 字符
            </span>
            <span v-if="!isValid && nickname.length > 0" class="pc-login-screen__hint">
              需要至少 2 个字符
            </span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="pc-login-screen__button"
            :class="{ 'pc-login-screen__button--loading': isLoading, 'pc-login-screen__button--disabled': !isValid || isLoading }"
            :disabled="!isValid || isLoading"
          >
            <span v-if="!isLoading" class="pc-login-screen__button-text">
              进入系统
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3l5 5m0 0l-5 5m5-5H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-else class="pc-login-screen__button-loading">
              <svg class="pc-login-screen__spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.25"/>
                <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              正在验证身份...
            </span>
          </button>
        </form>

        <!-- Footer Text inside Card -->
        <div class="pc-login-screen__card-footer">
          <p class="pc-login-card-footer__text">SCP Foundation &mdash; 安全、收容、保护</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'

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
  if (error.value) {
    error.value = ''
  }
}

async function handleLogin(): Promise<void> {
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
    console.error('[PCLogin] Error:', e)
    error.value = '网络错误，请检查连接后重试'
  } finally {
    isLoading.value = false
  }
}

// Pattern colors from theme store (fallback to design tokens)
const patternColor1 = 'rgba(255, 255, 255, 0.06)'
const patternColor2 = 'rgba(255, 255, 255, 0.08)'
const patternColor3 = 'rgba(63, 63, 66, 0.03)'

// Auto-focus input on mount
onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 700) // Wait for card entrance animation to complete
})
</script>

<style scoped>
/* ── Main Container ─────────────────────────────────────────────── */
.pc-login-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-base, #1C1C1E);
}

/* ── Background Layer ───────────────────────────────────────────── */
.pc-login-screen__background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--gui-bg-base, #1C1C1E);
  overflow: hidden;
}

.pc-login-screen__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, var(--gui-wallpaper-gradient1, rgba(142, 142, 147, 0.08)) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, var(--gui-wallpaper-gradient2, rgba(142, 142, 147, 0.05)) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, var(--gui-wallpaper-gradient3, rgba(63, 63, 66, 0.03)) 0%, transparent 40%);
}

.pc-login-screen__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

/* ── Card Container (centered) ───────────────────────────────────── */
.pc-login-screen__card-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: var(--gui-spacing-xl, 24px);
  animation: card-enter 0.65s var(--ease-ios-spring, cubic-bezier(0.32, 0.72, 0, 1)) both;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Glass Card ─────────────────────────────────────────────────── */
.pc-login-screen__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--gui-spacing-4xl, 60px) var(--gui-spacing-3xl, 48px) var(--gui-spacing-2xl, 32px);
  background: rgba(44, 44, 46, 0.75); /* glassBg */
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: var(--radius-squircle-2xl, 24px);
  border: 1px solid rgba(255, 255, 255, 0.08); /* glassBorder */
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.5), /* xl shadow */
    0 8px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* Inner glow effect */
.pc-login-screen__card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(142, 142, 147, 0.04) 0%,
    transparent 60%
  );
  pointer-events: none;
  animation: card-glow-shift 8s ease-in-out infinite alternate;
}

@keyframes card-glow-shift {
  from {
    transform: translate(-10%, -10%);
  }
  to {
    transform: translate(10%, 10%);
  }
}

/* ── Logo Section ───────────────────────────────────────────────── */
.pc-login-screen__logo-section {
  margin-bottom: var(--gui-spacing-2xl, 32px);
  animation: logo-pop-in 0.55s var(--ease-ios-bounce, cubic-bezier(0.34, 1.56, 0.64, 1)) 0.15s both;
}

@keyframes logo-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.7) rotate(-5deg);
  }
  60% {
    transform: scale(1.05) rotate(1deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.pc-login-screen__logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pc-login-screen__logo {
  color: var(--gui-text-primary, #FFFFFF);
  filter: drop-shadow(0 0 30px rgba(142, 142, 147, 0.35));
  animation: pc-logo-glow 4s ease-in-out infinite;
  transition: filter var(--gui-transition-base, 200ms ease);
}

.pc-login-screen__logo:hover {
  filter: drop-shadow(0 0 45px rgba(142, 142, 147, 0.5));
}

@keyframes pc-logo-glow {
  0%, 100% {
    filter: drop-shadow(0 0 30px rgba(142, 142, 147, 0.35));
  }
  50% {
    filter: drop-shadow(0 0 45px rgba(142, 142, 147, 0.55));
  }
}

/* ── Typography ─────────────────────────────────────────────────── */
.pc-login-screen__title {
  margin: 0 0 var(--gui-spacing-sm, 8px);
  font-family: var(--gui-font-sans, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif);
  font-size: var(--gui-font-3xl, 28px);
  font-weight: var(--gui-font-weight-bold, 700);
  letter-spacing: 0.02em;
  text-align: center;
  color: var(--gui-text-primary, #FFFFFF);
  animation: title-fade-up 0.5s ease 0.25s both;
}

@keyframes title-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pc-login-screen__subtitle {
  margin: 0 0 var(--gui-spacing-3xl, 48px);
  font-size: var(--gui-font-base, 13px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-secondary, #8E8E93);
  text-align: center;
  letter-spacing: 0.01em;
  animation: subtitle-fade-up 0.5s ease 0.32s both;
}

@keyframes subtitle-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Form ───────────────────────────────────────────────────────── */
.pc-login-screen__form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-md, 12px);
  animation: form-fade-up 0.5s var(--ease-ios-gentle, cubic-bezier(0.25, 0.46, 0.45, 0.94)) 0.4s both;
}

@keyframes form-fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Input Group ────────────────────────────────────────────────── */
.pc-login-screen__input-group {
  display: flex;
  flex-direction: column;
  gap: var(--gui-spacing-xs, 4px);
}

.pc-login-screen__label {
  display: block;
  margin-bottom: var(--gui-spacing-xs, 4px);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-semibold, 600);
  color: var(--gui-text-secondary, #8E8E93);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Input Field ────────────────────────────────────────────────── */
.pc-login-screen__input-wrapper {
  position: relative;
  width: 100%;
}

.pc-login-screen__input {
  width: 100%;
  height: 56px; /* Larger than mobile */
  padding: 0 var(--gui-spacing-lg, 20px);
  padding-right: 48px; /* Space for clear button */
  font-family: var(--gui-font-sans, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif);
  font-size: var(--gui-font-lg, 15px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-text-primary, #FFFFFF);
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--gui-radius-lg, 12px);
  outline: none;
  transition: all var(--gui-transition-base, 200ms ease);
}

.pc-login-screen__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
  font-weight: var(--gui-font-weight-normal, 400);
}

.pc-login-screen__input:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
}

.pc-login-screen__input--focused,
.pc-login-screen__input:focus {
  background: rgba(255, 255, 255, 0.09);
  border-color: var(--gui-accent, #8E8E93);
  box-shadow:
    0 0 0 4px rgba(142, 142, 147, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.25);
}

.pc-login-screen__input--error {
  border-color: var(--gui-error, #FF3B30);
  background: rgba(255, 59, 48, 0.04);
}

.pc-login-screen__input--error:focus {
  border-color: var(--gui-error, #FF3B30);
  box-shadow:
    0 0 0 4px rgba(255, 59, 48, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.25);
}

/* Clear Button */
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
  border-radius: var(--gui-radius-full, 9999px);
  transition: all var(--gui-transition-fast, 120ms ease);
}

.pc-login-screen__input-clear:hover {
  color: var(--gui-text-primary, #FFFFFF);
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-50%) scale(1.05);
}

.pc-login-screen__input-clear:active {
  transform: translateY(-50%) scale(0.92);
}

/* ── Error Message ──────────────────────────────────────────────── */
.pc-login-screen__error {
  display: flex;
  align-items: center;
  gap: var(--gui-spacing-xs, 4px);
  margin: var(--gui-spacing-xs, 4px) 0 0;
  padding: 0 var(--gui-spacing-sm, 8px);
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-medium, 500);
  color: var(--gui-error, #FF3B30);
  line-height: var(--gui-line-height-tight, 1.3);
}

.pc-login-screen__error svg {
  flex-shrink: 0;
  opacity: 0.85;
}

.error-slide-enter-active {
  transition: all 0.3s var(--ease-ios-spring, cubic-bezier(0.32, 0.72, 0, 1));
}

.error-slide-leave-active {
  transition: all 0.25s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Meta Row (char count + hint) ───────────────────────────────── */
.pc-login-screen__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gui-spacing-sm, 8px);
}

.pc-login-screen__char-count {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-normal, 400);
  color: var(--gui-text-tertiary, #636366);
  transition: color var(--gui-transition-fast, 120ms ease);
}

.pc-login-screen__char-count--warning {
  color: var(--gui-warning, #FFCC00);
}

.pc-login-screen__hint {
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-normal, 400);
  color: var(--gui-text-tertiary, #636366);
  font-style: italic;
}

/* ── Submit Button ──────────────────────────────────────────────── */
.pc-login-screen__button {
  position: relative;
  width: 100%;
  height: 56px; /* Larger than mobile */
  margin-top: var(--gui-spacing-lg, 20px);
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
  will-change: transform, box-shadow;
}

.pc-login-screen__button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.22) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity var(--gui-transition-fast, 120ms ease);
}

.pc-login-screen__button::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transition: left 0.6s ease;
}

.pc-login-screen__button:hover:not(.pc-login-screen__button--disabled):not(.pc-login-screen__button--loading) {
  transform: translateY(-3px) scale(1.01);
  box-shadow:
    0 12px 32px rgba(142, 142, 147, 0.45),
    0 6px 12px rgba(0, 0, 0, 0.25);
}

.pc-login-screen__button:hover:not(.pc-login-screen__button--disabled):not(.pc-login-screen__button--loading)::before {
  opacity: 1;
}

.pc-login-screen__button:hover:not(.pc-login-screen__button--disabled):not(.pc-login-screen__button--loading)::after {
  left: 100%;
}

.pc-login-screen__button:active:not(.pc-login-screen__button--disabled):not(.pc-login-screen__button--loading) {
  transform: translateY(-1px) scale(0.99);
  box-shadow:
    0 6px 16px rgba(142, 142, 147, 0.35),
    0 3px 6px rgba(0, 0, 0, 0.2);
}

.pc-login-screen__button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-login-screen__button--loading {
  cursor: wait;
}

.pc-login-screen__button-text {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-sm, 8px);
}

.pc-login-screen__button-loading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gui-spacing-sm, 8px);
}

/* Spinner Animation */
.pc-login-screen__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Card Footer ────────────────────────────────────────────────── */
.pc-login-screen__card-footer {
  width: 100%;
  margin-top: var(--gui-spacing-2xl, 32px);
  padding-top: var(--gui-spacing-lg, 20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
  animation: footer-fade-in 0.5s ease 0.55s both;
}

@keyframes footer-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.pc-login-card-footer__text {
  margin: 0;
  font-size: var(--gui-font-xs, 11px);
  font-weight: var(--gui-font-weight-normal, 400);
  color: var(--gui-text-tertiary, #636366);
  letter-spacing: 0.04em;
  opacity: 0.75;
}

/* ── Responsive Adjustments ─────────────────────────────────────── */
@media (max-width: 480px) {
  .pc-login-screen__card-container {
    max-width: 100%;
    padding: var(--gui-spacing-lg, 20px);
  }

  .pc-login-screen__card {
    padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-2xl, 32px) var(--gui-spacing-xl, 24px);
    border-radius: var(--gui-radius-xl, 14px);
  }

  .pc-login-screen__logo {
    width: 80px;
    height: 80px;
  }

  .pc-login-screen__title {
    font-size: 26px;
  }

  .pc-login-screen__subtitle {
    margin-bottom: var(--gui-spacing-2xl, 32px);
  }

  .pc-login-screen__input,
  .pc-login-screen__button {
    height: 52px;
  }
}

@media (max-height: 700px) {
  .pc-login-screen__card {
    padding: var(--gui-spacing-3xl, 48px) var(--gui-spacing-2xl, 32px) var(--gui-spacing-xl, 24px);
  }

  .pc-login-screen__logo-section {
    margin-bottom: var(--gui-spacing-xl, 24px);
  }

  .pc-login-screen__subtitle {
    margin-bottom: var(--gui-spacing-2xl, 32px);
  }

  .pc-login-screen__card-footer {
    margin-top: var(--gui-spacing-xl, 24px);
    padding-top: var(--gui-spacing-md, 12px);
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

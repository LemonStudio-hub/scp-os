<template>
  <div class="pc-login-screen">
    <!-- Outer ring cursor (companion to global dot cursor) -->
    <div
      v-if="!isTouch"
      class="pc-login-cursor"
      ref="cursorRef"
      :class="{
        'pc-login-cursor--magnetic': isCursorMagnetic,
        'pc-login-cursor--typing': isCursorTyping,
      }"
      aria-hidden="true"
    />

    <!-- Aurora ambient glow following cursor -->
    <div v-if="!isTouch" class="pc-login-aurora" ref="auroraRef" aria-hidden="true" />

    <!-- Background -->
    <div class="pc-login-screen__background" :style="bgGridStyle">
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

    <!-- Theme picker (top-right) — 5 swatches -->
    <div class="pc-login-theme-picker" role="group" aria-label="选择主题">
      <button
        v-for="theme in themeStore.availableThemes"
        :key="theme.id"
        class="pc-login-theme-swatch"
        :class="{ 'pc-login-theme-swatch--active': themeStore.currentThemeId === theme.id }"
        :style="{ '--swatch-color': theme.colors.accent }"
        :title="theme.name"
        :aria-label="`切换到 ${theme.name} 主题`"
        @click="themeStore.setTheme(theme.id)"
      />
    </div>

    <!-- Card (perspective set on container for 3D tilt) -->
    <div class="pc-login-screen__card-container">
      <div class="pc-login-screen__card" ref="cardRef">
        <div class="pc-login-screen__card-glow" />

        <!-- SCP Logo -->
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

        <!-- Mode tabs -->
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
                @mousemove="onBtnMouseMove"
              >
                <div class="pc-login-btn-wash" />
                <span class="pc-login-btn-text">{{ sendCodeLabel }}</span>
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
            @mousemove="onBtnMouseMove"
          >
            <div class="pc-login-btn-wash" />
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
import { useThemeStore } from '../stores/themeStore'

const emit = defineEmits<{
  'login-success': []
}>()

type LoginMode = 'guest' | 'login' | 'register'

const authStore = useAuthStore()
const themeStore = useThemeStore()

const modes: { id: LoginMode; label: string }[] = [
  { id: 'guest', label: '游客' },
  { id: 'login', label: '邮箱登录' },
  { id: 'register', label: '邮箱注册' },
]

// ── Form state ───────────────────────────────────────────────────────
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

// ── Animation refs ───────────────────────────────────────────────────
const cursorRef = ref<HTMLDivElement | null>(null)
const auroraRef = ref<HTMLDivElement | null>(null)
const cardRef = ref<HTMLDivElement | null>(null)
const isCursorMagnetic = ref(false)
const isCursorTyping = ref(false)

const isTouch =
  typeof window !== 'undefined' ? !window.matchMedia('(pointer: fine)').matches : false

// Animation state (not reactive — updated every frame)
let cx = 0,
  cy = 0,
  cTx = 0,
  cTy = 0
let ax = 0,
  ay = 0
let rX = 0,
  rY = 0,
  rTX = 0,
  rTY = 0
let rafId: number | null = null

function animLoop() {
  cx += (cTx - cx) * 0.14
  cy += (cTy - cy) * 0.14
  ax += (cTx - ax) * 0.07
  ay += (cTy - ay) * 0.07
  rX += (rTX - rX) * 0.1
  rY += (rTY - rY) * 0.1

  if (cursorRef.value) {
    cursorRef.value.style.left = `${cx}px`
    cursorRef.value.style.top = `${cy}px`
  }
  if (auroraRef.value) {
    auroraRef.value.style.left = `${ax}px`
    auroraRef.value.style.top = `${ay}px`
  }
  if (cardRef.value && window.innerWidth >= 900) {
    cardRef.value.style.transform = `perspective(1200px) rotateX(${rX}deg) rotateY(${rY}deg)`
  }

  rafId = requestAnimationFrame(animLoop)
}

function onMouseMove(e: MouseEvent) {
  cTx = e.clientX
  cTy = e.clientY

  // Determine cursor state from element under pointer
  const target = e.target as HTMLElement
  const isInput = !!target.closest('input, textarea')
  const isBtn = !isInput && !!target.closest('button:not([disabled]), a, [role="button"]')
  const anyInputFocused = document.activeElement?.matches('input, textarea') ?? false

  isCursorTyping.value = isInput || anyInputFocused
  isCursorMagnetic.value = isBtn && !anyInputFocused

  // 3D tilt based on mouse over the card
  if (cardRef.value) {
    const rect = cardRef.value.getBoundingClientRect()
    const dx = e.clientX - rect.left - rect.width / 2
    const dy = e.clientY - rect.top - rect.height / 2
    rTX = -(dy / rect.height) * 4
    rTY = (dx / rect.width) * 4
  }
}

function onMouseLeave() {
  rTX = 0
  rTY = 0
  isCursorMagnetic.value = false
  isCursorTyping.value = false
}

// Position the wash ripple origin from mouse on each button
function onBtnMouseMove(e: MouseEvent) {
  const btn = e.currentTarget as HTMLButtonElement
  const wash = btn.querySelector('.pc-login-btn-wash') as HTMLDivElement | null
  if (!wash) return
  const rect = btn.getBoundingClientRect()
  wash.style.setProperty('--wash-x', `${e.clientX - rect.left}px`)
  wash.style.setProperty('--wash-y', `${e.clientY - rect.top}px`)
}

// ── Form computed ────────────────────────────────────────────────────
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

// ── Background & pattern ─────────────────────────────────────────────
const isDark = computed(() => themeStore.currentTheme.isDark)

const bgGridStyle = computed(() => ({
  backgroundImage: `radial-gradient(${isDark.value ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)'} 1px, transparent 0)`,
  backgroundSize: '24px 24px',
}))

const patternColor1 = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
)
const patternColor2 = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
)
const patternColor3 = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'
)

// ── Form handlers ────────────────────────────────────────────────────
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

onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 700)

  if (isTouch) return

  // Hide the global CursorEffect dot while login screen is active
  const style = document.createElement('style')
  style.id = 'pc-login-cursor-override'
  style.textContent = '.cur-wrap { display: none !important; }'
  document.head.appendChild(style)

  // Init cursor & aurora to viewport center
  cx = cTx = ax = window.innerWidth / 2
  cy = cTy = ay = window.innerHeight / 2

  rafId = requestAnimationFrame(animLoop)
  document.addEventListener('mousemove', onMouseMove)
  document.documentElement.addEventListener('mouseleave', onMouseLeave)
})

onUnmounted(() => {
  stopCountdown()
  document.getElementById('pc-login-cursor-override')?.remove()
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (!isTouch) {
    document.removeEventListener('mousemove', onMouseMove)
    document.documentElement.removeEventListener('mouseleave', onMouseLeave)
  }
})
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.pc-login-screen {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gui-bg-base, #000000);
  transition: background 0.5s ease;
}

/* ── Outer ring cursor ───────────────────────────────────────────── */
.pc-login-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--gui-text-primary, #ffffff);
  border-radius: 10px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9998;
  opacity: 0.6;
  transition:
    width 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    height 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    border-radius 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    background 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    border-color 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    opacity 0.25s ease;
}

.pc-login-cursor--magnetic {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--gui-accent, #8e8e93);
  border-color: transparent;
  opacity: 1;
  box-shadow: 0 0 10px var(--gui-accent-glow, rgba(142, 142, 147, 0.4));
}

.pc-login-cursor--typing {
  width: 2px;
  height: 20px;
  border-radius: 1px;
  background: var(--gui-accent, #8e8e93);
  border-color: transparent;
  opacity: 1;
  box-shadow: 0 0 8px var(--gui-accent-glow, rgba(142, 142, 147, 0.4));
}

/* ── Aurora ambient glow ─────────────────────────────────────────── */
.pc-login-aurora {
  position: fixed;
  top: 0;
  left: 0;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    var(--gui-accent-soft, rgba(142, 142, 147, 0.08)) 0%,
    transparent 70%
  );
  filter: blur(60px);
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: screen;
}

/* ── Background ──────────────────────────────────────────────────── */
.pc-login-screen__background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.pc-login-screen__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 50% 20%,
      var(--gui-accent-soft, rgba(142, 142, 147, 0.06)) 0%,
      transparent 55%
    ),
    radial-gradient(ellipse at 20% 80%, rgba(142, 142, 147, 0.03) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 60%, rgba(63, 63, 66, 0.02) 0%, transparent 40%);
}

.pc-login-screen__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Theme picker ────────────────────────────────────────────────── */
.pc-login-theme-picker {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  background: var(--gui-glass-bg, rgba(28, 28, 30, 0.65));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 28px;
  transition:
    border-color 0.4s ease,
    background 0.4s ease;
}

.pc-login-theme-picker:hover {
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.15));
}

.pc-login-theme-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--swatch-color, #8e8e93);
  border: 2px solid transparent;
  outline: none;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.pc-login-theme-swatch:hover {
  transform: scale(1.25);
}

.pc-login-theme-swatch--active {
  border-color: var(--gui-text-primary, #ffffff);
  box-shadow: 0 0 0 1px var(--swatch-color, #8e8e93);
  transform: scale(1.15);
}

/* ── Card container ──────────────────────────────────────────────── */
.pc-login-screen__card-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
  padding: 20px;
  perspective: 1200px;
}

/* ── Card ────────────────────────────────────────────────────────── */
.pc-login-screen__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 44px 28px;
  background: var(--gui-glass-bg-strong, rgba(44, 44, 46, 0.88));
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border-radius: 24px;
  border: 1px solid var(--gui-glass-border, rgba(255, 255, 255, 0.08));
  box-shadow:
    0 0 120px var(--gui-accent-glow, rgba(142, 142, 147, 0.22)),
    0 32px 80px rgba(0, 0, 0, 0.55),
    0 8px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  overflow: hidden;
  will-change: transform;
  transform-origin: center center;
  transition:
    border-color 0.5s ease,
    box-shadow 0.5s ease;
}

.pc-login-screen__card:hover {
  border-color: var(--gui-border-default, rgba(255, 255, 255, 0.12));
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.5),
    0 12px 24px rgba(0, 0, 0, 0.3),
    0 0 40px var(--gui-accent-soft, rgba(142, 142, 147, 0.04)),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.pc-login-screen__card-glow {
  position: absolute;
  top: -60%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    ellipse at 50% 25%,
    var(--gui-accent-soft, rgba(142, 142, 147, 0.05)) 0%,
    transparent 60%
  );
  pointer-events: none;
}

/* ── Logo ────────────────────────────────────────────────────────── */
.pc-login-screen__logo-section {
  margin-bottom: 16px;
}

.pc-login-screen__logo {
  color: var(--gui-text-primary, #ffffff);
  filter: drop-shadow(0 0 20px var(--gui-accent-glow, rgba(142, 142, 147, 0.3)));
  animation: logo-breathe 4s ease-in-out infinite;
}

@keyframes logo-breathe {
  0%,
  100% {
    filter: drop-shadow(0 0 20px var(--gui-accent-glow, rgba(142, 142, 147, 0.3)));
  }
  50% {
    filter: drop-shadow(0 0 35px var(--gui-accent-glow, rgba(142, 142, 147, 0.5)));
  }
}

/* ── Title & subtitle ────────────────────────────────────────────── */
.pc-login-screen__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: var(--gui-text-primary, #ffffff);
  letter-spacing: -0.3px;
}

.pc-login-screen__subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--gui-text-secondary, #8e8e93);
  text-align: center;
  line-height: 1.5;
}

/* ── Mode tabs with sliding indicator ───────────────────────────── */
.pc-login-screen__mode-tabs {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 16px;
  padding: 4px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  position: relative;
}

.pc-login-screen__mode-tab {
  position: relative;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--gui-text-secondary, #8e8e93);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
}

/* Per-button underline indicator */
.pc-login-screen__mode-tab::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 20%;
  right: 20%;
  height: 2px;
  border-radius: 1px;
  background: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 6px var(--gui-accent-glow, rgba(142, 142, 147, 0.4));
  opacity: 0;
  transform: scaleX(0.6);
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.pc-login-screen__mode-tab:hover {
  color: var(--gui-text-primary, #ffffff);
}

.pc-login-screen__mode-tab--active {
  color: var(--gui-text-primary, #ffffff);
  font-weight: 700;
}

.pc-login-screen__mode-tab--active::after {
  opacity: 1;
  transform: scaleX(1);
}

/* ── Form ────────────────────────────────────────────────────────── */
.pc-login-screen__form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  transition: color 0.3s ease;
}

.pc-login-screen__input-group:focus-within .pc-login-screen__label {
  color: var(--gui-accent, #8e8e93);
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
  height: 48px;
  padding: 0 20px;
  padding-right: 48px;
  font-size: 15px;
  color: var(--gui-text-primary, #ffffff);
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.03));
  border: 1.5px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  outline: none;
  transition:
    border-color 0.4s cubic-bezier(0.19, 1, 0.22, 1),
    transform 0.4s cubic-bezier(0.19, 1, 0.22, 1),
    background 0.4s ease,
    box-shadow 0.4s ease;
}

.pc-login-screen__input::placeholder {
  color: var(--gui-text-tertiary, #636366);
}

.pc-login-screen__input:hover {
  background: var(--gui-bg-surface-hover, rgba(255, 255, 255, 0.06));
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.12));
}

.pc-login-screen__input--focused,
.pc-login-screen__input:focus {
  background: var(--gui-bg-surface-active, rgba(255, 255, 255, 0.08));
  border-color: var(--gui-accent, #8e8e93);
  box-shadow: 0 0 0 3px var(--gui-accent-soft, rgba(142, 142, 147, 0.12));
  transform: scale(0.994);
}

.pc-login-screen__input--error {
  border-color: var(--gui-error, #ff3b30);
  background: var(--gui-error-bg, rgba(255, 59, 48, 0.04));
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
  transition: color 0.2s ease;
}

.pc-login-screen__input-clear:hover {
  color: var(--gui-text-primary, #ffffff);
}

/* ── Send code button ────────────────────────────────────────────── */
.pc-login-screen__code-button {
  position: relative;
  overflow: hidden;
  height: 48px;
  border: 1px solid var(--gui-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  background: var(--gui-border-subtle, rgba(255, 255, 255, 0.04));
  color: var(--gui-text-primary, #ffffff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.3s ease,
    background 0.3s ease,
    transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.pc-login-screen__code-button:hover:not(:disabled) {
  border-color: var(--gui-border-strong, rgba(255, 255, 255, 0.15));
  transform: translateY(-1px);
}

.pc-login-screen__code-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pc-login-btn-text {
  position: relative;
  z-index: 2;
}

/* ── Button wash ripple ──────────────────────────────────────────── */
.pc-login-btn-wash {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 80%
  );
  transform: translate(-50%, -50%);
  left: var(--wash-x, 50%);
  top: var(--wash-y, 50%);
  transition:
    width 0.75s cubic-bezier(0.1, 0.8, 0.2, 1),
    height 0.75s cubic-bezier(0.1, 0.8, 0.2, 1),
    opacity 0.75s ease;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}

.pc-login-screen__button:hover .pc-login-btn-wash,
.pc-login-screen__code-button:hover .pc-login-btn-wash {
  width: 480px;
  height: 480px;
  opacity: 1;
}

/* ── Submit button ───────────────────────────────────────────────── */
.pc-login-screen__button {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 48px;
  margin-top: 8px;
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
  transition:
    transform 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    border-radius 0.35s cubic-bezier(0.19, 1, 0.22, 1),
    box-shadow 0.35s ease,
    opacity 0.25s ease;
}

.pc-login-screen__button:hover:not(:disabled) {
  transform: translateY(-2px);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--gui-accent-glow, rgba(142, 142, 147, 0.35));
}

.pc-login-screen__button:active:not(:disabled) {
  transform: translateY(0.5px);
}

.pc-login-screen__button--disabled {
  opacity: 0.38;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-login-screen__button--loading {
  opacity: 0.7;
  pointer-events: none;
  transform: scale(0.98);
}

.pc-login-screen__button-text,
.pc-login-screen__button-loading {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* ── Spinner ─────────────────────────────────────────────────────── */
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

/* ── Error message ───────────────────────────────────────────────── */
.pc-login-screen__error {
  margin: 0;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--gui-error, #ff3b30);
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.25s ease;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Meta row ────────────────────────────────────────────────────── */
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

/* ── Card footer ─────────────────────────────────────────────────── */
.pc-login-screen__card-footer {
  width: 100%;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--gui-border-subtle, rgba(255, 255, 255, 0.05));
  text-align: center;
}

.pc-login-card-footer__text {
  margin: 0;
  font-size: 11px;
  color: var(--gui-text-tertiary, #636366);
  opacity: 0.7;
  letter-spacing: 0.02em;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .pc-login-screen__card-container {
    max-width: 100%;
    padding: 20px;
  }

  .pc-login-screen__card {
    padding: 32px 24px 20px;
    border-radius: 20px;
  }

  .pc-login-screen__input,
  .pc-login-screen__button,
  .pc-login-screen__code-button {
    height: 44px;
  }

  .pc-login-screen__code-row {
    grid-template-columns: minmax(0, 1fr) 108px;
  }

  .pc-login-cursor,
  .pc-login-aurora {
    display: none;
  }
}
</style>

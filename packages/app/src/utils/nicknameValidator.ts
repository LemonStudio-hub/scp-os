const NICKNAME_REGEX = /^[a-zA-Z0-9_一-龥]+$/
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 20

export interface NicknameValidation {
  valid: boolean
  error?: string
}

export function validateNickname(value: string): NicknameValidation {
  const trimmed = value.trim()
  if (!trimmed) return { valid: false, error: '请输入工作代号' }
  if (trimmed.length < NICKNAME_MIN)
    return { valid: false, error: `工作代号至少需要 ${NICKNAME_MIN} 个字符` }
  if (trimmed.length > NICKNAME_MAX)
    return { valid: false, error: `工作代号不能超过 ${NICKNAME_MAX} 个字符` }
  if (!NICKNAME_REGEX.test(trimmed))
    return { valid: false, error: '只允许字母、数字、下划线和中文' }
  return { valid: true }
}

export function isNicknameValid(value: string): boolean {
  return validateNickname(value).valid
}

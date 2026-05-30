export interface AppSettings {
  fontSize: number
  cursorBlink: boolean
  bootAnimation: boolean
  language: string
  theme: string
  wallpaper: string
  soundEffects: boolean
  notifications: boolean
  autoSave: boolean
  tabSize: number
  wordWrap: boolean
  showLineNumbers: boolean
  lineHeight: number
  fontFamily: string
}

export interface ThemeOption {
  id: string
  name: string
  preview: string
}

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
}

export interface SettingsSection {
  id: string
  label: string
  icon?: string
}

export type SettingValueType = boolean | number | string

export interface SettingsSliderConfig {
  key: keyof AppSettings
  min: number
  max: number
  step: number
  unit: string
}

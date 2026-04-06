/**
 * ESLint Configuration — Flat Config (ESLint 9)
 * Vue 3 + TypeScript + Prettier integration
 */
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '**/*.d.ts',
      '**/*.config.*',
      'src/test/',
      '**/*.test.ts',
      '**/*.spec.ts',
      'locales.ts.bak',
    ],
  },

  // Vue + TypeScript base config
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{vue,ts,tsx}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ── TypeScript Rules ───────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      // ── Vue Rules ─────────────────────────────────────────────
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
      'vue/max-attributes-per-line': ['warn', { singleline: 3, multiline: 1 }],
      'vue/singleline-html-element-content-newline': 'warn',

      // ── General Rules ─────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-implicit-coercion': 'warn',
    },
  },

  // Prettier integration (must be last)
  eslintConfigPrettier,
]

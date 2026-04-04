/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Continuous curvature border radius (squircle)
      borderRadius: {
        'squircle-xs': '3px',
        'squircle-sm': '6px',
        'squircle-md': '10px',
        'squircle-lg': '14px',
        'squircle-xl': '18px',
        'squircle-2xl': '24px',
        'squircle-3xl': '32px',
      },
      // iOS dark color palette
      colors: {
        'ios-bg': '#1C1C1E',
        'ios-surface': '#2C2C2E',
        'ios-surface-2': '#3A3A3C',
        'ios-surface-3': '#48484A',
        'ios-text': '#FFFFFF',
        'ios-text-secondary': '#8E8E93',
        'ios-text-tertiary': '#636366',
        'ios-separator': 'rgba(84, 84, 88, 0.65)',
        'ios-accent': '#8E8E93',
        'ios-accent-hover': '#AEAEB2',
        'ios-green': '#34C759',
        'ios-red': '#FF3B30',
        'ios-blue': '#0A84FF',
        'ios-yellow': '#FFCC00',
        'icon-fg': '#FFFFFF',
        'icon-app-from': '#4A4A4C',
        'icon-app-to': '#636366',
      },
      // iOS spring animation
      transitionTimingFunction: {
        'ios-spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ios-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        'ios': '20px',
        'ios-lg': '30px',
      },
    },
  },
  plugins: [],
}

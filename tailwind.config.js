/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(99, 102, 241, 0.12), 0 12px 32px -12px rgba(99, 102, 241, 0.45)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0.7)' },
          '55%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.45)' },
          '70%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -32px) scale(1.06)' },
          '66%': { transform: 'translate(-18px, 18px) scale(0.96)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-up': 'fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-down': 'fade-down 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slide-in-left 0.4s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        pop: 'pop 0.35s ease-out',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        blob: 'blob 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

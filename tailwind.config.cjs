/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './context/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './services/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        surface: {
          page: 'var(--le-bg-page)',
          card: 'var(--le-bg-card)',
          muted: 'var(--le-bg-muted)',
          elevated: 'var(--le-bg-elevated)',
          border: 'var(--le-border)',
          'border-subtle': 'var(--le-border-subtle)',
        },
        content: {
          primary: 'var(--le-text)',
          muted: 'var(--le-text-muted)',
          faint: 'var(--le-text-faint)',
        },
        'brand-blue': '#0066CC',
        'brand-dark': '#0A1628',
        'brand-navy': '#0F2140',
        'brand-lightblue': '#E8F4FD',
        'brand-cyan': '#00B4D8',
        'brand-gray': '#F7F9FC',
        'brand-success': '#2A9D8F',
        'brand-orange': '#FF6B35',
        'brand-orange-light': '#FFF3ED',
        'brand-blue-50': '#EFF6FF',
        'brand-blue-100': '#DBEAFE',
        'brand-blue-500': '#0066CC',
        'brand-blue-600': '#0052A3',
        'brand-blue-700': '#003D7A',
        'brand-blue-800': '#002952',
        'brand-blue-900': '#0A1628',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  safelist: [
    'bg-surface-page',
    'bg-surface-card',
    'bg-surface-muted',
    'bg-surface-elevated',
    'text-content-primary',
    'text-content-muted',
    'text-content-faint',
    'border-surface-border',
    'border-surface-border-subtle',
    'shadow-card',
  ],
  plugins: [],
};

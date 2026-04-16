import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg: {
          base:    'var(--bg-base)',
          surface: 'var(--bg-surface)',
          card:    'var(--bg-card)',
          border:  'var(--bg-border)',
          hover:   'var(--bg-hover)',
        },
        accent: {
          blue:    '#f4a440',
          'blue-dim': '#dc8a26',
          cyan:    '#ffffff',
          green:   '#10b981',
          amber:   '#f59e0b',
          red:     '#ef4444',
          purple:  '#ffffff',
        },
        txt: {
          primary:   'var(--txt-primary)',
          secondary: 'var(--txt-secondary)',
          muted:     'var(--txt-muted)',
          inverse:   'var(--txt-inverse)',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)',
        glow: '0 0 20px rgba(37,99,235,.25)',
      },
      animation: {
        'fade-in':   'fadeIn .3s ease forwards',
        'slide-in':  'slideIn .35s cubic-bezier(.16,1,.3,1) forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.3' } },
      },
    },
  },
  plugins: [],
}

export default config

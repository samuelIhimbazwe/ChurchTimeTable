import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {

      /* ── COLORS ── */
      colors: {
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        gold: {
          50:  'var(--color-gold-50)',
          100: 'var(--color-gold-100)',
          300: 'var(--color-gold-300)',
          400: 'var(--color-gold-400)',
          500: 'var(--color-gold-500)',
          700: 'var(--color-gold-700)',
          900: 'var(--color-gold-900)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          light:   'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light:   'var(--color-warning-light)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          light:   'var(--color-danger-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light:   'var(--color-info-light)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised:  'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          inverse:   'var(--color-text-inverse)',
        },
      },

      /* ── TYPOGRAPHY ── */
      fontFamily: {
        display: 'var(--font-display)',
        body:    'var(--font-body)',
        mono:    'var(--font-mono)',
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':['3rem',     { lineHeight: '1' }],
      },

      /* ── BORDER RADIUS ── */
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      /* ── SHADOWS ── */
      boxShadow: {
        card:    'var(--shadow-sm)',
        raised:  'var(--shadow-md)',
        overlay: 'var(--shadow-lg)',
        modal:   'var(--shadow-xl)',
      },

      /* ── ANIMATION ── */
      transitionDuration: {
        instant:    'var(--duration-instant)',
        fast:       'var(--duration-fast)',
        normal:     'var(--duration-normal)',
        slow:       'var(--duration-slow)',
        deliberate: 'var(--duration-deliberate)',
      },
      transitionTimingFunction: {
        'ease-out':    'var(--ease-out)',
        'ease-in':     'var(--ease-in)',
        'ease-inout':  'var(--ease-inout)',
        'ease-spring': 'var(--ease-spring)',
      },
      keyframes: {
        pageEnter: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bellWiggle: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '20%':     { transform: 'rotate(-12deg)' },
          '40%':     { transform: 'rotate(12deg)' },
          '60%':     { transform: 'rotate(-8deg)' },
          '80%':     { transform: 'rotate(8deg)' },
        },
        scalePop: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-4px)' },
          '40%':     { transform: 'translateX(4px)' },
          '60%':     { transform: 'translateX(-4px)' },
          '80%':     { transform: 'translateX(4px)' },
        },
        skeletonPulse: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
      animation: {
        'page-enter':     'pageEnter var(--duration-normal) var(--ease-out) forwards',
        'count-up':       'countUp var(--duration-slow) var(--ease-out) forwards',
        'bell-wiggle':    'bellWiggle 400ms var(--ease-inout)',
        'scale-pop':      'scalePop 200ms var(--ease-spring)',
        'shake':          'shake 400ms var(--ease-inout)',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },

      /* ── SPACING (sidebar width etc.) ── */
      spacing: {
        sidebar:          '240px',
        'sidebar-collapsed': '64px',
        topbar:           '64px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

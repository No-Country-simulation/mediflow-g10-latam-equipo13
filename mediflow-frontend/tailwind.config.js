/** @type {import('tailwindcss').Config} */
import { colors, spacing, borderRadius, shadows, typography, animation, breakpoints, zIndex } from './src/lib/design-system';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: colors.brand,
        // Semantic colors
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        urgent: colors.danger, // alias for backward compat
        warn: colors.warning,   // alias for backward compat
        ok: colors.success,     // alias for backward compat
        info: colors.info,
        // Neutrals
        neutral: colors.neutral,
        ink: colors.neutral[1000],
        paper: colors.neutral[50],
        // Dark mode
        dark: colors.dark,
      },
      spacing,
      borderRadius,
      boxShadow: shadows,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'slide-left': 'slideLeft 300ms ease-out',
        'slide-right': 'slideRight 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'scale-out': 'scaleOut 200ms ease-in',
        spin: 'spin 1s linear infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        ping: 'ping 1s ease-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: animation.keyframes.fadeIn,
        fadeOut: animation.keyframes.fadeOut,
        slideUp: animation.keyframes.slideUp,
        slideDown: animation.keyframes.slideDown,
        slideLeft: animation.keyframes.slideLeft,
        slideRight: animation.keyframes.slideRight,
        scaleIn: animation.keyframes.scaleIn,
        scaleOut: animation.keyframes.scaleOut,
        spin: animation.keyframes.spin,
        pulse: animation.keyframes.pulse,
        ping: animation.keyframes.ping,
        shimmer: animation.keyframes.shimmer,
        float: animation.keyframes.float,
        wiggle: animation.keyframes.wiggle,
      },
      transitionDuration: animation.duration,
      transitionTimingFunction: animation.easing,
      zIndex: zIndex,
      screens: breakpoints,
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'mesh-gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'mesh-gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    function ({ addUtilities, addComponents, theme }) {
      // Utilidades de scrollbar
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': `${theme('colors.neutral.300')} transparent`,
        },
        '.scrollbar-thin-dark': {
          'scrollbar-width': 'thin',
          'scrollbar-color': `${theme('colors.neutral.700')} transparent`,
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.text-balance': { 'text-wrap': 'balance' },
        '.text-pretty': { 'text-wrap': 'pretty' },
      });

      // Componentes base
      addComponents({
        '.btn': {
          '@apply inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-primary': {
          '@apply btn bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-500/30': {},
        },
        '.btn-secondary': {
          '@apply btn bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-400/30': {},
        },
        '.btn-outline': {
          '@apply btn border border-neutral-300 bg-transparent hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-neutral-400/30': {},
        },
        '.btn-ghost': {
          '@apply btn bg-transparent hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-400/30': {},
        },
        '.btn-danger': {
          '@apply btn bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:ring-danger-500/30': {},
        },
        '.btn-success': {
          '@apply btn bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500/30': {},
        },
        '.btn-xs': { '@apply px-2.5 py-1.5 text-xs gap-1.5': {} },
        '.btn-sm': { '@apply px-3 py-2 text-sm gap-2': {} },
        '.btn-md': { '@apply px-4 py-2.5 text-base gap-2': {} },
        '.btn-lg': { '@apply px-6 py-3 text-lg gap-2.5': {} },
        '.btn-xl': { '@apply px-8 py-4 text-xl gap-3': {} },

        '.input': {
          '@apply w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all': {},
        },
        '.input-error': {
          '@apply w-full px-3.5 py-2.5 bg-white border border-danger-500 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-danger-500/30 focus:border-danger-500 transition-all': {},
        },
        '.input-success': {
          '@apply w-full px-3.5 py-2.5 bg-white border border-success-500 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-success-500/30 focus:border-success-500 transition-all': {},
        },

        '.card': {
          '@apply bg-white rounded-2xl border border-neutral-100 shadow-sm': {},
        },
        '.card-elevated': {
          '@apply bg-white rounded-2xl border border-neutral-100 shadow-lg': {},
        },
        '.card-interactive': {
          '@apply bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer': {},
        },
        '.card-glass': {
          '@apply bg-white/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 shadow-lg': {},
        },

        '.badge': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold': {},
        },
        '.badge-dot': {
          '@apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold': {},
        },

        '.link': {
          '@apply text-brand-500 hover:text-brand-600 underline-offset-2 hover:underline transition-colors': {},
        },

        '.skeleton': {
          '@apply animate-pulse bg-neutral-200 rounded': {},
        },
        '.skeleton-dark': {
          '@apply animate-pulse bg-neutral-700 rounded': {},
        },

        '.glass': {
          '@apply bg-white/80 backdrop-blur-xl border border-neutral-200/50': {},
        },
        '.glass-dark': {
          '@apply bg-dark-bgCard/80 backdrop-blur-xl border border-dark-border/50': {},
        },

        '.gradient-text': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-brand-700': {},
        },
        '.gradient-text-success': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-success-500 to-success-700': {},
        },
        '.gradient-text-danger': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-danger-500 to-danger-700': {},
        },
      });
    },
  ],
};
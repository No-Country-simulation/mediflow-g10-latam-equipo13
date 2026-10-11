/**
 * MediFlow Design System
 * Sistema de diseño cohesivo para toda la aplicación
 */

// ============================================
// COLORES SEMÁNTICOS
// ============================================
export const colors = {
  // Brand - Azul médico confiable
  brand: {
    25: '#f0f4ff',
    50: '#eef4ff',
    100: '#dce8ff',
    200: '#bccdff',
    300: '#8aa0ff',
    400: '#5c6fff',
    500: '#2f6fed',  // Principal
    600: '#2457c9',
    700: '#1c46a3',
    800: '#183882',
    900: '#152d66',
    950: '#0d1a3d',
  },

  // Semantic states
  success: {
    50: '#ecfdf3',
    100: '#d1fadf',
    500: '#2f9e6b',
    600: '#257a55',
    700: '#1e6043',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#e0a53f',
    600: '#c48a32',
    700: '#9d6d26',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#e0523f',
    600: '#c43d2e',
    700: '#9d2f23',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Neutros sofisticados
  neutral: {
    0: '#ffffff',
    25: '#fafafa',
    50: '#f6f8fc',
    100: '#f1f3f7',
    200: '#e3e8ef',
    300: '#c9d1db',
    400: '#a9b4c4',
    500: '#8a96a9',
    600: '#6e7c91',
    700: '#576478',
    800: '#444f61',
    900: '#374050',
    950: '#1e2533',
    1000: '#12172b',
  },

  // Dark mode variants
  dark: {
    bg: '#0f141e',
    bgElevated: '#1a1f2e',
    bgCard: '#1e2533',
    border: '#2d3648',
    text: '#f1f3f7',
    textMuted: '#8a96a9',
    textSubtle: '#576478',
  },
} as const;

// ============================================
// ESPACIADO Y LAYOUT
// ============================================
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(18,23,43,0.03)',
  sm: '0 1px 3px rgba(18,23,43,0.04), 0 1px 2px rgba(18,23,43,0.03)',
  md: '0 4px 6px -1px rgba(18,23,43,0.04), 0 2px 4px -1px rgba(18,23,43,0.03)',
  lg: '0 10px 15px -3px rgba(18,23,43,0.04), 0 4px 6px -2px rgba(18,23,43,0.03)',
  xl: '0 20px 25px -5px rgba(18,23,43,0.04), 0 10px 10px -5px rgba(18,23,43,0.03)',
  '2xl': '0 25px 50px -12px rgba(18,23,43,0.08)',
  inner: 'inset 0 2px 4px rgba(18,23,43,0.03)',
  glow: '0 0 20px rgba(47, 111, 237, 0.15)',
  glowStrong: '0 0 40px rgba(47, 111, 237, 0.25)',
} as const;

// ============================================
// TIPOGRAFÍA
// ============================================
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// ============================================
// ANIMACIONES Y TRANSICIONES
// ============================================
export const animation = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  keyframes: {
    fadeIn: '{from{opacity:0}to{opacity:1}}',
    fadeOut: '{from{opacity:1}to{opacity:0}}',
    slideUp: '{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
    slideDown: '{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}',
    slideLeft: '{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}',
    slideRight: '{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}',
    scaleIn: '{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}',
    scaleOut: '{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.95)}}',
    spin: '{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
    pulse: '{0%,100%{opacity:1}50%{opacity:0.5}}',
    ping: '{75%,100%{transform:scale(2);opacity:0}}',
    shimmer: '{0%{background-position:-200% 0}100%{background-position:200% 0}}',
    float: '{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    wiggle: '{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}',
  },
} as const;

// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// COMPONENTES BASE - VARIANTES
// ============================================
export const variants = {
  button: {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus:ring-brand-500/30',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400/30',
    outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 active:bg-neutral-100 focus:ring-neutral-400/30',
    ghost: 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400/30',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:ring-danger-500/30',
    success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500/30',
    link: 'text-brand-500 hover:text-brand-600 underline-offset-2 hover:underline',
  },
  buttonSize: {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  },
  input: {
    default: 'w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all',
    error: 'w-full px-3.5 py-2.5 bg-white border border-danger-500 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-danger-500/30 focus:border-danger-500 transition-all',
    success: 'w-full px-3.5 py-2.5 bg-white border border-success-500 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-success-500/30 focus:border-success-500 transition-all',
    disabled: 'w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed',
  },
  card: {
    default: 'bg-white rounded-2xl border border-neutral-100 shadow-sm',
    elevated: 'bg-white rounded-2xl border border-neutral-100 shadow-lg',
    interactive: 'bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer',
    glass: 'bg-white/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 shadow-lg',
    dark: 'bg-dark-bgCard rounded-2xl border border-dark-border',
  },
  badge: {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
    dot: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
    outline: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
  },
} as const;

// ============================================
// UTILIDADES DE CLASE
// ============================================
export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (typeof c === 'string') return c.split(' ');
      return Object.entries(c).filter(([, v]) => v).map(([k]) => k);
    })
    .join(' ');
}

// ============================================
// TIPOS TYPESCRIPT
// ============================================
export type ColorScale = keyof typeof colors.brand;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type AnimationDuration = keyof typeof animation.duration;
export type AnimationEasing = keyof typeof animation.easing;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;

export type ButtonVariant = keyof typeof variants.button;
export type ButtonSize = keyof typeof variants.buttonSize;
export type InputVariant = keyof typeof variants.input;
export type CardVariant = keyof typeof variants.card;
export type BadgeVariant = keyof typeof variants.badge;
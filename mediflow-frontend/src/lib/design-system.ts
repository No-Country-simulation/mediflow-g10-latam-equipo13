/**
 * MediFlow Design System
 * Sistema de diseño cohesivo para toda la aplicación
 */

// ============================================
// COLORES SEMÁNTICOS
// ============================================
export const colors = {
  // Brand - Índigo eléctrico: inteligencia y precisión (contraste AA con texto blanco desde el 500)
  brand: {
    25: '#f6f6ff',
    50: '#eff0ff',
    100: '#e1e3ff',
    200: '#c8cbff',
    300: '#a5a8ff',
    400: '#8080fb',
    500: '#5b5bf0',  // Principal
    600: '#4a45dc',
    700: '#3c37b8',
    800: '#322f93',
    900: '#2b2a74',
    950: '#1a1846',
  },

  // Aqua - el "pulso" de la IA: estados en vivo, acentos y gradientes
  aqua: {
    50: '#ebfffb',
    100: '#cbfff4',
    200: '#9bfbe9',
    300: '#5ef2d9',
    400: '#24e0c4',
    500: '#0cc4ab',
    600: '#039e8c',
    700: '#077d71',
    800: '#0b635b',
    900: '#0e514c',
  },

  // Tinta - superficies oscuras (landing, acceso, barra lateral)
  ink: {
    DEFAULT: '#0b1026',
    600: '#2a3566',
    700: '#1d2650',
    800: '#141b3b',
    900: '#0b1026',
    950: '#060917',
  },

  // Semantic states
  success: {
    50: '#ecfdf3',
    100: '#d1fadf',
    200: '#a6f4c5',
    500: '#12b76a',
    600: '#039855',
    700: '#027a48',
  },
  warning: {
    50: '#fffaeb',
    100: '#fef0c7',
    200: '#fedf89',
    500: '#f79009',
    600: '#dc6803',
    700: '#b54708',
  },
  danger: {
    50: '#fef3f2',
    100: '#fee4e2',
    200: '#fecdca',
    500: '#f04438',
    600: '#d92d20',
    700: '#b42318',
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
  // Sombras en capas (contacto + ambiente), con tinte de la tinta de marca.
  xs: '0 1px 2px rgba(11,16,38,0.05)',
  sm: '0 1px 2px rgba(11,16,38,0.04), 0 2px 8px -2px rgba(11,16,38,0.06)',
  md: '0 1px 2px rgba(11,16,38,0.04), 0 8px 24px -12px rgba(11,16,38,0.12)',
  lg: '0 2px 4px rgba(11,16,38,0.04), 0 18px 40px -16px rgba(11,16,38,0.18)',
  xl: '0 4px 8px rgba(11,16,38,0.04), 0 28px 60px -20px rgba(11,16,38,0.24)',
  '2xl': '0 40px 80px -24px rgba(11,16,38,0.32)',
  inner: 'inset 0 1px 2px rgba(11,16,38,0.06)',
  glow: '0 0 0 1px rgba(91,91,240,0.12), 0 8px 30px -6px rgba(91,91,240,0.35)',
  glowStrong: '0 0 0 1px rgba(91,91,240,0.2), 0 12px 48px -8px rgba(91,91,240,0.55)',
  glowAqua: '0 0 0 1px rgba(12,196,171,0.18), 0 10px 36px -8px rgba(12,196,171,0.45)',
} as const;

// ============================================
// TIPOGRAFÍA
// ============================================
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
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
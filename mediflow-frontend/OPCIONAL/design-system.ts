/**
 * MediFlow — Design System (tokens + helpers).
 * `cn` no tiene dependencias externas.
 */
type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, unknown>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return;
    if (typeof v === 'string' || typeof v === 'number') out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') for (const k of Object.keys(v)) if ((v as Record<string, unknown>)[k]) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(' ');
}

const scale = (c: Record<string, string>) => c;

export const colors = {
  brand: scale({ 50: '#eef4ff', 100: '#dce8ff', 200: '#bdd2ff', 300: '#93b4ff', 400: '#5f8ff5', 500: '#2f6fed', 600: '#2457c9', 700: '#1c46a3', 800: '#173a85', 900: '#142f6b' }),
  success: scale({ 50: '#ecfdf3', 100: '#d1fae0', 200: '#a6f4c5', 300: '#6ce9a6', 400: '#32d583', 500: '#12b76a', 600: '#039855', 700: '#027a48', 800: '#05603a', 900: '#054f31' }),
  warning: scale({ 50: '#fffaeb', 100: '#fef0c7', 200: '#fedf89', 300: '#fec84b', 400: '#fdb022', 500: '#f79009', 600: '#dc6803', 700: '#b54708', 800: '#93370d', 900: '#7a2e0e' }),
  danger: scale({ 50: '#fef3f2', 100: '#fee4e2', 200: '#fecdca', 300: '#fda29b', 400: '#f97066', 500: '#f04438', 600: '#d92d20', 700: '#b42318', 800: '#912018', 900: '#7a271a' }),
  info: scale({ 50: '#f0f9ff', 100: '#e0f2fe', 200: '#b9e6fe', 300: '#7cd4fd', 400: '#36bffa', 500: '#0ba5ec', 600: '#0086c9', 700: '#026aa2', 800: '#065986', 900: '#0b4a6f' }),
  neutral: scale({ 50: '#f7f8fb', 100: '#eef0f5', 200: '#e1e4ec', 300: '#cdd2de', 400: '#9aa2b5', 500: '#6b7490', 600: '#4b5470', 700: '#394058', 800: '#262c3f', 900: '#171b2b', 950: '#0d101c', 1000: '#080a13' }),
  dark: { bg: '#0f1320', bgCard: '#1e2533', border: '#2d3548', text: '#e6e9f2' },
};

export const spacing = {};
export const borderRadius = {};
export const shadows = {
  card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  },
  fontSize: {},
  fontWeight: {},
};

export const animation = {
  duration: { 100: '100ms', 200: '200ms', 300: '300ms', 500: '500ms' },
  easing: { 'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)' },
  keyframes: {
    fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
    fadeOut: { from: { opacity: '1' }, to: { opacity: '0' } },
    slideUp: { from: { transform: 'translateY(8px)' }, to: { transform: 'translateY(0)' } },
    slideDown: { from: { transform: 'translateY(-8px)' }, to: { transform: 'translateY(0)' } },
    slideLeft: { from: { transform: 'translateX(8px)' }, to: { transform: 'translateX(0)' } },
    slideRight: { from: { transform: 'translateX(-8px)' }, to: { transform: 'translateX(0)' } },
    scaleIn: { from: { transform: 'scale(0.96)' }, to: { transform: 'scale(1)' } },
    scaleOut: { from: { transform: 'scale(1)' }, to: { transform: 'scale(0.96)' } },
    spin: { to: { transform: 'rotate(360deg)' } },
    pulse: { '50%': { opacity: '0.5' } },
    ping: { '75%, 100%': { transform: 'scale(2)', opacity: '0' } },
    shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
    float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
    wiggle: { '0%, 100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
  },
};

export const breakpoints = {};
export const zIndex = { dropdown: '600', modal: '500', toast: '800', tooltip: '700' };

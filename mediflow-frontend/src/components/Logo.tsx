/**
 * Marca de MediFlow: un pulso clínico que se convierte en ruta (el grafo del agente).
 */
import { useId } from 'react';
import { cn } from '../lib/design-system';

export function MarcaMediFlow({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`mf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b5bf0" />
          <stop offset="0.55" stopColor="#3f8cf5" />
          <stop offset="1" stopColor="#0cc4ab" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#mf-${id})`} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="none" stroke="white" strokeOpacity="0.25" />
      {/* Pulso que termina en tres destinos: el agente decide la ruta */}
      <path d="M7 21h6l3-7 5 13 3-6h3" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 21l5-6M27 21h6M27 21l5 6" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32.5" cy="14.5" r="1.8" fill="white" />
      <circle cx="33.5" cy="21" r="1.8" fill="white" />
      <circle cx="32.5" cy="27.5" r="1.8" fill="white" />
    </svg>
  );
}

export default function Logo({ subtitle, tono = 'claro', className }: { subtitle?: string; tono?: 'claro' | 'oscuro'; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <MarcaMediFlow className="w-9 h-9 shrink-0 drop-shadow-[0_6px_14px_rgba(91,91,240,0.35)]" />
      <div className="leading-tight">
        <div className={cn('font-display font-bold text-[17px] tracking-tight', tono === 'oscuro' ? 'text-white' : 'text-ink')}>
          MediFlow
        </div>
        {subtitle && (
          <div className={cn('text-[11px] -mt-0.5', tono === 'oscuro' ? 'text-white/50' : 'text-neutral-500')}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

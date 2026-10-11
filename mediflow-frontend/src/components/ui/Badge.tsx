import { ReactNode } from 'react';
import { cn } from '../../lib/design-system';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  outline?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-700',
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const outlineClasses = {
  default: 'border-neutral-300 text-neutral-700',
  success: 'border-success-300 text-success-700',
  warning: 'border-warning-300 text-warning-700',
  danger: 'border-danger-300 text-danger-700',
  info: 'border-info-300 text-info-700',
  brand: 'border-brand-300 text-brand-700',
  neutral: 'border-neutral-300 text-neutral-600',
};

const sizeClasses = {
  xs: 'px-2 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-3.5 py-1.5 text-base gap-2',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  outline = false,
  className,
  onClick,
}: BadgeProps) {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={cn(
        'inline-flex items-center font-semibold rounded-full transition-colors',
        outline ? outlineClasses[variant] : variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            outline ? 'bg-current' : 'bg-current/60'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </Component>
  );
}

// Badges especializados para el dominio médico
export const PriorityBadge = ({ priority }: { priority: 'Rutina' | 'Urgente' }) => (
  <Badge
    variant={priority === 'Urgente' ? 'danger' : 'success'}
    dot
    size="sm"
  >
    {priority}
  </Badge>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    procesado: { variant: 'success', label: 'Procesado' },
    en_revision: { variant: 'warning', label: 'En revisión' },
    error: { variant: 'danger', label: 'Error' },
    pendiente: { variant: 'info', label: 'Pendiente' },
    completado: { variant: 'success', label: 'Completado' },
    cancelado: { variant: 'neutral', label: 'Cancelado' },
  };

  const config = statusMap[status] || { variant: 'neutral', label: status };

  return <Badge variant={config.variant} dot size="sm">{config.label}</Badge>;
};

export const DocumentTypeBadge = ({ type }: { type: string }) => {
  const typeColors: Record<string, BadgeProps['variant']> = {
    'Receta': 'brand',
    'Informe de Estudio por Imágenes': 'info',
    'Orden de Procedimiento': 'warning',
    'Epicrisis': 'success',
    'Certificado Médico': 'neutral',
  };

  return <Badge variant={typeColors[type] || 'default'} size="sm">{type}</Badge>;
};

export const SpecialtyBadge = ({ specialty }: { specialty: string }) => (
  <Badge variant="brand" size="sm" outline>
    {specialty}
  </Badge>
);

export const ConfidenceBadge = ({ score }: { score: number }) => {
  const getVariant = (s: number): BadgeProps['variant'] => {
    if (s >= 0.8) return 'success';
    if (s >= 0.6) return 'warning';
    return 'danger';
  };

  return (
    <Badge variant={getVariant(score)} size="xs" dot>
      {Math.round(score * 100)}%
    </Badge>
  );
};
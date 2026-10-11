import { ReactNode } from 'react';
import { cn } from '../../lib/design-system';

export interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'dark';
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

const variantClasses = {
  default: 'bg-white rounded-2xl border border-neutral-100 shadow-sm',
  elevated: 'bg-white rounded-2xl border border-neutral-100 shadow-lg',
  interactive: 'bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer',
  glass: 'bg-white/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 shadow-lg',
  dark: 'bg-neutral-900 rounded-2xl border border-neutral-800',
};

export function Card({ children, variant = 'default', className, onClick, padding = 'md' }: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(variantClasses[variant], paddingClasses[padding], className)}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
  subtitle?: ReactNode;
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-bold text-neutral-900">{children}</h3>
      {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

export function CardFooter({ children, className, divider = false }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 flex items-center', divider && 'border-t border-neutral-100', className)}>
      {children}
    </div>
  );
}

// StatCard especializado para dashboards
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const statVariantClasses = {
  default: 'bg-white border border-neutral-100',
  primary: 'bg-white border border-brand-100',
  success: 'bg-white border border-success-100',
  warning: 'bg-white border border-warning-100',
  danger: 'bg-white border border-danger-100',
};

const statIconBgClasses = {
  default: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card
      variant="interactive"
      className={cn(statVariantClasses[variant], className)}
      onClick={onClick}
      padding="lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 truncate">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-neutral-950 tracking-tight">{value}</p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full',
                  trend.positive !== false
                    ? 'bg-success-50 text-success-700'
                    : 'bg-danger-50 text-danger-700'
                )}
              >
                {trend.positive !== false ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(trend.value)}%
                {trend.label && <span className="text-xs opacity-80">{trend.label}</span>}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', statIconBgClasses[variant])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
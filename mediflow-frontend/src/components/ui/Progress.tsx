import { cn } from '../../lib/design-system';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
  striped?: boolean;
}

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  default: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  brand: 'bg-brand-500',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  animated = false,
  striped = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-neutral-700">{label || 'Progreso'}</span>
          <span className="text-sm font-semibold text-neutral-900 tabular-nums">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-neutral-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantClasses[variant],
            striped && 'bg-gradient-to-r bg-[length:20px_20px] from-transparent via-white/20 to-transparent animate-shimmer',
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const variantStrokeColors = {
  default: 'text-brand-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  danger: 'text-danger-500',
  brand: 'text-brand-500',
};

const variantTrackColors = {
  default: 'text-brand-100',
  success: 'text-success-100',
  warning: 'text-warning-100',
  danger: 'text-danger-100',
  brand: 'text-brand-100',
};

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  variant = 'default',
  showLabel = true,
  label,
  className,
  animated = false,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={cn(variantTrackColors[variant])}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn(
            variantStrokeColors[variant],
            'transition-all duration-500 ease-out',
            animated && 'animate-pulse'
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        />
      </svg>
      {(showLabel || label) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className={cn('font-bold tabular-nums', size < 48 ? 'text-sm' : size < 64 ? 'text-lg' : 'text-xl')}>
              {label ?? `${Math.round(percentage)}%`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function StepProgress({
  steps,
  currentStep,
  className,
}: {
  steps: Array<{ label: string; description?: string }>;
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[14px] top-0 bottom-0 w-0.5 bg-neutral-200" aria-hidden="true" />
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="relative flex items-start gap-4">
            <div
              className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                index < currentStep
                  ? 'bg-success-500 text-white border-2 border-white'
                  : index === currentStep
                  ? 'bg-brand-500 text-white border-2 border-white ring-4 ring-brand-500/20'
                  : 'bg-white text-neutral-400 border-2 border-neutral-300'
              )}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-sm font-bold">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium', index <= currentStep ? 'text-neutral-900' : 'text-neutral-500')}>
                {step.label}
              </p>
              {step.description && (
                <p className={cn('text-sm mt-0.5', index <= currentStep ? 'text-neutral-600' : 'text-neutral-400')}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
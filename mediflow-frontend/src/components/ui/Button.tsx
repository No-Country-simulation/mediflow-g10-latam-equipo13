import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/design-system';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variantClasses = {
      primary:
        'shine text-white bg-gradient-to-b from-brand-500 to-brand-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(11,16,38,0.2),0_8px_20px_-8px_rgba(91,91,240,0.65)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(11,16,38,0.2),0_12px_28px_-8px_rgba(91,91,240,0.8)] focus-visible:ring-brand-500/40',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-400/30',
      outline: 'border border-neutral-200 bg-white text-neutral-800 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-neutral-400/30',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-400/30',
      danger: 'bg-gradient-to-b from-danger-500 to-danger-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-8px_rgba(240,68,56,0.6)] hover:brightness-110 focus-visible:ring-danger-500/30',
      success: 'bg-gradient-to-b from-success-500 to-success-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-8px_rgba(18,183,106,0.6)] hover:brightness-110 focus-visible:ring-success-500/30',
      link: 'text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline bg-transparent p-0',
    };

    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs gap-1.5',
      sm: 'px-3 py-2 text-sm gap-2',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], widthClass, className)}
        style={style}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
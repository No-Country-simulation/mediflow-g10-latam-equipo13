import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/design-system';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const hasError = !!error;
    const hasHint = !!hint && !hasError;

    const inputClasses = cn(
      'w-full px-3.5 py-2.5 bg-white rounded-xl text-neutral-900 placeholder-neutral-400',
      'focus:outline-none focus:ring-2 transition-all duration-150',
      hasError
        ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500'
        : 'border-neutral-300 focus:ring-brand-500/30 focus:border-brand-500',
      !!leftIcon && 'pl-10',
      !!rightIcon && 'pr-10',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 px-3 text-neutral-500 text-sm pointer-events-none z-10">
              {leftAddon}
            </div>
          )}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : hasHint ? hintId : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
              {rightIcon}
            </div>
          )}
          {rightAddon && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-neutral-500 text-sm pointer-events-none z-10">
              {rightAddon}
            </div>
          )}
        </div>
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-500 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hasHint && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    const hasError = !!error;
    const hasHint = !!hint && !hasError;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white rounded-xl text-neutral-900 placeholder-neutral-400 resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 transition-all duration-150',
            hasError
              ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500'
              : 'border-neutral-300 focus:ring-brand-500/30 focus:border-brand-500',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : hasHint ? hintId : undefined}
          {...props}
        />
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-500 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hasHint && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      options,
      placeholder,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const hasError = !!error;
    const hasHint = !!hint && !hasError;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-3.5 py-2.5 bg-white rounded-xl text-neutral-900 appearance-none',
              'focus:outline-none focus:ring-2 transition-all duration-150',
              hasError
                ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500'
                : 'border-neutral-300 focus:ring-brand-500/30 focus:border-brand-500',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : hasHint ? hintId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-500 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hasHint && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Input, Textarea, Select };
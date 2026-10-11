import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/design-system';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  shape?: 'circle' | 'square';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-danger-500',
  away: 'bg-warning-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-brand-100 text-brand-700',
    'bg-success-100 text-success-700',
    'bg-warning-100 text-warning-700',
    'bg-danger-100 text-danger-700',
    'bg-info-100 text-info-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  shape = 'circle',
  className,
  onClick,
}: AvatarProps) {
  const Component = onClick ? 'button' : 'span';
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const showStatus = status && size !== 'xs' && size !== 'sm';

  return (
    <Component
      className={cn('relative inline-flex items-center justify-center font-semibold select-none', shapeClass, sizeClasses[size], className)}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      aria-label={name || alt}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn('w-full h-full object-cover', shapeClass)}
        />
      ) : name ? (
        <span className={cn(getColorFromName(name), shapeClass, 'w-full h-full flex items-center justify-center')}>
          {getInitials(name)}
        </span>
      ) : (
        <svg
          className={cn('w-full h-full text-neutral-400', 'bg-neutral-100', shapeClass)}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusColors[status!],
            statusSizeClasses[size]
          )}
          aria-label={`Estado: ${status}`}
        />
      )}
    </Component>
  );
}

export interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({ children, max = 5, size = 'md', className }: AvatarGroupProps) {
  const kids = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const visible = kids.slice(0, max);
  const remaining = kids.length - visible.length;

  return (
    <div className={cn('flex -space-x-2', className)} aria-label={`${kids.length} usuarios`}>
      {visible.map((child, index) =>
        cloneElement(child, {
          key: child.key ?? index,
          size,
          className: cn('ring-2 ring-white', child.props.className),
        })
      )}
      {remaining > 0 && (
        <Avatar
          name={`+${remaining}`}
          size={size}
          className="ring-2 ring-white bg-neutral-100 text-neutral-600"
        />
      )}
    </div>
  );
}

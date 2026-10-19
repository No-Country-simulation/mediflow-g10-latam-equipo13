import { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/design-system';
import { Avatar } from './Avatar';

export interface DropdownAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface DropdownDivider {
  divider: true;
}

export type DropdownItem = DropdownAction | DropdownDivider;

const isDivider = (item: DropdownItem): item is DropdownDivider => 'divider' in item;

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<Position>({ top: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos(
        align === 'right'
          ? { top: rect.bottom + 8, right: Math.max(window.innerWidth - rect.right, 8) }
          : { top: rect.bottom + 8, left: Math.max(rect.left, 8) }
      );
    }
    setIsOpen((v) => !v);
  };

  // Cerrar al hacer clic fuera, con Escape, al redimensionar o al hacer scroll.
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
        if (!els.length) return;
        const idx = els.indexOf(document.activeElement as HTMLElement);
        const next = e.key === 'ArrowDown' ? (idx + 1) % els.length : (idx - 1 + els.length) % els.length;
        els[next].focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen, close]);

  const handleItemClick = (item: DropdownAction) => {
    if (item.disabled) return;
    item.onClick();
    close();
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div ref={triggerRef} onClick={toggle} aria-haspopup="menu" aria-expanded={isOpen}>
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, right: pos.right }}
            className="z-[600] min-w-[180px] bg-white rounded-xl border border-neutral-200 shadow-lg py-1.5 animate-in"
            role="menu"
          >
            {items.map((item, index) => (
              <Fragment key={index}>
                {isDivider(item) ? (
                  <div className="my-1.5 border-t border-neutral-100" role="separator" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={cn(
                      'w-full px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                      'focus:outline-none focus:bg-neutral-50',
                      item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-neutral-700 hover:bg-neutral-50',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    role="menuitem"
                  >
                    {item.icon && <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-xs text-neutral-400 bg-neutral-100 rounded font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                )}
              </Fragment>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// Menú de usuario
export interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role: string;
  };
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick: () => void;
}

export function UserMenu({ user, onProfileClick, onSettingsClick, onLogoutClick }: UserMenuProps) {
  const items: DropdownItem[] = [];
  if (onProfileClick) items.push({ label: 'Perfil', icon: <User className="w-4 h-4" />, onClick: onProfileClick });
  if (onSettingsClick) items.push({ label: 'Configuración', icon: <Settings className="w-4 h-4" />, onClick: onSettingsClick });
  if (items.length) items.push({ divider: true });
  items.push({ label: 'Cerrar sesión', icon: <LogOut className="w-4 h-4" />, onClick: onLogoutClick, danger: true });

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-neutral-900 leading-tight">{user.name}</p>
            <p className="text-xs text-neutral-500 leading-tight">{user.role}</p>
          </div>
        </button>
      }
      items={items}
      align="right"
    />
  );
}

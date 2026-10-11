import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/design-system';
import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  // Se ejecuta solo al abrir/cerrar: así el foco no salta cada vez que el padre se re-renderiza.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    contentRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <div
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm animate-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in focus:outline-none',
          sizeClasses[size],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-100">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-bold text-neutral-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-sm text-neutral-500 mt-1">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const working = loading || busy;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={working ? () => undefined : onClose} title={title} size="sm">
      <p className="text-neutral-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={working}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          className={variant === 'warning' ? 'bg-warning-500 hover:bg-warning-600' : undefined}
          onClick={handleConfirm}
          loading={working}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/design-system';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 4;

const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success-500" />,
  error: <AlertCircle className="w-5 h-5 text-danger-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  info: <Info className="w-5 h-5 text-info-500" />,
  default: <Info className="w-5 h-5 text-brand-500" />,
};

const toastBgClasses: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-200',
  error: 'bg-danger-50 border-danger-200',
  warning: 'bg-warning-50 border-warning-200',
  info: 'bg-info-50 border-info-200',
  default: 'bg-brand-50 border-brand-200',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { ...toast, id, duration: toast.duration ?? 5000 }]);
    return id;
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast, clearToasts }),
    [toasts, addToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[800] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  const dismiss = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => onRemoveRef.current(toast.id), 200);
  }, [toast.id]);

  // El temporizador depende solo del id y la duración: un toast nuevo no reinicia a los demás.
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = window.setTimeout(dismiss, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, dismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg transition-all duration-200',
        toastBgClasses[toast.type],
        exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-in'
      )}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 mt-0.5">{toastIcons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{toast.title}</p>
        {toast.message && <p className="text-sm text-neutral-600 mt-0.5">{toast.message}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action!.onClick();
              dismiss();
            }}
            className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.dismissible !== false && (
        <button
          type="button"
          onClick={dismiss}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Atajos: success / error / warning / info
export function useToastHelpers() {
  const { addToast } = useToast();

  return useMemo(
    () => ({
      success: (title: string, message?: string, options?: Partial<Toast>) =>
        addToast({ type: 'success', title, message, ...options }),
      error: (title: string, message?: string, options?: Partial<Toast>) =>
        addToast({ type: 'error', title, message, ...options }),
      warning: (title: string, message?: string, options?: Partial<Toast>) =>
        addToast({ type: 'warning', title, message, ...options }),
      info: (title: string, message?: string, options?: Partial<Toast>) =>
        addToast({ type: 'info', title, message, ...options }),
      default: (title: string, message?: string, options?: Partial<Toast>) =>
        addToast({ type: 'default', title, message, ...options }),
    }),
    [addToast]
  );
}

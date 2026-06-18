import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { Icon } from '../Icon';
import { triggerHaptic, type HapticPattern } from './HapticFeedback';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const TOAST_CONFIG: Record<ToastType, { icon: string; bgColor: string; textColor: string; haptic: HapticPattern }> = {
  success: { icon: 'check', bgColor: 'bg-green-500', textColor: 'text-white', haptic: 'success' },
  error: { icon: 'xmark', bgColor: 'bg-red-500', textColor: 'text-white', haptic: 'error' },
  warning: { icon: 'warning', bgColor: 'bg-orange-500', textColor: 'text-white', haptic: 'warning' },
  info: { icon: 'bell', bgColor: 'bg-brand-blue', textColor: 'text-white', haptic: 'light' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const config = TOAST_CONFIG[type];
    triggerHaptic(config.haptic);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-4 right-4 z-[200] flex flex-col gap-2 md:bottom-8">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${config.bgColor} ${config.textColor} animate-slide-up`}
      role="alert"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon name={config.icon as any} className="h-4 w-4" />
      </span>
      <p className="flex-1 text-sm font-bold">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 opacity-70 hover:opacity-100"
        aria-label="Fermer"
      >
        <Icon name="xmark" className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastProvider;

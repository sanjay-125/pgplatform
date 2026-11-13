import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  buttonLabel?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', buttonLabel?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success', buttonLabel?: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, buttonLabel }]);
    },
    []
  );

  const activeToast = toasts.length > 0 ? toasts[0] : null;

  const handleClose = useCallback(() => {
    if (activeToast) {
      setToasts((prev) => prev.filter((t) => t.id !== activeToast.id));
    }
  }, [activeToast]);

  useEffect(() => {
    if (!activeToast) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeToast, handleClose]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {activeToast && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="centered-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center text-slate-900">
            {/* Status Icon */}
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4 border ${
                activeToast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : activeToast.type === 'info'
                  ? 'bg-brand-50 border-brand-200 text-brand-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              {activeToast.type === 'error' ? (
                <AlertCircle className="w-7 h-7" aria-hidden="true" />
              ) : activeToast.type === 'info' ? (
                <Info className="w-7 h-7" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
              )}
            </div>

            {/* Title */}
            <h3 id="centered-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              {activeToast.type === 'error'
                ? 'Notice'
                : activeToast.type === 'info'
                ? 'Information'
                : 'Success'}
            </h3>

            {/* Message Body */}
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
              {activeToast.message}
            </p>

            {/* Appropriate Action Button (No X button, no duplicate close buttons) */}
            <div className="mt-5">
              <button
                type="button"
                autoFocus
                onClick={handleClose}
                className={`w-full py-2.5 px-5 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 ${
                  activeToast.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 focus-visible:ring-rose-500/30'
                    : activeToast.type === 'info'
                    ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20 focus-visible:ring-brand-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus-visible:ring-emerald-500/30'
                }`}
              >
                {activeToast.buttonLabel ||
                  (activeToast.message.toLowerCase().includes('agreement') ||
                  activeToast.message.toLowerCase().includes('privacy')
                    ? 'I Understand'
                    : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

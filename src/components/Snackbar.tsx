import React from 'react';
import { ToastMessage } from '../hooks/useToast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface SnackbarProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-[500px] z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 p-4 bg-surface-card border-2 border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-2 duration-200 ring-1 ring-black/5 dark:ring-white/5"
          >
            <div className="flex items-center gap-3 text-sm text-primary-theme font-bold flex-1">
              {icons[toast.type]}
              <span>{toast.message}</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.onClick();
                    onRemove(toast.id);
                  }}
                  className="text-xs font-bold px-6 py-2 rounded-xl bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-primary-theme transition-colors border border-neutral-200 dark:border-neutral-700 shadow-sm"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className="p-2 text-secondary-theme hover:text-primary-theme transition-theme rounded-xl hover:bg-surface-elevated"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

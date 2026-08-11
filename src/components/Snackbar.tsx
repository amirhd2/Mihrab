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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[500px] z-[100] flex flex-col gap-2.5 pointer-events-none">
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
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-surface-card border border-theme rounded-xl shadow-lg animate-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-2.5 text-sm text-primary-theme font-medium flex-1">
              <span>{toast.message}</span>
              {icons[toast.type]}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action!.onClick();
                    onRemove(toast.id);
                  }}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 text-primary-theme transition-colors border border-neutral-200 dark:border-neutral-800"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className="p-1.5 text-secondary-theme hover:text-primary-theme transition-theme rounded-md bg-transparent hover:bg-surface-elevated"
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

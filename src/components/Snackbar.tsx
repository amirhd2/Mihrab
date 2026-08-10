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
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:right-5 sm:max-w-md z-50 flex flex-col gap-2.5 pointer-events-none">
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
            <div className="flex items-center gap-2.5 text-sm text-primary-theme font-medium">
              {icons[toast.type]}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="p-1 text-muted-theme hover:text-primary-theme transition-theme rounded-md"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setErrorMsg(event.message || 'خطای ناخواسته در اجرای برنامه');
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setErrorMsg(event.reason?.message || 'خطای ناهمگام در برنامه');
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-bg text-primary-theme dir-rtl font-persian">
        <div className="max-w-md w-full bg-surface-card border border-theme p-6 rounded-2xl shadow-lg text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold mb-2">اختلالی رخ داده است</h2>
          <p className="text-xs text-secondary-theme mb-4 leading-relaxed">
            متأسفانه خطایی ناخواسته هنگام اجرای برنامه رخ داد. می‌توانید با بارگذاری مجدد، برنامه را راه‌اندازی کنید.
          </p>
          {errorMsg && (
            <pre className="p-3 bg-surface-elevated rounded-xl text-[11px] text-left text-red-400 font-mono overflow-x-auto mb-5 dir-ltr">
              {errorMsg}
            </pre>
          )}
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-theme cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بارگذاری مجدد برنامه</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

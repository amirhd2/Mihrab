import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMsg: error?.message || 'خطای ناخواسته در اجرای برنامه',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleWindowError = (event: ErrorEvent) => {
    this.setState({
      hasError: true,
      errorMsg: event?.message || 'خطای ناخواسته در اجرای برنامه',
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.setState({
      hasError: true,
      errorMsg: event?.reason?.message || event?.reason?.toString() || 'خطای ناهمگام در برنامه',
    });
  };

  private handleReset = () => {
    this.setState({ hasError: false, errorMsg: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-bg text-primary-theme dir-rtl font-persian">
          <div className="max-w-md w-full bg-surface-card border border-theme p-6 rounded-2xl shadow-lg text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold mb-2">اختلالی رخ داده است</h2>
            <p className="text-xs text-secondary-theme mb-4 leading-relaxed">
              متأسفانه خطایی هنگام اجرای برنامه رخ داد. می‌توانید با بارگذاری مجدد، برنامه را راه‌اندازی کنید.
            </p>
            {this.state.errorMsg && (
              <pre className="p-3 bg-surface-elevated rounded-xl text-[11px] text-left text-red-400 font-mono overflow-x-auto mb-5 dir-ltr max-h-32">
                {this.state.errorMsg}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بارگذاری مجدد برنامه</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isOffline } = usePWA();

  return (
    <div className="min-h-screen bg-surface-bg text-primary-theme flex flex-col font-persian transition-theme">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          <span>حالت آفلاین — تمامی اطلاعات به‌صورت محلی ذخیره می‌گردند.</span>
        </div>
      )}

      {/* Main Content Viewport Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Reusable Subtle Footer */}
      <footer className="border-t border-theme/50 py-4 text-center text-xs text-muted-theme">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>برنامه محراب — دستیار شخصی و آفلاین عبادات</span>
          <span>نسخه ۱.۰.۰ (پایه)</span>
        </div>
      </footer>
    </div>
  );
};


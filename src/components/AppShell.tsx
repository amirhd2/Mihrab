import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useTheme } from '../hooks/useTheme';
import { IslamicPatternBg } from './IslamicPatternBg';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isOffline } = usePWA();
  useTheme(); // Initialize and apply saved or system theme mode to document element

  return (
    <div className="min-h-screen bg-surface-bg text-primary-theme flex flex-col font-persian transition-theme relative">
      {/* Islamic Gereh & Mihrab Background */}
      <IslamicPatternBg />

      {/* Offline Banner */}
      {isOffline && (
        <div className="relative z-10 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-1.5 pt-[max(env(safe-area-inset-top),6px)]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>حالت آفلاین — تمامی اطلاعات به‌صورت محلی ذخیره می‌گردند.</span>
        </div>
      )}

      {/* Main Content Viewport Container with iPhone/Android Safe-Area padding */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 flex flex-col pt-[max(env(safe-area-inset-top),14px)] pb-[max(env(safe-area-inset-bottom),20px)] pl-[max(env(safe-area-inset-left),14px)] pr-[max(env(safe-area-inset-right),14px)]">
        {children}
      </main>
    </div>
  );
};



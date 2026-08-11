import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { toPersianDigits } from '../utils/persianUtils';
import { usePWA } from '../hooks/usePWA';
import { SettingsButton } from '../components/SettingsButton';
import { Sparkles, Wifi, WifiOff, ChevronLeft, Gift, Lightbulb } from 'lucide-react';

// Custom Mosque SVG matching the visual mockup
const MosqueIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2a1 1 0 011 1v1.1a3.5 3.5 0 012.8 2.9A4.5 4.5 0 0119 11v8h1a1 1 0 110 2H4a1 1 0 110-2h1v-8a4.5 4.5 0 013.2-4 3.5 3.5 0 012.8-2.9V3a1 1 0 011-1zm0 4.5A2.5 2.5 0 009.5 9V19h5V9A2.5 2.5 0 0012 6.5zM7 12a2.5 2.5 0 00-2.5 2.5V19H7v-7zm10 0v7h2.5v-4.5A2.5 2.5 0 0017 12z" />
  </svg>
);

// Custom Crescent Moon SVG
const CrescentMoonIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

// Custom Praying Hands (Dua) SVG
const PrayingHandsIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 21.5c-1.8 0-3.5-.7-4.8-2L3.5 15.8a2 2 0 012.8-2.8l2.7 2.7V6a2 2 0 114 0v9.5c.3 0 .5-.1.8-.3l4.7-4.7a2 2 0 012.8 2.8l-4.5 4.5c-1.3 1.3-3 2-4.8 2zM9 4a1.5 1.5 0 10-3 0v7.5l3 3V4zm9 0a1.5 1.5 0 10-3 0v7.5l3 3V4z" />
  </svg>
);

// Custom Book (Education) SVG
const EducationBookIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 4.5c-2.8-1.4-6.2-1.5-9 0v14c2.8-1.5 6.2-1.4 9 0 2.8-1.4 6.2-1.5 9 0v-14c-2.8-1.5-6.2-1.4-9 0zm-1 12c-2.3-1-5-1-7.2-.2V6.2c2.2-.8 4.9-.8 7.2.2v10.1zm9.2-.2c-2.2-.8-4.9-.8-7.2.2V6.4c2.3-1 5-1 7.2-.2v10.1z" />
  </svg>
);

// Custom Decorative Branch/Flourish for Welcome Area
const OliveFlourish: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 20c8 0 14-5 17-13" />
    <path d="M17 9c-2.5-.8-4.5-3.3-4.5-5.8 2.5.8 4.5 3.3 4.5 5.8z" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 12.5c-2.5-.8-4.5-3.3-4.5-5.8 2.5.8 4.5 3.3 4.5 5.8z" fill="currentColor" fillOpacity="0.15" />
    <path d="M7 16c-2.5-.8-4.5-3.3-4.5-5.8 2.5.8 4.5 3.3 4.5 5.8z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline } = usePWA();

  // Query live count data from IndexedDB
  const qadaRecords = useLiveQuery(() => db.qadaPrayers.toArray(), []);
  const fastingRecords = useLiveQuery(() => db.fastingLogs.toArray(), []);

  // Compute total remaining qada prayers
  const totalQadaRemaining = React.useMemo(() => {
    if (!qadaRecords) return 0;
    return qadaRecords.reduce(
      (sum, item) => sum + Math.max(0, (item.count || 0) - (item.completedCount || 0)),
      0
    );
  }, [qadaRecords]);

  // Compute total remaining fasting days
  const totalFastingRemaining = React.useMemo(() => {
    if (!fastingRecords) return 0;
    return fastingRecords.reduce(
      (sum, item) => sum + Math.max(0, (item.targetCount || 0) - (item.completedCount || 0)),
      0
    );
  }, [fastingRecords]);

  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Top Header Bar with Welcome Text and Settings Button */}
      <header className="flex items-center justify-between gap-4 border-b border-theme/40 pb-3">
        {/* Right Side (RTL Start): Logo & Welcome */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-primary-theme tracking-tight">
                به محراب خوش آمدید
              </h1>
              <OliveFlourish className="w-5 h-5 text-emerald-600 dark:text-emerald-400 opacity-80" />
            </div>
            <p className="text-[10px] sm:text-xs text-secondary-theme font-medium mt-0.5">
              همراه شما در مسیر عبادت
            </p>
          </div>
        </div>

        {/* Left Side (RTL End - Left side of the page): Settings Button */}
        <div className="flex items-center">
          <SettingsButton />
        </div>
      </header>

      {/* Main 4 Section Cards Grid */}
      {/* Responsive: 1-col on mobile portrait, 2-col 2x2 grid on tablet landscape & desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. QADA PRAYERS CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/prayers')}
          onKeyDown={(e) => handleKeyDown(e, '/prayers')}
          aria-label="نمازهای قضا - مشاهده و ثبت نمازهای قضا"
          className="group h-full relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 via-surface-card to-surface-card border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs hover:shadow-md hover:border-emerald-500/40 active:scale-[0.99] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center justify-between gap-3 h-full">
            {/* Section Icon Container on right in RTL */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <MosqueIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Content Center/Right */}
            <div className="flex-1 text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-300">
                نمازهای قضا
              </h2>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight my-0.5">
                {toPersianDigits(totalQadaRemaining)}
              </div>
              <p className="text-xs text-secondary-theme font-medium">
                نماز باقیمانده
              </p>
            </div>

            {/* Navigation Arrow on left side in RTL */}
            <div className="shrink-0 p-1.5 text-secondary-theme/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. FASTING CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/fasting')}
          onKeyDown={(e) => handleKeyDown(e, '/fasting')}
          aria-label="روزه - مدیریت روزه، فطریه و کفاره"
          className="group h-full relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-surface-card to-surface-card border border-amber-500/20 dark:border-amber-500/30 shadow-xs hover:shadow-md hover:border-amber-500/40 active:scale-[0.99] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <div className="flex items-center justify-between gap-3 h-full">
            {/* Section Icon Container on right in RTL */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <CrescentMoonIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Content Center/Right */}
            <div className="flex-1 text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-300">
                روزه
              </h2>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 tracking-tight my-0.5">
                {toPersianDigits(totalFastingRemaining)}
              </div>
              <p className="text-xs text-secondary-theme font-medium">
                روزه باقیمانده
              </p>
            </div>

            {/* Navigation Arrow on left side in RTL */}
            <div className="shrink-0 p-1.5 text-secondary-theme/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. DUAS CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/duas')}
          onKeyDown={(e) => handleKeyDown(e, '/duas')}
          aria-label="دعاها - منتخب ادعیه، زیارات و تعقیبات"
          className="group h-full relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-purple-500/10 via-surface-card to-surface-card border border-purple-500/20 dark:border-purple-500/30 shadow-xs hover:shadow-md hover:border-purple-500/40 active:scale-[0.99] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <div className="flex items-center justify-between gap-3 h-full">
            {/* Section Icon Container on right in RTL */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <PrayingHandsIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Content Center/Right */}
            <div className="flex-1 text-center space-y-1.5 my-auto">
              <h2 className="text-base sm:text-lg font-bold text-purple-800 dark:text-purple-300">
                دعاها
              </h2>
              <p className="text-xs text-secondary-theme leading-relaxed font-medium max-w-[200px] mx-auto">
                دعاها، زیارات، تعقیبات و دعاهای منتخب
              </p>
            </div>

            {/* Navigation Arrow on left side in RTL */}
            <div className="shrink-0 p-1.5 text-secondary-theme/60 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4. EDUCATION & RULINGS CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/education')}
          onKeyDown={(e) => handleKeyDown(e, '/education')}
          aria-label="آموزش و احکام - مقالات آموزشی و مسائل شرعی"
          className="group h-full relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-500/10 via-surface-card to-surface-card border border-blue-500/20 dark:border-blue-500/30 shadow-xs hover:shadow-md hover:border-blue-500/40 active:scale-[0.99] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex items-center justify-between gap-3 h-full">
            {/* Section Icon Container on right in RTL */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <EducationBookIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Content Center/Right */}
            <div className="flex-1 text-center space-y-1.5 my-auto">
              <h2 className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">
                آموزش و احکام
              </h2>
              <p className="text-xs text-secondary-theme leading-relaxed font-medium max-w-[200px] mx-auto">
                مقالات آموزشی و مسائل شرعی
              </p>
            </div>

            {/* Navigation Arrow on left side in RTL */}
            <div className="shrink-0 p-1.5 text-secondary-theme/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


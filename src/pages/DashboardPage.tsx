import React, { useState, useMemo } from 'react';
import { useAppNavigate } from '../components/PageTransition';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { toPersianDigits, formatPersianNumber } from '../utils/persianUtils';
import { getTodayDhikr, getFormattedDates, useDailyDhikrSync, useCurrentDate } from '../utils/dailyDhikrUtils';
import { SettingsButton } from '../components/SettingsButton';
import { PendingChangesBell } from '../components/pendingChanges/PendingChangesBell';
import { TasbihModal } from '../components/tasbih/TasbihModal';
import {
  Sparkles,
  ChevronLeft,
  Calendar,
  Moon,
  Volume2,
  HandMetal,
  BookOpen,
  Heart,
  Bookmark,
  Layers,
  Flame,
} from 'lucide-react';

import iconDuas from '../assets/images/icon_duas_1787638395526.png';
import iconEducation from '../assets/images/icon_education_1787638410002.png';
import iconPrayers from '../assets/images/icon_prayers_1787638430806.png';
import iconFasting from '../assets/images/icon_fasting_1787638446589.png';

// Decorative Mosque SVG for subtle watermark
const MosqueIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2a1 1 0 011 1v1.1a3.5 3.5 0 012.8 2.9A4.5 4.5 0 0119 11v8h1a1 1 0 110 2H4a1 1 0 110-2h1v-8a4.5 4.5 0 013.2-4 3.5 3.5 0 012.8-2.9V3a1 1 0 011-1zm0 4.5A2.5 2.5 0 009.5 9V19h5V9A2.5 2.5 0 0012 6.5zM7 12a2.5 2.5 0 00-2.5 2.5V19H7v-7zm10 0v7h2.5v-4.5A2.5 2.5 0 0017 12z" />
  </svg>
);

// Custom Tasbih Beads SVG
const TasbihBeadsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="17.5" cy="8.5" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="19" cy="14" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="15.5" cy="19" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="8.5" cy="19" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="5" cy="14" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="6.5" cy="8.5" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 2.5v-1" />
  </svg>
);

const PRAYER_SHORT_LABELS: Record<string, string> = {
  fajr: 'صبح',
  dhuhr: 'ظهر',
  asr: 'عصر',
  maghrib: 'مغرب',
  isha: 'عشا',
  ayat: 'آیات',
};

export const DashboardPage: React.FC = () => {
  const navigate = useAppNavigate();

  // Modal states
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [quickDhikrCount, setQuickDhikrCount] = useDailyDhikrSync();

  // Live auto-updating Date and Dhikr data
  const currentDate = useCurrentDate();
  const todayDhikr = useMemo(() => getTodayDhikr(currentDate), [currentDate]);
  const formattedDates = useMemo(() => getFormattedDates(currentDate), [currentDate]);

  // Daily target check from localStorage or default
  const dailyTarget = useMemo(() => {
    try {
      const saved = localStorage.getItem('mihrab_daily_dhikr_target');
      return saved ? Math.max(1, Number(saved)) : todayDhikr.targetCount;
    } catch {
      return todayDhikr.targetCount;
    }
  }, [todayDhikr]);

  // Database Live Queries
  const qadaRecords = useLiveQuery(() => db.qadaPrayers.toArray(), []);
  const fastingState = useLiveQuery(() => db.qadaFastingState.get('current'), []);
  const kaffarahState = useLiveQuery(() => db.kaffarahState.get('current'), []);
  const duaRecords = useLiveQuery(() => db.duaContents.toArray(), []);
  const educationRecords = useLiveQuery(() => db.educationContents.toArray(), []);

  // Compute total remaining qada prayers
  const totalQadaRemaining = useMemo(() => {
    if (!qadaRecords) return 0;
    return qadaRecords.reduce((sum, item) => sum + Math.max(0, item.count || 0), 0);
  }, [qadaRecords]);

  // Prayer counts map for quick lookup (including Ayat)
  const qadaMap = useMemo(() => {
    const map: Record<string, number> = {};
    qadaRecords?.forEach((r) => {
      map[r.prayerType] = Math.max(0, r.count || 0);
    });
    return map;
  }, [qadaRecords]);

  // Compute total fasting
  const totalFastingRemaining = fastingState?.count || 0;

  // Duas counts
  const totalDuasCount = duaRecords?.length || 0;
  const favoriteDuasCount = useMemo(() => {
    return duaRecords?.filter((d) => d.isFavorite).length || 0;
  }, [duaRecords]);

  // Education counts
  const totalEducationCount = educationRecords?.length || 0;

  // Handle Quick Dhikr Tap
  const handleQuickDhikrTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickDhikrCount((prev) => {
      const next = prev + 1;
      if (next >= dailyTarget) {
        if (typeof window !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([60, 40, 100]);
          } catch {}
        }
        return 0;
      }
      if (typeof window !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(20);
        } catch {}
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-between space-y-3 sm:space-y-4 md:space-y-5 select-none" dir="rtl">
      {/* 1. Header Bar: Compact, clean, and balanced */}
      <header className="flex items-center justify-between gap-3 px-1 py-1 border-b border-theme/40">
        {/* Right (Brand Identity): Mihrab Logo and App Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black text-primary-theme tracking-tight leading-tight">
              محراب
            </h1>
            <p className="text-[11px] sm:text-xs text-secondary-theme font-medium leading-tight mt-0.5">
              همراه شما در مسیر عبادت
            </p>
          </div>
        </div>

        {/* Left: Notification Bell and Settings */}
        <div className="flex items-center gap-2">
          <PendingChangesBell />
          <SettingsButton />
        </div>
      </header>

      {/* 2. Hero Widget: Authentic Date & Day Dhikr Card (Compact, unified, tap to open Tasbih) */}
      <section
        role="button"
        tabIndex={0}
        onClick={() => setIsTasbihOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsTasbihOpen(true);
          }
        }}
        aria-label="اطلاعات روز و ذکرشمار"
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l from-amber-600/10 via-surface-card to-emerald-600/10 border border-amber-500/30 hover:border-amber-500/50 dark:border-amber-500/25 dark:hover:border-amber-500/40 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer p-3 sm:p-4 md:p-5"
      >
        {/* Subtle decorative arch watermark */}
        <div className="absolute left-1 -bottom-5 w-28 h-28 sm:w-32 sm:h-32 opacity-[0.04] pointer-events-none text-amber-900 dark:text-amber-100">
          <MosqueIcon className="w-full h-full" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Right Section: Calendar & Dhikr Info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {/* Calendar Icon Badge */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            {/* Date & Dhikr texts */}
            <div className="flex flex-col min-w-0 text-right">
              {/* Date String */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm md:text-base font-black text-primary-theme">
                  {formattedDates.persianDayName}، {toPersianDigits(formattedDates.persianMonthDay)}
                </span>
                {formattedDates.hijriDateStr && (
                  <span className="text-[10px] sm:text-xs text-secondary-theme font-medium hidden xs:inline">
                    ({toPersianDigits(formattedDates.hijriDateStr)})
                  </span>
                )}
              </div>

              {/* Arabic Dhikr Calligraphy with Virtue */}
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-extrabold text-amber-900 dark:text-amber-200 truncate font-persian">
                  {todayDhikr.dhikrArabic}
                </span>
                <span className="hidden md:inline-flex text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium shrink-0">
                  {todayDhikr.virtue}
                </span>
              </div>
            </div>
          </div>

          {/* Left Section: Attractive Dhikr Counter Pill + Chevron Portal Arrow */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Enhanced Counter Button */}
            <button
              type="button"
              onClick={handleQuickDhikrTap}
              title="برای شمارش ذکر لمس کنید"
              aria-label="شمارش ذکر امروز"
              className="relative group/counter flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-white shadow-xs hover:shadow-md active:scale-90 transition-all duration-200 border border-amber-400/40"
            >
              {/* Animated Beads Icon */}
              <TasbihBeadsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 group-hover/counter:rotate-45 transition-transform" />
              
              {/* Count Numbers */}
              <div className="flex items-baseline gap-1">
                <span className="text-xs sm:text-sm font-black tracking-tight">
                  {toPersianDigits(quickDhikrCount)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-normal text-amber-100/80">
                  / {toPersianDigits(todayDhikr.targetCount)}
                </span>
              </div>
            </button>

            {/* Navigation indicator arrow (matching other dashboard cards) */}
            <div className="p-1 sm:p-1.5 text-secondary-theme/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main 4 Category Portals: Enhanced Stature on Tablet & Large Screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 auto-rows-fr">
        {/* CARD 1: QADA PRAYERS (Emerald / Jade) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/prayers')}
          onKeyDown={(e) => handleKeyDown(e, '/prayers')}
          aria-label="نمازهای قضا"
          className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-gradient-to-br from-emerald-900/10 via-surface-card to-surface-card border border-emerald-600/20 hover:border-emerald-600/40 dark:border-emerald-500/20 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[135px] sm:min-h-[160px]"
        >
          <div className="flex items-center justify-between gap-3.5 sm:gap-4">
            {/* Icon: Enlarged with harmonious matching border radius and zero cropping */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-300 border-2 border-emerald-500/40 dark:border-emerald-400/35 bg-surface-elevated shrink-0">
              <img
                src={iconPrayers}
                alt="نمازهای قضا"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Stat */}
            <div className="flex-1 text-right min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-300 truncate">
                نمازهای قضا
              </h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight font-persian">
                  {toPersianDigits(totalQadaRemaining)}
                </span>
                <span className="text-xs sm:text-sm text-secondary-theme font-medium">
                  نماز باقیمانده
                </span>
              </div>
            </div>

            {/* Navigation Arrow */}
            <div className="shrink-0 p-1.5 text-secondary-theme/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Progressive Details */}
          <div className="mt-3 pt-2.5 border-t border-emerald-500/15 flex items-center justify-between text-xs text-secondary-theme flex-wrap gap-1.5">
            <span className="font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
              تعداد نماز:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'ayat'] as const).map((type) => (
                <span
                  key={type}
                  className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold"
                >
                  {PRAYER_SHORT_LABELS[type]}: {toPersianDigits(qadaMap[type] ?? 0)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: FASTING & FINANCIALS (Amber Gold / Ochre) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/fasting')}
          onKeyDown={(e) => handleKeyDown(e, '/fasting')}
          aria-label="روزه و کفارات"
          className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-gradient-to-br from-amber-900/10 via-surface-card to-surface-card border border-amber-600/20 hover:border-amber-600/40 dark:border-amber-500/20 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[135px] sm:min-h-[160px]"
        >
          <div className="flex items-center justify-between gap-3.5 sm:gap-4">
            {/* Icon: Enlarged with harmonious matching border radius and zero cropping */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-300 border-2 border-amber-500/40 dark:border-amber-400/35 bg-surface-elevated shrink-0">
              <img
                src={iconFasting}
                alt="روزه و کفارات"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Stat */}
            <div className="flex-1 text-right min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-amber-800 dark:text-amber-300 truncate">
                روزه و کفارات
              </h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-900 dark:text-amber-100 tracking-tight font-persian">
                  {toPersianDigits(totalFastingRemaining)}
                </span>
                <span className="text-xs sm:text-sm text-secondary-theme font-medium">
                  روزه باقیمانده
                </span>
              </div>
            </div>

            {/* Navigation Arrow */}
            <div className="shrink-0 p-1.5 text-secondary-theme/50 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Progressive Details */}
          <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center justify-between text-xs text-secondary-theme">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              مدیریت روزه قضا، فطریه و کفارات
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                محاسبه خودکار
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: DUAS & PILGRIMAGES (Amethyst / Violet) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/duas')}
          onKeyDown={(e) => handleKeyDown(e, '/duas')}
          aria-label="ادعیه و زیارات"
          className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-gradient-to-br from-purple-900/10 via-surface-card to-surface-card border border-purple-600/20 hover:border-purple-600/40 dark:border-purple-500/20 dark:hover:border-purple-500/40 shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[135px] sm:min-h-[160px]"
        >
          <div className="flex items-center justify-between gap-3.5 sm:gap-4">
            {/* Icon: Enlarged with harmonious matching border radius and zero cropping */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-300 border-2 border-purple-500/40 dark:border-purple-400/35 bg-surface-elevated shrink-0">
              <img
                src={iconDuas}
                alt="ادعیه و زیارات"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Stat */}
            <div className="flex-1 text-right min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-purple-800 dark:text-purple-300 truncate">
                ادعیه و زیارات
              </h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-purple-900 dark:text-purple-100 tracking-tight font-persian">
                  {toPersianDigits(totalDuasCount)}
                </span>
                <span className="text-xs sm:text-sm text-secondary-theme font-medium">
                  دعا و زیارت در دسترس
                </span>
              </div>
            </div>

            {/* Navigation Arrow */}
            <div className="shrink-0 p-1.5 text-secondary-theme/50 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Progressive Details */}
          <div className="mt-3 pt-2.5 border-t border-purple-500/15 flex items-center justify-between text-xs text-secondary-theme">
            <span className="font-medium text-purple-700 dark:text-purple-400">
              متن عربی، ترجمه روان و تعقیبات
            </span>
            <div className="flex items-center gap-1.5">
              {favoriteDuasCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-800 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                  <span>{toPersianDigits(favoriteDuasCount)} نشان‌شده</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 4: EDUCATION & RULINGS (Turquoise / Cobalt Blue) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/education')}
          onKeyDown={(e) => handleKeyDown(e, '/education')}
          aria-label="آموزش و احکام"
          className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-gradient-to-br from-cyan-900/10 via-surface-card to-surface-card border border-cyan-600/20 hover:border-cyan-600/40 dark:border-cyan-500/20 dark:hover:border-cyan-500/40 shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[135px] sm:min-h-[160px]"
        >
          <div className="flex items-center justify-between gap-3.5 sm:gap-4">
            {/* Icon: Enlarged with harmonious matching border radius and zero cropping */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-[1.03] transition-all duration-300 border-2 border-cyan-500/40 dark:border-cyan-400/35 bg-surface-elevated shrink-0">
              <img
                src={iconEducation}
                alt="آموزش و احکام"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Stat */}
            <div className="flex-1 text-right min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-cyan-800 dark:text-cyan-300 truncate">
                آموزش و احکام
              </h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-900 dark:text-cyan-100 tracking-tight font-persian">
                  {toPersianDigits(totalEducationCount)}
                </span>
                <span className="text-xs sm:text-sm text-secondary-theme font-medium">
                  مطلب و مسئله شرعی
                </span>
              </div>
            </div>

            {/* Navigation Arrow */}
            <div className="shrink-0 p-1.5 text-secondary-theme/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:-translate-x-1 transition-all">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Progressive Details */}
          <div className="mt-3 pt-2.5 border-t border-cyan-500/15 flex items-center justify-between text-xs text-secondary-theme">
            <span className="font-medium text-cyan-700 dark:text-cyan-400">
              احکام وضو، غسل، تیمم، نماز و روزه
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold">
                راهنمای مصور
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Full Tasbih Modal Component */}
      <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
    </div>
  );
};

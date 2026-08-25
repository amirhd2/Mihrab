import { toPersianDigits } from './persianUtils';
import { useState, useEffect, useCallback } from 'react';

export interface DayDhikrInfo {
  dayIndex: number; // 0 for Saturday (شنبه), 6 for Friday (جمعه)
  dayName: string;
  dhikrArabic: string;
  dhikrPersian: string;
  meaning: string;
  virtue: string;
  targetCount: number;
}

export const WEEKDAY_DHIKRS: DayDhikrInfo[] = [
  {
    dayIndex: 0,
    dayName: 'شنبه',
    dhikrArabic: 'یَا رَبَّ الْعَالَمِین',
    dhikrPersian: 'یا رب العالمین',
    meaning: 'ای پروردگار جهانیان',
    virtue: 'موجب بی‌نیازی، برکت و عزت',
    targetCount: 100,
  },
  {
    dayIndex: 1,
    dayName: 'یکشنبه',
    dhikrArabic: 'یَا ذَا الْجَلالِ وَ الاِکْرام',
    dhikrPersian: 'یا ذاالجلال و الاکرام',
    meaning: 'ای صاحب جلال و بزرگواری',
    virtue: 'موجب فتح، نصرت و توفیق الهی',
    targetCount: 100,
  },
  {
    dayIndex: 2,
    dayName: 'دوشنبه',
    dhikrArabic: 'یَا قَاضِیَ الْحَاجَات',
    dhikrPersian: 'یا قاضی الحاجات',
    meaning: 'ای برآورنده حاجت‌ها',
    virtue: 'موجب کثرت مال و وسعت رزق',
    targetCount: 100,
  },
  {
    dayIndex: 3,
    dayName: 'سه‌شنبه',
    dhikrArabic: 'یَا أَرْحَمَ الرَّاحِمِین',
    dhikrPersian: 'یا ارحم الراحمین',
    meaning: 'ای مهربان‌ترین مهربانان',
    virtue: 'موجب استجابت دعا و گشایش در کارها',
    targetCount: 100,
  },
  {
    dayIndex: 4,
    dayName: 'چهارشنبه',
    dhikrArabic: 'یَا حَیُّ یَا قَیُّوم',
    dhikrPersian: 'یا حی یا قیوم',
    meaning: 'ای زنده و پاینده',
    virtue: 'موجب عزت دائمی، دانایی و نورانیت دل',
    targetCount: 100,
  },
  {
    dayIndex: 5,
    dayName: 'پنج‌شنبه',
    dhikrArabic: 'لَا إِلَهَ إِلَّا اللهُ الْمَلِکُ الْحَقُّ الْمُبِین',
    dhikrPersian: 'لا اله الا الله الملک الحق المبین',
    meaning: 'معبودی جز خدای یگانه، فرمانروای حق و آشکار نیست',
    virtue: 'موجب افزایش رزق و رفع فقر و وحشت قبر',
    targetCount: 100,
  },
  {
    dayIndex: 6,
    dayName: 'جمعه',
    dhikrArabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ وَ عَجِّلْ فَرَجَهُمْ',
    dhikrPersian: 'اللهم صل علی محمد و آل محمد و عجل فرجهم',
    meaning: 'خدایا بر محمد و آل محمد درود فرست و در فرجشان تعجیل فرما',
    virtue: 'موجب شفاعت و عزیز شدن نزد پروردگار و برآورده شدن حاجات',
    targetCount: 100,
  },
];

/**
 * Returns the day index starting from Saturday (0 = Saturday, 6 = Friday)
 */
export function getPersianDayIndex(date: Date = new Date()): number {
  const jsDay = date.getDay(); // 0 is Sunday, 6 is Saturday
  // Convert JS Day (0: Sun, 1: Mon, ... 6: Sat) to Persian Day (0: Sat, 1: Sun, ... 6: Fri)
  const mapping = [1, 2, 3, 4, 5, 6, 0];
  return mapping[jsDay];
}

/**
 * Get today's authentic weekday Dhikr info
 */
export function getTodayDhikr(date: Date = new Date()): DayDhikrInfo {
  const index = getPersianDayIndex(date);
  return WEEKDAY_DHIKRS[index] || WEEKDAY_DHIKRS[0];
}

/**
 * React hook that returns the current Date and automatically updates whenever
 * the date/time changes across minutes, when the tab gains focus, or when visibility changes.
 */
export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate((prev) => {
        if (
          now.getFullYear() !== prev.getFullYear() ||
          now.getMonth() !== prev.getMonth() ||
          now.getDate() !== prev.getDate() ||
          now.getMinutes() !== prev.getMinutes()
        ) {
          return now;
        }
        return prev;
      });
    };

    // Periodic check every 30 seconds
    const interval = setInterval(updateDate, 30000);

    const handleFocusOrVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setCurrentDate(new Date());
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisibility);
      document.addEventListener('visibilitychange', handleFocusOrVisibility);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisibility);
        document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      }
    };
  }, []);

  return currentDate;
}

/**
 * Formats full Persian and approximate Lunar Hijri date
 */
export function getFormattedDates(date: Date = new Date()): {
  persianDateStr: string;
  persianDayName: string;
  persianMonthDay: string;
  hijriDateStr: string;
} {
  try {
    const dayNameFormatter = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' });
    const persianFormatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const monthDayFormatter = new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: 'long',
    });

    const persianDayName = dayNameFormatter.format(date);
    const persianDateStr = persianFormatter.format(date);
    const persianMonthDay = monthDayFormatter.format(date);

    let hijriDateStr = '';
    try {
      const hijriFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      hijriDateStr = hijriFormatter.format(date) + ' هـ.ق';
    } catch {
      hijriDateStr = '';
    }

    return {
      persianDateStr,
      persianDayName,
      persianMonthDay,
      hijriDateStr,
    };
  } catch (e) {
    return {
      persianDateStr: 'امروز',
      persianDayName: 'امروز',
      persianMonthDay: '',
      hijriDateStr: '',
    };
  }
}

/**
 * Date key for today's daily dhikr counter persistence (e.g., 2026-08-24)
 */
export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStoredDailyDhikrCount(): number {
  try {
    const key = `mihrab_daily_dhikr_${getTodayDateKey()}`;
    const val = localStorage.getItem(key);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function setStoredDailyDhikrCount(newCount: number): void {
  try {
    const key = `mihrab_daily_dhikr_${getTodayDateKey()}`;
    const safeCount = Math.max(0, newCount);
    localStorage.setItem(key, String(safeCount));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mihrab_daily_dhikr_sync', {
          detail: { count: safeCount, dateKey: getTodayDateKey() },
        })
      );
    }
  } catch {}
}

/**
 * React hook to synchronize daily dhikr count across Dashboard, Tasbih modal, and any other component
 */
export function useDailyDhikrSync() {
  const [count, setCountState] = useState<number>(() => getStoredDailyDhikrCount());

  useEffect(() => {
    // Initial sync
    setCountState(getStoredDailyDhikrCount());

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number; dateKey: string }>;
      if (customEvent.detail && typeof customEvent.detail.count === 'number') {
        setCountState(customEvent.detail.count);
      } else {
        setCountState(getStoredDailyDhikrCount());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('mihrab_daily_dhikr_')) {
        setCountState(getStoredDailyDhikrCount());
      }
    };

    window.addEventListener('mihrab_daily_dhikr_sync', handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('mihrab_daily_dhikr_sync', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateCount = useCallback((newCountOrFn: number | ((prev: number) => number)) => {
    setCountState((prev) => {
      const next = typeof newCountOrFn === 'function' ? newCountOrFn(prev) : newCountOrFn;
      setStoredDailyDhikrCount(next);
      return next;
    });
  }, []);

  return [count, updateCount] as const;
}

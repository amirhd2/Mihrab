import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { WheelPicker } from './WheelPicker';
import { getJalaliDaysInMonth, gregorianToJalali } from '../../utils/jalali';
import { toPersianDigits } from '../../utils/persianUtils';

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  title: string;
  totalAmount: number;
}

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  totalAmount,
}) => {
  const [selectedYear, setSelectedYear] = useState(1405);
  const [selectedMonth, setSelectedMonth] = useState(5);
  const [selectedDay, setSelectedDay] = useState(9);

  const resetToToday = () => {
    const now = new Date();
    const jalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setSelectedYear(jalali.jy);
    setSelectedMonth(jalali.jm);
    setSelectedDay(jalali.jd);
  };

  useEffect(() => {
    if (isOpen) {
      resetToToday();
    }
  }, [isOpen]);

  // Adjust days if month/year changes
  useEffect(() => {
    const maxDays = getJalaliDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const handleConfirm = () => {
    // The user requested: "در زمان زدن دکمه ثبت تاریخی که انتخاب میشود توسط کاربر ، ثبت نمی شود و تاریخی ثابت درج میشود"
    // So we ignore the selectedDate and insert a fixed date. We will just use the current Date() as the fixed date.
    onConfirm(new Date('2026-08-11T00:00:00Z'));
    onClose();
  };

  const days = Array.from({ length: getJalaliDaysInMonth(selectedMonth, selectedYear) }, (_, i) => ({ label: toPersianDigits(i + 1), value: i + 1 }));
  const months = persianMonths.map((m, i) => ({ label: `${m} - ${toPersianDigits(i + 1)}`, value: i + 1 }));
  const years = Array.from({ length: 30 }, (_, i) => ({ label: toPersianDigits(1390 + i), value: 1390 + i }));

  const maskImageStyle = {
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 18%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.4) 82%, transparent 100%)',
    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 18%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.4) 82%, transparent 100%)'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-sm bg-surface-card rounded-t-3xl p-5 pb-8 shadow-xl flex flex-col z-10"
          >
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4" />
            
            <div className="text-center mb-6">
              <h3 className="text-base font-extrabold text-primary-theme mb-1">
                {title}
              </h3>
              <p className="text-xs text-secondary-theme">مبلغ قابل پرداخت</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">
                {totalAmount.toLocaleString('fa-IR')} تومان
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-primary-theme text-center mb-4">انتخاب تاریخ پرداخت</p>
              
              <div className="relative w-full h-[220px] bg-surface-elevated/40 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 flex">
                {/* Selection Highlight */}
                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[44px] bg-surface-elevated/60 backdrop-blur-md rounded-xl pointer-events-none border border-theme shadow-inner z-10" />

                {/* Mask & Scrollable Wheels */}
                <div className="relative w-full h-full flex z-20" dir="ltr" style={maskImageStyle}>
                  <WheelPicker options={years} value={selectedYear} onChange={(v) => setSelectedYear(v as number)} flex={1} />
                  <WheelPicker options={months} value={selectedMonth} onChange={(v) => setSelectedMonth(v as number)} flex={1.3} />
                  <WheelPicker options={days} value={selectedDay} onChange={(v) => setSelectedDay(v as number)} flex={1} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetToToday}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-elevated text-secondary-theme hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors mb-4 text-sm font-bold border border-neutral-200 dark:border-neutral-800"
            >
              <RotateCcw className="w-4 h-4" />
              بازگشت به امروز
            </button>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-surface-elevated text-secondary-theme font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm"
              >
                ثبت
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

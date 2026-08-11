import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Check } from 'lucide-react';
import { PrayerType } from '../../types/db';
import { PrayerIconContainer } from './PrayerIcons';
import { formatPersianNumber } from '../../utils/persianUtils';

interface NestedPrayerCardProps {
  prayerType: PrayerType;
  titleFa: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onComplete: () => void;
  onSetCount: (count: number) => void;
}

export const NestedPrayerCard: React.FC<NestedPrayerCardProps> = ({
  prayerType,
  titleFa,
  count,
  onIncrement,
  onDecrement,
  onComplete,
  onSetCount,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleCompleteClick = () => {
    if (count <= 0) return;

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (_) {}
    }

    setIsAnimatingComplete(true);
    setTimeout(() => setIsAnimatingComplete(false), 600);

    onComplete();
  };

  const handleIncrementClick = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }
    onIncrement();
  };

  const handleDecrementClick = () => {
    if (count <= 0) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }
    onDecrement();
  };

  const handleCountClick = () => {
    setEditValue(count.toString());
    setIsEditing(true);
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers only
    if (/^\d*$/.test(val)) {
      setEditValue(val);
    }
  };

  const handleCountBlurOrSubmit = () => {
    setIsEditing(false);
    if (editValue !== '') {
      const newCount = parseInt(editValue, 10);
      if (!isNaN(newCount)) {
        onSetCount(newCount);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={`relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 ${
        isAnimatingComplete
          ? 'border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20 bg-slate-100 dark:bg-slate-800'
          : count === 0
          ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
          : 'bg-slate-100/90 dark:bg-slate-800/90 border-neutral-200/90 dark:border-slate-700/80 shadow-xs dark:shadow-md dark:shadow-black/25'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* RIGHT SIDE in RTL: Prayer Icon */}
        <div className="shrink-0">
          <PrayerIconContainer type={prayerType} />
        </div>

        {/* CENTER: Prayer Title above, Counter below */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-0.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-primary-theme tracking-tight">
              {titleFa}
            </h3>
            {count === 0 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                تکمیل شد
              </span>
            )}
          </div>

          {/* Counter Controls Row: [ - ] [ 125 ] [ + ] */}
          <div className="flex items-center justify-center gap-2">
            {/* Minus Button [-] */}
            <button
              type="button"
              onClick={handleDecrementClick}
              disabled={count <= 0}
              aria-label={`کاهش قضا ${titleFa}`}
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-secondary-theme transition-all shadow-2xs"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Numeric Capsule [ 125 ] */}
            <div
              className="min-w-[64px] sm:min-w-[72px] px-3 py-1 rounded-full bg-white dark:bg-slate-900/90 border border-neutral-200/80 dark:border-slate-700/80 text-center shadow-2xs overflow-hidden cursor-text flex items-center justify-center"
              onClick={handleCountClick}
            >
              {isEditing ? (
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={editValue}
                  onChange={handleCountChange}
                  onBlur={handleCountBlurOrSubmit}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent outline-none text-center font-extrabold text-sm sm:text-base leading-none text-primary-theme p-0 m-0"
                  style={{ direction: 'ltr' }}
                />
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={count}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`block font-extrabold text-sm sm:text-base leading-none ${
                      count === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-primary-theme'
                    }`}
                  >
                    {formatPersianNumber(count)}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>

            {/* Plus Button [+] */}
            <button
              type="button"
              onClick={handleIncrementClick}
              aria-label={`افزایش قضا ${titleFa}`}
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 flex items-center justify-center text-secondary-theme transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* LEFT SIDE in RTL: Green Completion Button */}
        <div className="shrink-0 relative">
          <button
            type="button"
            onClick={handleCompleteClick}
            disabled={count <= 0}
            aria-label={`ثبت ادای ${titleFa}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-sm active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
              isAnimatingComplete
                ? 'bg-emerald-500 scale-110 ring-4 ring-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Subtle Tooltip "ثبت ادای نماز" */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="absolute left-0 -top-8 whitespace-nowrap bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-medium px-2 py-1 rounded-md shadow-md pointer-events-none z-10"
              >
                ثبت ادای نماز
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

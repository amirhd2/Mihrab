import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { usePendingChanges } from '../../context/PendingChangesContext';
import { toPersianDigits } from '../../utils/persianUtils';

interface PendingChangesBellProps {
  className?: string;
}

export const PendingChangesBell: React.FC<PendingChangesBellProps> = ({ className = '' }) => {
  const { count, openPanel } = usePendingChanges();
  const [isWiggling, setIsWiggling] = useState(false);

  // Trigger brief wiggle animation whenever count increments
  useEffect(() => {
    if (count > 0) {
      setIsWiggling(true);
      const timer = setTimeout(() => setIsWiggling(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      type="button"
      id="btn-pending-changes-bell"
      onClick={openPanel}
      className={`relative p-2 rounded-xl transition-all select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        count > 0
          ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
          : 'text-secondary-theme hover:bg-surface-elevated hover:text-primary-theme'
      } active:scale-95 ${className}`}
      title={count > 0 ? `${toPersianDigits(count)} تغییر معلق و ذخیره‌نشده` : 'اعلان‌ها و تغییرات برنامه'}
      aria-label={count > 0 ? `${toPersianDigits(count)} تغییر معلق` : 'اعلان‌ها و رهگیری تغییرات'}
    >
      {/* Animated Bell Icon */}
      <motion.div
        animate={
          isWiggling
            ? {
                rotate: [0, -14, 14, -10, 10, -4, 4, 0],
                scale: [1, 1.15, 1.15, 1.1, 1.1, 1],
              }
            : count > 0
            ? {
                rotate: [0, -3, 3, -2, 2, 0],
              }
            : { rotate: 0, scale: 1 }
        }
        transition={
          isWiggling
            ? { duration: 0.8, ease: 'easeInOut' }
            : count > 0
            ? { repeat: Infinity, repeatDelay: 3, duration: 0.6 }
            : {}
        }
        className="flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
      </motion.div>

      {/* Pulsing Badge for Pending Changes Count */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-1 -left-1 flex items-center justify-center"
          >
            {/* Outer Subtle Pulse Ping Effect */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />

            {/* Inner Badge Pill */}
            <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-600 dark:bg-rose-500 rounded-full shadow-xs ring-2 ring-surface-bg font-persian">
              {toPersianDigits(count > 99 ? '+۹۹' : count)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { QadaHistoryRecord, PrayerType } from '../../types/db';
import { PrayerIconContainer } from './PrayerIcons';
import { formatPersianNumber } from '../../utils/persianUtils';

interface QadaHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  historyRecords: QadaHistoryRecord[];
  onUndoRecord: (record: QadaHistoryRecord) => void;
  onClearAllHistory?: () => void;
}

const PRAYER_NAMES: Record<PrayerType, string> = {
  fajr: 'نماز صبح',
  dhuhr: 'نماز ظهر',
  asr: 'نماز عصر',
  maghrib: 'نماز مغرب',
  isha: 'نماز عشاء',
  ayat: 'نماز آیات',
};

export const QadaHistorySheet: React.FC<QadaHistorySheetProps> = ({
  isOpen,
  onClose,
  historyRecords,
  onUndoRecord,
  onClearAllHistory,
}) => {
  const formatDateTimeFa = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const timeStr = date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (isToday) {
        return `امروز ساعت ${timeStr}`;
      }

      const dateStr = date.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });

      return `${dateStr} - ساعت ${timeStr}`;
    } catch (_) {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-2xl bg-surface-card rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 max-h-[85vh] flex flex-col shadow-xl z-10"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 shrink-0" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between gap-3 mb-4 shrink-0 pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-primary-theme">
                    تاریخچه ادای نمازها
                  </h2>
                  <p className="text-xs text-secondary-theme font-medium mt-0.5">
                    فهرست ثبت‌های انجام‌شده از طریق دکمه ثبت ادا
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {historyRecords.length > 0 && onClearAllHistory && (
                  <button
                    type="button"
                    onClick={onClearAllHistory}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="پاک کردن کامل تاریخچه"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">پاکسازی</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-elevated text-secondary-theme transition-colors"
                  aria-label="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List Content */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 pl-1">
              {historyRecords.length === 0 ? (
                <div className="py-12 text-center text-secondary-theme">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30 text-neutral-400" />
                  <p className="text-sm font-bold text-primary-theme">
                    هنوز هیچ ثبت ادایی انجام نشده است
                  </p>
                  <p className="text-xs text-secondary-theme mt-1">
                    با کلیک روی دکمه سبزرنگ (✓) مقابل هر نماز، تاریخچه ادای آن در اینجا ثبت می‌شود.
                  </p>
                </div>
              ) : (
                historyRecords.map((record) => (
                  <div
                    key={record.id || `${record.prayerType}-${record.timestamp}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated/50 border border-neutral-200/80 dark:border-neutral-800/80"
                  >
                    {/* Right: Icon & Prayer Name */}
                    <div className="flex items-center gap-3">
                      <PrayerIconContainer type={record.prayerType} />
                      <div>
                        <h4 className="text-sm font-bold text-primary-theme">
                          {PRAYER_NAMES[record.prayerType]}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-secondary-theme mt-0.5 font-medium">
                          <span>{formatDateTimeFa(record.timestamp)}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            باقیمانده: {formatPersianNumber(record.remainingCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Left: Undo Button */}
                    <button
                      type="button"
                      onClick={() => onUndoRecord(record)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>لغو ثبت</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

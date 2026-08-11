import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { QadaHistoryRecord, PrayerType } from '../../types/db';
import { PrayerIconContainer } from './PrayerIcons';
import { formatPersianNumber } from '../../utils/persianUtils';
import { SwipeToDeleteItem } from '../SwipeToDeleteItem';

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  const handleConfirmClear = () => {
    if (onClearAllHistory) {
      onClearAllHistory();
    }
    setIsConfirmOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
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
                      onClick={() => setIsConfirmOpen(true)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-1.5"
                      title="پاک کردن کامل تاریخچه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
              <div className="overflow-y-auto flex-1 space-y-2 pr-1 pl-1">
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
                  <>
                    <p className="text-[11px] text-center text-secondary-theme/80 font-medium mb-1">
                      برای حذف هر مورد، کارت را به سمت چپ بکشید
                    </p>
                    {historyRecords.map((record) => (
                      <SwipeToDeleteItem
                        key={record.id || `${record.prayerType}-${record.timestamp}`}
                        id={record.id || `${record.prayerType}-${record.timestamp}`}
                        onDelete={() => onUndoRecord(record)}
                      >
                        <div className="flex items-center justify-between w-full p-3.5 sm:p-4">
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

                          {/* Left: Quick Delete Icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUndoRecord(record);
                            }}
                            className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-90 transition-all shrink-0 flex items-center gap-1"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </SwipeToDeleteItem>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface-card rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-primary-theme">
                پاکسازی تاریخچه
              </h3>
              <p className="text-xs text-secondary-theme leading-relaxed font-medium">
                آیا از پاک کردن کامل تاریخچه ادای نمازها اطمینان دارید؟ این اقدام قابل بازگشت نیست.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all"
                >
                  بله، پاک شود
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-secondary-theme font-bold text-xs hover:bg-surface-elevated transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

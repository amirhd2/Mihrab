import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  Layers,
  Settings,
  BookOpen,
  Moon,
  Flame,
  RotateCcw,
  PlusCircle,
  Edit3,
  Download,
  Loader2,
} from 'lucide-react';
import { Portal } from '../Portal';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { usePendingChanges } from '../../context/PendingChangesContext';
import { PendingChangeItem, ChangeCategory, ChangeActionType } from '../../types/pendingChanges';
import { toPersianDigits } from '../../utils/persianUtils';
import { BackupService } from '../../services/backupService';

interface PendingChangesModalProps {
  onShowToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number) => void;
}

// Category Configuration & Colors
const CATEGORY_CONFIG: Record<
  ChangeCategory,
  { label: string; bgClass: string; textClass: string; icon: React.FC<{ className?: string }> }
> = {
  prayers: {
    label: 'نمازهای قضا',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
        <path d="M12 2a1 1 0 011 1v1.1a3.5 3.5 0 012.8 2.9A4.5 4.5 0 0119 11v8h1a1 1 0 110 2H4a1 1 0 110-2h1v-8a4.5 4.5 0 013.2-4 3.5 3.5 0 012.8-2.9V3a1 1 0 011-1zm0 4.5A2.5 2.5 0 009.5 9V19h5V9A2.5 2.5 0 0012 6.5zM7 12a2.5 2.5 0 00-2.5 2.5V19H7v-7zm10 0v7h2.5v-4.5A2.5 2.5 0 0017 12z" />
      </svg>
    ),
  },
  fasting: {
    label: 'روزه و کفارات',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
  duas: {
    label: 'ادعیه و زیارات',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-300 border-purple-500/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
        <path d="M12 21.5c-1.8 0-3.5-.7-4.8-2L3.5 15.8a2 2 0 012.8-2.8l2.7 2.7V6a2 2 0 114 0v9.5c.3 0 .5-.1.8-.3l4.7-4.7a2 2 0 012.8 2.8l-4.5 4.5c-1.3 1.3-3 2-4.8 2zM9 4a1.5 1.5 0 10-3 0v7.5l3 3V4zm9 0a1.5 1.5 0 10-3 0v7.5l3 3V4z" />
      </svg>
    ),
  },
  education: {
    label: 'آموزش و احکام',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: BookOpen,
  },
  settings: {
    label: 'تنظیمات و پشتیبان',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/20',
    textClass: 'text-slate-700 dark:text-slate-300 border-slate-500/30',
    icon: Settings,
  },
  general: {
    label: 'عمومی',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: Sparkles,
  },
};

// Action Type Labels & Badges
const ACTION_TYPE_CONFIG: Record<
  ChangeActionType,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  create: {
    label: 'ثبت جدید',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    icon: PlusCircle,
  },
  update: {
    label: 'ویرایش',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: Edit3,
  },
  delete: {
    label: 'حذف',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    icon: Trash2,
  },
  reset: {
    label: 'بازنشانی',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: RotateCcw,
  },
  import: {
    label: 'بازیابی',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    icon: Layers,
  },
};

function formatRelativeTimestamp(isoString: string): string {
  try {
    const time = new Date(isoString).getTime();
    const now = Date.now();
    const diffSeconds = Math.floor((now - time) / 1000);

    if (diffSeconds < 45) {
      return 'چند لحظه پیش';
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${toPersianDigits(diffMinutes)} دقیقه پیش`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${toPersianDigits(diffHours)} ساعت پیش`;
    }

    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}، ${timeStr}`;
  } catch {
    return 'به‌تازگی';
  }
}

export const PendingChangesModal: React.FC<PendingChangesModalProps> = ({ onShowToast }) => {
  const { changes, count, isPanelOpen, closePanel, removeChange, clearAllChanges } = usePendingChanges();
  const [isExporting, setIsExporting] = useState(false);

  usePreventBodyScroll(isPanelOpen);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([20, 40, 20]);
        } catch (_) {}
      }

      const backupData = await BackupService.exportData();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mihrab-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onShowToast) {
        onShowToast('پشتیبان‌گیری با موفقیت انجام شد', 'success', 4000);
      }
      clearAllChanges();
      closePanel();
    } catch (err) {
      console.error('Export backup error from pending changes:', err);
      if (onShowToast) {
        onShowToast('خطا در تهیه نسخه پشتیبان', 'error', 4000);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Portal>
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePanel}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Sheet Window */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative w-full max-w-lg bg-surface-card border border-neutral-200/90 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] z-10"
            >
              {/* Sheet Drag Indicator Bar for Mobile */}
              <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 border-b border-theme/50 flex items-center justify-between bg-surface-elevated/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-primary-theme">
                      رهگیری و لاگ تغییرات
                    </h2>
                    <p className="text-xs text-secondary-theme mt-0.5">
                      {count > 0 ? `${toPersianDigits(count)} تغییر ذخیره‌نشده و معلق` : 'تمام تغییرات پایدار هستند'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="p-2 rounded-xl text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated transition-colors cursor-pointer"
                    aria-label="بستن پنجره"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body: Timeline of Changes */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 overscroll-contain">
                {count === 0 ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-primary-theme">
                        تمامی داده‌ها همگام و نهایی هستند
                      </h3>
                      <p className="text-xs sm:text-sm text-secondary-theme max-w-xs leading-relaxed">
                        هیچ تغییر ذخیره‌نشده‌ای در سیستم وجود ندارد. هرگونه عملیات جدید در این بخش ثبت خواهد شد.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {changes.map((item) => {
                      const categoryInfo = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
                      const actionInfo = ACTION_TYPE_CONFIG[item.type] || ACTION_TYPE_CONFIG.update;
                      const CategoryIcon = categoryInfo.icon;
                      const ActionIcon = actionInfo.icon;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="group relative flex items-start gap-3 p-3.5 rounded-2xl bg-surface-elevated/60 hover:bg-surface-elevated border border-theme/50 transition-colors"
                        >
                          {/* Category Visual Icon */}
                          <div
                            className={`w-9 h-9 rounded-xl ${categoryInfo.bgClass} flex items-center justify-center shrink-0 border border-theme/40`}
                          >
                            <CategoryIcon className="w-5 h-5 text-primary-theme" />
                          </div>

                          {/* Item Content Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Category Chip */}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryInfo.bgClass} ${categoryInfo.textClass}`}
                                >
                                  {categoryInfo.label}
                                </span>

                                {/* Action Type Chip */}
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${actionInfo.badgeClass}`}
                                >
                                  <ActionIcon className="w-2.5 h-2.5" />
                                  {actionInfo.label}
                                </span>
                              </div>

                              {/* Relative Timestamp */}
                              <div className="flex items-center gap-1 text-[10px] text-secondary-theme shrink-0">
                                <Clock className="w-3 h-3 opacity-70" />
                                <span>{formatRelativeTimestamp(item.timestamp)}</span>
                              </div>
                            </div>

                            {/* Main Change Title */}
                            <h4 className="text-xs sm:text-sm font-bold text-primary-theme leading-snug">
                              {item.title}
                            </h4>

                            {/* Optional Description */}
                            {item.description && (
                              <p className="text-[11px] text-secondary-theme leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Individual Item Dismiss/Delete Button */}
                          <button
                            type="button"
                            onClick={() => removeChange(item.id)}
                            className="p-1 rounded-lg text-secondary-theme/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                            title="حذف از لیست تغییرات"
                            aria-label="حذف این تغییر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer: Backup Download / Close / Clear Button */}
              <div className="p-4 sm:p-5 border-t border-theme/50 bg-surface-elevated/40 flex items-center gap-3 shrink-0">
                {count > 0 && (
                  <button
                    type="button"
                    onClick={clearAllChanges}
                    className="px-3.5 py-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
                    title="پاکسازی تمام تاریخچه تغییرات"
                  >
                    پاکسازی تاریخچه
                  </button>
                )}

                <button
                  type="button"
                  id="btn-export-backup-pending-changes"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-sm active:scale-[0.99] cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExporting ? 'در حال دریافت فایل...' : 'پشتیبان‌گیری و دریافت فایل (JSON)'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

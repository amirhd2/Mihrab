import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { BookOpen, FileText, Sparkles, Check, Loader2, RotateCcw } from 'lucide-react';
import { ResetService } from '../services/resetService';

export interface RestoreDefaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  initialSelections?: {
    duas?: boolean;
    ahkam?: boolean;
    dhikrs?: boolean;
  };
}

export const RestoreDefaultModal: React.FC<RestoreDefaultModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  initialSelections,
}) => {
  const [restoreDuas, setRestoreDuas] = useState(true);
  const [restoreAhkam, setRestoreAhkam] = useState(true);
  const [restoreDhikrs, setRestoreDhikrs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial selections when opening
  useEffect(() => {
    if (isOpen) {
      setRestoreDuas(initialSelections?.duas ?? true);
      setRestoreAhkam(initialSelections?.ahkam ?? true);
      setRestoreDhikrs(initialSelections?.dhikrs ?? true);
      setIsLoading(false);
    }
  }, [isOpen, initialSelections]);

  const allSelected = restoreDuas && restoreAhkam && restoreDhikrs;
  const noneSelected = !restoreDuas && !restoreAhkam && !restoreDhikrs;

  const handleToggleAll = () => {
    if (allSelected) {
      setRestoreDuas(false);
      setRestoreAhkam(false);
      setRestoreDhikrs(false);
    } else {
      setRestoreDuas(true);
      setRestoreAhkam(true);
      setRestoreDhikrs(true);
    }
  };

  const handleConfirm = async () => {
    if (noneSelected || isLoading) return;

    try {
      setIsLoading(true);
      const result = await ResetService.restoreDefaultContent({
        restoreDuas,
        restoreAhkam,
        restoreDhikrs,
      });

      const labelText = result.restoredLabels.join('، ');
      const successMessage = labelText
        ? `محتوای پیش‌فرض (${labelText}) با موفقیت بارگذاری شد.`
        : 'محتوای پیش‌فرض با موفقیت بارگذاری شد.';

      if (onSuccess) {
        onSuccess(successMessage);
      }
      onClose();
    } catch (err) {
      console.error('Error in restoreDefaultContent:', err);
      if (onError) {
        onError('خطا در بارگذاری محتوای پیش‌فرض، لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      titleFa="بارگذاری محتوای پیش‌فرض"
      id="restore-default-modal"
      actions={
        <div className="flex items-center justify-between w-full gap-2 pt-1" dir="rtl">
          <button
            type="button"
            onClick={handleToggleAll}
            disabled={isLoading}
            className="text-xs text-secondary-theme hover:text-primary-theme font-medium px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-50"
          >
            {allSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-secondary-theme hover:text-primary-theme bg-surface-elevated hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={noneSelected || isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال بارگذاری...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  تایید و بارگذاری
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 text-right pt-1" dir="rtl">
        <p className="text-xs sm:text-sm text-secondary-theme leading-relaxed">
          لطفاً مشخص کنید که مایل به بازگردانی محتوای پیش‌فرض کدام بخش‌ها هستید:
        </p>

        {/* Options List */}
        <div className="space-y-2.5">
          {/* Option 1: Duas */}
          <div
            role="checkbox"
            aria-checked={restoreDuas}
            tabIndex={0}
            onClick={() => !isLoading && setRestoreDuas(!restoreDuas)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !isLoading && setRestoreDuas(!restoreDuas)}
            className={`flex items-start justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              restoreDuas
                ? 'bg-purple-500/10 border-purple-500/40 text-primary-theme shadow-xs'
                : 'bg-surface-elevated/40 border-theme/60 text-secondary-theme opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  restoreDuas
                    ? 'bg-purple-600 text-white'
                    : 'bg-surface-card text-secondary-theme border border-theme'
                }`}
              >
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">ادعیه و زیارات</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-medium">
                    ۳۰+ دعا و زیارت
                  </span>
                </div>
                <p className="text-xs text-secondary-theme leading-normal">
                  ادعیه مشهور، زیارات معصومین (ع)، مناجات‌ها و تعقیبات استاندارد نماز
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                restoreDuas
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-neutral-400 dark:border-neutral-600 bg-surface-card'
              }`}
            >
              {restoreDuas && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Option 2: Ahkam */}
          <div
            role="checkbox"
            aria-checked={restoreAhkam}
            tabIndex={0}
            onClick={() => !isLoading && setRestoreAhkam(!restoreAhkam)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !isLoading && setRestoreAhkam(!restoreAhkam)}
            className={`flex items-start justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              restoreAhkam
                ? 'bg-blue-500/10 border-blue-500/40 text-primary-theme shadow-xs'
                : 'bg-surface-elevated/40 border-theme/60 text-secondary-theme opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  restoreAhkam
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-card text-secondary-theme border border-theme'
                }`}
              >
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">احکام و آموزش</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium">
                    احکام شرعی
                  </span>
                </div>
                <p className="text-xs text-secondary-theme leading-normal">
                  احکام جامع نمازهای قضا، قضای روزه، کفارات، زکات فطره و احکام مربوطه
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                restoreAhkam
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-neutral-400 dark:border-neutral-600 bg-surface-card'
              }`}
            >
              {restoreAhkam && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Option 3: Dhikrs */}
          <div
            role="checkbox"
            aria-checked={restoreDhikrs}
            tabIndex={0}
            onClick={() => !isLoading && setRestoreDhikrs(!restoreDhikrs)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !isLoading && setRestoreDhikrs(!restoreDhikrs)}
            className={`flex items-start justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
              restoreDhikrs
                ? 'bg-amber-500/10 border-amber-500/40 text-primary-theme shadow-xs'
                : 'bg-surface-elevated/40 border-theme/60 text-secondary-theme opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  restoreDhikrs
                    ? 'bg-amber-600 text-white'
                    : 'bg-surface-card text-secondary-theme border border-theme'
                }`}
              >
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">اذکار و تسبیح</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
                    اذکار استاندارد
                  </span>
                </div>
                <p className="text-xs text-secondary-theme leading-normal">
                  اذکار ایام هفته، تسبیحات حضرت زهرا (س)، اذکار ۴ گانه و ادعیه کوتاه تسبیح
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                restoreDhikrs
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'border-neutral-400 dark:border-neutral-600 bg-surface-card'
              }`}
            >
              {restoreDhikrs && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {noneSelected && (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium text-center">
            لطفاً حداقل یک بخش را برای بارگذاری انتخاب کنید.
          </p>
        )}
      </div>
    </Dialog>
  );
};

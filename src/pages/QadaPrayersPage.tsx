import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  MoreVertical,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  RotateCcw,
  BookOpen,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { db } from '../db/database';
import { QadaPrayerRecord, QadaHistoryRecord, PrayerType } from '../types/db';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { NestedPrayerCard } from '../components/qada/NestedPrayerCard';
import { QadaHistorySheet } from '../components/qada/QadaHistorySheet';
import { formatPersianNumber } from '../utils/persianUtils';

const PRAYER_TITLES: Record<PrayerType, string> = {
  fajr: 'نماز صبح',
  dhuhr: 'نماز ظهر',
  asr: 'نماز عصر',
  maghrib: 'نماز مغرب',
  isha: 'نماز عشاء',
  ayat: 'نماز آیات',
};

export const QadaPrayersPage: React.FC = () => {
  const navigate = useNavigate();

  // Modal & Sheet States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [singlePrayerCelebration, setSinglePrayerCelebration] = useState<string | null>(null);
  const [showAllCompletedModal, setShowAllCompletedModal] = useState(false);

  // Live Query from Dexie Database
  const qadaPrayers = useLiveQuery(async () => {
    return await db.qadaPrayers.toArray();
  }, []);

  const historyRecords = useLiveQuery(async () => {
    return await db.qadaHistory.orderBy('timestamp').reverse().toArray();
  }, []);

  // Helper map for prayer records
  const prayerMap: Record<PrayerType, number> = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    ayat: 0,
  };

  if (qadaPrayers) {
    qadaPrayers.forEach((p) => {
      prayerMap[p.prayerType] = p.count;
    });
  }

  // Calculate totals and last recorded completion time
  const totalRemaining = Object.values(prayerMap).reduce((acc, curr) => acc + curr, 0);

  const lastRecordedItem = historyRecords && historyRecords.length > 0 ? historyRecords[0] : null;

  const formatLastRecordedTime = (isoString?: string) => {
    if (!isoString) return 'ثبت نشده';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const timeStr = date.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (isToday) return `امروز ${timeStr}`;

      const dateStr = date.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });

      return `${dateStr} ${timeStr}`;
    } catch (_) {
      return 'ثبت نشده';
    }
  };

  // 1. Increment Qaza Count (+1) -> No history log
  const handleIncrement = async (type: PrayerType) => {
    const existing = await db.qadaPrayers.where('prayerType').equals(type).first();
    const newCount = (existing?.count || 0) + 1;
    const now = new Date().toISOString();

    if (existing?.id) {
      await db.qadaPrayers.update(existing.id, { count: newCount, updatedAt: now });
    } else {
      await db.qadaPrayers.add({ prayerType: type, count: newCount, completedCount: 0, updatedAt: now });
    }
  };

  // 2. Decrement Qaza Count (-1) -> Manual adjustment, no history log
  const handleDecrement = async (type: PrayerType) => {
    const existing = await db.qadaPrayers.where('prayerType').equals(type).first();
    if (!existing || existing.count <= 0) return;

    const newCount = existing.count - 1;
    const now = new Date().toISOString();

    await db.qadaPrayers.update(existing.id!, { count: newCount, updatedAt: now });
  };

  // 3. Complete Prayer (-1) -> Creates history log & triggers animation
  const handleCompletePrayer = async (type: PrayerType) => {
    const existing = await db.qadaPrayers.where('prayerType').equals(type).first();
    if (!existing || existing.count <= 0) return;

    const newCount = existing.count - 1;
    const now = new Date().toISOString();

    await db.qadaPrayers.update(existing.id!, {
      count: newCount,
      completedCount: (existing.completedCount || 0) + 1,
      updatedAt: now,
    });

    // Add record to qadaHistory
    await db.qadaHistory.add({
      prayerType: type,
      timestamp: now,
      remainingCount: newCount,
    });

    // Check if this prayer reached 0
    if (newCount === 0) {
      setSinglePrayerCelebration(PRAYER_TITLES[type]);
      setTimeout(() => setSinglePrayerCelebration(null), 3500);
    }

    // Check if ALL prayers are completed (all 0)
    const updatedPrayers = await db.qadaPrayers.toArray();
    const grandTotal = updatedPrayers.reduce((sum, p) => sum + p.count, 0);

    if (grandTotal === 0) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (_) {}
      setShowAllCompletedModal(true);
    }
  };

  // 4. Undo completion history item
  const handleUndoRecord = async (record: QadaHistoryRecord) => {
    if (record.id) {
      // Remove history item
      await db.qadaHistory.delete(record.id);

      // Restore +1 count
      const prayerRec = await db.qadaPrayers.where('prayerType').equals(record.prayerType).first();
      if (prayerRec?.id) {
        await db.qadaPrayers.update(prayerRec.id, {
          count: prayerRec.count + 1,
          completedCount: Math.max(0, (prayerRec.completedCount || 1) - 1),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // 5. Clear all history records
  const handleClearAllHistory = async () => {
    if (window.confirm('آیا از پاک کردن کامل تاریخچه ادای نمازها اطمینان دارید؟')) {
      await db.qadaHistory.clear();
    }
  };

  // 6. Reset all Qaza counters to 0
  const handleResetAllCounters = async () => {
    const now = new Date().toISOString();
    const types: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'ayat'];

    for (const type of types) {
      const rec = await db.qadaPrayers.where('prayerType').equals(type).first();
      if (rec?.id) {
        await db.qadaPrayers.update(rec.id, { count: 0, updatedAt: now });
      }
    }

    setIsResetConfirmOpen(false);
    setIsMoreMenuOpen(false);
  };

  return (
    <div dir="rtl" className="space-y-5 max-w-6xl mx-auto pb-12 select-none">
      {/* PAGE HEADER */}
      <PageHeader
        titleFa="نمازهای قضا"
        showBack
        onBackClick={() => navigate('/')}
        centered
        actions={
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-2 rounded-full hover:bg-surface-elevated text-secondary-theme transition-colors active:scale-95"
              aria-label="منوی بیشتر"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    className="absolute left-0 top-10 z-30 min-w-[200px] bg-surface-card border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-1.5 text-xs font-semibold"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsGuideOpen(true);
                      }}
                      className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-primary-theme flex items-center gap-2 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>راهنمای نمازهای قضا</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsResetConfirmOpen(true);
                      }}
                      className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>صفر کردن تمام شمارنده‌ها</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        }
      />

      {/* SINGLE PRAYER CELEBRATION TOAST BANNER */}
      <AnimatePresence>
        {singlePrayerCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold">الحمدلله رب العالمین</h4>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  قضای {singlePrayerCelebration} به پایان رسید. قبول حق باشد.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSinglePrayerCelebration(null)}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN PRAYER CARDS GRID / LAYOUT */}
      {/* Adaptive: 1 column on Mobile Portrait, 2x2 grid on Mobile Landscape / Tablet Portrait, 4 columns on Tablet Landscape */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PARENT CARD 1: نماز صبح */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="mb-3 text-center sm:text-right">
            <h2 className="text-sm sm:text-base font-extrabold text-primary-theme">
              نماز صبح
            </h2>
          </div>
          <NestedPrayerCard
            prayerType="fajr"
            titleFa="نماز صبح"
            count={prayerMap.fajr}
            onIncrement={() => handleIncrement('fajr')}
            onDecrement={() => handleDecrement('fajr')}
            onComplete={() => handleCompletePrayer('fajr')}
          />
        </Card>

        {/* PARENT CARD 2: نماز ظهر و عصر */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="mb-3 text-center sm:text-right">
            <h2 className="text-sm sm:text-base font-extrabold text-primary-theme">
              نماز ظهر و عصر
            </h2>
          </div>
          <div className="space-y-3">
            <NestedPrayerCard
              prayerType="dhuhr"
              titleFa="نماز ظهر"
              count={prayerMap.dhuhr}
              onIncrement={() => handleIncrement('dhuhr')}
              onDecrement={() => handleDecrement('dhuhr')}
              onComplete={() => handleCompletePrayer('dhuhr')}
            />
            <NestedPrayerCard
              prayerType="asr"
              titleFa="نماز عصر"
              count={prayerMap.asr}
              onIncrement={() => handleIncrement('asr')}
              onDecrement={() => handleDecrement('asr')}
              onComplete={() => handleCompletePrayer('asr')}
            />
          </div>
        </Card>

        {/* PARENT CARD 3: نماز مغرب و عشاء */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="mb-3 text-center sm:text-right">
            <h2 className="text-sm sm:text-base font-extrabold text-primary-theme">
              نماز مغرب و عشاء
            </h2>
          </div>
          <div className="space-y-3">
            <NestedPrayerCard
              prayerType="maghrib"
              titleFa="نماز مغرب"
              count={prayerMap.maghrib}
              onIncrement={() => handleIncrement('maghrib')}
              onDecrement={() => handleDecrement('maghrib')}
              onComplete={() => handleCompletePrayer('maghrib')}
            />
            <NestedPrayerCard
              prayerType="isha"
              titleFa="نماز عشاء"
              count={prayerMap.isha}
              onIncrement={() => handleIncrement('isha')}
              onDecrement={() => handleDecrement('isha')}
              onComplete={() => handleCompletePrayer('isha')}
            />
          </div>
        </Card>

        {/* PARENT CARD 4: نماز آیات */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="mb-3 text-center sm:text-right">
            <h2 className="text-sm sm:text-base font-extrabold text-primary-theme">
              نماز آیات
            </h2>
          </div>
          <NestedPrayerCard
            prayerType="ayat"
            titleFa="نماز آیات"
            count={prayerMap.ayat}
            onIncrement={() => handleIncrement('ayat')}
            onDecrement={() => handleDecrement('ayat')}
            onComplete={() => handleCompletePrayer('ayat')}
          />
        </Card>
      </div>

      {/* MAIN STATUS SECTION AT BOTTOM */}
      <Card className="p-3.5 sm:p-4 border border-neutral-200/90 dark:border-neutral-800/80 shadow-xs">
        <div className="grid grid-cols-3 items-center divide-x divide-x-reverse divide-neutral-200 dark:divide-neutral-800">
          {/* SECTION 1 (RIGHT in RTL): کل باقیمانده */}
          <div className="flex items-center gap-2.5 sm:gap-3 justify-start pr-1 sm:pr-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-secondary-theme font-medium">
                کل باقیمانده
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                  {formatPersianNumber(totalRemaining)}
                </span>
                <span className="text-[10px] sm:text-xs text-secondary-theme font-semibold">
                  نماز قضا
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2 (CENTER in RTL): آخرین ثبت */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center px-1 sm:px-3 text-center">
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-secondary-theme font-medium">
                آخرین ثبت
              </p>
              <p className="text-xs sm:text-sm font-bold text-primary-theme mt-0.5">
                {formatLastRecordedTime(lastRecordedItem?.timestamp)}
              </p>
            </div>
          </div>

          {/* SECTION 3 (LEFT in RTL): تاریخچه Button */}
          <div className="flex items-center justify-end pl-1 sm:pl-3">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-surface-elevated/70 hover:bg-surface-elevated active:scale-95 text-primary-theme font-bold text-xs sm:text-sm transition-all border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs"
            >
              <span>تاریخچه</span>
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>
      </Card>

      {/* HISTORY BOTTOM SHEET */}
      <QadaHistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyRecords={historyRecords || []}
        onUndoRecord={handleUndoRecord}
        onClearAllHistory={handleClearAllHistory}
      />

      {/* MORE MENU GUIDE DIALOG */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface-card rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-extrabold text-primary-theme">
                    راهنمای نمازهای قضا
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-elevated text-secondary-theme"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-secondary-theme leading-relaxed space-y-2.5 font-medium">
                <p>
                  • دکمه‌های <strong className="text-primary-theme">+</strong> و{' '}
                  <strong className="text-primary-theme">−</strong> فقط تعداد قضای
                  باقیمانده را به صورت دستی تغییر می‌دهند و اثری در تاریخچه ثبت ندارند.
                </p>
                <p>
                  • دکمه سبزرنگ چک‌مارک (<strong className="text-emerald-600">✓</strong>)
                  برای زمان‌هایی است که یک نماز قضا را به جا می‌آورید. با فشردن آن، ۱ عدد
                  از قضا کم شده و زمان ادای آن در تاریخچه ذخیره می‌شود.
                </p>
                <p>
                  • از طریق بخش «تاریخچه» در پایین صفحه می‌توانید تمام ثبت‌ها را مشاهده
                  یا در صورت اشتباه، لغو نمایید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM RESET ALL COUNTERS MODAL */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetConfirmOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface-card rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-primary-theme">
                صفر کردن تمام شمارنده‌ها؟
              </h3>
              <p className="text-xs text-secondary-theme leading-relaxed font-medium">
                آیا مطمئن هستید که می‌خواهید تمام شمارنده‌های نماز قضا صفر شوند؟ این اقدامقابل برگشت نمی‌باشد.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetAllCounters}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all"
                >
                  بله، صفر شود
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-secondary-theme font-bold text-xs hover:bg-surface-elevated transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALL PRAYERS COMPLETED GRAND CELEBRATION MODAL */}
      <AnimatePresence>
        {showAllCompletedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllCompletedModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 stroke-[2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  الحمدلله رب العالمین
                </h3>
                <p className="text-sm font-bold text-primary-theme mt-1">
                  تمام نمازهای قضای شما با موفقیت به اتمام رسید.
                </p>
                <p className="text-xs text-secondary-theme mt-2 leading-relaxed">
                  خداوند متعال طاعات و عبادات شما را به احسن وجه قبول بفرماید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAllCompletedModal(false)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-md active:scale-98"
              >
                تأیید و بستن
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

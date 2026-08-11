import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CalendarCheck, Clock, List, ListFilter, X, Wheat, RotateCcw, Trash2, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PageHeader } from '../components/PageHeader';
import { CounterControl } from '../components/CounterControl';
import { DatePickerSheet } from '../components/fasting/DatePickerSheet';
import { Card } from '../components/Card';
import { formatPersianNumber } from '../utils/persianUtils';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

export const FastingPage: React.FC<{
  onShowToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning', duration?: number, action?: any) => void;
}> = ({ onShowToast }) => {
  // State for Qaza Fasting
  const [qazaCount, setQazaCount] = useState(0);
  const [lastQazaCompletedAt, setLastQazaCompletedAt] = useState<string | null>(null);
  const [isQazaAnimating, setIsQazaAnimating] = useState(false);

  // State for Fitriya
  const [fitriyaPeople, setFitriyaPeople] = useState(4);
  const [fitriyaAmountPerPerson, setFitriyaAmountPerPerson] = useState(150000);
  const [isFitriyaPaid, setIsFitriyaPaid] = useState(false);

  // State for Kaffarah
  const [isKaffarahActive, setIsKaffarahActive] = useState(false);
  
  const [intentionalKaffarahCount, setIntentionalKaffarahCount] = useState(2);
  const [intentionalKaffarahAmount, setIntentionalKaffarahAmount] = useState(150000);
  
  const [unintentionalKaffarahCount, setUnintentionalKaffarahCount] = useState(3);
  const [unintentionalKaffarahAmount, setUnintentionalKaffarahAmount] = useState(200000);

  // Modals
  const [activeDatePicker, setActiveDatePicker] = useState<'fitriya' | 'kaffarah' | null>(null);
  const [showHistorySheet, setShowHistorySheet] = useState<'qaza' | 'financial' | null>(null);
  const [financialFilter, setFinancialFilter] = useState<'all' | 'fitriya' | 'kaffarah_intentional' | 'kaffarah_unintentional'>('all');

  // Totals
  const fitriyaTotal = fitriyaPeople * fitriyaAmountPerPerson;
  const kaffarahTotal = (isKaffarahActive ? ((intentionalKaffarahCount * intentionalKaffarahAmount) + (unintentionalKaffarahCount * unintentionalKaffarahAmount)) : 0);

  // Queries
  const qazaHistory = useLiveQuery(() => db.qadaFastingHistory.orderBy('timestamp').reverse().toArray());
  const financialHistory = useLiveQuery(() => {
    if (financialFilter === 'all') {
      return db.financialHistory.orderBy('timestamp').reverse().toArray();
    }
    return db.financialHistory.where('type').equals(financialFilter).reverse().sortBy('timestamp');
  }, [financialFilter]);

  useEffect(() => {
    // Load from DB
    const loadData = async () => {
      const qazaState = await db.qadaFastingState.get('current');
      if (qazaState) {
        setQazaCount(qazaState.count);
        setLastQazaCompletedAt(qazaState.updatedAt);
      } else {
        setQazaCount(42);
      }
    };
    loadData();
  }, []);

  const saveQazaCount = async (newCount: number, recordHistory: boolean = false) => {
    const validCount = Math.max(0, newCount);
    
    // Trigger confetti if qaza count reaches 0 from > 0
    if (qazaCount > 0 && validCount === 0) {
      try {
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } catch (_) {}
    }

    setQazaCount(validCount);
    const now = new Date().toISOString();
    let historyId = null;
    
    if (recordHistory) {
      setLastQazaCompletedAt(now);
      historyId = await db.qadaFastingHistory.add({
        timestamp: now,
        remainingCount: validCount
      });
    }
    
    await db.qadaFastingState.put({
      id: 'current',
      count: validCount,
      updatedAt: now
    });

    return historyId;
  };

  const handleQazaComplete = async () => {
    if (qazaCount <= 0) return;
    
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch (_) {}
    }
    
    setIsQazaAnimating(true);
    setTimeout(() => setIsQazaAnimating(false), 600);
    
    const newCount = qazaCount - 1;
    const historyId = await saveQazaCount(newCount, true);

    if (onShowToast) {
      onShowToast(
        newCount === 0 ? 'تبریک! تمامی روزه‌های قضای شما به پایان رسید 🎉' : 'یک روزه ثبت شد',
        'success',
        3500,
        {
          label: 'لغو',
          onClick: () => {
            if (historyId) handleUndoQaza(historyId as number);
          }
        }
      );
    }
  };

  const handleUndoQaza = async (id: number) => {
    const record = await db.qadaFastingHistory.get(id);
    if (record) {
      await db.qadaFastingHistory.delete(id);
      saveQazaCount(qazaCount + 1, false);
    }
  };

  const handleUndoFinancial = async (id: number) => {
    await db.financialHistory.delete(id);
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const handleConfirmClear = async () => {
    if (showHistorySheet === 'qaza') {
      await db.qadaFastingHistory.clear();
    } else if (showHistorySheet === 'financial') {
      await db.financialHistory.clear();
    }
    setIsConfirmOpen(false);
  };

  const handleFitriyaPayment = async (date: Date) => {
    setIsFitriyaPaid(true);
    const now = new Date().toISOString();
    await db.financialHistory.add({
      type: 'fitriya',
      timestamp: now,
      paymentDate: date.toISOString(),
      amount: fitriyaTotal,
      peopleCount: fitriyaPeople,
      amountPerItem: fitriyaAmountPerPerson,
      year: 1405
    });
  };

  const handleKaffarahPayment = async (date: Date) => {
    const now = new Date().toISOString();
    if (intentionalKaffarahCount > 0) {
      await db.financialHistory.add({
        type: 'kaffarah_intentional',
        timestamp: now,
        paymentDate: date.toISOString(),
        amount: intentionalKaffarahCount * intentionalKaffarahAmount,
        quantity: intentionalKaffarahCount,
        amountPerItem: intentionalKaffarahAmount
      });
    }
    if (unintentionalKaffarahCount > 0) {
      await db.financialHistory.add({
        type: 'kaffarah_unintentional',
        timestamp: now,
        paymentDate: date.toISOString(),
        amount: unintentionalKaffarahCount * unintentionalKaffarahAmount,
        quantity: unintentionalKaffarahCount,
        amountPerItem: unintentionalKaffarahAmount
      });
    }
    setIsKaffarahActive(false);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatLastRecordedTime = (isoString?: string | null) => {
    if (!isoString) return 'ندارد';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `امروز، ساعت ${timeStr}`;
      }
      return date.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      return 'نامشخص';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto pb-24 md:pb-32">
      <PageHeader
        titleFa="روزه‌های قضا"
        subtitleFa="مدیریت روزه‌های قضا و کفاره"
        showBack
        centered
      />

      {/* Main Grid: Responsive adaptation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Column 1: Qaza Fasting */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-card border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-primary-theme">روزه‌های قضا</h2>
                <p className="text-[11px] text-secondary-theme">تعداد روزهای باقی‌مانده</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                 <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 bg-surface-elevated/40 rounded-2xl p-4 border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="flex-1 flex justify-start">
                <CounterControl
                  count={qazaCount}
                  onIncrement={() => saveQazaCount(qazaCount + 1)}
                  onDecrement={() => saveQazaCount(qazaCount - 1)}
                  onSetCount={(c) => saveQazaCount(c)}
                />
              </div>
              <div className="shrink-0 relative">
                <button
                  type="button"
                  onClick={handleQazaComplete}
                  disabled={qazaCount <= 0}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-sm active:scale-90 disabled:opacity-30 ${
                    isQazaAnimating
                      ? 'bg-emerald-500 scale-110 ring-4 ring-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-secondary-theme/70 mt-3 font-medium">
              هر بار با زدن دکمه سبز، یک روز ثبت می‌شود
            </p>
          </div>
        </div>

        {/* Column 2: Fitriya */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-card border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-primary-theme">فطریه ۱۴۰۵</h2>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                 <Wheat className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-secondary-theme">تعداد نفرات</span>
                <CounterControl
                  count={fitriyaPeople}
                  onIncrement={() => setFitriyaPeople(p => p + 1)}
                  onDecrement={() => setFitriyaPeople(p => Math.max(1, p - 1))}
                  onSetCount={setFitriyaPeople}
                  min={1}
                />
              </div>

              <div className="flex items-center justify-between border-t border-theme/30 pt-4">
                <span className="text-sm font-bold text-secondary-theme">فطریه هر نفر (تومان)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fitriyaAmountPerPerson.toLocaleString('fa-IR')}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/,/g, '').replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])) || 0;
                    setFitriyaAmountPerPerson(val);
                  }}
                  onFocus={(e) => e.target.select()}
                  className="bg-transparent text-left font-bold text-base text-primary-theme w-24 outline-none border-b border-neutral-300 dark:border-neutral-700 focus:border-emerald-500"
                  dir="ltr"
                />
              </div>
              
              <div className="flex flex-col items-center justify-center pt-4 pb-2">
                <span className="text-[11px] text-secondary-theme font-medium mb-1">مبلغ قابل پرداخت</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {fitriyaTotal.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              {!isFitriyaPaid ? (
                <button
                  type="button"
                  onClick={() => setActiveDatePicker('fitriya')}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  ثبت پرداخت
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/20">
                  <Check className="w-4 h-4" />
                  پرداخت شده
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Kaffarah */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="bg-surface-card border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-xs transition-all">
            <div 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsKaffarahActive(!isKaffarahActive)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isKaffarahActive ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {isKaffarahActive && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-bold text-primary-theme group-hover:text-emerald-600 transition-colors">نیاز به پرداخت کفاره دارم</span>
              </div>
              {!isKaffarahActive && <span className="text-[10px] text-secondary-theme">در صورت نیاز، تیک بزنید</span>}
            </div>

            <AnimatePresence>
              {isKaffarahActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Intentional Kaffarah */}
                      <div className="bg-surface-bg border border-theme shadow-inner rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">کفاره عمد</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-secondary-theme">تعداد</span>
                          <CounterControl
                            count={intentionalKaffarahCount}
                            onIncrement={() => setIntentionalKaffarahCount(c => c + 1)}
                            onDecrement={() => setIntentionalKaffarahCount(c => Math.max(0, c - 1))}
                            onSetCount={setIntentionalKaffarahCount}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-secondary-theme">مبلغ هر مورد (تومان)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={intentionalKaffarahAmount.toLocaleString('fa-IR')}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/,/g, '').replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])) || 0;
                              setIntentionalKaffarahAmount(val);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="bg-transparent text-left font-bold text-sm text-primary-theme w-24 outline-none border-b border-neutral-300 dark:border-neutral-700 focus:border-red-500"
                            dir="ltr"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-theme/30">
                          <span className="text-xs font-bold text-secondary-theme">مجموع</span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {(intentionalKaffarahCount * intentionalKaffarahAmount).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>

                      {/* Unintentional Kaffarah */}
                      <div className="bg-surface-bg border border-theme shadow-inner rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">کفاره غیرعمد</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-secondary-theme">تعداد</span>
                          <CounterControl
                            count={unintentionalKaffarahCount}
                            onIncrement={() => setUnintentionalKaffarahCount(c => c + 1)}
                            onDecrement={() => setUnintentionalKaffarahCount(c => Math.max(0, c - 1))}
                            onSetCount={setUnintentionalKaffarahCount}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-secondary-theme">مبلغ هر مورد (تومان)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={unintentionalKaffarahAmount.toLocaleString('fa-IR')}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/,/g, '').replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])) || 0;
                              setUnintentionalKaffarahAmount(val);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="bg-transparent text-left font-bold text-sm text-primary-theme w-24 outline-none border-b border-neutral-300 dark:border-neutral-700 focus:border-blue-500"
                            dir="ltr"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-theme/30">
                          <span className="text-xs font-bold text-secondary-theme">مجموع</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {(unintentionalKaffarahCount * unintentionalKaffarahAmount).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-sm font-bold text-primary-theme">مجموع کفاره</span>
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                          {kaffarahTotal.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setActiveDatePicker('kaffarah')}
                        disabled={kaffarahTotal === 0}
                        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        ثبت پرداخت کفاره
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MAIN STATUS SECTION AT BOTTOM */}
      <Card className="p-3.5 sm:p-4 border border-neutral-200/90 dark:border-neutral-800/80 shadow-xs mt-6">
        <div className="grid grid-cols-3 items-center divide-x divide-x-reverse divide-neutral-200 dark:divide-neutral-800">
          {/* SECTION 1 (RIGHT in RTL): کل باقیمانده */}
          <div className="flex items-center gap-2.5 sm:gap-3 justify-start pr-1 sm:pr-3">
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center shrink-0">
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                  {formatPersianNumber(qazaCount)}
                </span>
                <span className="text-[10px] sm:text-xs text-secondary-theme font-semibold">
                  روزه قضا
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
                {formatLastRecordedTime(lastQazaCompletedAt)}
              </p>
            </div>
          </div>

          {/* SECTION 3 (LEFT in RTL): تاریخچه Button */}
          <div className="flex items-center justify-end pl-1 sm:pl-3 gap-2">
            <button
              type="button"
              onClick={() => setShowHistorySheet('financial')}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl bg-surface-elevated/70 hover:bg-surface-elevated active:scale-95 text-primary-theme font-bold text-xs sm:text-sm transition-all border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs"
              title="تاریخچه پرداخت‌ها"
            >
              <ListFilter className="w-4 h-4 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => setShowHistorySheet('qaza')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-surface-elevated/70 hover:bg-surface-elevated active:scale-95 text-primary-theme font-bold text-xs sm:text-sm transition-all border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs"
            >
              <span className="hidden sm:inline">تاریخچه</span>
              <List className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>
      </Card>

      <DatePickerSheet
        isOpen={activeDatePicker !== null}
        onClose={() => setActiveDatePicker(null)}
        title={activeDatePicker === 'fitriya' ? 'ثبت پرداخت فطریه' : 'ثبت پرداخت کفاره'}
        totalAmount={activeDatePicker === 'fitriya' ? fitriyaTotal : kaffarahTotal}
        onConfirm={activeDatePicker === 'fitriya' ? handleFitriyaPayment : handleKaffarahPayment}
      />
      
      {/* History Sheet */}
      <AnimatePresence>
        {showHistorySheet !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistorySheet(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
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
                      {showHistorySheet === 'qaza' ? 'تاریخچه روزه‌های قضا' : 'تاریخچه پرداخت‌ها'}
                    </h2>
                    <p className="text-xs text-secondary-theme font-medium mt-0.5">
                      فهرست ثبت‌های انجام‌شده
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {((showHistorySheet === 'qaza' && (qazaHistory?.length || 0) > 0) || (showHistorySheet === 'financial' && (financialHistory?.length || 0) > 0)) && (
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
                    onClick={() => setShowHistorySheet(null)}
                    className="p-2 rounded-full hover:bg-surface-elevated text-secondary-theme transition-colors"
                    aria-label="بستن"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showHistorySheet === 'financial' && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'fitriya', label: 'فطریه' },
                    { id: 'kaffarah_intentional', label: 'کفاره عمد' },
                    { id: 'kaffarah_unintentional', label: 'کفاره غیرعمد' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFinancialFilter(f.id as any)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border ${
                        financialFilter === f.id 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-surface-elevated text-secondary-theme border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto no-scrollbar pb-6 space-y-3">
                {showHistorySheet === 'qaza' ? (
                  qazaHistory?.length === 0 ? (
                    <div className="py-12 text-center text-secondary-theme">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30 text-neutral-400" />
                      <p className="text-sm font-bold text-primary-theme">
                        هنوز هیچ تاریخچه‌ای ثبت نشده است
                      </p>
                    </div>
                  ) : (
                    qazaHistory?.map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated/50 border border-neutral-200/80 dark:border-neutral-800/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Check className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-theme">روزه قضا</h4>
                            <div className="flex items-center gap-2 text-xs text-secondary-theme mt-0.5 font-medium">
                              <span>{formatDate(record.timestamp)}</span>
                              <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">باقی‌مانده: {formatPersianNumber(record.remainingCount)}</span>
                              <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                              <span dir="ltr">{formatTime(record.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUndoQaza(record.id!)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">لغو ثبت</span>
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  financialHistory?.length === 0 ? (
                    <div className="py-12 text-center text-secondary-theme">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30 text-neutral-400" />
                      <p className="text-sm font-bold text-primary-theme">
                        هنوز هیچ پرداختی ثبت نشده است
                      </p>
                    </div>
                  ) : (
                    financialHistory?.map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated/50 border border-neutral-200/80 dark:border-neutral-800/80">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            record.type === 'fitriya' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            record.type === 'kaffarah_intentional' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                            'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}>
                            <Wheat className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-primary-theme">
                              {record.type === 'fitriya' ? 'فطریه' : record.type === 'kaffarah_intentional' ? 'کفاره عمد' : 'کفاره غیرعمد'}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-secondary-theme mt-0.5 font-medium">
                              <span>{formatDate(record.paymentDate)}</span>
                              {record.peopleCount && (
                                <>
                                  <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                  <span>{formatPersianNumber(record.peopleCount)} نفر</span>
                                </>
                              )}
                              {record.quantity && (
                                <>
                                  <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                  <span>{formatPersianNumber(record.quantity)} مورد</span>
                                </>
                              )}
                              <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{record.amount.toLocaleString('fa-IR')} تومان</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUndoFinancial(record.id!)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">لغو ثبت</span>
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-surface-card rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-primary-theme text-center mb-2">
                پاک کردن تاریخچه
              </h3>
              <p className="text-sm text-secondary-theme text-center mb-6 leading-relaxed">
                آیا از پاک کردن تمام تاریخچه‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-primary-theme font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                >
                  پاک کردن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

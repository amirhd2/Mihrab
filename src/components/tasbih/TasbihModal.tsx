import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  ListFilter,
  Flame,
  Settings2,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Target,
  Save,
  Check,
  GripVertical,
  RefreshCw,
  Info,
} from 'lucide-react';
import { getTodayDhikr, useDailyDhikrSync, useCurrentDate } from '../../utils/dailyDhikrUtils';
import { toPersianDigits, formatPersianNumber } from '../../utils/persianUtils';
import { CustomDhikrRecord } from '../../types/db';
import { usePendingChanges } from '../../context/PendingChangesContext';
import { RestoreDefaultModal } from '../RestoreDefaultModal';

export interface TasbihPresetItem {
  id: string;
  dbId?: number;
  key?: string;
  title: string;
  arabic: string;
  meaning?: string;
  virtue?: string;
  target: number;
  category: 'daily' | 'fatima' | 'standard' | 'custom';
  isCustom?: boolean;
  order: number;
  steps?: { title: string; arabic: string; target: number }[];
}

const DEFAULT_STANDARD_PRESETS: Omit<CustomDhikrRecord, 'id'>[] = [
  {
    key: 'fatima',
    title: 'تسبیحات حضرت زهرا (س)',
    arabic: 'اللّهُ اَکْبَرُ (۳۴) + اَلْحَمْدُ لِلّهِ (۳۳) + سُبْحانَ اللّهِ (۳۳)',
    meaning: 'تسبیح پرفضیلت منسوب به حضرت فاطمه زهرا سلام الله علیها',
    virtue: 'ثواب هزار رکعت نماز مستحبی و آمرزش گناهان',
    targetCount: 100,
    category: 'fatima',
    isCustom: false,
    order: 1,
  },
  {
    key: 'salawat',
    title: 'صلوات',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ',
    meaning: 'درود و رحمت بر پیامبر اکرم و خاندان پاک و مطهر ایشان',
    virtue: 'سنگین‌ترین عمل در ترازوی اعمال و استجابت دعا',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 2,
  },
  {
    key: 'istighfar',
    title: 'استغفار',
    arabic: 'أَسْتَغْفِرُ اللهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    meaning: 'از پروردگارم آمرزش می‌طلبم و به سوی او بازمی‌گردم',
    virtue: 'گشایش روزی، آرامش دل و پاکسازی گناهان',
    targetCount: 70,
    category: 'standard',
    isCustom: false,
    order: 3,
  },
  {
    key: 'yunus',
    title: 'ذکر یونسیه',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    meaning: 'معبودی جز تو نیست، تو منزهی و بی‌تردید من از ستمکاران بودم',
    virtue: 'نجات از گرفتاری‌ها، غم و اندوه و برآورده شدن حاجات',
    targetCount: 40,
    category: 'standard',
    isCustom: false,
    order: 4,
  },
  {
    key: 'hawqala',
    title: 'حوقله (ذکر دفع بلا)',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    meaning: 'هیچ توان و نیرویی نیست مگر به قدرت خدای والای بزرگوار',
    virtue: 'دفع هفتاد نوع بلا، رفع وسوسه و درمان غم و رنج',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 5,
  },
  {
    key: 'tasbihat_arbaah',
    title: 'تسبیحات اربعه',
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    meaning: 'پاک و منزه است خدا و ستایش مخصوص اوست و خدایی جز او نیست و خدا بزرگتر است',
    virtue: 'کاشتن درختان بهشتی و برابری با ثواب طواف خانه خدا',
    targetCount: 30,
    category: 'standard',
    isCustom: false,
    order: 6,
  },
  {
    key: 'tahlil',
    title: 'لا إله إلا الله (کلمه توحید)',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    meaning: 'هیچ معبودی جز خداوند یکتا نیست',
    virtue: 'برترین ذکر و مایه سنگینی اعمال در قیامت',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 7,
  },
  {
    key: 'dhikr_saturday',
    title: 'ذکر روز شنبه',
    arabic: 'یَا رَبَّ الْعَالَمِین',
    meaning: 'ای پروردگار جهانیان',
    virtue: 'موجب بی‌نیازی، برکت و عزت فراوان',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 8,
  },
  {
    key: 'dhikr_sunday',
    title: 'ذکر روز یکشنبه',
    arabic: 'یَا ذَا الْجَلالِ وَ الاِکْرام',
    meaning: 'ای صاحب جلال و بزرگواری',
    virtue: 'موجب فتح، نصرت و پیروزی در امور',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 9,
  },
  {
    key: 'dhikr_monday',
    title: 'ذکر روز دوشنبه',
    arabic: 'یَا قَاضِیَ الْحَاجَات',
    meaning: 'ای برآورنده حاجت‌ها',
    virtue: 'موجب کثرت مال و وسعت رزق و برآورده شدن حاجات',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 10,
  },
  {
    key: 'dhikr_tuesday',
    title: 'ذکر روز سه‌شنبه',
    arabic: 'یَا أَرْحَمَ الرَّاحِمِین',
    meaning: 'ای مهربان‌ترین مهربانان',
    virtue: 'موجب استجابت دعا و گشایش در کارها',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 11,
  },
  {
    key: 'dhikr_wednesday',
    title: 'ذکر روز چهارشنبه',
    arabic: 'یَا حَیُّ یَا قَیُّوم',
    meaning: 'ای زنده و پاینده',
    virtue: 'موجب عزت دائمی، دانایی و نورانیت دل',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 12,
  },
  {
    key: 'dhikr_thursday',
    title: 'ذکر روز پنج‌شنبه',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ الْمَلِکُ الْحَقُّ الْمُبِین',
    meaning: 'معبودی جز خدای یگانه، فرمانروای حق و آشکار نیست',
    virtue: 'موجب افزایش رزق و رفع فقر و وحشت قبر',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 13,
  },
  {
    key: 'dhikr_friday',
    title: 'ذکر روز جمعه',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ وَ عَجِّلْ فَرَجَهُمْ',
    meaning: 'خدایا بر محمد و آل محمد درود فرست و در فرجشان تعجیل فرما',
    virtue: 'موجب شفاعت و عزیز شدن نزد پروردگار و برآورده شدن حاجات',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 14,
  },
  {
    key: 'hasbunallah',
    title: 'حسبنا الله و نعم الوکیل',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    meaning: 'خداوند ما را بس است و چه نیکو کارسازی است',
    virtue: 'دفع شرور و توکل کامل به خداوند متعال',
    targetCount: 100,
    category: 'standard',
    isCustom: false,
    order: 15,
  },
  {
    key: 'amman_yujib',
    title: 'آیه امن یجیب',
    arabic: 'أَمَّنْ يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ',
    meaning: 'یا کیست که دعای درمانده را هنگامى که او را مى‏‌خواند اجابت مى‏‌کند و گرفتارى را برطرف مى‏‌سازد',
    virtue: 'توسل برای شفای عاجل بیماران و رفع گرفتاری‌های بزرگ',
    targetCount: 40,
    category: 'standard',
    isCustom: false,
    order: 16,
  },
  {
    key: 'fattah',
    title: 'یا فتاح (گشایش امور)',
    arabic: 'یَا فَتَّاحُ',
    meaning: 'ای گشاینده همه درهای بسته',
    virtue: 'گشایش در امور و رفع بن‌بست‌های زندگی',
    targetCount: 70,
    category: 'standard',
    isCustom: false,
    order: 17,
  },
];

const ReorderablePresetItem = ({
  preset,
  selectedPresetId,
  setSelectedPresetId,
  setLocalCount,
  setFatimaStepIndex,
  setViewMode,
  handleOpenEdit,
  handleDeleteDhikr,
}: {
  preset: TasbihPresetItem;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string) => void;
  setLocalCount: (count: number) => void;
  setFatimaStepIndex: (index: number) => void;
  setViewMode: (mode: 'counter' | 'manage' | 'add_edit' | 'quick_target') => void;
  handleOpenEdit: (preset: TasbihPresetItem) => void;
  handleDeleteDhikr: (preset: TasbihPresetItem) => void;
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={preset}
      dragListener={false}
      dragControls={controls}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-shadow select-none flex items-center justify-between gap-2.5 ${
        selectedPresetId === preset.id
          ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
          : 'bg-surface-elevated/70 border-theme hover:border-theme/80 hover:shadow-xs'
      }`}
    >
      {/* Drag Handle */}
      <div
        className="cursor-grab active:cursor-grabbing p-1.5 text-secondary-theme hover:text-amber-600 rounded-lg hover:bg-surface-card touch-none shrink-0"
        title="برای تغییر ترتیب بکشید"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Dhikr Content Info */}
      <div className="flex-1 text-right min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-primary-theme truncate">
            {preset.title}
          </span>
          {preset.isCustom && (
            <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
              شخصی
            </span>
          )}
          {preset.category === 'daily' && (
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              ذکر امروز
            </span>
          )}
        </div>

        <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5 font-extrabold font-arabic line-clamp-1">
          {preset.arabic}
        </p>

        <div className="flex items-center gap-3 mt-1 text-[11px] text-secondary-theme">
          <span>
            تعداد:{' '}
            <strong className="text-primary-theme">
              {preset.steps ? '۳۴+۳۳+۳۳' : toPersianDigits(preset.target)}
            </strong>
          </span>
          {preset.virtue && <span className="truncate hidden sm:inline">فضیلت: {preset.virtue}</span>}
        </div>
      </div>

      {/* Actions: Select, Edit (for ALL), Trash (for ALL) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Select for Counting */}
        <button
          onClick={() => {
            setSelectedPresetId(preset.id);
            setLocalCount(0);
            setFatimaStepIndex(0);
            setViewMode('counter');
          }}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors"
        >
          انتخاب
        </button>

        {/* Edit Button (Enabled for ALL dhikrs) */}
        <button
          onClick={() => handleOpenEdit(preset)}
          title="ویرایش نام، متن یا تعداد"
          className="p-1.5 rounded-xl hover:bg-surface-card text-secondary-theme hover:text-amber-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button (Enabled for ALL dhikrs except special non-db daily) */}
        {preset.id !== 'daily' && (
          <button
            onClick={() => handleDeleteDhikr(preset)}
            title="حذف ذکر"
            className="p-1.5 rounded-xl hover:bg-red-500/10 text-secondary-theme hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Reorder.Item>
  );
};

export const TasbihModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialPresetId?: string;
}> = ({ isOpen, onClose, initialPresetId }) => {
  const { addChange } = usePendingChanges();
  const currentDate = useCurrentDate();
  const todayDhikr = useMemo(() => getTodayDhikr(currentDate), [currentDate]);

  // Database dhikrs query (respects complete user deletion, no automatic re-seeding)
  const dbDhikrs = useLiveQuery(() => db.customDhikrs.toArray(), []) || [];

  // Overrides for Daily Dhikr Target stored in localStorage
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mihrab_daily_dhikr_target');
      return saved ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });

  const saveDailyTarget = (newTarget: number) => {
    const valid = Math.max(1, newTarget);
    setDailyTarget(valid);
    try {
      localStorage.setItem('mihrab_daily_dhikr_target', String(valid));
    } catch {}
  };

  // Convert db records into a structured preset list sorted by order
  const allPresets: TasbihPresetItem[] = useMemo(() => {
    const EN_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDbKey = 'dhikr_' + EN_DAYS[currentDate.getDay()];

    const sortedDb = [...dbDhikrs].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const list: TasbihPresetItem[] = sortedDb.map((item, idx) => {
      const isFatima = item.key === 'fatima' || item.category === 'fatima';
      const isTodayDhikr = item.key === todayDbKey;
      
      return {
        id: isTodayDhikr ? 'daily' : `db_${item.id}`,
        dbId: item.id,
        key: item.key,
        title: item.title,
        arabic: item.arabic,
        meaning: item.meaning,
        virtue: item.virtue,
        target: isTodayDhikr ? (dailyTarget || item.targetCount) : item.targetCount,
        category: isTodayDhikr ? 'daily' : (item.category || (item.isCustom ? 'custom' : 'standard')),
        isCustom: item.isCustom,
        order: isTodayDhikr ? 0 : (item.order ?? idx + 1), // Optional: Keep today's dhikr at the top by forcing order 0
        steps: isFatima
          ? [
              { title: 'الله اکبر', arabic: 'اللّهُ اَکْبَرُ', target: 34 },
              { title: 'الحمد لله', arabic: 'اَلْحَمْدُ لِلّهِ', target: 33 },
              { title: 'سبحان الله', arabic: 'سُبْحانَ اللّهِ', target: 33 },
            ]
          : undefined,
      };
    });

    // Ensure it's sorted again if we forced order 0 for daily
    return list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [currentDate, dailyTarget, dbDhikrs]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPresetId || 'daily');
  const activePreset: TasbihPresetItem = useMemo(() => {
    return (
      allPresets.find((p) => p.id === selectedPresetId) ||
      allPresets[0] || {
        id: 'empty',
        title: 'هیچ ذکری یافت نشد',
        arabic: 'برای افزودن ذکر به بخش مدیریت بروید',
        target: 100,
        category: 'custom',
        order: 0,
        isCustom: true,
      } as TasbihPresetItem
    );
  }, [allPresets, selectedPresetId]);

  // Daily dhikr sync with DashboardPage
  const [dailyDhikrCount, setDailyDhikrCount] = useDailyDhikrSync();
  const [localCount, setLocalCount] = useState<number>(0);

  const weekdayKeys = [
    'dhikr_saturday',
    'dhikr_sunday',
    'dhikr_monday',
    'dhikr_tuesday',
    'dhikr_wednesday',
    'dhikr_thursday',
    'dhikr_friday',
  ];
  const todayWeekdayKey = weekdayKeys[todayDhikr.dayIndex];
  const isDailyActive =
    activePreset.id === 'daily' ||
    activePreset.key === 'daily' ||
    activePreset.key === todayWeekdayKey;

  const count = isDailyActive ? dailyDhikrCount : localCount;

  // View modes: 'counter' | 'manage' | 'add_edit' | 'quick_target'
  const [viewMode, setViewMode] = useState<'counter' | 'manage' | 'add_edit' | 'quick_target'>('counter');

  // Form state for adding/editing dhikr (both default & custom)
  const [editingPreset, setEditingPreset] = useState<TasbihPresetItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArabic, setFormArabic] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formVirtue, setFormVirtue] = useState('');
  const [formTarget, setFormTarget] = useState(100);

  // Quick target edit state
  const [tempTarget, setTempTarget] = useState(100);

  // Fatima steps tracking
  const [fatimaStepIndex, setFatimaStepIndex] = useState(0);

  // Confirmation dialog state (in-modal, safe for iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Counting state
  const [totalLaps, setTotalLaps] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState<boolean>(false);

  // Local drag & drop reorder state
  const [reorderList, setReorderList] = useState<TasbihPresetItem[]>([]);

  useEffect(() => {
    setReorderList(allPresets);
  }, [allPresets]);

  // Reset or Sync on initialPresetId
  useEffect(() => {
    if (isOpen) {
      if (initialPresetId) {
        setSelectedPresetId(initialPresetId);
      }
      setLocalCount(0);
      setFatimaStepIndex(0);
      setViewMode('counter');
    }
  }, [isOpen, initialPresetId]);

  // Close logic: If not in counter view, X returns to counter. Else closes modal.
  const handleClose = useCallback(() => {
    if (viewMode !== 'counter') {
      setViewMode('counter');
    } else {
      onClose();
    }
  }, [viewMode, onClose]);

  // Tactile Vibration Feedback
  const triggerHaptic = useCallback(
    (isFinished = false) => {
      if (!vibrateEnabled || typeof window === 'undefined' || !navigator.vibrate) return;
      try {
        if (isFinished) {
          navigator.vibrate([80, 50, 120]);
        } else {
          navigator.vibrate(25);
        }
      } catch {}
    },
    [vibrateEnabled]
  );

  // Audio Beep Feedback
  const playAudioClick = useCallback(
    (isFinished = false) => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFinished ? 880 : 520, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinished ? 0.25 : 0.08));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (isFinished ? 0.25 : 0.08));
      } catch {}
    },
    [soundEnabled]
  );

  // Current Target and Arabic Text Calculations
  const currentStepTarget = useMemo(() => {
    if (activePreset.steps && activePreset.steps.length > 0) {
      return activePreset.steps[fatimaStepIndex]?.target || activePreset.target;
    }
    return activePreset.target;
  }, [activePreset, fatimaStepIndex]);

  const currentArabicText = useMemo(() => {
    if (activePreset.steps && activePreset.steps.length > 0) {
      return activePreset.steps[fatimaStepIndex]?.arabic || activePreset.arabic;
    }
    return activePreset.arabic;
  }, [activePreset, fatimaStepIndex]);

  const currentStepTitle = useMemo(() => {
    if (activePreset.steps && activePreset.steps.length > 0) {
      return activePreset.steps[fatimaStepIndex]?.title || activePreset.title;
    }
    return activePreset.title;
  }, [activePreset, fatimaStepIndex]);

  // Handle Incrementation
  const handleIncrement = useCallback(() => {
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 120);

    const nextCount = count + 1;

    if (activePreset.steps && activePreset.steps.length > 0) {
      const stepTarget = activePreset.steps[fatimaStepIndex].target;
      if (nextCount >= stepTarget) {
        if (fatimaStepIndex < activePreset.steps.length - 1) {
          setFatimaStepIndex((prev) => prev + 1);
          setLocalCount(0);
          triggerHaptic(false);
          playAudioClick(false);
        } else {
          setLocalCount(0);
          setFatimaStepIndex(0);
          setTotalLaps((prev) => prev + 1);
          triggerHaptic(true);
          playAudioClick(true);
        }
      } else {
        setLocalCount(nextCount);
        triggerHaptic(false);
        playAudioClick(false);
      }
    } else {
      if (currentStepTarget > 0 && nextCount >= currentStepTarget) {
        if (isDailyActive) {
          // Keep daily dhikr count at or above target without resetting to 0
          setDailyDhikrCount(nextCount);
        } else {
          setLocalCount(0);
        }
        setTotalLaps((prev) => prev + 1);
        triggerHaptic(true);
        playAudioClick(true);
      } else {
        if (isDailyActive) {
          setDailyDhikrCount(nextCount);
        } else {
          setLocalCount(nextCount);
        }
        triggerHaptic(false);
        playAudioClick(false);
      }
    }
  }, [
    count,
    activePreset,
    fatimaStepIndex,
    currentStepTarget,
    isDailyActive,
    setDailyDhikrCount,
    triggerHaptic,
    playAudioClick,
  ]);

  const handleReset = () => {
    if (isDailyActive) {
      setDailyDhikrCount(0);
    } else {
      setLocalCount(0);
    }
    setFatimaStepIndex(0);
    setTotalLaps(0);
  };

  // Open Form to Add New Dhikr
  const handleOpenAdd = () => {
    setEditingPreset(null);
    setFormTitle('');
    setFormArabic('');
    setFormMeaning('');
    setFormVirtue('');
    setFormTarget(100);
    setViewMode('add_edit');
  };

  // Open Form to Edit ANY Dhikr (Default or Custom)
  const handleOpenEdit = (preset: TasbihPresetItem) => {
    setEditingPreset(preset);
    setFormTitle(preset.title);
    setFormArabic(preset.arabic);
    setFormMeaning(preset.meaning || '');
    setFormVirtue(preset.virtue || '');
    setFormTarget(preset.target || 100);
    setViewMode('add_edit');
  };

  // Save Add/Edit Dhikr (Updates Dexie for db-backed dhikrs or localStorage for daily)
  const handleSaveDhikr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formArabic.trim()) return;

    const now = new Date().toISOString();
    const targetVal = Math.max(1, Number(formTarget) || 100);

    if (editingPreset) {
      if (editingPreset.id === 'daily') {
        // Daily dhikr target override
        saveDailyTarget(targetVal);
        addChange('تغییر تنظیمات ذکر روزانه', 'duas', 'update');
      } else if (editingPreset.dbId) {
        // Update existing database record
        await db.customDhikrs.update(editingPreset.dbId, {
          title: formTitle.trim(),
          arabic: formArabic.trim(),
          meaning: formMeaning.trim(),
          virtue: formVirtue.trim(),
          targetCount: targetVal,
          updatedAt: now,
        });
        addChange(`ویرایش ذکر "${formTitle.trim()}"`, 'duas', 'update');
      }
    } else {
      // Add new custom dhikr
      const maxOrder = dbDhikrs.reduce((max, d) => Math.max(max, d.order || 0), 0);
      const newId = await db.customDhikrs.add({
        title: formTitle.trim(),
        arabic: formArabic.trim(),
        meaning: formMeaning.trim(),
        virtue: formVirtue.trim(),
        targetCount: targetVal,
        category: 'custom',
        isCustom: true,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      });
      addChange(`افزودن ذکر جدید "${formTitle.trim()}"`, 'duas', 'create');
      setSelectedPresetId(`db_${newId}`);
    }

    setViewMode('manage');
  };

  // Delete ANY Dhikr (Default or Custom)
  const handleDeleteDhikr = (preset: TasbihPresetItem) => {
    if (preset.id === 'daily') {
      setConfirmDialog({
        isOpen: true,
        title: 'ذکر روزانه',
        message: 'ذکر روزانه پیش‌فرض برنامه قابل حذف نیست؛ اما می‌توانید تعداد هدف آن را در بخش ویرایش تغییر دهید.',
        confirmText: 'متوجه شدم',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'حذف ذکر',
      message: `آیا از حذف ذکر "${preset.title}" اطمینان دارید؟`,
      confirmText: 'حذف ذکر',
      cancelText: 'انصراف',
      onConfirm: async () => {
        if (preset.dbId) {
          await db.customDhikrs.delete(preset.dbId);
          addChange(`حذف ذکر "${preset.title}"`, 'duas', 'delete');
        }
        if (selectedPresetId === preset.id) {
          setSelectedPresetId('daily');
          setLocalCount(0);
        }
        setConfirmDialog(null);
      },
    });
  };

  // Restore Default Content Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const handleRestoreDefaults = () => {
    setIsRestoreModalOpen(true);
  };

  // Handle Drag and Drop Reordering
  const handleReorder = async (newOrderList: TasbihPresetItem[]) => {
    setReorderList(newOrderList);

    // Update order in database
    const updates = newOrderList
      .filter((item) => item.dbId !== undefined)
      .map((item, index) => ({
        id: item.dbId!,
        order: index + 1,
      }));

    for (const u of updates) {
      await db.customDhikrs.update(u.id, { order: u.order });
    }
  };

  // Save Quick Target
  const handleSaveQuickTarget = () => {
    const val = Math.max(1, Number(tempTarget) || 100);
    if (activePreset.id === 'daily') {
      saveDailyTarget(val);
    } else if (activePreset.dbId) {
      db.customDhikrs.update(activePreset.dbId, { targetCount: val });
    }
    setViewMode('counter');
  };

  const progressRatio = Math.min(1, count / (currentStepTarget || 100));
  const strokeDashoffset = 565.48 * (1 - progressRatio);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none" dir="rtl">
          {/* Animated Backdrop */}
          <motion.div
            key="tasbih-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Animated Modal Container */}
          <motion.div
            key="tasbih-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-surface-card rounded-3xl border border-theme shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme bg-surface-elevated/50">
              <div className="flex items-center gap-2.5">
                {viewMode !== 'counter' ? (
                  <button
                    onClick={() => setViewMode(viewMode === 'add_edit' ? 'manage' : 'counter')}
                    className="p-1.5 rounded-xl hover:bg-surface-elevated text-secondary-theme hover:text-primary-theme transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>{viewMode === 'add_edit' ? 'بازگشت به لیست' : 'بازگشت به ذکرشمار'}</span>
                  </button>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-primary-theme">ذکرشمار و تسبیح</h3>
                      <p className="text-[11px] text-secondary-theme font-medium">همراه آرامش‌بخش اذکار</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {viewMode === 'counter' && (
                  <>
                    {/* Dhikr Manager Button */}
                    <button
                      onClick={() => setViewMode('manage')}
                      title="مدیریت، ویرایش و مرتب‌سازی اذکار"
                      className="p-2 rounded-xl bg-surface-elevated hover:bg-amber-500/15 text-secondary-theme hover:text-amber-600 border border-theme transition-colors"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>

                    {/* Sound Toggle */}
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      title={soundEnabled ? 'صدا روشن' : 'صدا خاموش'}
                      className={`p-2 rounded-xl border transition-colors ${
                        soundEnabled
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-surface-elevated border-theme text-muted-theme'
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    {/* Vibrate Toggle */}
                    <button
                      onClick={() => setVibrateEnabled(!vibrateEnabled)}
                      title={vibrateEnabled ? 'لرزش فعال' : 'لرزش غیرفعال'}
                      className={`p-2 rounded-xl border transition-colors ${
                        vibrateEnabled
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-surface-elevated border-theme text-muted-theme'
                      }`}
                    >
                      <Vibrate className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-secondary-theme hover:bg-surface-elevated border border-transparent hover:border-theme transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 1. VIEW MODE: COUNTER (Main Screen) */}
            {viewMode === 'counter' && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Preset Selector Banner */}
                <div className="px-5 pt-3 pb-1">
                  <div className="relative">
                    <button
                      onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-elevated/80 hover:bg-surface-elevated rounded-2xl border border-theme text-xs font-semibold text-primary-theme transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">
                          ذکر جاری: <strong className="text-amber-700 dark:text-amber-300 font-bold">{currentStepTitle}</strong>
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-secondary-theme transition-transform shrink-0 ${
                          showPresetDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Options */}
                    <AnimatePresence>
                      {showPresetDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="absolute top-full right-0 left-0 mt-1.5 p-2 bg-surface-card border border-theme rounded-2xl shadow-2xl z-30 space-y-1 max-h-60 overflow-y-auto"
                        >
                          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-secondary-theme border-b border-theme/60 mb-1">
                            <span>انتخاب ذکر</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPresetDropdown(false);
                                setViewMode('manage');
                              }}
                              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <Settings2 className="w-3 h-3" />
                              <span>مدیریت و چینش اذکار</span>
                            </button>
                          </div>

                          {allPresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedPresetId(preset.id);
                                setLocalCount(0);
                                setFatimaStepIndex(0);
                                setShowPresetDropdown(false);
                              }}
                              className={`w-full text-right px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                selectedPresetId === preset.id
                                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold'
                                  : 'text-primary-theme hover:bg-surface-elevated'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {preset.isCustom && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                )}
                                <span className="truncate">{preset.title}</span>
                              </div>
                              <span className="text-[10px] text-secondary-theme font-normal shrink-0">
                                {preset.steps ? '۳۴+۳۳+۳۳' : `${toPersianDigits(preset.target)} مرتبه`}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Central Counting Canvas */}
                <div className="flex-1 flex flex-col items-center justify-center px-5 py-2 text-center select-none">
                  {/* Dhikr Arabic Calligraphy Display */}
                  <div className="min-h-[70px] flex flex-col items-center justify-center px-2 mb-2">
                    <p className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-200 leading-relaxed font-arabic">
                      {currentArabicText}
                    </p>
                    {activePreset.meaning && (
                      <span className="text-[11px] text-secondary-theme mt-0.5 font-medium line-clamp-1">
                        {activePreset.meaning}
                      </span>
                    )}
                    {activePreset.virtue && !activePreset.meaning && (
                      <span className="text-[11px] text-secondary-theme mt-0.5 font-medium">
                        {activePreset.virtue}
                      </span>
                    )}
                    {activePreset.steps && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {activePreset.steps.map((step, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              idx === fatimaStepIndex
                                ? 'bg-amber-500 text-white shadow-xs'
                                : idx < fatimaStepIndex
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-surface-elevated text-muted-theme'
                            }`}
                          >
                            {step.title} ({toPersianDigits(step.target)})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Circular Tap Counter */}
                  <div className="relative my-2">
                    <button
                      onClick={handleIncrement}
                      aria-label="شمارش ذکر"
                      className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center outline-none transition-all duration-100 ${
                        isPressing
                          ? 'scale-95 shadow-inner bg-amber-500/20'
                          : 'hover:scale-[1.02] shadow-lg active:scale-95'
                      } bg-gradient-to-b from-surface-elevated via-surface-card to-surface-elevated border border-amber-500/30`}
                    >
                      {/* Circular Progress SVG */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-amber-500/15"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray="565.48"
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className={`transition-all duration-150 ${
                            isDailyActive && count >= currentStepTarget
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                      </svg>

                      {/* Number and Step details */}
                      <span className="text-4xl sm:text-5xl font-black text-amber-900 dark:text-amber-100 tracking-tight font-arabic">
                        {toPersianDigits(count)}
                      </span>
                      <span className="text-xs text-secondary-theme font-medium mt-1">
                        از {toPersianDigits(currentStepTarget)} مرتبه
                      </span>
                      {isDailyActive && count >= currentStepTarget ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-2 bg-emerald-500/15 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ذکر امروز انجام شد
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-2 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                          لمس برای ذکر
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Laps and Statistics Row */}
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs text-secondary-theme">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>
                        دورهای کامل: <strong className="text-primary-theme font-bold">{toPersianDigits(totalLaps)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        پیشرفت: <strong className="text-primary-theme font-bold">{toPersianDigits(Math.round(progressRatio * 100))}٪</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Bottom Footer Actions */}
                <div className="p-4 border-t border-theme bg-surface-elevated/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-secondary-theme hover:text-red-600 hover:bg-red-500/10 border border-theme transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>صفر کردن</span>
                    </button>

                    {/* Quick Edit Target button */}
                    {!activePreset.steps && (
                      <button
                        onClick={() => {
                          setTempTarget(currentStepTarget);
                          setViewMode('quick_target');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-colors"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>تغییر تعداد ({toPersianDigits(currentStepTarget)})</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleClose}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    بستن
                  </button>
                </div>
              </div>
            )}

            {/* 2. VIEW MODE: QUICK TARGET EDIT */}
            {viewMode === 'quick_target' && (
              <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-primary-theme flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>تنظیم تعداد هدف برای «{activePreset.title}»</span>
                  </h4>
                  <p className="text-xs text-secondary-theme mt-1">
                    تعداد دورهایی که مایلید این ذکر تکرار شود را انتخاب یا وارد کنید:
                  </p>

                  {/* Preset number chips */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[14, 33, 40, 70, 100, 110, 313, 1000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTempTarget(num)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          tempTarget === num
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-surface-elevated border-theme text-primary-theme hover:border-amber-500/50'
                        }`}
                      >
                        {toPersianDigits(num)}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-secondary-theme mb-1">
                      تعداد دلخواه:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      value={tempTarget}
                      onChange={(e) => setTempTarget(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-sm font-bold text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-theme">
                  <button
                    onClick={() => setViewMode('counter')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary-theme hover:bg-surface-elevated border border-theme"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveQuickTarget}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تایید و ذخیره</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. VIEW MODE: MANAGE ALL DHIKRS (With Drag & Drop Sorting, Edit & Trash for ALL) */}
            {viewMode === 'manage' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Action Bar */}
                <div className="p-3.5 sm:p-4 border-b border-theme flex items-center justify-between gap-2 bg-surface-elevated/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-theme">
                    <GripVertical className="w-4 h-4 text-secondary-theme" />
                    <span>مدیریت و چینش اذکار</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Restore Defaults Button */}
                    <button
                      onClick={handleRestoreDefaults}
                      title="بازیابی و بازنشانی اذکار پیش‌فرض"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-elevated hover:bg-amber-500/10 text-secondary-theme hover:text-amber-700 border border-theme text-[11px] font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">بازیابی پیش‌فرض</span>
                    </button>

                    {/* Add New Dhikr Button */}
                    <button
                      onClick={handleOpenAdd}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ذکر جدید</span>
                    </button>
                  </div>
                </div>

                {/* Hint Bar */}
                <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>می‌توانید با کشیدن و رها کردن (Drag & Drop) ترتیب اذکار را تغییر دهید.</span>
                </div>

                {/* Reorderable List of Dhikrs */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                  <Reorder.Group
                    axis="y"
                    values={reorderList}
                    onReorder={handleReorder}
                    className="space-y-2.5"
                  >
                    {reorderList.map((preset) => (
                      <ReorderablePresetItem
                        key={preset.id}
                        preset={preset}
                        selectedPresetId={selectedPresetId}
                        setSelectedPresetId={setSelectedPresetId}
                        setLocalCount={setLocalCount}
                        setFatimaStepIndex={setFatimaStepIndex}
                        setViewMode={setViewMode}
                        handleOpenEdit={handleOpenEdit}
                        handleDeleteDhikr={handleDeleteDhikr}
                      />
                    ))}
                  </Reorder.Group>

                  {dbDhikrs.length === 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-surface-elevated border border-dashed border-theme text-center space-y-2.5">
                      <p className="text-xs text-secondary-theme font-medium">
                        تمامی اذکار پیش‌فرض و سفارشی پاکسازی شده‌اند.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleOpenAdd}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                        >
                          + افزودن ذکر جدید
                        </button>
                        <button
                          onClick={handleRestoreDefaults}
                          className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-theme text-xs font-semibold transition-colors"
                        >
                          بارگذاری اذکار پیش‌فرض
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. VIEW MODE: ADD / EDIT DHIKR (Works for BOTH default & custom) */}
            {viewMode === 'add_edit' && (
              <form onSubmit={handleSaveDhikr} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-theme bg-surface-elevated/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-theme">
                    {editingPreset ? `ویرایش «${editingPreset.title}»` : 'افزودن ذکر جدید'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-primary-theme mb-1">
                      عنوان ذکر <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ذکر استغفار، صلوات، ذکر رفع غم..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary-theme mb-1">
                      متن ذکر <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="متن عربی یا فارسی ذکر..."
                      value={formArabic}
                      onChange={(e) => setFormArabic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-xs font-extrabold focus:outline-none focus:border-amber-500 font-persian"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary-theme mb-1">
                      ترجمه و معنی فارسی (اختیاری)
                    </label>
                    <input
                      type="text"
                      placeholder="معنی مختصر ذکر..."
                      value={formMeaning}
                      onChange={(e) => setFormMeaning(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-primary-theme mb-1">
                        فضیلت یا مناسبت (اختیاری)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: گشایش کارها..."
                        value={formVirtue}
                        onChange={(e) => setFormVirtue(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-xs font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary-theme mb-1">
                        تعداد هدف <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100000"
                        value={formTarget}
                        onChange={(e) => setFormTarget(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 bg-surface-elevated border border-theme rounded-xl text-primary-theme text-xs font-bold focus:outline-none focus:border-amber-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-theme bg-surface-elevated/40 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('manage')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary-theme hover:bg-surface-elevated border border-theme"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPreset ? 'ذخیره تغییرات' : 'افزودن ذکر'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* In-Modal Confirmation Dialog */}
            <AnimatePresence>
              {confirmDialog?.isOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-sm bg-surface-card rounded-2xl border border-theme p-5 shadow-xl space-y-4"
                  >
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-primary-theme mb-1">{confirmDialog.title}</h4>
                      <p className="text-xs text-secondary-theme leading-relaxed">{confirmDialog.message}</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {confirmDialog.cancelText && (
                        <button
                          type="button"
                          onClick={() => setConfirmDialog(null)}
                          className="px-3.5 py-1.5 rounded-xl border border-theme text-xs font-semibold text-secondary-theme hover:bg-surface-elevated"
                        >
                          {confirmDialog.cancelText}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={confirmDialog.onConfirm}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                      >
                        {confirmDialog.confirmText || 'تأیید'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Granular Restore Default Content Modal */}
            <RestoreDefaultModal
              isOpen={isRestoreModalOpen}
              onClose={() => setIsRestoreModalOpen(false)}
              initialSelections={{ duas: false, ahkam: false, dhikrs: true }}
              onSuccess={() => {
                setSelectedPresetId('daily');
                setLocalCount(0);
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

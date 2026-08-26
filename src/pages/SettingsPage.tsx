import React, { useState, useRef } from 'react';
import { useAppNavigate } from '../components/PageTransition';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { useTheme } from '../hooks/useTheme';
import { usePWA } from '../hooks/usePWA';
import { BackupService } from '../services/backupService';
import { ResetService } from '../services/resetService';
import { MihrabBackupData } from '../types/backup';
import { usePendingChanges } from '../context/PendingChangesContext';
import { RestoreDefaultModal } from '../components/RestoreDefaultModal';
import {
  Sun,
  Moon,
  Monitor,
  CloudUpload,
  RotateCcw,
  Trash2,
  Star,
  Info,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface ReleaseInfo {
  version: string;
  badge?: string;
  date: string;
  isLatest?: boolean;
  changes: string[];
}

const RELEASES: ReleaseInfo[] = [
  {
    version: 'نسخه ۳.۲.۱',
    badge: 'جدیدترین نسخه',
    date: 'مرداد ۱۴۰۵',
    isLatest: true,
    changes: [
      'محاسبه و اعمال دقیق فاصله امن ناچ و نوار وضعیت (Safe Area Insets) در تمام صفحات و ویوهای مطالعه',
      'جلوگیری کامل از ورود یا تداخل هدر و دکمه‌های ناوبری با ساعت، باتری و Status Bar آیفون و آیپد',
      'یکپارچگی و همرنگ‌سازی ۱۰۰٪ نوار وضعیت با تم‌های تاریک و روشن بدون المان اضافه',
      'ارتقای کش آفلاین Service Worker به نسخه v8 جهت همگام‌سازی فوری آخرین بهینه‌سازی‌ها',
    ],
  },
  {
    version: 'نسخه ۳.۲.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'رفع ریشه‌ای مشکل رها شدن سوایپ کارت‌ها و رفع تداخل آن با دکمه شناور و اسکرول عمودی در مرورگرهای وب و وب‌اپ موبایل',
      'تثبیت کامل ژست سوایپ افقی با انحراف انگشت شست به بالا/پایین و جلوگیری از بروز رویداد Cancel حین کشیدن کارت',
      'حل مشکل نوار سفید در Status Bar آیفون، آیپد و اندروید در تم تاریک و هماهنگی با رنگ پس‌زمینه تم',
      'پشتیبانی ارتقایافته از viewport-fit=cover برای هماهنگی با نمایشگرهای بدون حاشیه',
    ],
  },
  {
    version: 'نسخه ۳.۱.۸',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'اصلاح ریشه‌ای و بهینه‌سازی الگوریتم سوایپ کارت‌ها برای حذف کامل (Gesture Lock و جلوگیری از لغو ناگهانی سوایپ در وب‌اپ موبایل)',
      'تشخیص هوشمند حرکات مورب و قوسی انگشت شست تا زاویه ۶۰ درجه جهت سوایپ روان و بدون وقفه',
      'پشتیبانی از حذف سریع با پرتاب یا کشیدن سریع (Flick / Quick Swipe) کارت‌ها',
      'ارتقای سیستم کش آفلاین Service Worker برای دریافت بی‌درنگ آخرین به‌روزرسانی‌ها در وب‌اپ',
    ],
  },
  {
    version: 'نسخه ۳.۱.۷',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'رفع باگ منوی سه‌نقطه بالای صفحات مطالعه (دعاها و احکام) و جلوگیری از بریده شدن منو با بازطراحی انیمیشن هدر',
      'رفع کامل مشکل پرش و ناپایداری صفحه در هنگام اسکرول در حالت نمایش کارت‌های احکام شرعی',
      'تغییر دکمه شناور رفتن به بالای صفحه (FAB) به فرم کاملاً دایره‌ای (گرد) و ارگونومیک در صفحات ادعیه و احکام',
      'بهبود ترنزیشن‌های انیمیشنی باز و بسته شدن هدر با افکت شیشه‌ای بلور (Backdrop Blur)',
    ],
  },
  {
    version: 'نسخه ۳.۱.۶',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'مخفی‌سازی هوشمند و خودکار نوار بالای صفحه (هدر) در هنگام اسکرول به پایین جهت تمرکز بیشتر بر مطالعه',
      'ظاهر شدن سریع و نرم هدر با کوچک‌ترین اسکرول به سمت بالا یا بازگشت به ابتدای صفحه',
      'افزودن دکمه شناور برگشت به ابتدای صفحه با انیمیشن ورود و اسکرول نرم (Smooth Scroll)',
    ],
  },
  {
    version: 'نسخه ۳.۱.۵',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'بهینه‌سازی لایه‌بندی و پورتال‌های اختصاصی در صفحات مطالعه متن دعاها و احکام شرعی',
      'بهبود استایل‌های تایپوگرافی، فاصله خطوط و تنظیمات اندازه فونت برای مطالعه طولانی‌مدت',
      'رفع باگ‌های جزئی در منوی عملیات متون و تسهیل کپی و اشتراک‌گذاری',
    ],
  },
  {
    version: 'نسخه ۳.۱.۴',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'بهینه‌سازی و هماهنگ‌سازی پایگاه داده داخلی IndexedDB (Dexie) و ارتقای سرعت بارگذاری اولیه',
      'بهبود فرآیند همگام‌سازی وضعیت سیستم و پایدارسازی جداول اطلاعاتی',
    ],
  },
  {
    version: 'نسخه ۳.۱.۳',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'صفر شدن خودکار نشانگر زنگوله و پاکسازی فهرست تغییرات پس از دانلود فایل پشتیبان (از پنجره زنگوله یا صفحه تنظیمات)',
      'تغییر دکمه پنجره اعلان‌ها و تغییرات (زنگوله) به «پشتیبان‌گیری و دریافت فایل (JSON)» با عملکرد مستقیم و کامل',
      'حفظ و تثبیت وضعیت «ذکر امروز انجام شد» در صفحه اصلی پس از اتمام ذکر و عدم صفر شدن خودکار شمارنده',
      'افزودن پنجره تأیید و انتخاب تفکیک‌شده بخش‌ها (ادعیه، احکام، اذکار) در زمان بارگذاری محتوای پیش‌فرض',
      'اصلاح قطعی و کامل فرآیند حذف داده‌ها برای پاکسازی واقعی و ۱۰۰٪ تمام جداول ادعیه، احکام و اذکار',
    ],
  },
  {
    version: 'نسخه ۳.۱.۲',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'اصلاح و هوشمندسازی فرآیند پاکسازی داده‌ها (Reset) در بخش پشتیبان‌گیری',
      'حذف خودکار اذکار و ادعیه سفارشی اضافه شده توسط کاربر و بازنشانی دقیق شمارنده‌ها به صفر',
      'حفظ و بازیابی تمیز اذکار و ادعیه معتبر پیش‌فرض برنامه در وضعیت اولیه استاندارد',
      'بهینه‌سازی ابعاد و چیدمان فشرده کارت ذکر روز در نمای عمودی موبایل',
      'طراحی زیباتر و تعاملی دکمه کپسولی شمارش ذکر و ورود یکپارچه به بخش تسبیح با لمس کارت',
    ],
  },
  {
    version: 'نسخه ۳.۱.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'همگام‌سازی کامل و لحظه‌ای کانتر ذکر روزانه بین پیش‌خوان اصلی و صفحه ذکرشمار (تسبیح)',
      'بازگشت کامل مجموعه اذکار پیش‌فرض و ادعیه معتبر همراه با اذکار تمام روزهای هفته',
      'امکان مدیریت کامل تمامی اذکار پیش‌فرض و شخصی (ویرایش عنوان، متن عربی، ترجمه، فضیلت و تعداد هدف)',
      'قابلیت مرتب‌سازی اذکار با درگ و دراپ (Drag & Drop) و جابجایی دلخواه ترتیب کارت‌ها',
      'یکپارچه‌سازی کامل جدول اذکار در سیستم پشتیبان‌گیری، بازیابی فایل و پاکسازی کامل داده‌ها',
    ],
  },
  {
    version: 'نسخه ۳.۰.۷',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'حل ریشه‌ای مشکل کانتینر و حاشیه تذهیب دعاها در انواع ابعاد موبایل (حالت عمودی و افقی)',
      'یکپارچه‌سازی کامل پس‌زمینه نسخه خطی و کادر دوبل طلایی بدون شکستگی یا چندتکه شدن لایه‌ها',
      'بهینه‌سازی اسکرول روان و خودکار در نمایش دعاهای کوتاه و بلند در تمامی نمایشگرها',
    ],
  },
  {
    version: 'نسخه ۳.۰.۶',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'بهبود چشمگیر سوایپ کارت‌ها و حذف حس چسبندگی؛ تشخیص روان حرکت افقی حتی در صورت لرزش دست به بالا و پایین',
      'اصلاح لایه‌بندی (Z-index) و پس‌زمینه کارت‌ها جهت پنهان‌سازی کامل دکمه قرمز سطل زباله در زیر کارت',
      'اصلاح نمایش حاشیه طلایی صفحه دعاها به صورت تمام‌ارتفاع (Full-Height) همانند صفحات واقعی کتب ادعیه',
    ],
  },
  {
    version: 'نسخه ۳.۰.۵',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'افزایش زمان نمایش اسپلش اسکرین جهت نمایش زیباتر و کامل‌تر آرت‌ورک محراب',
      'بهینه‌سازی تایمر ترنزیشن و ورود نرم به صفحه اصلی برنامه',
    ],
  },
  {
    version: 'نسخه ۳.۰.۴',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'طراحی آکاردیونی بخش‌های تنظیمات (ظاهر، داده‌ها و درباره محراب) با قابلیت باز و بسته شدن روان',
      'نمایش شکیل شماره نسخه در سمت چپ نوار بخش «درباره محراب» و حذف نشانگر انتهای صفحه',
      'بهبود استایل و واکنش‌گرایی دکمه‌های سربرگ بخش‌های تنظیمات',
      'رفع کامل مشکل بارگذاری آیکون در اسپلش اسکرین برنامه',
    ],
  },
  {
    version: 'نسخه ۳.۰.۳',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'افزودن فیلتر نشان‌شده‌ها (آیکون ستاره) در نوار تگ‌های بالای صفحات ادعیه و احکام',
      'امکان ستاره‌دار کردن و نشان‌گذاری مطالب و احکام شرعی جهت دسترسی سریع',
      'بهینه‌سازی رفتار اسکرول و نمایش باکس استیکی شناور در صفحات نماز و روزه',
      'اصلاح چیدمان و خطوط جداکننده عمودی در کارت آمار شناور پایین صفحه',
    ],
  },
  {
    version: 'نسخه ۳.۰.۲',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'اصلاح موقعیت و عملکرد دکمه شناور (FAB) در صفحات دعا و احکام',
      'نمایش صحیح دکمه شناور در پایین صفحه با قابلیت مخفی شدن هنگام اسکرول به پایین',
      'مرکزیت کامل مودال‌ها (افزودن و ویرایش) و پرده‌های شفاف در تمامی صفحات با استفاده از پورتال',
    ],
  },
  {
    version: 'نسخه ۳.۰.۱',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'حل مشکل نمایش ماژول‌های پاپ‌آپ (مانند تایید حذف و جشن اتمام نماز قضا) در حالت اسکرول',
      'تثبیت پس‌زمینه تیره کادر پیام‌ها در مرکز صفحه برای تمام بخش‌ها (پورتال هوشمند)',
      'بهبود و هماهنگی کامل کادر پیام با انیمیشن‌های سیستم',
    ],
  },
  {
    version: 'نسخه ۳.۰.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'بازنویسی کامل سیستم انیمیشن‌ها با فریم‌ورک Motion جهت اجرای روان‌تر و حس Native',
      'رفع کامل مشکل اسکیپ (پرش) در هنگام سوایپ (Gesture Back) گوشی',
      'بهینه‌سازی تشخیص مسیر جهت خروج و ورود هماهنگ صفحات (نماز، روزه، دعا، احکام و تنظیمات)',
    ],
  },
  {
    version: 'نسخه ۲.۰.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'پیاده‌سازی انیمیشن‌های جابجایی بین صفحات پیش‌خوان، چهار کارت اصلی عبادات و تنظیمات',
      'مدیریت هوشمند ژست بازگشت (Swipe to Back)',
      'بهینه‌سازی کارایی و ارتقاء به نسخه ۲.۰.۰',
    ],
  },
  {
    version: 'نسخه ۱.۵.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'یکپارچه‌سازی و اختصاص پالت رنگی نارنجی به تمامی المان‌ها، دکمه‌ها و فرم‌های صفحه روزه',
      'هماهنگی کامل پالت صفحه روزه و کفارات با تم پیش‌خوان',
      'بهینه‌سازی کلی و رفع ایرادات جزئی در نمایش تاریخچه و پرداخت‌ها',
    ],
  },
  {
    version: 'نسخه ۱.۴.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'نمایش دوخطی متن اصلی در کارت‌های بخش آموزش و احکام',
      'دسترسی دائمی و سریع به تگ‌های موجود در فرم‌های ثبت و ویرایش احکام و ادعیه',
      'هماهنگی دقیق رنگ‌بندی حاشیه کارت‌های روزه با داشبورد',
      'بهینه‌سازی کلی رابط کاربری و بهبود کارایی',
    ],
  },
  {
    version: 'نسخه ۱.۳.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'هوشمندسازی دکمه‌های شناور (FAB) در تمامی صفحات (حذف هنگام اسکرول به پایین و نمایش با اسکرول به بالا)',
      'تکمیل و بهبود سیستم پشتیبان‌گیری، بازیابی و حذف اطلاعات برای سازگاری کامل با تمامی داده‌ها',
      'بهبود عملکرد و رفع ایرادات جزئی',
    ],
  },
  {
    version: 'نسخه ۱.۲.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'مدیریت و دسته‌بندی پیشرفته تگ‌ها در بخش آموزش و احکام همراه با قابلیت سوایپ به چپ برای حذف',
      'بهینه‌سازی انیمیشن‌های نمایش روان در کارت‌های اقامه و قضای نماز بدون افت فریم',
      'انتقال موقعیت نمایش پیام‌ها و اعلان‌ها (نوتیفیکیشن) به بخش پایینی صفحه جهت دید بهتر کاربر',
      'اصلاح چیدمان دکمه شناور افزودن (FAB) و بهینه‌سازی نمایش در انواع رزولوشن‌های موبایل',
      'بهبودهای کلی در سرعت اجرا، ظاهر مودال‌ها و روان‌سازی انیمیشن‌های برنامه',
    ],
  },
  {
    version: 'نسخه ۱.۱.۰',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'افزودن قابلیت سوایپ (کشیدن به چپ) برای حذف سریع آیتم‌ها در سراسر برنامه (تاریخچه، تگ‌ها و...)',
      'امکان ثبت و ویرایش یادداشت‌ها و مطالب آموزشی همراه با فیلتر هوشمند تگ‌ها',
      'بهبود عملکرد سیستم پشتیبان‌گیری و بازیابی اطلاعات',
      'بهینه‌سازی کارت‌های محاسباتی بخش روزه، کفارات و فطریه',
    ],
  },
  {
    version: 'نسخه ۱.۰.۰',
    badge: 'نسخه اصلی',
    date: 'مرداد ۱۴۰۵',
    changes: [
      'راه اندازی نسخه ۱.۰ محراب',
      'پیش‌خوان جامع عبادات با دسترسی سریع به چهار بخش اصلی',
      'مدیریت و ثبت نمازهای قضا با شمارنده آسان',
      'محاسبات قضا و کفاره روزه، فطریه و رد مظالم',
      'کتابخانه منتخب ادعیه، زیارات و تعقیبات',
      'بخش آموزشی احکام شرعی و مسائل کاربردی',
      'پشتیبان‌گیری و بازیابی داده‌ها به‌صورت کامل',
      'پشتیبانی از پوسته روشن، تاریک و سیستم',
      'عملکرد ۱۰۰٪ آفلاین با ذخیره‌سازی محلی',
    ],
  },
];

interface SettingsPageProps {
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast }) => {
  const navigate = useAppNavigate();
  const { mode, setMode } = useTheme();
  const { isInstallable, installPWA } = usePWA();
  const { addChange, clearAllChanges } = usePendingChanges();

  // Modals state
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const [pendingBackup, setPendingBackup] = useState<MihrabBackupData | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [openReleaseIndex, setOpenReleaseIndex] = useState<number | null>(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Accordion Sections State (Section 1 open by default, 2 & 3 closed)
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(false);
  const [openSection3, setOpenSection3] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Touch Swipe Gesture (Left-to-Right)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);

    // Left-to-right swipe threshold
    if (deltaX > 50 && deltaY < 80) {
      navigate('/');
    }
    touchStartRef.current = null;
  };

  // 1. Export Backup Action
  const handleExportBackup = async () => {
    try {
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

      onShowToast('پشتیبان‌گیری با موفقیت انجام شد', 'success');
      clearAllChanges();
    } catch (err) {
      console.error('Export backup error:', err);
      onShowToast('خطا در تهیه نسخه پشتیبان', 'error');
    }
  };

  // 2. File Selected for Restore
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupObj = JSON.parse(text);
      const validation = BackupService.validateBackup(backupObj);

      if (!validation.isValid) {
        onShowToast(validation.errorMessageFa || 'فایل پشتیبان انتخاب شده معتبر نیست', 'error');
        return;
      }

      setPendingBackup(backupObj as MihrabBackupData);
      setIsRestoreDialogOpen(true);
    } catch (err) {
      console.error('File parse error:', err);
      onShowToast('فایل انتخاب شده فرمت پشتیبان معتبر JSON ندارد', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Confirm Restore Action
  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    setIsRestoring(true);
    try {
      await BackupService.importData(pendingBackup);
      addChange('بازیابی اطلاعات از فایل پشتیبان', 'settings', 'import');
      setIsRestoreDialogOpen(false);
      setPendingBackup(null);
      onShowToast('اطلاعات با موفقیت بازیابی شد', 'success');
    } catch (err) {
      console.error('Restore failed:', err);
      onShowToast('خطا در بازیابی اطلاعات', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Confirm Wipe Action
  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      await ResetService.wipeAllUserData();
      addChange('پاکسازی تمامی اطلاعات برنامه', 'settings', 'reset');
      setIsWipeDialogOpen(false);
      onShowToast('تمامی داده‌های برنامه‌ای با موفقیت پاکسازی شدند', 'success');
    } catch (err) {
      console.error('Wipe failed:', err);
      onShowToast('خطا در پاکسازی داده‌ها', 'error');
    } finally {
      setIsWiping(false);
    }
  };

  // 5. Restore Default Islamic Content Modal State
  const [isRestoreDefaultModalOpen, setIsRestoreDefaultModalOpen] = useState(false);
  const handleOpenRestoreDefaultModal = () => {
    setIsRestoreDefaultModalOpen(true);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-6 max-w-2xl mx-auto pb-10"
    >
      <PageHeader
        titleFa="تنظیمات"
        subtitleFa="پوسته، داده‌ها و مشخصات برنامه"
        showBack
        centered
        onBackClick={() => navigate('/')}
      />

      {/* Optional PWA Install Prompt Card */}
      {isInstallable && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary-theme">
                نصب اپلیکیشن محراب
              </h3>
              <p className="text-xs text-secondary-theme mt-0.5">
                برنامه را روی دستگاه خود برای دسترسی مستقیم آفلاین نصب کنید.
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={installPWA} className="shrink-0">
            نصب برنامه
          </Button>
        </Card>
      )}

      {/* SECTION 1: ظاهر و تجربه کاربری */}
      <section className="space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenSection1((prev) => !prev)}
          aria-expanded={openSection1}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-theme/60 bg-surface-card hover:bg-surface-elevated/70 transition-all cursor-pointer select-none text-right group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
              ۱
            </span>
            <span className="text-sm font-bold text-primary-theme group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              ظاهر و تجربه کاربری
            </span>
          </div>

          <motion.div
            animate={{ rotate: openSection1 ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 text-secondary-theme"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {openSection1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <Card className="p-4 sm:p-5 space-y-3">
                <label className="block text-xs font-bold text-secondary-theme">
                  حالت نمایش
                </label>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Option 1: Light Mode */}
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-center outline-none ${
                      mode === 'light'
                        ? 'bg-emerald-500/10 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                        : 'bg-surface-elevated border-theme/60 text-secondary-theme hover:text-primary-theme hover:border-theme'
                    }`}
                  >
                    <Sun className={`w-5 h-5 ${mode === 'light' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    <span className="text-xs sm:text-sm">روشن</span>
                  </button>

                  {/* Option 2: System Mode */}
                  <button
                    type="button"
                    onClick={() => setMode('system')}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-center outline-none ${
                      mode === 'system'
                        ? 'bg-emerald-500/10 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                        : 'bg-surface-elevated border-theme/60 text-secondary-theme hover:text-primary-theme hover:border-theme'
                    }`}
                  >
                    <Monitor className={`w-5 h-5 ${mode === 'system' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    <span className="text-xs sm:text-sm">سیستم</span>
                  </button>

                  {/* Option 3: Dark Mode */}
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-center outline-none ${
                      mode === 'dark'
                        ? 'bg-emerald-500/10 border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                        : 'bg-surface-elevated border-theme/60 text-secondary-theme hover:text-primary-theme hover:border-theme'
                    }`}
                  >
                    <Moon className={`w-5 h-5 ${mode === 'dark' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    <span className="text-xs sm:text-sm">تاریک</span>
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 2: داده‌ها و پشتیبان‌گیری */}
      <section className="space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenSection2((prev) => !prev)}
          aria-expanded={openSection2}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-theme/60 bg-surface-card hover:bg-surface-elevated/70 transition-all cursor-pointer select-none text-right group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
              ۲
            </span>
            <span className="text-sm font-bold text-primary-theme group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              داده‌ها و پشتیبان‌گیری
            </span>
          </div>

          <motion.div
            animate={{ rotate: openSection2 ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 text-secondary-theme"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {openSection2 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <Card className="divide-y divide-theme/40 p-0 overflow-hidden">
                {/* Action 1: Export Backup */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleExportBackup}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleExportBackup()}
                  aria-label="پشتیبان‌گیری - از اطلاعات برنامه نسخه پشتیبان تهیه کنید"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CloudUpload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-theme">
                        پشتیبان‌گیری
                      </h3>
                      <p className="text-xs text-secondary-theme mt-0.5">
                        از اطلاعات برنامه نسخه پشتیبان تهیه کنید.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-secondary-theme/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                {/* Action 2: Restore Data */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  aria-label="بازیابی اطلاعات - اطلاعات را از نسخه پشتیبان بازیابی کنید"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-theme">
                        بازیابی اطلاعات
                      </h3>
                      <p className="text-xs text-secondary-theme mt-0.5">
                        اطلاعات را از نسخه پشتیبان بازیابی کنید.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-secondary-theme/60 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />

                {/* Action 3: Load Default Content */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleOpenRestoreDefaultModal}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenRestoreDefaultModal()}
                  aria-label="بارگذاری محتوای پیش‌فرض - ادعیه، زیارات، احکام و اذکار پیش‌فرض برنامه را بارگذاری کنید"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-theme">
                        بارگذاری محتوای پیش‌فرض
                      </h3>
                      <p className="text-xs text-secondary-theme mt-0.5">
                        ادعیه، زیارات، احکام شرعی و اذکار تسبیح را به دلخواه بازگردانید.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-secondary-theme/60 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                {/* Action 4: Complete Data Wipe */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsWipeDialogOpen(true)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsWipeDialogOpen(true)}
                  aria-label="حذف کامل داده‌ها - تمام اطلاعات برنامه حذف خواهند شد"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-red-500/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                        حذف کامل داده‌ها
                      </h3>
                      <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-0.5">
                        تمام اطلاعات برنامه حذف خواهند شد.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-red-400/60 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 3: درباره Mihrab */}
      <section className="space-y-2.5">
        <button
          type="button"
          onClick={() => setOpenSection3((prev) => !prev)}
          aria-expanded={openSection3}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-theme/60 bg-surface-card hover:bg-surface-elevated/70 transition-all cursor-pointer select-none text-right group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
              ۳
            </span>
            <span className="text-sm font-bold text-primary-theme group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              درباره Mihrab
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-persian shrink-0">
              نسخه ۳.۲.۱
            </span>
            <motion.div
              animate={{ rotate: openSection3 ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 text-secondary-theme"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {openSection3 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <Card className="divide-y divide-theme/40 p-0 overflow-hidden">
                {/* Action 1: Changelog */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsChangelogOpen(true)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsChangelogOpen(true)}
                  aria-label="تغییرات نسخه‌ها - مشاهده تغییرات و بهبودهای نسخه‌ها"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-theme">
                        تغییرات نسخه‌ها
                      </h3>
                      <p className="text-xs text-secondary-theme mt-0.5">
                        مشاهده تغییرات و بهبودهای نسخه‌ها
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-secondary-theme/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                {/* Action 2: About Mihrab */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsAboutOpen(true)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsAboutOpen(true)}
                  aria-label="درباره Mihrab - اطلاعات برنامه، نسخه و ارتباط با ما"
                  className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-theme">
                        درباره Mihrab
                      </h3>
                      <p className="text-xs text-secondary-theme mt-0.5">
                        اطلاعات برنامه، نسخه و ارتباط با ما
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-secondary-theme/60 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* DIALOG 1: Confirmation for Restore Backup */}
      <Dialog
        isOpen={isRestoreDialogOpen}
        onClose={() => {
          setIsRestoreDialogOpen(false);
          setPendingBackup(null);
        }}
        titleFa="بازیابی اطلاعات"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsRestoreDialogOpen(false);
                setPendingBackup(null);
              }}
            >
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRestore}
              isLoading={isRestoring}
            >
              بازیابی
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-sky-500/10 text-sky-800 dark:text-sky-300 rounded-xl">
            <RotateCcw className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">تأیید جایگزینی اطلاعات</p>
              <p className="leading-relaxed">
                با بازیابی این نسخه، اطلاعات فعلی جایگزین خواهند شد. آیا می‌خواهید ادامه دهید؟
              </p>
            </div>
          </div>
          {pendingBackup?.exportedAt && (
            <p className="text-xs text-secondary-theme">
              تاریخ ایجاد فایل پشتیبان:{' '}
              <span className="font-semibold dir-ltr inline-block">
                {new Date(pendingBackup.exportedAt).toLocaleDateString('fa-IR')}
              </span>
            </p>
          )}
        </div>
      </Dialog>

      {/* DIALOG 2: Confirmation for Delete All Data */}
      <Dialog
        isOpen={isWipeDialogOpen}
        onClose={() => setIsWipeDialogOpen(false)}
        titleFa="حذف کامل داده‌ها"
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsWipeDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmWipe}
              isLoading={isWiping}
            >
              حذف همه داده‌ها
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 text-red-800 dark:text-red-300 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">هشدار حذف کامل</p>
              <p className="leading-relaxed">
                آیا مطمئن هستید که می‌خواهید تمام اطلاعات Mihrab را حذف کنید؟
              </p>
            </div>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 font-bold">
            این عملیات قابل بازگشت نیست.
          </p>
        </div>
      </Dialog>

      {/* DIALOG 3: Changelog Modal */}
      <Dialog
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        titleFa="تغییرات نسخه‌ها"
        actions={
          <Button variant="secondary" onClick={() => setIsChangelogOpen(false)}>
            بستن
          </Button>
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {RELEASES.map((rel, idx) => {
            const isOpen = openReleaseIndex === idx;
            return (
              <div
                key={rel.version}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  rel.isLatest
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-theme/60 bg-surface-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenReleaseIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-right hover:bg-surface-elevated/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-primary-theme">
                      {rel.version}
                    </span>
                    {rel.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {rel.badge}
                      </span>
                    )}
                    <span className="text-[11px] text-secondary-theme opacity-80">
                      ({rel.date})
                    </span>
                  </div>

                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 text-secondary-theme"
                  >
                    <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={`release-content-${rel.version}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-theme/30">
                        <ul className="text-xs text-secondary-theme space-y-2 list-disc list-inside leading-relaxed pr-1">
                          {rel.changes.map((change, cIdx) => (
                            <li key={cIdx} className="text-primary-theme/90">
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Dialog>

      {/* DIALOG 4: About Mihrab Modal */}
      <Dialog
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        titleFa="درباره محراب"
        actions={
          <Button variant="primary" onClick={() => setIsAboutOpen(false)}>
            متوجه شدم
          </Button>
        }
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-extrabold text-primary-theme">محراب</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-persian">
                نسخه ۳.۲.۱
              </span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              همراه همیشگی شما در مسیر بندگی
            </p>
          </div>

          <p className="text-xs text-secondary-theme leading-relaxed text-right bg-surface-elevated p-3 rounded-xl border border-theme/50">
            محراب برنامه‌ای ساده، زیبا و ۱۰۰٪ آفلاین برای ثبت عبادات، نمازهای قضا، روزه، ادعیه و احکام شرعی است. تمامی اطلاعات شما به‌صورت محلی روی دستگاه ذخیره شده و هیچ داده‌ای به سرورهای خارجی ارسال نمی‌شود.
          </p>

          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2 text-xs text-secondary-theme">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>کاملاً رایگان و بدون هیچ‌گونه تبلیغات</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary-theme">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>حفظ کامل حریم خصوصی و ذخیره‌سازی محلی</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary-theme">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>پشتیبانی از حالت تاریک، روشن و سیستم</span>
            </div>
          </div>
        </div>
      </Dialog>

      {/* DIALOG 5: Granular Restore Default Content Modal */}
      <RestoreDefaultModal
        isOpen={isRestoreDefaultModalOpen}
        onClose={() => setIsRestoreDefaultModalOpen(false)}
        onSuccess={(msg) => {
          addChange('بارگذاری محتوای پیش‌فرض', 'settings', 'import');
          onShowToast(msg, 'success');
        }}
        onError={(msg) => onShowToast(msg, 'error')}
      />
    </div>
  );
};

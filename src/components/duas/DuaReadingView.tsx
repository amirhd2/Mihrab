import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, MoreVertical, Star, Edit3, Trash2, Copy, Share2, Heart, Type } from 'lucide-react';
import { DuaRecord, DuaTagRecord } from '../../types/db';
import { motion, AnimatePresence } from 'motion/react';

interface DuaReadingViewProps {
  dua: DuaRecord;
  onClose: () => void;
  onEdit: (dua: DuaRecord) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

type TextSize = 'sm' | 'base' | 'lg' | 'xl';

export const DuaReadingView: React.FC<DuaReadingViewProps> = ({
  dua,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('base');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    try {
      const text = `${dua.title}\n\n${dua.arabicText}\n\n${dua.persianTranslation}${dua.source ? `\n\nمنبع: ${dua.source}` : ''}`;
      await navigator.clipboard.writeText(text);
      setShowMenu(false);
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleShare = async () => {
    try {
      const text = `${dua.title}\n\n${dua.arabicText}\n\n${dua.persianTranslation}${dua.source ? `\n\nمنبع: ${dua.source}` : ''}`;
      if (navigator.share) {
        await navigator.share({
          title: dua.title,
          text: text,
        });
      } else {
        await handleCopy();
      }
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to share', err);
    }
  };

  const getTextSizeClass = (size: TextSize) => {
    switch (size) {
      case 'sm': return { arabic: 'text-2xl leading-[2.5]', persian: 'text-sm leading-7' };
      case 'base': return { arabic: 'text-3xl leading-[2.5]', persian: 'text-base leading-8' };
      case 'lg': return { arabic: 'text-4xl leading-[2.5]', persian: 'text-lg leading-9' };
      case 'xl': return { arabic: 'text-5xl leading-[2.5]', persian: 'text-xl leading-10' };
    }
  };

  const { arabic, persian } = getTextSizeClass(textSize);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-900 flex flex-col"
      dir="rtl"
    >
      {/* Top App Bar */}
      <div className="flex-none bg-surface-card border-b border-neutral-200/50 dark:border-neutral-800/50 px-2 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-primary-theme truncate flex-1 text-center px-4">
          {dua.title}
        </h1>
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <button
            onClick={() => onToggleFavorite(dua.id!)}
            className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition-colors dark:hover:bg-amber-500/10"
            title="علامت‌گذاری"
          >
            <Star className="w-6 h-6" fill={dua.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(dua);
            }}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
            title="ویرایش"
            aria-label="ویرایش"
          >
            <Edit3 className="w-5.5 h-5.5" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
            title="گزینه‌های بیشتر"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          {/* 3-dot Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-12 left-2 w-48 bg-surface-card rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50"
              >
                <button
                  onClick={() => { setShowMenu(false); if (dua.id) onDelete(dua.id); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-sm font-medium">حذف</span>
                </button>
                <div className="h-px bg-neutral-200 dark:bg-neutral-800 w-full" />
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Copy className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm font-medium">کپی متن</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm font-medium">اشتراک‌گذاری</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Reading Area */}
      <div className="flex-1 overflow-y-auto bg-amber-50/30 dark:bg-neutral-900 px-4 py-8 pb-32 flex justify-center">
        {/* Book Page Container */}
        <div className="w-full max-w-3xl bg-[#fdfaf5] dark:bg-neutral-800 rounded-lg shadow-sm border border-amber-200/50 dark:border-neutral-700 p-1 relative overflow-hidden h-max min-h-full">
          {/* Inner Ornamental Border (CSS approximated) */}
          <div className="border-[3px] border-double border-amber-300/40 dark:border-amber-700/40 rounded p-6 sm:p-10 h-full flex flex-col relative">
            
            {/* Title */}
            <div className="text-center mb-10 relative">
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="w-8 h-px bg-amber-400/50"></span>
                <span className="text-amber-500/70 text-lg">❖</span>
                <span className="w-8 h-px bg-amber-400/50"></span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 font-serif">
                {dua.title}
              </h2>
            </div>

            {/* Arabic Text */}
            <div dir="rtl" className={`text-center font-arabic text-amber-950 dark:text-amber-50 mb-10 ${arabic} whitespace-pre-wrap`}>
              {dua.arabicText}
            </div>

            {/* Divider */}
            {dua.persianTranslation && (
              <div className="flex items-center justify-center gap-4 my-8 opacity-50">
                <span className="w-16 h-px bg-amber-800/20 dark:bg-amber-200/20"></span>
                <span className="text-amber-800/40 dark:text-amber-200/40">◈</span>
                <span className="w-16 h-px bg-amber-800/20 dark:bg-amber-200/20"></span>
              </div>
            )}

            {/* Persian Text */}
            {dua.persianTranslation && (
              <div dir="rtl" className={`text-center text-neutral-600 dark:text-neutral-300 font-body ${persian} whitespace-pre-wrap`}>
                {dua.persianTranslation}
              </div>
            )}

            {/* Source */}
            {dua.source && (
              <div className="mt-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
                منبع: {dua.source}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-neutral-200/50 dark:border-neutral-800/50 p-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-md mx-auto flex justify-between items-center px-6 py-2">
          <button
            onClick={() => onToggleFavorite(dua.id!)}
            className="flex flex-col items-center gap-1 text-neutral-500 hover:text-amber-500 transition-colors"
          >
            <Heart className="w-6 h-6" fill={dua.isFavorite ? '#f59e0b' : 'none'} color={dua.isFavorite ? '#f59e0b' : 'currentColor'} />
            <span className="text-[10px] font-medium">مورد علاقه</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTextSize(!showTextSize)}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-primary-theme transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center font-bold font-serif text-lg leading-none">Aa</div>
              <span className="text-[10px] font-medium">اندازه متن</span>
            </button>

            {/* Text Size Menu */}
            <AnimatePresence>
              {showTextSize && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-surface-card rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-50"
                >
                  {(['sm', 'base', 'lg', 'xl'] as TextSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => { setTextSize(size); setShowTextSize(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                        textSize === size
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {size === 'sm' ? 'کوچک' : size === 'base' ? 'متوسط' : size === 'lg' ? 'بزرگ' : 'بزرگتر'}
                      </span>
                      <span className={`font-arabic font-bold ${
                        size === 'sm' ? 'text-lg' : size === 'base' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'
                      }`}>
                        Aa
                      </span>
                    </button>
                  ))}
                  <div className="mt-2 text-center text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2">
                    این تنظیم فقط برای صفحه مطالعه اعمال می‌شود.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-neutral-500 hover:text-primary-theme transition-colors"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-medium">اشتراک‌گذاری</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

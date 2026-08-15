import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { ArrowRight, MoreVertical, Star, Edit, Trash2, Copy, Share2, Heart, Type } from 'lucide-react';
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
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  // Prevent background page from scrolling while reading view is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

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

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Don't hide if close to top
    if (currentScrollY < 50) {
      setShowTopBar(true);
    } else {
      if (currentScrollY < lastScrollY) {
        setShowTopBar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTopBar(false);
        setShowMenu(false);
      }
    }
    setLastScrollY(currentScrollY);
  };

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
      initial={{ opacity: 0, y: 16 }}
      animate={isClosing ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-900 overflow-hidden"
      dir="rtl"
    >
      {/* iOS-Inspired Reading Top Bar */}
      <div 
        className={`absolute top-0 left-0 right-0 bg-surface-bg border-b border-neutral-200/80 dark:border-neutral-800 px-4 pt-2 pb-4 flex items-center justify-between z-20 transition-transform duration-300 ${
          showTopBar ? 'translate-y-0' : '-translate-y-[120%]'
        }`}
      >
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <h1 className="text-base sm:text-lg font-bold text-primary-theme truncate px-4 max-w-[220px] sm:max-w-md text-center">
          {dua.title}
        </h1>

        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <button
            onClick={() => onToggleFavorite(dua.id!)}
            className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors dark:hover:bg-amber-500/10 active:scale-95"
            title="علامت‌گذاری"
          >
            <Star className="w-5 h-5" fill={dua.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => {
              onEdit(dua);
            }}
            className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors active:scale-95"
            title="ویرایش"
            aria-label="ویرایش"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-xl transition-colors"
            title="گزینه‌های بیشتر"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* 3-dot Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-full mt-4 w-48 bg-surface-card border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl py-1.5 z-30 overflow-hidden"
              >
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-primary-theme hover:bg-surface-elevated transition-colors"
                >
                  <Copy className="w-4 h-4 text-secondary-theme" />
                  <span>کپی متن</span>
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-primary-theme hover:bg-surface-elevated transition-colors"
                >
                  <Share2 className="w-4 h-4 text-secondary-theme" />
                  <span>اشتراک‌گذاری</span>
                </button>
                <div className="my-1 border-t border-neutral-200/60 dark:border-neutral-800/60 w-full" />
                
                {/* Text Size submenu inside menu */}
                <div className="px-3 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 mb-1">
                  <div className="text-[10px] text-secondary-theme mb-2 font-medium px-1">اندازه متن:</div>
                  <div className="flex items-center justify-between gap-1">
                    {(['sm', 'base', 'lg', 'xl'] as TextSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => { setTextSize(size); setShowMenu(false); }}
                        className={`p-1.5 rounded-lg flex-1 text-center transition-colors flex justify-center items-center ${
                          textSize === size
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        <Type className={size === 'sm' ? 'w-3 h-3' : size === 'base' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setShowMenu(false); if (dua.id) onDelete(dua.id); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Reading Area */}
      <div 
        className="w-full h-full overflow-y-auto overscroll-contain bg-amber-50/30 dark:bg-neutral-900 px-4 pt-[76px] pb-12 flex justify-center"
        onScroll={handleScroll}
      >
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

      {/* Bottom Floating Bar removed to match EducationReadingView style */}
    </motion.div>
  );
};

import { Portal } from "../Portal";
import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { ArrowRight, MoreVertical, Star, Edit, Trash2, Copy, Share2, Heart, Type, ChevronUp } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      case 'sm': return { arabic: 'text-xl sm:text-2xl leading-[2.2] sm:leading-[2.5]', persian: 'text-xs sm:text-sm leading-6 sm:leading-7' };
      case 'base': return { arabic: 'text-2xl sm:text-3xl leading-[2.2] sm:leading-[2.5]', persian: 'text-sm sm:text-base leading-7 sm:leading-8' };
      case 'lg': return { arabic: 'text-3xl sm:text-4xl leading-[2.2] sm:leading-[2.5]', persian: 'text-base sm:text-lg leading-8 sm:leading-9' };
      case 'xl': return { arabic: 'text-4xl sm:text-5xl leading-[2.2] sm:leading-[2.5]', persian: 'text-lg sm:text-xl leading-9 sm:leading-10' };
    }
  };

  const { arabic, persian } = getTextSizeClass(textSize);

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isClosing ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-[#fdfaf5] dark:bg-[#141a24] flex flex-col overflow-hidden"
        dir="rtl"
      >
      {/* iOS-Inspired Reading Top Bar */}
      <motion.div
        initial={false}
        animate={{ y: showTopBar ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 z-30 w-full bg-[#fdfaf5]/95 dark:bg-[#141a24]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between"
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
                      className="absolute left-0 top-full mt-2 w-48 bg-surface-card border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl py-1.5 z-30 overflow-hidden"
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
      </motion.div>

      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overscroll-y-contain bg-[#fdfaf5] dark:bg-[#141a24] p-2.5 pt-20 sm:p-5 sm:pt-24 md:p-6 md:pt-24 flex flex-col"
        onScroll={handleScroll}
      >
        {/* Manuscript Book Frame (Unified Single Illumination Border) */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-between border-2 sm:border-[3px] border-double border-amber-400/70 dark:border-amber-600/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-amber-50/20 dark:bg-amber-500/[0.02] shadow-xs">
          
          <div className="flex-1 flex flex-col justify-start">
            {/* Title Header */}
            <div className="text-center mb-6 sm:mb-8 relative">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="w-8 sm:w-12 h-px bg-amber-400/50"></span>
                <span className="text-amber-500/80 text-base sm:text-lg">❖</span>
                <span className="w-8 sm:w-12 h-px bg-amber-400/50"></span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 font-serif">
                {dua.title}
              </h2>
            </div>

            {/* Arabic Text */}
            <div dir="rtl" className={`text-center font-arabic text-amber-950 dark:text-amber-50 mb-8 ${arabic} whitespace-pre-wrap`}>
              {dua.arabicText}
            </div>

            {/* Ornamental Divider */}
            {dua.persianTranslation && (
              <div className="flex items-center justify-center gap-3 my-6 opacity-60">
                <span className="w-12 sm:w-20 h-px bg-amber-800/20 dark:bg-amber-200/20"></span>
                <span className="text-amber-800/50 dark:text-amber-200/50 text-xs sm:text-sm">◈</span>
                <span className="w-12 sm:w-20 h-px bg-amber-800/20 dark:bg-amber-200/20"></span>
              </div>
            )}

            {/* Persian Translation Text */}
            {dua.persianTranslation && (
              <div dir="rtl" className={`text-center text-neutral-700 dark:text-neutral-300 font-body ${persian} whitespace-pre-wrap`}>
                {dua.persianTranslation}
              </div>
            )}
          </div>

          {/* Source Reference at bottom of the framed page */}
          {dua.source && (
            <div className="mt-8 pt-4 border-t border-amber-400/30 dark:border-amber-600/30 text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              منبع: {dua.source}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Bar removed to match EducationReadingView style */}

      {/* Floating Action Button for scrolling to top */}
      <AnimatePresence>
        {!showTopBar && lastScrollY > 200 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-6 left-6 z-40"
          >
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full flex items-center justify-center transition-all active:scale-95"
              aria-label="بازگشت به بالا"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </Portal>
  );
};

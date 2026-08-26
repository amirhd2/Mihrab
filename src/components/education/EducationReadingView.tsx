import { Portal } from "../Portal";
import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { ArrowRight, MoreVertical, Edit, Trash2, Copy, Share2, Tag as TagIcon, Check, Star, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EducationContentRecord } from '../../types/db';

interface EducationReadingViewProps {
  item: EducationContentRecord;
  onBack: () => void;
  onEdit: (item: EducationContentRecord) => void;
  onDelete: (item: EducationContentRecord) => void;
  onToggleFavorite?: (item: EducationContentRecord) => void;
  onShowToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

export const EducationReadingView: React.FC<EducationReadingViewProps> = ({
  item,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  onShowToast,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onBack();
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

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll to hide/show top bar
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Don't hide if close to top
    if (currentScrollY < 50) {
      setShowTopBar(true);
    } else {
      // Show if scrolling up, hide if scrolling down
      if (currentScrollY < lastScrollY) {
        setShowTopBar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTopBar(false);
        setIsMenuOpen(false); // Close menu when hiding top bar
      }
    }
    setLastScrollY(currentScrollY);
  };

  // Format text paragraphs and headings
  const renderFormattedText = (rawText: string) => {
    const paragraphs = rawText.split(/\n\s*\n/);

    return paragraphs.map((para, index) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Check if line is a heading (starts with # or is short without trailing period or ends with :)
      const isHeading =
        trimmed.startsWith('#') ||
        trimmed.startsWith('**') ||
        (trimmed.length < 60 && !trimmed.endsWith('.') && (trimmed.endsWith(':') || !trimmed.includes('،')));

      if (isHeading) {
        const cleanHeading = trimmed.replace(/^[#*:]+\s*/, '').replace(/\*+$/, '');
        return (
          <h3
            key={index}
            className="text-base sm:text-lg font-bold text-primary-theme mt-6 mb-2 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-1.5"
          >
            {cleanHeading}
          </h3>
        );
      }

      return (
        <p key={index} className="text-sm sm:text-base text-primary-theme leading-relaxed sm:leading-loose mb-4">
          {trimmed}
        </p>
      );
    });
  };

  const fullShareText = `${item.title}\n\n${item.text}${item.source ? `\n\nمنبع: ${item.source}` : ''}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsMenuOpen(false);
      if (onShowToast) onShowToast('متن با موفقیت کپی شد', 'success');
    } catch (err) {
      if (onShowToast) onShowToast('خطا در کپی متن', 'error');
    }
  };

  const handleShare = async () => {
    setIsMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: fullShareText,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
      if (onShowToast) onShowToast('متن برای اشتراک‌گذاری کپی شد', 'info');
    }
  };

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isClosing ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-900 flex flex-col overflow-hidden"
      dir="rtl"
    >
      {/* iOS-Inspired Reading Top Bar */}
      <motion.div
        initial={false}
        animate={{ y: showTopBar ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 z-30 w-full bg-surface-bg/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 pt-[max(env(safe-area-inset-top),10px)] pb-2.5 flex items-center justify-between"
      >
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <h1 className="text-base sm:text-lg font-bold text-primary-theme truncate px-4 max-w-[220px] sm:max-w-md text-center">
          {item.title}
        </h1>

        {/* Action Buttons: Star + Edit Pencil + Three-Dot Menu */}
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(item)}
              className={`p-2 rounded-xl transition-colors active:scale-95 ${
                item.isFavorite
                  ? 'text-amber-500 hover:bg-amber-500/10'
                  : 'text-secondary-theme hover:text-amber-500 hover:bg-surface-elevated'
              }`}
              title={item.isFavorite ? 'حذف از نشان‌شده‌ها' : 'نشان کردن (ستاره‌دار)'}
            >
              <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors active:scale-95"
            title="ویرایش مطلب"
          >
            <Edit className="w-5 h-5" />
          </button>

          {/* Three-Dot Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-xl transition-colors"
            title="منوی عملیات"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Three-Dot Menu with AnimatePresence */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-full mt-4 w-48 bg-surface-card border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl py-1.5 z-30 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full px-4 py-2.5 text-xs font-medium text-primary-theme hover:bg-surface-elevated flex items-center gap-2.5 text-right transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-blue-500" /> : <Copy className="w-4 h-4 text-secondary-theme" />}
                  <span>کپی متن</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full px-4 py-2.5 text-xs font-medium text-primary-theme hover:bg-surface-elevated flex items-center gap-2.5 text-right transition-colors"
                >
                  <Share2 className="w-4 h-4 text-secondary-theme" />
                  <span>اشتراک‌گذاری</span>
                </button>

                <div className="my-1 border-t border-neutral-200/60 dark:border-neutral-800/60" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(item);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 text-right transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف مطلب</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overscroll-y-contain bg-neutral-50/50 dark:bg-neutral-900 p-2.5 pt-[max(calc(env(safe-area-inset-top)+56px),80px)] sm:p-5 sm:pt-24 md:p-6 md:pt-24 flex flex-col"
        onScroll={handleScroll}
      >
        {/* Reading Article Body Container */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-between bg-surface-card bg-gradient-to-br from-blue-500/[0.06] to-blue-500/[0.02] border border-blue-500/15 dark:border-blue-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-6">
            {/* Article Title Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-primary-theme tracking-tight mb-3">
                {item.title}
              </h2>

              {/* Tags Metadata Line */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                  <span className="text-xs text-muted-theme flex items-center gap-1 font-medium">
                    <TagIcon className="w-3.5 h-3.5 text-blue-500" />
                    دسته:
                  </span>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-blue-500/10 dark:border-blue-500/15" />

            {/* Main Article Content */}
            <div className="text-primary-theme prose prose-blue dark:prose-invert max-w-none">
              {renderFormattedText(item.text)}
            </div>
          </div>

          {/* Source Citation */}
          {item.source && (
            <div className="pt-6 border-t border-blue-500/10 dark:border-blue-500/15 flex items-center justify-end">
              <p className="text-xs text-secondary-theme font-medium bg-blue-500/[0.05] px-3 py-1.5 rounded-xl border border-blue-500/15 dark:border-blue-500/20">
                منبع: <span className="text-primary-theme font-bold">{item.source}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      
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
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-xl rounded-full flex items-center justify-center transition-all active:scale-95"
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

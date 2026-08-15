import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { ArrowRight, MoreVertical, Edit, Trash2, Copy, Share2, Tag as TagIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EducationContentRecord } from '../../types/db';

interface EducationReadingViewProps {
  item: EducationContentRecord;
  onBack: () => void;
  onEdit: (item: EducationContentRecord) => void;
  onDelete: (item: EducationContentRecord) => void;
  onShowToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

export const EducationReadingView: React.FC<EducationReadingViewProps> = ({
  item,
  onBack,
  onEdit,
  onDelete,
  onShowToast,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <h1 className="text-base sm:text-lg font-bold text-primary-theme truncate px-4 max-w-[220px] sm:max-w-md text-center">
          {item.title}
        </h1>

        {/* Action Buttons: Edit Pencil + Three-Dot Menu */}
        <div className="flex items-center gap-1 relative" ref={menuRef}>
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
      </div>

      {/* Main Reading Area */}
      <div 
        className="w-full h-full overflow-y-auto overscroll-contain bg-neutral-50/50 dark:bg-neutral-900 px-4 pt-[76px] pb-12 flex justify-center"
        onScroll={handleScroll}
      >
        {/* Reading Article Body Container */}
        <div className="w-full max-w-3xl bg-gradient-to-br from-blue-500/[0.06] via-surface-card to-surface-card border border-blue-500/15 dark:border-blue-500/20 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 h-max min-h-full">
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
    </motion.div>
  );
};

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  titleFa?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  titleFa,
  children,
  actions,
  id,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          key="dialog-container"
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          id={id} 
          role="dialog" 
          aria-modal="true"
        >
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 bg-slate-900/60"
            onClick={onClose}
          />
          <motion.div
            key="dialog-card"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="relative w-full max-w-md bg-surface-card border border-theme rounded-2xl shadow-xl overflow-hidden p-5 sm:p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme/60 mb-4">
              {titleFa ? (
                <h3 className="text-lg font-bold text-primary-theme">{titleFa}</h3>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-lg transition-theme"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-1 text-sm text-secondary-theme leading-relaxed">
              {children}
            </div>

            {actions && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-theme/60">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


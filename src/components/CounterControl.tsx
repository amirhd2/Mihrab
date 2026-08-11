import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { formatPersianNumber } from '../utils/persianUtils';

interface CounterControlProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetCount?: (count: number) => void;
  min?: number;
  max?: number;
}

export const CounterControl: React.FC<CounterControlProps> = ({
  count,
  onIncrement,
  onDecrement,
  onSetCount,
  min = 0,
  max = Infinity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleIncrementClick = () => {
    if (count >= max) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }
    onIncrement();
  };

  const handleDecrementClick = () => {
    if (count <= min) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (_) {}
    }
    onDecrement();
  };

  const handleCountClick = () => {
    if (!onSetCount) return;
    setEditValue(count.toString());
    setIsEditing(true);
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setEditValue(val);
    }
  };

  const handleCountBlurOrSubmit = () => {
    setIsEditing(false);
    if (editValue !== '' && onSetCount) {
      const newCount = parseInt(editValue, 10);
      if (!isNaN(newCount) && newCount >= min && newCount <= max) {
        onSetCount(newCount);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Minus Button [-] */}
      <button
        type="button"
        onClick={handleDecrementClick}
        disabled={count <= min}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-surface-card hover:bg-surface-elevated active:scale-90 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-secondary-theme transition-all shadow-2xs shrink-0"
      >
        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
      </button>

      {/* Numeric Capsule */}
      <div
        className={`min-w-[64px] sm:min-w-[72px] px-3 py-1.5 sm:py-2 rounded-full bg-surface-card border border-neutral-200/80 dark:border-neutral-800/80 text-center shadow-2xs overflow-hidden flex items-center justify-center ${
          onSetCount ? 'cursor-text' : ''
        }`}
        onClick={handleCountClick}
      >
        {isEditing ? (
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={editValue}
            onChange={handleCountChange}
            onBlur={handleCountBlurOrSubmit}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            className="w-full bg-transparent outline-none text-center font-extrabold text-sm sm:text-base leading-none text-primary-theme p-0 m-0"
            style={{ direction: 'ltr' }}
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={count}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`block font-extrabold text-sm sm:text-base leading-none ${
                count === min
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-primary-theme'
              }`}
            >
              {formatPersianNumber(count)}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      {/* Plus Button [+] */}
      <button
        type="button"
        onClick={handleIncrementClick}
        disabled={count >= max}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-surface-card hover:bg-surface-elevated active:scale-90 flex items-center justify-center text-secondary-theme transition-all shadow-2xs shrink-0 disabled:opacity-30 disabled:pointer-events-none"
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};

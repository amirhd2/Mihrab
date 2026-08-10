import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

interface CounterControlProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labelFa?: string;
  id?: string;
  className?: string;
}

export const CounterControl: React.FC<CounterControlProps> = ({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  labelFa,
  id,
  className = '',
}) => {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <div id={id} className={`flex flex-col gap-1.5 ${className}`}>
      {labelFa && (
        <span className="text-xs font-medium text-secondary-theme">
          {labelFa}
        </span>
      )}
      <div className="inline-flex items-center justify-between gap-3 bg-surface-elevated border border-theme p-1.5 rounded-xl">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="کاهش"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-card text-primary-theme hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-30 disabled:hover:bg-surface-card disabled:hover:text-primary-theme transition-theme active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="min-w-10 text-center font-bold text-lg text-primary-theme font-persian select-none">
          {toPersianDigits(value)}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="افزایش"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-card text-primary-theme hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-30 disabled:hover:bg-surface-card disabled:hover:text-primary-theme transition-theme active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

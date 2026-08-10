import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  labelFa: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (newValue: T) => void;
  className?: string;
  id?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  id,
}: SegmentedControlProps<T>) {
  return (
    <div
      id={id}
      className={`inline-flex p-1 bg-surface-elevated border border-theme/80 rounded-xl gap-1 w-full sm:w-auto ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-theme select-none ${
              isSelected
                ? 'bg-surface-card text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                : 'text-secondary-theme hover:text-primary-theme hover:bg-surface-card/50'
            }`}
          >
            {opt.icon}
            <span>{opt.labelFa}</span>
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholderFa?: string;
  className?: string;
  id?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholderFa = 'جستجو...',
  className = '',
  id,
}) => {
  return (
    <div id={id} className={`relative flex items-center ${className}`}>
      <Search className="absolute right-3.5 w-4 h-4 text-muted-theme pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderFa}
        className="w-full pr-10 pl-9 py-2.5 bg-surface-elevated border border-theme rounded-xl text-sm text-primary-theme placeholder:text-muted-theme focus:outline-none focus:border-emerald-500 transition-theme"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute left-3 p-0.5 text-muted-theme hover:text-primary-theme rounded-md"
          aria-label="پاک کردن"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

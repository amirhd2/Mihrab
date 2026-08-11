import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { EducationContentRecord } from '../../types/db';
import { SwipeToDeleteItem } from '../SwipeToDeleteItem';

interface EducationCardProps {
  item: EducationContentRecord;
  onSelect: (item: EducationContentRecord) => void;
  onDelete: (item: EducationContentRecord) => void;
}

export const EducationCard: React.FC<EducationCardProps> = ({ item, onSelect, onDelete }) => {
  // Truncate text to max 80 characters as requested
  const textSnippet = item.text.length > 80
    ? item.text.slice(0, 80).trim() + '...'
    : item.text;

  return (
    <div className="relative h-[190px] sm:h-[200px] w-full">
      <SwipeToDeleteItem
        id={item.id!}
        onDelete={() => onDelete(item)}
        className="h-full w-full"
      >
        <div
          onClick={() => onSelect(item)}
          className="w-full h-full p-4 sm:p-5 rounded-2xl bg-surface-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          {/* Top Section: Header at Top-Right & 80-char Text Snippet */}
          <div>
            {/* Header (Top Right) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-primary-theme text-right group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 flex-1">
                {item.title}
              </h3>
              <ChevronLeft className="w-4 h-4 text-muted-theme group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
            </div>

            {/* Snippet Preview (Max 80 chars) */}
            <p className="text-xs sm:text-sm text-secondary-theme leading-relaxed text-right line-clamp-3">
              {textSnippet}
            </p>
          </div>

          {/* Footer: Source on Right, Tags on Bottom Left (Left Aligned) */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 mt-auto">
            {/* Right Side: Source */}
            <div className="truncate flex-1 text-right">
              {item.source ? (
                <span className="text-[11px] text-muted-theme font-medium truncate block max-w-[120px]">
                  {item.source}
                </span>
              ) : null}
            </div>

            {/* Left Side: Tags (Bottom Left, Left-Aligned) */}
            <div className="flex items-center justify-end gap-1.5 overflow-hidden" dir="ltr">
              {item.tags && item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {item.tags && item.tags.length > 3 && (
                <span className="text-[10px] text-muted-theme font-medium whitespace-nowrap">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </SwipeToDeleteItem>
    </div>
  );
};

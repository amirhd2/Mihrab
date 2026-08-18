import React from 'react';
import { ChevronLeft, Star } from 'lucide-react';
import { EducationContentRecord } from '../../types/db';
import { SwipeToDeleteItem } from '../SwipeToDeleteItem';

interface EducationCardProps {
  item: EducationContentRecord;
  onSelect: (item: EducationContentRecord) => void;
  onDelete: (item: EducationContentRecord) => void;
}

export const EducationCard: React.FC<EducationCardProps> = ({ item, onSelect, onDelete }) => {
  return (
    <div className="relative h-[190px] sm:h-[200px] w-full">
      <SwipeToDeleteItem
        id={item.id!}
        onDelete={() => onDelete(item)}
        className="h-full w-full"
        cardClassName="bg-gradient-to-br from-blue-500/[0.06] via-surface-card to-surface-card border border-blue-500/15 dark:border-blue-500/20 hover:border-blue-500/35 dark:hover:border-blue-500/40"
      >
        <div
          onClick={() => onSelect(item)}
          className="w-full h-full p-4 sm:p-5 transition-colors duration-200 cursor-pointer group flex flex-col justify-between"
        >
          {/* Top Section: Header at Top-Right & Text Snippet (up to 2 lines) */}
          <div>
            {/* Header (Top Right) */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-primary-theme text-right group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 truncate">
                  {item.title}
                </h3>
                {item.isFavorite && (
                  <Star className="w-4 h-4 text-amber-500 shrink-0 fill-current" />
                )}
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-theme group-hover:text-blue-500 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
            </div>

            {/* Snippet Preview (Up to 2 lines) */}
            <p className="text-xs sm:text-sm text-secondary-theme leading-relaxed text-right line-clamp-2">
              {item.text}
            </p>
          </div>

          {/* Footer: Source on Right, Tags on Bottom Left (Left Aligned) */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-blue-500/10 dark:border-blue-500/15 mt-auto">
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
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap"
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

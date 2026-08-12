import React from 'react';
import { ChevronLeft, Star } from 'lucide-react';
import { DuaRecord } from '../../types/db';
import { SwipeToDeleteItem } from '../SwipeToDeleteItem';

interface DuaCardProps {
  dua: DuaRecord;
  onSelect: (dua: DuaRecord) => void;
  onDelete: (dua: DuaRecord) => void;
}

export const DuaCard: React.FC<DuaCardProps> = ({ dua, onSelect, onDelete }) => {
  // Truncate Arabic text to line 1 limit (~75 chars to fill ~90% of line)
  const arabicSnippet = dua.arabicText.length > 75
    ? dua.arabicText.slice(0, 75).trim() + '...'
    : dua.arabicText;

  // Truncate Persian translation to lines 2&3 limit (~80 chars)
  const persianSnippet = dua.persianTranslation
    ? (dua.persianTranslation.length > 80
        ? dua.persianTranslation.slice(0, 80).trim() + '...'
        : dua.persianTranslation)
    : null;

  return (
    <div className="relative h-[190px] sm:h-[200px] w-full">
      <SwipeToDeleteItem
        id={dua.id!}
        onDelete={() => onDelete(dua)}
        className="h-full w-full"
      >
        <div
          onClick={() => onSelect(dua)}
          className="w-full h-full p-4 sm:p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          {/* Top Section: Header at Top-Right & Text Snippet */}
          <div>
            {/* Header (Top Right) */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-primary-theme text-right group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 truncate">
                  {dua.title}
                </h3>
                {dua.isFavorite && (
                  <Star className="w-4 h-4 text-amber-500 shrink-0 fill-current" />
                )}
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-theme group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
            </div>

            {/* Snippet Preview: Line 1 = Arabic, Lines 2 & 3 = Persian */}
            <div className="space-y-2 sm:space-y-2.5 text-right mt-1.5" dir="rtl">
              <p className="text-base sm:text-lg font-arabic font-semibold text-primary-theme/90 leading-snug line-clamp-1 truncate">
                {arabicSnippet}
              </p>
              {persianSnippet ? (
                <p className="text-[11px] sm:text-xs text-secondary-theme leading-relaxed line-clamp-2">
                  {persianSnippet}
                </p>
              ) : null}
            </div>
          </div>

          {/* Footer: Source on Right, Tags on Bottom Left (Left Aligned) */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 mt-auto">
            {/* Right Side: Source */}
            <div className="truncate flex-1 text-right">
              {dua.source ? (
                <span className="text-[11px] text-muted-theme font-medium truncate block max-w-[120px]">
                  {dua.source}
                </span>
              ) : null}
            </div>

            {/* Left Side: Tags (Bottom Left, Left-Aligned) */}
            <div className="flex items-center justify-end gap-1.5 overflow-hidden" dir="ltr">
              {dua.tags && dua.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {dua.tags && dua.tags.length > 3 && (
                <span className="text-[10px] text-muted-theme font-medium whitespace-nowrap">
                  +{dua.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </SwipeToDeleteItem>
    </div>
  );
};

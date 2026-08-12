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
  // Use Persian translation snippet if available, else fallback to Arabic snippet
  const snippet = dua.persianTranslation || dua.arabicText;
  const textSnippet = snippet.length > 80 ? snippet.slice(0, 80).trim() + '...' : snippet;

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
            <div className="flex items-start justify-between gap-2 mb-2">
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

            {/* Snippet Preview (Max 80 chars) */}
            <p className="text-xs sm:text-sm text-secondary-theme leading-relaxed text-right line-clamp-3">
              {textSnippet}
            </p>
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

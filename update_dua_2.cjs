const fs = require('fs');
let code = fs.readFileSync('src/components/duas/DuaReadingView.tsx', 'utf8');
const target1 = fs.readFileSync('temp_dua_top_bar.txt', 'utf8');

const replace1 = `{/* iOS-Inspired Reading Top Bar */}
      <AnimatePresence initial={false}>
        {showTopBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 w-full overflow-hidden z-20"
          >
            <div className="w-full bg-[#fdfaf5]/95 dark:bg-[#141a24]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت</span>
              </button>

              <h1 className="text-base sm:text-lg font-bold text-primary-theme truncate px-4 max-w-[220px] sm:max-w-md text-center">
                {dua.title}
              </h1>

              <div className="flex items-center gap-1 relative" ref={menuRef}>
                <button
                  onClick={() => onToggleFavorite(dua.id!)}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors dark:hover:bg-amber-500/10 active:scale-95"
                  title="علامت‌گذاری"
                >
                  <Star className="w-5 h-5" fill={dua.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => {
                    onEdit(dua);
                  }}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors active:scale-95"
                  title="ویرایش"
                  aria-label="ویرایش"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-secondary-theme hover:text-primary-theme hover:bg-surface-elevated rounded-xl transition-colors"
                  title="گزینه‌های بیشتر"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* 3-dot Menu */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 w-48 bg-surface-card border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl py-1.5 z-30 overflow-hidden"
                    >
                      <button
                        onClick={handleCopy}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-primary-theme hover:bg-surface-elevated transition-colors"
                      >
                        <Copy className="w-4 h-4 text-secondary-theme" />
                        <span>کپی متن</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-primary-theme hover:bg-surface-elevated transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-secondary-theme" />
                        <span>اشتراک‌گذاری</span>
                      </button>
                      <div className="my-1 border-t border-neutral-200/60 dark:border-neutral-800/60 w-full" />
                      
                      {/* Text Size submenu inside menu */}
                      <div className="px-3 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 mb-1">
                        <div className="text-[10px] text-secondary-theme mb-2 font-medium px-1">اندازه متن:</div>
                        <div className="flex items-center justify-between gap-1">
                          {(['sm', 'base', 'lg', 'xl'] as TextSize[]).map((size) => (
                            <button
                              key={size}
                              onClick={() => { setTextSize(size); setShowMenu(false); }}
                              className={\`p-1.5 rounded-lg flex-1 text-center transition-colors flex justify-center items-center \${
                                textSize === size
                                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500'
                              }\`}
                            >
                              <Type className={size === 'sm' ? 'w-3 h-3' : size === 'base' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => { setShowMenu(false); if (dua.id) onDelete(dua.id); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-right text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

if (code.includes(target1)) {
  code = code.replace(target1, replace1);
  console.log('Replaced top bar successfully');
} else {
  console.log('Failed to find top bar');
}

const target2 = `      {/* Main Reading Area */}
      <div 
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-[#fdfaf5] dark:bg-[#141a24] p-2.5 sm:p-5 md:p-6 flex flex-col"
        onScroll={handleScroll}
      >`;
      
const replace2 = `      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-[#fdfaf5] dark:bg-[#141a24] p-2.5 sm:p-5 md:p-6 flex flex-col"
        onScroll={handleScroll}
      >`;
      
if (code.includes(target2)) {
  code = code.replace(target2, replace2);
  console.log('Replaced scroll container successfully');
} else {
  console.log('Failed to find scroll container');
}

const target3 = `      {/* Bottom Floating Bar removed to match EducationReadingView style */}
    </motion.div>
    </Portal>`;

const replace3 = `      {/* Bottom Floating Bar removed to match EducationReadingView style */}

      {/* Floating Action Button for scrolling to top */}
      <AnimatePresence>
        {!showTopBar && lastScrollY > 200 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-6 left-6 z-40"
          >
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-12 h-12 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white shadow-xl rounded-2xl flex items-center justify-center transition-all active:scale-95"
              aria-label="بازگشت به بالا"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </Portal>`;

if (code.includes(target3)) {
  code = code.replace(target3, replace3);
  console.log('Replaced footer FAB successfully');
} else {
  console.log('Failed to find footer FAB');
}

fs.writeFileSync('src/components/duas/DuaReadingView.tsx', code);

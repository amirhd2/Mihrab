const fs = require('fs');

// 1. DUA READING VIEW
let duaCode = fs.readFileSync('src/components/duas/DuaReadingView.tsx', 'utf8');

// A. Replace Top Bar animation
const duaTargetTopBar = `      {/* iOS-Inspired Reading Top Bar */}
      <AnimatePresence initial={false}>
        {showTopBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 w-full overflow-hidden z-20"
          >
            <div className="w-full bg-[#fdfaf5]/95 dark:bg-[#141a24]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between">`;

const duaReplaceTopBar = `      {/* iOS-Inspired Reading Top Bar */}
      <motion.div
        initial={false}
        animate={{ y: showTopBar ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 z-30 w-full bg-[#fdfaf5]/95 dark:bg-[#141a24]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between"
      >`;

duaCode = duaCode.replace(duaTargetTopBar, duaReplaceTopBar);

const duaTargetTopBarEnd = `                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

const duaReplaceTopBarEnd = `                  )}
                </AnimatePresence>
              </div>
      </motion.div>`;

duaCode = duaCode.replace(duaTargetTopBarEnd, duaReplaceTopBarEnd);

// B. Replace Scroll Container Padding
const duaTargetScroll = `      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-[#fdfaf5] dark:bg-[#141a24] p-2.5 sm:p-5 md:p-6 flex flex-col"
        onScroll={handleScroll}
      >`;

const duaReplaceScroll = `      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overscroll-y-contain bg-[#fdfaf5] dark:bg-[#141a24] p-2.5 pt-20 sm:p-5 sm:pt-24 md:p-6 md:pt-24 flex flex-col"
        onScroll={handleScroll}
      >`;

duaCode = duaCode.replace(duaTargetScroll, duaReplaceScroll);

// C. Replace FAB Rounded
duaCode = duaCode.replace('rounded-2xl flex items-center justify-center', 'rounded-full flex items-center justify-center');
duaCode = duaCode.replace('className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-2xl flex items-center justify-center transition-all active:scale-95"', 'className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full flex items-center justify-center transition-all active:scale-95"');
// just to be safe if the exact string differs:
duaCode = duaCode.replace('rounded-2xl', 'rounded-full');

fs.writeFileSync('src/components/duas/DuaReadingView.tsx', duaCode);
console.log("Dua fixed");

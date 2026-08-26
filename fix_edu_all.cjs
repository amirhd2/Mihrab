const fs = require('fs');

let eduCode = fs.readFileSync('src/components/education/EducationReadingView.tsx', 'utf8');

// A. Replace Top Bar animation
const eduTargetTopBar = `      {/* iOS-Inspired Reading Top Bar */}
      <AnimatePresence initial={false}>
        {showTopBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 w-full overflow-hidden z-20"
          >
            <div className="w-full bg-surface-bg border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between">`;

const eduReplaceTopBar = `      {/* iOS-Inspired Reading Top Bar */}
      <motion.div
        initial={false}
        animate={{ y: showTopBar ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 z-30 w-full bg-surface-bg/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between"
      >`;

eduCode = eduCode.replace(eduTargetTopBar, eduReplaceTopBar);

const eduTargetTopBarEnd = `                  </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

const eduReplaceTopBarEnd = `                  </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>`;

eduCode = eduCode.replace(eduTargetTopBarEnd, eduReplaceTopBarEnd);

// B. Replace Scroll Container Padding
const eduTargetScroll = `      {/* Main Reading Area */}
      <div 
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-neutral-50/50 dark:bg-neutral-900 p-2.5 sm:p-5 md:p-6 flex flex-col"
        onScroll={handleScroll}
      >`;

const eduReplaceScroll = `      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overscroll-y-contain bg-neutral-50/50 dark:bg-neutral-900 p-2.5 pt-20 sm:p-5 sm:pt-24 md:p-6 md:pt-24 flex flex-col"
        onScroll={handleScroll}
      >`;

eduCode = eduCode.replace(eduTargetScroll, eduReplaceScroll);

// C. Replace FAB Rounded
eduCode = eduCode.replace('rounded-2xl flex items-center justify-center transition-all active:scale-95"', 'rounded-full flex items-center justify-center transition-all active:scale-95"');
eduCode = eduCode.replace('className="w-12 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-xl rounded-2xl flex items-center justify-center transition-all active:scale-95"', 'className="w-12 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-xl rounded-full flex items-center justify-center transition-all active:scale-95"');

fs.writeFileSync('src/components/education/EducationReadingView.tsx', eduCode);
console.log("Edu fixed");

import re

# DUA READING VIEW
with open('src/components/duas/DuaReadingView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace 1: Top bar
target1 = r"""      \{/\* iOS-Inspired Reading Top Bar \*/\}
      <div 
        className="shrink-0 w-full bg-\[\#fdfaf5\]/95 dark:bg-\[\#141a24\]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2\.5 flex items-center justify-between z-20"
      >"""
replace1 = """      {/* iOS-Inspired Reading Top Bar */}
      <AnimatePresence initial={false}>
        {showTopBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 w-full overflow-hidden z-20"
          >
            <div className="w-full bg-[#fdfaf5]/95 dark:bg-[#141a24]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between">"""

code = re.sub(target1, replace1, code)

# Close the new div at the end of the top bar
target1_end = r"""          </AnimatePresence>
        </div>
      </div>"""
replace1_end = """          </AnimatePresence>
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>"""

code = re.sub(target1_end, replace1_end, code)

# Add ref to scroll container
target2 = r"""      \{/\* Main Reading Area \*/\}
      <div 
        className="flex-1 w-full overflow-y-auto overscroll-y-contain"""
replace2 = """      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overscroll-y-contain"""

code = re.sub(target2, replace2, code)

# Add FAB at the bottom
target3 = r"""      \{/\* Bottom Floating Bar removed to match EducationReadingView style \*/\}
    </motion\.div>"""
replace3 = """      {/* Bottom Floating Bar removed to match EducationReadingView style */}
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
    </motion.div>"""

code = re.sub(target3, replace3, code)

with open('src/components/duas/DuaReadingView.tsx', 'w', encoding='utf-8') as f:
    f.write(code)


# EDUCATION READING VIEW
with open('src/components/education/EducationReadingView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add ref
code = re.sub(r"const menuRef = useRef<HTMLDivElement>\(null\);", r"const menuRef = useRef<HTMLDivElement>(null);\n  const scrollContainerRef = useRef<HTMLDivElement>(null);", code)

# Add import ChevronUp
code = re.sub(r"Check, Star } from 'lucide-react';", r"Check, Star, ChevronUp } from 'lucide-react';", code)

# Replace 1: Top bar
target1_edu = r"""      \{/\* iOS-Inspired Reading Top Bar \*/\}
      <div 
        className="shrink-0 w-full bg-surface-bg border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-2\.5 flex items-center justify-between z-20"
      >"""
replace1_edu = """      {/* iOS-Inspired Reading Top Bar */}
      <AnimatePresence initial={false}>
        {showTopBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0 w-full overflow-hidden z-20"
          >
            <div className="w-full bg-surface-bg border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between">"""

code = re.sub(target1_edu, replace1_edu, code)

# Close the new div at the end of the top bar
target1_edu_end = r"""          </div>
        </div>
      </div>

      \{/\* Main Reading Area \*/\}"""
replace1_edu_end = """          </div>
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}"""

code = re.sub(target1_edu_end, replace1_edu_end, code)

# Add ref to scroll container
target2_edu = r"""      \{/\* Main Reading Area \*/\}
      <div 
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-surface-bg px-4 py-6 sm:p-6 md:p-8"
        onScroll=\{handleScroll\}
      >"""
replace2_edu = """      {/* Main Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overscroll-y-contain bg-surface-bg px-4 py-6 sm:p-6 md:p-8"
        onScroll={handleScroll}
      >"""

code = re.sub(target2_edu, replace2_edu, code)

# Add FAB at the bottom
target3_edu = r"""          </div>
        </div>
      </div>
    </motion\.div>"""
replace3_edu = """          </div>
        </div>
      </div>
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
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-xl rounded-2xl flex items-center justify-center transition-all active:scale-95"
              aria-label="بازگشت به بالا"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>"""

code = re.sub(target3_edu, replace3_edu, code)

with open('src/components/education/EducationReadingView.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done python script")

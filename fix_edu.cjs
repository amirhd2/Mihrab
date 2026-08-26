const fs = require('fs');
let code = fs.readFileSync('src/components/education/EducationReadingView.tsx', 'utf8');

const t1 = `          </AnimatePresence>
        </div>
      </div>

      {/* Main Reading Area */}`;
const r1 = `          </AnimatePresence>
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reading Area */}`;
code = code.replace(t1, r1);

const t2 = `          {/* Source Citation */}
          {item.source && (
            <div className="pt-6 border-t border-blue-500/10 dark:border-blue-500/15 flex items-center justify-end">
              <p className="text-xs text-secondary-theme font-medium bg-blue-500/[0.05] px-3 py-1.5 rounded-xl border border-blue-500/15 dark:border-blue-500/20">
                منبع: <span className="text-primary-theme font-bold">{item.source}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </Portal>`;

const r2 = `          {/* Source Citation */}
          {item.source && (
            <div className="pt-6 border-t border-blue-500/10 dark:border-blue-500/15 flex items-center justify-end">
              <p className="text-xs text-secondary-theme font-medium bg-blue-500/[0.05] px-3 py-1.5 rounded-xl border border-blue-500/15 dark:border-blue-500/20">
                منبع: <span className="text-primary-theme font-bold">{item.source}</span>
              </p>
            </div>
          )}
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

    </motion.div>
    </Portal>`;

code = code.replace(t2, r2);

fs.writeFileSync('src/components/education/EducationReadingView.tsx', code);

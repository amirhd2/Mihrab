const fs = require('fs');

let eduCode = fs.readFileSync('src/components/education/EducationReadingView.tsx', 'utf8');

const eduTargetTopBarEnd = `              </motion.div>
            )}
          </AnimatePresence>
        </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

const eduReplaceTopBarEnd = `              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>`;

eduCode = eduCode.replace(eduTargetTopBarEnd, eduReplaceTopBarEnd);
fs.writeFileSync('src/components/education/EducationReadingView.tsx', eduCode);
console.log("Edu fixed end");

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const splashArtUrl = './favicon.png';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Total splash sequence duration ~ 1950-2000ms (increased by 1s)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, mediaQuery.matches ? 1000 : 1950);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          id="mihrab-splash-screen"
          role="status"
          aria-label="بارگذاری محراب"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-[#FAF9F5] select-none text-right font-persian"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 24px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
            paddingLeft: 'max(env(safe-area-inset-left), 16px)',
            paddingRight: 'max(env(safe-area-inset-right), 16px)',
          }}
        >
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#08463B]/[0.025] to-transparent pointer-events-none" />

          {/* Top spacer for optical balance */}
          <div className="h-4 sm:h-8" />

          {/* Main Centered Content Group */}
          <div className="flex flex-col items-center justify-center max-w-sm w-full z-10 px-4">
            {/* Stage 2 & 3: Mihrab Arch Artwork & Internal Lantern Glow */}
            <motion.div
              id="splash-artwork-container"
              initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.35, delay: 0.15, ease: 'easeOut' }
              }
              className="relative flex items-center justify-center w-48 sm:w-56 md:w-64 max-w-[70vw] aspect-[553/647] mb-5 sm:mb-6"
            >
              {/* Soft ground pedestal shadow */}
              <div className="absolute -bottom-3 inset-x-10 h-6 bg-[#08463B]/10 rounded-full blur-md" />

              {/* Mihrab Artwork Image */}
              <img
                src={splashArtUrl}
                alt="Mihrab Arch & Lantern"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain relative z-10 drop-shadow-md select-none pointer-events-none"
                draggable={false}
              />

              {/* Stage 3: Soft Warm Internal Lantern Glow (Centered at x: 50%, y: 40.2%) */}
              <motion.div
                id="splash-lantern-glow"
                initial={prefersReducedMotion ? { opacity: 0.8 } : { opacity: 0.15, scale: 0.85 }}
                animate={{ opacity: 0.9, scale: 1 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.1 }
                    : { duration: 0.3, delay: 0.3, ease: 'easeOut' }
                }
                className="absolute z-20 pointer-events-none"
                style={{
                  top: '40.2%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '38%',
                  height: '24%',
                  background:
                    'radial-gradient(ellipse at center, rgba(255, 246, 214, 0.95) 0%, rgba(245, 196, 81, 0.75) 35%, rgba(232, 168, 56, 0.35) 60%, rgba(232, 168, 56, 0) 80%)',
                  filter: 'blur(3px)',
                  mixBlendMode: 'screen',
                }}
              />

              {/* Subtle surrounding ambient niche glow */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0.5 } : { opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.1 }
                    : { duration: 0.3, delay: 0.35, ease: 'easeOut' }
                }
                className="absolute z-15 pointer-events-none"
                style={{
                  top: '40.2%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '65%',
                  height: '45%',
                  background:
                    'radial-gradient(circle at center, rgba(245, 196, 81, 0.3) 0%, rgba(232, 168, 56, 0.12) 50%, rgba(8, 70, 59, 0) 75%)',
                  filter: 'blur(10px)',
                  mixBlendMode: 'screen',
                }}
              />
            </motion.div>

            {/* Stage 4: Persian Title "محراب" */}
            <motion.h1
              id="splash-title"
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.25, delay: 0.45, ease: 'easeOut' }
              }
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-[#08463B] tracking-tight leading-tight select-none mb-2"
            >
              محراب
            </motion.h1>

            {/* Stage 5: Gold Ornamental Divider */}
            <motion.div
              id="splash-divider"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, delay: 0.55, ease: 'easeOut' }
              }
              className="flex items-center justify-center gap-2 w-full max-w-[170px] my-1"
            >
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C8A858]/60 to-[#C8A858]" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[#C8A858] shadow-[0_0_4px_rgba(200,168,88,0.4)]" />
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C8A858]/60 to-[#C8A858]" />
            </motion.div>

            {/* Stage 5: Persian Subtitle "همراه هوشمند عبادات" */}
            <motion.p
              id="splash-subtitle"
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, delay: 0.6, ease: 'easeOut' }
              }
              className="text-xs sm:text-sm md:text-base font-semibold text-[#0B4638]/90 tracking-normal mt-1 text-center"
            >
              همراه هوشمند عبادات
            </motion.p>
          </div>

          {/* Bottom Watermark: Subtle Islamic Geometric / Mandala Arabesque Pattern */}
          <div className="relative w-full flex items-end justify-center pointer-events-none overflow-hidden h-28 sm:h-36">
            <svg
              className="w-56 sm:w-72 md:w-80 h-56 sm:h-72 md:h-80 text-[#08463B] opacity-[0.06] transform translate-y-1/3"
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="90" strokeDasharray="2 3" />
              <circle cx="100" cy="100" r="75" />
              <circle cx="100" cy="100" r="60" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="45" />
              <circle cx="100" cy="100" r="30" />
              <circle cx="100" cy="100" r="15" />
              {/* 12-fold geometric petals */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                return (
                  <g key={i} transform={`rotate(${angle} 100 100)`}>
                    <path d="M100 25 C115 50, 115 80, 100 100 C85 80, 85 50, 100 25 Z" />
                    <path d="M100 40 C110 60, 110 85, 100 100 C90 85, 90 60, 100 40 Z" />
                    <path d="M100 10 L100 100" strokeWidth="0.5" strokeOpacity="0.7" />
                    <circle cx="100" cy="25" r="2.5" />
                    <polygon points="100,55 106,65 100,75 94,65" strokeWidth="0.6" />
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

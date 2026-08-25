import React from 'react';

export const IslamicPatternBg: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Top Mihrab Arch subtle gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-emerald-500/5 via-amber-500/3 to-transparent blur-3xl opacity-60 dark:opacity-40" />

      {/* SVG Islamic 8-Point Star and Geometric Gereh Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.055] text-slate-800 dark:text-amber-100"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="islamic-gereh-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed star base */}
            <path
              d="M40 8 L48 24 L64 16 L56 32 L72 40 L56 48 L64 64 L48 56 L40 72 L32 56 L16 64 L24 48 L8 40 L24 32 L16 16 L32 24 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Inner diamond accents */}
            <polygon
              points="40,22 58,40 40,58 22,40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            <circle cx="40" cy="40" r="6" fill="none" stroke="currentColor" strokeWidth="0.75" />
            {/* Corner connecting geometry */}
            <path d="M0 0 L16 16 M80 0 L64 16 M80 80 L64 64 M0 80 L16 64" stroke="currentColor" strokeWidth="1" />
            <path d="M40 0 L40 8 M80 40 L72 40 M40 80 L40 72 M0 40 L8 40" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-gereh-pattern)" />
      </svg>

      {/* Subtle Arch / Mihrab Line Art at the very top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-24 opacity-[0.06] dark:opacity-[0.09] flex items-start justify-center">
        <svg viewBox="0 0 600 120" className="w-full h-full text-emerald-900 dark:text-emerald-300 fill-none stroke-current" strokeWidth="1.5">
          <path d="M50 120 L50 60 C50 20, 250 5, 300 0 C350 5, 550 20, 550 60 L550 120" />
          <path d="M80 120 L80 65 C80 30, 260 18, 300 15 C340 18, 520 30, 520 65 L520 120" strokeDasharray="3 3" />
        </svg>
      </div>
    </div>
  );
};

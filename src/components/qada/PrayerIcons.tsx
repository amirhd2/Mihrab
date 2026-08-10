import React from 'react';
import { PrayerType } from '../../types/db';

interface PrayerIconProps {
  type: PrayerType;
  className?: string;
}

export const PrayerIcon: React.FC<PrayerIconProps> = ({ type, className = 'w-6 h-6' }) => {
  switch (type) {
    case 'fajr':
      // Morning / Sunrise
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v6" />
          <path d="M4.93 10.93l4.24 4.24" />
          <path d="M2 18h20" />
          <path d="M20 18a8 8 0 0 0-16 0" />
          <path d="M19.07 10.93l-4.24 4.24" />
          <circle cx="12" cy="14" r="3" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );

    case 'dhuhr':
      // Midday Sun
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      );

    case 'asr':
      // Afternoon Sun / Sunset dipping
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 3v2" />
          <path d="M5.64 5.64l1.42 1.42" />
          <path d="M18.36 5.64l-1.42 1.42" />
          <path d="M2 19h20" />
          <path d="M12 15a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
        </svg>
      );

    case 'maghrib':
      // Dusk / Twilight Sunset
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v4" />
          <path d="M2 18h20" />
          <path d="M5 18a7 7 0 0 1 14 0" fill="currentColor" fillOpacity="0.2" />
          <path d="M16 10l2-2" />
          <path d="M8 10L6 8" />
        </svg>
      );

    case 'isha':
      // Crescent Moon & Night Star
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path d="M19 3v3" />
          <path d="M17.5 4.5h3" />
        </svg>
      );

    case 'ayat':
      // Night Sky, Cloud & Moon/Stars
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" fill="currentColor" fillOpacity="0.15" />
          <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z" />
          <path d="M13 3l.3.9L14 4.2l-.9.3L12.8 5.4l-.3-.9L11.6 4.2l.9-.3L13 3z" />
        </svg>
      );

    default:
      return null;
  }
};

/**
 * Styled background container wrapper for prayer icons
 */
export const PrayerIconContainer: React.FC<{ type: PrayerType }> = ({ type }) => {
  const getColors = () => {
    switch (type) {
      case 'fajr':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'dhuhr':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'asr':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'maghrib':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'isha':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'ayat':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${getColors()}`}
    >
      <PrayerIcon type={type} className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
};

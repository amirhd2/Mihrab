import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types/theme';
import { PreferencesService } from '../services/preferencesService';

const STORAGE_KEY = 'mihrab_theme_mode';

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const applyThemeToDOM = useCallback((themeMode: ThemeMode) => {
    const root = document.documentElement;
    let isDark = false;

    if (themeMode === 'dark') {
      isDark = true;
    } else if (themeMode === 'light') {
      isDark = false;
    } else {
      // System mode
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#090d16');
    } else {
      root.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }

    setEffectiveTheme(isDark ? 'dark' : 'light');
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    applyThemeToDOM(newMode);
    PreferencesService.setPreference('themeMode', newMode).catch(() => {});
  }, [applyThemeToDOM]);

  // Handle system color scheme changes when mode is 'system'
  useEffect(() => {
    applyThemeToDOM(mode);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        applyThemeToDOM('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, applyThemeToDOM]);

  return { mode, effectiveTheme, setMode };
}

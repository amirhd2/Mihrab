import { useState, useEffect, useCallback } from 'react';
import { ThemeMode } from '../types/theme';
import { PreferencesService } from '../services/preferencesService';

const STORAGE_KEY = 'mihrab_theme_mode';

const LIGHT_BG_COLOR = '#f8fafc';
const DARK_BG_COLOR = '#090d16';

export function updateStatusBarTheme(isDark: boolean) {
  const color = isDark ? DARK_BG_COLOR : LIGHT_BG_COLOR;

  // 1. Update all meta[name="theme-color"] tags
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length > 0) {
    metas.forEach((meta) => meta.setAttribute('content', color));
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }

  // 2. Update Apple Status Bar Style
  let appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatus) {
    appleStatus = document.createElement('meta');
    appleStatus.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(appleStatus);
  }
  appleStatus.setAttribute('content', isDark ? 'black-translucent' : 'default');
}

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
    } else {
      root.classList.remove('dark');
    }

    updateStatusBarTheme(isDark);
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

export type ThemeMode = 'light' | 'system' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

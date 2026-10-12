export type Theme = 'light' | 'dark';
export type StoredTheme = Theme | null;

export const THEME_STORAGE_KEY = 'bt:theme';

export function resolveInitialTheme(stored: StoredTheme, prefersDark: boolean): Theme {
  if (stored !== null) return stored;
  return prefersDark ? 'dark' : 'light';
}

export function toggleTheme(theme: Theme): Theme {
  return theme === 'light' ? 'dark' : 'light';
}

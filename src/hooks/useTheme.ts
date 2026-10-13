import { useCallback, useEffect, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  toggleTheme as toggleThemeValue,
  type Theme,
} from '../core/theme';

export interface UseTheme {
  theme: Theme;
  toggle: () => void;
}

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function useTheme(): UseTheme {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitialTheme(readStoredTheme(), systemPrefersDark()),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // preferencia no persistida; el tema activo no se pierde
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => toggleThemeValue(current));
  }, []);

  return { theme, toggle };
}

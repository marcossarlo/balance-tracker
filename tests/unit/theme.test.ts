import { describe, expect, it } from 'vitest';
import {
  THEME_STORAGE_KEY,
  resolveInitialTheme,
  toggleTheme,
} from '../../src/core/theme';

describe('resolveInitialTheme', () => {
  it('prefers the stored value over the system preference', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('falls back to prefers-color-scheme when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });
});

describe('toggleTheme', () => {
  it('toggles between light and dark', () => {
    expect(toggleTheme('light')).toBe('dark');
    expect(toggleTheme('dark')).toBe('light');
  });
});

describe('THEME_STORAGE_KEY', () => {
  it('uses the bt:theme key from the contract', () => {
    expect(THEME_STORAGE_KEY).toBe('bt:theme');
  });
});

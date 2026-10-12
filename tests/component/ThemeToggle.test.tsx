// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from '../../src/components/ThemeToggle';

function mockMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
});

afterEach(cleanup);

describe('ThemeToggle', () => {
  it('labels the control "Cambiar a modo oscuro" while in light mode', () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeInTheDocument();
  });

  it('labels the control "Cambiar a modo claro" while in dark mode', () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });

  it('toggles dark mode on click and persists the preference', () => {
    mockMatchMedia(false);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('bt:theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });
});

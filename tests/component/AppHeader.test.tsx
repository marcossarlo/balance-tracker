// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppHeader from '../../src/components/AppHeader';
import { getLocalToday } from '../../src/core/time-entry.repo';
import { addDays } from '../../src/core/weekly-trends';

afterEach(cleanup);

function renderHeader(overrides: Partial<Parameters<typeof AppHeader>[0]> = {}) {
  const props = {
    selectedDate: getLocalToday(),
    onDateChange: vi.fn(),
    onExport: vi.fn().mockResolvedValue({ ok: true }),
    onImport: vi.fn(),
    exporting: false,
    importing: false,
    importSummary: null,
    ...overrides,
  };
  render(<AppHeader {...props} />);
  return props;
}

describe('AppHeader', () => {
  it('shows the bicolor eyebrow pill and app name', () => {
    renderHeader();
    expect(screen.getByText('Balance Tracker')).toBeInTheDocument();
    const pill = document.querySelector('[data-testid="eyebrow-pill"]');
    expect(pill).not.toBeNull();
  });

  it('shows "Hoy" with the long Spanish date when the selected date is today', () => {
    renderHeader();
    expect(screen.getByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    const date = new Date(`${getLocalToday()}T12:00:00`);
    const longDate = new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(date);
    expect(screen.getByText(longDate)).toBeInTheDocument();
  });

  it('shows the long Spanish weekday as title when the selected date is not today', () => {
    renderHeader({ selectedDate: '2020-01-15' });
    const date = new Date('2020-01-15T12:00:00');
    const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(date);
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    expect(screen.getByRole('heading', { name: capitalized })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hoy' })).toBeNull();
  });

  it('renders DayNav and the data transfer controls', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'Día anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar datos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar datos' })).toBeInTheDocument();
  });

  it('renders the themeToggle slot node when provided', () => {
    renderHeader({ themeToggle: <button aria-label="Cambiar tema">tema</button> });
    expect(screen.getByRole('button', { name: 'Cambiar tema' })).toBeInTheDocument();
  });

  it('uses serif font classes for the title', () => {
    renderHeader();
    const heading = screen.getByRole('heading', { name: 'Hoy' });
    expect(heading.className).toContain('font-serif');
  });

  it('navigates days through DayNav', () => {
    const props = renderHeader();
    const today = getLocalToday();
    // today's button is disabled; use "siguiente"
    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(props.onDateChange).toHaveBeenCalledWith(addDays(today, 1));
  });
});

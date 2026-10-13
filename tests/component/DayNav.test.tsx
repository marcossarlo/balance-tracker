// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DayNav from '../../src/components/DayNav';
import { addDays } from '../../src/core/weekly-trends';
import { getLocalToday } from '../../src/core/time-entry.repo';

afterEach(cleanup);

describe('DayNav', () => {
  it('renders accessible day navigation buttons', () => {
    render(<DayNav value={getLocalToday()} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Día anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a hoy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Día siguiente' })).toBeInTheDocument();
  });

  it('emits previous day on "anterior" click', () => {
    const onChange = vi.fn();
    const value = '2026-10-12';
    render(<DayNav value={value} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Día anterior' }));
    expect(onChange).toHaveBeenCalledWith(addDays(value, -1));
  });

  it('emits next day on "siguiente" click', () => {
    const onChange = vi.fn();
    const value = '2026-10-12';
    render(<DayNav value={value} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(onChange).toHaveBeenCalledWith(addDays(value, 1));
  });

  it('disables "Ir a hoy" when the value is already today', () => {
    render(<DayNav value={getLocalToday()} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ir a hoy' })).toBeDisabled();
  });

  it('keeps "Ir a hoy" enabled when the value is not today', () => {
    render(<DayNav value="2020-01-15" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ir a hoy' })).toBeEnabled();
  });

  it('emits today from "Ir a hoy" when enabled', () => {
    const onChange = vi.fn();
    render(<DayNav value="2020-01-15" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir a hoy' }));
    expect(onChange).toHaveBeenCalledWith(getLocalToday());
  });
});

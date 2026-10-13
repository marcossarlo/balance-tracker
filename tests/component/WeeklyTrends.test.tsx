// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WeeklyTrends from '../../src/components/WeeklyTrends';
import type { WeeklyTrendPoint } from '../../src/core/types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: ({ name }: { name?: string }) => <div data-testid={`line-${name}`} />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

afterEach(cleanup);

const POINTS: WeeklyTrendPoint[] = [
  { date: '2026-10-06', label: '06/10', work: 60, learning: 60 },
  { date: '2026-10-07', label: '07/10', work: 90, learning: 30 },
  { date: '2026-10-08', label: '08/10', work: 30, learning: 90 },
  { date: '2026-10-09', label: '09/10', work: 0, learning: 0 },
  { date: '2026-10-10', label: '10/10', work: 0, learning: 0 },
  { date: '2026-10-11', label: '11/10', work: 0, learning: 0 },
  { date: '2026-10-12', label: '12/10', work: 0, learning: 0 },
];

describe('WeeklyTrends', () => {
  it('renders the serif title, description and totals', () => {
    render(<WeeklyTrends points={POINTS} loading={false} />);
    expect(screen.getByRole('heading', { name: 'Balance Semanal' })).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Balance Semanal' });
    expect(heading.className).toContain('font-serif');
    expect(screen.getByRole('group', { name: 'Totales semanales' })).toBeInTheDocument();
    expect(screen.getAllByText(/180 min/)).toHaveLength(2); // work y learning suman 180
  });

  it('renders tablist with Horas and % Crecimiento tabs', () => {
    render(<WeeklyTrends points={POINTS} loading={false} />);
    expect(screen.getByRole('tablist', { name: 'Modo de tendencia' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Horas' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: '% Crecimiento' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('shows two category lines in the hours tab and one growth line after switching', () => {
    render(<WeeklyTrends points={POINTS} loading={false} />);
    expect(screen.getByTestId('line-Trabajo')).toBeInTheDocument();
    expect(screen.getByTestId('line-Aprendizaje')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '% Crecimiento' }));

    expect(screen.getByRole('tab', { name: '% Crecimiento' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('line-Crecimiento')).toBeInTheDocument();
    expect(screen.queryByTestId('line-Trabajo')).toBeNull();
  });

  it('renders the short-line legend for both categories', () => {
    render(<WeeklyTrends points={POINTS} loading={false} />);
    const legend = screen.getByTestId('trends-legend');
    expect(legend.textContent).toContain('Trabajo');
    expect(legend.textContent).toContain('Aprendizaje');
    expect(legend.querySelectorAll('[data-testid="legend-swatch"]')).toHaveLength(2);
  });

  it('shows a loading message while data is loading', () => {
    render(<WeeklyTrends points={[]} loading />);
    expect(screen.getByText('Calculando tendencia…')).toBeInTheDocument();
  });
});

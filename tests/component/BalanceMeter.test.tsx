// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BalanceMeter from '../../src/components/BalanceMeter';

afterEach(cleanup);

describe('BalanceMeter', () => {
  it('exposes meter semantics with learning percent as aria-valuenow', () => {
    render(<BalanceMeter balance={{ work: 90, learning: 30, total: 120 }} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '25');
  });

  it('renders the verdict as a serif heading', () => {
    render(<BalanceMeter balance={{ work: 90, learning: 30, total: 120 }} />);
    const heading = screen.getByRole('heading', {
      name: 'La operación pesa más de la cuenta; recupera tiempo de crecimiento.',
    });
    expect(heading.className).toContain('font-serif');
  });

  it('splits the bar widths according to the ratio with width transition', () => {
    render(<BalanceMeter balance={{ work: 90, learning: 30, total: 120 }} />);
    const workSegment = screen.getByTestId('meter-work');
    const learningSegment = screen.getByTestId('meter-learning');
    expect(workSegment.className).toContain('bg-work');
    expect(workSegment.className).toContain('transition-[width]');
    expect(workSegment.style.width).toBe('75%');
    expect(learningSegment.className).toContain('bg-learning');
    expect(learningSegment.style.width).toBe('25%');
  });

  it('renders the 50% center mark', () => {
    render(<BalanceMeter balance={{ work: 60, learning: 60, total: 120 }} />);
    expect(screen.getByTestId('meter-center-mark')).toBeInTheDocument();
  });

  it('shows both percentages below the bar in category colors', () => {
    render(<BalanceMeter balance={{ work: 90, learning: 30, total: 120 }} />);
    const line = screen.getByTestId('meter-percentages');
    expect(line.textContent).toContain('75%');
    expect(line.textContent).toContain('25%');
    expect(line.textContent).toContain('operación');
    expect(line.textContent).toContain('crecimiento');
  });

  it('renders the empty verdict with a zeroed bar', () => {
    render(<BalanceMeter balance={{ work: 0, learning: 0, total: 0 }} />);
    expect(
      screen.getByText('Aún no hay registros hoy. Empieza cuando quieras.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('meter-work').style.width).toBe('0%');
    expect(screen.getByTestId('meter-learning').style.width).toBe('0%');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
  });
});

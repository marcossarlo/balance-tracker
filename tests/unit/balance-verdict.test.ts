import { describe, expect, it } from 'vitest';
import { computeBalanceVerdict } from '../../src/core/balance-verdict';

describe('computeBalanceVerdict', () => {
  it('returns empty tone with zero percentages when there are no records', () => {
    const verdict = computeBalanceVerdict({ work: 0, learning: 0, total: 0 });
    expect(verdict.tone).toBe('empty');
    expect(verdict.workPercent).toBe(0);
    expect(verdict.learningPercent).toBe(0);
    expect(verdict.message).toBe('Aún no hay registros hoy. Empieza cuando quieras.');
  });

  it('returns balanced at a 50/50 split', () => {
    const verdict = computeBalanceVerdict({ work: 60, learning: 60, total: 120 });
    expect(verdict.tone).toBe('balanced');
    expect(verdict.workPercent).toBe(50);
    expect(verdict.learningPercent).toBe(50);
    expect(verdict.message).toBe(
      'Equilibrio saludable entre operación y crecimiento.',
    );
  });

  it('returns work-heavy at a 75/25 split', () => {
    const verdict = computeBalanceVerdict({ work: 90, learning: 30, total: 120 });
    expect(verdict.tone).toBe('work-heavy');
    expect(verdict.workPercent).toBe(75);
    expect(verdict.learningPercent).toBe(25);
    expect(verdict.message).toBe(
      'La operación pesa más de la cuenta; recupera tiempo de crecimiento.',
    );
  });

  it('returns work-extreme at an 88/12 split', () => {
    const verdict = computeBalanceVerdict({ work: 105, learning: 15, total: 120 });
    expect(verdict.tone).toBe('work-extreme');
    expect(verdict.workPercent).toBe(88);
    expect(verdict.learningPercent).toBe(12);
    expect(verdict.message).toBe(
      'Lo urgente está canibalizando tu tiempo de desarrollo.',
    );
  });

  it('returns learning-heavy at a 25/75 split', () => {
    const verdict = computeBalanceVerdict({ work: 30, learning: 90, total: 120 });
    expect(verdict.tone).toBe('learning-heavy');
    expect(verdict.workPercent).toBe(25);
    expect(verdict.learningPercent).toBe(75);
    expect(verdict.message).toBe(
      'El crecimiento avanza; revisa que la operación no se frene.',
    );
  });

  it('returns learning-extreme at a 13/87 split (Math.round of 12.5)', () => {
    const verdict = computeBalanceVerdict({ work: 15, learning: 105, total: 120 });
    expect(verdict.tone).toBe('learning-extreme');
    expect(verdict.workPercent).toBe(13);
    expect(verdict.learningPercent).toBe(87);
    expect(verdict.message).toBe(
      'El crecimiento domina el día; la operación queda en pausa.',
    );
  });

  it('returns work-extreme at a 100/0 split', () => {
    const verdict = computeBalanceVerdict({ work: 1, learning: 0, total: 1 });
    expect(verdict.tone).toBe('work-extreme');
    expect(verdict.workPercent).toBe(100);
    expect(verdict.learningPercent).toBe(0);
  });

  it('keeps percentages summing to 100 for non-zero totals', () => {
    const verdict = computeBalanceVerdict({ work: 7, learning: 5, total: 12 });
    expect(verdict.workPercent + verdict.learningPercent).toBe(100);
  });
});

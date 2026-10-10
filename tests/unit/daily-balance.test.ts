import { describe, expect, it } from 'vitest';
import { computeDailyBalance } from '../../src/core/daily-balance';
import type { TimeEntry } from '../../src/core/types';

function entry(partial: Partial<TimeEntry>): TimeEntry {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    category: 'WORK',
    description: 'x',
    timeValue: 15,
    date: '2026-10-08',
    timestampCreation: 0,
    ...partial,
  };
}

describe('computeDailyBalance (pure)', () => {
  it('returns zeros for an empty list', () => {
    expect(computeDailyBalance([], '2026-10-08')).toEqual({ work: 0, learning: 0, total: 0 });
  });

  it('sums timeValue by category', () => {
    const balance = computeDailyBalance(
      [
        entry({ id: '1', category: 'WORK', timeValue: 120 }),
        entry({ id: '2', category: 'WORK', timeValue: 60 }),
        entry({ id: '3', category: 'LEARNING', timeValue: 30 }),
      ],
      '2026-10-08',
    );
    expect(balance).toEqual({ work: 180, learning: 30, total: 210 });
  });

  it('handles a single entry of one category', () => {
    expect(
      computeDailyBalance([entry({ category: 'LEARNING', timeValue: 240 })], '2026-10-08'),
    ).toEqual({
      work: 0,
      learning: 240,
      total: 240,
    });
  });

  it('ignores entries from other dates', () => {
    const balance = computeDailyBalance(
      [
        entry({ id: '1', date: '2026-10-08', timeValue: 60 }),
        entry({ id: '2', date: '2026-10-09', timeValue: 180 }),
      ],
      '2026-10-08',
    );
    expect(balance).toEqual({ work: 60, learning: 0, total: 60 });
  });
});

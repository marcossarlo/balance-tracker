import { describe, expect, it } from 'vitest';
import { buildWeekDates, computeWeeklyTrends } from '../../src/core/weekly-trends';
import type { TimeEntry } from '../../src/core/types';

const WEEK = [
  '2026-10-02',
  '2026-10-03',
  '2026-10-04',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
];

function entry(partial: Partial<TimeEntry> & { id: string }): TimeEntry {
  return {
    category: 'WORK',
    description: 'x',
    timeValue: 15,
    date: '2026-10-08',
    timestampCreation: 0,
    ...partial,
  };
}

describe('computeWeeklyTrends (pure)', () => {
  it('always returns exactly 7 points in chronological order with zeros for empty days', () => {
    const points = computeWeeklyTrends([], WEEK);
    expect(points).toHaveLength(7);
    expect(points.map((p) => p.date)).toEqual(WEEK);
    for (const point of points) {
      expect(point).toEqual({ date: point.date, label: point.label, work: 0, learning: 0 });
    }
  });

  it('aggregates sums per day and category', () => {
    const points = computeWeeklyTrends(
      [
        entry({ id: '1', date: '2026-10-06', category: 'WORK', timeValue: 120 }),
        entry({ id: '2', date: '2026-10-06', category: 'WORK', timeValue: 60 }),
        entry({ id: '3', date: '2026-10-08', category: 'LEARNING', timeValue: 30 }),
      ],
      WEEK,
    );
    expect(points[4]).toMatchObject({ date: '2026-10-06', work: 180, learning: 0 });
    expect(points[6]).toMatchObject({ date: '2026-10-08', work: 0, learning: 30 });
    expect(points[0].work + points[0].learning).toBe(0);
  });

  it('formats labels as dd/mm', () => {
    const points = computeWeeklyTrends([], WEEK);
    expect(points[0].label).toBe('02/10');
    expect(points[6].label).toBe('08/10');
  });

  it('ignores entries outside the week window', () => {
    const points = computeWeeklyTrends(
      [entry({ id: '1', date: '2026-09-30', timeValue: 240 })],
      WEEK,
    );
    for (const point of points) {
      expect(point.work).toBe(0);
      expect(point.learning).toBe(0);
    }
  });
});

describe('buildWeekDates (pure)', () => {
  it('returns 7 dates ending at endDate', () => {
    expect(buildWeekDates('2026-10-08')).toEqual(WEEK);
  });

  it('handles month and year boundaries', () => {
    expect(buildWeekDates('2026-01-02')).toEqual([
      '2025-12-27',
      '2025-12-28',
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ]);
    expect(buildWeekDates('2027-01-01')).toEqual([
      '2026-12-26',
      '2026-12-27',
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
    ]);
  });
});

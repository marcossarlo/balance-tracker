// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/core/db';
import { getLocalToday } from '../../src/core/time-entry.repo';
import { addDays } from '../../src/core/weekly-trends';
import { useDailyBalance } from '../../src/hooks/useDailyBalance';
import { useWeeklyTrends } from '../../src/hooks/useWeeklyTrends';
import type { TimeEntry } from '../../src/core/types';

function entry(id: string, date: string, timeValue: number, category: 'WORK' | 'LEARNING'): TimeEntry {
  return {
    id,
    category,
    description: 'fixture',
    timeValue: timeValue as TimeEntry['timeValue'],
    date,
    timestampCreation: 0,
  };
}

const YESTERDAY = addDays(getLocalToday(), -1);

beforeEach(async () => {
  await db.timeEntries.clear();
  await db.timeEntries.bulkPut([
    entry('today-work', getLocalToday(), 120, 'WORK'),
    entry('yesterday-learning', YESTERDAY, 30, 'LEARNING'),
  ]);
});

afterEach(async () => {
  await db.timeEntries.clear();
  cleanup();
});

describe('useDailyBalance date-change re-query (Edge Case 6)', () => {
  it('recalculates when its date prop changes', async () => {
    const { result, rerender } = renderHook(({ date }) => useDailyBalance(date), {
      initialProps: { date: getLocalToday() },
    });

    await waitFor(() => {
      expect(result.current.balance).toEqual({ work: 120, learning: 0, total: 120 });
    });

    rerender({ date: YESTERDAY });

    await waitFor(() => {
      expect(result.current.balance).toEqual({ work: 0, learning: 30, total: 30 });
    });
  });
});

describe('useWeeklyTrends window anchoring (FR-005)', () => {
  it('defaults to a window ending today (independent of any selected day)', async () => {
    const { result } = renderHook(() => useWeeklyTrends());

    await waitFor(() => {
      expect(result.current.points).toHaveLength(7);
    });
    expect(result.current.points[6].date).toBe(getLocalToday());
    expect(result.current.points[6].work).toBe(120);
    expect(result.current.points.find((p) => p.date === YESTERDAY)).toMatchObject({
      learning: 30,
    });
  });
});

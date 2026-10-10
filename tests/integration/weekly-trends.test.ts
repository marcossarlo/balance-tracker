import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getWeeklyTrends, listEntriesByRange } from '../../src/core/time-entry.repo';
import { db } from '../../src/core/db';
import type { TimeEntry } from '../../src/core/types';

async function putEntry(partial: Partial<TimeEntry> & { id: string }): Promise<void> {
  await db.timeEntries.put({
    category: 'WORK',
    description: 'fixture',
    timeValue: 15,
    date: '2026-01-01',
    timestampCreation: 0,
    ...partial,
  });
}

describe('listEntriesByRange + getWeeklyTrends (integration, date index)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('listEntriesByRange returns inclusive start/end range only', async () => {
    await putEntry({ id: 'a', date: '2026-10-05' });
    await putEntry({ id: 'b', date: '2026-10-07' });
    await putEntry({ id: 'c', date: '2026-10-08' });
    await putEntry({ id: 'd', date: '2026-10-09' });

    const ranged = await listEntriesByRange('2026-10-06', '2026-10-08');
    expect(ranged.map((e) => e.id).sort()).toEqual(['b', 'c']);
  });

  it('getWeeklyTrends returns exactly 7 points with correct sums', async () => {
    await putEntry({ id: 'a', date: '2026-10-06', category: 'WORK', timeValue: 120 });
    await putEntry({ id: 'b', date: '2026-10-07', category: 'LEARNING', timeValue: 30 });
    await putEntry({ id: 'c', date: '2026-10-20', category: 'WORK', timeValue: 240 });

    const points = await getWeeklyTrends('2026-10-08');
    expect(points).toHaveLength(7);
    expect(points[0].date).toBe('2026-10-02');
    expect(points[6]).toMatchObject({ date: '2026-10-08', work: 0, learning: 0 });
    expect(points.find((p) => p.date === '2026-10-06')).toMatchObject({
      work: 120,
      learning: 0,
    });
    expect(points.find((p) => p.date === '2026-10-07')).toMatchObject({
      work: 0,
      learning: 30,
    });
    expect(points.every((p) => p.date !== '2026-10-20')).toBe(true);
  });

  it('getWeeklyTrends with no data still returns 7 zero points', async () => {
    const points = await getWeeklyTrends('2026-10-08');
    expect(points).toHaveLength(7);
    expect(points.every((p) => p.work === 0 && p.learning === 0)).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDailyBalance, createTimeEntry } from '../../src/core/time-entry.repo';
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

describe('getDailyBalance (integration, date index)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('returns zeros when the day has no entries', async () => {
    expect(await getDailyBalance('2026-10-08')).toEqual({ work: 0, learning: 0, total: 0 });
  });

  it('aggregates only the target day across scattered days (uses date index)', async () => {
    await putEntry({ id: 'a', date: '2026-10-06', timeValue: 240 });
    await putEntry({ id: 'b', date: '2026-10-08', category: 'WORK', timeValue: 120 });
    await putEntry({ id: 'c', date: '2026-10-08', category: 'WORK', timeValue: 60 });
    await putEntry({ id: 'd', date: '2026-10-08', category: 'LEARNING', timeValue: 30 });
    await putEntry({ id: 'e', date: '2026-10-10', timeValue: 15 });

    expect(await getDailyBalance('2026-10-08')).toEqual({
      work: 180,
      learning: 30,
      total: 210,
    });
  });

  it('matches sums of entries created through createTimeEntry', async () => {
    await createTimeEntry({ category: 'WORK', description: 'hoy 1', timeValue: 60 });
    await createTimeEntry({ category: 'LEARNING', description: 'hoy 2', timeValue: 30 });

    const balance = await getDailyBalance((await db.timeEntries.toArray())[0].date);
    expect(balance).toEqual({ work: 60, learning: 30, total: 90 });
  });
});

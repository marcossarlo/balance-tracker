import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTimeEntry, deleteTimeEntry, listEntriesByDate } from '../../src/core/time-entry.repo';
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

describe('deleteTimeEntry (integration)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('removes the record so subsequent queries exclude it', async () => {
    await putEntry({ id: 'keep', date: '2026-10-08', timeValue: 60 });
    await putEntry({ id: 'drop', date: '2026-10-08', timeValue: 30 });

    await deleteTimeEntry('drop');

    const remaining = await listEntriesByDate('2026-10-08');
    expect(remaining.map((e) => e.id)).toEqual(['keep']);
    expect(await db.timeEntries.get('drop')).toBeUndefined();
  });

  it('is idempotent: deleting a nonexistent id resolves without error', async () => {
    await expect(deleteTimeEntry('does-not-exist')).resolves.toBeUndefined();
  });

  it('does not affect entries on other days', async () => {
    await putEntry({ id: 'today', date: '2026-10-08' });
    await putEntry({ id: 'other', date: '2026-10-07' });

    await deleteTimeEntry('today');

    expect(await db.timeEntries.get('today')).toBeUndefined();
    expect(await db.timeEntries.get('other')).toBeDefined();
  });

  it('aggregated balance reflects deletion (recalculation path)', async () => {
    const entry = await createTimeEntry({
      category: 'WORK',
      description: 'a borrar',
      timeValue: 120,
    });
    await createTimeEntry({ category: 'LEARNING', description: 'quedar', timeValue: 30 });

    await deleteTimeEntry(entry.id);

    const remaining = await listEntriesByDate(entry.date);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].category).toBe('LEARNING');
  });
});

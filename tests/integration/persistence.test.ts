import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BalanceTrackerDB } from '../../src/core/db';
import { createTimeEntry, listEntriesByDate } from '../../src/core/time-entry.repo';

async function withReopenedDb<T>(fn: (db: BalanceTrackerDB) => Promise<T>): Promise<T> {
  const db = new BalanceTrackerDB();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

describe('persistence across DB reopens (same name, new instance)', () => {
  beforeEach(async () => {
    await withReopenedDb((db) => db.timeEntries.clear());
  });

  afterEach(async () => {
    await withReopenedDb((db) => db.timeEntries.clear());
  });

  it('keeps entries after closing and reopening the database', async () => {
    const created = await createTimeEntry({
      category: 'WORK',
      description: 'sobrevive al cierre',
      timeValue: 60,
    });

    const afterReopen = await withReopenedDb((db) => db.timeEntries.get(created.id));

    expect(afterReopen).toEqual(created);
  });

  it('repo queries still work after reopen (date index intact)', async () => {
    const created = await createTimeEntry({
      category: 'LEARNING',
      description: 'tras reopen',
      timeValue: 30,
    });

    await withReopenedDb(() => Promise.resolve());

    const entries = await listEntriesByDate(created.date);
    expect(entries.map((e) => e.id)).toContain(created.id);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearTestDb, createTestDb } from '../helpers/db';
import type { BalanceTrackerDB } from '../../src/core/db';
import type { TimeEntry } from '../../src/core/types';

const sampleEntry: TimeEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  category: 'WORK',
  description: 'Escribir especificacion',
  timeValue: 60,
  date: '2026-10-08',
  timestampCreation: 1791500000000,
};

describe('BalanceTrackerDB schema (fake-indexeddb, real index)', () => {
  let testDb: BalanceTrackerDB;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(async () => {
    await clearTestDb(testDb);
    testDb.close();
  });

  it('persists and retrieves an entry by id (PK &id)', async () => {
    await testDb.timeEntries.put(sampleEntry);
    const found = await testDb.timeEntries.get(sampleEntry.id);
    expect(found).toEqual(sampleEntry);
  });

  it('queries by the date index', async () => {
    await testDb.timeEntries.put(sampleEntry);
    await testDb.timeEntries.put({
      ...sampleEntry,
      id: '22222222-2222-4222-8222-222222222222',
      date: '2026-10-09',
    });

    const dayEntries = await testDb.timeEntries.where('date').equals('2026-10-08').toArray();
    expect(dayEntries).toHaveLength(1);
    expect(dayEntries[0].id).toBe(sampleEntry.id);
  });

  it('queries the compound [date+category] index', async () => {
    await testDb.timeEntries.put(sampleEntry);
    await testDb.timeEntries.put({
      ...sampleEntry,
      id: '33333333-3333-4333-8333-333333333333',
      category: 'LEARNING',
    });

    const workEntries = await testDb.timeEntries
      .where('[date+category]')
      .equals(['2026-10-08', 'WORK'])
      .toArray();
    expect(workEntries).toHaveLength(1);
    expect(workEntries[0].category).toBe('WORK');
  });
});

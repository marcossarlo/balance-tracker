import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportAllEntries, importBackupEntries } from '../../src/core/backup.repo';
import { db } from '../../src/core/db';
import { RepositoryError } from '../../src/core/errors';
import type { TimeEntry } from '../../src/core/types';

function entry(id: string, overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id,
    category: 'WORK',
    description: 'Trabajo de prueba',
    timeValue: 60,
    date: '2026-10-10',
    timestampCreation: 1760000000000,
    ...overrides,
  };
}

const EXISTING_A = entry('d0000000-0000-4000-8000-000000000001');
const NEW_B = entry('d0000000-0000-4000-8000-000000000002');
const NEW_C = entry('d0000000-0000-4000-8000-000000000003', {
  category: 'LEARNING',
  timeValue: 30,
  date: '2026-10-08',
});

describe('importBackupEntries (integration, fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('adds only new ids and reports skipped duplicates', async () => {
    await db.timeEntries.add(EXISTING_A);

    const result = await importBackupEntries([EXISTING_A, NEW_B, NEW_C]);

    expect(result).toEqual({ added: 2, skipped: 1 });
    const all = await db.timeEntries.toArray();
    expect(all).toHaveLength(3);
    expect(all).toEqual(expect.arrayContaining([EXISTING_A, NEW_B, NEW_C]));
  });

  it('never modifies or deletes existing rows (identity preserved)', async () => {
    await db.timeEntries.add(EXISTING_A);
    const mutated: TimeEntry = { ...EXISTING_A, description: 'MODIFICADA', timeValue: 240 };

    const result = await importBackupEntries([mutated, NEW_B]);

    expect(result).toEqual({ added: 1, skipped: 1 });
    const stored = await db.timeEntries.get(EXISTING_A.id);
    expect(stored).toEqual(EXISTING_A);
  });

  it('aborts atomically when any entry is invalid, leaving the DB unchanged', async () => {
    await db.timeEntries.add(EXISTING_A);
    const invalid = { ...NEW_B, timeValue: 45 } as unknown as TimeEntry;

    await expect(importBackupEntries([NEW_C, invalid])).rejects.toThrow(RepositoryError);

    const all = await db.timeEntries.toArray();
    expect(all).toEqual([EXISTING_A]);
  });

  it('importing the same file twice adds nothing the second time', async () => {
    const fileEntries = [EXISTING_A, NEW_B, NEW_C];

    const first = await importBackupEntries(fileEntries);
    const second = await importBackupEntries(fileEntries);

    expect(first).toEqual({ added: 3, skipped: 0 });
    expect(second).toEqual({ added: 0, skipped: 3 });
    expect(await db.timeEntries.count()).toBe(3);
  });

  it('round-trips through export → import with zero changes', async () => {
    await db.timeEntries.bulkAdd([EXISTING_A, NEW_B]);

    const text = await exportAllEntries();
    const backup = JSON.parse(text) as { entries: TimeEntry[] };
    const result = await importBackupEntries(backup.entries);

    expect(result).toEqual({ added: 0, skipped: 2 });
    expect(await db.timeEntries.toArray()).toEqual([EXISTING_A, NEW_B]);
  });
});

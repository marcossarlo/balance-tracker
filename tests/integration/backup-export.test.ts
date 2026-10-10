import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportAllEntries } from '../../src/core/backup.repo';
import { db } from '../../src/core/db';
import type { TimeEntry } from '../../src/core/types';

const SAMPLE: TimeEntry[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    category: 'WORK',
    description: 'Reunion de planificacion',
    timeValue: 120,
    date: '2026-10-01',
    timestampCreation: 1759300000000,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    category: 'LEARNING',
    description: 'Curso de TypeScript',
    timeValue: 180,
    date: '2026-10-05',
    timestampCreation: 1759600000000,
  },
];

describe('exportAllEntries (integration, fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('exports every stored entry across scattered dates as valid backup JSON', async () => {
    await db.timeEntries.bulkAdd(SAMPLE);

    const text = await exportAllEntries();
    const parsed = JSON.parse(text) as Record<string, unknown>;

    expect(parsed.app).toBe('balance-tracker');
    expect(parsed.version).toBe(1);
    expect(typeof parsed.exportedAt).toBe('number');
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries).toEqual(expect.arrayContaining(SAMPLE));
  });

  it('exports a valid file with entries: [] when the DB is empty', async () => {
    const text = await exportAllEntries();
    const parsed = JSON.parse(text) as { entries: unknown[] };
    expect(parsed.entries).toEqual([]);
  });
});
